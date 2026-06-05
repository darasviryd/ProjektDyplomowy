import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  FlatList,
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

import { cancelSubNotification, requestNotificationPermission, scheduleSubNotification } from '../services/notifications';
import { STORAGE_KEYS, storage } from '../services/storage';
import { CURRENCIES, formatMoney } from '../utils/currency';
import { generateId } from '../utils/uuid';

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(Math.max(x, min), max);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function billingDateForMonth(year, month, billingDay) {
  const day = Math.min(clamp(billingDay, 1, 31), daysInMonth(year, month));
  return new Date(year, month, day, 10, 0, 0);
}

function nextBillingDate(billingDay) {
  const now = new Date();
  const thisMonth = billingDateForMonth(now.getFullYear(), now.getMonth(), billingDay);
  if (thisMonth.getTime() >= now.getTime()) return thisMonth;
  return billingDateForMonth(now.getFullYear(), now.getMonth() + 1, billingDay);
}

function daysUntil(date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - start) / 86400000);
}

function urgencyColor(d) {
  if (d <= 0) return '#DC2626';
  if (d <= 3) return '#F97316';
  if (d <= 7) return '#EAB308';
  return '#16A34A';
}

function statusLabel(d) {
  if (d < 0) return 'Przeterminowane';
  if (d === 0) return 'DZIŚ';
  return `Za ${d} dni`;
}

const S = {
  screen: { flex: 1, backgroundColor: '#F7F8FA' },

  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  summaryLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 5, letterSpacing: 0.4 },
  summaryAmount: { color: '#111827', fontSize: 28, fontWeight: '700' },
  summaryMeta: { color: '#64748B', fontSize: 12, marginTop: 4 },

  addBtn: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 6,
  },
  addBtnText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },

  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginBottom: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 0 },
  cardBody: { flex: 1, paddingVertical: 16, paddingHorizontal: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardAmount: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  cardMeta: { color: '#94A3B8', fontSize: 12, fontWeight: '400' },
  cardRight: { justifyContent: 'center', alignItems: 'center', paddingRight: 16, paddingLeft: 4 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: 'center',
    minWidth: 72,
  },
  badgeText: { fontWeight: '700', fontSize: 11 },

  // shared modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },

  // detail sheet
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, paddingTop: 10, gap: 12 },
  detailAccentDot: { width: 14, height: 14, borderRadius: 7 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#111827', flex: 1 },
  detailAmount: { fontSize: 30, fontWeight: '800', marginHorizontal: 18, marginBottom: 4 },
  detailSection: { marginHorizontal: 18, marginTop: 12 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  detailDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 18, marginTop: 16 },
  detailActions: { flexDirection: 'row', gap: 10, margin: 18, marginTop: 20 },
  btnEdit: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnEditText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDelete: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  btnDeleteText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },

  // form modal
  formSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: '#111827', paddingHorizontal: 18, paddingBottom: 14 },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    fontSize: 16,
    marginHorizontal: 18,
  },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, marginHorizontal: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginHorizontal: 18 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: '#CBD5E1' },
  chipActive: { borderColor: '#8B5CF6', backgroundColor: '#EDE9FE' },
  chipText: { fontWeight: '800', color: '#475569' },
  chipTextActive: { color: '#8B5CF6' },
  btnPrimary: { backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 18, marginTop: 4 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 18, marginTop: 10 },
  btnGhostText: { color: '#111827', fontSize: 16, fontWeight: '700' },
};

const SUB_CURRENCIES = CURRENCIES.filter(c => c.code !== 'GBP');

