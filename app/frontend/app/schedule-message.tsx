import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { get as apiGet, post as apiPost, put as apiPut, del as apiDel } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Group {
  id: string;
  name: string;
  color: string;
  contactIds: string[];
  createdAt: string;
}

interface ScheduledMessage {
  id: string;
  groupId: string;
  message: string;
  scheduledTime: string;
  isRecurring: boolean;
  recurringPattern: string;
  isActive: boolean;
  status: string;
}

export default function ScheduleMessageScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [groups, setGroups] = useState<Group[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringPattern, setRecurringPattern] = useState<string>('none');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchGroups();
    fetchScheduledMessages();
  }, []);

  const fetchGroups = async () => {
    try {
      const params = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const { data } = await apiGet<any[]>(`/api/groups${params}`, 'schedule_groups');
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      const params = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const { data } = await apiGet<any[]>(`/api/scheduled-messages${params}`, 'scheduled_messages');
      setScheduledMessages(data);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
    }
  };

  const scheduleMessage = async () => {
    if (!selectedGroupId || !message.trim()) {
      Alert.alert('Erro', 'Selecione um grupo e digite uma mensagem');
      return;
    }

    try {
      await apiPost('/api/scheduled-messages', {
        groupId: selectedGroupId,
        message: message.trim(),
        scheduledTime: scheduledTime.toISOString(),
        isRecurring,
        recurringPattern: recurringPattern === 'none' ? null : recurringPattern,
        isActive: true,
        organizationId: selectedOrg?.id,
      });
      Alert.alert('Sucesso', 'Mensagem agendada com sucesso!');
      setMessage('');
      setIsRecurring(false);
      setRecurringPattern('none');
      fetchScheduledMessages();
    } catch (error: any) {
      Alert.alert('Aviso', error.message || 'Falha ao agendar mensagem');
    }
  };

  const toggleMessageStatus = async (messageId: string, isActive: boolean) => {
    try {
      await apiPut(`/api/scheduled-messages/${messageId}`, { isActive });
      fetchScheduledMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const deleteScheduledMessage = async (messageId: string) => {
    Alert.alert(
      'Excluir Mensagem',
      'Tem certeza que deseja excluir esta mensagem agendada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDel(`/api/scheduled-messages/${messageId}`);
              fetchScheduledMessages();
            } catch (error) {
              console.error('Error deleting scheduled message:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScheduledMessage = ({ item }: { item: ScheduledMessage }) => (
    <View style={[styles.messageCard, { padding: rs(16), borderRadius: rs(12) }]}>
      <View style={[styles.messageHeader, { marginBottom: rs(8) }]}>
        <Text style={[styles.messageTitle, { fontSize: rs(16) }]}>
          {groups.find(g => g.id === item.groupId)?.name || 'Grupo Desconhecido'}
        </Text>
        <View style={[styles.statusBadge, { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(12) }]}>
          <Text style={[
            styles.statusText,
            { fontSize: rs(12), color: item.status === 'sent' ? colors.success : item.status === 'failed' ? colors.danger : colors.info }
          ]}>
            {item.status === 'sent' ? 'Enviada' : item.status === 'failed' ? 'Falha' : 'Pendente'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.messageContent, { fontSize: rs(14), marginBottom: rs(8), lineHeight: rs(20) }]}>{item.message}</Text>
      
      <Text style={[styles.messageTime, { fontSize: rs(12), marginBottom: rs(4) }]}>
        📅 {new Date(item.scheduledTime).toLocaleString('pt-BR')}
      </Text>
      
      {item.isRecurring && (
        <Text style={[styles.recurringText, { fontSize: rs(12), marginBottom: rs(8) }]}>
          🔄 {item.recurringPattern === 'daily' ? 'Diária' : 
              item.recurringPattern === 'weekly' ? 'Semanal' : 'Mensal'}
        </Text>
      )}
      
      <View style={styles.messageActions}>
        <Switch
          value={item.isActive}
          onValueChange={(value) => toggleMessageStatus(item.id, value)}
          trackColor={{ false: colors.trackFalse, true: colors.trackTrue }}
          thumbColor={item.isActive ? colors.thumbActive : colors.thumbInactive}
        />
        <TouchableOpacity 
          onPress={() => deleteScheduledMessage(item.id)}
          style={[styles.deleteButton, { padding: rs(8) }]}
        >
          <Ionicons name="trash" size={rs(20)} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: rs(20), marginBottom: rs(16) }]}>Nova Mensagem Agendada</Text>
          
          <View style={[styles.formGroup, { marginBottom: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(8) }]}>Grupo</Text>
            <View style={[styles.selectContainer, { borderRadius: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(12) }]}>
              <Ionicons name="people" size={rs(20)} color={colors.textTertiary} style={[styles.selectIcon, { marginRight: rs(8) }]} />
              <View style={styles.selectContent}>
                <Text style={[styles.selectText, { fontSize: rs(16) }]}>
                  {groups.find(g => g.id === selectedGroupId)?.name || 'Selecione um grupo'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.dropdownButton, { padding: rs(8) }]}
                onPress={() => {
                  Alert.alert('Selecione um grupo', 'Implementar dropdown de grupos');
                }}
              >
                <Ionicons name="chevron-down" size={rs(20)} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.formGroup, { marginBottom: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(8) }]}>Mensagem</Text>
            <TextInput
              style={[styles.textInput, { borderRadius: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(12), fontSize: rs(16), minHeight: rs(80) }]}
              placeholder="Digite sua mensagem aqui..."
              placeholderTextColor={colors.placeholder}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={[styles.formGroup, { marginBottom: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(8) }]}>Data e Hora</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderRadius: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(12), gap: rs(8) }]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Ionicons name="calendar" size={rs(20)} color={colors.textTertiary} />
              <Text style={[styles.dateText, { fontSize: rs(16) }]}>{formatDate(scheduledTime)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="datetime"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setScheduledTime(date);
                }}
              />
            )}
          </View>

          <View style={[styles.formGroup, { marginBottom: rs(16) }]}>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { fontSize: rs(14) }]}>Recorrente</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: colors.trackFalse, true: colors.trackTrue }}
                thumbColor={isRecurring ? colors.thumbActive : colors.thumbInactive}
              />
            </View>
            
            {isRecurring && (
              <View style={[styles.patternContainer, { marginTop: rs(12) }]}>
                <Text style={[styles.patternLabel, { fontSize: rs(14), marginBottom: rs(8) }]}>Padrão:</Text>
                <View style={[styles.patternButtons, { gap: rs(8) }]}>
                  <TouchableOpacity
                    style={[
                      styles.patternButton,
                      recurringPattern === 'daily' && styles.patternButtonActive,
                      { borderRadius: rs(8), paddingVertical: rs(8) }
                    ]}
                    onPress={() => setRecurringPattern('daily')}
                  >
                    <Text style={[
                      styles.patternButtonText,
                      recurringPattern === 'daily' && styles.patternButtonTextActive,
                      { fontSize: rs(14) }
                    ]}>Diária</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.patternButton,
                      recurringPattern === 'weekly' && styles.patternButtonActive,
                      { borderRadius: rs(8), paddingVertical: rs(8) }
                    ]}
                    onPress={() => setRecurringPattern('weekly')}
                  >
                    <Text style={[
                      styles.patternButtonText,
                      recurringPattern === 'weekly' && styles.patternButtonTextActive,
                      { fontSize: rs(14) }
                    ]}>Semanal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.patternButton,
                      recurringPattern === 'monthly' && styles.patternButtonActive,
                      { borderRadius: rs(8), paddingVertical: rs(8) }
                    ]}
                    onPress={() => setRecurringPattern('monthly')}
                  >
                    <Text style={[
                      styles.patternButtonText,
                      recurringPattern === 'monthly' && styles.patternButtonTextActive,
                      { fontSize: rs(14) }
                    ]}>Mensal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.scheduleButton, { paddingVertical: rs(16), paddingHorizontal: rs(32), borderRadius: rs(12), gap: rs(8) }]}
            onPress={scheduleMessage}
          >
            <Ionicons name="time" size={rs(20)} color={colors.text} />
            <Text style={[styles.scheduleButtonText, { fontSize: rs(18) }]}>Agendar Mensagem</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: rs(20), marginBottom: rs(16) }]}>Mensagens Agendadas</Text>
          <FlatList
            data={scheduledMessages}
            renderItem={renderScheduledMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.messagesList, { gap: rs(12) }]}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { padding: rs(32) }]}>
                <Ionicons name="time-outline" size={rs(60)} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { fontSize: rs(16), marginTop: rs(16) }]}>Nenhuma mensagem agendada</Text>
              </View>
            }
          />
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
  section: {
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  formGroup: {
  },
  label: {
    color: theme.colors.textDim,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  selectIcon: {
  },
  selectContent: {
    flex: 1,
  },
  selectText: {
    color: theme.colors.text,
  },
  dropdownButton: {
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  dateText: {
    color: theme.colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patternContainer: {
  },
  patternLabel: {
    color: theme.colors.textDim,
  },
  patternButtons: {
    flexDirection: 'row',
  },
  patternButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
  },
  patternButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  patternButtonText: {
    color: theme.colors.textDim,
  },
  patternButtonTextActive: {
    color: theme.colors.text,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  scheduleButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  messagesList: {
  },
  messageCard: {
    backgroundColor: theme.colors.surface,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTitle: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceLight,
  },
  statusText: {
    fontWeight: '500',
  },
  messageContent: {
    color: theme.colors.text,
  },
  messageTime: {
    color: theme.colors.textTertiary,
  },
  recurringText: {
    color: theme.colors.primary,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
