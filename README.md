# Move Campus

## Run the app

From the project directory, open two terminals.

In the first terminal, start the local GPS service:

```sh
npm run tracking
```

In the second terminal, start the React app:

```sh
npm run dev
```

Open the local URL printed by Vite and choose **Driver demo** from the student sidebar, or visit `/driver`. Allow location access and select **Start GPS sharing**. Return to the dashboard to see the latest position and its reported accuracy. Select **Stop sharing** when finished.

The prototype accepts browser GPS updates about every five seconds and keeps only the latest location in server memory. The service binds to `127.0.0.1`; it is intended only for local testing on this computer. It has no campus sign-in, does not store trip history, and is not suitable for real vehicles or public use. The current view displays coordinates rather than a campus route map because real stop and route coordinates have not yet been provided.

## Android driver background-location prototype

A separate Expo Android app is in [`driver-android/`](./driver-android/). It requests notification, foreground-location, and background-location permissions; after the assigned-driver consent is confirmed, Android shows an ongoing foreground-service notification while the app records GPS updates in the background. The app keeps only the latest coordinate on the phone and clears it when sharing stops. It does **not** send GPS to the web dashboard or a cloud service yet.

To run it on a physical Android device:

1. Install Android Studio and its Android SDK, connect an Android phone with USB debugging enabled, or start an Android emulator.
2. In a terminal, run:

   ```sh
   cd driver-android
   npm install
   npm run android
   ```

3. Allow notifications and location permissions. Android 11 and later may require choosing **Allow all the time** in the app's location settings. Start GPS sharing and confirm that the ongoing notification appears.
4. Minimize the app to test background collection, then reopen it and stop sharing.

Alternatively, build an installable internal-test APK with Expo Application Services (requires an Expo account):

```sh
cd driver-android
npx eas-cli build --profile preview --platform android
```

Install the APK link EAS provides on a physical Android phone. Background GPS behavior cannot be validated in a desktop browser or simulator alone.

This needs an Expo native development build; Expo Go does not validate background GPS behavior. Android may still throttle updates or stop the service because of force-stop, permission changes, battery restrictions, network/device failure, or manufacturer-specific policies. Test on the actual target phones before any pilot.

There is no production authentication or remote location endpoint. Do not expose the local web demo service to the internet or use this prototype to track real buses/drivers.

To check the frontend:

```sh
npm run lint
npm run build
```

To validate the Expo app configuration:

```sh
cd driver-android
npm run config:check
```

## Development

The app uses React and Vite. Vite provides the development server and hot module replacement.
