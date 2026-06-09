import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  getAbonnementActif,
  getDernierAbonnement,
  PLANS,
  joursRestants,
  estExpire,
  type Abonnement,
  type TypeAbonnement,
} from '../../services/abonnementService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Abonnement'>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function StatutActuel({ abonnement }: { abonnement: Abonnement | null }) {
  if (!abonnement) {
    return (
      <View style={styles.statutCard}>
        <View style={[styles.statutPoint, { backgroundColor: '#9CA3AF' }]} />
        <View style={styles.statutTextes}>
          <Text style={styles.statutTitre}>Aucun abonnement actif</Text>
          <Text style={styles.statutSous}>Choisissez un plan ci-dessous pour commencer</Text>
        </View>
      </View>
    );
  }

  const expire = estExpire(abonnement);
  const jours = joursRestants(abonnement);
  const plan = PLANS[abonnement.type];
  const couleur = expire ? '#C62828' : jours <= 5 ? '#E65100' : '#2E7D32';

  return (
    <View style={[styles.statutCard, { borderColor: couleur + '40', borderWidth: 1.5 }]}>
      <View style={[styles.statutPoint, { backgroundColor: couleur }]} />
      <View style={styles.statutTextes}>
        <Text style={styles.statutTitre}>
          {plan.emoji} {plan.label}
          {' '}
          <Text style={[styles.statutBadge, { color: couleur }]}>
            {expire ? '• Expiré' : '• Actif'}
          </Text>
        </Text>
        <Text style={styles.statutSous}>
          {expire
            ? `Expiré le ${formatDate(abonnement.date_fin)}`
            : `Expire le ${formatDate(abonnement.date_fin)} — ${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`}
        </Text>
      </View>
    </View>
  );
}

const ORDRE: TypeAbonnement[] = ['tricycle', 'taxi', 'premium'];

