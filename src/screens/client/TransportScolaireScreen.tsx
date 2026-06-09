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
    actif: { label: 'Actif', bg: '#E8F5E9', color: '#2E7D32' },
    en_attente: { label: 'En attente', bg: '#FFF3E0', color: '#E65100' },
    expire: { label: 'Expiré', bg: '#FFEBEE', color: '#C62828' },
    suspendu: { label: 'Suspendu', bg: '#F3F4F6', color: '#6B7280' },
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

  useEffect(() => {
    charger();
  }, [charger]);

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
      Alert.alert('Erreur', 'Impossible d\'enregistrer la demande. Réessayez.');
    }
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCentre}>
          <Text style={styles.headerTitre}>Transport scolaire</Text>
          <Text style={styles.headerSous}>{nom}</Text>
        </View>
        <View style={{ width: 40 }} />
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
            '📋 Suivi mensuel de l\'abonnement',
          ].map((av, i) => (
            <Text key={i} style={styles.avantage}>{av}</Text>
          ))}
        </View>

        {/* Liste des abonnements existants */}
        {chargement ? (
          <ActivityIndicator color={COLORS.terracotta} size="large" style={{ marginTop: 16 }} />
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

        {/* Formulaire d'inscription */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.ivoire,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  retourBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  retourTexte: {
    fontSize: 20,
    color: COLORS.graphite,
    fontWeight: '700',
  },
  headerCentre: {
    alignItems: 'center',
  },
  headerTitre: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  headerSous: {
    fontSize: 11,
    color: COLORS.taupe,
    marginTop: 1,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // Prix
  prixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.terracotta,
    borderRadius: 18,
    padding: 20,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  prixIcone: {
    fontSize: 34,
  },
  prixTextes: {
    flex: 1,
    gap: 3,
  },
  prixTitre: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.blanc,
  },
  prixSous: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  prixValeurWrapper: {
    alignItems: 'flex-end',
  },
  prixValeur: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.blanc,
  },
  prixMonnaie: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },

  // Avantages
  avantagesCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  avantage: {
    fontSize: 13,
    color: COLORS.graphite,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Section
  section: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.taupe,
    letterSpacing: 1.2,
  },
  ajouterLien: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.terracotta,
  },

  // Abonnement card
  aboCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  aboCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboAvatarLettre: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.terracotta,
  },
  aboTextes: {
    flex: 1,
    gap: 2,
  },
  aboNom: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  aboEcole: {
    fontSize: 12,
    color: COLORS.taupe,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTexte: {
    fontSize: 11,
    fontWeight: '700',
  },
  aboHoraires: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  horaire: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  horaireIcone: {
    fontSize: 13,
  },
  horaireTexte: {
    fontSize: 12,
    color: COLORS.graphite,
    fontWeight: '600',
  },
  aboPrix: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.terracotta,
    marginLeft: 'auto',
  },
  enAttenteNote: {
    fontSize: 11,
    color: '#E65100',
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Formulaire
  champsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  champ: {
    gap: 6,
  },
  champLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  champInput: {
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.graphite,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  boutonSouscrire: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 14,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  boutonDesactive: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  boutonIcone: {
    fontSize: 18,
  },
  boutonTexte: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blanc,
    letterSpacing: 0.3,
  },
  note: {
    fontSize: 11,
    color: COLORS.taupe,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
