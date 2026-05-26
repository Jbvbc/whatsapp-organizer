import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { get, post, put } from '../services/api';

interface WhatsAppConfig {
  id: string;
  phoneNumberId: string;
  businessAccountId?: string;
  isActive: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageStatus {
  id: string;
  externalMessageId: string;
  scheduledMessageId?: string;
  recipientPhone: string;
  status: string;
  timestamp: string;
}

export default function WhatsAppScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [statuses, setStatuses] = useState<MessageStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formPhoneNumberId, setFormPhoneNumberId] = useState('');
  const [formAccessToken, setFormAccessToken] = useState('');
  const [formBusinessAccountId, setFormBusinessAccountId] = useState('');
  const [formWebhookSecret, setFormWebhookSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const orgQuery = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const { data: configData } = await get<WhatsAppConfig>(`/api/whatsapp/config${orgQuery}`, 'wa_config');
      setConfig(configData);
      setFormPhoneNumberId(configData?.phoneNumberId || '');
      setFormAccessToken('');
      setFormBusinessAccountId(configData?.businessAccountId || '');
      
      const { data: statusData } = await get<MessageStatus[]>('/api/whatsapp/status?limit=20', 'wa_status');
      setStatuses(statusData || []);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg?.id]);

  useFocusEffect(useCallback(() => { fetchConfig(); }, [fetchConfig]));

  const handleSave = async () => {
    if (!formPhoneNumberId.trim() || !formAccessToken.trim()) return;
    setSaving(true);
    try {
      if (config) {
        const updateData: any = {};
        if (formAccessToken) updateData.accessToken = formAccessToken;
        if (formBusinessAccountId !== config.businessAccountId) updateData.businessAccountId = formBusinessAccountId;
        await put('/api/whatsapp/config', updateData);
      } else {
        await post('/api/whatsapp/config', {
          phoneNumberId: formPhoneNumberId.trim(),
          accessToken: formAccessToken.trim(),
          businessAccountId: formBusinessAccountId.trim() || undefined,
          webhookSecret: formWebhookSecret.trim() || undefined,
          organizationId: selectedOrg?.id || undefined,
        });
      }
      setShowForm(false);
      setFormAccessToken('');
      await fetchConfig();
      Alert.alert('Sucesso', config ? 'Configuração atualizada' : 'WhatsApp configurado');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sent': return 'checkmark-circle-outline';
      case 'delivered': return 'checkmark-done-circle';
      case 'read': return 'checkmark-done';
      case 'failed': return 'close-circle';
      default: return 'ellipse';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': return colors.primary;
      case 'delivered': return colors.success;
      case 'read': return colors.whatsapp || '#25D366';
      case 'failed': return colors.danger;
      default: return colors.textTertiary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(12) }}>
        {!config && !loading && (
          <View style={[styles.warningBanner, { padding: rs(16), borderRadius: rs(10), gap: rs(8) }]}>
            <Ionicons name="warning" size={rs(24)} color={colors.warning} />
            <Text style={[styles.warningText, { fontSize: rs(14) }]}>
              WhatsApp Business API não configurada
            </Text>
            <Text style={[styles.warningSubtext, { fontSize: rs(12) }]}>
              Configure abaixo para enviar mensagens reais via WhatsApp Cloud API
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name="logo-whatsapp" size={rs(20)} color="#fff" />
          <Text style={[styles.createBtnText, { fontSize: rs(15) }]}>
            {showForm ? 'Cancelar' : config ? 'Editar Configuração' : 'Configurar WhatsApp'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, { padding: rs(16), borderRadius: rs(10), gap: rs(10) }]}>
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Phone Number ID"
              placeholderTextColor={colors.textTertiary}
              value={formPhoneNumberId}
              onChangeText={setFormPhoneNumberId}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Access Token (long-lived)"
              placeholderTextColor={colors.textTertiary}
              value={formAccessToken}
              onChangeText={setFormAccessToken}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Business Account ID (opcional)"
              placeholderTextColor={colors.textTertiary}
              value={formBusinessAccountId}
              onChangeText={setFormBusinessAccountId}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Webhook Secret (opcional)"
              placeholderTextColor={colors.textTertiary}
              value={formWebhookSecret}
              onChangeText={setFormWebhookSecret}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.submitBtn, { padding: rs(12), borderRadius: rs(8) }]}
              onPress={handleSave}
              disabled={saving || !formPhoneNumberId.trim() || (!config && !formAccessToken.trim())}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontSize: rs(14) }]}>
                  {config ? 'Atualizar' : 'Salvar Configuração'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {config && !showForm && (
          <View style={[styles.configCard, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
              <Ionicons name="logo-whatsapp" size={rs(22)} color="#25D366" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.configLabel, { fontSize: rs(12), color: colors.textSecondary }]}>
                  WhatsApp Business API
                </Text>
                <Text style={[styles.configValue, { fontSize: rs(14) }]}>
                  Phone ID: {config.phoneNumberId}
                </Text>
              </View>
              <View style={[styles.badge, {
                paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(10),
                backgroundColor: config.isActive ? colors.success + '22' : colors.danger + '22',
              }]}>
                <Text style={{ fontSize: rs(11), color: config.isActive ? colors.success : colors.danger }}>
                  {config.isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
            {config.businessAccountId && (
              <Text style={[styles.configValue, { fontSize: rs(12) }]}>
                Business Account: {config.businessAccountId}
              </Text>
            )}
            <Text style={[styles.meta, { fontSize: rs(11) }]}>
              Atualizado em: {new Date(config.updatedAt).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginTop: rs(8) }]}>
          Status de Mensagens
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: rs(20) }} />
        ) : statuses.length === 0 ? (
          <View style={[styles.empty, { padding: rs(32), gap: rs(8) }]}>
            <Ionicons name="chatbubbles-outline" size={rs(40)} color={colors.border} />
            <Text style={[styles.emptyText, { fontSize: rs(14) }]}>Nenhuma mensagem enviada</Text>
          </View>
        ) : (
          statuses.map(s => (
            <View key={s.id} style={[styles.statusCard, { padding: rs(12), borderRadius: rs(8), gap: rs(4) }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                <Ionicons name={statusIcon(s.status) as any} size={rs(18)} color={statusColor(s.status)} />
                <Text style={[styles.statusPhone, { fontSize: rs(13) }]}>{s.recipientPhone}</Text>
                <View style={[styles.badge, {
                  paddingHorizontal: rs(6), paddingVertical: rs(1), borderRadius: rs(8),
                  backgroundColor: statusColor(s.status) + '22',
                }]}>
                  <Text style={{ fontSize: rs(10), color: statusColor(s.status) }}>{s.status}</Text>
                </View>
              </View>
              <Text style={[styles.meta, { fontSize: rs(10) }]}>
                ID: {s.externalMessageId.substring(0, 20)}... | {new Date(s.timestamp).toLocaleString('pt-BR')}
              </Text>
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
  warningBanner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    alignItems: 'center',
  },
  warningText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningSubtext: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: '#25D366',
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
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: theme.colors.surface,
  },
  configLabel: {},
  configValue: {
    color: theme.colors.text,
  },
  badge: {},
  meta: {
    color: theme.colors.textTertiary,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
  },
  statusPhone: {
    color: theme.colors.text,
    flex: 1,
  },
});
