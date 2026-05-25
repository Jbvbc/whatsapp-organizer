import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { post as apiPost } from '../services/api';

interface DeviceGroup {
  name: string;
  contactPhones: string[];
  selected: boolean;
}

export default function ImportGroupsScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const scanDeviceGroups = async () => {
    setLoading(true);
    try {
      const mockGroups: DeviceGroup[] = [
        { name: 'Família', contactPhones: ['5511999999999'], selected: true },
        { name: 'Trabalho', contactPhones: ['5511888888888'], selected: true },
        { name: 'Amigos', contactPhones: ['5511777777777'], selected: true },
        { name: 'Clientes', contactPhones: ['5511666666666'], selected: true },
      ];
      
      setDeviceGroups(mockGroups);
      
      if (mockGroups.length === 0) {
        Alert.alert('Aviso', 'Nenhum grupo do WhatsApp encontrado no dispositivo.');
      }
    } catch (error) {
      console.error('Error scanning groups:', error);
      Alert.alert('Erro', 'Falha ao escanear grupos do dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (index: number) => {
    const updated = [...deviceGroups];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setDeviceGroups(updated);
  };

  const importSelectedGroups = async () => {
    const selectedGroups = deviceGroups.filter(g => g.selected);
    
    if (selectedGroups.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um grupo para importar.');
      return;
    }

    setImporting(true);
    try {
      const result = await apiPost<any>('/api/groups/import', selectedGroups.map(g => ({
        name: g.name,
        color: getGroupColor(g.name),
        contactPhones: g.contactPhones,
        organizationId: selectedOrg?.id,
      })));
      
      Alert.alert(
        'Importação Concluída!',
        `${result.imported} grupos importados\n${result.skipped} duplicados ignorados`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Aviso', error.message || 'Falha ao importar grupos.');
    } finally {
      setImporting(false);
    }
  };

  const getGroupColor = (name: string) => {
    const groupColors = ['#4A90E2', '#E91E63', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return groupColors[Math.abs(hash) % groupColors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: rs(24) }]}>
        <Text style={[styles.title, { fontSize: rs(28), marginBottom: rs(8) }]}>Importar Grupos</Text>
        <Text style={[styles.subtitle, { fontSize: rs(14), lineHeight: rs(20) }]}>
          Importe seus grupos do WhatsApp para organizar contatos
        </Text>
      </View>

      {deviceGroups.length === 0 ? (
        <View style={[styles.centerContainer, { padding: rs(32) }]}>
          <Ionicons name="albums-outline" size={rs(80)} color={colors.border} />
          <Text style={[styles.emptyText, { fontSize: rs(18), marginTop: rs(16) }]}>
            {loading ? 'Escaneando grupos...' : 'Nenhum grupo escaneado'}
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: rs(14), marginTop: rs(8), marginBottom: rs(32) }]}>
            Clique no botão abaixo para escanear grupos do seu dispositivo
          </Text>
          
          <TouchableOpacity 
            style={[styles.scanButton, { paddingVertical: rs(16), paddingHorizontal: rs(32), borderRadius: rs(12), gap: rs(8) }]}
            onPress={scanDeviceGroups}
            disabled={loading}
          >
            <Ionicons name="scan" size={rs(24)} color={colors.text} />
            <Text style={[styles.scanButtonText, { fontSize: rs(18) }]}>
              {loading ? 'Escaneando...' : 'Escanear Grupos'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.selectionInfo, { paddingHorizontal: rs(16), paddingVertical: rs(12), marginHorizontal: rs(16), borderRadius: rs(12), marginBottom: rs(12) }]}>
            <Text style={[styles.selectionText, { fontSize: rs(14) }]}>
              {deviceGroups.filter(g => g.selected).length} de {deviceGroups.length} grupos selecionados
            </Text>
            <TouchableOpacity
              onPress={() => {
                const allSelected = deviceGroups.every(g => g.selected);
                setDeviceGroups(deviceGroups.map(g => ({ ...g, selected: !allSelected })));
              }}
            >
              <Text style={[styles.selectAllText, { fontSize: rs(14) }]}>
                {deviceGroups.every(g => g.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={deviceGroups}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={[styles.listContainer, { paddingHorizontal: rs(16) }]}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.groupCard, item.selected && styles.groupCardSelected, { borderRadius: rs(12), padding: rs(16), marginBottom: rs(8) }]}
                onPress={() => toggleGroup(index)}
              >
                <View style={styles.groupInfo}>
                  <View style={[styles.groupAvatar, { backgroundColor: getGroupColor(item.name) + '30', width: rs(44), height: rs(44), borderRadius: rs(12) }]}>
                    <Text style={[styles.avatarText, { color: getGroupColor(item.name), fontSize: rs(20) }]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.groupText, { marginLeft: rs(12) }]}>
                    <Text style={[styles.groupName, { fontSize: rs(16), marginBottom: rs(4) }]}>{item.name}</Text>
                    <Text style={[styles.groupContacts, { fontSize: rs(13) }]}>
                      {item.contactPhones.length} contatos
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={item.selected ? 'checkbox' : 'square-outline'}
                  size={rs(24)}
                  color={item.selected ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          />

          <View style={[styles.footer, { padding: rs(16), paddingBottom: rs(32) }]}>
            <TouchableOpacity
              style={[styles.importButton, { paddingVertical: rs(16), borderRadius: rs(12), gap: rs(8) }]}
              onPress={importSelectedGroups}
              disabled={importing}
            >
              <Ionicons name="download" size={rs(20)} color={colors.text} />
              <Text style={[styles.importButtonText, { fontSize: rs(18) }]}>
                {importing ? 'Importando...' : `Importar ${deviceGroups.filter(g => g.selected).length} Grupos`}
              </Text>
            </TouchableOpacity>
          </View>
        </>
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
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  scanButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  selectionText: {
    color: theme.colors.textDim,
  },
  selectAllText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  listContainer: {
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
  },
  groupCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  groupText: {
    flex: 1,
  },
  groupName: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  groupContacts: {
    color: theme.colors.textSecondary,
  },
  footer: {
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  importButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});
