import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { startTrackingChauffeur, stopTracking, watchPosition } from '../../services/locationService';
import { terminerCourse } from '../../services/courseService';
import CarteMapView, { GAGNOA_REGION } from '../../components/map/CarteMapView';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourseEnCours'>;
  route: RouteProp<RootStackParamList, 'CourseEnCours'>;
};

function extrairePrix(prixEstime: string): number {
  const matches = prixEstime.match(/\d[\d\s]*/g);
  if (!matches || matches.length === 0) return 1000;
  const valeurs = matches.map((m) => parseInt(m.replace(/\s/g, ''), 10));
  return Math.round((valeurs[0] + (valeurs[1] ?? valeurs[0])) / 2);
}

function formaterDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CourseEnCoursScreen({ navigation, route }: Props) {
  const { passagerPrenom, destination, prixEstime, courseId } = route.params;
  const gainFinal = extrairePrix(prixEstime);
  const [duree, setDuree] = useState(0);
  const [gpsActif, setGpsActif] = useState(false);
  const [positionActuelle, setPositionActuelle] = useState<{ latitude: number; longitude: number } | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Démarrer le tracking GPS dès le montage de l'écran
  useEffect(() => {
    let actif = true;
    async function demarrerGPS() {
      if (courseId) {
        await startTrackingChauffeur(courseId);
        if (actif) setGpsActif(true);
      }
    }
    demarrerGPS();
    return () => {
      actif = false;
      stopTracking();
      setGpsActif(false);
    };
  }, [courseId]);

  useEffect(() => {
    const id = setInterval(() => setDuree((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Écouter la position GPS locale pour l'affichage sur la carte
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    watchPosition((lat, lng) => {
      setPositionActuelle({ latitude: lat, longitude: lng });
    }).then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  function handleTerminer() {
    Alert.alert(
      'Terminer la course',
      `Confirmez-vous la fin de la course vers ${destination} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            stopTracking();
            if (courseId) {
              await terminerCourse(courseId);
              // Le passager reçoit la notification de fin via Realtime → PaiementScreen
            }
            Alert.alert(
              '🎉 Course terminée',
              `Gain : ${gainFinal.toLocaleString('fr-FR')} FCFA\nDurée : ${formaterDuree(duree)}`,
              [{ text: 'Super !', onPress: () => navigation.replace('DashboardChauffeur') }]
            );
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.statutBadge}>
          <Animated.View
            style={[styles.statutPoint, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={styles.statutTexte}>Course en cours</Text>
        </View>
        <Text style={styles.titre}>En route !</Text>
        <Text style={styles.sousTitre}>Vers {destination}</Text>
      </View>

      {/* Minuteur */}
      <View style={styles.minuteurCard}>
        <Text style={styles.minuteurLabel}>Durée de la course</Text>
        <Text style={styles.minuteurValeur}>{formaterDuree(duree)}</Text>
        <View style={styles.minuteurBarre}>
          <View style={styles.minuteurBarreInner} />
        </View>
      </View>

      {/* Infos course */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcone}>👤</Text>
          <View style={styles.infoContenu}>
            <Text style={styles.infoLabel}>Passager</Text>
            <Text style={styles.infoValeur}>{passagerPrenom}</Text>
          </View>
        </View>

        <View style={styles.separateur} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcone}>🏁</Text>
          <View style={styles.infoContenu}>
            <Text style={styles.infoLabel}>Destination</Text>
            <Text style={styles.infoValeur} numberOfLines={2}>{destination}</Text>
          </View>
        </View>

        <View style={styles.separateur} />

        <View style={styles.prixRow}>
          <Text style={styles.prixLabel}>Gain estimé</Text>
          <Text style={styles.prixValeur}>{gainFinal.toLocaleString('fr-FR')} FCFA</Text>
        </View>
      </View>

      {/* Carte OpenStreetMap — position GPS en direct */}
      <View style={styles.carteWrapper}>
        <CarteMapView
          hauteur={150}
          interactive={false}
          centrerSur={positionActuelle ?? { latitude: GAGNOA_REGION.latitude, longitude: GAGNOA_REGION.longitude }}
          marqueurs={positionActuelle ? [{
            id: 'chauffeur',
            latitude: positionActuelle.latitude,
            longitude: positionActuelle.longitude,
            couleur: '#22C55E',
            emoji: '🚖',
            titre: 'Votre position',
          }] : []}
        />
        <View style={[styles.badgeGPS, gpsActif && styles.badgeGPSActif]} pointerEvents="none">
          <View style={[styles.badgeGPSPoint, gpsActif && styles.badgeGPSPointActif]} />
          <Text style={styles.badgeGPSTexte}>
            {gpsActif ? 'GPS ↑' : 'GPS...'}
          </Text>
        </View>
      </View>

      {/* Bouton terminer */}
      <TouchableOpacity
        style={styles.bouton}
        onPress={handleTerminer}
        activeOpacity={0.85}
      >
        <Text style={styles.boutonTexte}>Terminer la course</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  inner: {
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 4,
    gap: 8,
  },
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statutPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  statutTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  titre: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
  },

  // Minuteur
  minuteurCard: {
    marginHorizontal: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  minuteurLabel: {
    fontSize: 12,
    color: '#9A9A9A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  minuteurValeur: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.ivoire,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  minuteurBarre: {
    width: '80%',
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    overflow: 'hidden',
  },
  minuteurBarreInner: {
    width: '60%',
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },

  // Infos
  infoCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcone: {
    fontSize: 18,
    marginTop: 2,
  },
  infoContenu: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.taupe,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValeur: {
    fontSize: 15,
    color: COLORS.graphite,
    fontWeight: '600',
    lineHeight: 21,
  },
  separateur: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: 4,
  },
  prixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prixLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  prixValeur: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22C55E',
  },

  // Carte
  carteWrapper: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carte: {
    height: 150,
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
  trajetLigne: {
    position: 'absolute',
    top: '41%',
    left: '31%',
    width: '35%',
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  marqueurContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  marqueurCorps: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  marqueurIcone: {
    fontSize: 14,
  },
  badgeGPS: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(61,61,61,0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGPSActif: {
    backgroundColor: 'rgba(21,128,61,0.9)',
  },
  badgeGPSPoint: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  badgeGPSPointActif: {
    backgroundColor: '#86EFAC',
  },
  badgeGPSTexte: {
    fontSize: 9,
    color: COLORS.blanc,
    fontWeight: '700',
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
  },

  // Bouton
  bouton: {
    marginHorizontal: 24,
    backgroundColor: COLORS.graphite,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonTexte: {
    color: COLORS.ivoire,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
