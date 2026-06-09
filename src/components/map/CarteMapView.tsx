import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { COLORS } from '../../constants/colors';

// Centre de Gagnoa, Côte d'Ivoire
export const GAGNOA_REGION = {
  latitude: 5.9306,
  longitude: -5.9631,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
};

export interface MarqueurCarte {
  id: string;
  latitude: number;
  longitude: number;
  couleur: string;
  emoji?: string;
  titre?: string;
}

interface Props {
  style?: object;
  marqueurs?: MarqueurCarte[];
  centrerSur?: { latitude: number; longitude: number };
  interactive?: boolean;
  hauteur?: number;
}

export default function CarteMapView({
  style,
  marqueurs = [],
  centrerSur,
  interactive = true,
  hauteur,
}: Props) {
  const mapRef = useRef<MapView>(null);

  // Animer vers la nouvelle position quand elle change
  useEffect(() => {
    if (!centrerSur || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: centrerSur.latitude,
        longitude: centrerSur.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      600
    );
  }, [centrerSur?.latitude, centrerSur?.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, hauteur ? { height: hauteur } : undefined, style]}
      mapType="none"
      initialRegion={GAGNOA_REGION}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {/* Tuiles OpenStreetMap — aucune clé API requise */}
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        tileSize={256}
        shouldReplaceMapContent
      />

      {marqueurs.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.titre}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {m.emoji ? (
            <View style={[styles.marqueurEmoji, { backgroundColor: m.couleur }]}>
              <Text style={styles.emoji}>{m.emoji}</Text>
            </View>
          ) : (
            <View style={[styles.marqueurPoint, { backgroundColor: m.couleur }]} />
          )}
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  marqueurEmoji: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.blanc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emoji: {
    fontSize: 18,
  },
  marqueurPoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.blanc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
