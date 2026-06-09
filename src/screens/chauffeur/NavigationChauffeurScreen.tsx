import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import CarteMapView, { GAGNOA_REGION, MarqueurCarte } from '../../components/map/CarteMapView';
import { watchPosition } from '../../services/locationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NavigationChauffeur'>;
  route: RouteProp<RootStackParamList, 'NavigationChauffeur'>;
};

export default function NavigationChauffeurScreen({ navigation, route }: Props) {
  const { passagerPrenom, depart, destination, prixEstime, courseId } = route.params;
  const [positionChauffeur, setPositionChauffeur] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    watchPosition((lat, lng) => {
      setPositionChauffeur({ latitude: lat, longitude: lng });
    }).then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  function handlePassagerPris() {
    navigation.replace('CourseEnCours', {
      passagerPrenom,
      destination,
      prixEstime,
      courseId,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* En-tête statut */}
      <View style={styles.header}>
        <View style={styles.statutBadge}>
          <View style={styles.statutPoint} />
          <Text style={styles.statutTexte}>En route vers le passager</Text>
        </View>
        <Text style={styles.titre}>Navigation</Text>
      </View>

      {/* Carte OpenStreetMap avec position GPS */}
      <View style={styles.carteWrapper}>
        <CarteMapView
          hauteur={180}
          interactive={false}
          centrerSur={positionChauffeur ?? { latitude: GAGNOA_REGION.latitude, longitude: GAGNOA_REGION.longitude }}
          marqueurs={positionChauffeur ? [{
            id: 'chauffeur',
            latitude: positionChauffeur.latitude,
            longitude: positionChauffeur.longitude,
            couleur: '#22C55E',
            emoji: '🚖',
            titre: 'Votre position',
          }] : []}
        />
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
          <Text style={styles.infoIcone}>📍</Text>
          <View style={styles.infoContenu}>
            <Text style={styles.infoLabel}>Point de prise en charge</Text>
            <Text style={styles.infoValeur} numberOfLines={2}>{depart}</Text>
          </View>
        </View>

        <View style={styles.separateur} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcone}>🏁</Text>
          <View style={styles.infoContenu}>
            <Text style={styles.infoLabel}>Destination finale</Text>
            <Text style={styles.infoValeur} numberOfLines={2}>{destination}</Text>
          </View>
        </View>

        <View style={styles.separateur} />

        <View style={styles.prixRow}>
          <Text style={styles.prixLabel}>Prix estimé</Text>
          <Text style={styles.prixValeur}>{prixEstime}</Text>
        </View>
      </View>

      {/* Bouton passager pris */}
      <TouchableOpacity
        style={styles.bouton}
        onPress={handlePassagerPris}
        activeOpacity={0.85}
      >
        <Text style={styles.boutonTexte}>✓  Passager pris en charge</Text>
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statutPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statutTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  titre: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.graphite,
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
  itineraire: {
    position: 'absolute',
    top: '30%',
    left: '26%',
    width: '30%',
    height: 3,
    backgroundColor: '#22C55E',
    borderRadius: 2,
    opacity: 0.8,
  },
  batiment: {
    position: 'absolute',
    backgroundColor: '#C9C3B4',
    borderRadius: 3,
  },
  marqueurContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  marqueurCorps: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
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
    color: COLORS.terracotta,
  },

  // Bouton
  bouton: {
    marginHorizontal: 24,
    backgroundColor: '#22C55E',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
