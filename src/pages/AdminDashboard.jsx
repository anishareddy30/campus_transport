import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Download,
  MapPin,
  Menu,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import LiveBusLocation from '../components/LiveBusLocation.jsx'
import './AdminDashboard.css'

const initialTrips = [
  { route: 'North Campus', code: 'R-04', vehicle: 'BUS-104', driver: 'Maya Patel', departure: '8:15 AM', status: 'On time', tone: 'green' },
  { route: 'City Center', code: 'R-12', vehicle: 'BUS-208', driver: 'Jordan Lee', departure: '8:30 AM', status: 'On time', tone: 'green' },
  { route: 'West Apartments', code: 'R-08', vehicle: 'BUS-116', driver: 'Sam Rivera', departure: '8:45 AM', status: 'Delayed 5 min', tone: 'amber' },
  { route: 'East Village', code: 'R-02', vehicle: 'BUS-103', driver: 'Taylor Kim', departure: '9:00 AM', status: 'On time', tone: 'green' },
]

const initialAlerts = [
  { title: 'Route 08 running 5 minutes late', detail: 'Traffic near Oak Street · 2 min ago', icon: Clock3, tone: 'amber' },
  { title: 'BUS-112 needs a maintenance check', detail: 'Scheduled inspection · 18 min ago', icon: Wrench, tone: 'blue' },
  { title: 'Stop temporarily moved', detail: 'Science Hall stop · 42 min ago', icon: MapPin, tone: 'violet' },
]