function FormModal({ visible, title, name, setName, amount, setAmount, currency, setCurrency,
  billingDay, setBillingDay, notifyDaysBefore, setNotifyDaysBefore, onSave, onCancel }) {
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[S.formSheet, { transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers}>
              <View style={S.handle} />
              <Text style={[S.formTitle, { paddingTop: 10 }]}>{title}</Text>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}>

              <Text style={S.fieldLabel}>Nazwa</Text>
              <TextInput
                style={S.input}
                placeholder="np. Netflix, Spotify"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />

              <Text style={S.fieldLabel}>Kwota miesięczna</Text>
              <TextInput
                style={S.input}
                placeholder="np. 29.99"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                returnKeyType="next"
              />

              <Text style={S.fieldLabel}>Waluta</Text>
              <View style={S.chipRow}>
                {SUB_CURRENCIES.map(c => {
                  const active = c.code === currency;
                  return (
                    <TouchableOpacity key={c.code} style={[S.chip, active && S.chipActive]} onPress={() => setCurrency(c.code)}>
                      <Text style={[S.chipText, active && S.chipTextActive]}>{c.code} ({c.symbol})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={S.fieldLabel}>Dzień płatności w miesiącu (1–31)</Text>
              <TextInput
                style={S.input}
                placeholder="np. 15"
                keyboardType="number-pad"
                value={billingDay}
                onChangeText={setBillingDay}
                returnKeyType="next"
              />

              <Text style={S.fieldLabel}>Przypomnij ile dni wcześniej (0–14)</Text>
              <TextInput
                style={S.input}
                placeholder="np. 3"
                keyboardType="number-pad"
                value={notifyDaysBefore}
                onChangeText={setNotifyDaysBefore}
                returnKeyType="done"
                onSubmitEditing={onSave}
              />

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

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState([]);
  const [detailSub, setDetailSub] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const permissionRequested = useRef(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PLN');
  const [billingDay, setBillingDay] = useState('1');
  const [notifyDaysBefore, setNotifyDaysBefore] = useState('2');

  useEffect(() => {
    storage.get(STORAGE_KEYS.SUBSCRIPTIONS).then(setSubs);
    if (!permissionRequested.current) {
      permissionRequested.current = true;
      requestNotificationPermission();
    }
  }, []);

  const sortedSubs = useMemo(() => {
    return [...subs].sort((a, b) => {
      return daysUntil(nextBillingDate(a.billingDay)) - daysUntil(nextBillingDate(b.billingDay));
    });
  }, [subs]);

  const totalMonthly = useMemo(() => {
    const byCode = {};
    subs.forEach(s => {
      byCode[s.currency] = (byCode[s.currency] || 0) + s.amount;
    });
    return byCode;
  }, [subs]);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setCurrency('PLN');
    setBillingDay('');
    setNotifyDaysBefore('');
    setFormVisible(true);
  };

  const openEdit = (sub) => {
    setDetailSub(null);
    setEditingId(sub.id);
    setName(sub.name);
    setAmount(String(sub.amount));
    setCurrency(sub.currency);
    setBillingDay(String(sub.billingDay));
    setNotifyDaysBefore(String(sub.notifyDaysBefore));
    setFormVisible(true);
  };

  const validateAndBuild = () => {
    const a = parseFloat(String(amount).replace(',', '.'));
    const d = Number(billingDay);
    const before = Number(notifyDaysBefore);
    if (!name.trim()) { Alert.alert('Błędne dane', 'Podaj nazwę subskrypcji.'); return null; }
    if (!Number.isFinite(a) || a <= 0) { Alert.alert('Błędne dane', 'Kwota musi być > 0.'); return null; }
    if (!Number.isFinite(d) || d < 1 || d > 31) { Alert.alert('Błędne dane', 'Dzień musi być 1-31.'); return null; }
    if (!Number.isFinite(before) || before < 0 || before > 14) { Alert.alert('Błędne dane', 'Powiadomienie: 0-14 dni.'); return null; }
    return { name: name.trim(), amount: Math.round(a * 100) / 100, currency, billingDay: d, notifyDaysBefore: before };
  };

  const onSave = async () => {
    const data = validateAndBuild();
    if (!data) return;

    let updated;
    if (editingId) {
      updated = subs.map(s => s.id === editingId ? { ...s, ...data, updatedAt: Date.now() } : s);
      await cancelSubNotification(editingId);
      const edited = updated.find(s => s.id === editingId);
      await scheduleSubNotification(edited, nextBillingDate, formatMoney);
    } else {
      const newSub = { id: generateId(), ...data, updatedAt: Date.now() };
      updated = [newSub, ...subs];
      await scheduleSubNotification(newSub, nextBillingDate, formatMoney);
    }

    setSubs(updated);
    await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, updated);
    Keyboard.dismiss();
    setFormVisible(false);
  };

  const remove = (sub) => {
    Alert.alert(
      'Usuń subskrypcję',
      `Czy na pewno chcesz usunąć "${sub.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            setDetailSub(null);
            const updated = subs.filter(s => s.id !== sub.id);
            setSubs(updated);
            await storage.set(STORAGE_KEYS.SUBSCRIPTIONS, updated);
            await cancelSubNotification(sub.id);
          },
        },
      ],
    );
  };

  const totalLine = Object.entries(totalMonthly)
    .map(([code, sum]) => formatMoney(sum, code))
    .join(' + ') || '0 zł';

  return (
    <View style={S.screen}>
      {/* Summary card */}
      <View style={S.summaryCard}>
        <Text style={S.summaryLabel}>Łączne wydatki miesięczne</Text>
        <Text style={S.summaryAmount}>{totalLine}</Text>
        <Text style={S.summaryMeta}>{subs.length} {subs.length === 1 ? 'subskrypcja' : subs.length < 5 ? 'subskrypcje' : 'subskrypcji'}</Text>
      </View>

      {/* Add button */}
      <TouchableOpacity style={S.addBtn} onPress={openAdd}>
        <Text style={{ fontSize: 20, color: '#8B5CF6', lineHeight: 22 }}>＋</Text>
        <Text style={S.addBtnText}>Dodaj subskrypcję</Text>
      </TouchableOpacity>

      <FlatList
        data={sortedSubs}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 30 }}
        renderItem={({ item }) => {
          const payAt = nextBillingDate(item.billingDay);
          const d = daysUntil(payAt);
          const color = urgencyColor(d);
          const label = statusLabel(d);

          return (
            <TouchableOpacity style={S.card} onPress={() => setDetailSub(item)} activeOpacity={0.75}>
              <View style={S.cardBody}>
                <Text style={S.cardName}>{item.name}</Text>
                <Text style={[S.cardAmount, { color }]}>{formatMoney(item.amount, item.currency)}</Text>
                <Text style={S.cardMeta}>Dzień {item.billingDay} każdego miesiąca</Text>
              </View>
              <View style={S.cardRight}>
                <View style={[S.badge, { backgroundColor: color + '18' }]}>
                  <Text style={[S.badgeText, { color }]}>{label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Detail bottom sheet */}
      {detailSub && (() => {
        const sub = detailSub;
        const payAt = nextBillingDate(sub.billingDay);
        const d = daysUntil(payAt);
        const color = urgencyColor(d);
        const label = statusLabel(d);

        return (
          <Modal visible={!!detailSub} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={() => setDetailSub(null)}>
              <View style={S.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[S.sheet, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
              <View style={S.handle} />

              <View style={S.detailHeader}>
                <View style={[S.detailAccentDot, { backgroundColor: color }]} />
                <Text style={S.detailName}>{sub.name}</Text>
              </View>

              <Text style={[S.detailAmount, { color }]}>{formatMoney(sub.amount, sub.currency)}</Text>

              <View style={[S.badge, { alignSelf: 'flex-start', marginLeft: 18, marginTop: 4, backgroundColor: color + '18' }]}>
                <Text style={[S.badgeText, { color }]}>{label}</Text>
              </View>

              <View style={S.detailDivider} />

              <View style={S.detailSection}>
                <Text style={S.detailLabel}>NASTĘPNA PŁATNOŚĆ</Text>
                <Text style={S.detailValue}>{payAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>

              <View style={S.detailSection}>
                <Text style={S.detailLabel}>DZIEŃ PŁATNOŚCI</Text>
                <Text style={S.detailValue}>{sub.billingDay}. każdego miesiąca</Text>
              </View>

              <View style={S.detailSection}>
                <Text style={S.detailLabel}>PRZYPOMNIENIE</Text>
                <Text style={S.detailValue}>{sub.notifyDaysBefore === 0 ? 'Wyłączone' : `${sub.notifyDaysBefore} ${sub.notifyDaysBefore === 1 ? 'dzień' : 'dni'} wcześniej`}</Text>
              </View>

              <View style={S.detailActions}>
                <TouchableOpacity style={S.btnEdit} onPress={() => openEdit(sub)}>
                  <Text style={S.btnEditText}>Edytuj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.btnDelete} onPress={() => remove(sub)}>
                  <Text style={S.btnDeleteText}>Usuń</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Add / Edit form */}
      <FormModal
        visible={formVisible}
        title={editingId ? 'Edytuj subskrypcję' : 'Nowa subskrypcja'}
        name={name} setName={setName}
        amount={amount} setAmount={setAmount}
        currency={currency} setCurrency={setCurrency}
        billingDay={billingDay} setBillingDay={setBillingDay}
        notifyDaysBefore={notifyDaysBefore} setNotifyDaysBefore={setNotifyDaysBefore}
        onSave={onSave}
        onCancel={() => { Keyboard.dismiss(); setFormVisible(false); }}
      />
    </View>
  );
}
