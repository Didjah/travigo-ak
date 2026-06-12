import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  getAbonnementsScolaireChauffeur,
  getAbonnementsEnAttente,
  prendreEnChargeScolaire,
  type AbonnementScolaire,
} from '../../services/scolaireService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourseScolaire'>;
};

// DEV : données de simulation
const DEV_ABONNEMENTS: AbonnementScolaire[] = [
  {
    id: 'dev-1',
    parent_id: 'parent-1',
    chauffeur_id: 'chauffeur-dev',
    enfant_prenom: 'Awa',
    ecole: 'École primaire de Bromakote',
    heure_matin: '07:00',
    heure_soir: '17:30',
    montant_fcfa: 15000,
    statut: 'actif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dev-2',
    parent_id: 'parent-2',
    chauffeur_id: 'chauffeur-dev',
    enfant_prenom: 'Kofi',
    ecole: 'École primaire de Bromakote',
    heure_matin: '07:00',
    heure_soir: '17:30',
    montant_fcfa: 15000,
    statut: 'actif',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dev-3',
    parent_id: 'parent-3',
    chauffeur_id: 'chauffeur-dev',
    enfant_prenom: 'Mariam',
    ecole: 'Collège moderne de Gagnoa',
    heure_matin: '07:15',
    heure_soir: '18:00',
    montant_fcfa: 15000,
    statut: 'actif',
    created_at: new Date().toISOString(),
  },
];

