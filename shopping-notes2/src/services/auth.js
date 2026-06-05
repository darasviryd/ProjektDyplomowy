import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { beginUserSession } from './storage';

export async function register(email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.access_token) {
    await beginUserSession(email);
    await AsyncStorage.setItem('TOKEN', data.access_token);
  }
  return data;
}

export async function getToken() {
  return AsyncStorage.getItem('TOKEN');
}

export async function logout() {
  await AsyncStorage.removeItem('TOKEN');
}
