import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { logout } from '../services/auth';
import { STORAGE_KEYS, storage } from '../services/storage';
import { syncService } from '../services/sync';
import { startSyncWatcher, stopSyncWatcher } from '../services/syncWatcher';
import { calculateTotal, calculateTotalsByCurrency } from '../utils/budget';
import { CURRENCIES, formatCurrencyTotals, formatMoney } from '../utils/currency';
import { generateId } from '../utils/uuid';

const BLUE = '#8B5CF6';
const GLOBAL_LIMIT_CURRENCY = 'PLN';

const S = {
  screen: { flex: 1, backgroundColor: '#F8F7FF' },

  // Header
  header: {
    backgroundColor: BLUE,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '400', marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '600', color: '#fff', letterSpacing: -0.5 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
  },
  statNum: { fontSize: 20, fontWeight: '500', color: '#fff' },
  statSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '400', marginTop: 2, letterSpacing: 0.5 },

  // List
  listContent: { padding: 16, paddingBottom: 170 },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#94A3B8', marginTop: 16, marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#CBD5E1', textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.13,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    overflow: 'hidden',
  },
  cardAccent: { height: 3, backgroundColor: BLUE },
  cardAccentDone: { backgroundColor: '#22C55E' },
  cardAccentOver: { backgroundColor: '#EF4444' },
  cardBody: { padding: 18 },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#1E1B4B', flex: 1, marginRight: 8 },
  cardBadge: { backgroundColor: '#EDE9FE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  cardBadgeText: { fontSize: 11, fontWeight: '500', color: BLUE },
  cardBadgeDone: { backgroundColor: '#F0FDF4' },
  cardBadgeTextDone: { color: '#22C55E' },

  progressTrack: { height: 3, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 14 },
  progressFill: { height: 3, backgroundColor: BLUE, borderRadius: 3 },
  progressDone: { backgroundColor: '#22C55E' },

  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: {},
  metaLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '400', marginBottom: 2, letterSpacing: 0.5 },
  metaValue: { fontSize: 15, fontWeight: '600', color: '#1E1B4B' },
  metaHint: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  metaOver: { color: '#EF4444' },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F8F7FF',
    marginTop: 14,
    paddingTop: 12,
    gap: 20,
  },
  actionEdit: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionEditText: { color: BLUE, fontWeight: '500', fontSize: 13 },
  actionDelete: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionDeleteText: { color: '#EF4444', fontWeight: '500', fontSize: 13 },

  // Global limit bar
  globalLimitBar: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
  },
  globalLimitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  globalLimitText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '400' },
  globalLimitPct: { color: '#fff', fontSize: 13, fontWeight: '600' },
  globalLimitTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, overflow: 'hidden' },
  globalLimitFill: { height: 6, borderRadius: 6 },
  outsideLimitText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '500', marginTop: 8 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: BLUE,
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BLUE,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  receiptBtn: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: BLUE,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  receiptBtnText: { color: BLUE, fontSize: 15, fontWeight: '700' },

  // Modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 4, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1E1B4B', marginBottom: 20 },
  label: { fontSize: 11, color: '#94A3B8', marginBottom: 8, fontWeight: '400', letterSpacing: 0.8 },
  input: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    marginBottom: 16,
    fontSize: 16,
    color: '#1E1B4B',
  },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  chipActive: { borderColor: BLUE, backgroundColor: '#EDE9FE' },
  chipText: { fontWeight: '800', color: '#64748B', fontSize: 14 },
  chipTextActive: { color: BLUE },
  btnPrimary: { backgroundColor: BLUE, borderRadius: 30, paddingVertical: 15, alignItems: 'center', shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 30, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnGhostText: { color: '#64748B', fontSize: 15, fontWeight: '700' },
};

const LIST_CURRENCIES = CURRENCIES.filter(c => c.code !== 'GBP');