function AdminDashboard({ onSwitchToStudent }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [trips, setTrips] = useState(initialTrips)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [addTripOpen, setAddTripOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [routeName, setRouteName] = useState('North Campus')
  const [vehicle, setVehicle] = useState('BUS-120')
  const [departure, setDeparture] = useState('10:00')

  const visibleTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return trips.filter((trip) => {
      const matchesQuery = !normalizedQuery || `${trip.route} ${trip.code} ${trip.vehicle} ${trip.driver}`.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'All statuses' || trip.status.startsWith(statusFilter)
      return matchesQuery && matchesStatus
    })
  }, [query, statusFilter, trips])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const exportTrips = () => {
    const columns = ['Route', 'Route code', 'Vehicle', 'Driver', 'Departure', 'Status']
    const rows = trips.map((trip) => [trip.route, trip.code, trip.vehicle, trip.driver, trip.departure, trip.status])
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.href = downloadUrl
    link.download = 'campus-transport-trips.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    showToast('Trip report downloaded.')
  }

  const addTrip = (event) => {
    event.preventDefault()
    const time = new Date(`2000-01-01T${departure}:00`).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
    const newTrip = {
      route: routeName,
      code: routeName === 'North Campus' ? 'R-04' : routeName === 'City Center' ? 'R-12' : routeName === 'West Apartments' ? 'R-08' : 'R-02',
      vehicle: vehicle.trim().toUpperCase(),
      driver: 'Unassigned',
      departure: time,
      status: 'Scheduled',
      tone: 'blue',
    }
    setTrips((currentTrips) => [...currentTrips, newTrip])
    setAddTripOpen(false)
    showToast(`${newTrip.code} trip added to today’s schedule.`)
  }

  const dismissAlert = (title) => {
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.title !== title))
    showToast('Alert dismissed.')
  }

  const closeNav = () => setMobileNavOpen(false)
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="admin-shell">
      {mobileNavOpen && <button className="admin-nav-backdrop" aria-label="Close admin menu" onClick={closeNav} />}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'admin-sidebar-open' : ''}`}>
        <a className="admin-brand" href="#admin-overview" onClick={closeNav}>
          <span className="admin-brand-mark"><Bus size={21} /></span>
          <span>move<span> campus</span></span>
        </a>
        <div className="admin-org"><span className="org-avatar">U</span><span><strong>University Campus</strong><small>Transport operations</small></span><ChevronDown size={14} /></div>
        <div className="admin-nav-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="admin-nav-link admin-nav-active" href="#admin-overview" onClick={closeNav}><Activity size={17} />Overview</a>
          <a className="admin-nav-link" href="#fleet" onClick={closeNav}><Bus size={17} />Fleet <span>16</span></a>
          <a className="admin-nav-link" href="#schedule" onClick={closeNav}><CalendarDays size={17} />Schedule</a>
          <a className="admin-nav-link" href="#alerts" onClick={closeNav}><CircleAlert size={17} />Alerts {alerts.length > 0 && <span className="admin-alert-count">{alerts.length}</span>}</a>
        </nav>
        <div className="admin-nav-label admin-reports-label">MANAGEMENT</div>
        <nav className="admin-nav" aria-label="Management navigation">
          <button className="admin-nav-link" onClick={exportTrips}><Download size={17} />Reports</button>
          <button className="admin-nav-link" onClick={() => showToast('Route management is coming soon.')}><Route size={17} />Routes</button>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-status-card"><span className="admin-status-light" /><span><strong>All systems operational</strong><small>Last synced just now</small></span></div>
          <button className="admin-user" onClick={onSwitchToStudent}>
            <span className="admin-user-avatar">AJ</span>
            <span><strong>Anisha Jain</strong><small>Switch to student view</small></span>
            <ArrowRight size={15} />
          </button>
        </div>
      </aside>

      <main className="admin-main" id="admin-overview">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" aria-label="Open admin menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="admin-breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="admin-top-actions">
            <label className="admin-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trips, vehicles..." aria-label="Search trips and vehicles" /></label>
            <button className="admin-bell" aria-label={`${alerts.length} alerts`} onClick={() => document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth' })}><Bell size={18} />{alerts.length > 0 && <i />}</button>
            <div className="admin-date"><CalendarDays size={15} />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div><p className="admin-eyebrow">TRANSPORT OPERATIONS · LIVE OVERVIEW</p><h1>{greeting}, Anisha</h1><p>Here’s the latest across your campus transport network.</p></div>
            <div className="admin-welcome-actions">
              <button className="admin-secondary-button" onClick={exportTrips}><Download size={16} /> Export report</button>
              <button className="admin-primary-button" onClick={() => setAddTripOpen(true)}><Plus size={17} /> Add a trip</button>
            </div>
          </section>

          <section className="admin-metrics" aria-label="Today’s transport metrics">
            <article className="admin-metric-card"><span className="metric-icon metric-blue"><Bus size={19} /></span><span className="metric-label">Buses on route</span><div className="metric-number">12 <small>/ 16</small></div><div className="metric-foot"><span className="metric-positive"><ArrowUpRight size={13} /> 2</span> more than yesterday</div></article>
            <article className="admin-metric-card"><span className="metric-icon metric-purple"><Users size={19} /></span><span className="metric-label">Riders today</span><div className="metric-number">1,284</div><div className="metric-foot"><span className="metric-positive"><ArrowUpRight size={13} /> 8.4%</span> vs. last Thursday</div></article>
            <article className="admin-metric-card"><span className="metric-icon metric-green"><ShieldCheck size={19} /></span><span className="metric-label">On-time performance</span><div className="metric-number">94.8<span className="metric-percent">%</span></div><div className="metric-foot"><span className="metric-positive">↑ 2.1%</span> this month</div></article>
            <article className="admin-metric-card"><span className="metric-icon metric-orange"><CircleAlert size={19} /></span><span className="metric-label">Needs attention</span><div className="metric-number">{alerts.length.toString().padStart(2, '0')} <small>alerts</small></div><div className="metric-foot"><button className="metric-action" onClick={() => document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth' })}>Review alerts <ArrowRight size={13} /></button></div></article>
          </section>

          <section className="admin-main-grid">
            <article className="admin-panel admin-trips-panel" id="schedule">
              <div className="admin-panel-header">
                <div><p className="admin-eyebrow">TODAY · CAMPUS SERVICE</p><h2>Upcoming trips</h2></div>
                <label className="admin-filter"><span className="sr-only">Filter trips by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>On time</option><option>Delayed</option><option>Scheduled</option></select><ChevronDown size={14} /></label>
              </div>
              <div className="admin-table-wrap">
                <table className="trips-table">
                  <thead><tr><th>ROUTE</th><th>VEHICLE & DRIVER</th><th>DEPARTURE</th><th>STATUS</th><th><span className="sr-only">Trip action</span></th></tr></thead>
                  <tbody>
                    {visibleTrips.map((trip, index) => (
                      <tr key={`${trip.vehicle}-${trip.departure}-${index}`}>
                        <td><span className="table-route-name">{trip.route}</span><small className="table-route-code">{trip.code}</small></td>
                        <td><span className="table-vehicle">{trip.vehicle}</span><small className="table-driver">{trip.driver}</small></td>
                        <td className="table-departure">{trip.departure}</td>
                        <td><span className={`trip-status status-${trip.tone}`}><i />{trip.status}</span></td>
                        <td><button className="trip-more" aria-label={`View ${trip.code} details`} onClick={() => showToast(`${trip.code} · ${trip.vehicle} · ${trip.status}`)}>···</button></td>
                      </tr>
                    ))}
                    {!visibleTrips.length && <tr><td className="admin-empty" colSpan="5">No trips match your search and status filter.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing {visibleTrips.length} of {trips.length} trips</span><button onClick={() => showToast('You’re viewing the complete trip schedule.')}>View schedule <ArrowRight size={14} /></button></div>
            </article>

            <article className="admin-panel fleet-panel" id="fleet">
              <div className="admin-panel-header"><div><p className="admin-eyebrow">FLEET STATUS</p><h2>Live fleet</h2></div><button className="live-pill"><i /> Live</button></div>
              <LiveBusLocation />
              <a className="fleet-map-link" href="/driver">Open driver GPS <ArrowRight size={14} /></a>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-panel service-panel">
              <div className="admin-panel-header"><div><p className="admin-eyebrow">NETWORK HEALTH</p><h2>Service at a glance</h2></div><button className="period-button">Today <ChevronDown size={13} /></button></div>
              <div className="service-chart" aria-label="Hourly campus ridership chart">
                <div className="chart-y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div>
                <div className="chart-plot">
                  <div className="chart-gridline line-1" /><div className="chart-gridline line-2" /><div className="chart-gridline line-3" />
                  <div className="chart-bars">{[36, 51, 42, 75, 58, 89, 70, 56, 76, 48, 62, 40].map((height, index) => <span className={`chart-bar ${index === 5 ? 'chart-bar-highlight' : ''}`} style={{ height: `${height}%` }} key={index} />)}</div>
                  <div className="chart-x-labels"><span>7 AM</span><span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span><span>5 PM</span></div>
                </div>
              </div>
              <div className="chart-summary"><span><i /> Riders per hour</span><strong>Peak: 268 riders <small>· 11 AM</small></strong></div>
            </article>
            <article className="admin-panel alerts-panel" id="alerts">
              <div className="admin-panel-header"><div><p className="admin-eyebrow">KEEP AN EYE ON</p><h2>Recent alerts <span className="alerts-number">{alerts.length}</span></h2></div><button className="alerts-link" onClick={() => showToast('You’re viewing current service alerts.')}>View all <ArrowRight size={14} /></button></div>
              {alerts.length ? <div className="alerts-list">{alerts.map(({ title, detail, icon: Icon, tone }) => (
                <div className="alert-row" key={title}>
                  <span className={`alert-icon alert-${tone}`}><Icon size={16} /></span><span className="alert-copy"><strong>{title}</strong><small>{detail}</small></span>
                  <button className="alert-dismiss" aria-label={`Dismiss ${title}`} onClick={() => dismissAlert(title)}><X size={15} /></button>
                </div>
              ))}</div> : <div className="no-alerts"><span><Check size={17} /></span><strong>All clear</strong><small>No active service alerts.</small></div>}
            </article>
          </section>
          <footer className="admin-footer"><span>© {now.getFullYear()} Move Campus · Operations dashboard</span><span><i /> Demo data · not connected to live vehicles</span></footer>
        </div>
      </main>

      {addTripOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setAddTripOpen(false)}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-trip-title" onClick={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" aria-label="Close add trip dialog" onClick={() => setAddTripOpen(false)}><X size={18} /></button>
            <span className="modal-icon"><Plus size={19} /></span>
            <p className="admin-eyebrow">SCHEDULE MANAGEMENT</p><h2 id="add-trip-title">Add a trip</h2><p className="admin-modal-description">Add a departure to today’s campus schedule.</p>
            <form onSubmit={addTrip}>
              <label>Route<select value={routeName} onChange={(event) => setRouteName(event.target.value)}><option>North Campus</option><option>City Center</option><option>West Apartments</option><option>East Village</option></select></label>
              <label>Vehicle ID<input required pattern=".*\S.*" title="Enter a vehicle ID with at least one non-space character." value={vehicle} onChange={(event) => setVehicle(event.target.value)} maxLength="12" /></label>
              <label>Departure time<input required type="time" value={departure} onChange={(event) => setDeparture(event.target.value)} /></label>
              <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={() => setAddTripOpen(false)}>Cancel</button><button type="submit" className="admin-primary-button"><Plus size={15} /> Add trip</button></div>
            </form>
          </section>
        </div>
      )}
      {toast && <div className="admin-toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  )
}

export default AdminDashboard
