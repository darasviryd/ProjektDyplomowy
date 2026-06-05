import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
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

import { api } from '../services/api';
import { STORAGE_KEYS, storage } from '../services/storage';
import { syncService } from '../services/sync';
import { formatMoney } from '../utils/currency';
import { parseReceiptText } from '../utils/receiptParser';
import { generateId } from '../utils/uuid';

const BLUE = '#8B5CF6';

const S = {
  screen: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 },
  listRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { borderColor: BLUE, backgroundColor: '#EDE9FE' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: BLUE },
  input: {
    minHeight: 190,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  btnPrimary: { backgroundColor: BLUE },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  btnText: { fontSize: 15, fontWeight: '800' },
  btnTextPrimary: { color: '#fff' },
  btnTextGhost: { color: '#475569' },
  summary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  summaryText: { color: '#64748B', fontSize: 13, lineHeight: 19 },
  itemRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  itemName: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  itemMeta: { color: '#64748B', fontSize: 13 },
  empty: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
};

const SAMPLE_RECEIPT = `Biedronka
MLEKO 3,66
PIECZARKI 4,99
FILET KURCZAKA 25,00
BORÓWKA 10,99
SUMA 44,64 zł`;

function receiptAiMessage(message) {
  const text = String(message || '');
  const lower = text.toLowerCase();

  if (lower.includes('quota') || lower.includes('rate-limit') || lower.includes('rate limit') || lower.includes('limit darmowego')) {
    return 'Limit darmowego Gemini API został wykorzystany. Wklej tekst z paragonu i użyj przycisku Analizuj.';
  }

  if (lower.includes('api key') || lower.includes('permission') || lower.includes('unauthorized') || lower.includes('gemini_api_key')) {
    return 'Klucz do analizy zdjęć jest nieaktywny. Wklej tekst z paragonu albo sprawdź GEMINI_API_KEY w backendzie.';
  }

  return text || 'Wklej tekst z paragonu i użyj analizy tekstowej.';
}

