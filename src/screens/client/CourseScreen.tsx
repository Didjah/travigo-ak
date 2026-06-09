import React, { useEffect, useState } from 'react';
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
import { ecouterPositionChauffeur, ecouterStatutCourse, type PositionChauffeur } from '../../services/courseService';
import CarteMapView, { GAGNOA_REGION } from '../../components/map/CarteMapView';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Course'>;
  route: RouteProp<RootStackParamList, 'Course'>;
};

export default function CourseScreen({ navigation, route }: Props) {
  const { nom, chauffeur, courseId, montant = 1000 } = route.params;

  const [positionChauffeur, setPositionChauffeur] = useState<PositionChauffeur | null>(null);
  const [gpsActif, setGpsActif] = useState(false);

  // Abonnement Supabase Realtime à la position du chauffeur
  useEffect(() => {
    if (!courseId) return;

    setGpsActif(true);
    const unsubscribe = ecouterPositionChauffeur(courseId, (pos) => {
      setPositionChauffeur(pos);
    });

    return () => {
      unsubscribe();
      setGpsActif(false);
    };
  }, [courseId]);

  // PROD : écoute la fin de course → redirection automatique vers Paiement
  useEffect(() => {
    if (__DEV__ || !courseId) return;
    const unsubscribe = ecouterStatutCourse(courseId, (course) => {
      if (course.statut === 'terminee') {
        navigation.replace('Paiement', {
          nom,
          montant: course.prix ?? montant,
          courseId,
        });
      }
    });
    return unsubscribe;
  }, [courseId, nom, montant]);

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
    // DEV uniquement : simule la fin de course côté passager
    navigation.replace('Paiement', { nom, montant, courseId });
  }

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

        {/* Carte GPS temps réel */}
        <View style={styles.carteWrapper}>
          <CarteMapView
            hauteur={160}
            interactive={false}
            centrerSur={positionChauffeur
              ? { latitude: positionChauffeur.lat, longitude: positionChauffeur.lng }
              : { latitude: GAGNOA_REGION.latitude, longitude: GAGNOA_REGION.longitude }
            }
            marqueurs={positionChauffeur ? [{
              id: 'chauffeur',
              latitude: positionChauffeur.lat,
              longitude: positionChauffeur.lng,
              couleur: '#22C55E',
              emoji: '🚖',
              titre: chauffeur.nom,
            }] : []}
          />
          <View style={[styles.badgeGPS, gpsActif && styles.badgeGPSActif]} pointerEvents="none">
            <View style={[styles.badgeGPSPoint, gpsActif && styles.badgeGPSPointActif]} />
            <Text style={styles.badgeGPSTexte}>
              {gpsActif ? 'GPS actif' : 'GPS...'}
            </Text>
          </View>
        </View>

        {/* Carte chauffeur */}
        <View style={styles.carteChauffeur}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitiales}>{initiales}</Text>
            </View>
            <View style={styles.statutOnline} />
          </View>

          <View style={styles.infos}>
            <Text style={styles.chauffeurNom}>{chauffeur.nom}</Text>
            <Text style={styles.chauffeurVehicule}>{chauffeur.vehicule}</Text>
            <View style={styles.plaqueContainer}>
              <Text style={styles.plaqueTexte}>{chauffeur.plaque}</Text>
            </View>
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteEtoile}>★</Text>
            <Text style={styles.noteValeur}>4,8</Text>
          </View>
        </View>

        {/* Info row */}
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

          {/* En PROD, la redirection vers Paiement est automatique via Realtime */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.boutonTerminer}
              onPress={handleCourseTerminee}
              activeOpacity={0.85}
            >
              <Text style={styles.boutonTerminerTexte}>🔧 Simuler fin de course</Text>
            </TouchableOpacity>
          )}
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
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  indicateur: {
    gap: 6,
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
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.graphite,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  eta: {
    fontSize: 13,
    color: COLORS.taupe,
  },

  // Carte GPS
  carteWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carte: {
    height: 160,
    backgroundColor: '#E8E3D6',
    position: 'relative',
    overflow: 'hidden',
  },
  parc: {
    position: 'absolute',
    backgroundColor: '#C8D8A8',
    borderRadius: 6,
  },
  routePrincipale: {
    position: 'absolute',
    backgroundColor: '#D5CFBC',
  },
  routeSecondaire: {
    position: 'absolute',
    backgroundColor: '#DDD9CE',
  },
  batiment: {
    position: 'absolute',
    backgroundColor: '#C9C3B4',
    borderRadius: 3,
  },
  marqueurPassager: {
    position: 'absolute',
    alignItems: 'center',
  },
  marqueurPassagerCorps: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  marqueurChauffeur: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  marqueurIcone: {
    fontSize: 16,
  },
  marqueurOmbre: {
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 2,
  },
  badgeGPS: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61,61,61,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeGPSActif: {
    backgroundColor: 'rgba(21,128,61,0.85)',
  },
  badgeGPSPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  badgeGPSPointActif: {
    backgroundColor: '#86EFAC',
  },
  badgeGPSTexte: {
    fontSize: 10,
    color: COLORS.blanc,
    fontWeight: '600',
  },
  badgeVille: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(61,61,61,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeVilleTexte: {
    fontSize: 10,
    color: COLORS.blanc,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Carte chauffeur
  carteChauffeur: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitiales: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.blanc,
    letterSpacing: 1,
  },
  statutOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.blanc,
  },
  infos: {
    flex: 1,
    gap: 3,
  },
  chauffeurNom: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  chauffeurVehicule: {
    fontSize: 12,
    color: COLORS.taupe,
  },
  plaqueContainer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.graphite,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  plaqueTexte: {
    fontSize: 10,
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
    paddingVertical: 12,
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
    height: 26,
    backgroundColor: '#F0EDE8',
  },

  // Actions
  actions: {
    gap: 10,
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
    paddingVertical: 14,
    backgroundColor: COLORS.blanc,
  },
  boutonAppelerIcone: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.graphite,
    letterSpacing: 0.5,
  },
  boutonAppelerTexte: {
    fontSize: 15,
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
