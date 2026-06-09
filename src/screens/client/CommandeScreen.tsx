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
          const adresse = [g.street, g.district, g.city]
            .filter(Boolean)
            .join(', ');
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
              <Text style={styles.champValeur} numberOfLines={1}>
                {depart}
              </Text>
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
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 4,
    gap: 4,
  },
  retour: {
    marginBottom: 8,
  },
  retourTexte: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '600',
  },
  titre: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.graphite,
    letterSpacing: 0.2,
  },
  sousTitre: {
    fontSize: 13,
    color: COLORS.taupe,
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
    top: '43%',
    left: '39%',
    alignItems: 'center',
  },
  marqueurOmbre: {
    width: 14,
    height: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 2,
  },
  marqueurCorps: {
    position: 'absolute',
    top: -26,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  marqueurPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blanc,
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

  // Formulaire
  formulaire: {
    marginHorizontal: 24,
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  champTrajet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  champIconeContainer: {
    width: 24,
    alignItems: 'center',
    gap: 3,
  },
  pointDepart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.blanc,
  },
  ligneTiret: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E0D8',
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
    fontSize: 11,
    color: COLORS.taupe,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  champValeur: {
    fontSize: 15,
    color: COLORS.graphite,
    fontWeight: '500',
  },
  champChargement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  champChargementTexte: {
    fontSize: 14,
    color: COLORS.taupe,
    fontStyle: 'italic',
  },
  champInput: {
    fontSize: 15,
    color: COLORS.graphite,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  separateur: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: 16,
  },

  // Estimation
  estimation: {
    marginHorizontal: 24,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  estimationGauche: {
    gap: 2,
  },
  estimationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  estimationNote: {
    fontSize: 11,
    color: COLORS.taupe,
  },
  estimationPrix: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.terracotta,
  },

  // Bouton
  bouton: {
    marginHorizontal: 24,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonDesactive: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  boutonTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