function HeureSection({ label, icone, enfants, confirmes, onConfirmer, periode }: {
  label: string;
  icone: string;
  enfants: AbonnementScolaire[];
  confirmes: Set<string>;
  onConfirmer: (key: string, enfantPrenom: string) => void;
  periode: 'matin' | 'soir';
}) {
  if (enfants.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcone}>{icone}</Text>
        <Text style={styles.sectionTitre}>{label}</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeTexte}>{enfants.length}</Text>
        </View>
      </View>
      {enfants.map((enfant) => {
        const confirmeKey = `${enfant.id}-${periode}`;
        const confirme = confirmes.has(confirmeKey);
        return (
          <View
            key={enfant.id}
            style={[styles.enfantCard, confirme && styles.enfantCardConfirme]}
          >
            <View style={styles.enfantLeft}>
              <View style={[styles.enfantAvatar, confirme && styles.enfantAvatarConfirme]}>
                <Text style={styles.enfantAvatarLettre}>
                  {enfant.enfant_prenom[0]?.toUpperCase() ?? 'E'}
                </Text>
              </View>
              <View style={styles.enfantInfo}>
                <Text style={styles.enfantNom}>{enfant.enfant_prenom}</Text>
                <Text style={styles.enfantEcole} numberOfLines={1}>{enfant.ecole}</Text>
                <Text style={styles.enfantHeure}>
                  {icone === '🌅' ? `🌅 ${enfant.heure_matin}` : `🌇 ${enfant.heure_soir}`}
                </Text>
              </View>
            </View>
            {confirme ? (
              <View style={styles.confirmeTag}>
                <Text style={styles.confirmeTagTexte}>✓ Pris en charge</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.boutonConfirmer}
                onPress={() => onConfirmer(confirmeKey, enfant.enfant_prenom)}
                activeOpacity={0.85}
              >
                <Text style={styles.boutonConfirmerTexte}>Confirmer</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function CourseScolaireScreen({ navigation }: Props) {
  const [abonnements, setAbonnements] = useState<AbonnementScolaire[]>([]);
  const [enAttente, setEnAttente] = useState<AbonnementScolaire[]>([]);
  const [confirmes, setConfirmes] = useState<Set<string>>(new Set());
  const [chargement, setChargement] = useState(true);
  const [claimEnCours, setClaimEnCours] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    const user = getSessionUser();

    if (__DEV__ || !user) {
      setAbonnements(DEV_ABONNEMENTS);
      setEnAttente([]);
      setChargement(false);
      return;
    }

    const [assignes, attente] = await Promise.all([
      getAbonnementsScolaireChauffeur(user.id),
      getAbonnementsEnAttente(),
    ]);
    setAbonnements(assignes);
    setEnAttente(attente);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', charger);
    return unsub;
  }, [navigation, charger]);

  function handleConfirmer(id: string, enfantPrenom: string) {
    Alert.alert(
      'Confirmer la prise en charge',
      `Confirmez-vous la prise en charge de ${enfantPrenom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => setConfirmes((prev) => new Set([...prev, id])),
        },
      ]
    );
  }

  async function handlePrendreEnCharge(abo: AbonnementScolaire) {
    const user = getSessionUser();
    if (!user) return;

    setClaimEnCours(abo.id);
    const ok = await prendreEnChargeScolaire(abo.id, user.id);
    setClaimEnCours(null);

    if (ok) {
      Alert.alert(
        'Assigné !',
        `Vous êtes maintenant responsable du transport de ${abo.enfant_prenom}.`,
        [{ text: 'OK', onPress: charger }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de prendre en charge. Réessayez.');
    }
  }

  // Grouper par heure (matin/soir)
  const enfantsMatin = abonnements.filter(() => true); // tous passent le matin
  const enfantsSoir = abonnements.filter(() => true);  // tous passent le soir

  const totalConfirmes = confirmes.size;
  const totalEnfants = abonnements.length;
  const totalTournees = abonnements.length * 2;

  return (
    <View style={styles.container}>
      {/* En-tête sombre */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
            <Text style={styles.retourTexte}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitre}>Scolaire du jour</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Résumé */}
        <View style={styles.resumeRow}>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeValeur}>{totalEnfants}</Text>
            <Text style={styles.resumeLabel}>Enfants</Text>
          </View>
          <View style={[styles.resumeCard, styles.resumeCardPrincipal]}>
            <Text style={[styles.resumeValeur, { color: COLORS.blanc }]}>
              {totalConfirmes}/{totalTournees}
            </Text>
            <Text style={[styles.resumeLabel, { color: 'rgba(255,255,255,0.75)' }]}>
              Confirmés
            </Text>
          </View>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeValeur}>
              {(totalEnfants * 15000).toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.resumeLabel}>FCFA/mois</Text>
          </View>
        </View>
      </View>

      {chargement ? (
        <View style={styles.centred}>
          <ActivityIndicator color={COLORS.terracotta} size="large" />
          <Text style={styles.loaderTexte}>Chargement du planning…</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.listeInner}>
              {/* Mode DEV */}
              {__DEV__ && (
                <View style={styles.devBanner}>
                  <Text style={styles.devTexte}>
                    Mode DEV — données de simulation (3 enfants)
                  </Text>
                </View>
              )}

              {/* Aucun enfant assigné */}
              {abonnements.length === 0 && enAttente.length === 0 && (
                <View style={styles.videWrapper}>
                  <Text style={styles.videIcone}>🏫</Text>
                  <Text style={styles.videTitre}>Aucun enfant assigné</Text>
                  <Text style={styles.videSous}>
                    Aucune demande de transport scolaire ne vous est assignée pour le moment.
                  </Text>
                </View>
              )}

              {/* Planning matin */}
              <HeureSection
                label="Tournée du matin"
                icone="🌅"
                enfants={enfantsMatin}
                confirmes={confirmes}
                onConfirmer={handleConfirmer}
                periode="matin"
              />

              {/* Planning soir */}
              <HeureSection
                label="Tournée du soir"
                icone="🌇"
                enfants={enfantsSoir}
                confirmes={confirmes}
                onConfirmer={handleConfirmer}
                periode="soir"
              />

              {/* Demandes non assignées */}
              {enAttente.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcone}>📋</Text>
                    <Text style={styles.sectionTitre}>Demandes disponibles</Text>
                    <View style={[styles.sectionBadge, styles.sectionBadgeOrange]}>
                      <Text style={styles.sectionBadgeTexte}>{enAttente.length}</Text>
                    </View>
                  </View>
                  {enAttente.map((abo) => (
                    <View key={abo.id} style={styles.enfantCard}>
                      <View style={styles.enfantLeft}>
                        <View style={styles.enfantAvatar}>
                          <Text style={styles.enfantAvatarLettre}>
                            {abo.enfant_prenom[0]?.toUpperCase() ?? 'E'}
                          </Text>
                        </View>
                        <View style={styles.enfantInfo}>
                          <Text style={styles.enfantNom}>{abo.enfant_prenom}</Text>
                          <Text style={styles.enfantEcole} numberOfLines={1}>{abo.ecole}</Text>
                          <Text style={styles.enfantHeure}>
                            🌅 {abo.heure_matin} · 🌇 {abo.heure_soir}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.boutonPrendre, claimEnCours === abo.id && styles.boutonDesactive]}
                        onPress={() => handlePrendreEnCharge(abo)}
                        activeOpacity={0.85}
                        disabled={claimEnCours === abo.id}
                      >
                        {claimEnCours === abo.id ? (
                          <ActivityIndicator color={COLORS.blanc} size="small" />
                        ) : (
                          <Text style={styles.boutonPrendreTexte}>Prendre</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
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
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 18,
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
  resumeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resumeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  resumeCardPrincipal: {
    backgroundColor: COLORS.terracotta,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  resumeValeur: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ivoire,
  },
  resumeLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
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
  },
  listeInner: {
    backgroundColor: COLORS.ivoire,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
    flex: 1,
  },
  devBanner: {
    backgroundColor: '#3D3200',
    borderWidth: 1,
    borderColor: '#7A6300',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  devTexte: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  videWrapper: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
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
    maxWidth: 280,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcone: {
    fontSize: 18,
  },
  sectionTitre: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.graphite,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.graphite,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeOrange: {
    backgroundColor: '#E65100',
  },
  sectionBadgeTexte: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.blanc,
  },
  enfantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  enfantCardConfirme: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  enfantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  enfantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enfantAvatarConfirme: {
    backgroundColor: '#DCFCE7',
  },
  enfantAvatarLettre: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.terracotta,
  },
  enfantInfo: {
    flex: 1,
    gap: 2,
  },
  enfantNom: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  enfantEcole: {
    fontSize: 11,
    color: COLORS.taupe,
  },
  enfantHeure: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.graphite,
    marginTop: 2,
  },
  boutonConfirmer: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  boutonConfirmerTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blanc,
  },
  confirmeTag: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  confirmeTagTexte: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  boutonPrendre: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  boutonPrendreTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blanc,
  },
  boutonDesactive: {
    opacity: 0.5,
  },
});
