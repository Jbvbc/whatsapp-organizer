import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get as apiGet } from '../services/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
  contactIds: string[];
  contacts: Contact[];
}

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const { data } = await apiGet<any>(`/api/groups/${id}`, `group_${id}`);
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppToAll = () => {
    if (!group || group.contacts.length === 0) {
      Alert.alert('Erro', 'Nenhum contato no grupo.');
      return;
    }

    Alert.alert(
      'Enviar Mensagem',
      `Enviar mensagem do WhatsApp para ${group.contacts.length} contatos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            group.contacts.forEach((contact, index) => {
              setTimeout(() => {
                const cleanPhone = contact.phone.replace(/\D/g, '');
                const url = `whatsapp://send?phone=${cleanPhone}`;
                Linking.openURL(url).catch(() => {
                  Alert.alert('Erro', `Não foi possível abrir WhatsApp para ${contact.name}`);
                });
              }, index * 2000);
            });
          },
        },
      ]
    );
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    });
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={[styles.contactCard, { padding: rs(16), marginBottom: rs(12), borderRadius: rs(12) }]}>
      <View style={[styles.contactAvatar, { width: rs(50), height: rs(50), borderRadius: rs(25) }]}>
        <Text style={[styles.avatarText, { fontSize: rs(24) }]}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={[styles.contactInfo, { marginLeft: rs(12) }]}>
        <Text style={[styles.contactName, { fontSize: rs(18) }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { fontSize: rs(14) }]}>{item.phone}</Text>
      </View>
      <TouchableOpacity onPress={() => openWhatsApp(item.phone)}>
        <Ionicons name="logo-whatsapp" size={rs(24)} color={colors.whatsapp} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.loadingText, { fontSize: rs(16) }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.loadingText, { fontSize: rs(16) }]}>Grupo não encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingVertical: rs(24) }]}>
        <View style={[styles.groupIcon, { backgroundColor: group.color, width: rs(80), height: rs(80), borderRadius: rs(40), marginBottom: rs(16) }]}>
          <Ionicons name="people" size={rs(40)} color={colors.text} />
        </View>
        <Text style={[styles.groupName, { fontSize: rs(24), marginBottom: rs(8) }]}>{group.name}</Text>
        <Text style={[styles.groupCount, { fontSize: rs(16) }]}>{group.contacts.length} contatos</Text>
      </View>

      <FlatList
        data={group.contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { padding: rs(16) }]}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: rs(48) }]}>
            <Text style={[styles.emptyText, { fontSize: rs(16) }]}>Nenhum contato no grupo</Text>
          </View>
        }
      />

      {group.contacts.length > 0 && (
        <View style={[styles.footer, { padding: rs(16) }]}>
          <TouchableOpacity
            style={[styles.sendAllButton, { padding: rs(16), borderRadius: rs(12), gap: rs(8) }]}
            onPress={sendWhatsAppToAll}
          >
            <Ionicons name="logo-whatsapp" size={rs(24)} color={colors.text} />
            <Text style={[styles.sendAllButtonText, { fontSize: rs(16) }]}>
              Enviar Mensagem para Todos
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  groupCount: {
    color: theme.colors.textSecondary,
  },
  listContainer: {
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  contactAvatar: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sendAllButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendAllButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
