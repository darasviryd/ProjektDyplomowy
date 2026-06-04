import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  Animated,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { STORAGE_KEYS, storage } from '../services/storage';
import { extractUrl } from '../utils/ogImage';
import { calculateTotal, calculateTotalsByCurrency, isBudgetExceeded, itemCurrency } from '../utils/budget';
import { CURRENCIES, formatCurrencyTotals, formatMoney } from '../utils/currency';

const PRIORITY_LABELS = { low: 'Niski', normal: 'Normalny', high: 'Wysoki' };
const PRIORITY_COLORS = { low: '#94A3B8', normal: '#8B5CF6', high: '#EF4444' };
const PRIORITY_BG = { low: '#F8FAFC', normal: '#EDE9FE', high: '#FEF2F2' };
const ITEM_CURRENCIES = CURRENCIES.filter(c => c.code !== 'GBP');

const styles = {
  screen: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  metaValue: { fontSize: 17, fontWeight: '700', color: '#111827' },
  warn: { color: '#E11D48', fontWeight: '800', fontSize: 13, marginTop: 4 },

  progressTrack: { height: 3, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 12, marginBottom: 4 },
  progressFill: { height: 3, backgroundColor: '#8B5CF6', borderRadius: 4 },
  progressDone: { backgroundColor: '#22C55E' },
  progressLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  otherCurrencies: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 6 },
  budgetProgress: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 6 },

  shareBtn: { marginTop: 10, alignSelf: 'flex-start' },
  shareBtnText: { color: '#7C3AED', fontWeight: '600', fontSize: 13 },

  list: { paddingHorizontal: 16, paddingBottom: 96 },

  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardBought: { opacity: 0.52 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkBtn: { marginTop: 2 },
  cardBody: { flex: 1 },

  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#111827' },
  itemTitleBought: { textDecorationLine: 'line-through', color: '#94A3B8' },
  line: { color: '#475569', fontSize: 14, marginBottom: 2 },
  link: { color: '#7C3AED', fontWeight: '700', marginTop: 6, fontSize: 14 },

  priorityBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  priorityText: { fontSize: 12, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 18, marginTop: 8 },
  actionEdit: { color: '#7C3AED', fontWeight: '600', fontSize: 13 },
  actionDelete: { color: '#DC2626', fontWeight: '600', fontSize: 13 },

  editCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  editTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '800' },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    fontSize: 16,
  },
  btnPrimary: { backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  btnGhostText: { color: '#111827', fontSize: 16, fontWeight: '800' },

  addBtn: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
};

