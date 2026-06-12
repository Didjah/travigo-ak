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
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
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
      <Text style={{ ...TYPOGRAPHY.micro, color: COLORS.taupe, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.graphite, fontWeight: '700' }}>
        {valeur}
      </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },

  // Indicateur
  indicateur: {
    gap: SPACING.xs + 2,
  },
  indicateurBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF6F2',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.terracotta + '40',
  },
  indicateurPoint: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
  },
  indicateurTexte: {
    ...TYPOGRAPHY.caption,
    color: COLORS.terracotta,
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
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    fontWeight: '400',
  },

  // Carte GPS
  carteWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  badgeGPS: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61,61,61,0.75)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  badgeGPSActif: {
    backgroundColor: 'rgba(21,128,61,0.85)',
  },
  badgeGPSPoint: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#9CA3AF',
  },
  badgeGPSPointActif: {
    backgroundColor: '#86EFAC',
  },
  badgeGPSTexte: {
    ...TYPOGRAPHY.micro,
    color: COLORS.blanc,
    fontWeight: '600',
  },

  // Carte chauffeur
  carteChauffeur: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md - 2,
    ...SHADOWS.card,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
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
    borderRadius: RADIUS.full,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.blanc,
  },
  infos: {
    flex: 1,
    gap: 3,
  },
  chauffeurNom: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  chauffeurVehicule: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    fontWeight: '400',
  },
  plaqueContainer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.graphite,
    borderRadius: RADIUS.xs - 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  plaqueTexte: {
    ...TYPOGRAPHY.micro,
    color: COLORS.blanc,
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
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.graphite,
  },

  // Info row
  infoRow: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + SPACING.xs,
    paddingHorizontal: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  infoSep: {
    width: 1,
    height: 26,
    backgroundColor: '#F0EDE8',
  },

  // Actions
  actions: {
    gap: SPACING.sm + SPACING.xs,
    marginTop: 'auto',
  },
  boutonAppeler: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm + SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.graphite,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.blanc,
    minHeight: TOUCH.minButton,
  },
  boutonAppelerIcone: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.graphite,
    letterSpacing: 0.5,
  },
  boutonAppelerTexte: {
    ...TYPOGRAPHY.h3,
    color: COLORS.graphite,
    letterSpacing: 0.2,
  },
  boutonTerminer: {
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: TOUCH.minButton,
    ...SHADOWS.cta,
  },
  boutonTerminerTexte: {
    ...TYPOGRAPHY.h3,
    color: COLORS.blanc,
    letterSpacing: 0.4,
  },
});