function CurrencyPicker({ value, onChange }) {
  return (
    <View style={S.currencyRow}>
      {LIST_CURRENCIES.map(c => {
        const active = c.code === value;
        return (
          <TouchableOpacity key={c.code} style={[S.chip, active && S.chipActive]} onPress={() => onChange(c.code)}>
            <Text style={[S.chipText, active && S.chipTextActive]}>{c.code} ({c.symbol})</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function splitCurrencyTotals(totals = {}, preferredCurrency = GLOBAL_LIMIT_CURRENCY) {
  const entries = Object.entries(totals).filter(([, amount]) => Number(amount) > 0);
  if (!entries.length) return { primary: '0 zł', secondary: '' };

  const preferred = entries.find(([code]) => code === preferredCurrency);
  const primaryEntry = preferred || entries[0];
  const otherEntries = entries.filter(([code]) => code !== primaryEntry[0]);

  return {
    primary: formatMoney(primaryEntry[1], primaryEntry[0]),
    secondary: otherEntries.map(([code, amount]) => formatMoney(amount, code)).join(' · '),
  };
}

function addTotals(a = {}, b = {}) {
  const totals = { ...a };
  Object.entries(b).forEach(([code, amount]) => {
    totals[code] = Math.round(((totals[code] || 0) + (Number(amount) || 0)) * 100) / 100;
  });
  return totals;
}

function subscriptionTotalsByCurrency(subscriptions = []) {
  return subscriptions.reduce((totals, sub) => {
    const amount = Number(sub.amount) || 0;
    if (amount > 0) {
      const code = sub.currency || 'PLN';
      totals[code] = Math.round(((totals[code] || 0) + amount) * 100) / 100;
    }
    return totals;
  }, {});
}

function ListCard({ item, refreshKey, onPress, onEdit, onDelete }) {
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [allTotalsText, setAllTotalsText] = useState('0 zł');
  const [hasMixedCurrencies, setHasMixedCurrencies] = useState(false);
  const [counts, setCounts] = useState({ bought: 0, total: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const allItems = await storage.get(STORAGE_KEYS.ITEMS);
      const listItems = allItems.filter(i => String(i.listId) === String(item.id));
      const listCurrency = item.currency || 'PLN';
      const totalsByCurrency = calculateTotalsByCurrency(listItems, listCurrency);
      if (mounted) {
        setBudgetTotal(calculateTotal(listItems, listCurrency, listCurrency));
        setAllTotalsText(formatCurrencyTotals(totalsByCurrency));
        setHasMixedCurrencies(Object.keys(totalsByCurrency).filter(code => totalsByCurrency[code] > 0).length > 1);
        setCounts({ bought: listItems.filter(i => i.bought).length, total: listItems.length });
      }
    }
    load();
    return () => { mounted = false; };
  }, [item.id, item.currency, item.updatedAt, refreshKey]);

  const progress = counts.total > 0 ? counts.bought / counts.total : 0;
  const allDone = counts.total > 0 && counts.bought === counts.total;
  const listCurrency = item.currency || 'PLN';
  const overBudget = item.budgetLimit > 0 && budgetTotal > item.budgetLimit;

  const accentStyle = allDone ? S.cardAccentDone : overBudget ? S.cardAccentOver : S.cardAccent;

  return (
    <TouchableOpacity style={S.card} activeOpacity={0.82} onPress={onPress}>
      <View style={[S.cardAccent, accentStyle]} />
      <View style={S.cardBody}>
        <View style={S.cardRow}>
          <Text style={S.cardName} numberOfLines={1}>{item.name}</Text>
          {counts.total > 0 && (
            <View style={[S.cardBadge, allDone && S.cardBadgeDone]}>
              <Text style={[S.cardBadgeText, allDone && S.cardBadgeTextDone]}>
                {allDone ? '✓ Gotowe' : `${counts.bought}/${counts.total}`}
              </Text>
            </View>
          )}
        </View>

        {counts.total > 0 && (
          <View style={S.progressTrack}>
            <View style={[S.progressFill, { width: `${Math.round(progress * 100)}%` }, allDone && S.progressDone]} />
          </View>
        )}

        <View style={S.cardMeta}>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>BUDŻET</Text>
            <Text style={S.metaValue}>
              {item.budgetLimit ? formatMoney(item.budgetLimit, item.currency || 'PLN') : '—'}
            </Text>
          </View>
          <View style={[S.metaItem, { alignItems: 'flex-end' }]}>
            <Text style={S.metaLabel}>RAZEM</Text>
            <Text style={[S.metaValue, overBudget && S.metaOver]} numberOfLines={1} adjustsFontSizeToFit>
              {allTotalsText}{overBudget ? ' ⚠' : ''}
            </Text>
            {hasMixedCurrencies && item.budgetLimit > 0 && (
              <Text style={[S.metaHint, overBudget && S.metaOver]} numberOfLines={1}>
                W budżecie: {formatMoney(budgetTotal, listCurrency)} / {formatMoney(item.budgetLimit, listCurrency)}
              </Text>
            )}
          </View>
        </View>

        <View style={S.cardActions}>
          <TouchableOpacity style={S.actionEdit} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={14} color={BLUE} />
            <Text style={S.actionEditText}>Edytuj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.actionDelete} onPress={onDelete}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={S.actionDeleteText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ModalForm({ visible, title, nameVal, setNameVal, budgetVal, setBudgetVal, currencyVal, setCurrencyVal, onSave, onCancel }) {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100) {
        Keyboard.dismiss();
        onCancel();
        translateY.setValue(0);
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  useEffect(() => { if (visible) translateY.setValue(0); }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onCancel(); }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[S.modalCard, { transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers}>
              <View style={S.modalHandle} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={S.modalTitle}>{title}</Text>
              <Text style={S.label}>NAZWA</Text>
              <TextInput
                placeholder="np. Zara, Biedronka"
                value={nameVal}
                onChangeText={setNameVal}
                style={S.input}
                returnKeyType="next"
              />
              <Text style={S.label}>BUDŻET (opcjonalnie)</Text>
              <TextInput
                placeholder="np. 200"
                value={budgetVal}
                onChangeText={v => setBudgetVal(v.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                keyboardType="decimal-pad"
                style={S.input}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={S.label}>WALUTA</Text>
              <CurrencyPicker value={currencyVal} onChange={setCurrencyVal} />
              <TouchableOpacity style={S.btnPrimary} onPress={onSave}>
                <Text style={S.btnPrimaryText}>Zapisz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnGhost} onPress={() => { Keyboard.dismiss(); onCancel(); }}>
                <Text style={S.btnGhostText}>Anuluj</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function ListsScreen({ navigation }) {
  const [lists, setLists] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [totalSpentByCurrency, setTotalSpentByCurrency] = useState({});
  const [globalLimit, setGlobalLimit] = useState(0);
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);

  const [createVisible, setCreateVisible] = useState(false);
  const [shopName, setShopName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('PLN');

  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editCurrency, setEditCurrency] = useState('PLN');

  const migrateLists = async (saved) => {
    let changed = false;
    const migrated = saved.map(l => {
      if (!l.currency) { changed = true; return { ...l, currency: 'PLN' }; }
      return l;
    });
    if (changed) await storage.set(STORAGE_KEYS.LISTS, migrated);
    return migrated;
  };

  const load = useCallback(async () => {
    const saved = await storage.get(STORAGE_KEYS.LISTS);
    const migratedLists = await migrateLists(saved);
    setLists(migratedLists);
    const allItems = await storage.get(STORAGE_KEYS.ITEMS);
    const listCurrencyById = Object.fromEntries(migratedLists.map(l => [l.id, l.currency || 'PLN']));
    const itemsWithFallbackCurrency = allItems.map(i => ({
      ...i,
      currency: i.currency || listCurrencyById[i.listId] || 'PLN',
    }));
    const allSubscriptions = await storage.get(STORAGE_KEYS.SUBSCRIPTIONS);
    setTotalSpentByCurrency(addTotals(
      calculateTotalsByCurrency(itemsWithFallbackCurrency),
      subscriptionTotalsByCurrency(allSubscriptions),
    ));
    setItemsRefreshKey(Date.now());
    const email = await AsyncStorage.getItem('USER_EMAIL');
    if (email) setUserEmail(email);
    const gl = await storage.getValue('GLOBAL_BUDGET_LIMIT');
    setGlobalLimit(Number(gl) || 0);
  }, []);

  useEffect(() => {
    load();
    syncService().then(load).catch(() => {});
    startSyncWatcher(load);
    return () => stopSyncWatcher();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    await syncService().catch(() => {});
    await load();
    setRefreshing(false);
  }, [load]);

  const handleLogout = async () => {
    await logout();
    let nav = navigation;
    while (nav) {
      const state = nav.getState?.();
      if (state?.routeNames?.includes('Login')) {
        nav.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      nav = nav.getParent?.();
    }
    navigation.navigate('Login');
  };

  const openCreate = () => { setShopName(''); setBudget(''); setCurrency('PLN'); setCreateVisible(true); };

  const addList = async () => {
    if (!shopName.trim()) { Alert.alert('Błędna nazwa', 'Wpisz nazwę listy.'); return; }
    const b = budget.trim() ? Number(budget) : 0;
    if (budget.trim() && (Number.isNaN(b) || b < 0)) { Alert.alert('Błędny budżet', 'Wpisz liczbę ≥ 0.'); return; }
    const newList = { id: generateId(), name: shopName.trim(), budgetLimit: b, currency, updatedAt: Date.now() };
    const updated = [newList, ...lists];
    setLists(updated);
    await storage.set(STORAGE_KEYS.LISTS, updated);
    setCreateVisible(false);
  };

  const openEdit = (list) => {
    setEditTarget(list);
    setEditName(list.name);
    setEditBudget(list.budgetLimit ? String(list.budgetLimit) : '');
    setEditCurrency(list.currency || 'PLN');
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) { Alert.alert('Błędna nazwa', 'Wpisz nazwę listy.'); return; }
    const b = editBudget.trim() ? Number(editBudget) : 0;
    if (editBudget.trim() && (Number.isNaN(b) || b < 0)) { Alert.alert('Błędny budżet', 'Wpisz liczbę ≥ 0.'); return; }
    if ((editTarget.currency || 'PLN') !== editCurrency) {
      const allItems = await storage.get(STORAGE_KEYS.ITEMS);
      const updatedItems = allItems.map(i =>
        String(i.listId) === String(editTarget.id) && !i.currency
          ? { ...i, currency: editTarget.currency || 'PLN', updatedAt: Date.now() }
          : i,
      );
      await storage.set(STORAGE_KEYS.ITEMS, updatedItems);
    }
    const updated = lists.map(l =>
      l.id === editTarget.id
        ? { ...l, name: editName.trim(), budgetLimit: b, currency: editCurrency, updatedAt: Date.now() }
        : l,
    );
    setLists(updated);
    await storage.set(STORAGE_KEYS.LISTS, updated);
    setEditVisible(false);
  };

  const deleteList = (list) => {
    Alert.alert('Usuń listę', `Usunąć "${list.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          const updatedLists = lists.filter(l => l.id !== list.id);
          setLists(updatedLists);
          await storage.set(STORAGE_KEYS.LISTS, updatedLists);
          const allItems = await storage.get(STORAGE_KEYS.ITEMS);
          await storage.set(STORAGE_KEYS.ITEMS, allItems.filter(i => String(i.listId) !== String(list.id)));
        },
      },
    ]);
  };

  const name = userEmail ? userEmail.split('@')[0] : null;
  const spentSummary = splitCurrencyTotals(totalSpentByCurrency);
  const totalSpentPln = totalSpentByCurrency[GLOBAL_LIMIT_CURRENCY] || 0;
  const outsideLimitTotals = Object.fromEntries(
    Object.entries(totalSpentByCurrency).filter(([code, amount]) => code !== GLOBAL_LIMIT_CURRENCY && amount > 0),
  );
  const outsideLimitText = formatCurrencyTotals(outsideLimitTotals);

  return (
    <View style={S.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Custom header */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <View>
            <Text style={S.headerGreeting}>{name ? `Cześć, ${name} 👋` : 'Witaj!'}</Text>
            <Text style={S.headerTitle}>Moje listy</Text>
          </View>
          <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statNum}>{lists.length}</Text>
            <Text style={S.statLabel}>LISTY</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum} numberOfLines={1} adjustsFontSizeToFit>{spentSummary.primary}</Text>
            {!!spentSummary.secondary && <Text style={S.statSub} numberOfLines={1}>+ {spentSummary.secondary}</Text>}
            <Text style={S.statLabel}>WYDANO</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum} numberOfLines={1} adjustsFontSizeToFit>
              {globalLimit > 0 ? formatMoney(globalLimit, GLOBAL_LIMIT_CURRENCY) : '—'}
            </Text>
            <Text style={S.statLabel}>LIMIT</Text>
          </View>
        </View>

        {globalLimit > 0 && (() => {
          const pct = Math.min(1, totalSpentPln / globalLimit);
          const over = totalSpentPln > globalLimit;
          const fillColor = over ? '#FCA5A5' : pct > 0.75 ? '#FCD34D' : '#86EFAC';
          return (
            <View style={S.globalLimitBar}>
              <View style={S.globalLimitRow}>
                <Text style={S.globalLimitText}>
                  Globalny limit: {formatMoney(totalSpentPln, 'PLN')} / {formatMoney(globalLimit, 'PLN')}
                </Text>
                <Text style={[S.globalLimitPct, over && { color: '#FCA5A5' }]}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>
              <View style={S.globalLimitTrack}>
                <View style={[S.globalLimitFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: fillColor }]} />
              </View>
              {!!Object.keys(outsideLimitTotals).length && (
                <Text style={S.outsideLimitText}>Poza limitem: {outsideLimitText}</Text>
              )}
            </View>
          );
        })()}
      </View>

      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        contentContainerStyle={S.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        ListEmptyComponent={
          <View style={S.emptyWrap}>
            <Ionicons name="cart-outline" size={72} color="#CBD5E1" />
            <Text style={S.emptyText}>Brak list zakupów</Text>
            <Text style={S.emptyHint}>Naciśnij przycisk poniżej,{'\n'}aby dodać pierwszą listę</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ListCard
            item={item}
            refreshKey={itemsRefreshKey}
            onPress={() => navigation.navigate('ListDetails', { listId: item.id })}
            onEdit={() => openEdit(item)}
            onDelete={() => deleteList(item)}
          />
        )}
      />

      <TouchableOpacity
        style={S.receiptBtn}
        onPress={() => navigation.navigate('ReceiptImport')}
        activeOpacity={0.88}
      >
        <Ionicons name="receipt-outline" size={20} color={BLUE} />
        <Text style={S.receiptBtnText}>Dodaj paragon AI</Text>
      </TouchableOpacity>

      <TouchableOpacity style={S.fab} onPress={openCreate} activeOpacity={0.88}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={S.fabText}>Nowa lista</Text>
      </TouchableOpacity>

      <ModalForm
        visible={createVisible}
        title="Nowa lista"
        nameVal={shopName} setNameVal={setShopName}
        budgetVal={budget} setBudgetVal={setBudget}
        currencyVal={currency} setCurrencyVal={setCurrency}
        onSave={addList}
        onCancel={() => setCreateVisible(false)}
      />
      <ModalForm
        visible={editVisible}
        title="Edytuj listę"
        nameVal={editName} setNameVal={setEditName}
        budgetVal={editBudget} setBudgetVal={setEditBudget}
        currencyVal={editCurrency} setCurrencyVal={setEditCurrency}
        onSave={saveEdit}
        onCancel={() => setEditVisible(false)}
      />
    </View>
  );
}
