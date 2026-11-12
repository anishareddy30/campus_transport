# Campus Bus Location Tracking Plan

## Goal

Replace the dashboard's illustrative map and sample bus status with a real-time view of buses on campus routes.

## Current prototype status

The local-only first slice is implemented:

- A driver page requests browser GPS permission and sends updates about every five seconds.
- A Node.js service validates updates, keeps only the latest location in memory, and broadcasts over WebSockets.
- Student and admin dashboards display the latest coordinate, accuracy, and received time, including service-offline and stale-location states.
- The service binds to `127.0.0.1`; there is no campus sign-in, persistent storage, route map, ETA, or production access control.
- Run `npm run tracking` and `npm run dev` in separate terminals. See [README.md](./README.md).

This is only a same-computer prototype. Do not use it to track real vehicles or drivers.

## Android background tracking prototype

A separate Expo Android app now requests driver consent, Android notification/location permissions, and starts a location foreground service with an ongoing notification. A top-level background task saves the latest coordinate on the phone and the app restores its sharing state when reopened.

This proves only the on-device background collection flow. It does not publish to the web dashboard or a cloud backend, has no sign-in/device assignment, and is not for real vehicles. Use `driver-android/` and the setup instructions in [README.md](./README.md) to build it on an Android device.

## Next phase: secure remote sharing

### Recommended architecture

- **Driver app:** Extend the Expo Android prototype in `driver-android/` using `expo-location` and `expo-task-manager`. The existing React/Vite website remains the student and operations dashboard; it is not the driver background-tracking runtime.
- **Android behavior:** The driver explicitly starts an assigned trip. While it is active, use Android's location foreground service with a persistent notification that explains location is being shared. The driver can stop sharing from the app. Do not start tracking silently.
- **Backend:** Deploy the Node.js API and WebSocket service to an HTTPS/WSS cloud host. The current service binds to localhost and cannot receive a phone's updates over the internet.
- **Storage:** Keep one latest location per active vehicle in Redis or another short-lived online store, with a short expiry. Do not create a location-history database for the first pilot.
- **Access:** Require sign-in and authorize each update against the driver's assigned vehicle/trip. Require signed-in campus users for viewing; until campus identity is selected and implemented, keep the service private to the pilot team.
- **Location feed:** Send vehicle ID, trip ID, coordinates, accuracy, heading/speed when available, and recorded timestamp. Validate device assignment, coordinate ranges, timestamp freshness/order, update frequency, and payload size on the server.

The app can continue receiving location while backgrounded if the driver has granted the required permission and Android allows its foreground service to run. The app must show an ongoing system notification. Battery-saving policies can delay or interrupt updates; if the driver force-stops the app, revokes permission, disables location, or the device loses power/connectivity, tracking stops or becomes stale. Show the last update time and never label an old position as live.

### Build phases

1. **Confirm pilot prerequisites**
   - Choose the campus sign-in provider and who can view live buses.
   - Confirm Android phone models/OS versions, driver workflow, route/vehicle assignments, and whether the organization can publish/install a private Android app.
   - Set a short location expiry and a written retention/driver-notice policy.
   - **Complete when:** an approved pilot scope and test devices are known.

2. **Harden the Android driver app**
   - Add campus sign-in, server-issued driver identity, and assigned vehicle/trip selection.
   - Keep explicit Start/Stop controls, permission explanation, and current GPS accuracy/status.
   - Test background location with the Android foreground-service notification on supported physical devices; Expo Go is not sufficient.
   - **Complete when:** an authenticated test phone reports its assigned vehicle while backgrounded and shows a clear sharing notification.

3. **Prepare the online location service**
   - Deploy the Node.js service behind HTTPS/WSS and restrict it to the pilot environment.
   - Add campus authentication and server-side driver/viewer roles before accepting real driver updates.
   - Bind each authenticated driver session to an assigned vehicle and active trip; do not trust a client-supplied vehicle ID by itself.
   - Keep only the newest location, enforce expiry, validate update timestamps/coordinates, rate-limit requests, and log operational errors without storing precise location history.
   - **Complete when:** an authenticated test phone can publish and an authorized dashboard can subscribe from a different network.

4. **Connect the dashboards**
   - Replace localhost URLs with environment-specific service configuration; never put server secrets in the browser bundle.
   - Subscribe by route/vehicle, show marker and last-update time, and clearly distinguish connecting, live, stale, and offline states.
   - Add approximate distance/ETA only after route stop coordinates are supplied and validated.
   - **Complete when:** phone movement updates the right vehicle in the student and operations dashboards.

5. **Pilot, monitor, and release**
   - Test permission denied/revoked, app backgrounded, force-stop, reboot, low battery, weak signal, duplicate/out-of-order updates, reconnects, and expired locations.
   - Measure update delay and battery use on actual campus routes; tune the interval only after those measurements.
   - Verify only approved campus users can see locations and drivers can readily stop sharing.
   - Start with a small, consented pilot and a documented support/incident process.
   - **Complete when:** the team accepts accuracy/battery tradeoffs, access checks pass, and stale data cannot appear live.

