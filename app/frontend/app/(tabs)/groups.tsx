import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { get as apiGet, del as apiDel } from '../../services/api';

interface Group {
  id: string;
  name: string;
  color: string;
  contactIds: string[];
  createdAt: string;
}

export default function GroupsScreen() {
  const router = useRouter();
  const { rs, numColumns } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const fetchGroups = async () => {
    try {
      const params = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const { data, fromCache: cached } = await apiGet<any[]>(`/api/groups${params}`, 'groups');
      setGroups(data);
      setFromCache(cached);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [selectedOrg?.id])
  );

  const deleteGroup = async (groupId: string) => {
    Alert.alert(
      'Excluir Grupo',
      'Tem certeza que deseja excluir este grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDel(`/api/groups/${groupId}`);
              fetchGroups();
            } catch (error) {
              console.error('Error deleting group:', error);
            }
          },
        },
      ]
    );
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { padding: rs(16), marginBottom: rs(12), borderRadius: rs(12) }]}
      onPress={() => router.push(`/group-details?id=${item.id}`)}
    >
      <View style={[styles.groupIcon, { backgroundColor: item.color, width: rs(56), height: rs(56), borderRadius: rs(28) }]}>
        <Ionicons name="people" size={rs(28)} color={colors.text} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { fontSize: rs(18) }]}>{item.name}</Text>
        <Text style={[styles.groupCount, { fontSize: rs(14) }]}>{item.contactIds.length} contatos</Text>
      </View>
      <TouchableOpacity onPress={() => deleteGroup(item.id)} style={[styles.deleteButton, { padding: rs(8) }]}>
        <Ionicons name="trash-outline" size={rs(20)} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.headerRow, { padding: rs(16), paddingBottom: rs(8) }]}>
        <Text style={[styles.headerTitle, { fontSize: rs(28) }]}>Grupos</Text>
        <View style={[styles.headerButtons, { gap: rs(8) }]}>
          <TouchableOpacity 
            style={[styles.headerButton, { width: rs(40), height: rs(40), borderRadius: rs(20) }]}
            onPress={() => router.push('/import-groups')}
          >
            <Ionicons name="download" size={rs(20)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { width: rs(40), height: rs(40), borderRadius: rs(20) }]}
            onPress={() => router.push('/schedule-message')}
          >
            <Ionicons name="time" size={rs(20)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, { width: rs(44), height: rs(44), borderRadius: rs(22) }]}
            onPress={() => router.push('/create-group')}
          >
            <Ionicons name="add" size={rs(24)} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {fromCache && (
        <View style={{ backgroundColor: theme.colors.surfaceHighlight, paddingVertical: rs(4), alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary, fontSize: rs(12) }}>Dados offline</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="albums-outline" size={rs(80)} color={colors.border} />
          <Text style={[styles.emptyText, { fontSize: rs(18) }]}>Nenhum grupo criado</Text>
          <Text style={[styles.emptySubtext, { fontSize: rs(14) }]}>Crie grupos para organizar seus contatos</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={[styles.listContainer, { padding: rs(16), paddingTop: rs(8) }]}
          columnWrapperStyle={numColumns > 1 ? { gap: rs(12) } : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  groupIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  groupCount: {
    color: theme.colors.textSecondary,
  },
  deleteButton: {
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