export default function AbonnementScreen({ navigation }: Props) {
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const user = getSessionUser();
    if (!user) { setChargement(false); return; }

    const actif = await getAbonnementActif(user.id);
    if (actif) {
      setAbonnement(actif);
    } else {
      const dernier = await getDernierAbonnement(user.id);
      setAbonnement(dernier);
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Recharger à chaque retour sur l'écran
  useEffect(() => {
    const unsub = navigation.addListener('focus', charger);
    return unsub;
  }, [navigation, charger]);

  function handleSouscrire(type: TypeAbonnement) {
    navigation.navigate('PaiementAbonnement', { type });
  }

  if (chargement) {
    return (
      <View style={styles.loaderWrapper}>
        <ActivityIndicator color={COLORS.terracotta} size="large" />
      </View>
    );
  }

  const abonnementType = abonnement?.statut === 'actif' && !estExpire(abonnement)
    ? abonnement.type
    : null;

  return (
    <View style={styles.container}>
      {/* En-tête sombre */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut actuel */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VOTRE ABONNEMENT</Text>
          <StatutActuel abonnement={abonnement} />
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CHOISIR UN PLAN</Text>
          <View style={styles.plansListe}>
            {ORDRE.map((type) => {
              const plan = PLANS[type];
              const estActif = abonnementType === type;
              const estPremium = type === 'premium';

              return (
                <View
                  key={type}
                  style={[
                    styles.planCard,
                    estPremium && styles.planCardPremium,
                    estActif && styles.planCardActif,
                  ]}
                >
                  {/* Badge POPULAIRE */}
                  {estPremium && (
                    <View style={styles.badgePopulaire}>
                      <Text style={styles.badgePopulaireTexte}>POPULAIRE</Text>
                    </View>
                  )}

                  {/* Badge ACTIF */}
                  {estActif && (
                    <View style={styles.badgeActif}>
                      <Text style={styles.badgeActifTexte}>EN COURS</Text>
                    </View>
                  )}

                  {/* Titre + Prix */}
                  <View style={styles.planHeader}>
                    <Text style={styles.planEmoji}>{plan.emoji}</Text>
                    <View style={styles.planTitreWrapper}>
                      <Text style={[styles.planNom, estPremium && styles.planNomPremium]}>
                        {plan.label}
                      </Text>
                      <Text style={[styles.planPrix, estPremium && styles.planPrixPremium]}>
                        {plan.montant.toLocaleString('fr-FR')} FCFA
                        <Text style={styles.planPrixSous}> /mois</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Avantages */}
                  <View style={styles.avantages}>
                    {plan.avantages.map((av, i) => (
                      <View key={i} style={styles.avantageRow}>
                        <Text style={[styles.avantageCoche, estPremium && styles.avantageCochePremium]}>✓</Text>
                        <Text style={[styles.avantageTexte, estPremium && styles.avantageTextePremium]}>
                          {av}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Bouton */}
                  <TouchableOpacity
                    style={[
                      styles.boutonSouscrire,
                      estPremium && styles.boutonSouscrirePremium,
                      estActif && styles.boutonSouscrireActif,
                    ]}
                    onPress={() => handleSouscrire(type)}
                    activeOpacity={0.85}
                  >
                    <Text style={[
                      styles.boutonSouscrireTexte,
                      estPremium && styles.boutonSouscrireTextePremium,
                    ]}>
                      {estActif ? 'Renouveler' : 'Souscrire'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Note bas de page */}
        <Text style={styles.note}>
          * L'abonnement est valable 30 jours à partir de la date de paiement.{'\n'}
          Paiement via Orange Money, MTN Money, Wave ou espèces en agence.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: '#2A2A2A',
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
  inner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 24,
    backgroundColor: COLORS.ivoire,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.taupe,
    letterSpacing: 1.2,
  },

  // Statut actuel
  statutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  statutPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statutTextes: {
    flex: 1,
    gap: 2,
  },
  statutTitre: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  statutBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  statutSous: {
    fontSize: 12,
    color: COLORS.taupe,
  },

  // Plans
  plansListe: {
    gap: 14,
  },
  planCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  planCardPremium: {
    backgroundColor: '#2A2A2A',
    borderColor: COLORS.terracotta,
    borderWidth: 2,
    shadowColor: COLORS.terracotta,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  planCardActif: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  badgePopulaire: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgePopulaireTexte: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.blanc,
    letterSpacing: 1.5,
  },
  badgeActif: {
    position: 'absolute',
    top: -1,
    left: 16,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeActifTexte: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.blanc,
    letterSpacing: 1.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  planEmoji: {
    fontSize: 32,
  },
  planTitreWrapper: {
    gap: 2,
  },
  planNom: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.graphite,
  },
  planNomPremium: {
    color: COLORS.ivoire,
  },
  planPrix: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.terracotta,
  },
  planPrixPremium: {
    color: COLORS.terracotta,
  },
  planPrixSous: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.taupe,
  },
  avantages: {
    gap: 8,
  },
  avantageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avantageCoche: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.terracotta,
    width: 16,
    marginTop: 1,
  },
  avantageCochePremium: {
    color: COLORS.terracotta,
  },
  avantageTexte: {
    fontSize: 13,
    color: COLORS.graphite,
    flex: 1,
    lineHeight: 18,
  },
  avantageTextePremium: {
    color: '#B0A898',
  },
  boutonSouscrire: {
    backgroundColor: COLORS.graphite,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  boutonSouscrirePremium: {
    backgroundColor: COLORS.terracotta,
    shadowColor: COLORS.terracotta,
    shadowOpacity: 0.35,
  },
  boutonSouscrireActif: {
    backgroundColor: '#1B5E20',
  },
  boutonSouscrireTexte: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blanc,
    letterSpacing: 0.4,
  },
  boutonSouscrireTextePremium: {
    color: COLORS.blanc,
  },
  note: {
    fontSize: 11,
    color: COLORS.taupe,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
