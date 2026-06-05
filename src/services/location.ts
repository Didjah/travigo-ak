import * as Location from 'expo-location';
import type { Coordonnees } from '../types';

export async function demanderPermissionLocalisation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getPositionActuelle(): Promise<Coordonnees> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function geocoderAdresse(adresse: string): Promise<Coordonnees | null> {
  const results = await Location.geocodeAsync(adresse);
  if (results.length === 0) return null;
  return {
    latitude: results[0].latitude,
    longitude: results[0].longitude,
    adresse,
  };
}