function CurrencyPicker({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {ITEM_CURRENCIES.map(c => {
        const active = c.code === value;
        return (
          <TouchableOpacity
            key={c.code}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: active ? '#8B5CF6' : '#E2E8F0',
              backgroundColor: active ? '#EDE9FE' : '#fff',
            }}
            onPress={() => onChange(c.code)}
          >
            <Text style={{ fontWeight: '800', color: active ? '#8B5CF6' : '#64748B', fontSize: 14 }}>
              {c.code} ({c.symbol})
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ListDetailsScreen({ route, navigation }) {
  const { listId } = route.params;

  const [items, setItems] = useState([]);
  const [list, setList] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('PLN');
  const [quantity, setQuantity] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);
  const modalY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const lists = await storage.get(STORAGE_KEYS.LISTS);
    setList(lists.find(l => String(l.id) === String(listId)) || null);
    const allItems = await storage.get(STORAGE_KEYS.ITEMS);
    setItems(allItems.filter(i => String(i.listId) === String(listId)));
  }, [listId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    return () => { if (undoTimer.current) clearTimeout(undoTimer.current); };
  }, []);

  useEffect(() => {
    if (!editingItem) modalY.setValue(0);
  }, [editingItem, modalY]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
    onPanResponderMove: (_, gs) => {
      if (gs.dy > 0) modalY.setValue(gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 100 || gs.vy > 0.8) {
        Animated.timing(modalY, { toValue: 700, duration: 180, useNativeDriver: true })
          .start(() => { setEditingItem(null); modalY.setValue(0); });
      } else {
        Animated.spring(modalY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const listCurrency = list?.currency || 'PLN';
  const budgetTotal = calculateTotal(items, listCurrency, listCurrency);
  const totalsByCurrency = calculateTotalsByCurrency(items, listCurrency);
  const allTotalsText = formatCurrencyTotals(totalsByCurrency);
  const hasMixedCurrencies = Object.keys(totalsByCurrency).filter(code => totalsByCurrency[code] > 0).length > 1;
  const boughtCount = items.filter(i => i.bought).length;
  const progress = items.length > 0 ? boughtCount / items.length : 0;
  const allDone = items.length > 0 && boughtCount === items.length;

  const toggleBought = async (item) => {
    const allItems = await storage.get(STORAGE_KEYS.ITEMS);
    const idx = allItems.findIndex(i => i.id === item.id);
    if (idx < 0) return;
    allItems[idx] = { ...allItems[idx], bought: !allItems[idx].bought, updatedAt: Date.now() };
    await storage.set(STORAGE_KEYS.ITEMS, allItems);
    setItems(prev => prev.map(i => i.id === item.id ? allItems[idx] : i));
  };

  const openUrl = (u) => {
    if (u && u.startsWith('http')) Linking.openURL(u);
    else Alert.alert('Brak linku', 'Ten produkt nie ma poprawnego linku.');
  };

  const deleteItem = (item) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setUndoItem(item);
    undoTimer.current = setTimeout(async () => {
      const allItems = await storage.get(STORAGE_KEYS.ITEMS);
      await storage.set(STORAGE_KEYS.ITEMS, allItems.filter(i => i.id !== item.id));
      setUndoItem(null);
    }, 4000);
  };

  const undoDelete = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (undoItem) setItems(prev => [undoItem, ...prev]);
    setUndoItem(null);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setPrice(String(item.price ?? ''));
    setCurrency(itemCurrency(item, list?.currency || 'PLN'));
    setQuantity(String(item.quantity ?? ''));
    setUrl(item.url || '');
    setDescription(item.description || '');
    setEditImageUrl(item.imageUrl || '');
  };

  const pickEditImage = async () => {
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
      setEditImageUrl(result.assets[0].uri);
    }
  };

  const saveEdit = async () => {
    const p = Number(price);
    const q = Number(quantity);
    if (!name.trim()) { Alert.alert('Błędne dane', 'Podaj nazwę.'); return; }
    if (!Number.isFinite(p) || p <= 0) { Alert.alert('Błędne dane', 'Cena musi być > 0.'); return; }
    if (!Number.isFinite(q) || q <= 0) { Alert.alert('Błędne dane', 'Ilość musi być > 0.'); return; }
    if (url.trim() && !url.trim().startsWith('http')) {
      Alert.alert('Błędny link', 'Link powinien zaczynać się od http/https.');
      return;
    }
    const allItems = await storage.get(STORAGE_KEYS.ITEMS);
    const index = allItems.findIndex(i => i.id === editingItem.id);
    if (index < 0) { setEditingItem(null); return; }
    allItems[index] = {
      ...editingItem,
      name: name.trim(),
      price: Math.round(p * 100) / 100,
      currency,
      quantity: q,
      url: url.trim(),
      description: description.trim(),
      imageUrl: editImageUrl.trim(),
      updatedAt: Date.now(),
    };
    await storage.set(STORAGE_KEYS.ITEMS, allItems);
    setEditingItem(null);
    load();
  };

  const shareList = async () => {
    try {
      const lines = items.map((i, idx) => {
        const status = i.bought ? '✓' : '○';
        const code = itemCurrency(i, list?.currency || 'PLN');
        const base = `${status} ${idx + 1}. ${i.name} — ${formatMoney(i.price, code)} x ${i.quantity}`;
        const desc = i.description ? ` (${i.description})` : '';
        const link = i.url ? `\n   ${i.url}` : '';
        return base + desc + link;
      });
      const message =
        `Lista: ${list?.name || ''}\n` +
        `Budżet: ${formatMoney(list?.budgetLimit || 0, listCurrency)}\n` +
        `Razem: ${allTotalsText}\n` +
        (list?.budgetLimit ? `W budżecie: ${formatMoney(budgetTotal, listCurrency)} / ${formatMoney(list.budgetLimit, listCurrency)}\n` : '') +
        '\n' +
        (lines.length ? lines.join('\n') : 'Brak produktów');
      await Share.share({ message });
    } catch (e) {
      Alert.alert('Błąd', e?.message || 'Nie udało się udostępnić listy');
    }
  };

  const renderItem = ({ item }) => {
    const renderRightActions = () => (
      <TouchableOpacity
        onPress={() => deleteItem(item)}
        style={{
          backgroundColor: '#EF4444',
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          borderRadius: 18,
          marginBottom: 12,
          marginLeft: 8,
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 4 }}>Usuń</Text>
      </TouchableOpacity>
    );

    const code = itemCurrency(item, listCurrency);

    return (
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={60}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => deleteItem(item)}
        containerStyle={{ marginBottom: 0 }}
      >
        <TouchableOpacity
          style={[styles.card, item.bought && styles.cardBought]}
          activeOpacity={0.85}
          onPress={() => startEdit(item)}
        >
          <View style={styles.cardTop}>
            <TouchableOpacity style={styles.checkBtn} onPress={() => toggleBought(item)}>
              <Ionicons
                name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={item.bought ? '#22C55E' : '#CBD5E1'}
              />
            </TouchableOpacity>

            <View style={styles.cardBody}>
              <Text style={[styles.itemTitle, item.bought && styles.itemTitleBought]}>
                {item.name}
              </Text>
              <Text style={styles.line}>
                {formatMoney(item.price, code)} × {item.quantity}
                {' = '}
                {formatMoney(item.price * item.quantity, code)}
              </Text>
              {!!item.description && <Text style={styles.line}>{item.description}</Text>}

              {!!item.url && (
                <Text style={styles.link} onPress={() => openUrl(item.url)}>
                  Otwórz link →
                </Text>
              )}

              {item.priority && item.priority !== 'normal' && (
                <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_BG[item.priority] }]}>
                  <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                    {PRIORITY_LABELS[item.priority]}
                  </Text>
                </View>
              )}
            </View>

            {!!item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 80, height: 80, borderRadius: 12, marginLeft: 10, flexShrink: 0 }}
                contentFit="cover"
              />
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => startEdit(item)}>
              <Text style={styles.actionEdit}>Edytuj</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(item)}>
              <Text style={styles.actionDelete}>Usuń</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.metaLabel}>BUDŻET</Text>
            <Text style={styles.metaValue}>{formatMoney(list?.budgetLimit || 0, listCurrency)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>RAZEM</Text>
            <Text style={styles.metaValue} numberOfLines={1} adjustsFontSizeToFit>{allTotalsText}</Text>
          </View>
        </View>

        {hasMixedCurrencies && list?.budgetLimit > 0 && (
          <Text style={styles.budgetProgress}>
            W budżecie: {formatMoney(budgetTotal, listCurrency)} / {formatMoney(list.budgetLimit, listCurrency)}
          </Text>
        )}

        {isBudgetExceeded(items, list?.budgetLimit, listCurrency, listCurrency) && (
          <Text style={styles.warn}>⚠ Przekroczono budżet!</Text>
        )}

        {items.length > 0 && (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                  allDone && styles.progressDone,
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>{boughtCount}/{items.length} kupionych</Text>
          </>
        )}

        <TouchableOpacity style={styles.shareBtn} onPress={shareList}>
          <Text style={styles.shareBtnText}>Udostępnij listę ↗</Text>
        </TouchableOpacity>
      </View>

    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>Brak produktów na liście</Text>
        }
        renderItem={renderItem}
      />

      {!!undoItem && (
        <TouchableOpacity
          onPress={undoDelete}
          style={{
            position: 'absolute',
            bottom: 90,
            left: 16,
            right: 16,
            backgroundColor: '#1E293B',
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: 18,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            Usunięto: {undoItem.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-undo" size={18} color="#60A5FA" />
            <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 15 }}>Cofnij</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddItem', { listId })}
      >
        <Text style={styles.addBtnText}>＋ Dodaj produkt</Text>
      </TouchableOpacity>

      <Modal visible={!!editingItem} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <TouchableWithoutFeedback>
                <Animated.View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, transform: [{ translateY: modalY }] }}>
                  <View
                    {...panResponder.panHandlers}
                    style={{ alignItems: 'center', paddingBottom: 12, marginTop: -8 }}
                  >
                    <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 4 }} />
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.editTitle}>Edytuj produkt</Text>
                    <Text style={styles.label}>NAZWA</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} returnKeyType="next" />
                    <Text style={styles.label}>CENA</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={price} onChangeText={v => setPrice(v.replace(',', '.'))} returnKeyType="next" />
                    <Text style={styles.label}>WALUTA CENY</Text>
                    <CurrencyPicker value={currency} onChange={setCurrency} />
                    <Text style={styles.label}>ILOŚĆ</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={quantity} onChangeText={v => setQuantity(v.replace(',', '.'))} returnKeyType="next" />
                    <Text style={styles.label}>LINK (opcjonalnie)</Text>
                    <TextInput style={styles.input} autoCapitalize="none" value={url} onChangeText={v => setUrl(extractUrl(v))} returnKeyType="next" />
                    <Text style={styles.label}>OPIS (opcjonalnie)</Text>
                    <TextInput style={styles.input} value={description} onChangeText={setDescription} returnKeyType="done" />

                    <Text style={styles.label}>ZDJĘCIE</Text>
                    {!!editImageUrl ? (
                      <View style={{ marginBottom: 12 }}>
                        <Image source={{ uri: editImageUrl }} style={{ width: '100%', height: 140, borderRadius: 12 }} contentFit="cover" />
                        <TouchableOpacity onPress={pickEditImage} style={{ position: 'absolute', bottom: 8, right: 48, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Zmień</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditImageUrl('')} style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, padding: 5 }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={pickEditImage} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <Text style={{ color: '#475569', fontWeight: '800', fontSize: 14 }}>🖼 Dodaj zdjęcie z galerii</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.btnPrimary} onPress={saveEdit}>
                      <Text style={styles.btnPrimaryText}>Zapisz zmiany</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnGhost, { marginBottom: 8 }]} onPress={() => { Keyboard.dismiss(); setEditingItem(null); }}>
                      <Text style={styles.btnGhostText}>Anuluj</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
