import { useEffect, useState } from 'react'
import { Bus, CircleAlert, LocateFixed, Radio } from 'lucide-react'
import './LiveBusLocation.css'

const vehicleId = 'BUS-104'

function LiveBusLocation() {
  const [location, setLocation] = useState(null)
  const [serviceStatus, setServiceStatus] = useState('connecting')
  const [lastCheckedAt, setLastCheckedAt] = useState(0)

  useEffect(() => {
    let active = true
    let socket
    let interval
    let reconnectTimer
    let connectTimer

    const refreshLocation = async () => {
      try {
        const response = await fetch(`/api/location?vehicleId=${vehicleId}`)
        if (!response.ok) throw new Error('The tracking service did not return a location.')
        const result = await response.json()
        if (active) {
          setLocation(result.location)
          setServiceStatus('connected')
          setLastCheckedAt(Date.now())
        }
      } catch {
        if (active) {
          setServiceStatus('offline')
          setLocation(null)
        }
      }
    }

    const connect = () => {
      if (!active) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
      socket.addEventListener('open', () => {
        window.clearTimeout(reconnectTimer)
        if (active) {
          setServiceStatus('connected')
          refreshLocation()
        }
      })
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          if (!active) return
          if (message.type === 'location' && message.location?.vehicleId === vehicleId) {
            setLocation(message.location)
            setLastCheckedAt(Date.now())
            setServiceStatus('connected')
          } else if (message.type === 'stopped' && message.vehicleId === vehicleId) {
            setLocation(null)
            setLastCheckedAt(Date.now())
          }
        } catch {
          if (active) setServiceStatus('offline')
        }
      })
      socket.addEventListener('error', () => {
        if (active) setServiceStatus('offline')
      })
      socket.addEventListener('close', () => {
        if (!active) return
        setServiceStatus('offline')
        reconnectTimer = window.setTimeout(connect, 3000)
      })
    }

    refreshLocation()
    interval = window.setInterval(() => setLastCheckedAt(Date.now()), 2000)
    connectTimer = window.setTimeout(connect, 100)

    return () => {
      active = false
      window.clearInterval(interval)
      window.clearTimeout(connectTimer)
      window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [])

  const isFresh = location && lastCheckedAt - location.receivedAtMs < 30000
  const updatedAt = location ? new Date(location.recordedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : null

  return (
    <div className="live-location-card">
      <div className="live-location-visual">
        <div className="location-grid" />
        <span className="location-road location-road-one" />
        <span className="location-road location-road-two" />
        <span className={`location-beacon ${isFresh ? 'beacon-live' : ''}`}>
          <Bus size={19} />
        </span>
        <span className="location-coordinate-label">
          <LocateFixed size={13} />
          {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Awaiting GPS coordinates'}
        </span>
      </div>
      <div className="live-location-status">
        <span className={`location-status-dot ${isFresh ? 'status-connected' : serviceStatus === 'offline' ? 'status-offline' : ''}`} />
        <span className="live-location-message">
          {isFresh
            ? `Bus location received at ${updatedAt}`
            : serviceStatus === 'offline'
              ? 'Start the local tracking service to receive GPS'
              : location
                ? 'Last location is over 30 seconds old'
                : 'No live location yet'}
        </span>
        <span className="live-location-accuracy">
          {location ? `±${Math.round(location.accuracy)} m` : <Radio size={13} />}
        </span>
      </div>
      {serviceStatus === 'offline' && (
        <div className="location-service-note"><CircleAlert size={14} /> Open a second terminal and run <code>npm run tracking</code>.</div>
      )}
    </div>
  )
}

export default LiveBusLocation
