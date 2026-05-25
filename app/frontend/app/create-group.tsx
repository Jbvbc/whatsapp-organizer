import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { get as apiGet, post as apiPost } from '../services/api';

const COLORS = [
  '#4A90E2',
  '#E24A4A',
  '#4AE290',
  '#E2904A',
  '#904AE2',
  '#E2E24A',
  '#4AE2E2',
  '#E24AE2',
];

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { selectedOrg } = useOrganization();
  const [groupName, setGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    try {
      const params = selectedOrg?.id ? `?organizationId=${selectedOrg.id}` : '';
      const { data } = await apiGet<any[]>(`/api/contacts${params}`, 'create_group_contacts');
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const toggleContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o grupo.');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um contato.');
      return;
    }

    try {
      await apiPost('/api/groups', {
        name: groupName,
        color: selectedColor,
        contactIds: selectedContacts,
        organizationId: selectedOrg?.id,
      });
      Alert.alert('Sucesso', 'Grupo criado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Aviso', error.message || 'Falha ao criar grupo.');
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => toggleContact(item.id)}
      >
        <View style={[styles.contactAvatar, { width: rs(40), height: rs(40), borderRadius: rs(20) }]}>
          <Text style={[styles.avatarText, { fontSize: rs(18) }]}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={[styles.contactInfo, { marginLeft: rs(12) }]}>
          <Text style={[styles.contactName, { fontSize: rs(16) }]}>{item.name}</Text>
          <Text style={[styles.contactPhone, { fontSize: rs(14) }]}>{item.phone}</Text>
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={rs(24)}
          color={isSelected ? colors.primary : colors.textTertiary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(12) }]}>Nome do Grupo</Text>
          <TextInput
            style={[styles.input, { borderRadius: rs(8), padding: rs(12), fontSize: rs(16) }]}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Ex: Amigos da Yoga"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(12) }]}>Cor do Grupo</Text>
          <View style={[styles.colorsContainer, { gap: rs(12) }]}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color, width: rs(50), height: rs(50), borderRadius: rs(25) },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={rs(24)} color={colors.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { padding: rs(16) }]}>
          <Text style={[styles.label, { fontSize: rs(14), marginBottom: rs(12) }]}>
            Selecionar Contatos ({selectedContacts.length})
          </Text>
          <View style={[styles.searchContainer, { borderRadius: rs(8), paddingHorizontal: rs(12), gap: rs(8) }]}>
            <Ionicons name="search" size={rs(20)} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { fontSize: rs(16), paddingVertical: rs(12) }]}
              placeholder="Buscar contatos..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={[styles.contactsList, { paddingHorizontal: rs(16), paddingBottom: rs(100) }]}
        />
      </ScrollView>

      <View style={[styles.footer, { padding: rs(16) }]}>
        <TouchableOpacity style={[styles.createButton, { padding: rs(16), borderRadius: rs(12), gap: rs(8) }]} onPress={createGroup}>
          <Ionicons name="checkmark-circle" size={rs(24)} color={colors.text} />
          <Text style={[styles.createButtonText, { fontSize: rs(18) }]}>Criar Grupo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
  },
  contactsList: {
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactItemSelected: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  contactAvatar: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  contactPhone: {
    color: theme.colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});
