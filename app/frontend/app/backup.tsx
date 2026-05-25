import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get as apiGet } from '../services/api';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';

export default function BackupScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = useState(false);

  const createBackup = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<any>('/api/backup', 'backup', 5);
      
      if (data.data) {
        const filename = `backup_${new Date().toISOString().split('T')[0]}.zip`;
        const filepath = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(filepath, data.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        Alert.alert(
          'Backup Criado!',
          `Backup salvo com sucesso!\n\nTamanho: ${(data.size / 1024 / 1024).toFixed(2)} MB`,
          [
            {
              text: 'Compartilhar',
              onPress: () => shareBackup(filepath),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Aviso', 'Backup não disponível offline. Conecte-se à internet.');
    } finally {
      setLoading(false);
    }
  };

  const shareBackup = async (filepath: string) => {
    try {
      const shareOptions = {
        url: filepath,
        type: 'application/zip',
        filename: filepath.split('/').pop(),
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing backup:', error);
    }
  };

  const downloadBackup = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<any>('/download/backup', 'download_backup', 5);
      
      if (data.content) {
        const filename = data.filename;
        const filepath = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(filepath, data.content, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        Alert.alert(
          'Backup Baixado!',
          `Backup salvo no dispositivo:\n${filename}`,
          [
            {
              text: 'Abrir',
              onPress: () => openFile(filepath),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      Alert.alert('Erro', 'Falha ao baixar backup. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportContacts = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<any>('/api/export/contacts', 'export_contacts', 5);
      
      if (data.content) {
        const filename = data.filename;
        const filepath = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(filepath, data.content);
        
        Alert.alert(
          'Contatos Exportados!',
          `Arquivo CSV salvo:\n${filename}`,
          [
            {
              text: 'Compartilhar',
              onPress: () => shareCSV(filepath, data.contentType),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error exporting contacts:', error);
      Alert.alert('Erro', 'Falha ao exportar contatos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportGroups = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<any>('/api/export/groups', 'export_groups', 5);
      
      if (data.content) {
        const filename = data.filename;
        const filepath = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.writeAsStringAsync(filepath, data.content);
        
        Alert.alert(
          'Grupos Exportados!',
          `Arquivo JSON salvo:\n${filename}`,
          [
            {
              text: 'Compartilhar',
              onPress: () => shareCSV(filepath, data.contentType),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error exporting groups:', error);
      Alert.alert('Erro', 'Falha ao exportar grupos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const shareCSV = async (filepath: string, contentType: string) => {
    try {
      const shareOptions = {
        url: filepath,
        type: contentType,
        filename: filepath.split('/').pop(),
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing CSV:', error);
    }
  };

  const openFile = async (filepath: string) => {
    try {
      const content = await FileSystem.readAsStringAsync(filepath);
      Alert.alert('Arquivo Aberto', 'O backup foi aberto com sucesso.');
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const restoreBackup = () => {
    Alert.alert(
      'Restaurar Backup',
      'Esta ação substituirá todos os dados atuais. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => performRestore(),
        },
      ]
    );
  };

  const performRestore = async () => {
    setLoading(true);
    try {
      Alert.alert(
        'Restaurar Backup',
        'Selecione um arquivo de backup para restaurar.',
        [
          {
            text: 'Selecionar Arquivo',
            onPress: () => console.log('Select file...'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error during restore:', error);
      Alert.alert('Erro', 'Falha ao restaurar backup. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(28), marginBottom: rs(8) }]}>Backup e Restauração</Text>
          <Text style={[styles.subtitle, { fontSize: rs(16) }]}>Gerencie seus dados e backups</Text>
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: rs(20), marginBottom: rs(16) }]}>Criar Backup</Text>
          
          <View style={[styles.card, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
            <View style={[styles.cardContent, { marginBottom: rs(16) }]}>
              <Ionicons name="cloud-upload" size={rs(32)} color={colors.primary} />
              <View style={[styles.cardText, { marginLeft: rs(16) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(18), marginBottom: rs(4) }]}>Backup Completo</Text>
                <Text style={[styles.cardDescription, { fontSize: rs(14), lineHeight: rs(20) }]}>
                  Exporta todos os contatos, grupos e mensagens agendadas
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(8), gap: rs(8) }]}
              onPress={createBackup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="download" size={rs(20)} color={colors.text} />
                  <Text style={[styles.buttonText, { fontSize: rs(16) }]}>Criar Backup</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
            <View style={[styles.cardContent, { marginBottom: rs(16) }]}>
              <Ionicons name="document-text" size={rs(32)} color={colors.success} />
              <View style={[styles.cardText, { marginLeft: rs(16) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(18), marginBottom: rs(4) }]}>Exportar Contatos</Text>
                <Text style={[styles.cardDescription, { fontSize: rs(14), lineHeight: rs(20) }]}>
                  Exporta contatos para arquivo CSV
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(8), gap: rs(8) }]}
              onPress={exportContacts}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="document" size={rs(20)} color={colors.text} />
                  <Text style={[styles.buttonText, { fontSize: rs(16) }]}>Exportar CSV</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
            <View style={[styles.cardContent, { marginBottom: rs(16) }]}>
              <Ionicons name="people" size={rs(32)} color="#FF9800" />
              <View style={[styles.cardText, { marginLeft: rs(16) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(18), marginBottom: rs(4) }]}>Exportar Grupos</Text>
                <Text style={[styles.cardDescription, { fontSize: rs(14), lineHeight: rs(20) }]}>
                  Exporta grupos para arquivo JSON
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(8), gap: rs(8) }]}
              onPress={exportGroups}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="albums" size={rs(20)} color={colors.text} />
                  <Text style={[styles.buttonText, { fontSize: rs(16) }]}>Exportar JSON</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: rs(20), marginBottom: rs(16) }]}>Restaurar Dados</Text>
          
          <View style={[styles.card, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
            <View style={[styles.cardContent, { marginBottom: rs(16) }]}>
              <Ionicons name="cloud-download" size={rs(32)} color="#9C27B0" />
              <View style={[styles.cardText, { marginLeft: rs(16) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(18), marginBottom: rs(4) }]}>Restaurar Backup</Text>
                <Text style={[styles.cardDescription, { fontSize: rs(14), lineHeight: rs(20) }]}>
                  Restaura todos os dados de um arquivo de backup
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(8), gap: rs(8) }]}
              onPress={restoreBackup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="upload" size={rs(20)} color={colors.text} />
                  <Text style={[styles.buttonText, { fontSize: rs(16) }]}>Restaurar Backup</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { borderRadius: rs(16), padding: rs(16), marginBottom: rs(12) }]}>
            <View style={[styles.cardContent, { marginBottom: rs(16) }]}>
              <Ionicons name="folder-open" size={rs(32)} color="#607D8B" />
              <View style={[styles.cardText, { marginLeft: rs(16) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(18), marginBottom: rs(4) }]}>Baixar Backup</Text>
                <Text style={[styles.cardDescription, { fontSize: rs(14), lineHeight: rs(20) }]}>
                  Baixa o backup mais recente do servidor
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, { paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(8), gap: rs(8) }]}
              onPress={downloadBackup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={rs(20)} color={colors.text} />
                  <Text style={[styles.buttonText, { fontSize: rs(16) }]}>Baixar do Servidor</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: rs(20), marginBottom: rs(16) }]}>Dicas de Backup</Text>
          
          <View style={[styles.tipCard, { borderRadius: rs(8), padding: rs(12), marginBottom: rs(8) }]}>
            <Ionicons name="information-circle" size={rs(20)} color={colors.primary} />
            <Text style={[styles.tipText, { fontSize: rs(14), marginLeft: rs(8), lineHeight: rs(20) }]}>
              • Crie backups regularmente para evitar perda de dados
            </Text>
          </View>
          
          <View style={[styles.tipCard, { borderRadius: rs(8), padding: rs(12), marginBottom: rs(8) }]}>
            <Ionicons name="information-circle" size={rs(20)} color={colors.primary} />
            <Text style={[styles.tipText, { fontSize: rs(14), marginLeft: rs(8), lineHeight: rs(20) }]}>
              • Armazene backups em múltiplos locais (servidor, cloud, dispositivo)
            </Text>
          </View>
          
          <View style={[styles.tipCard, { borderRadius: rs(8), padding: rs(12), marginBottom: rs(8) }]}>
            <Ionicons name="information-circle" size={rs(20)} color={colors.primary} />
            <Text style={[styles.tipText, { fontSize: rs(14), marginLeft: rs(8), lineHeight: rs(20) }]}>
              • Verifique a integridade dos backups antes de restaurar
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
  scrollView: {
    flex: 1,
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
  section: {
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardDescription: {
    color: theme.colors.textTertiary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
  tipText: {
    flex: 1,
    color: theme.colors.textDim,
  },
});
