import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { API_URL } from '../config';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BG, BORDER, INPUT_BG, P, P_LIGHT, TEXT, TEXT2 } from '../theme';

const S = {
  screen: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  topCircle: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: P_LIGHT,
    opacity: 0.7,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: P_LIGHT,
    opacity: 0.5,
  },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: P,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: P,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoText: { fontSize: 28, color: '#fff', fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '600', color: TEXT, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: TEXT2, textAlign: 'center', marginTop: 6, lineHeight: 22, fontWeight: '400' },

  form: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginTop: 28,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  fieldLabel: { fontSize: 11, fontWeight: '400', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 16,
  },
  inputRowFocus: { borderColor: P },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: TEXT, height: '100%' },

  btn: {
    backgroundColor: P,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: P,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },

  bottomLink: { marginTop: 28, alignItems: 'center' },
  bottomLinkText: { color: TEXT2, fontSize: 15 },
  bottomLinkAccent: { color: P, fontWeight: '800' },
};

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  const register = async () => {
    if (!email.includes('@') || password.length < 4) {
      Alert.alert('Błędne dane', 'Podaj poprawny e-mail i hasło (min. 4 znaki).');
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let res;
      try {
        res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
      } finally { clearTimeout(timeout); }
      const data = await res.json();
      if (res.ok && data.access_token) {
        navigation.replace('Login');
      } else {
        Alert.alert('Błąd rejestracji', data.message || 'Coś poszło nie tak.');
      }
    } catch (err) {
      Alert.alert('Błąd połączenia', err.name === 'AbortError'
        ? 'Brak połączenia z serwerem.'
        : err.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={S.topCircle} />
      <View style={S.bottomCircle} />

      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
        <View style={S.logoWrap}>
          <View style={S.logoCircle}>
            <Text style={S.logoText}>S</Text>
          </View>
          <Text style={S.title}>Utwórz konto</Text>
          <Text style={S.subtitle}>Dołącz i zacznij planować{'\n'}zakupy w jednym miejscu</Text>
        </View>

        <View style={S.form}>
          <Text style={S.fieldLabel}>E-MAIL</Text>
          <View style={[S.inputRow, emailFocus && S.inputRowFocus]}>
            <Ionicons name="mail-outline" size={20} color={emailFocus ? P : '#9CA3AF'} style={S.inputIcon} />
            <TextInput
              style={S.input}
              placeholder="twoj@email.com"
              placeholderTextColor="#C4B5FD"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
            />
          </View>

          <Text style={S.fieldLabel}>HASŁO</Text>
          <View style={[S.inputRow, passFocus && S.inputRowFocus]}>
            <Ionicons name="lock-closed-outline" size={20} color={passFocus ? P : '#9CA3AF'} style={S.inputIcon} />
            <TextInput
              style={S.input}
              placeholder="min. 4 znaki"
              placeholderTextColor="#C4B5FD"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={register}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
            />
          </View>

          <TouchableOpacity style={S.btn} onPress={register} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnText}>Utwórz konto</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={S.bottomLink} onPress={() => navigation.replace('Login')}>
          <Text style={S.bottomLinkText}>
            Masz już konto?{' '}
            <Text style={S.bottomLinkAccent}>Zaloguj się</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
