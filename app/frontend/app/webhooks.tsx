import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get, post, put, del } from '../services/api';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  name?: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  lastResponseStatus: number | null;
  createdAt: string;
  updatedAt: string;
}

const ALL_EVENTS = [
  'contact.created', 'contact.updated', 'contact.deleted',
  'message.scheduled', 'message.sent', 'message.failed',
  'event.created', 'event.upcoming',
];

export default function WebhooksScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formName, setFormName] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formSecret, setFormSecret] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await get<Webhook[]>('/api/webhooks');
      setWebhooks(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchWebhooks(); }, [fetchWebhooks]));

  const toggleEvent = (event: string) => {
    setFormEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleCreate = async () => {
    if (!formUrl.trim() || formEvents.length === 0) return;
    setCreating(true);
    try {
      await post('/api/webhooks', {
        url: formUrl.trim(),
        name: formName.trim() || undefined,
        events: formEvents,
        secret: formSecret.trim() || undefined,
      });
      setFormUrl('');
      setFormName('');
      setFormEvents([]);
      setFormSecret('');
      setShowForm(false);
      await fetchWebhooks();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao criar webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (wh: Webhook) => {
    Alert.alert('Excluir webhook', `Remover webhook "${wh.name || wh.url}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await del(`/api/webhooks/${wh.id}`);
          await fetchWebhooks();
        } catch {
          Alert.alert('Erro', 'Falha ao excluir');
        }
      }},
    ]);
  };

  const handleToggle = async (wh: Webhook) => {
    try {
      await put(`/api/webhooks/${wh.id}`, { isActive: !wh.isActive });
      await fetchWebhooks();
    } catch {
      Alert.alert('Erro', 'Falha ao alterar status');
    }
  };

  const statusColor = (status: number | null) => {
    if (status === null) return colors.textTertiary;
    if (status >= 200 && status < 300) return colors.success;
    return colors.danger;
  };

  const statusIcon = (status: number | null) => {
    if (status === null) return 'radio-button-off';
    if (status >= 200 && status < 300) return 'checkmark-circle';
    return 'close-circle';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(12) }}>
        <TouchableOpacity
          style={[styles.createBtn, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name="link" size={rs(20)} color="#fff" />
          <Text style={[styles.createBtnText, { fontSize: rs(15) }]}>
            {showForm ? 'Cancelar' : 'Novo Webhook'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, { padding: rs(16), borderRadius: rs(10), gap: rs(10) }]}>
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="URL do webhook (https://...)"
              placeholderTextColor={colors.textTertiary}
              value={formUrl}
              onChangeText={setFormUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Nome (opcional)"
              placeholderTextColor={colors.textTertiary}
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Secret (opcional - para assinatura HMAC)"
              placeholderTextColor={colors.textTertiary}
              value={formSecret}
              onChangeText={setFormSecret}
              secureTextEntry
            />
            <Text style={[styles.formLabel, { fontSize: rs(13) }]}>Eventos para escutar:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(6) }}>
              {ALL_EVENTS.map(event => {
                const selected = formEvents.includes(event);
                return (
                  <TouchableOpacity
                    key={event}
                    style={[styles.eventChip, {
                      padding: rs(6), borderRadius: rs(6),
                      backgroundColor: selected ? colors.primary : colors.surfaceLight,
                    }]}
                    onPress={() => toggleEvent(event)}
                  >
                    <Text style={{ fontSize: rs(11), color: selected ? '#fff' : colors.text }}>
                      {event}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, { padding: rs(12), borderRadius: rs(8) }]}
              onPress={handleCreate}
              disabled={creating || !formUrl.trim() || formEvents.length === 0}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontSize: rs(14) }]}>Criar Webhook</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: rs(40) }} />
        ) : webhooks.length === 0 ? (
          <View style={[styles.empty, { padding: rs(48), gap: rs(8) }]}>
            <Ionicons name="pulse-outline" size={rs(50)} color={colors.border} />
            <Text style={[styles.emptyText, { fontSize: rs(16) }]}>Nenhum webhook</Text>
            <Text style={[styles.emptySubtext, { fontSize: rs(13) }]}>
              Crie webhooks para receber eventos em tempo real
            </Text>
          </View>
        ) : (
          webhooks.map(wh => (
            <View key={wh.id} style={[styles.card, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                <Ionicons name="pulse" size={rs(18)} color={wh.isActive ? colors.success : colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { fontSize: rs(15) }]}>{wh.name || 'Webhook'}</Text>
                  <Text style={[styles.cardUrl, { fontSize: rs(11) }]} numberOfLines={1}>{wh.url}</Text>
                </View>
                <View style={[styles.badge, {
                  paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(10),
                  backgroundColor: wh.isActive ? colors.success + '22' : colors.danger + '22',
                }]}>
                  <Text style={{ fontSize: rs(11), color: wh.isActive ? colors.success : colors.danger }}>
                    {wh.isActive ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(4) }}>
                {wh.events.map(event => (
                  <View key={event} style={[styles.eventTag, { paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(4) }]}>
                    <Text style={{ fontSize: rs(10), color: colors.primary }}>{event}</Text>
                  </View>
                ))}
              </View>

              {wh.lastTriggeredAt && (
                <View style={{ flexDirection: 'row', gap: rs(6), alignItems: 'center' }}>
                  <Ionicons name={statusIcon(wh.lastResponseStatus) as any} size={rs(14)} color={statusColor(wh.lastResponseStatus)} />
                  <Text style={[styles.meta, { fontSize: rs(11) }]}>
                    Último: {new Date(wh.lastTriggeredAt).toLocaleString('pt-BR')}
                    {wh.lastResponseStatus ? ` (HTTP ${wh.lastResponseStatus})` : ''}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: rs(8), marginTop: rs(4) }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 1 }]}
                  onPress={() => handleToggle(wh)}
                >
                  <Text style={{ fontSize: rs(12), color: colors.primary, textAlign: 'center' }}>
                    {wh.isActive ? 'Desativar' : 'Ativar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 1 }]}
                  onPress={() => handleDelete(wh)}
                >
                  <Text style={{ fontSize: rs(12), color: colors.danger, textAlign: 'center' }}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    backgroundColor: theme.colors.surface,
  },
  formLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  eventChip: {},
  eventTag: {
    backgroundColor: theme.colors.surfaceLight,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  cardUrl: {
    color: theme.colors.textTertiary,
  },
  badge: {},
  meta: {
    color: theme.colors.textTertiary,
  },
  actionBtn: {
    backgroundColor: theme.colors.surfaceLight,
  },
});
