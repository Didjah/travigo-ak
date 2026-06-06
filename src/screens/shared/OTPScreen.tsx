import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OTP'>;
  route: RouteProp<RootStackParamList, 'OTP'>;
};

const CODE_LENGTH = 6;
const RESEND_DELAY = 60;

export default function OTPScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [compteur, setCompteur] = useState(RESEND_DELAY);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (compteur <= 0) return;
    const id = setInterval(() => setCompteur((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [compteur]);

  function handleDigit(valeur: string, index: number) {
    const chiffre = valeur.replace(/\D/g, '').slice(-1);
    const nouveaux = [...digits];
    nouveaux[index] = chiffre;
    setDigits(nouveaux);
    if (erreur) setErreur('');

    if (chiffre && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleRetourArriere(index: number) {
    if (digits[index]) {
      const nouveaux = [...digits];
      nouveaux[index] = '';
      setDigits(nouveaux);
    } else if (index > 0) {
      inputs.current[index - 1]?.focus();
      const nouveaux = [...digits];
      nouveaux[index - 1] = '';
      setDigits(nouveaux);
    }
  }

  function handleColler(texte: string, index: number) {
    const chiffres = texte.replace(/\D/g, '').slice(0, CODE_LENGTH - index);
    if (!chiffres) return;
    const nouveaux = [...digits];
    for (let i = 0; i < chiffres.length; i++) {
      if (index + i < CODE_LENGTH) nouveaux[index + i] = chiffres[i];
    }
    setDigits(nouveaux);
    const prochainVide = Math.min(index + chiffres.length, CODE_LENGTH - 1);
    inputs.current[prochainVide]?.focus();
  }

  async function handleVerifier() {
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setErreur('Veuillez entrer les 6 chiffres du code');
      return;
    }
    setChargement(true);
    setErreur('');
    // TODO: vérification Supabase OTP
    await new Promise((r) => setTimeout(r, 1200));
    setChargement(false);
    setErreur('Code incorrect. Veuillez réessayer.');
  }

  function handleRenvoyer() {
    if (compteur > 0) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    setErreur('');
    setCompteur(RESEND_DELAY);
    inputs.current[0]?.focus();
    // TODO: renvoi SMS Supabase
  }

  const codeComplet = digits.every((d) => d !== '');

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

        {/* Corps */}
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.retour}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.retourTexte}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.titre}>Vérification du code</Text>
          <Text style={styles.sousTitre}>
            Code envoyé au{' '}
            <Text style={styles.numero}>+225 {phoneNumber}</Text>
          </Text>

          {/* Cellules OTP */}
          <View style={styles.cellules}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                style={[
                  styles.cellule,
                  digit ? styles.celluleRemplie : null,
                  erreur ? styles.celluleErreur : null,
                ]}
                value={digit}
                onChangeText={(v) => handleDigit(v, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') handleRetourArriere(i);
                }}
                onPaste={(e) =>
                  handleColler((e.nativeEvent as any).text ?? '', i)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden
                textAlign="center"
              />
            ))}
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {/* Bouton vérifier */}
          <TouchableOpacity
            style={[styles.bouton, !codeComplet && styles.boutonDesactive]}
            onPress={handleVerifier}
            activeOpacity={0.8}
            disabled={!codeComplet || chargement}
          >
            {chargement ? (
              <ActivityIndicator color={COLORS.blanc} />
            ) : (
              <Text style={styles.boutonTexte}>Vérifier le code</Text>
            )}
          </TouchableOpacity>

          {/* Renvoi */}
          <View style={styles.renvoyerContainer}>
            <Text style={styles.renvoyerLabel}>Code non reçu ? </Text>
            {compteur > 0 ? (
              <Text style={styles.compteur}>Renvoyer dans {compteur}s</Text>
            ) : (
              <TouchableOpacity onPress={handleRenvoyer}>
                <Text style={styles.renvoyerLien}>Renvoyer le code</Text>
              </TouchableOpacity>
            )}
          </View>
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
  logoTravi: { color: COLORS.graphite },
  logoGo: { color: COLORS.terracotta },
  logoAk: { color: COLORS.graphite },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  retour: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  retourTexte: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '600',
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
    marginBottom: 8,
  },
  numero: {
    color: COLORS.graphite,
    fontWeight: '600',
  },
  cellules: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 8,
  },
  cellule: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: COLORS.taupe,
    borderRadius: 12,
    backgroundColor: COLORS.blanc,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.graphite,
    textAlign: 'center',
  },
  celluleRemplie: {
    borderColor: COLORS.terracotta,
    backgroundColor: '#FEF6F2',
  },
  celluleErreur: {
    borderColor: COLORS.rouge,
  },
  erreur: {
    fontSize: 13,
    color: COLORS.rouge,
    textAlign: 'center',
    marginTop: 2,
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
  renvoyerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  renvoyerLabel: {
    fontSize: 13,
    color: COLORS.taupe,
  },
  compteur: {
    fontSize: 13,
    color: COLORS.taupe,
    fontWeight: '600',
  },
  renvoyerLien: {
    fontSize: 13,
    color: COLORS.terracotta,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
