import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bus, Check, CircleAlert, LocateFixed, MapPin, Radio, ShieldCheck, Square } from 'lucide-react'
import './DriverTracker.css'

const vehicleId = 'BUS-104'
const updateIntervalMs = 5000

function DriverTracker() {
  const [serviceOnline, setServiceOnline] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const watchId = useRef(null)
  const lastSentAt = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error('Local tracking service is unavailable.')
        return response.json()
      })
      .then(() => {
        if (mounted.current) setServiceOnline(true)
      })
      .catch(() => {
        if (mounted.current) setServiceOnline(false)
      })

    return () => {
      mounted.current = false
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        fetch(`/api/location?vehicleId=${vehicleId}`, { method: 'DELETE', keepalive: true })
          .catch((cleanupError) => console.error('Could not clear the local demo location:', cleanupError))
      }
    }
  }, [])

  const sendPosition = async (position) => {
    const now = Date.now()
    if (now - lastSentAt.current < updateIntervalMs) return
    lastSentAt.current = now

    const gpsLocation = {
      vehicleId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
      speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
    }

    try {
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpsLocation),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send this GPS update.')
      if (mounted.current) {
        setLocation(result.location)
        setError('')
      }
    } catch (sendError) {
      if (mounted.current) setError(sendError.message)
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('This browser does not support GPS location.')
      return
    }

    setError('')
    setTracking(true)
    lastSentAt.current = 0
    watchId.current = navigator.geolocation.watchPosition(
      sendPosition,
      (gpsError) => {
        setError(`${gpsError.message} Check the browser location permission and try again.`)
        if (gpsError.code === gpsError.PERMISSION_DENIED && watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
          setTracking(false)
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    )
  }

  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setTracking(false)
    try {
      const response = await fetch(`/api/location?vehicleId=${vehicleId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not stop the tracking session.')
      setLocation(null)
      setError('')
    } catch (stopError) {
      setError(stopError.message)
    }
  }

  const updatedAt = location ? new Date(location.recordedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : null

  return (
    <main className="driver-page">
      <header className="driver-header">
        <a href="/" className="driver-back"><ArrowLeft size={17} /> Back to dashboard</a>
        <span className="driver-local-pill"><ShieldCheck size={14} /> Local demo only</span>
      </header>
      <section className="driver-content">
        <div className="driver-title-block">
          <span className="driver-brand-icon"><Bus size={22} /></span>
          <p className="driver-eyebrow">CAMPUS TRANSPORT · DRIVER TOOL</p>
          <h1>Share bus location</h1>
          <p>Send this bus’s latest GPS position to the dashboard on this computer.</p>
        </div>

        <section className="driver-card" aria-label="GPS tracking controls">
          <div className="driver-trip-summary">
            <span className="driver-bus-icon"><Bus size={18} /></span>
            <span><strong>BUS-104</strong><small>North Campus · Route R-04</small></span>
            <span className={`driver-trip-state ${tracking ? 'driver-state-live' : ''}`}><i />{tracking ? 'Sharing' : 'Stopped'}</span>
          </div>

          <div className={`driver-location-readout ${location ? 'has-location' : ''}`}>
            <span className="driver-location-symbol"><MapPin size={20} /></span>
            <div>
              <strong>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Waiting for GPS location'}</strong>
              <small>{location ? `Accuracy ±${Math.round(location.accuracy)} m · updated ${updatedAt}` : 'Your location is shared only while tracking is on.'}</small>
            </div>
          </div>

          {!serviceOnline && <div className="driver-error"><CircleAlert size={16} /><span>Local tracking service is offline. In a second terminal, run <code>npm run tracking</code>, then refresh this page.</span></div>}
          {error && <div className="driver-error"><CircleAlert size={16} /><span>{error}</span></div>}

          <div className="driver-controls">
            {!tracking
              ? <button className="driver-start-button" disabled={!serviceOnline} onClick={startTracking}><LocateFixed size={17} /> Start GPS sharing</button>
              : <button className="driver-stop-button" onClick={stopTracking}><Square size={15} fill="currentColor" /> Stop sharing</button>}
          </div>
          <div className="driver-explainer"><Radio size={15} /><span>GPS updates are sent about every 5 seconds. Only the latest position is kept in memory; stopping clears it.</span></div>
        </section>

        <section className="driver-checklist">
          <p className="driver-eyebrow">BEFORE YOU START</p>
          <div><Check size={15} /><span>Allow location access when your browser asks.</span></div>
          <div><Check size={15} /><span>Use this demo on the same computer as the dashboard.</span></div>
          <div><Check size={15} /><span>Keep the page open during the test; stop sharing when done.</span></div>
        </section>
        <p className="driver-disclaimer">This prototype is limited to your own computer. Do not use it to track real buses or drivers yet.</p>
      </section>
    </main>
  )
}

export default DriverTracker
