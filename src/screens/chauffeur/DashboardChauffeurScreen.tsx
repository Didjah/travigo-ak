import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DashboardChauffeur'>;
};

const CHAUFFEUR_NOM = 'Konan Yao';

export default function DashboardChauffeurScreen({ navigation }: Props) {
  const [disponible, setDisponible] = useState(false);
  const [courses, setCourses] = useState(3);
  const [gains, setGains] = useState(4500);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disponible) {
      // Animation pulsation du point de statut
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Simulation course entrante après 8 secondes en mode DEV
      if (__DEV__) {
        timerRef.current = setTimeout(() => {
          navigation.navigate('CourseEntrante', {
            passagerPrenom: 'Awa',
            depart: 'Marché central de Gagnoa',
            destination: 'Quartier Bromakote',
            prixEstime: '800 – 1 200 FCFA',
          });
        }, 8000);
      }

      return () => {
        pulse.stop();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [disponible]);

  function toggleDisponible() {
    setDisponible((v) => !v);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.salutation}>Bonjour,</Text>
          <Text style={styles.nom}>{CHAUFFEUR_NOM}</Text>
        </View>
        <View style={styles.badgeChauffeur}>
          <Text style={styles.badgeTexte}>CHAUFFEUR</Text>
        </View>
      </View>

      {/* Toggle disponibilité */}
      <View style={[styles.toggleCard, disponible ? styles.toggleCardActif : styles.toggleCardInactif]}>
        <View style={styles.toggleLeft}>
          <Animated.View
            style={[
              styles.statutPoint,
              disponible ? styles.statutPointActif : styles.statutPointInactif,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View>
            <Text style={styles.toggleTitre}>
              {disponible ? 'Disponible' : 'Hors ligne'}
            </Text>
            <Text style={styles.toggleSousTitre}>
              {disponible ? 'En attente de course...' : 'Activez pour recevoir des courses'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggleBouton, disponible ? styles.toggleBoutonActif : styles.toggleBoutonInactif]}
          onPress={toggleDisponible}
          activeOpacity={0.85}
        >
          <Text style={styles.toggleBoutonTexte}>
            {disponible ? 'Désactiver' : 'Activer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Carte stylisée position chauffeur */}
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

          {/* Marqueur chauffeur (voiture) */}
          <View style={styles.marqueurContainer}>
            <View style={[styles.marqueurCorps, disponible ? styles.marqueurActif : styles.marqueurInactif]}>
              <Text style={styles.marqueurIcone}>🚖</Text>
            </View>
            <View style={styles.marqueurOmbre} />
          </View>

          {/* Badge ville */}
          <View style={styles.badgeVille}>
            <Text style={styles.badgeVilleTexte}>Gagnoa, CI</Text>
          </View>

          {/* Overlay hors-ligne */}
          {!disponible && (
            <View style={styles.carteOverlay}>
              <Text style={styles.carteOverlayTexte}>Hors ligne</Text>
            </View>
          )}
        </View>
      </View>

      {/* Statistiques du jour */}
      <Text style={styles.sectionTitre}>Aujourd'hui</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValeur}>{courses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPrincipal]}>
          <Text style={[styles.statValeur, styles.statValeurPrincipal]}>
            {gains.toLocaleString('fr-FR')}
          </Text>
          <Text style={[styles.statLabel, styles.statLabelPrincipal]}>FCFA gagnés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValeur}>4.8</Text>
          <Text style={styles.statLabel}>Note ★</Text>
        </View>
      </View>

      {/* Message mode DEV */}
      {__DEV__ && disponible && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerTexte}>
            Mode DEV — Course simulée dans 8 secondes
          </Text>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 4,
  },
  salutation: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '500',
  },
  nom: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  badgeChauffeur: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeTexte: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ivoire,
    letterSpacing: 1.5,
  },

  // Toggle card
  toggleCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleCardActif: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  toggleCardInactif: {
    backgroundColor: COLORS.blanc,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statutPoint: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statutPointActif: {
    backgroundColor: '#22C55E',
  },
  statutPointInactif: {
    backgroundColor: '#9CA3AF',
  },
  toggleTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  toggleSousTitre: {
    fontSize: 12,
    color: COLORS.taupe,
    marginTop: 2,
  },
  toggleBouton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  toggleBoutonActif: {
    backgroundColor: '#DC2626',
  },
  toggleBoutonInactif: {
    backgroundColor: '#22C55E',
  },
  toggleBoutonTexte: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blanc,
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
    height: 180,
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
  marqueurContainer: {
    position: 'absolute',
    top: '35%',
    left: '40%',
    alignItems: 'center',
  },
  marqueurCorps: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  marqueurActif: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  marqueurInactif: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  marqueurIcone: {
    fontSize: 18,
  },
  marqueurOmbre: {
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 2,
  },
  badgeVille: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(61,61,61,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeVilleTexte: {
    fontSize: 11,
    color: COLORS.blanc,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  carteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,42,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteOverlayTexte: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.blanc,
    letterSpacing: 1,
  },

  // Stats
  sectionTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.graphite,
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardPrincipal: {
    backgroundColor: COLORS.terracotta,
    flex: 1.4,
  },
  statValeur: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  statValeurPrincipal: {
    color: COLORS.blanc,
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 4,
    fontWeight: '600',
  },
  statLabelPrincipal: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Banner DEV
  devBanner: {
    marginHorizontal: 24,
    backgroundColor: '#3D3200',
    borderWidth: 1,
    borderColor: '#7A6300',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  devBannerTexte: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
});
