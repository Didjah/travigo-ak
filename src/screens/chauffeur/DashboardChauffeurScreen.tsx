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
import { watchPosition } from '../../services/locationService';
import { ecouterNouvellesCourses } from '../../services/courseService';
import { getSessionUser } from '../../services/session';
import {
  getAbonnementActif,
  getDernierAbonnement,
  PLANS,
  joursRestants,
  estExpire,
  type Abonnement,
} from '../../services/abonnementService';
import {
  getAbonnementsScolaireChauffeur,
  type AbonnementScolaire,
} from '../../services/scolaireService';
import {
  getLivraisonsDisponibles,
  getLivraisonsLivreur,
} from '../../services/livraisonService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DashboardChauffeur'>;
};

const CARTE_WIDTH = 300;
const CARTE_HEIGHT = 180;
const GAGNOA = { lat: 5.9306, lng: -5.9631 };
const ECHELLE = 1800;

function latLngVersXY(lat: number, lng: number) {
  const x = CARTE_WIDTH / 2 + (lng - GAGNOA.lng) * ECHELLE;
  const y = CARTE_HEIGHT / 2 - (lat - GAGNOA.lat) * ECHELLE;
  return {
    x: Math.min(Math.max(x, 16), CARTE_WIDTH - 16),
    y: Math.min(Math.max(y, 16), CARTE_HEIGHT - 16),
  };
}

