import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
import { RootStackParamList } from '../../navigation/types';
import { creerCourse } from '../../services/courseService';
import { getSessionUser } from '../../services/session';
import { notifierChauffeursDispo } from '../../services/notificationService';
import CarteMapView, { GAGNOA_REGION } from '../../components/map/CarteMapView';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Commande'>;
  route: RouteProp<RootStackParamList, 'Commande'>;
};

function estimerPrix(destination: string): string {
  const len = destination.trim().length;
  if (len === 0) return '—';
  if (len < 8) return '500 – 800 FCFA';
  if (len < 18) return '800 – 1 500 FCFA';
  return '1 000 – 2 000 FCFA';
}

export default function CommandeScreen({ navigation, route }: Props) {
  const { nom } = route.params;
  const [depart, setDepart] = useState('');
  const [departChargement, setDepartChargement] = useState(true);
  const [destination, setDestination] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    async function fetchPosition() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setDepart('Ma position — Gagnoa');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const geocode = await Location.reverseGeocodeAsync(loc.coords);
        if (geocode[0]) {
          const g = geocode[0];
          const adresse = [g.street, g.district, g.city].filter(Boolean).join(', ');
          setDepart(adresse || 'Ma position — Gagnoa');
        } else {
          setDepart('Ma position — Gagnoa');
        }
      } catch {
        setDepart('Ma position — Gagnoa');
      } finally {
        setDepartChargement(false);
      }
    }
    fetchPosition();
  }, []);

  async function handleConfirmer() {
    if (!destination.trim()) return;

    let courseId: string | undefined;

    if (!__DEV__) {
      const user = getSessionUser();
      if (user) {
        const prixNumerique = destination.trim().length < 8 ? 650 :
          destination.trim().length < 18 ? 1150 : 1500;
        const id = await creerCourse(user.id, depart, destination.trim(), prixNumerique);
        courseId = id ?? undefined;
        if (id) {
          notifierChauffeursDispo('Nouvelle course !', 'Course disponible à Gagnoa.', { courseId: id });
        }
      }
    }

    navigation.navigate('Recherche', {
      nom,
      destination: destination.trim(),
      courseId,
    });
  }

  const peutConfirmer = destination.trim().length > 0 && !departChargement;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
    >
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.retour}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.retourTexte}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Commander un taxi</Text>
        <Text style={styles.sousTitre}>Gagnoa, Côte d'Ivoire</Text>
      </View>

      {/* Carte OpenStreetMap */}
      <View style={styles.carteWrapper}>
        <CarteMapView
          hauteur={180}
          interactive={false}
          centrerSur={coords ?? { latitude: GAGNOA_REGION.latitude, longitude: GAGNOA_REGION.longitude }}
          marqueurs={coords ? [{
            id: 'depart',
            latitude: coords.latitude,
            longitude: coords.longitude,
            couleur: COLORS.terracotta,
            emoji: '📍',
            titre: 'Votre position',
          }] : []}
        />
      </View>

      {/* Formulaire trajet */}
      <View style={styles.formulaire}>
        {/* Départ */}
        <View style={styles.champTrajet}>
          <View style={styles.champIconeContainer}>
            <View style={styles.pointDepart} />
            <View style={styles.ligneTiret} />
          </View>
          <View style={styles.champContenu}>
            <Text style={styles.champLabel}>Point de départ</Text>
            {departChargement ? (
              <View style={styles.champChargement}>
                <ActivityIndicator size="small" color={COLORS.terracotta} />
                <Text style={styles.champChargementTexte}>Localisation...</Text>
              </View>
            ) : (
              <Text style={styles.champValeur} numberOfLines={1}>{depart}</Text>
            )}
          </View>
        </View>

        <View style={styles.separateur} />

        {/* Destination */}
        <View style={styles.champTrajet}>
          <View style={styles.champIconeContainer}>
            <View style={styles.pointDestination} />
          </View>
          <View style={styles.champContenu}>
            <Text style={styles.champLabel}>Destination</Text>
            <TextInput
              style={styles.champInput}
              placeholder="Où allez-vous ?"
              placeholderTextColor={COLORS.taupe}
              value={destination}
              onChangeText={setDestination}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>
        </View>
      </View>

      {/* Estimation prix */}
      <View style={styles.estimation}>
        <View style={styles.estimationGauche}>
          <Text style={styles.estimationLabel}>Estimation de la course</Text>
          <Text style={styles.estimationNote}>selon distance et trafic</Text>
        </View>
        <Text style={styles.estimationPrix}>{estimerPrix(destination)}</Text>
      </View>

      {/* Bouton confirmer */}
      <TouchableOpacity
        style={[styles.bouton, !peutConfirmer && styles.boutonDesactive]}
        onPress={handleConfirmer}
        activeOpacity={0.85}
        disabled={!peutConfirmer}
      >
        <Text style={styles.boutonTexte}>Confirmer la course</Text>
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
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.safe + SPACING.xs,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  retour: {
    marginBottom: SPACING.sm,
    minHeight: TOUCH.minSize,
    justifyContent: 'center',
  },
  retourTexte: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
  },
  titre: {
    ...TYPOGRAPHY.h1,
    color: COLORS.graphite,
  },
  sousTitre: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    fontWeight: '400',
  },

  // Carte
  carteWrapper: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  // Formulaire
  formulaire: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.card,
  },
  champTrajet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    gap: SPACING.sm + SPACING.xs,
    minHeight: TOUCH.minSize,
  },
  champIconeContainer: {
    width: 24,
    alignItems: 'center',
    gap: 3,
  },
  pointDepart: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    borderWidth: 2.5,
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.blanc,
  },
  ligneTiret: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.borderLight,
    marginTop: 2,
  },
  pointDestination: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: COLORS.terracotta,
  },
  champContenu: {
    flex: 1,
    gap: 2,
  },
  champLabel: {
    ...TYPOGRAPHY.micro,
    color: COLORS.taupe,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  champValeur: {
    ...TYPOGRAPHY.h3,
    fontWeight: '500',
    color: COLORS.graphite,
  },
  champChargement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  champChargementTexte: {
    ...TYPOGRAPHY.body,
    color: COLORS.taupe,
    fontStyle: 'italic',
  },
  champInput: {
    ...TYPOGRAPHY.h3,
    fontWeight: '500',
    color: COLORS.graphite,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  separateur: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: SPACING.md,
  },

  // Estimation
  estimation: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  estimationGauche: {
    gap: 2,
  },
  estimationLabel: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  estimationNote: {
    ...TYPOGRAPHY.micro,
    color: COLORS.taupe,
    fontWeight: '400',
  },
  estimationPrix: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.terracotta,
  },

  // Bouton CTA
  bouton: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.terracotta,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minHeight: TOUCH.minButton,
    ...SHADOWS.cta,
  },
  boutonDesactive: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  boutonTexte: {
    ...TYPOGRAPHY.h2,
    color: COLORS.blanc,
    letterSpacing: 0.4,
  },
});
