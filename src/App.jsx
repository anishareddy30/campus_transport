import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  Bell,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Ticket,
  X,
} from 'lucide-react'
import LiveBusLocation from './components/LiveBusLocation.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import DriverTracker from './pages/DriverTracker.jsx'
import './App.css'

const routes = [
  { name: 'North Campus', code: 'R-04', time: '8:15 AM', stop: 'Maple Residence', color: 'blue' },
  { name: 'City Center', code: 'R-12', time: '8:30 AM', stop: 'Main Library', color: 'violet' },
  { name: 'West Apartments', code: 'R-08', time: '9:00 AM', stop: 'Oak Street', color: 'orange' },
]

const announcements = [
  { title: 'Route 04 is on time', detail: 'Your bus is 6 minutes away at Maple Residence.', time: '2 min ago' },
  { title: 'Pass renewed successfully', detail: 'Your monthly student pass is valid through May 31.', time: 'Yesterday' },
]

function App() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [toast, setToast] = useState('')
  const [adminMode, setAdminMode] = useState(false)

  const visibleRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return routes
    return routes.filter((route) =>
      `${route.name} ${route.code} ${route.stop}`.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const closeNav = () => setMobileNavOpen(false)

  if (window.location.pathname === '/driver') {
    return <DriverTracker />
  }

  if (adminMode) {
    return <AdminDashboard onSwitchToStudent={() => setAdminMode(false)} />
  }

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="nav-backdrop" aria-label="Close menu" onClick={closeNav} />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={closeNav}>
          <span className="brand-mark"><Bus size={22} strokeWidth={2.3} /></span>
          <span className="brand-name">move<span> campus</span></span>
        </a>

        <div className="sidebar-label">MENU</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview" onClick={closeNav}><span><Bus size={18} />Overview</span></a>
          <a className="nav-link" href="#routes" onClick={closeNav}><span><MapPin size={18} />Routes & stops</span><span className="nav-count">8</span></a>
          <a className="nav-link" href="#passes" onClick={closeNav}><span><Ticket size={18} />My passes</span></a>
          <a className="nav-link" href="#payments" onClick={closeNav}><span><CreditCard size={18} />Payments</span></a>
        </nav>

        <div className="sidebar-label support-label">SUPPORT</div>
        <nav className="side-nav" aria-label="Support navigation">
          <a className="nav-link" href="#support" onClick={closeNav}><span><CircleHelp size={18} />Help center</span></a>
          <a className="nav-link" href="/driver" onClick={closeNav}><span><MapPin size={18} />Driver demo</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={18} /></div>
            <strong>Need a hand?</strong>
            <p>Our campus team is here to help.</p>
            <a href="#support">Get support <ArrowRight size={14} /></a>
          </div>
          <button className="profile-button" onClick={() => setAdminMode(true)} aria-label="Switch to admin demo dashboard">
            <span className="avatar">AJ</span>
            <span className="profile-copy"><strong>Anisha Kolpuke</strong><small>Admin demo</small></span>
            <ChevronDown size={16} className="profile-chevron" />
          </button>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb">Campus transport <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search routes or stops"
                aria-label="Search routes or stops"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  document.getElementById('routes')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }}
              />
              <kbd>⌘ K</kbd>
            </label>
            <div className="notification-wrap">
              <button
                className={`icon-button notification-button ${notificationsOpen ? 'is-open' : ''}`}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={19} /><span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading"><strong>Notifications</strong><span>2 new</span></div>
                  {announcements.map((item) => (
                    <div className="notification-item" key={item.title}>
                      <span className="notification-icon"><Bus size={16} /></span>
                      <div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <div className="today-date"><CalendarDays size={16} />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long' }).format(now).toUpperCase()}, YOUR CAMPUS IS IN MOTION</p>
              <h1>{greeting}, Anisha <span className="wave">✦</span></h1>
              <p className="welcome-subtitle">Here’s what’s happening with your campus commute today.</p>
            </div>
            <button className="primary-button" onClick={() => showToast('Trip planner is ready for your next ride.')}>
              <MapPin size={17} /> Plan a trip
            </button>
          </section>

          <section className="stats-grid" aria-label="Transport summary">
            <article className="stat-card">
              <div className="stat-icon mint"><Bus size={19} /></div>
              <div className="stat-top"><span>Trips this month</span><span className="stat-trend"><ArrowDownLeft size={13} /> 12%</span></div>
              <div className="stat-value">24 <span>rides</span></div>
              <div className="stat-foot">vs. 21 last month</div>
            </article>
            <article className="stat-card">
              <div className="stat-icon lavender"><Clock3 size={19} /></div>
              <div className="stat-top"><span>Time saved</span><span className="stat-trend">↗ 8%</span></div>
              <div className="stat-value">6.5 <span>hours</span></div>
              <div className="stat-foot">by choosing campus transit</div>
            </article>
            <article className="stat-card">
              <div className="stat-icon peach"><ShieldCheck size={19} /></div>
              <div className="stat-top"><span>Active pass</span><span className="pass-status"><span /> Active</span></div>
              <div className="stat-value pass-value">Student monthly</div>
              <div className="stat-foot">Renews monthly</div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel next-trip-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">YOUR NEXT RIDE</p><h2>Upcoming trip</h2></div>
                <button className="text-button" onClick={() => showToast('You’re viewing all your upcoming trips.')}>View all <ArrowRight size={15} /></button>
              </div>
              <div className="trip-card">
                <div className="trip-route-head">
                  <span className="route-badge"><Bus size={17} /> Route 04</span>
                  <span className="live-status"><span /> On time</span>
                </div>
                <div className="trip-timeline">
                  <div className="time-column"><strong>8:15</strong><small>AM</small></div>
                  <div className="timeline-track"><span className="timeline-dot start-dot" /><span className="timeline-line" /><span className="timeline-dot end-dot" /></div>
                  <div className="trip-stops">
                    <div><strong>Maple Residence</strong><small>Your pickup stop</small></div>
                    <div><strong>University Main Gate</strong><small>Estimated arrival · 8:32 AM</small></div>
                  </div>
                </div>
                <div className="trip-card-footer">
                  <span><Clock3 size={15} /> 6 min away</span>
                  <button className="outline-button" onClick={() => setSelectedRoute(routes[0])}>Track bus <ArrowRight size={15} /></button>
                </div>
              </div>
            </article>

            <article className="panel pass-panel" id="passes">
              <div className="panel-heading">
                <div><p className="eyebrow">RIDE WITH EASE</p><h2>Your campus pass</h2></div>
                <span className="pass-mini-icon"><Ticket size={18} /></span>
              </div>
              <div className="pass-card">
                <div className="pass-card-top"><span>STUDENT TRANSIT</span><span className="pass-chip">ACTIVE</span></div>
                <strong>Monthly Pass</strong>
                <p>Unlimited rides across all campus routes.</p>
                <div className="pass-card-bottom"><span>YOUR PLAN</span><strong>Monthly · Auto-renew</strong><span className="pass-ornament">✳</span></div>
              </div>
              <button className="manage-pass" onClick={() => showToast('Your student monthly pass is active.')}>Manage pass <ArrowRight size={15} /></button>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel routes-panel" id="routes">
              <div className="panel-heading">
                <div><p className="eyebrow">GET WHERE YOU’RE GOING</p><h2>Popular routes</h2></div>
                <button className="text-button" onClick={() => showToast('All campus routes are shown here.')}>All routes <ArrowRight size={15} /></button>
              </div>
              <div className="routes-list">
                {visibleRoutes.length ? visibleRoutes.map((route) => (
                  <button className="route-row" key={route.code} onClick={() => setSelectedRoute(route)}>
                    <span className={`route-icon ${route.color}`}><Bus size={17} /></span>
                    <span className="route-copy"><strong>{route.name}</strong><small>{route.code} <span>·</span> Next stop: {route.stop}</small></span>
                    <span className="route-time"><strong>{route.time}</strong><small>Next departure</small></span>
                    <ArrowRight className="route-arrow" size={16} />
                  </button>
                )) : <p className="empty-routes">No routes found. Try a different stop or route name.</p>}
              </div>
            </article>

            <article className="panel map-panel">
              <div className="panel-heading map-heading">
                <div><p className="eyebrow">LOCAL GPS DEMO</p><h2>Bus location · BUS-104</h2></div>
                <span className="map-live"><span /> Latest only</span>
              </div>
              <LiveBusLocation />
              <div className="map-footer"><span><i className="map-legend-dot" /> Tracking demo runs on this computer</span><a href="/driver">Open driver GPS <ArrowRight size={14} /></a></div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel activity-panel" id="payments">
              <div className="panel-heading">
                <div><p className="eyebrow">YOUR ACCOUNT</p><h2>Recent activity</h2></div>
                <button className="text-button" onClick={() => showToast('Showing your recent account activity.')}>See all <ArrowRight size={15} /></button>
              </div>
              <div className="activity-row">
                <span className="activity-icon paid"><Check size={16} /></span>
                <span className="activity-copy"><strong>Monthly pass renewed</strong><small>This week · Student pass</small></span>
                <strong className="activity-amount">$24.00</strong>
              </div>
              <div className="activity-row">
                <span className="activity-icon ride"><Bus size={16} /></span>
                <span className="activity-copy"><strong>Trip completed · Route 12</strong><small>Yesterday · City Center</small></span>
                <strong className="activity-free">Pass</strong>
              </div>
            </article>
            <article className="support-banner" id="support">
              <div className="support-banner-icon"><CircleHelp size={20} /></div>
              <div><p className="eyebrow">WE’RE HERE FOR YOU</p><h2>Questions about your ride?</h2><p>Find quick answers or talk to our campus transport team.</p><button onClick={() => showToast('Support options are ready to explore.')}>Visit help center <ArrowRight size={15} /></button></div>
            </article>
          </section>
          <footer className="page-footer"><span>© {now.getFullYear()} Move Campus</span><span>Making campus commutes easier <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>

      {selectedRoute && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedRoute(null)}>
          <section className="route-modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close route details" onClick={() => setSelectedRoute(null)}><X size={19} /></button>
            <span className={`route-icon modal-route-icon ${selectedRoute.color}`}><Bus size={20} /></span>
            <p className="eyebrow">CAMPUS ROUTE · {selectedRoute.code}</p>
            <h2 id="route-modal-title">{selectedRoute.name}</h2>
            <p className="modal-description">Next departure at <strong>{selectedRoute.time}</strong> from {selectedRoute.stop}.</p>
            <div className="modal-info"><span><Clock3 size={16} /> About 17 min to campus</span><span><MapPin size={16} /> 5 stops along this route</span></div>
            <button className="primary-button modal-action" onClick={() => { showToast(`You’ll be notified when ${selectedRoute.code} is nearby.`); setSelectedRoute(null) }}>Notify me when nearby <Bell size={16} /></button>
          </section>
        </div>
      )}
      {toast && <div className="toast-message" role="status"><Check size={17} />{toast}</div>}
    </div>
  )
}

export default App
