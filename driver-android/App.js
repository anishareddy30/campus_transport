import { StatusBar } from 'expo-status-bar'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LAST_LOCATION_KEY, LOCATION_TASK_NAME } from './locationTask'
import AsyncStorage from '@react-native-async-storage/async-storage'

const vehicle = { id: 'BUS-104', route: 'North Campus', routeCode: 'R-04' }
const updateIntervalMs = 5000

function formatRecordedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

export default function App() {
  const [tracking, setTracking] = useState(false)
  const [location, setLocation] = useState(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const refreshLocation = useCallback(async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LAST_LOCATION_KEY)
      setLocation(savedLocation ? JSON.parse(savedLocation) : null)
    } catch (readError) {
      console.error('Could not read the latest saved location:', readError)
      setError('Could not read the last saved location from this device.')
    }
  }, [])

  useEffect(() => {
    let active = true
    const initialize = async () => {
      try {
        const [isRunning, savedLocation] = await Promise.all([
          Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME),
          AsyncStorage.getItem(LAST_LOCATION_KEY),
        ])
        if (active) {
          setTracking(isRunning)
          setLocation(savedLocation ? JSON.parse(savedLocation) : null)
        }
      } catch (initializeError) {
        console.error('Could not restore background tracking state:', initializeError)
        if (active) setError('Could not restore the tracking status. Check app permissions.')
      } finally {
        if (active) setBusy(false)
      }
    }

    initialize()
    const poll = setInterval(() => {
      if (active) refreshLocation()
    }, 3000)

    return () => {
      active = false
      clearInterval(poll)
    }
  }, [refreshLocation])

  const startTracking = async () => {
    if (Platform.OS !== 'android') {
      setError('This prototype is configured for Android devices only.')
      return
    }
    if (!consent) {
      setError('Confirm that you are the assigned driver before starting location sharing.')
      return
    }
    if (!await TaskManager.isAvailableAsync()) {
      setError('Background tasks are unavailable. Install the Android development build, not Expo Go.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const notificationPermission = await Notifications.requestPermissionsAsync()
      if (notificationPermission.status !== 'granted') {
        throw new Error('Allow notifications so Android can show the ongoing tracking notice.')
      }

      const foregroundPermission = await Location.requestForegroundPermissionsAsync()
      if (foregroundPermission.status !== 'granted') {
        throw new Error('Allow location access to start the trip.')
      }

      const backgroundPermission = await Location.requestBackgroundPermissionsAsync()
      if (backgroundPermission.status !== 'granted') {
        throw new Error('Allow background location in Android settings to continue sharing while the app is minimized.')
      }

      const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      if (!alreadyRunning) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: updateIntervalMs,
          distanceInterval: 10,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: false,
          foregroundService: {
            notificationTitle: 'Campus bus location is being shared',
            notificationBody: `${vehicle.id} · ${vehicle.route} · Tap to return and stop sharing.`,
            notificationColor: '#4565d2',
            killServiceOnDestroy: false,
          },
        })
      }

      setTracking(true)
      setConsent(false)
      await refreshLocation()
    } catch (startError) {
      console.error('Could not start background location sharing:', startError)
      setError(startError.message || 'Could not start GPS sharing.')
    } finally {
      setBusy(false)
    }
  }

  const stopTracking = async () => {
    setBusy(true)
    setError('')
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      await AsyncStorage.removeItem(LAST_LOCATION_KEY)
      setLocation(null)
      setTracking(false)
    } catch (stopError) {
      console.error('Could not stop background location sharing:', stopError)
      setError(stopError.message || 'Could not stop GPS sharing. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const openAppSettings = () => {
    Linking.openSettings().catch((settingsError) => {
      console.error('Could not open Android app settings:', settingsError)
      Alert.alert('Settings unavailable', 'Open Android Settings and enable location and notification permissions for Move Campus Driver.')
    })
  }

  const locationTime = formatRecordedAt(location?.recordedAt)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brandIcon}><Text style={styles.busGlyph}>BUS</Text></View>
          <Text style={styles.brandName}>move <Text style={styles.brandLight}>campus</Text></Text>
          <View style={styles.localBadge}><View style={styles.badgeDot} /><Text style={styles.localBadgeText}>ANDROID PROTOTYPE</Text></View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>DRIVER LOCATION SHARING</Text>
          <Text style={styles.title}>Your trip, your control.</Text>
          <Text style={styles.subtitle}>Location is collected only after you start a trip and stop sharing when you end it.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIcon}><Text style={styles.vehicleGlyph}>B</Text></View>
            <View style={styles.vehicleText}>
              <Text style={styles.vehicleName}>{vehicle.id}</Text>
              <Text style={styles.vehicleRoute}>{vehicle.route} · Route {vehicle.routeCode}</Text>
            </View>
            <View style={[styles.stateBadge, tracking ? styles.stateLive : styles.stateStopped]}>
              <View style={[styles.stateDot, tracking ? styles.stateDotLive : styles.stateDotStopped]} />
              <Text style={[styles.stateText, tracking ? styles.stateTextLive : styles.stateTextStopped]}>{tracking ? 'Sharing' : 'Stopped'}</Text>
            </View>
          </View>

          <View style={styles.locationPanel}>
            <View style={[styles.locationIcon, tracking && styles.locationIconLive]}>
              <Text style={styles.locationPin}>⌖</Text>
            </View>
            <View style={styles.locationText}>
              <Text style={styles.coordinates}>
                {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Waiting for GPS location'}
              </Text>
              <Text style={styles.locationDetails}>
                {location
                  ? `Accuracy ${location.accuracy == null ? 'unavailable' : `±${Math.round(location.accuracy)} m`} · ${locationTime}`
                  : 'Your latest position is saved on this phone only.'}
              </Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorMark}>!</Text>
              <Text style={styles.errorText}>{error}</Text>
              {(error.includes('settings') || error.includes('Allow')) && (
                <Pressable onPress={openAppSettings} style={styles.settingsButton}>
                  <Text style={styles.settingsButtonText}>Open settings</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {!tracking && (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              onPress={() => setConsent((current) => !current)}
              style={styles.consentRow}
            >
              <View style={[styles.checkbox, consent && styles.checkboxChecked]}>{consent ? <Text style={styles.checkboxCheck}>✓</Text> : null}</View>
              <Text style={styles.consentText}>I am assigned to this vehicle and agree to share its location during this trip.</Text>
            </Pressable>
          )}

          {tracking && (
            <View style={styles.notice}>
              <View style={styles.noticeIcon}><Text style={styles.noticeGlyph}>i</Text></View>
              <Text style={styles.noticeText}>Android shows an ongoing notification while GPS sharing is active. The app can continue sharing when minimized, but force-stopping it, disabling permissions, or losing power/network can interrupt tracking.</Text>
            </View>
          )}

          {busy ? (
            <View style={styles.busyButton}><ActivityIndicator color="#fff" /><Text style={styles.busyText}>Checking permissions…</Text></View>
          ) : tracking ? (
            <Pressable onPress={stopTracking} style={styles.stopButton}><Text style={styles.stopButtonGlyph}>■</Text><Text style={styles.stopButtonText}>Stop and clear location</Text></Pressable>
          ) : (
            <Pressable onPress={startTracking} disabled={!consent} style={[styles.startButton, !consent && styles.startButtonDisabled]}>
              <Text style={styles.startButtonGlyph}>⌖</Text><Text style={styles.startButtonText}>Start background GPS</Text>
            </Pressable>
          )}

          <Text style={styles.intervalText}>GPS is requested about every 5 seconds or 10 meters. Android may adjust delivery to save battery.</Text>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Prototype privacy boundary</Text>
          <Text style={styles.privacyText}>This Android prototype keeps the latest coordinate on this phone only. It does not send location to the student website or a cloud server yet. Do not use it to track a real bus or driver.</Text>
        </View>

        <View style={styles.steps}>
          <Text style={styles.stepsHeading}>TO TEST ON ANDROID</Text>
          <Text style={styles.step}>1. Install a development build on a physical Android phone.</Text>
          <Text style={styles.step}>2. Allow notifications, precise location, and background location.</Text>
          <Text style={styles.step}>3. Start sharing and check for the ongoing Android notification.</Text>
          <Text style={styles.step}>4. Minimize the app to test; return and stop sharing when finished.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f8fc' },
  scrollContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 38 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 34 },
  brandIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#496bdd', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  busGlyph: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  brandName: { color: '#1e2d44', fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  brandLight: { color: '#7d8ba0', fontWeight: '500' },
  localBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#edf7f1', borderRadius: 20 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#48a77f' },
  localBadgeText: { color: '#628371', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  titleBlock: { marginBottom: 20 },
  eyebrow: { color: '#98a4b4', fontSize: 8, fontWeight: '800', letterSpacing: 1.15, marginBottom: 7 },
  title: { color: '#1e2d44', fontSize: 26, fontWeight: '750', letterSpacing: -0.8 },
  subtitle: { marginTop: 8, color: '#8290a4', fontSize: 11, lineHeight: 17 },
  card: { padding: 17, backgroundColor: '#fff', borderColor: '#e9edf3', borderWidth: 1, borderRadius: 14, shadowColor: '#263651', shadowOpacity: 0.04, shadowRadius: 15, elevation: 2 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#edf0f4' },
  vehicleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#edf1ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  vehicleGlyph: { color: '#4d68c4', fontSize: 14, fontWeight: '800' },
  vehicleText: { flex: 1 },
  vehicleName: { color: '#3a4b63', fontSize: 11, fontWeight: '750' },
  vehicleRoute: { color: '#929eae', fontSize: 9, marginTop: 4 },
  stateBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 6 },
  stateLive: { backgroundColor: '#edf8f3' },
  stateStopped: { backgroundColor: '#f3f5f8' },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  stateDotLive: { backgroundColor: '#45a881' },
  stateDotStopped: { backgroundColor: '#aab4c1' },
  stateText: { fontSize: 8, fontWeight: '700' },
  stateTextLive: { color: '#409579' },
  stateTextStopped: { color: '#8591a2' },
  locationPanel: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f5f8' },
  locationIconLive: { backgroundColor: '#edf8f3' },
  locationPin: { color: '#4b9b80', fontSize: 24, lineHeight: 28 },
  locationText: { flex: 1 },
  coordinates: { color: '#43536b', fontSize: 11, fontWeight: '700' },
  locationDetails: { color: '#929eae', fontSize: 8, marginTop: 5 },
  errorBox: { padding: 10, marginBottom: 10, backgroundColor: '#fff7f0', borderColor: '#f4e5d7', borderWidth: 1, borderRadius: 8 },
  errorMark: { color: '#aa6944', fontWeight: '800', fontSize: 12, marginBottom: 4 },
  errorText: { color: '#936143', fontSize: 9, lineHeight: 14 },
  settingsButton: { alignSelf: 'flex-start', marginTop: 7, padding: 5 },
  settingsButtonText: { color: '#4565bf', fontWeight: '700', fontSize: 9 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12 },
  checkbox: { width: 19, height: 19, borderWidth: 1, borderColor: '#cbd3df', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4d68c8', borderColor: '#4d68c8' },
  checkboxCheck: { color: '#fff', fontWeight: '800', fontSize: 12 },
  consentText: { flex: 1, color: '#69798e', fontSize: 9, lineHeight: 14 },
  notice: { flexDirection: 'row', gap: 8, padding: 10, marginVertical: 9, backgroundColor: '#f1f5ff', borderRadius: 8 },
  noticeIcon: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#dce5ff', alignItems: 'center', justifyContent: 'center' },
  noticeGlyph: { color: '#4b67c7', fontSize: 11, fontWeight: '800' },
  noticeText: { flex: 1, color: '#697a99', fontSize: 8, lineHeight: 13 },
  busyButton: { minHeight: 43, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#4565d2', borderRadius: 8 },
  busyText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  startButton: { minHeight: 43, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#4565d2', borderRadius: 8 },
  startButtonDisabled: { opacity: 0.45 },
  startButtonGlyph: { color: '#fff', fontSize: 18, fontWeight: '700' },
  startButtonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  stopButton: { minHeight: 43, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#fff1ef', borderColor: '#f3ddda', borderWidth: 1, borderRadius: 8 },
  stopButtonGlyph: { color: '#ad5b53', fontSize: 13 },
  stopButtonText: { color: '#a64e47', fontSize: 10, fontWeight: '700' },
  intervalText: { marginTop: 10, color: '#969faf', fontSize: 8, lineHeight: 13 },
  privacyCard: { padding: 14, marginTop: 12, backgroundColor: '#fff9f3', borderColor: '#f3eadf', borderWidth: 1, borderRadius: 10 },
  privacyTitle: { color: '#8e684c', fontSize: 9, fontWeight: '750', marginBottom: 5 },
  privacyText: { color: '#9a806d', fontSize: 8, lineHeight: 13 },
  steps: { gap: 9, paddingHorizontal: 3, paddingTop: 19 },
  stepsHeading: { color: '#9ba6b5', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 1 },
  step: { color: '#7b899d', fontSize: 9, lineHeight: 14 },
})
