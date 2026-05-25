import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { get as apiGet } from '../../services/api';

export default function TagsScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const tagsOrgQuery = useMemo(() => selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '', [selectedOrg?.id]);

  const fetchTags = async () => {
    try {
      const { data, fromCache: cached } = await apiGet<{ tags: string[] }>(`/api/tags${tagsOrgQuery}`, 'tags');
      setTags(data.tags);
      setFromCache(cached);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactsByTag = async (tag: string) => {
    try {
      const params = new URLSearchParams();
      params.set('tag', tag);
      if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
      const { data } = await apiGet<any[]>(`/api/contacts?${params.toString()}`, `contacts_tag_${tag}`);
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts by tag:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTags();
    }, [tagsOrgQuery])
  );

  const handleTagPress = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      setContacts([]);
    } else {
      setSelectedTag(tag);
      fetchContactsByTag(tag);
    }
  };

  const renderTag = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.tagCard,
        selectedTag === item && styles.tagCardActive,
      ]}
      onPress={() => handleTagPress(item)}
    >
      <View style={[styles.tagIcon, { width: rs(40), height: rs(40), borderRadius: rs(20), marginRight: rs(12) }]}>
        <Ionicons name="pricetag" size={rs(24)} color={colors.primary} />
      </View>
      <Text style={[styles.tagName, { fontSize: rs(16) }]}>{item}</Text>
      <Ionicons 
        name={selectedTag === item ? "chevron-up" : "chevron-down"} 
        size={rs(20)} 
        color={colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderContact = ({ item }: { item: any }) => (
    <View style={styles.contactItem}>
      <View style={[styles.contactAvatar, { width: rs(40), height: rs(40), borderRadius: rs(20) }]}>
        <Text style={[styles.avatarText, { fontSize: rs(18) }]}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={[styles.contactInfo, { marginLeft: rs(12) }]}>
        <Text style={[styles.contactName, { fontSize: rs(16) }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { fontSize: rs(14) }]}>{item.phone}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {fromCache && (
        <View style={{ backgroundColor: theme.colors.surfaceHighlight, paddingVertical: rs(4), alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary, fontSize: rs(12) }}>Dados offline</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { fontSize: rs(18) }]}>Carregando...</Text>
        </View>
      ) : tags.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="pricetags-outline" size={rs(80)} color={colors.border} />
          <Text style={[styles.emptyText, { fontSize: rs(18) }]}>Nenhuma tag criada</Text>
          <Text style={[styles.emptySubtext, { fontSize: rs(14) }]}>
            Adicione tags aos seus contatos para organizá-los melhor
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionTitle, { fontSize: rs(16), paddingHorizontal: rs(16), paddingTop: rs(16), paddingBottom: rs(8) }]}>Tags Disponíveis</Text>
            <FlatList
              data={tags}
              renderItem={renderTag}
              keyExtractor={(item) => item}
              contentContainerStyle={[styles.tagsContainer, { padding: rs(16) }]}
            />
          </View>

          {selectedTag && (
            <View style={[styles.contactsSection, { paddingTop: rs(16) }]}>
              <Text style={[styles.sectionTitle, { fontSize: rs(16), paddingHorizontal: rs(16), paddingTop: rs(16), paddingBottom: rs(8) }]}>
                Contatos com "{selectedTag}" ({contacts.length})
              </Text>
              <FlatList
                data={contacts}
                renderItem={renderContact}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.contactsContainer, { padding: rs(16) }]}
              />
            </View>
          )}
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
  content: {
    flex: 1,
  },
  tagsSection: {
    maxHeight: '50%',
  },
  contactsSection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
  },
  tagCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  tagCardActive: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tagIcon: {
    backgroundColor: theme.colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagName: {
    flex: 1,
    fontWeight: '500',
    color: theme.colors.text,
  },
  contactsContainer: {
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
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
  },
  contactName: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  contactPhone: {
    color: theme.colors.textSecondary,
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
