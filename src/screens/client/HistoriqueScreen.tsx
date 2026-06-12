import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
import { RootStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';
import { getSessionUser } from '../../services/session';
import type { Course } from '../../services/courseService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Historique'>;
  route: RouteProp<RootStackParamList, 'Historique'>;
};

interface CourseAvecNote extends Course {
  note_chauffeur: number | null;
  commentaire_passager: string | null;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    terminee:   { label: 'Terminée',   bg: '#E8F5E9', color: '#2E7D32' },
    annulee:    { label: 'Annulée',    bg: '#FFEBEE', color: '#C62828' },
    en_cours:   { label: 'En cours',   bg: '#FFF3E0', color: '#E65100' },
    en_attente: { label: 'En attente', bg: '#F3F4F6', color: '#6B7280' },
    acceptee:   { label: 'Acceptée',   bg: '#E3F2FD', color: '#1565C0' },
  };
  const c = config[statut] ?? { label: statut, bg: '#F3F4F6', color: '#6B7280' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeTexte, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function EtoilesNote({ note }: { note: number | null }) {
  if (!note) return null;
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

export default function HistoriqueScreen({ navigation, route }: Props) {
  const { nom } = route.params;
  const [courses, setCourses] = useState<CourseAvecNote[]>([]);
  const [chargement, setChargement] = useState(true);

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
      .eq('passager_id', user.id)
      .in('statut', ['terminee', 'annulee'])
      .order('created_at', { ascending: false });

    setCourses((data as CourseAvecNote[]) ?? []);
    setChargement(false);
  }, []);

  useEffect(() => {
    chargerCourses();
  }, [chargerCourses]);

  function renderCourse({ item }: { item: CourseAvecNote }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          <StatutBadge statut={item.statut} />
        </View>
        <View style={styles.trajet}>
          <View style={styles.trajetColonne}>
            <View style={styles.pointDepart} />
            <View style={styles.trajetTiret} />
            <View style={styles.pointDest} />
          </View>
          <View style={styles.trajetTextes}>
            <Text style={styles.trajetDepart} numberOfLines={1}>{item.depart}</Text>
            <Text style={styles.trajetDestination} numberOfLines={1}>{item.destination}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.montant}>
            {item.prix ? `${item.prix.toLocaleString('fr-FR')} FCFA` : '— FCFA'}
          </Text>
          <EtoilesNote note={item.note_chauffeur} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCentre}>
          <Text style={styles.titre}>Mes courses</Text>
          <Text style={styles.sousTitre}>{nom}</Text>
        </View>
        <View style={{ width: TOUCH.iconButton }} />
      </View>

      {chargement ? (
        <View style={styles.centred}>
          <ActivityIndicator color={COLORS.terracotta} size="large" />
          <Text style={styles.loaderTexte}>Chargement...</Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.videIcone}>📋</Text>
          <Text style={styles.videTitre}>Aucune course pour l'instant</Text>
          <Text style={styles.videSous}>Vos trajets passés apparaîtront ici</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ivoire },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  retourBtn: {
    width: TOUCH.iconButton,
    height: TOUCH.iconButton,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  retourTexte: { fontSize: 20, color: COLORS.graphite, fontWeight: '700' },
  headerCentre: { alignItems: 'center' },
  titre: { ...TYPOGRAPHY.h2, color: COLORS.graphite },
  sousTitre: { ...TYPOGRAPHY.caption, color: COLORS.taupe, marginTop: 1, fontWeight: '400' },

  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md - 4,
  },
  loaderTexte: { ...TYPOGRAPHY.caption, color: COLORS.taupe, marginTop: SPACING.sm, fontWeight: '400' },
  videIcone: { fontSize: 52 },
  videTitre: { ...TYPOGRAPHY.h2, color: COLORS.graphite, textAlign: 'center' },
  videSous: { ...TYPOGRAPHY.body, color: COLORS.taupe, textAlign: 'center' },

  liste: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md - 4,
  },

  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    gap: SPACING.md - 2,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: { ...TYPOGRAPHY.caption, color: COLORS.taupe, fontWeight: '600' },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  badgeTexte: { ...TYPOGRAPHY.micro, fontWeight: '700' },

  trajet: { flexDirection: 'row', gap: SPACING.md - 4, alignItems: 'stretch' },
  trajetColonne: { alignItems: 'center', paddingTop: SPACING.xs, gap: 2 },
  pointDepart: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
  },
  trajetTiret: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.borderLight,
    minHeight: 14,
  },
  pointDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.graphite,
  },
  trajetTextes: { flex: 1, gap: SPACING.sm },
  trajetDepart: { ...TYPOGRAPHY.caption, color: COLORS.taupe, fontWeight: '500' },
  trajetDestination: { ...TYPOGRAPHY.h3, color: COLORS.graphite },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: SPACING.sm + SPACING.xs,
  },
  montant: { fontSize: 16, fontWeight: '800', color: COLORS.terracotta },
  etoilesRow: { flexDirection: 'row', gap: 2 },
  etoile: { fontSize: 14 },
  etoileActive: { color: '#F59E0B' },
  etoileVide: { color: COLORS.borderLight },
});
