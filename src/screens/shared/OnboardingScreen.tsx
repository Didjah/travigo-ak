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
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

function validerNumeroCi(numero: string): boolean {
  return /^\d{10}$/.test(numero);
}

export default function OnboardingScreen({ navigation }: Props) {
  const [numero, setNumero] = useState('');
  const [erreur, setErreur] = useState('');

  function handleContinuer() {
    if (!validerNumeroCi(numero)) {
      setErreur('Veuillez entrer un numéro valide (10 chiffres)');
      return;
    }
    setErreur('');
    navigation.navigate('OTP', { phoneNumber: numero });
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

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Text style={styles.titre}>Entrez votre numéro de téléphone</Text>
          <Text style={styles.sousTitre}>
            Nous vous enverrons un code de vérification
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefix}>+225</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="XX XX XX XX XX"
              placeholderTextColor={COLORS.taupe}
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
            onPress={handleContinuer}
            activeOpacity={0.8}
          >
            <Text style={styles.boutonTexte}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
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
    color: COLORS.graphite,
  },
  logoGo: {
    color: COLORS.terracotta,
  },
  logoAk: {
    color: COLORS.graphite,
  },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  titre: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.graphite,
    marginBottom: 4,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.taupe,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.blanc,
  },
  prefixContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F0EDE8',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: COLORS.taupe,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.graphite,
    letterSpacing: 1,
  },
  erreur: {
    fontSize: 13,
    color: COLORS.rouge,
    marginTop: 4,
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
