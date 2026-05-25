import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization, Organization } from '../contexts/OrganizationContext';

export default function OrganizationsScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { organizations, selectedOrg, selectOrg, createOrg, updateOrg, deleteOrg, refreshOrgs } = useOrganization();
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#4A90E2');
  const [formDescription, setFormDescription] = useState('');

  const COLORS = ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#3498DB'];

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      if (editingOrg) {
        await updateOrg(editingOrg.id, { name: formName, color: formColor, description: formDescription });
      } else {
        await createOrg(formName, formColor, formDescription);
      }
      resetForm();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar organização');
    }
  };

  const handleDelete = (org: Organization) => {
    Alert.alert(
      'Excluir organização',
      `Tem certeza que deseja excluir "${org.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteOrg(org.id) }
      ]
    );
  };

  const startEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormName(org.name);
    setFormColor(org.color);
    setFormDescription(org.description);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingOrg(null);
    setFormName('');
    setFormColor('#4A90E2');
    setFormDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {!showForm && (
        <TouchableOpacity
          style={[styles.addButton, { margin: rs(16), paddingVertical: rs(12), borderRadius: rs(12) }]}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={rs(20)} color={colors.text} />
          <Text style={[styles.addButtonText, { fontSize: rs(16) }]}>Nova Organização</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <View style={[styles.formContainer, { padding: rs(16), margin: rs(16), borderRadius: rs(12) }]}>
          <Text style={[styles.formTitle, { fontSize: rs(18), marginBottom: rs(16) }]}>
            {editingOrg ? 'Editar Organização' : 'Nova Organização'}
          </Text>
          <TextInput
            style={[styles.input, { fontSize: rs(16), padding: rs(12), marginBottom: rs(12), borderRadius: rs(8) }]}
            placeholder="Nome da organização"
            placeholderTextColor={colors.placeholder}
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            style={[styles.input, styles.textarea, { fontSize: rs(14), padding: rs(12), marginBottom: rs(12), borderRadius: rs(8) }]}
            placeholder="Descrição (opcional)"
            placeholderTextColor={colors.placeholder}
            value={formDescription}
            onChangeText={setFormDescription}
            multiline
            numberOfLines={2}
          />
          <Text style={[styles.formLabel, { fontSize: rs(14), marginBottom: rs(8) }]}>Cor</Text>
          <View style={[styles.colorRow, { gap: rs(8), marginBottom: rs(16) }]}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: c }, formColor === c && styles.colorDotActive]}
                onPress={() => setFormColor(c)}
              />
            ))}
          </View>
          <View style={[styles.formActions, { gap: rs(8) }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { flex: 1, paddingVertical: rs(12), borderRadius: rs(8) }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveBtnText, { fontSize: rs(15) }]}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { flex: 1, paddingVertical: rs(12), borderRadius: rs(8) }]}
              onPress={resetForm}
            >
              <Text style={[styles.cancelBtnText, { fontSize: rs(15) }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showForm && (
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: rs(16), paddingTop: 0 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.orgCard, { padding: rs(16), marginBottom: rs(8), borderRadius: rs(12), borderLeftWidth: 4, borderLeftColor: item.color }]}
              onPress={() => selectOrg(selectedOrg?.id === item.id ? null : item)}
              onLongPress={() => startEdit(item)}
            >
              <View style={[styles.orgInfo, { gap: rs(4) }]}>
                <Text style={[styles.orgName, { fontSize: rs(16) }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={[styles.orgDesc, { fontSize: rs(13) }]}>{item.description}</Text>
                ) : null}
              </View>
              <View style={[styles.orgActions, { gap: rs(8) }]}>
                {selectedOrg?.id === item.id ? (
                  <View style={[styles.activeBadge, { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(4) }]}>
                    <Text style={[styles.activeBadgeText, { fontSize: rs(11) }]}>Ativa</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => selectOrg(item)} style={{ padding: rs(4) }}>
                    <Ionicons name="checkmark-circle-outline" size={rs(22)} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: rs(4) }}>
                  <Ionicons name="trash-outline" size={rs(20)} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { padding: rs(48) }]}>
              <Ionicons name="business-outline" size={rs(60)} color={colors.border} />
              <Text style={[styles.emptyText, { fontSize: rs(16), marginTop: rs(12) }]}>
                Nenhuma organização ainda
              </Text>
              <Text style={[styles.emptySubtext, { fontSize: rs(13) }]}>
                Crie organizações para separar dados de diferentes empresas
              </Text>
            </View>
          }
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
  addButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
  },
  formTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  textarea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  formLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorDot: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: theme.colors.text,
  },
  formActions: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
  },
  orgCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  orgDesc: {
    color: theme.colors.textSecondary,
  },
  orgActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  activeBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});
