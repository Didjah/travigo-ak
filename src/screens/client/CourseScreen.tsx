import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { ecouterPositionChauffeur, type PositionChauffeur } from '../../services/courseService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Course'>;
  route: RouteProp<RootStackParamList, 'Course'>;
};

// Coordonnées de référence Gagnoa pour normaliser l'affichage sur la carte SVG
const GAGNOA_CENTER = { lat: 5.9306, lng: -5.9631 };
const CARTE_WIDTH = 300;
const CARTE_HEIGHT = 180;
const ECHELLE_LAT = 2000;
const ECHELLE_LNG = 2000;

function latLngVersXY(
  lat: number,
  lng: number
): { x: number; y: number } {
  const x = CARTE_WIDTH / 2 + (lng - GAGNOA_CENTER.lng) * ECHELLE_LNG;
  const y = CARTE_HEIGHT / 2 - (lat - GAGNOA_CENTER.lat) * ECHELLE_LAT;
  // Clamp pour rester dans la carte
  return {
    x: Math.min(Math.max(x, 12), CARTE_WIDTH - 12),
    y: Math.min(Math.max(y, 12), CARTE_HEIGHT - 12),
  };
}

export default function CourseScreen({ navigation, route }: Props) {
  const { nom, chauffeur } = route.params;
  const courseId: string | undefined = (route.params as any).courseId;

  const [positionChauffeur, setPositionChauffeur] = useState<PositionChauffeur | null>(null);
  const [gpsActif, setGpsActif] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Animation pulsation du marqueur chauffeur
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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

  const initiales = chauffeur.nom
    .split(' ')
    .map((m) => m[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Position du marqueur chauffeur sur la carte
  const marqueurPos = positionChauffeur
    ? latLngVersXY(positionChauffeur.lat, positionChauffeur.lng)
    : { x: CARTE_WIDTH * 0.35, y: CARTE_HEIGHT * 0.55 };

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
          <View style={styles.carte}>
            {/* Parcs */}
            <View style={[styles.parc, { top: '8%', left: '5%', width: 50, height: 30 }]} />
            <View style={[styles.parc, { top: '60%', right: '5%', width: 40, height: 25 }]} />

            {/* Routes principales */}
            <View style={[styles.routePrincipale, { top: '38%', left: 0, right: 0, height: 4 }]} />
            <View style={[styles.routePrincipale, { left: '42%', top: 0, bottom: 0, width: 4 }]} />

            {/* Routes secondaires */}
            <View style={[styles.routeSecondaire, { top: '65%', left: 0, right: 0, height: 2 }]} />
            <View style={[styles.routeSecondaire, { top: '18%', left: 0, right: 0, height: 2 }]} />
            <View style={[styles.routeSecondaire, { left: '20%', top: 0, bottom: 0, width: 2 }]} />
            <View style={[styles.routeSecondaire, { left: '70%', top: 0, bottom: 0, width: 2 }]} />

            {/* Bâtiments */}
            <View style={[styles.batiment, { top: '22%', left: '5%', width: 40, height: 14 }]} />
            <View style={[styles.batiment, { top: '22%', left: '25%', width: 30, height: 14 }]} />
            <View style={[styles.batiment, { top: '43%', left: '48%', width: 35, height: 18 }]} />
            <View style={[styles.batiment, { top: '43%', left: '74%', width: 28, height: 18 }]} />
            <View style={[styles.batiment, { top: '70%', left: '5%', width: 32, height: 16 }]} />
            <View style={[styles.batiment, { top: '70%', left: '25%', width: 38, height: 16 }]} />

            {/* Marqueur passager (position fixe) */}
            <View style={[styles.marqueurPassager, { top: '35%', left: '62%' }]}>
              <View style={styles.marqueurPassagerCorps}>
                <Text style={styles.marqueurIcone}>👤</Text>
              </View>
              <View style={styles.marqueurOmbre} />
            </View>

            {/* Marqueur chauffeur — position GPS temps réel */}
            <Animated.View
              style={[
                styles.marqueurChauffeur,
                {
                  left: marqueurPos.x - 18,
                  top: marqueurPos.y - 18,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.marqueurIcone}>🚖</Text>
            </Animated.View>

            {/* Badge GPS */}
            <View style={[styles.badgeGPS, gpsActif && styles.badgeGPSActif]}>
              <View style={[styles.badgeGPSPoint, gpsActif && styles.badgeGPSPointActif]} />
              <Text style={styles.badgeGPSTexte}>
                {gpsActif ? 'GPS actif' : 'GPS...'}
              </Text>
            </View>

            {/* Badge ville */}
            <View style={styles.badgeVille}>
              <Text style={styles.badgeVilleTexte}>Gagnoa, CI</Text>
            </View>
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
