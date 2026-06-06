import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Course'>;
  route: RouteProp<RootStackParamList, 'Course'>;
};

export default function CourseScreen({ navigation, route }: Props) {
  const { nom, chauffeur } = route.params;

  async function handleAppeler() {
    const url = `tel:${chauffeur.telephone}`;
    const peutOuvrir = await Linking.canOpenURL(url);
    if (peutOuvrir) {
      Linking.openURL(url);
    } else {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application téléphone.");
    }
  }

  function handleCourseTerminee() {
    navigation.replace('Home', { nom });
  }

  // Initiales du chauffeur pour l'avatar
  const initiales = chauffeur.nom
    .split(' ')
    .map((m) => m[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Indicateur d'arrivée */}
        <View style={styles.indicateur}>
          <View style={styles.indicateurBadge}>
            <View style={styles.indicateurPoint} />
            <Text style={styles.indicateurTexte}>En route vers vous</Text>
          </View>
          <Text style={styles.titrePrincipal}>Votre chauffeur{'\n'}arrive !</Text>
          <Text style={styles.eta}>Estimation d'arrivée : ~5 min</Text>
        </View>

        {/* Carte chauffeur */}
        <View style={styles.carteChauffeur}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitiales}>{initiales}</Text>
            </View>
            <View style={styles.statutOnline} />
          </View>

          {/* Infos */}
          <View style={styles.infos}>
            <Text style={styles.chauffeurNom}>{chauffeur.nom}</Text>
            <Text style={styles.chauffeurVehicule}>{chauffeur.vehicule}</Text>
            <View style={styles.plaqueContainer}>
              <Text style={styles.plaqueTexte}>{chauffeur.plaque}</Text>
            </View>
          </View>

          {/* Note simulée */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteEtoile}>★</Text>
            <Text style={styles.noteValeur}>4,8</Text>
          </View>
        </View>

        {/* Séparateur info */}
        <View style={styles.infoRow}>
          <InfoPuce label="Type" valeur="Taxi" />
          <View style={styles.infoSep} />
          <InfoPuce label="Paiement" valeur="Espèces" />
          <View style={styles.infoSep} />
          <InfoPuce label="Statut" valeur="En approche" />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.boutonAppeler}
            onPress={handleAppeler}
            activeOpacity={0.8}
          >
            <Text style={styles.boutonAppelerIcone}>Tel</Text>
            <Text style={styles.boutonAppelerTexte}>Appeler le chauffeur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonTerminer}
            onPress={handleCourseTerminee}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonTerminerTexte}>Course terminée</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoPuce({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 11, color: COLORS.taupe, fontWeight: '600', marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: COLORS.graphite, fontWeight: '700' }}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 24,
  },
  indicateur: {
    gap: 8,
  },
  indicateurBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF6F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.terracotta + '40',
  },
  indicateurPoint: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.terracotta,
  },
  indicateurTexte: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titrePrincipal: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.graphite,
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  eta: {
    fontSize: 14,
    color: COLORS.taupe,
  },

  // Carte chauffeur
  carteChauffeur: {
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitiales: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.blanc,
    letterSpacing: 1,
  },
  statutOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.blanc,
  },
  infos: {
    flex: 1,
    gap: 4,
  },
  chauffeurNom: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  chauffeurVehicule: {
    fontSize: 13,
    color: COLORS.taupe,
  },
  plaqueContainer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.graphite,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  plaqueTexte: {
    fontSize: 11,
    color: COLORS.blanc,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noteContainer: {
    alignItems: 'center',
    gap: 2,
  },
  noteEtoile: {
    fontSize: 18,
    color: '#F59E0B',
  },
  noteValeur: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },

  // Info row
  infoRow: {
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoSep: {
    width: 1,
    height: 28,
    backgroundColor: '#F0EDE8',
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 'auto',
  },
  boutonAppeler: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.graphite,
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: COLORS.blanc,
  },
  boutonAppelerIcone: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.graphite,
    letterSpacing: 0.5,
  },
  boutonAppelerTexte: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.graphite,
    letterSpacing: 0.2,
  },
  boutonTerminer: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonTerminerTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
