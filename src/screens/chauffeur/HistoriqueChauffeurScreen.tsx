import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { getSessionUser } from '../../services/session';
import type { Course } from '../../services/courseService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HistoriqueChauffeur'>;
};

interface CourseAvecNote extends Course {
  note_chauffeur: number | null;
}

interface CourseEnrichie extends CourseAvecNote {
  passagerPrenom: string;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function EtoilesNote({ note }: { note: number | null }) {
  if (!note) return <Text style={styles.noteAbsente}>Non noté</Text>;
  return (
    <View style={styles.etoilesRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text
          key={n}
          style={[styles.etoile, n <= note ? styles.etoileActive : styles.etoileVide]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function totalMoisCourant(courses: CourseAvecNote[]): number {
  const maintenant = new Date();
  const moisActuel = maintenant.getMonth();
  const anneeActuelle = maintenant.getFullYear();
  return courses
    .filter((c) => {
      const d = new Date(c.created_at);
      return (
        c.statut === 'terminee' &&
        d.getMonth() === moisActuel &&
        d.getFullYear() === anneeActuelle
      );
    })
    .reduce((acc, c) => acc + (c.prix ?? 0), 0);
}

export default function HistoriqueChauffeurScreen({ navigation }: Props) {
  const [courses, setCourses] = useState<CourseEnrichie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [gainsMois, setGainsMois] = useState(0);

  const chargerCourses = useCallback(async () => {
    setChargement(true);
    const user = getSessionUser();
    if (!user) {
      setChargement(false);
      return;
    }

    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('chauffeur_id', user.id)
      .in('statut', ['terminee', 'annulee'])
      .order('created_at', { ascending: false });

    const rawCourses = (data as CourseAvecNote[]) ?? [];
    setGainsMois(totalMoisCourant(rawCourses));

    // Récupérer les prénoms des passagers en une seule requête
    const passagerIds = [...new Set(rawCourses.map((c) => c.passager_id).filter(Boolean) as string[])];
    let prenomMap: Record<string, string> = {};

    if (passagerIds.length > 0) {
      const { data: utilisateurs } = await supabase
        .from('utilisateurs')
        .select('id, prenom')
        .in('id', passagerIds);

      if (utilisateurs) {
        for (const u of utilisateurs) {
          prenomMap[u.id] = u.prenom;
        }
      }
    }

    const enrichies: CourseEnrichie[] = rawCourses.map((c) => ({
      ...c,
      passagerPrenom: c.passager_id ? (prenomMap[c.passager_id] ?? 'Passager') : 'Passager',
    }));

    setCourses(enrichies);
    setChargement(false);
  }, []);

  useEffect(() => {
    chargerCourses();
  }, [chargerCourses]);

  function renderCourse({ item }: { item: CourseEnrichie }) {
    const estTerminee = item.statut === 'terminee';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.passagerInfo}>
            <View style={styles.passagerAvatar}>
              <Text style={styles.passagerAvatarLettre}>
                {item.passagerPrenom[0]?.toUpperCase() ?? 'P'}
              </Text>
            </View>
            <View>
              <Text style={styles.passagerNom}>{item.passagerPrenom}</Text>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          {estTerminee ? (
            <Text style={styles.gainTexte}>
              +{(item.prix ?? 0).toLocaleString('fr-FR')} FCFA
            </Text>
          ) : (
            <View style={styles.badgeAnnule}>
              <Text style={styles.badgeAnnuleTexte}>Annulée</Text>
            </View>
          )}
        </View>

        <View style={styles.destinationRow}>
          <View style={styles.destPoint} />
          <Text style={styles.destinationTexte} numberOfLines={1}>
            {item.destination}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <EtoilesNote note={item.note_chauffeur} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête sombre */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
            <Text style={styles.retourTexte}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitre}>Historique</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Total du mois */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Gains ce mois</Text>
          <Text style={styles.totalValeur}>
            {gainsMois.toLocaleString('fr-FR')} FCFA
          </Text>
          <Text style={styles.totalSous}>
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Liste des courses */}
      {chargement ? (
        <View style={styles.centred}>
          <ActivityIndicator color={COLORS.terracotta} size="large" />
          <Text style={styles.loaderTexte}>Chargement...</Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.videIcone}>📋</Text>
          <Text style={styles.videTitre}>Aucune course pour l'instant</Text>
          <Text style={styles.videSous}>Vos courses effectuées apparaîtront ici</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    backgroundColor: '#2A2A2A',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retourBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retourTexte: {
    fontSize: 20,
    color: COLORS.ivoire,
    fontWeight: '700',
  },
  headerTitre: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ivoire,
    letterSpacing: 0.3,
  },
  totalCard: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValeur: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.blanc,
    letterSpacing: 0.5,
  },
  totalSous: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.ivoire,
  },
  loaderTexte: {
    fontSize: 13,
    color: COLORS.taupe,
    marginTop: 8,
  },
  videIcone: {
    fontSize: 52,
  },
  videTitre: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.graphite,
    textAlign: 'center',
  },
  videSous: {
    fontSize: 13,
    color: COLORS.taupe,
    textAlign: 'center',
  },
  liste: {
    backgroundColor: COLORS.ivoire,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passagerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passagerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passagerAvatarLettre: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  passagerNom: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.taupe,
    fontWeight: '500',
    marginTop: 1,
  },
  gainTexte: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
  },
  badgeAnnule: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeAnnuleTexte: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  destPoint: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.graphite,
  },
  destinationTexte: {
    fontSize: 13,
    color: COLORS.graphite,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: 10,
  },
  etoilesRow: {
    flexDirection: 'row',
    gap: 2,
  },
  etoile: {
    fontSize: 14,
  },
  etoileActive: {
    color: '#F59E0B',
  },
  etoileVide: {
    color: '#E5E0D8',
  },
  noteAbsente: {
    fontSize: 11,
    color: COLORS.taupe,
    fontStyle: 'italic',
  },
});
