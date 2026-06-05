
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('TOKEN');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
 
  async sync(payload) {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch {}
      throw new Error(msg);
    }

   
    return await res.json();
  },

  async analyzeReceipt(payload) {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/receipt-ai/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  },

  async importReceipt(payload) {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/receipt-ai/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  },
};
