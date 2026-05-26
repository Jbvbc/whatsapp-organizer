import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get, post, del } from '../services/api';

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formScopes, setFormScopes] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await get<ApiKey[]>('/api/api-keys');
      setKeys(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchKeys(); }, [fetchKeys]));

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const { data } = await post<ApiKey>('/api/api-keys', {
        name: formName.trim(),
        scopes: formScopes.split(',').map(s => s.trim()).filter(Boolean),
      });
      if (data?.key) {
        setNewKey(data.key);
      }
      setFormName('');
      setFormScopes('');
      setShowForm(false);
      await fetchKeys();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao criar chave');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (key: ApiKey) => {
    Alert.alert('Excluir chave', `Excluir "${key.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await del(`/api/api-keys/${key.id}`);
          await fetchKeys();
        } catch {
          Alert.alert('Erro', 'Falha ao excluir chave');
        }
      }},
    ]);
  };

  const handleToggle = async (key: ApiKey) => {
    try {
      await post(`/api/api-keys/${key.id}/toggle`, {});
      await fetchKeys();
    } catch {
      Alert.alert('Erro', 'Falha ao alterar status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(12) }}>
        <TouchableOpacity
          style={[styles.createBtn, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}
          onPress={() => { setShowForm(!showForm); setNewKey(null); }}
        >
          <Ionicons name="key" size={rs(20)} color="#fff" />
          <Text style={[styles.createBtnText, { fontSize: rs(15) }]}>
            {showForm ? 'Cancelar' : 'Nova API Key'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, { padding: rs(16), borderRadius: rs(10), gap: rs(10) }]}>
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Nome da chave"
              placeholderTextColor={colors.textTertiary}
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.input, { padding: rs(12), borderRadius: rs(8), fontSize: rs(14) }]}
              placeholder="Escopos (ex: contacts:read, messages:write)"
              placeholderTextColor={colors.textTertiary}
              value={formScopes}
              onChangeText={setFormScopes}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { padding: rs(12), borderRadius: rs(8) }]}
              onPress={handleCreate}
              disabled={creating || !formName.trim()}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontSize: rs(14) }]}>Criar Chave</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {newKey && (
          <View style={[styles.newKeyBanner, { padding: rs(16), borderRadius: rs(10), gap: rs(8) }]}>
            <Ionicons name="warning" size={rs(20)} color={colors.warning} />
            <Text style={[styles.newKeyTitle, { fontSize: rs(14) }]}>Chave criada! Copie agora:</Text>
            <Text selectable style={[styles.newKeyValue, { fontSize: rs(12), padding: rs(8), borderRadius: rs(6) }]}>{newKey}</Text>
            <Text style={[styles.newKeyHint, { fontSize: rs(11) }]}>Ela não será mostrada novamente.</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: rs(40) }} />
        ) : keys.length === 0 ? (
          <View style={[styles.empty, { padding: rs(48), gap: rs(8) }]}>
            <Ionicons name="key-outline" size={rs(50)} color={colors.border} />
            <Text style={[styles.emptyText, { fontSize: rs(16) }]}>Nenhuma API Key</Text>
            <Text style={[styles.emptySubtext, { fontSize: rs(13) }]}>Crie uma chave para integrações externas</Text>
          </View>
        ) : (
          keys.map(key => (
            <View key={key.id} style={[styles.keyCard, { padding: rs(14), borderRadius: rs(10), gap: rs(6) }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                <Ionicons name="key" size={rs(18)} color={key.isActive ? colors.success : colors.danger} />
                <Text style={[styles.keyName, { fontSize: rs(15) }]}>{key.name}</Text>
                <View style={[styles.badge, {
                  paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(10),
                  backgroundColor: key.isActive ? colors.success + '22' : colors.danger + '22',
                }]}>
                  <Text style={{ fontSize: rs(11), color: key.isActive ? colors.success : colors.danger }}>
                    {key.isActive ? 'Ativa' : 'Inativa'}
                  </Text>
                </View>
              </View>
              {key.scopes && key.scopes.length > 0 && (
                <Text style={[styles.scopes, { fontSize: rs(12) }]}>Escopos: {key.scopes.join(', ')}</Text>
              )}
              <Text style={[styles.meta, { fontSize: rs(11) }]}>
                Criada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                {key.lastUsedAt ? ` · Último uso: ${new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: rs(8), marginTop: rs(4) }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 1 }]}
                  onPress={() => handleToggle(key)}
                >
                  <Text style={{ fontSize: rs(12), color: colors.primary, textAlign: 'center' }}>
                    {key.isActive ? 'Desativar' : 'Ativar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { padding: rs(8), borderRadius: rs(6), flex: 1 }]}
                  onPress={() => handleDelete(key)}
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
  newKeyBanner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  newKeyTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  newKeyValue: {
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  newKeyHint: {
    color: theme.colors.textTertiary,
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
  keyCard: {
    backgroundColor: theme.colors.surface,
  },
  keyName: {
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  badge: {},
  scopes: {
    color: theme.colors.textSecondary,
  },
  meta: {
    color: theme.colors.textTertiary,
  },
  actionBtn: {
    backgroundColor: theme.colors.surfaceLight,
  },
});