export default function DashboardChauffeurScreen({ navigation }: Props) {
  const sessionUser = getSessionUser();
  const CHAUFFEUR_NOM = sessionUser?.prenom || 'Chauffeur';

  const [disponible, setDisponible] = useState(false);
  const [courses] = useState(3);
  const [gains] = useState(4500);
  const [positionGPS, setPositionGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [courseScolaires, setCourseScolaires] = useState<AbonnementScolaire[]>([]);
  const [nbLivraisonsDisponibles, setNbLivraisonsDisponibles] = useState(0);
  const [nbLivraisonsEnCours, setNbLivraisonsEnCours] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopWatchRef = useRef<(() => void) | null>(null);
  const stopRealtimeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function chargerDonnees() {
      const user = getSessionUser();
      if (!user) return;
      const [actif, scolaires, livDispo, livMien] = await Promise.all([
        getAbonnementActif(user.id),
        getAbonnementsScolaireChauffeur(user.id),
        getLivraisonsDisponibles(),
        getLivraisonsLivreur(user.id),
      ]);
      if (actif) {
        setAbonnement(actif);
      } else {
        const dernier = await getDernierAbonnement(user.id);
        setAbonnement(dernier);
      }
      setCourseScolaires(scolaires);
      setNbLivraisonsDisponibles(livDispo.length);
      setNbLivraisonsEnCours(livMien.length);
    }
    chargerDonnees();
  }, []);

  // Recharger au focus (retour depuis AbonnementScreen / CourseScolaireScreen)
  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      const user = getSessionUser();
      if (!user) return;
      const [actif, scolaires, livDispo, livMien] = await Promise.all([
        getAbonnementActif(user.id),
        getAbonnementsScolaireChauffeur(user.id),
        getLivraisonsDisponibles(),
        getLivraisonsLivreur(user.id),
      ]);
      if (actif) {
        setAbonnement(actif);
      } else {
        const dernier = await getDernierAbonnement(user.id);
        setAbonnement(dernier);
      }
      setCourseScolaires(scolaires);
      setNbLivraisonsDisponibles(livDispo.length);
      setNbLivraisonsEnCours(livMien.length);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (disponible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // GPS local
      watchPosition((lat, lng) => setPositionGPS({ lat, lng })).then((stop) => {
        stopWatchRef.current = stop;
      });

      if (__DEV__) {
        // Simulation DEV : course entrante après 8s
        timerRef.current = setTimeout(() => {
          navigation.navigate('CourseEntrante', {
            passagerPrenom: 'Awa',
            depart: 'Marché central de Gagnoa',
            destination: 'Quartier Bromakote',
            prixEstime: '800 – 1 200 FCFA',
          });
        }, 8000);
      } else {
        // PROD : écoute Realtime des nouvelles courses en_attente
        stopRealtimeRef.current = ecouterNouvellesCourses((course) => {
          navigation.navigate('CourseEntrante', {
            passagerPrenom: 'Passager',
            depart: course.depart,
            destination: course.destination,
            prixEstime: course.prix
              ? `${course.prix.toLocaleString('fr-FR')} FCFA`
              : '— FCFA',
            courseId: course.id,
          });
        });
      }

      return () => {
        pulse.stop();
        if (timerRef.current) clearTimeout(timerRef.current);
        stopWatchRef.current?.();
        stopWatchRef.current = null;
        stopRealtimeRef.current?.();
        stopRealtimeRef.current = null;
      };
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearTimeout(timerRef.current);
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      stopRealtimeRef.current?.();
      stopRealtimeRef.current = null;
    }
  }, [disponible]);

  function toggleDisponible() {
    setDisponible((v) => !v);
  }

  // Position du marqueur voiture sur la carte
  const marqueurXY = positionGPS
    ? latLngVersXY(positionGPS.lat, positionGPS.lng)
    : { x: CARTE_WIDTH * 0.42, y: CARTE_HEIGHT * 0.38 };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.salutation}>Bonjour,</Text>
          <Text style={styles.nom}>{CHAUFFEUR_NOM}</Text>
        </View>
        <TouchableOpacity
          style={styles.badgeChauffeur}
          onPress={() => navigation.navigate('Abonnement')}
          activeOpacity={0.8}
        >
          <Text style={styles.badgeTexte}>CHAUFFEUR</Text>
        </TouchableOpacity>
      </View>

      {/* Badge abonnement */}
      {(() => {
        if (!abonnement) {
          return (
            <TouchableOpacity
              style={styles.aboBanniereAlerte}
              onPress={() => navigation.navigate('Abonnement')}
              activeOpacity={0.85}
            >
              <Text style={styles.aboBanniereAlerteTexte}>
                ⚠️ Aucun abonnement actif — Souscrire maintenant
              </Text>
            </TouchableOpacity>
          );
        }
        const expire = estExpire(abonnement) || abonnement.statut !== 'actif';
        const jours = joursRestants(abonnement);
        const plan = PLANS[abonnement.type];
        if (expire) {
          return (
            <TouchableOpacity
              style={styles.aboBanniereAlerte}
              onPress={() => navigation.navigate('Abonnement')}
              activeOpacity={0.85}
            >
              <Text style={styles.aboBanniereAlerteTexte}>
                🔴 Abonnement expiré — Renouveler pour rester actif
              </Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            style={[styles.aboBadgeActif, jours <= 5 && styles.aboBadgeExpireBientot]}
            onPress={() => navigation.navigate('Abonnement')}
            activeOpacity={0.85}
          >
            <View style={[styles.aboBadgePoint, jours <= 5 ? styles.aboBadgePointOrange : styles.aboBadgePointVert]} />
            <Text style={styles.aboBadgeTexte}>
              {plan.emoji} {plan.label} · {jours} jour{jours > 1 ? 's' : ''} restant{jours > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        );
      })()}

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
              {disponible
                ? positionGPS ? 'GPS actif • En attente de course...' : 'Localisation...'
                : 'Activez pour recevoir des courses'}
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

      {/* Carte position chauffeur */}
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

          {/* Marqueur chauffeur — position GPS réelle si disponible */}
          <View
            style={[
              styles.marqueurContainer,
              { left: marqueurXY.x - 18, top: marqueurXY.y - 18 },
            ]}
          >
            <View style={[styles.marqueurCorps, disponible ? styles.marqueurActif : styles.marqueurInactif]}>
              <Text style={styles.marqueurIcone}>🚖</Text>
            </View>
            <View style={styles.marqueurOmbre} />
          </View>

          {/* Badge GPS */}
          {disponible && (
            <View style={[styles.badgeGPS, positionGPS ? styles.badgeGPSActif : undefined]}>
              <View style={[styles.badgeGPSPoint, positionGPS ? styles.badgeGPSPointActif : undefined]} />
              <Text style={styles.badgeGPSTexte}>
                {positionGPS ? 'GPS réel' : 'GPS...'}
              </Text>
            </View>
          )}

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

      {/* Coordonnées GPS si disponibles */}
      {disponible && positionGPS && (
        <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>📍 Position GPS</Text>
          <Text style={styles.coordsValeur}>
            {positionGPS.lat.toFixed(4)}° N, {positionGPS.lng.toFixed(4)}° E
          </Text>
        </View>
      )}

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

      {/* Section Scolaire du jour */}
      {(courseScolaires.length > 0 || __DEV__) && (
        <TouchableOpacity
          style={styles.scolaireCard}
          onPress={() => navigation.navigate('CourseScolaire')}
          activeOpacity={0.85}
        >
          <View style={styles.scolaireLeft}>
            <Text style={styles.scolaireIcone}>🏫</Text>
            <View>
              <Text style={styles.scolaireTitre}>Scolaire du jour</Text>
              <Text style={styles.scolaireSous}>
                {__DEV__ && courseScolaires.length === 0
                  ? '3 enfants (simulation DEV)'
                  : `${courseScolaires.length} enfant${courseScolaires.length > 1 ? 's' : ''} à transporter`}
              </Text>
            </View>
          </View>
          <View style={styles.scolaireChevron}>
            <Text style={styles.scolaireChevronTexte}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Section Livraisons disponibles */}
      {(nbLivraisonsDisponibles > 0 || nbLivraisonsEnCours > 0 || __DEV__) && (
        <TouchableOpacity
          style={styles.livraisonCard}
          onPress={() => navigation.navigate('LivraisonChauffeur')}
          activeOpacity={0.85}
        >
          <View style={styles.livraisonLeft}>
            <Text style={styles.livraisonIcone}>📦</Text>
            <View>
              <Text style={styles.livraisonTitre}>Livraisons disponibles</Text>
              <Text style={styles.livraisonSous}>
                {__DEV__ && nbLivraisonsDisponibles === 0
                  ? '2 livraisons (simulation DEV)'
                  : nbLivraisonsEnCours > 0
                  ? `${nbLivraisonsEnCours} en cours · ${nbLivraisonsDisponibles} disponible${nbLivraisonsDisponibles > 1 ? 's' : ''}`
                  : `${nbLivraisonsDisponibles} livraison${nbLivraisonsDisponibles > 1 ? 's' : ''} à prendre`}
              </Text>
            </View>
          </View>
          {nbLivraisonsEnCours > 0 && (
            <View style={styles.livraisonBadgeEnCours}>
              <Text style={styles.livraisonBadgeTexte}>{nbLivraisonsEnCours}</Text>
            </View>
          )}
          <View style={styles.livraisonChevron}>
            <Text style={styles.livraisonChevronTexte}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bouton Historique */}
      <TouchableOpacity
        style={styles.boutonHistorique}
        onPress={() => navigation.navigate('HistoriqueChauffeur')}
        activeOpacity={0.8}
      >
        <Text style={styles.boutonHistoriqueIcone}>📋</Text>
        <View>
          <Text style={styles.boutonHistoriqueTexte}>Historique</Text>
          <Text style={styles.boutonHistoriqueSous}>Voir toutes mes courses</Text>
        </View>
      </TouchableOpacity>

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

  // Badge abonnement
  aboBanniereAlerte: {
    marginHorizontal: 24,
    backgroundColor: '#3D1A00',
    borderWidth: 1,
    borderColor: COLORS.terracotta,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  aboBanniereAlerteTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFA07A',
    textAlign: 'center',
  },
  aboBadgeActif: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  aboBadgeExpireBientot: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  aboBadgePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aboBadgePointVert: {
    backgroundColor: '#22C55E',
  },
  aboBadgePointOrange: {
    backgroundColor: '#F97316',
  },
  aboBadgeTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.graphite,
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
    alignItems: 'center',
    width: 36,
    height: 36,
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
  badgeGPS: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61,61,61,0.8)',
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

  // Coordonnées GPS
  coordsCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  coordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  coordsValeur: {
    fontSize: 11,
    color: COLORS.graphite,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
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

  // Section scolaire
  scolaireCard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F0',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FDDCB5',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scolaireLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  scolaireIcone: {
    fontSize: 28,
  },
  scolaireTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  scolaireSous: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 2,
  },
  scolaireChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scolaireChevronTexte: {
    fontSize: 18,
    color: COLORS.blanc,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Section livraison
  livraisonCard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#C7D3F5',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  livraisonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  livraisonIcone: { fontSize: 28 },
  livraisonTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  livraisonSous: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 2,
  },
  livraisonBadgeEnCours: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  livraisonBadgeTexte: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.blanc,
  },
  livraisonChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livraisonChevronTexte: {
    fontSize: 18,
    color: COLORS.blanc,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Bouton Historique
  boutonHistorique: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  boutonHistoriqueIcone: {
    fontSize: 22,
  },
  boutonHistoriqueTexte: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  boutonHistoriqueSous: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 1,
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
