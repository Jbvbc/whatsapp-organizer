import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { get as apiGet, post as apiPost } from '../services/api';
import * as Contacts from 'expo-contacts';

export default function WelcomeScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
      return;
    }
    if (!loading && user) {
      checkExistingContacts();
    }
  }, [loading, user]);

  const checkExistingContacts = async () => {
    try {
      const { data } = await apiGet<any[]>('/api/contacts');
      if (data.length > 0) {
        router.replace('/(tabs)/contacts');
      }
    } catch (error) {
      console.error('Error checking contacts:', error);
    }
  };

  const requestPermissionsAndImport = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar seus contatos do WhatsApp.', [{ text: 'OK' }]);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      if (data.length > 0) {
        const formattedContacts = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => ({
            name: contact.name || 'Sem Nome',
            phone: contact.phoneNumbers[0].number.replace(/\D/g, ''),
            photo: contact.image?.base64 || null,
            rawContactId: contact.id,
            tags: [],
            notes: '',
            isFavorite: false,
          }));

        const result = await apiPost<any>('/api/contacts/sync', formattedContacts);
        Alert.alert('Sucesso!', `${result.count} contatos importados com sucesso!`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/contacts') },
        ]);
      } else {
        Alert.alert('Aviso', 'Nenhum contato encontrado no dispositivo.');
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert('Erro', 'Falha ao importar contatos. Tente novamente.');
    }
  };

  const skipImport = () => {
    router.replace('/(tabs)/contacts');
  };

  if (loading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="people-circle" size={rs(120)} color={colors.primary} />
        <Text style={[styles.title, { fontSize: rs(32) }]}>Organizador de Contatos</Text>
        <Text style={[styles.subtitle, { fontSize: rs(24) }]}>WhatsApp</Text>
        <Text style={[styles.description, { fontSize: rs(16) }]}>
          Organize seus contatos com tags, grupos e muito mais!
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, { paddingVertical: rs(16), paddingHorizontal: rs(32), borderRadius: rs(12), minWidth: rs(250) }]}
          onPress={requestPermissionsAndImport}
        >
          <Ionicons name="download" size={rs(24)} color={colors.text} />
          <Text style={[styles.primaryButtonText, { fontSize: rs(18) }]}>Importar Contatos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { paddingVertical: rs(12), paddingHorizontal: rs(24) }]}
          onPress={skipImport}
        >
          <Text style={[styles.secondaryButtonText, { fontSize: rs(16) }]}>Pular</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.primary,
    marginBottom: 16,
  },
  description: {
    color: theme.colors.textDim,
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  secondaryButton: {},
  secondaryButtonText: {
    color: theme.colors.textSecondary,
  },
});
