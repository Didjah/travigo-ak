import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { verifierCodeAcces, CODE_ACCES_DEV } from '../../services/mairieService';

const CM = {
  marine:   '#1A2E5A',
  fond:     '#0F1D3D',
  or:       '#C8A951',
  orClair:  '#F5E6B5',
  orDark:   '#8B7030',
  blanc:    '#FFFFFF',
  gris:     '#8CA0B8',
  erreur:   '#E53935',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoginMairie'>;
};

export default function LoginMairieScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function secouer() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleConnexion() {
    if (!code.trim()) {
      setErreur('Entrez le code d\'accès.');
      secouer();
      return;
    }
    setChargement(true);
    setErreur('');
    const valide = await verifierCodeAcces(code);
    setChargement(false);
    if (valide) {
      navigation.replace('DashboardMairie');
    } else {
      setErreur('Code d\'accès incorrect.');
      setCode('');
      secouer();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.inner}>
        {/* En-tête */}
        <View style={styles.entete}>
          <TouchableOpacity style={styles.retour} onPress={() => navigation.goBack()}>
            <Text style={styles.retourTexte}>←</Text>
          </TouchableOpacity>
          <View style={styles.emblemeContainer}>
            <View style={styles.embleme}>
              <Text style={styles.emblemeTexte}>🏛️</Text>
            </View>
          </View>
          <Text style={styles.mairieNom}>Mairie de Gagnoa</Text>
          <Text style={styles.mairieRegion}>Région du Gôh · Côte d'Ivoire</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.carte}>
          <View style={styles.carteLigne} />

          <Text style={styles.carteTitre}>Accès Administration</Text>
          <Text style={styles.carteSous}>
            Espace réservé aux agents de la Mairie de Gagnoa autorisés à consulter
            les statistiques TRAVIGO-AK.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>Code d'accès confidentiel</Text>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[styles.input, erreur ? styles.inputErreur : null]}
              value={code}
              onChangeText={(t) => {
                setCode(t);
                if (erreur) setErreur('');
              }}
              placeholder="••••••••••"
              placeholderTextColor={CM.gris}
              secureTextEntry
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleConnexion}
            />
          </Animated.View>

          {erreur ? <Text style={styles.erreurTexte}>{erreur}</Text> : null}

          {__DEV__ && (
            <TouchableOpacity
              style={styles.devHint}
              onPress={() => setCode(CODE_ACCES_DEV)}
              activeOpacity={0.7}
            >
              <Text style={styles.devHintTexte}>
                DEV · Code : {CODE_ACCES_DEV}  (appuyer pour remplir)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.bouton, (!code.trim() || chargement) && styles.boutonDesactive]}
            onPress={handleConnexion}
            disabled={!code.trim() || chargement}
            activeOpacity={0.85}
          >
            {chargement ? (
              <ActivityIndicator color={CM.marine} />
            ) : (
              <>
                <Text style={styles.boutonTexte}>Accéder au tableau de bord</Text>
                <Text style={styles.boutonIcone}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Pied */}
        <View style={styles.pied}>
          <View style={styles.piedPoint} />
          <Text style={styles.piedTexte}>TRAVIGO-AK · Plateforme transport Gagnoa</Text>
          <View style={styles.piedPoint} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.fond },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  retour: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retourTexte: { fontSize: 20, color: CM.blanc, lineHeight: 22 },
  entete: { alignItems: 'center', paddingTop: 20, gap: 8 },
  emblemeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CM.or + '22',
    borderWidth: 2,
    borderColor: CM.or,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  embleme: { alignItems: 'center', justifyContent: 'center' },
  emblemeTexte: { fontSize: 40 },
  mairieNom: {
    fontSize: 22,
    fontWeight: '800',
    color: CM.blanc,
    letterSpacing: 0.5,
  },
  mairieRegion: { fontSize: 13, color: CM.gris },
  carte: {
    backgroundColor: CM.blanc,
    borderRadius: 20,
    padding: 28,
    gap: 14,
    shadowColor: CM.or,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  carteLigne: {
    height: 4,
    backgroundColor: CM.or,
    borderRadius: 2,
    marginBottom: 4,
  },
  carteTitre: {
    fontSize: 20,
    fontWeight: '800',
    color: CM.marine,
    letterSpacing: 0.3,
  },
  carteSous: {
    fontSize: 13,
    color: '#607090',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8ECF2',
    marginVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: CM.marine,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D0D8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: CM.marine,
    letterSpacing: 4,
    backgroundColor: '#F6F8FC',
  },
  inputErreur: { borderColor: CM.erreur },
  erreurTexte: { fontSize: 13, color: CM.erreur, marginTop: -6 },
  devHint: {
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: CM.or,
  },
  devHintTexte: { fontSize: 12, color: CM.orDark, fontWeight: '600' },
  bouton: {
    backgroundColor: CM.or,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  boutonDesactive: { opacity: 0.45 },
  boutonTexte: { fontSize: 15, fontWeight: '800', color: CM.marine },
  boutonIcone: { fontSize: 18, color: CM.marine, fontWeight: '700' },
  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  piedPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: CM.or + '80',
  },
  piedTexte: { fontSize: 11, color: CM.gris },
});
