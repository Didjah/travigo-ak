import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  creerAbonnementScolaire,
  getAbonnementsScolaireParent,
  MONTANT_SCOLAIRE,
  type AbonnementScolaire,
} from '../../services/scolaireService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransportScolaire'>;
  route: RouteProp<RootStackParamList, 'TransportScolaire'>;
};

function StatutBadge({ statut }: { statut: AbonnementScolaire['statut'] }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    actif:      { label: 'Actif',      bg: '#E8F5E9', color: '#2E7D32' },
    en_attente: { label: 'En attente', bg: '#FFF3E0', color: '#E65100' },
    expire:     { label: 'Expiré',     bg: '#FFEBEE', color: '#C62828' },
    suspendu:   { label: 'Suspendu',   bg: '#F3F4F6', color: '#6B7280' },
  };
  const c = config[statut] ?? config.suspendu;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeTexte, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function TransportScolaireScreen({ navigation, route }: Props) {
  const { nom } = route.params;

  const [enfantPrenom, setEnfantPrenom] = useState('');
  const [ecole, setEcole] = useState('');
  const [heureMatin, setHeureMatin] = useState('07:00');
  const [heureSoir, setHeureSoir] = useState('17:00');
  const [envoi, setEnvoi] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [abonnements, setAbonnements] = useState<AbonnementScolaire[]>([]);
  const [formulaireVisible, setFormulaireVisible] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    const user = getSessionUser();
    if (!user) { setChargement(false); return; }
    const liste = await getAbonnementsScolaireParent(user.id);
    setAbonnements(liste);
    setFormulaireVisible(liste.length === 0);
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function handleSouscrire() {
    const user = getSessionUser();
    if (!user) return;

    if (!enfantPrenom.trim()) {
      Alert.alert('Champ manquant', 'Entrez le prénom de votre enfant.');
      return;
    }
    if (!ecole.trim()) {
      Alert.alert('Champ manquant', "Entrez le nom de l'école.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(heureMatin) || !/^\d{2}:\d{2}$/.test(heureSoir)) {
      Alert.alert('Format invalide', 'Les heures doivent être au format HH:MM (ex: 07:30).');
      return;
    }

    setEnvoi(true);
    const result = await creerAbonnementScolaire(
      user.id,
      enfantPrenom.trim(),
      ecole.trim(),
      heureMatin.trim(),
      heureSoir.trim()
    );
    setEnvoi(false);

    if (result) {
      Alert.alert(
        'Demande enregistrée !',
        `Le transport scolaire pour ${enfantPrenom} a été enregistré.\nUn chauffeur vous sera assigné prochainement.\n\nMontant : ${MONTANT_SCOLAIRE.toLocaleString('fr-FR')} FCFA/mois`,
        [{ text: 'OK', onPress: () => { setEnfantPrenom(''); setEcole(''); charger(); } }]
      );
    } else {
      Alert.alert('Erreur', "Impossible d'enregistrer la demande. Réessayez.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCentre}>
          <Text style={styles.headerTitre}>Transport scolaire</Text>
          <Text style={styles.headerSous}>{nom}</Text>
        </View>
        <View style={{ width: TOUCH.iconButton }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bannière prix */}
        <View style={styles.prixCard}>
          <Text style={styles.prixIcone}>🏫</Text>
          <View style={styles.prixTextes}>
            <Text style={styles.prixTitre}>Transport scolaire mensuel</Text>
            <Text style={styles.prixSous}>Matin + soir · Gagnoa et environs</Text>
          </View>
          <View style={styles.prixValeurWrapper}>
            <Text style={styles.prixValeur}>{MONTANT_SCOLAIRE.toLocaleString('fr-FR')}</Text>
            <Text style={styles.prixMonnaie}>FCFA/mois</Text>
          </View>
        </View>

        {/* Avantages */}
        <View style={styles.avantagesCard}>
          {[
            '🚗 Chauffeur dédié et vérifié',
            '⏰ Horaires personnalisés matin/soir',
            '📍 Prise en charge à domicile',
            '🔔 Notification à chaque trajet',
            "📋 Suivi mensuel de l'abonnement",
          ].map((av, i) => (
            <Text key={i} style={styles.avantage}>{av}</Text>
          ))}
        </View>

        {/* Abonnements existants */}
        {chargement ? (
          <ActivityIndicator color={COLORS.terracotta} size="large" style={{ marginTop: SPACING.md }} />
        ) : abonnements.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>MES ENFANTS INSCRITS</Text>
              <TouchableOpacity onPress={() => setFormulaireVisible((v) => !v)}>
                <Text style={styles.ajouterLien}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>
            {abonnements.map((abo) => (
              <View key={abo.id} style={styles.aboCard}>
                <View style={styles.aboCardHeader}>
                  <View style={styles.aboAvatar}>
                    <Text style={styles.aboAvatarLettre}>
                      {abo.enfant_prenom[0]?.toUpperCase() ?? 'E'}
                    </Text>
                  </View>
                  <View style={styles.aboTextes}>
                    <Text style={styles.aboNom}>{abo.enfant_prenom}</Text>
                    <Text style={styles.aboEcole}>{abo.ecole}</Text>
                  </View>
                  <StatutBadge statut={abo.statut} />
                </View>
                <View style={styles.aboHoraires}>
                  <View style={styles.horaire}>
                    <Text style={styles.horaireIcone}>🌅</Text>
                    <Text style={styles.horaireTexte}>Matin : {abo.heure_matin}</Text>
                  </View>
                  <View style={styles.horaire}>
                    <Text style={styles.horaireIcone}>🌇</Text>
                    <Text style={styles.horaireTexte}>Soir : {abo.heure_soir}</Text>
                  </View>
                  <Text style={styles.aboPrix}>
                    {abo.montant_fcfa.toLocaleString('fr-FR')} FCFA/mois
                  </Text>
                </View>
                {abo.statut === 'en_attente' && (
                  <Text style={styles.enAttenteNote}>
                    ⏳ Attribution d'un chauffeur en cours…
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Formulaire */}
        {(formulaireVisible || abonnements.length === 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INSCRIRE UN ENFANT</Text>

            <View style={styles.champ}>
              <Text style={styles.champLabel}>Prénom de l'enfant</Text>
              <TextInput
                style={styles.champInput}
                placeholder="Ex : Awa, Kofi, Mariama…"
                placeholderTextColor={COLORS.taupe}
                value={enfantPrenom}
                onChangeText={setEnfantPrenom}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.champ}>
              <Text style={styles.champLabel}>École</Text>
              <TextInput
                style={styles.champInput}
                placeholder="Ex : École primaire de Bromakote"
                placeholderTextColor={COLORS.taupe}
                value={ecole}
                onChangeText={setEcole}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.champsRow}>
              <View style={[styles.champ, { flex: 1 }]}>
                <Text style={styles.champLabel}>🌅 Heure matin</Text>
                <TextInput
                  style={styles.champInput}
                  placeholder="07:00"
                  placeholderTextColor={COLORS.taupe}
                  value={heureMatin}
                  onChangeText={setHeureMatin}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.champ, { flex: 1 }]}>
                <Text style={styles.champLabel}>🌇 Heure soir</Text>
                <TextInput
                  style={styles.champInput}
                  placeholder="17:00"
                  placeholderTextColor={COLORS.taupe}
                  value={heureSoir}
                  onChangeText={setHeureSoir}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.boutonSouscrire, envoi && styles.boutonDesactive]}
              onPress={handleSouscrire}
              activeOpacity={0.85}
              disabled={envoi}
            >
              {envoi ? (
                <ActivityIndicator color={COLORS.blanc} size="small" />
              ) : (
                <>
                  <Text style={styles.boutonIcone}>🏫</Text>
                  <Text style={styles.boutonTexte}>
                    Souscrire — {MONTANT_SCOLAIRE.toLocaleString('fr-FR')} FCFA/mois
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.note}>
          * Le paiement mensuel sera collecté par votre chauffeur assigné ou en agence.{'\n'}
          L'abonnement est renouvelable chaque mois.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ivoire },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.safe,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.ivoire,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
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
  headerTitre: { ...TYPOGRAPHY.h2, color: COLORS.graphite },
  headerSous: { ...TYPOGRAPHY.micro, color: COLORS.taupe, marginTop: 1 },

  inner: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl + SPACING.sm,
    gap: SPACING.lg,
  },

  // Prix card
  prixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md - 2,
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.cta,
  },
  prixIcone: { fontSize: 34 },
  prixTextes: { flex: 1, gap: 3 },
  prixTitre: { ...TYPOGRAPHY.h3, color: COLORS.blanc },
  prixSous: { ...TYPOGRAPHY.micro, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  prixValeurWrapper: { alignItems: 'flex-end' },
  prixValeur: { fontSize: 20, fontWeight: '900', color: COLORS.blanc },
  prixMonnaie: { ...TYPOGRAPHY.micro, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  // Avantages
  avantagesCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  avantage: { ...TYPOGRAPHY.body, color: COLORS.graphite, fontWeight: '500' },

  // Section
  section: { gap: SPACING.md - 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: { ...TYPOGRAPHY.micro, color: COLORS.taupe, letterSpacing: 1.2 },
  ajouterLien: { ...TYPOGRAPHY.caption, color: COLORS.terracotta, fontWeight: '700' },

  // Abo card
  aboCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md - 4,
    ...SHADOWS.card,
  },
  aboCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md - 4 },
  aboAvatar: {
    width: TOUCH.iconButton - 2,
    height: TOUCH.iconButton - 2,
    borderRadius: RADIUS.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboAvatarLettre: { fontSize: 18, fontWeight: '800', color: COLORS.terracotta },
  aboTextes: { flex: 1, gap: 2 },
  aboNom: { ...TYPOGRAPHY.h3, color: COLORS.graphite },
  aboEcole: { ...TYPOGRAPHY.caption, color: COLORS.taupe, fontWeight: '400' },
  badge: {
    paddingHorizontal: SPACING.sm + 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  badgeTexte: { ...TYPOGRAPHY.micro, fontWeight: '700' },
  aboHoraires: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md - 4,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: SPACING.sm + 2,
    flexWrap: 'wrap',
  },
  horaire: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  horaireIcone: { fontSize: 13 },
  horaireTexte: { ...TYPOGRAPHY.caption, color: COLORS.graphite, fontWeight: '600' },
  aboPrix: { ...TYPOGRAPHY.caption, color: COLORS.terracotta, marginLeft: 'auto' },
  enAttenteNote: { ...TYPOGRAPHY.micro, color: '#E65100', fontStyle: 'italic', fontWeight: '500' },

  // Formulaire
  champsRow: { flexDirection: 'row', gap: SPACING.md - 4 },
  champ: { gap: SPACING.xs + 2 },
  champLabel: {
    ...TYPOGRAPHY.micro,
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  champInput: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.md - 3,
    ...TYPOGRAPHY.body,
    color: COLORS.graphite,
    minHeight: TOUCH.minSize,
  },

  boutonSouscrire: {
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm + 2,
    minHeight: TOUCH.minButton,
    marginTop: SPACING.xs,
    ...SHADOWS.cta,
  },
  boutonDesactive: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  boutonIcone: { fontSize: 18 },
  boutonTexte: { ...TYPOGRAPHY.h3, color: COLORS.blanc, letterSpacing: 0.3 },

  note: {
    ...TYPOGRAPHY.micro,
    color: COLORS.taupe,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: SPACING.sm,
    fontWeight: '400',
  },
});