export default function ReceiptImportScreen({ navigation }) {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  const loadLists = useCallback(async () => {
    const saved = await storage.get(STORAGE_KEYS.LISTS);
    setLists(saved);
    setSelectedListId(current => current || saved[0]?.id || '');
  }, []);

  useFocusEffect(useCallback(() => { loadLists(); }, [loadLists]));

  const selectedList = useMemo(
    () => lists.find(list => String(list.id) === String(selectedListId)),
    [lists, selectedListId],
  );

  const analyze = () => {
    if (!selectedList) {
      Alert.alert('Brak listy', 'Najpierw utwórz listę zakupów.');
      return;
    }
    if (!receiptText.trim()) {
      Alert.alert('Brak tekstu', 'Wklej tekst z paragonu albo użyj przykładu.');
      return;
    }

    setPhoto(null);
    const result = parseReceiptText(receiptText, selectedList.currency || 'PLN');
    if (!result.items.length) {
      Alert.alert('Nie rozpoznano produktów', 'Sprawdź tekst paragonu i spróbuj ponownie.');
      return;
    }
    setParsed(result);
  };

  const pickReceiptPhoto = async () => {
    if (!selectedList) {
      Alert.alert('Brak listy', 'Najpierw utwórz listę zakupów.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak dostępu', 'Zezwól aplikacji na dostęp do zdjęć w ustawieniach.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPhoto(asset);
    setAnalyzingPhoto(true);
    setParsed(null);

    try {
      const response = await api.analyzeReceipt({
        imageBase64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
        ocrText: receiptText.trim() || undefined,
        currency: selectedList.currency || 'PLN',
      });
      setParsed(response);
    } catch (e) {
      Alert.alert(
        'Analiza zdjęcia niedostępna',
        receiptAiMessage(e?.message),
      );
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const addToList = async () => {
    if (!selectedList || !parsed?.items?.length) return;

    try {
      if (photo?.base64) {
        await api.importReceipt({
          listId: selectedList.id,
          imageBase64: photo.base64,
          mimeType: photo.mimeType || 'image/jpeg',
          ocrText: receiptText.trim() || undefined,
          currency: selectedList.currency || 'PLN',
        });
        await syncService().catch(() => {});
      } else {
        const allItems = await storage.get(STORAGE_KEYS.ITEMS);
        const now = Date.now();
        const newItems = parsed.items.map(item => ({
          id: generateId(),
          listId: selectedList.id,
          name: item.name,
          price: item.price,
          currency: item.currency || selectedList.currency || 'PLN',
          quantity: item.quantity || 1,
          description: 'Dodano z paragonu',
          url: '',
          imageUrl: '',
          priority: 'normal',
          bought: true,
          updatedAt: now,
        }));
        await storage.set(STORAGE_KEYS.ITEMS, [...allItems, ...newItems]);
      }

      Alert.alert('Dodano produkty', `Dodano ${parsed.items.length} pozycji do listy "${selectedList.name}".`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ListDetails', { listId: selectedList.id }),
        },
      ]);
    } catch (e) {
      Alert.alert('Błąd zapisu', e?.message || 'Nie udało się dodać produktów z paragonu.');
    }
  };

  const useSample = () => {
    setReceiptText(SAMPLE_RECEIPT);
    setParsed(null);
    setPhoto(null);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={S.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">
          <Text style={S.title}>Paragon AI</Text>
          <Text style={S.subtitle}>
            Wklej tekst z paragonu. Aplikacja rozpozna produkty, ceny i doda je do wydatków wybranej listy.
          </Text>

          <Text style={S.label}>LISTA DO DODANIA WYDATKÓW</Text>
          <View style={S.listRow}>
            {lists.map(list => {
              const active = String(list.id) === String(selectedListId);
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[S.chip, active && S.chipActive]}
                  onPress={() => {
                    setSelectedListId(list.id);
                    setParsed(null);
                  }}
                >
                  <Text style={[S.chipText, active && S.chipTextActive]}>{list.name}</Text>
                </TouchableOpacity>
              );
            })}
            {!lists.length && <Text style={S.empty}>Brak list zakupów. Utwórz listę na ekranie głównym.</Text>}
          </View>

          <Text style={S.label}>TEKST PARAGONU</Text>
          <TextInput
            style={S.input}
            value={receiptText}
            onChangeText={(value) => {
              setReceiptText(value);
              setParsed(null);
            }}
            placeholder="Wklej tekst z paragonu..."
            multiline
            autoCapitalize="sentences"
          />

          <View style={S.actions}>
            <TouchableOpacity style={[S.btn, S.btnGhost]} onPress={useSample}>
              <Text style={[S.btnText, S.btnTextGhost]}>Przykład</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnPrimary]} onPress={analyze}>
              <Text style={[S.btnText, S.btnTextPrimary]}>Analizuj</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[S.btn, S.btnGhost, { marginBottom: 18 }]} onPress={pickReceiptPhoto}>
            {analyzingPhoto ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={BLUE} />
                <Text style={[S.btnText, S.btnTextGhost]}>Analiza zdjęcia...</Text>
              </View>
            ) : (
              <Text style={[S.btnText, S.btnTextGhost]}>Wybierz zdjęcie paragonu</Text>
            )}
          </TouchableOpacity>

          {!!parsed && (
            <>
              <View style={S.summary}>
                <View style={S.summaryTop}>
                  <Ionicons name="sparkles-outline" size={19} color={BLUE} />
                  <Text style={S.summaryTitle}>Rozpoznano {parsed.items.length} pozycji</Text>
                </View>
                <Text style={S.summaryText}>
                  Suma pozycji: {formatMoney(parsed.parsedTotal, parsed.currency)}
                  {parsed.receiptTotal > 0 ? `\nSuma z paragonu: ${formatMoney(parsed.receiptTotal, parsed.currency)}` : ''}
                </Text>
              </View>

              {parsed.items.map((item, idx) => (
                <View key={`${item.name}-${idx}`} style={S.itemRow}>
                  <Text style={S.itemName}>{idx + 1}. {item.name}</Text>
                  <Text style={S.itemMeta}>
                    {formatMoney(item.price, item.currency)} × {item.quantity} = {formatMoney(item.price * item.quantity, item.currency)}
                  </Text>
                </View>
              ))}

              <TouchableOpacity style={[S.btn, S.btnPrimary, { marginTop: 14 }]} onPress={addToList}>
                <Text style={[S.btnText, S.btnTextPrimary]}>Dodaj do wydatków</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
