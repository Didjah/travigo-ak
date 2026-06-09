import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import {
  StatsDashboardMairie,
  ChauffeurMairie,
  getStatsDashboard,
  getChauffeursMairie,
  sauvegarderRapport,
  COMMISSION_MAIRIE_TAUX,
} from '../../services/mairieService';

const CM = {
  marine:   '#1A2E5A',
  fond:     '#0F1D3D',
  or:       '#C8A951',
  orClair:  '#FBF3D5',
  orDark:   '#8B7030',
  blanc:    '#FFFFFF',
  gris:     '#8CA0B8',
  grisClair:'#E8ECF4',
  vert:     '#2E7D52',
  rouge:    '#C62828',
  marine2:  '#243B6E',
} as const;

const STATS_DEMO: StatsDashboardMairie = {
  totalChauffeurs: 48,
  chauffeursActifs: 31,
  coursesduMois: 1247,
  revenusMois: 5_635_000,
  commissionMairie: 112_700,
  revenusSemaines: [1_120_000, 1_480_000, 1_350_000, 1_685_000],
  periodeLabel: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })(),
};

const CHAUFFEURS_DEMO: ChauffeurMairie[] = [
  { id: '1', prenom: 'Koné Mamadou',    telephone: '0701234567', abonnement: 'premium',  abonnementStatut: 'actif',  coursesTotal: 47 },
  { id: '2', prenom: 'Touré Ibrahim',   telephone: '0502345678', abonnement: 'taxi',     abonnementStatut: 'actif',  coursesTotal: 38 },
  { id: '3', prenom: 'Bamba Seydou',    telephone: '0703456789', abonnement: 'tricycle', abonnementStatut: 'actif',  coursesTotal: 22 },
  { id: '4', prenom: 'Coulibaly Hamza', telephone: '0504567890', abonnement: 'taxi',     abonnementStatut: 'expire', coursesTotal: 15 },
  { id: '5', prenom: 'Diallo Moussa',   telephone: '0705678901', abonnement: 'premium',  abonnementStatut: 'actif',  coursesTotal: 31 },
  { id: '6', prenom: 'Konaté Salif',    telephone: '0706789012', abonnement: 'tricycle', abonnementStatut: 'actif',  coursesTotal: 19 },
  { id: '7', prenom: 'Traoré Bakary',   telephone: '0507890123', abonnement: 'taxi',     abonnementStatut: 'expire', coursesTotal: 8  },
  { id: '8', prenom: 'Yao Jean-Pierre', telephone: '0708901234', abonnement: null,       abonnementStatut: 'aucun',  coursesTotal: 0  },
];

