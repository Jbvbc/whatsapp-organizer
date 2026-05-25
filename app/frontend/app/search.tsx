import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { get as apiGet } from '../services/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  isFavorite: boolean;
}

interface Group {
  id: string;
  name: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();

  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useFocusEffect(
    useMemo(() => () => {
      fetchTags();
      fetchGroups();
    }, [selectedOrg?.id])
  );

  const orgQuery = useMemo(() => selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '', [selectedOrg?.id]);

  const fetchTags = async () => {
    try {
      const { data } = await apiGet<{ tags: string[] }>(`/api/tags${orgQuery}`);
      setTags(data.tags || []);
    } catch {}
  };

  const fetchGroups = async () => {
    try {
      const { data } = await apiGet<any[]>(`/api/groups${orgQuery}`);
      setGroups(data || []);
    } catch {}
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (filterFavorite) params.set('favorite', 'true');
      if (selectedGroup) params.set('groupId', selectedGroup);
      if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);

      const url = `/api/contacts?${params.toString()}`;
      const { data } = await apiGet<any[]>(url);
      let filtered = data || [];

      if (selectedTags.length > 0) {
        filtered = filtered.filter(c =>
          selectedTags.every(t => (c.tags || []).includes(t))
        );
      }

      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTags([]);
    setSelectedGroup('');
    setFilterFavorite(false);
    setCreatedAfter('');
    setCreatedBefore('');
    setResults([]);
    setSearched(false);
  };

  const hasActiveFilters = query || selectedTags.length > 0 || selectedGroup || filterFavorite;
  const resultCount = results.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: rs(16), gap: rs(8) }]}>
        <View style={[styles.searchInputRow, { gap: rs(8) }]}>
          <View style={[styles.searchInputContainer, { borderRadius: rs(12), paddingHorizontal: rs(12) }]}>
            <Ionicons name="search" size={rs(20)} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { fontSize: rs(16), paddingVertical: rs(12) }]}
              placeholder="Nome, telefone ou notas..."
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[styles.clearButton, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}
            onPress={clearFilters}
          >
            <Ionicons name="close" size={rs(20)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.filtersScroll} contentContainerStyle={{ padding: rs(16), paddingTop: 0 }}>
        {tags.length > 0 && (
          <View style={[styles.filterSection, { marginBottom: rs(16) }]}>
            <Text style={[styles.filterLabel, { fontSize: rs(14), marginBottom: rs(8) }]}>Tags</Text>
            <View style={[styles.chipsRow, { gap: rs(6) }]}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.chip,
                    selectedTags.includes(tag) && styles.chipActive,
                    { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(16) }
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.chipText, selectedTags.includes(tag) && styles.chipTextActive, { fontSize: rs(13) }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.filterSection, { marginBottom: rs(16) }]}>
          <Text style={[styles.filterLabel, { fontSize: rs(14), marginBottom: rs(8) }]}>Grupo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: rs(6) }}>
            {groups.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.chip,
                  selectedGroup === g.id && styles.chipActive,
                  { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(16) }
                ]}
                onPress={() => setSelectedGroup(selectedGroup === g.id ? '' : g.id)}
              >
                <Text style={[styles.chipText, selectedGroup === g.id && styles.chipTextActive, { fontSize: rs(13) }]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.filterSection, { marginBottom: rs(16) }]}>
          <TouchableOpacity
            style={[styles.favoriteToggle, { paddingVertical: rs(8), gap: rs(8) }]}
            onPress={() => setFilterFavorite(!filterFavorite)}
          >
            <Ionicons
              name={filterFavorite ? 'star' : 'star-outline'}
              size={rs(20)}
              color={filterFavorite ? colors.favorite : colors.textTertiary}
            />
            <Text style={[styles.favoriteText, { fontSize: rs(14), color: filterFavorite ? colors.favorite : colors.textSecondary }]}>
              {filterFavorite ? 'Favoritos apenas' : 'Todos os contatos'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.searchButton, { paddingVertical: rs(14), borderRadius: rs(12), gap: rs(8) }]}
          onPress={doSearch}
        >
          <Ionicons name="search" size={rs(20)} color={colors.text} />
          <Text style={[styles.searchButtonText, { fontSize: rs(16) }]}>
            {hasActiveFilters ? `Buscar (${tags.length > 0 ? selectedTags.length + ' tags, ' : ''}${selectedGroup ? 'grupo, ' : ''}${filterFavorite ? 'favoritos' : 'todos'})` : 'Buscar todos os contatos'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {searched && (
        <View style={styles.resultsSection}>
          <View style={[styles.resultsHeader, { paddingHorizontal: rs(16), paddingVertical: rs(8) }]}>
            <Text style={[styles.resultsCount, { fontSize: rs(14) }]}>
              {loading ? 'Buscando...' : `${resultCount} resultado${resultCount !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: rs(16), paddingTop: rs(4) }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultCard, { padding: rs(14), marginBottom: rs(8), borderRadius: rs(12) }]}
                onPress={() => router.push(`/contact-details?id=${item.id}`)}
              >
                <View style={[styles.resultAvatar, { width: rs(40), height: rs(40), borderRadius: rs(20) }]}>
                  <Text style={[styles.avatarText, { fontSize: rs(18) }]}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={[styles.resultInfo, { marginLeft: rs(12) }]}>
                  <Text style={[styles.resultName, { fontSize: rs(16) }]}>{item.name}</Text>
                  <Text style={[styles.resultPhone, { fontSize: rs(13) }]}>{item.phone}</Text>
                  {item.tags && item.tags.length > 0 && (
                    <View style={[styles.resultTags, { gap: rs(4), marginTop: rs(4) }]}>
                      {item.tags.slice(0, 3).map((t, i) => (
                        <View key={i} style={[styles.resultTag, { paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(4) }]}>
                          <Text style={[styles.resultTagText, { fontSize: rs(11) }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {item.isFavorite && (
                  <Ionicons name="star" size={rs(16)} color={colors.favorite} style={{ marginLeft: rs(8) }} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={[styles.emptyContainer, { padding: rs(32) }]}>
                  <Ionicons name="search-outline" size={rs(60)} color={colors.border} />
                  <Text style={[styles.emptyText, { fontSize: rs(16), marginTop: rs(12) }]}>Nenhum contato encontrado</Text>
                </View>
              ) : null
            }
          />
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
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
  },
  clearButton: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersScroll: {
    maxHeight: 220,
  },
  filterSection: {
  },
  filterLabel: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteText: {
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
  },
  resultsCount: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  resultAvatar: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  resultPhone: {
    color: theme.colors.textSecondary,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultTag: {
    backgroundColor: theme.colors.surfaceLight,
  },
  resultTagText: {
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
