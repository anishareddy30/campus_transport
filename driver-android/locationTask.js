import AsyncStorage from '@react-native-async-storage/async-storage'
import * as TaskManager from 'expo-task-manager'

export const LOCATION_TASK_NAME = 'move-campus-background-location'
export const LAST_LOCATION_KEY = 'move-campus-last-location'

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task failed:', error.message)
    return
  }

  const locations = data?.locations
  const latest = locations?.[locations.length - 1]
  if (!latest?.coords) return

  const { latitude, longitude, accuracy, heading, speed } = latest.coords
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.error('Background location task received invalid coordinates.')
    return
  }

  const location = {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    heading: Number.isFinite(heading) ? heading : null,
    speed: Number.isFinite(speed) ? speed : null,
    recordedAt: new Date(latest.timestamp).toISOString(),
    receivedAt: Date.now(),
  }

  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location))
  } catch (storageError) {
    console.error('Could not save the latest background location:', storageError)
  }
})
