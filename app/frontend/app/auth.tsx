import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.replace('/(tabs)/contacts');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { padding: 24, borderRadius: 16 }]}>
            <Ionicons name="shield-checkmark" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={[styles.title, { fontSize: 24, marginBottom: 24 }]}>
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Text>

            {!isLogin && (
              <TextInput
                style={[styles.input, { fontSize: 16, padding: 14, marginBottom: 12, borderRadius: 10 }]}
                placeholder="Nome"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={[styles.input, { fontSize: 16, padding: 14, marginBottom: 12, borderRadius: 10 }]}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, { fontSize: 16, padding: 14, marginBottom: 24, borderRadius: 10 }]}
              placeholder="Senha"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryButton, { paddingVertical: 14, borderRadius: 10, marginBottom: 12 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>
                {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.switchText, { fontSize: 14 }]}>
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  switchText: {
    color: theme.colors.primary,
    textAlign: 'center',
  },
});
