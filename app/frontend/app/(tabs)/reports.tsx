import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { get as apiGet } from '../../services/api';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';

interface ContactsSummary {
  totalContacts: number;
  totalFavorites: number;
  totalGroups: number;
  totalEvents: number;
  pendingMessages: number;
  totalScheduledMessages: number;
  newContactsThisWeek: number;
  tagsBreakdown: { tag: string; count: number }[];
}

interface ActivityData {
  daily: { date: string; count: number }[];
  events: { date: string; count: number }[];
  periodDays: number;
}

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();

  const [summary, setSummary] = useState<ContactsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const orgQuery = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const [{ data: summaryData, fromCache: cached }, { data: activityData }] = await Promise.all([
        apiGet<ContactsSummary>(`/api/reports/contacts-summary${orgQuery}`, 'reports_summary'),
        apiGet<ActivityData>(`/api/reports/activity${orgQuery ? orgQuery + '&' : '?'}days=30`, 'reports_activity')
      ]);
      setSummary(summaryData);
      setActivity(activityData);
      setFromCache(cached);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [selectedOrg?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: () => colors.primary,
    labelColor: () => colors.textSecondary,
    propsForLabels: { fontSize: 10 },
    decimalCount: 0,
  };

  const pieColors = ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#3498DB', '#95A5A6', '#2C3E50'];

  const pieData = (summary?.tagsBreakdown || []).slice(0, 7).map((t, i) => ({
    name: t.tag,
    count: t.count,
    color: pieColors[i % pieColors.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const barData = {
    labels: (activity?.daily || []).slice(-7).map(d => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [{ data: (activity?.daily || []).slice(-7).map(d => d.count) }],
  };

  const lineData = {
    labels: (activity?.daily || []).filter((_, i) => i % Math.max(1, Math.floor((activity?.daily.length || 1) / 6)) === 0).slice(0, 7).map(d => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [
      { data: (activity?.daily || []).map(d => d.count), color: () => colors.primary, strokeWidth: 2 },
    ],
  };

  const hasData = summary && summary.totalContacts > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(16) }}>
        {fromCache && (
          <View style={[styles.cacheBanner, { paddingVertical: rs(4), borderRadius: rs(6) }]}>
            <Text style={[styles.cacheBannerText, { fontSize: rs(12) }]}>Dados offline</Text>
          </View>
        )}

        {!hasData ? (
          <View style={[styles.emptyContainer, { padding: rs(48) }]}>
            <Ionicons name="bar-chart-outline" size={rs(60)} color={colors.border} />
            <Text style={[styles.emptyText, { fontSize: rs(16), marginTop: rs(12) }]}>
              Nenhum dado disponível
            </Text>
            <Text style={[styles.emptySubtext, { fontSize: rs(13) }]}>
              Adicione contatos para ver os relatórios
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { padding: rs(16), borderRadius: rs(12) }]}>
              <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>Resumo</Text>
              <View style={[styles.statsGrid, { gap: rs(8) }]}>
                {[
                  { icon: 'people', label: 'Contatos', value: summary!.totalContacts, color: colors.primary },
                  { icon: 'star', label: 'Favoritos', value: summary!.totalFavorites, color: colors.favorite },
                  { icon: 'albums', label: 'Grupos', value: summary!.totalGroups, color: colors.success },
                  { icon: 'calendar', label: 'Eventos', value: summary!.totalEvents, color: colors.info },
                  { icon: 'trending-up', label: 'Novos/7d', value: summary!.newContactsThisWeek, color: colors.whatsapp },
                  { icon: 'timer', label: 'Pendentes', value: summary!.pendingMessages, color: colors.danger },
                ].map((stat, i) => (
                  <View key={i} style={[styles.statCard, { padding: rs(12), borderRadius: rs(8), gap: rs(4) }]}>
                    <Ionicons name={stat.icon as any} size={rs(20)} color={stat.color} />
                    <Text style={[styles.statValue, { fontSize: rs(22), color: stat.color }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { fontSize: rs(11) }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {pieData.length > 0 && (
              <View style={[styles.card, { padding: rs(16), borderRadius: rs(12) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>Contatos por Tag</Text>
                <PieChart
                  data={pieData}
                  width={screenWidth - rs(64)}
                  height={rs(180)}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}

            {(activity?.daily || []).length > 0 && (
              <View style={[styles.card, { padding: rs(16), borderRadius: rs(12) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>Contatos por Dia (últimos 7)</Text>
                <BarChart
                  data={barData}
                  width={screenWidth - rs(64)}
                  height={rs(200)}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  style={{ borderRadius: rs(8) }}
                />
              </View>
            )}

            {(activity?.daily || []).length > 1 && (
              <View style={[styles.card, { padding: rs(16), borderRadius: rs(12) }]}>
                <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>Atividade (30 dias)</Text>
                <LineChart
                  data={lineData}
                  width={screenWidth - rs(64)}
                  height={rs(200)}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: rs(8) }}
                />
              </View>
            )}
          </>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheBanner: {
    backgroundColor: theme.colors.surfaceHighlight,
    alignItems: 'center',
  },
  cacheBannerText: {
    color: theme.colors.primary,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
