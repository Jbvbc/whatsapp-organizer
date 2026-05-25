import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { get as apiGet, put as apiPut, del as apiDel } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

interface Contact {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
}

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { rs } = useResponsive();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const { data } = await apiGet<any>(`/api/contacts/${id}`, `contact_${id}`);
      setContact(data);
      setName(data.name);
      setPhone(data.phone);
      setNotes(data.notes);
      setTags(data.tags);
      setIsFavorite(data.isFavorite);
      setPhoto(data.photo);
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const saveContact = async () => {
    try {
      await apiPut(`/api/contacts/${id}`, { name, phone, notes, tags, isFavorite, photo });
      Alert.alert('Sucesso', 'Contato atualizado!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Aviso', 'Alterações salvas localmente. Serão sincronizadas quando houver conexão.');
    }
  };

  const deleteContact = () => {
    Alert.alert(
      'Excluir Contato',
      'Tem certeza que deseja excluir este contato?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDel(`/api/contacts/${id}`);
              router.back();
            } catch (error) {
              Alert.alert('Aviso', 'Exclusão agendada para quando houver conexão.');
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.loadingText, { fontSize: rs(16) }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <View style={[styles.photoSection, { paddingVertical: rs(24) }]}>
            <TouchableOpacity onPress={pickImage} style={[styles.photoContainer, { marginBottom: rs(16) }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={{ width: rs(120), height: rs(120), borderRadius: rs(60) }} />
              ) : (
                <View style={{ width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="camera" size={rs(40)} color={colors.textSecondary} />
                  <Text style={[styles.photoPlaceholderText, { fontSize: rs(12) }]}>Adicionar Foto</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.favoriteButton, { padding: rs(8) }]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={rs(32)}
                color={isFavorite ? colors.favorite : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { padding: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14) }]}>Nome</Text>
            <TextInput
              style={[styles.input, { borderRadius: rs(8), padding: rs(12), fontSize: rs(16) }]}
              value={name}
              onChangeText={setName}
              placeholder="Nome do contato"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={[styles.section, { padding: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14) }]}>Telefone</Text>
            <TextInput
              style={[styles.input, { borderRadius: rs(8), padding: rs(12), fontSize: rs(16) }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Número do telefone"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.section, { padding: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14) }]}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderRadius: rs(8), padding: rs(12), fontSize: rs(16), minHeight: rs(100) }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Adicione notas sobre este contato..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={[styles.section, { padding: rs(16) }]}>
            <Text style={[styles.label, { fontSize: rs(14) }]}>Tags</Text>
            <View style={[styles.tagInputContainer, { gap: rs(8), marginBottom: rs(12) }]}>
              <TextInput
                style={[styles.input, { flex: 1, borderRadius: rs(8), padding: rs(12), fontSize: rs(16) }]}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Adicionar tag (ex: respiração, yoga)"
                placeholderTextColor={colors.placeholder}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={[styles.addButton, { width: rs(48), height: rs(48), borderRadius: rs(8) }]} onPress={addTag}>
                <Ionicons name="add" size={rs(24)} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.tagsContainer, { gap: rs(8) }]}>
              {tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(16), gap: rs(6) }]}>
                  <Text style={[styles.tagText, { fontSize: rs(14) }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close-circle" size={rs(18)} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { margin: rs(16), padding: rs(16), borderRadius: rs(12), gap: rs(8) }]} onPress={saveContact}>
            <Ionicons name="checkmark-circle" size={rs(24)} color={colors.text} />
            <Text style={[styles.saveButtonText, { fontSize: rs(18) }]}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteButton, { marginHorizontal: rs(16), marginBottom: rs(32), padding: rs(16), borderRadius: rs(12), gap: rs(8) }]} onPress={deleteContact}>
            <Ionicons name="trash" size={rs(20)} color={colors.danger} />
            <Text style={[styles.deleteButtonText, { fontSize: rs(16) }]}>Excluir Contato</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  photoSection: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  photoContainer: {
  },
  photoPlaceholderText: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  favoriteButton: {
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  tagText: {
    color: theme.colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
