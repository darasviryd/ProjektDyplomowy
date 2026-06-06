import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { STORAGE_KEYS, storage } from '../services/storage';
import { extractUrl, fetchOgImage } from '../utils/ogImage';
import { CURRENCIES } from '../utils/currency';
import { generateId } from '../utils/uuid';

const PRIORITIES = [
  { value: 'low', label: 'Niski' },
  { value: 'normal', label: 'Normalny' },
  { value: 'high', label: 'Wysoki' },
];

const PRIORITY_COLOR = { low: '#94A3B8', normal: '#8B5CF6', high: '#EF4444' };
const PRIORITY_BG_ACTIVE = { low: '#F8FAFC', normal: '#EDE9FE', high: '#FEF2F2' };
const ITEM_CURRENCIES = CURRENCIES.filter(c => c.code !== 'GBP');

const styles = {
  screen: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: '800', marginBottom: 18, color: '#111827' },

  card: {
    backgroundColor: 'transparent',
  },

  label: { fontSize: 11, color: '#94A3B8', marginBottom: 7, fontWeight: '700', letterSpacing: 0.6 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  chipActive: { borderWidth: 1.5 },
  chipText: { fontWeight: '700', fontSize: 13, color: '#64748B' },

  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mediaBtnText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  linkMediaText: { color: '#7C3AED' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  loadingText: { color: '#64748B', fontSize: 13 },
  imageWrap: { marginBottom: 14 },
  image: { width: '100%', height: 150, borderRadius: 12 },
  imageAction: {
    position: 'absolute',
    backgroundColor: 'rgba(17,24,39,0.68)',
    borderRadius: 999,
  },
  imageRemove: { top: 8, right: 8, padding: 6 },
  imageChange: { bottom: 8, right: 8, paddingVertical: 5, paddingHorizontal: 9 },
  imageActionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  btn: { backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
};

export default function AddItemScreen({ route, navigation }) {
  const { listId } = route.params;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('PLN');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState('normal');
  const [imageUrl, setImageUrl] = useState('');
  const [fetchingImage, setFetchingImage] = useState(false);

  useEffect(() => {
    async function loadListCurrency() {
      const lists = await storage.get(STORAGE_KEYS.LISTS);
      const list = lists.find(l => String(l.id) === String(listId));
      setCurrency(list?.currency || 'PLN');
    }

    loadListCurrency();
  }, [listId]);

  const handleUrlBlur = async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http') || imageUrl) return;
    setFetchingImage(true);
    const img = await fetchOgImage(trimmed);
    if (img) setImageUrl(img);
    setFetchingImage(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak dostępu', 'Zezwól aplikacji na dostęp do zdjęć w ustawieniach.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const save = async () => {
    const p = Number(price);
    const q = Number(quantity);

    if (!name.trim()) {
      Alert.alert('Błędne dane', 'Podaj nazwę produktu.');
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      Alert.alert('Błędne dane', 'Cena musi być liczbą > 0.');
      return;
    }
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Błędne dane', 'Ilość musi być liczbą > 0.');
      return;
    }
    if (url.trim() && !url.trim().startsWith('http')) {
      Alert.alert('Błędny link', 'Link powinien zaczynać się od http/https.');
      return;
    }

    const items = await storage.get(STORAGE_KEYS.ITEMS);
    items.push({
      id: generateId(),
      listId,
      name: name.trim(),
      price: Math.round(p * 100) / 100,
      currency,
      quantity: q,
      description: description.trim(),
      url: url.trim(),
      imageUrl: imageUrl.trim(),
      priority,
      bought: false,
      updatedAt: Date.now(),
    });

    await storage.set(STORAGE_KEYS.ITEMS, items);
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Dodaj produkt</Text>

          <View style={styles.card}>
            <Text style={styles.label}>NAZWA</Text>
            <TextInput
              style={styles.input}
              placeholder="np. kurtka"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <Text style={styles.label}>CENA</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 19,99"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={v => setPrice(v.replace(',', '.'))}
              returnKeyType="next"
            />

            <Text style={styles.label}>WALUTA CENY</Text>
            <View style={styles.chipRow}>
              {ITEM_CURRENCIES.map(c => {
                const active = c.code === currency;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                      active && { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
                    ]}
                    onPress={() => setCurrency(c.code)}
                  >
                    <Text style={[styles.chipText, active && { color: '#8B5CF6' }]}>
                      {c.code} ({c.symbol})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>ILOŚĆ</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
              returnKeyType="next"
            />

            <Text style={styles.label}>PRIORYTET</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => {
                const active = p.value === priority;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                      active && { borderColor: PRIORITY_COLOR[p.value], backgroundColor: PRIORITY_BG_ACTIVE[p.value] },
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Text style={[styles.chipText, active && { color: PRIORITY_COLOR[p.value] }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>OPIS (opcjonalnie)</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Rozmiar S"
              value={description}
              onChangeText={setDescription}
              returnKeyType="next"
            />

            <Text style={styles.label}>LINK (opcjonalnie)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={url}
              onChangeText={(v) => { setUrl(extractUrl(v)); setImageUrl(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
              returnKeyType="done"
              onBlur={handleUrlBlur}
            />

            <View style={styles.mediaRow}>
              {url.trim().startsWith('http') && !imageUrl && !fetchingImage && (
                <TouchableOpacity
                  onPress={handleUrlBlur}
                  style={styles.mediaBtn}
                >
                  <Text style={[styles.mediaBtnText, styles.linkMediaText]}>Z linku</Text>
                </TouchableOpacity>
              )}
              {!imageUrl && !fetchingImage && (
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.mediaBtn}
                >
                  <Text style={styles.mediaBtnText}>Z galerii</Text>
                </TouchableOpacity>
              )}
            </View>

            {fetchingImage && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={styles.loadingText}>Pobieranie zdjęcia...</Text>
              </View>
            )}

            {!!imageUrl && !fetchingImage && (
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl('')}
                  style={[styles.imageAction, styles.imageRemove]}
                >
                  <Text style={styles.imageActionText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickImage}
                  style={[styles.imageAction, styles.imageChange]}
                >
                  <Text style={styles.imageActionText}>Zmień</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={save}>
              <Text style={styles.btnText}>Zapisz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
