import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { setSessionUser } from '../../services/session';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
  route: RouteProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const [prenom, setPrenom] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  async function choisirPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleCreerProfil() {
    const nomTrim = prenom.trim();
    if (!nomTrim) {
      setErreur('Veuillez entrer votre prénom');
      return;
    }
    setChargement(true);
    setErreur('');

    if (!__DEV__) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('utilisateurs').upsert({
          id: user.id,
          prenom: nomTrim,
          telephone: phoneNumber,
          role: 'passager',
        });
        setSessionUser({
          id: user.id,
          prenom: nomTrim,
          telephone: phoneNumber,
          role: 'passager',
        });
      }
    }

    setChargement(false);
    navigation.replace('Home', { nom: nomTrim });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <Text style={styles.logoText}>
        <Text style={styles.logoTravi}>TRAVI</Text>
        <Text style={styles.logoGo}>GO</Text>
        <Text style={styles.logoAk}>-AK</Text>
      </Text>

      <View style={styles.formContainer}>
        <Text style={styles.titre}>Créer votre profil</Text>
        <Text style={styles.sousTitre}>
          Quelques infos pour personnaliser votre expérience
        </Text>

        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={choisirPhoto}
          activeOpacity={0.8}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderIcone}>+</Text>
              <Text style={styles.avatarPlaceholderTexte}>Ajouter une photo</Text>
            </View>
          )}
          {photoUri && (
            <View style={styles.avatarModifier}>
              <Text style={styles.avatarModifierTexte}>Modifier</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Champ prénom */}
        <View style={styles.champContainer}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre prénom"
            placeholderTextColor={COLORS.taupe}
            value={prenom}
            onChangeText={(v) => { setPrenom(v); if (erreur) setErreur(''); }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleCreerProfil}
          />
        </View>

        {/* Numéro (affiché en lecture seule) */}
        <View style={styles.champContainer}>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <View style={styles.inputReadOnly}>
            <Text style={styles.inputReadOnlyTexte}>+225 {phoneNumber}</Text>
          </View>
        </View>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.bouton, (!prenom.trim() || chargement) && styles.boutonDesactive]}
          onPress={handleCreerProfil}
          activeOpacity={0.8}
          disabled={!prenom.trim() || chargement}
        >
          {chargement ? (
            <ActivityIndicator color={COLORS.blanc} />
          ) : (
            <Text style={styles.boutonTexte}>Créer mon profil</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  inner: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
    gap: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoTravi: { color: COLORS.graphite },
  logoGo: { color: COLORS.terracotta },
  logoAk: { color: COLORS.graphite },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
    lineHeight: 20,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.terracotta,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.taupe,
    borderStyle: 'dashed',
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarPlaceholderIcone: {
    fontSize: 28,
    color: COLORS.taupe,
    lineHeight: 32,
  },
  avatarPlaceholderTexte: {
    fontSize: 11,
    color: COLORS.taupe,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  avatarModifier: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.terracotta,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  avatarModifierTexte: {
    fontSize: 10,
    color: COLORS.blanc,
    fontWeight: '700',
  },
  champContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.taupe,
    borderRadius: 12,
    backgroundColor: COLORS.blanc,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.graphite,
  },
  inputReadOnly: {
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputReadOnlyTexte: {
    fontSize: 16,
    color: COLORS.taupe,
    fontWeight: '500',
  },
  erreur: {
    fontSize: 13,
    color: COLORS.rouge,
    marginTop: -4,
  },
  bouton: {
    backgroundColor: COLORS.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  boutonDesactive: {
    opacity: 0.45,
  },
  boutonTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