### Practical prototype-to-pilot boundary

The current browser GPS demo is useful for testing dashboard rendering and the local API, but it does not demonstrate background tracking and its Node service is memory-only/local-only. Do not expose port 3001 or the Vite development server to the internet as a shortcut. Build the Android app and secure online backend as separate steps before attempting a real-vehicle test.

## Recommended MVP

- **Map:** Leaflet with OpenStreetMap tiles.
- **Location source:** A driver's phone or an installed GPS device sends coordinates while a trip is active.
- **Backend:** A small authenticated API and WebSocket service. The frontend subscribes to location updates instead of repeatedly reloading the page.
- **Location update interval:** About every 5 seconds while moving; reduce updates while stopped to save battery and data.
- **Distance:** Haversine formula for straight-line distance from the bus to a stop. Clearly label it as approximate; it is not road distance.
- **ETA:** Initially estimate from the remaining route distance and a recent, bounded speed average. Improve with historical route travel times after collecting enough data.
- **Smoothing:** Begin with validation and a short moving average to reduce GPS jitter. Add route map-matching or a Kalman filter only if testing shows they are needed.

## Location message

Each update should include only the data needed to display the active bus:

```json
{
  "vehicleId": "BUS-104",
  "tripId": "TRIP-2048",
  "latitude": 37.4219,
  "longitude": -122.084,
  "speedMetersPerSecond": 7.2,
  "headingDegrees": 92,
  "recordedAt": "2026-11-12T08:15:00Z"
}
```

The backend should validate latitude and longitude ranges, verify that the sending driver/device is assigned to the active trip, and reject stale or out-of-order updates. Do not send student identity or payment information with location updates.

## Implementation milestones

### 1. Prepare route and vehicle data

- Define campus routes as ordered coordinates and stops, with stable route, stop, vehicle, and trip IDs.
- Confirm route shapes and stop locations against the real campus map.
- Keep demo data separate from real GPS data so the UI cannot mistake simulated locations for live ones.

**Done when:** Each planned trip can identify its route, assigned vehicle, stops, and current status.

### 2. Add the map to the frontend

- Replace the drawn map in the student and admin views with a real map and route polylines.
- Render bus markers, stop markers, a map legend, and a visible loading/empty/error state.
- Keep keyboard access and a text alternative for route and vehicle status.

**Done when:** A test location can be shown at the correct map position with the correct route and stops.

### 3. Create a location-update service

- Add authenticated endpoints for a driver/device to start and end a trip and submit GPS updates.
- Broadcast validated updates for active trips over WebSockets.
- Store only the latest location needed for live display at first; define a retention policy before storing location history.
- Add role checks so only authorized drivers/devices can submit locations and only permitted users can view them.

**Done when:** A test client can submit a location and an authorized browser receives it without refreshing.

### 4. Connect trip state and live UI

- Subscribe to the selected route/trip and update the bus marker as messages arrive.
- Show the update time and mark the location stale if no fresh update arrives (for example, after 30 seconds).
- Calculate approximate distance to the next stop using Haversine distance.
- Show an ETA only when location, route, and speed data are recent and usable; otherwise say ETA is unavailable.
- Handle reconnects, missing GPS permission, poor signal, and ended trips explicitly.

**Done when:** Moving a test bus moves its marker, stale data is clearly indicated, and disconnecting does not leave a false live status.

### 5. Test, deploy, and pilot

- Test valid, invalid, stale, duplicated, and out-of-order coordinates.
- Test browser reconnects and poor network conditions.
- Compare displayed marker positions and arrival estimates with a small campus pilot.
- Review access controls, retention, driver consent, and location visibility before using real vehicles.
- Deploy the API and frontend over HTTPS; configure secrets outside the source code.

**Done when:** A limited pilot can run reliably and operators understand the accuracy limits of the map and ETA.

## Key safety and privacy requirements

- Request location only during an active, authorized trip, and explain tracking to drivers.
- Limit access to live vehicle locations to the intended campus users.
- Do not expose a driver's personal identity or retain detailed location history longer than necessary.
- Show when a location was last received; never present stale coordinates as live.
- Treat GPS-derived distance and ETA as estimates, not guarantees.

## Decisions and remaining prerequisites

Chosen for the prototype:

1. GPS source: driver phone.
2. Backend: Node.js.
3. Intended access: signed-in campus users.
4. Retention: latest location only.
5. Authentication: local-only demo first; no public access.

Before a campus pilot:

- Select the campus identity provider and enforce driver and viewer roles on the server.
- Provide real route shapes, stop coordinates, and vehicle assignments.
- Choose a map provider and review its tile/data privacy terms.
- Deploy over HTTPS and test location permission, signal loss, stale data, and access controls.
- Confirm driver notice/consent and the location-data retention policy.
