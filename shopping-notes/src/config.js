import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 4000;

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  return hostUri?.split(':')[0];
}

function getDefaultApiUrl() {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}`;
  }

  const host = getExpoHost();
  return `http://${host || 'localhost'}:${API_PORT}`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();
