import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoginChauffeur'>;
};

function validerNumeroCi(numero: string): boolean {
  return /^\d{10}$/.test(numero);
}

export default function LoginChauffeurScreen({ navigation }: Props) {
  const [numero, setNumero] = useState('');
  const [erreur, setErreur] = useState('');

  function handleConnexion() {
    if (!validerNumeroCi(numero)) {
      setErreur('Veuillez entrer un numéro valide (10 chiffres)');
      return;
    }
    setErreur('');
    navigation.navigate('OTPChauffeur', { phoneNumber: numero });
  }

  function handleChangeNumero(valeur: string) {
    setNumero(valeur.replace(/\D/g, '').slice(0, 10));
    if (erreur) setErreur('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <Text style={styles.logoText}>
          <Text style={styles.logoTravi}>TRAVI</Text>
          <Text style={styles.logoGo}>GO</Text>
          <Text style={styles.logoAk}>-AK</Text>
        </Text>

        {/* Badge chauffeur */}
        <View style={styles.badgeChauffeur}>
          <Text style={styles.badgeChauffeurTexte}>ESPACE CHAUFFEUR</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Text style={styles.titre}>Connexion chauffeur</Text>
          <Text style={styles.sousTitre}>
            Entrez votre numéro pour recevoir un code de vérification
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefix}>+225</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="XX XX XX XX XX"
              placeholderTextColor="#6B6B6B"
              keyboardType="number-pad"
              maxLength={10}
              value={numero}
              onChangeText={handleChangeNumero}
            />
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          <TouchableOpacity
            style={[
              styles.bouton,
              !validerNumeroCi(numero) && styles.boutonDesactive,
            ]}
            onPress={handleConnexion}
            activeOpacity={0.8}
          >
            <Text style={styles.boutonTexte}>Connexion chauffeur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.lienPassager}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.7}
          >
            <Text style={styles.lienPassagerTexte}>Je suis un passager →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoTravi: {
    color: COLORS.ivoire,
  },
  logoGo: {
    color: COLORS.terracotta,
  },
  logoAk: {
    color: COLORS.ivoire,
  },
  badgeChauffeur: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: -12,
  },
  badgeChauffeurTexte: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.blanc,
    letterSpacing: 1.5,
  },
  formContainer: {
    width: '100%',
    gap: 14,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ivoire,
  },
  sousTitre: {
    fontSize: 14,
    color: '#9A9A9A',
    lineHeight: 20,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#4A4A4A',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333333',
  },
  prefixContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#3D3D3D',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#4A4A4A',
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ivoire,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.ivoire,
    letterSpacing: 1,
  },
  erreur: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 2,
  },
  bouton: {
    backgroundColor: COLORS.graphite,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#555555',
  },
  boutonDesactive: {
    opacity: 0.45,
  },
  boutonTexte: {
    color: COLORS.ivoire,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lienPassager: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  lienPassagerTexte: {
    fontSize: 14,
    color: '#9A9A9A',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
