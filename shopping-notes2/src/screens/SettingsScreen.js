import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { logout } from '../services/auth';
import { calculateTotalsByCurrency } from '../utils/budget';
import { CURRENCIES, formatCurrencyTotals, formatMoney } from '../utils/currency';
import { STORAGE_KEYS, storage } from '../services/storage';

const DEFAULT_CURRENCY_KEY = 'DEFAULT_CURRENCY';
export const GLOBAL_LIMIT_KEY = 'GLOBAL_BUDGET_LIMIT';

const S = {
  screen: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { padding: 16, paddingBottom: 48 },

  statsCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '400', marginBottom: 2, letterSpacing: 0.5 },
  statValue: { color: '#fff', fontSize: 19, fontWeight: '500' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '400', color: '#94A3B8', marginBottom: 8, letterSpacing: 1, paddingHorizontal: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    overflow: 'hidden',
  },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8F7FF' },
  rowLast: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1E1B4B' },
  rowValue: { color: '#94A3B8', fontSize: 14, fontWeight: '400' },
  rowLabelDanger: { color: '#DC2626' },

  limitRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  limitRowLast: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  limitDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  limitName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  limitValue: { fontSize: 15, fontWeight: '800', color: '#8B5CF6' },
  limitNoValue: { fontSize: 15, fontWeight: '600', color: '#CBD5E1' },
  limitHint: { fontSize: 12, color: '#94A3B8', paddingHorizontal: 14, paddingBottom: 12, fontStyle: 'italic' },

  // Global limit card
  globalLimitCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  globalLimitTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  globalLimitIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  globalLimitLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1E1B4B' },
  globalLimitAmount: { fontSize: 20, fontWeight: '600', color: '#F97316' },
  globalLimitAmountNone: { fontSize: 15, fontWeight: '400', color: '#CBD5E1' },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLeft: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  progressRight: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  editLimitBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editLimitBtnText: { color: '#8B5CF6', fontWeight: '800', fontSize: 14 },
  removeLimitBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  removeLimitBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },

  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
  chipText: { fontWeight: '800', color: '#64748B', fontSize: 14 },
  chipTextActive: { color: '#8B5CF6' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 18, fontWeight: '600', lineHeight: 20 },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  btnPrimary: { backgroundColor: '#8B5CF6', borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 30, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnGhostText: { color: '#64748B', fontSize: 15, fontWeight: '700' },

  version: { textAlign: 'center', color: '#CBD5E1', marginTop: 24, fontSize: 13, fontWeight: '600' },
};

const ACCENT_COLORS = ['#8B5CF6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#EAB308'];

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

