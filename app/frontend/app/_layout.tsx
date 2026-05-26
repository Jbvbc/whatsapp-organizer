import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { OfflineProvider, useOffline } from '../contexts/OfflineContext';
import { OrganizationProvider, useOrganization } from '../contexts/OrganizationContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function OfflineBanner() {
  const { isOnline, pendingSyncCount } = useOffline();
  if (isOnline) return null;
  return (
    <View style={offlineStyles.banner}>
      <Text style={offlineStyles.bannerText}>
        Modo offline {pendingSyncCount > 0 ? `(${pendingSyncCount} pendentes)` : ''}
      </Text>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff9800',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

function RootLayoutInner() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <>
      <StatusBar style={colors.statusBar} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="contact-details" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Detalhes do Contato'
          }} 
        />
        <Stack.Screen 
          name="create-group" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Novo Grupo'
          }} 
        />
        <Stack.Screen 
          name="group-details" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Detalhes do Grupo'
          }} 
        />
        <Stack.Screen 
          name="schedule-message" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Agendar Mensagem'
          }} 
        />
        <Stack.Screen 
          name="backup" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Backup e Restauração'
          }} 
        />
        <Stack.Screen 
          name="import-groups" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Importar Grupos'
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Busca Avançada'
          }} 
        />
        <Stack.Screen 
          name="organizations" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'Organizações'
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="api-keys" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            title: 'API Keys'
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <OfflineProvider>
          <AuthProvider>
            <OrganizationProvider>
              <RootLayoutInner />
            </OrganizationProvider>
          </AuthProvider>
        </OfflineProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
