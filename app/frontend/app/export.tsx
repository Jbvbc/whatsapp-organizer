import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get as apiGet } from '../services/api';

interface ExportResult {
  filename: string;
  content: string;
  contentType: string;
}

export default function ExportScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, label: string) => {
    setExporting(type);
    try {
      const { data } = await apiGet<ExportResult>(`/api/export/${type}`, `export_${type}`);
      if (!data) throw new Error('Empty response');

      if (data.contentType.includes('xlsx')) {
        Alert.alert('Exportar concluído', `Arquivo "${data.filename}" gerado (${formatBytes(data.content?.length || 0)}). Salve pelo navegador.`);
      } else {
        await Share.share({
          message: data.content,
          title: data.filename,
        });
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao exportar');
    } finally {
      setExporting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const exportOptions = [
    { type: 'contacts', label: 'Contatos', icon: 'people', color: colors.primary, format: 'CSV' },
    { type: 'groups', label: 'Grupos', icon: 'albums', color: colors.success, format: 'JSON' },
    { type: 'events', label: 'Eventos', icon: 'calendar', color: colors.info, format: 'CSV' },
    { type: 'scheduled-messages', label: 'Mensagens Agendadas', icon: 'timer', color: colors.warning, format: 'CSV' },
    { type: 'all', label: 'Exportar Tudo (Excel)', icon: 'grid', color: '#25D366', format: 'XLSX' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(12) }}>
        <Text style={[styles.sectionTitle, { fontSize: rs(16) }]}>
          Exportar Dados
        </Text>
        <Text style={[styles.sectionSubtitle, { fontSize: rs(13), marginBottom: rs(4) }]}>
          Selecione o tipo de exportação desejado
        </Text>

        {exportOptions.map(opt => (
          <TouchableOpacity
            key={opt.type}
            style={[styles.exportCard, { padding: rs(16), borderRadius: rs(10), gap: rs(12) }]}
            onPress={() => handleExport(opt.type, opt.label)}
            disabled={exporting !== null}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(12) }}>
              <View style={[styles.iconBox, { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: opt.color + '22' }]}>
                {exporting === opt.type ? (
                  <ActivityIndicator size="small" color={opt.color} />
                ) : (
                  <Ionicons name={opt.icon as any} size={rs(22)} color={opt.color} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportLabel, { fontSize: rs(15) }]}>{opt.label}</Text>
                <Text style={[styles.exportMeta, { fontSize: rs(12) }]}>
                  Formato: {opt.format}
                </Text>
              </View>
              <Ionicons name="download-outline" size={rs(20)} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.infoCard, { padding: rs(14), borderRadius: rs(10), marginTop: rs(8), gap: rs(6) }]}>
          <View style={{ flexDirection: 'row', gap: rs(8), alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={rs(20)} color={colors.primary} />
            <Text style={[styles.infoText, { fontSize: rs(12), flex: 1 }]}>
              O Excel completo inclui 4 abas: Contatos, Grupos, Eventos e Mensagens Agendadas em um único arquivo .xlsx.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
  },
  exportCard: {
    backgroundColor: theme.colors.surface,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  exportMeta: {
    color: theme.colors.textTertiary,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
  },
  infoText: {
    color: theme.colors.textSecondary,
  },
});