function SettingsRow({ icon, iconColor, iconBg, label, value, onPress, danger, last }) {
  return (
    <TouchableOpacity style={last ? S.rowLast : S.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[S.iconBox, { backgroundColor: iconBg || '#EDE9FE' }]}>
        <Ionicons name={icon} size={17} color={iconColor || '#8B5CF6'} />
      </View>
      <Text style={[S.rowLabel, danger && S.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={S.rowValue}>{value}</Text> : null}
      {onPress && !danger ? <Ionicons name="chevron-forward" size={16} color="#CBD5E1" /> : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('PLN');
  const [lists, setLists] = useState([]);
  const [stats, setStats] = useState({ totalBudgetByCurrency: {}, totalSpentByCurrency: {}, listsCount: 0 });
  const [globalLimit, setGlobalLimit] = useState(0);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100) { Keyboard.dismiss(); closeLimitModal(); }
      else { Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(); }
    },
  })).current;

  useEffect(() => {
    AsyncStorage.getItem('USER_EMAIL').then(e => setEmail(e || '—'));
    storage.getValue(DEFAULT_CURRENCY_KEY).then(c => { if (c) setDefaultCurrency(c); });
    storage.getValue(GLOBAL_LIMIT_KEY).then(v => { if (v) setGlobalLimit(Number(v)); });
    loadData();
  }, []);

  const loadData = async () => {
    const savedLists = await storage.get(STORAGE_KEYS.LISTS);
    const allItems = await storage.get(STORAGE_KEYS.ITEMS);
    const allSubscriptions = await storage.get(STORAGE_KEYS.SUBSCRIPTIONS);
    setLists(savedLists);
    const listCurrencyById = Object.fromEntries(savedLists.map(l => [l.id, l.currency || 'PLN']));
    const itemsWithFallbackCurrency = allItems.map(i => ({
      ...i,
      currency: i.currency || listCurrencyById[i.listId] || 'PLN',
    }));
    const totalBudgetByCurrency = savedLists.reduce((totals, l) => {
      const amount = Number(l.budgetLimit) || 0;
      if (amount > 0) {
        const code = l.currency || 'PLN';
        totals[code] = Math.round(((totals[code] || 0) + amount) * 100) / 100;
      }
      return totals;
    }, {});
    setStats({
      totalBudgetByCurrency,
      totalSpentByCurrency: addTotals(
        calculateTotalsByCurrency(itemsWithFallbackCurrency),
        subscriptionTotalsByCurrency(allSubscriptions),
      ),
      listsCount: savedLists.length,
    });
  };

  const openLimitModal = () => {
    setLimitInput(globalLimit ? String(globalLimit) : '');
    translateY.setValue(0);
    setLimitModalVisible(true);
  };

  const closeLimitModal = () => {
    translateY.setValue(0);
    setLimitModalVisible(false);
  };

  const saveGlobalLimit = async () => {
    const val = limitInput.trim().replace(',', '.');
    const n = val === '' ? 0 : Number(val);
    if (val !== '' && (Number.isNaN(n) || n < 0)) {
      Alert.alert('Błąd', 'Podaj prawidłową kwotę ≥ 0.');
      return;
    }
    setGlobalLimit(n);
    await storage.setValue(GLOBAL_LIMIT_KEY, n);
    Keyboard.dismiss();
    closeLimitModal();
  };

  const removeGlobalLimit = async () => {
    setGlobalLimit(0);
    await storage.setValue(GLOBAL_LIMIT_KEY, '0');
    closeLimitModal();
  };

  const onChangeCurrency = async (code) => {
    setDefaultCurrency(code);
    await storage.setValue(DEFAULT_CURRENCY_KEY, code);
  };

  function resetToLogin() {
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
  }

  const onLogout = async () => {
    try { await logout(); resetToLogin(); }
    catch (e) { Alert.alert('Błąd', e?.message || 'Nie udało się wylogować'); }
  };

  const onClearData = () => {
    Alert.alert('Wyczyść dane lokalne', 'Usunie wszystkie listy, produkty i subskrypcje z urządzenia. Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyczyść', style: 'destructive',
        onPress: async () => {
          await storage.set(STORAGE_KEYS.LISTS, []);
          await storage.set(STORAGE_KEYS.ITEMS, []);
          await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, []);
          await loadData();
          Alert.alert('Gotowe', 'Dane lokalne zostały usunięte.');
        },
      },
    ]);
  };

  const totalSpentPln = stats.totalSpentByCurrency.PLN || 0;
  const totalBudgetText = Object.keys(stats.totalBudgetByCurrency).length ? formatCurrencyTotals(stats.totalBudgetByCurrency) : '—';
  const overGlobal = globalLimit > 0 && totalSpentPln > globalLimit;
  const globalProgress = globalLimit > 0 ? Math.min(1, totalSpentPln / globalLimit) : 0;
  const globalPercent = Math.round(globalProgress * 100);

  return (
    <ScrollView style={S.screen} contentContainerStyle={S.content}>
      {/* Budget stats */}
      <View style={S.statsCard}>
        <View style={S.statsRow}>
          <View style={S.statItem}>
            <Text style={S.statLabel}>LISTY</Text>
            <Text style={S.statValue}>{stats.listsCount}</Text>
          </View>
          <View style={S.statItem}>
            <Text style={S.statLabel}>WYDANO</Text>
            <Text style={S.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrencyTotals(stats.totalSpentByCurrency)}
            </Text>
          </View>
          <View style={S.statItem}>
            <Text style={S.statLabel}>LIMIT ŁĄCZNY</Text>
            <Text style={S.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {totalBudgetText}
            </Text>
          </View>
        </View>
      </View>

      {/* Global limit */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>GLOBALNY LIMIT WYDATKÓW</Text>
        <View style={S.globalLimitCard}>
          <View style={S.globalLimitTop}>
            <View style={S.globalLimitIcon}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#F97316" />
            </View>
            <Text style={S.globalLimitLabel}>Limit na zakupy i subskrypcje</Text>
            {globalLimit > 0
              ? <Text style={[S.globalLimitAmount, overGlobal && { color: '#DC2626' }]}>{formatMoney(globalLimit, 'PLN')}</Text>
              : <Text style={S.globalLimitAmountNone}>nie ustawiony</Text>
            }
          </View>

          {globalLimit > 0 && (
            <>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, {
                  width: `${globalPercent}%`,
                  backgroundColor: overGlobal ? '#DC2626' : globalPercent > 75 ? '#F97316' : '#22C55E',
                }]} />
              </View>
              <View style={S.progressRow}>
                <Text style={S.progressLeft}>{formatMoney(totalSpentPln, 'PLN')} wydano</Text>
                <Text style={[S.progressRight, overGlobal && { color: '#DC2626' }]}>{globalPercent}%</Text>
              </View>
            </>
          )}

          <TouchableOpacity style={S.editLimitBtn} onPress={openLimitModal}>
            <Text style={S.editLimitBtnText}>
              {globalLimit > 0 ? 'Zmień limit' : '＋ Ustaw globalny limit'}
            </Text>
          </TouchableOpacity>

          {globalLimit > 0 && (
            <TouchableOpacity style={S.removeLimitBtn} onPress={removeGlobalLimit}>
              <Text style={S.removeLimitBtnText}>Usuń limit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Budget limits per list — read only */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>LIMITY BUDŻETU PER LISTA</Text>
        <View style={S.card}>
          {lists.length === 0 ? (
            <View style={S.rowLast}>
              <Text style={{ color: '#CBD5E1', fontSize: 15, fontWeight: '600' }}>Brak list zakupów</Text>
            </View>
          ) : (
            <>
              {lists.map((list, idx) => {
                const isLast = idx === lists.length - 1;
                const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                return (
                  <View key={list.id} style={isLast ? S.limitRowLast : S.limitRow}>
                    <View style={[S.limitDot, { backgroundColor: color }]} />
                    <Text style={S.limitName} numberOfLines={1}>{list.name}</Text>
                    <Text style={list.budgetLimit ? S.limitValue : S.limitNoValue}>
                      {list.budgetLimit ? formatMoney(list.budgetLimit, list.currency || 'PLN') : 'brak'}
                    </Text>
                  </View>
                );
              })}
              <Text style={S.limitHint}>Aby zmienić limit listy, edytuj ją na ekranie głównym.</Text>
            </>
          )}
        </View>
      </View>

      {/* Preferencje */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>PREFERENCJE</Text>
        <View style={S.card}>
          <View style={S.row}>
            <View style={[S.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cash-outline" size={17} color="#16A34A" />
            </View>
            <Text style={S.rowLabel}>Domyślna waluta</Text>
          </View>
          <View style={S.currencyRow}>
            {CURRENCIES.filter(c => c.code !== 'GBP').map(c => {
              const active = c.code === defaultCurrency;
              return (
                <TouchableOpacity key={c.code} style={[S.chip, active && S.chipActive]} onPress={() => onChangeCurrency(c.code)}>
                  <Text style={[S.chipText, active && S.chipTextActive]}>{c.code} ({c.symbol})</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Konto */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>KONTO</Text>
        <View style={S.card}>
          <SettingsRow icon="person-circle-outline" iconBg="#EAF2FF" iconColor="#1677FF" label="E-mail" value={email} last />
        </View>
      </View>

      {/* Dane */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>DANE</Text>
        <View style={S.card}>
          <SettingsRow icon="trash-outline" iconBg="#FEF2F2" iconColor="#DC2626" label="Wyczyść dane lokalne" onPress={onClearData} last />
        </View>
      </View>

      {/* Sesja */}
      <View style={S.section}>
        <Text style={S.sectionTitle}>SESJA</Text>
        <View style={S.card}>
          <SettingsRow icon="log-out-outline" iconBg="#FEF2F2" iconColor="#DC2626" label="Wyloguj się" onPress={onLogout} danger last />
        </View>
      </View>

      <Text style={S.version}>Shopping Notes v1.0.0</Text>

      {/* Global limit modal */}
      <Modal visible={limitModalVisible} transparent animationType="slide">
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closeLimitModal(); }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View style={[S.sheet, { transform: [{ translateY }] }]}>
              <View {...panResponder.panHandlers}>
                <View style={S.handle} />
              </View>
              <Text style={S.modalTitle}>Globalny limit wydatków</Text>
              <Text style={S.modalSubtitle}>
                Ustaw maksymalną kwotę na wszystkie listy zakupów łącznie. Zostaw puste, aby usunąć limit.
              </Text>
              <TextInput
                style={S.input}
                placeholder="np. 1000"
                keyboardType="decimal-pad"
                value={limitInput}
                onChangeText={setLimitInput}
                returnKeyType="done"
                onSubmitEditing={saveGlobalLimit}
                autoFocus
              />
              <TouchableOpacity style={S.btnPrimary} onPress={saveGlobalLimit}>
                <Text style={S.btnPrimaryText}>Zapisz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnGhost} onPress={() => { Keyboard.dismiss(); closeLimitModal(); }}>
                <Text style={S.btnGhostText}>Anuluj</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}
