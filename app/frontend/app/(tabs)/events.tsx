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

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  contactId?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  isActive: boolean;
}

export default function EventsScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrg?.id) params.set('organizationId', selectedOrg.id);
      const qs = params.toString();
      const endpoint = filter === 'upcoming'
        ? `/api/events/upcoming?days_ahead=30${qs ? '&' + qs : ''}`
        : `/api/events${qs ? '?' + qs : ''}`;
      const { data, fromCache: cached } = await apiGet<any[]>(endpoint, 'events');
      setEvents(data);
      setFromCache(cached);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedOrg?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const deleteEvent = async (eventId: string) => {
    Alert.alert(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDel(`/api/events/${eventId}`);
              fetchEvents();
            } catch (error) {
              console.error('Error deleting event:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday': return 'cake';
      case 'anniversary': return 'heart';
      default: return 'calendar';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'birthday': return '#E91E63';
      case 'anniversary': return '#FF9800';
      default: return colors.primary;
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity style={[styles.eventCard, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
      <View style={[styles.eventIcon, { backgroundColor: getEventColor(item.type) + '20', width: rs(48), height: rs(48), borderRadius: rs(12) }]}>
        <Ionicons name={getEventIcon(item.type)} size={rs(24)} color={getEventColor(item.type)} />
      </View>
      <View style={[styles.eventInfo, { marginLeft: rs(12) }]}>
        <Text style={[styles.eventTitle, { fontSize: rs(16) }]}>{item.title}</Text>
        {item.description && (
          <Text style={[styles.eventDescription, { fontSize: rs(14) }]}>{item.description}</Text>
        )}
        <Text style={[styles.eventDate, { fontSize: rs(12) }]}>
          {formatDate(item.date)}
        </Text>
        {item.isRecurring && (
          <Text style={[styles.recurringText, { fontSize: rs(12) }]}>
            Recorrente ({item.recurringPattern === 'yearly' ? 'Anual' : item.recurringPattern})
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => deleteEvent(item.id)} style={[styles.deleteButton, { padding: rs(8) }]}>
        <Ionicons name="trash-outline" size={rs(20)} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.filterRow, { padding: rs(12), gap: rs(8) }]}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'upcoming', label: 'Próximos' },
          { key: 'birthday', label: 'Aniversários' },
          { key: 'anniversary', label: 'Casamento' },
          { key: 'custom', label: 'Personalizado' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive, { paddingHorizontal: rs(16), paddingVertical: rs(8), borderRadius: rs(20) }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive, { fontSize: rs(13) }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {fromCache && (
        <View style={{ backgroundColor: theme.colors.surfaceHighlight, paddingVertical: rs(4), alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary, fontSize: rs(12) }}>Dados offline</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { fontSize: rs(16) }]}>Carregando eventos...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={rs(80)} color={colors.border} />
          <Text style={[styles.emptyText, { fontSize: rs(18) }]}>Nenhum evento encontrado</Text>
          <Text style={[styles.emptySubtext, { fontSize: rs(14) }]}>
            Os aniversários dos contatos aparecerão aqui automaticamente
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { padding: rs(16) }]}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.text,
  },
  listContainer: {
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  eventIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    color: theme.colors.textDim,
    marginBottom: 4,
  },
  eventDate: {
    color: theme.colors.textTertiary,
  },
  recurringText: {
    color: theme.colors.primary,
    marginTop: 4,
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