function formatFCFA(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} K`;
  return `${n}`;
}

function labelSemaine(idx: number): string {
  const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  return labels[idx] ?? `Sem ${idx + 1}`;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DashboardMairie'>;
};

export default function DashboardMairieScreen({ navigation }: Props) {
  const [stats, setStats] = useState<StatsDashboardMairie | null>(null);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurMairie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    if (__DEV__) {
      await new Promise(r => setTimeout(r, 600));
      setStats(STATS_DEMO);
      setChauffeurs(CHAUFFEURS_DEMO);
    } else {
      const [s, c] = await Promise.all([getStatsDashboard(), getChauffeursMairie()]);
      setStats(s);
      setChauffeurs(c);
    }
    setChargement(false);
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function handleExport() {
    if (!stats) return;
    setExportEnCours(true);
    if (__DEV__) {
      await new Promise(r => setTimeout(r, 1000));
      setExportEnCours(false);
      Alert.alert(
        'Rapport exporté',
        `Rapport ${stats.periodeLabel} généré.\n\n` +
        `Courses : ${stats.coursesduMois}\n` +
        `Revenus : ${stats.revenusMois.toLocaleString('fr-FR')} FCFA\n` +
        `Commission Mairie (${(COMMISSION_MAIRIE_TAUX * 100).toFixed(0)}%) : ${stats.commissionMairie.toLocaleString('fr-FR')} FCFA\n\n` +
        `(En production, le PDF serait téléchargé vers le serveur Mairie.)`,
        [{ text: 'OK' }]
      );
      return;
    }
    const rapport = await sauvegarderRapport(stats);
    setExportEnCours(false);
    if (rapport) {
      Alert.alert('Rapport sauvegardé', `Référence : ${rapport.id.slice(0, 8).toUpperCase()}`);
    } else {
      Alert.alert('Erreur', 'Impossible d\'exporter le rapport.');
    }
  }

  function handleDeconnexion() {
    Alert.alert('Déconnexion', 'Quitter le tableau de bord ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => navigation.replace('Onboarding') },
    ]);
  }

  if (chargement) {
    return (
      <View style={styles.chargementContainer}>
        <ActivityIndicator size="large" color={CM.or} />
        <Text style={styles.chargementTexte}>Chargement du tableau de bord…</Text>
      </View>
    );
  }

  if (!stats) return null;

  const maxSemaine = Math.max(...stats.revenusSemaines, 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerGauche}>
          <Text style={styles.headerIcone}>🏛️</Text>
          <View>
            <Text style={styles.headerTitre}>Mairie de Gagnoa</Text>
            <Text style={styles.headerSous}>Tableau de bord TRAVIGO-AK</Text>
          </View>
        </View>
        <View style={styles.headerDroite}>
          {__DEV__ && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeTexte}>DEV</Text>
            </View>
          )}
          <TouchableOpacity style={styles.deconnexionBtn} onPress={handleDeconnexion}>
            <Text style={styles.deconnexionTexte}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.corps}
        showsVerticalScrollIndicator={false}
      >
        {/* Période */}
        <View style={styles.periodeRow}>
          <View style={styles.periodeBadge}>
            <Text style={styles.periodeTexte}>📅 Période : {stats.periodeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.actualiserBtn} onPress={charger}>
            <Text style={styles.actualiserTexte}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrille}>
          <KpiCard
            icone="👥"
            label="Chauffeurs actifs"
            valeur={`${stats.chauffeursActifs}`}
            sous={`/ ${stats.totalChauffeurs} enregistrés`}
            couleur={CM.marine2}
          />
          <KpiCard
            icone="🚖"
            label="Courses du mois"
            valeur={`${stats.coursesduMois.toLocaleString('fr-FR')}`}
            sous="trajets effectués"
            couleur={CM.marine2}
          />
          <KpiCard
            icone="💰"
            label="Revenus plateforme"
            valeur={`${formatFCFA(stats.revenusMois)} FCFA`}
            sous="chiffre d'affaires"
            couleur={CM.marine}
            accent
          />
          <KpiCard
            icone="🏛️"
            label="Commission Mairie"
            valeur={`${formatFCFA(stats.commissionMairie)} FCFA`}
            sous={`${(COMMISSION_MAIRIE_TAUX * 100).toFixed(0)} % du CA`}
            couleur={CM.orDark}
            accentOr
          />
        </View>

        {/* Graphique revenus par semaine */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Revenus par semaine (FCFA)</Text>
          <View style={styles.graphique}>
            {stats.revenusSemaines.map((val, i) => {
              const ratio = val / maxSemaine;
              return (
                <View key={i} style={styles.barreColonne}>
                  <Text style={styles.barreValeur}>{formatFCFA(val)}</Text>
                  <View style={styles.barreTrack}>
                    <View
                      style={[
                        styles.barre,
                        { height: Math.max(8, ratio * 120) },
                        i === stats.revenusSemaines.indexOf(Math.max(...stats.revenusSemaines))
                          ? styles.barreMax
                          : styles.barreNormale,
                      ]}
                    />
                  </View>
                  <Text style={styles.barreLabel}>{labelSemaine(i)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Liste chauffeurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>
            Chauffeurs enregistrés ({chauffeurs.length})
          </Text>
          <View style={styles.listeChauffeurs}>
            {chauffeurs.map((c) => (
              <CarteChauffeur key={c.id} chauffeur={c} />
            ))}
          </View>
        </View>

        {/* Bouton export */}
        <TouchableOpacity
          style={[styles.btnExport, exportEnCours && styles.btnExportDisabled]}
          onPress={handleExport}
          disabled={exportEnCours}
          activeOpacity={0.85}
        >
          {exportEnCours ? (
            <ActivityIndicator color={CM.marine} />
          ) : (
            <>
              <Text style={styles.btnExportIcone}>📄</Text>
              <View>
                <Text style={styles.btnExportTexte}>Exporter le rapport PDF</Text>
                <Text style={styles.btnExportSous}>Rapport officiel Mairie · {stats.periodeLabel}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Note légale */}
        <Text style={styles.noteLegale}>
          Données confidentielles — Usage exclusif de la Mairie de Gagnoa.{'\n'}
          TRAVIGO-AK · Plateforme transport Région du Gôh
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants ─────────────────────────────────────────────────────────────────

function KpiCard({
  icone,
  label,
  valeur,
  sous,
  couleur,
  accent,
  accentOr,
}: {
  icone: string;
  label: string;
  valeur: string;
  sous: string;
  couleur: string;
  accent?: boolean;
  accentOr?: boolean;
}) {
  const cardStyle = [
    styles.kpiCard,
    accent && styles.kpiCardAccent,
    accentOr && styles.kpiCardOr,
  ];
  const valeurStyle = [
    styles.kpiValeur,
    accent && styles.kpiValeurAccent,
    accentOr && styles.kpiValeurOr,
  ];
  const labelStyle = [
    styles.kpiLabel,
    accent && styles.kpiLabelAccent,
    accentOr && styles.kpiLabelOr,
  ];
  const sousStyle = [
    styles.kpiSous,
    accent && styles.kpiSousAccent,
    accentOr && styles.kpiSousOr,
  ];

  return (
    <View style={cardStyle}>
      <Text style={styles.kpiIcone}>{icone}</Text>
      <Text style={valeurStyle}>{valeur}</Text>
      <Text style={labelStyle}>{label}</Text>
      <Text style={sousStyle}>{sous}</Text>
    </View>
  );
}

const ABONNEMENT_LABELS: Record<string, string> = {
  taxi: '🚕 Taxi',
  tricycle: '🛺 Tricycle',
  premium: '⭐ Premium',
};

function CarteChauffeur({ chauffeur }: { chauffeur: ChauffeurMairie }) {
  const statut = chauffeur.abonnementStatut;
  const badgeStyle =
    statut === 'actif'
      ? styles.statutActif
      : statut === 'expire'
      ? styles.statutExpire
      : styles.statutAucun;
  const badgeTexte =
    statut === 'actif' ? 'Actif' : statut === 'expire' ? 'Expiré' : 'Sans abo.';

  return (
    <View style={styles.chauffeurCarte}>
      <View style={styles.chauffeurAvatar}>
        <Text style={styles.chauffeurAvatarTexte}>
          {chauffeur.prenom.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.chauffeurInfo}>
        <Text style={styles.chauffeurNom}>{chauffeur.prenom}</Text>
        <Text style={styles.chauffeurTel}>{chauffeur.telephone}</Text>
        {chauffeur.abonnement && (
          <Text style={styles.chauffeurAbo}>
            {ABONNEMENT_LABELS[chauffeur.abonnement] ?? chauffeur.abonnement}
          </Text>
        )}
      </View>
      <View style={styles.chauffeurDroite}>
        <View style={[styles.statutBadge, badgeStyle]}>
          <Text style={styles.statutTexte}>{badgeTexte}</Text>
        </View>
        <Text style={styles.chauffeurCourses}>{chauffeur.coursesTotal} courses</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.fond },
  chargementContainer: {
    flex: 1,
    backgroundColor: CM.fond,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  chargementTexte: { color: CM.gris, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headerGauche: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcone: { fontSize: 32 },
  headerTitre: { fontSize: 18, fontWeight: '800', color: CM.blanc },
  headerSous: { fontSize: 11, color: CM.gris, marginTop: 1 },
  headerDroite: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devBadge: {
    backgroundColor: CM.or + '30',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  devBadgeTexte: { fontSize: 10, fontWeight: '700', color: CM.or },
  deconnexionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deconnexionTexte: { color: CM.gris, fontSize: 16, fontWeight: '700' },

  corps: {
    backgroundColor: '#F4F6FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },

  periodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodeBadge: {
    backgroundColor: CM.orClair,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: CM.or + '60',
  },
  periodeTexte: { fontSize: 13, fontWeight: '700', color: CM.orDark },
  actualiserBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CM.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D8E8',
  },
  actualiserTexte: { fontSize: 18, color: CM.marine, fontWeight: '700' },

  // KPIs
  kpiGrille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: CM.blanc,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: CM.marine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiCardAccent: {
    backgroundColor: CM.marine,
  },
  kpiCardOr: {
    backgroundColor: CM.or,
  },
  kpiIcone: { fontSize: 24, marginBottom: 4 },
  kpiValeur: { fontSize: 20, fontWeight: '800', color: CM.marine },
  kpiValeurAccent: { color: CM.blanc },
  kpiValeurOr: { color: CM.marine },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: '#607090', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiLabelAccent: { color: 'rgba(255,255,255,0.7)' },
  kpiLabelOr: { color: CM.marine + 'CC' },
  kpiSous: { fontSize: 11, color: '#8CA0B8', marginTop: 2 },
  kpiSousAccent: { color: 'rgba(255,255,255,0.55)' },
  kpiSousOr: { color: CM.marine + '99' },

  // Section
  section: { gap: 12 },
  sectionTitre: { fontSize: 15, fontWeight: '800', color: CM.marine },

  // Graphique
  graphique: {
    backgroundColor: CM.blanc,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    shadowColor: CM.marine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  barreColonne: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barreValeur: { fontSize: 11, fontWeight: '700', color: CM.marine, textAlign: 'center' },
  barreTrack: {
    width: 28,
    height: 120,
    justifyContent: 'flex-end',
  },
  barre: {
    width: 28,
    borderRadius: 6,
  },
  barreNormale: { backgroundColor: CM.marine + '55' },
  barreMax: { backgroundColor: CM.or },
  barreLabel: { fontSize: 11, fontWeight: '600', color: '#607090' },

  // Liste chauffeurs
  listeChauffeurs: {
    backgroundColor: CM.blanc,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: CM.marine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chauffeurCarte: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
  },
  chauffeurAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CM.marine + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chauffeurAvatarTexte: { fontSize: 18, fontWeight: '800', color: CM.marine },
  chauffeurInfo: { flex: 1, gap: 2 },
  chauffeurNom: { fontSize: 14, fontWeight: '700', color: CM.marine },
  chauffeurTel: { fontSize: 12, color: CM.gris },
  chauffeurAbo: { fontSize: 12, color: CM.orDark, fontWeight: '600' },
  chauffeurDroite: { alignItems: 'flex-end', gap: 4 },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statutActif: { backgroundColor: '#E8F5E9' },
  statutExpire: { backgroundColor: '#FFEBEE' },
  statutAucun: { backgroundColor: '#F5F5F5' },
  statutTexte: { fontSize: 11, fontWeight: '700', color: CM.marine },
  chauffeurCourses: { fontSize: 11, color: CM.gris },

  // Export
  btnExport: {
    backgroundColor: CM.or,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: CM.or,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnExportDisabled: { opacity: 0.6 },
  btnExportIcone: { fontSize: 28 },
  btnExportTexte: { fontSize: 16, fontWeight: '800', color: CM.marine },
  btnExportSous: { fontSize: 12, color: CM.marine + 'AA', marginTop: 2 },

  noteLegale: {
    fontSize: 11,
    color: '#8CA0B8',
    textAlign: 'center',
    lineHeight: 17,
  },
});
