import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { get as apiGet, put as apiPut } from '../../services/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
}

export default function ContactsScreen() {
  const router = useRouter();
  const { rs, numColumns } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (filterFavorites) params.set('favorite', 'true');
      if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
      const qs = params.toString();
      const endpoint = qs ? `/api/contacts?${qs}` : '/api/contacts';
      const { data, fromCache: cached } = await apiGet<any[]>(endpoint, 'contacts');
      setContacts(data);
      setFilteredContacts(data);
      setFromCache(cached);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filterFavorites, selectedOrg?.id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery) ||
          contact.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const toggleFavorite = async (contact: Contact) => {
    try {
      await apiPut(`/api/contacts/${contact.id}`, { isFavorite: !contact.isFavorite });
      fetchContacts();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Alert.alert('WhatsApp', `Abrir conversa com ${cleanPhone}`);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactCard, { padding: rs(16), marginBottom: rs(12), borderRadius: rs(12) }]}
      onPress={() => router.push(`/contact-details?id=${item.id}`)}
    >
      <View style={[styles.contactAvatar, { width: rs(50), height: rs(50), borderRadius: rs(25) }]}>
        <Text style={[styles.avatarText, { fontSize: rs(24) }]}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={[styles.contactInfo, { marginLeft: rs(12) }]}>
        <Text style={[styles.contactName, { fontSize: rs(18) }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { fontSize: rs(14) }]}>{item.phone}</Text>
        {item.tags.length > 0 && (
          <View style={[styles.tagsContainer, { gap: rs(4), marginTop: rs(4) }]}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={[styles.tag, { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(6) }]}>
                <Text style={[styles.tagText, { fontSize: rs(12) }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ padding: rs(4) }}>
          <Ionicons name={item.isFavorite ? 'star' : 'star-outline'} size={rs(22)} color={item.isFavorite ? colors.favorite : colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openWhatsApp(item.phone)} style={{ marginLeft: rs(8) }}>
          <Ionicons name="logo-whatsapp" size={rs(24)} color={colors.whatsapp} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: rs(16), gap: rs(8) }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={rs(20)} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { fontSize: rs(16), paddingVertical: rs(12) }]}
            placeholder="Buscar contatos, tags..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={rs(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { width: rs(48), height: rs(48), borderRadius: rs(12) }]}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="options" size={rs(20)} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterFavorites && styles.filterButtonActive, { width: rs(48), height: rs(48), borderRadius: rs(12) }]}
          onPress={() => setFilterFavorites(!filterFavorites)}
        >
          <Ionicons name="star" size={rs(20)} color={filterFavorites ? colors.favorite : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {fromCache && (
        <View style={[styles.cacheBanner, { paddingVertical: rs(4), paddingHorizontal: rs(16) }]}>
          <Text style={[styles.cacheBannerText, { fontSize: rs(12) }]}>Dados offline · Última atualização disponível</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={rs(80)} color={colors.border} />
          <Text style={[styles.emptyText, { fontSize: rs(18) }]}>
            {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: rs(14) }]}>
            {searchQuery ? 'Tente uma busca diferente' : 'Importe seus contatos para começar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={[styles.listContainer, { padding: rs(16) }]}
          columnWrapperStyle={numColumns > 1 ? { gap: rs(12) } : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  cacheBanner: {
    backgroundColor: theme.colors.surfaceHighlight,
    alignItems: 'center',
  },
  cacheBannerText: {
    color: theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.surfaceLight,
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
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.surfaceLight,
  },
  tagText: {
    color: theme.colors.primary,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});
