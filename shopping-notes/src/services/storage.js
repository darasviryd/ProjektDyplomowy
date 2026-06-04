import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  LISTS: 'SHOPPING_LISTS',
  ITEMS: 'SHOPPING_ITEMS',
  SUBSCRIPTIONS: 'SUBSCRIPTIONS', 
};

const SESSION_KEYS = {
  TOKEN: 'TOKEN',
  USER_EMAIL: 'USER_EMAIL',
};

const SCOPED_VALUE_KEYS = [
  'DEFAULT_CURRENCY',
  'GLOBAL_BUDGET_LIMIT',
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function scopedKey(email, key) {
  return `USER_DATA:${normalizeEmail(email)}:${key}`;
}

async function currentUserEmail() {
  return normalizeEmail(await AsyncStorage.getItem(SESSION_KEYS.USER_EMAIL));
}

async function resolveKey(key) {
  const email = await currentUserEmail();
  return email ? scopedKey(email, key) : key;
}

async function copyLegacyKeyToUser(email, key) {
  const value = await AsyncStorage.getItem(key);
  if (value === null) return;

  if (email) {
    const nextKey = scopedKey(email, key);
    const existing = await AsyncStorage.getItem(nextKey);
    if (existing === null) {
      await AsyncStorage.setItem(nextKey, value);
    }
  }

  await AsyncStorage.removeItem(key);
}

export async function beginUserSession(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const previousEmail = await currentUserEmail();
  await Promise.all([
    ...Object.values(STORAGE_KEYS).map(key => copyLegacyKeyToUser(previousEmail, key)),
    ...SCOPED_VALUE_KEYS.map(key => copyLegacyKeyToUser(previousEmail, key)),
  ]);

  await AsyncStorage.setItem(SESSION_KEYS.USER_EMAIL, normalizedEmail);
}

export const storage = {
  async get(key) {
    const data = await AsyncStorage.getItem(await resolveKey(key));
    return data ? JSON.parse(data) : [];
  },

  async set(key, value) {
    await AsyncStorage.setItem(await resolveKey(key), JSON.stringify(value));
  },

  async getValue(key) {
    return AsyncStorage.getItem(await resolveKey(key));
  },

  async setValue(key, value) {
    await AsyncStorage.setItem(await resolveKey(key), String(value));
  },

  async removeValue(key) {
    await AsyncStorage.removeItem(await resolveKey(key));
  },
};
