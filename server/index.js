import { Buffer } from 'node:buffer'
import process from 'node:process'
import { createServer } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'

const host = '127.0.0.1'
const port = Number(process.env.TRACKING_PORT || 3001)
const latestLocations = new Map()
const clients = new Set()
const maxBodyBytes = 2048
const minUpdateIntervalMs = 1000

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin)
    const portNumber = Number(url.port)
    return url.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(url.hostname)
      && portNumber >= 5173
      && portNumber <= 5199
  } catch {
    return false
  }
}

function isValidLocation(value) {
  return value
    && typeof value === 'object'
    && typeof value.vehicleId === 'string'
    && /^[A-Z0-9-]{1,12}$/.test(value.vehicleId)
    && Number.isFinite(value.latitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && Number.isFinite(value.longitude)
    && value.longitude >= -180
    && value.longitude <= 180
    && Number.isFinite(value.accuracy)
    && value.accuracy >= 0
    && value.accuracy <= 10000
    && (value.heading == null || (Number.isFinite(value.heading) && value.heading >= 0 && value.heading < 360))
    && (value.speed == null || (Number.isFinite(value.speed) && value.speed >= 0 && value.speed <= 100))
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

function broadcast(value) {
  const message = JSON.stringify(value)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message)
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin
  if (origin && !isAllowedOrigin(origin)) {
    sendJson(response, 403, { error: 'This local demo only accepts requests from its Vite app.' })
    return
  }

  const url = new URL(request.url || '/', `http://${host}:${port}`)
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, mode: 'local-demo' })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/location') {
    const vehicleId = url.searchParams.get('vehicleId') || 'BUS-104'
    const location = latestLocations.get(vehicleId)
    sendJson(response, 200, { location: location || null })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/location') {
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      sendJson(response, 415, { error: 'Send the location as application/json.' })
      return
    }

    let body = ''
    try {
      for await (const chunk of request) {
        body += chunk
        if (Buffer.byteLength(body) > maxBodyBytes) {
          request.destroy()
          return
        }
      }
    } catch (error) {
      if (!response.destroyed) sendJson(response, 400, { error: `Could not read the location update: ${error.message}` })
      return
    }

    let update
    try {
      update = JSON.parse(body)
    } catch {
      sendJson(response, 400, { error: 'Location update must contain valid JSON.' })
      return
    }

    if (!isValidLocation(update)) {
      sendJson(response, 400, { error: 'Location update has invalid coordinates or GPS values.' })
      return
    }

    const previous = latestLocations.get(update.vehicleId)
    const now = Date.now()
    if (previous && now - previous.receivedAtMs < minUpdateIntervalMs) {
      sendJson(response, 429, { error: 'Location updates are limited to one per second.' })
      return
    }

    const location = {
      vehicleId: update.vehicleId,
      latitude: update.latitude,
      longitude: update.longitude,
      accuracy: update.accuracy,
      heading: update.heading ?? null,
      speed: update.speed ?? null,
      recordedAt: new Date(now).toISOString(),
      receivedAtMs: now,
    }
    latestLocations.set(location.vehicleId, location)
    broadcast({ type: 'location', location })
    sendJson(response, 202, { location })
    return
  }

  if (request.method === 'DELETE' && url.pathname === '/api/location') {
    const vehicleId = url.searchParams.get('vehicleId') || 'BUS-104'
    latestLocations.delete(vehicleId)
    broadcast({ type: 'stopped', vehicleId })
    sendJson(response, 200, { stopped: true })
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
})

const websocketServer = new WebSocketServer({ noServer: true })
websocketServer.on('connection', (socket) => {
  clients.add(socket)
  for (const location of latestLocations.values()) {
    socket.send(JSON.stringify({ type: 'location', location }))
  }
  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin
  if (!origin || !isAllowedOrigin(origin) || request.url !== '/ws') {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
    socket.destroy()
    return
  }
  websocketServer.handleUpgrade(request, socket, head, (websocket) => {
    websocketServer.emit('connection', websocket, request)
  })
})

server.listen(port, host, () => {
  console.log(`Local GPS demo service listening at http://${host}:${port}`)
})

server.on('error', (error) => {
  console.error('Local GPS demo service failed:', error.message)
  process.exitCode = 1
})
