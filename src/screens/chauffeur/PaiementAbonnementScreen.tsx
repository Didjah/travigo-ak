import React, { useState } from 'react';
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
import { PLANS, creerAbonnement, type TypeAbonnement } from '../../services/abonnementService';
import { type ModePaiement } from '../../services/paiementService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PaiementAbonnement'>;
  route: RouteProp<RootStackParamList, 'PaiementAbonnement'>;
};

interface InfoMode {
  id: ModePaiement;
  label: string;
  emoji: string;
  couleur: string;
  mobileMoney: boolean;
  description: string;
}

const MODES: InfoMode[] = [
  {
    id: 'orange_money',
    label: 'Orange Money',
    emoji: '🟠',
    couleur: '#FF6600',
    mobileMoney: true,
    description: 'Paiement via Orange Money CI',
  },
  {
    id: 'mtn_money',
    label: 'MTN Money',
    emoji: '🟡',
    couleur: '#FFCC00',
    mobileMoney: true,
    description: 'Paiement via MTN Mobile Money',
  },
  {
    id: 'wave',
    label: 'Wave',
    emoji: '🌊',
    couleur: '#1D9BF0',
    mobileMoney: true,
    description: 'Paiement via Wave',
  },
  {
    id: 'especes',
    label: 'Espèces (agence)',
    emoji: '💵',
    couleur: COLORS.graphite,
    mobileMoney: false,
    description: 'Paiement en cash à notre agence de Gagnoa',
  },
];

// Clés CinetPay — à renseigner pour la production
const CINETPAY_API_KEY = '';
const CINETPAY_SITE_ID = '';
const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

function genTxId(): string {
  return `TRV-ABO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function initierPaiementAbonnement(
  montant: number,
  mode: ModePaiement,
  telephone?: string
): Promise<'succes' | 'en_attente' | 'echec'> {
  if (__DEV__) {
    await new Promise((r) => setTimeout(r, 2000));
    return 'succes';
  }

  if (mode === 'especes') return 'succes';

  const txId = genTxId();
  try {
    const response = await fetch(CINETPAY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: txId,
        amount: montant,
        currency: 'XOF',
        description: 'Abonnement TRAVIGO-AK',
        customer_phone_number: telephone ?? '',
        channels: 'MOBILE_MONEY',
        lang: 'FR',
      }),
    });
    const data = await response.json();
    if (data.code === '201') return 'en_attente';
    return 'echec';
  } catch {
    return 'echec';
  }
}

export default function PaiementAbonnementScreen({ navigation, route }: Props) {
  const { type } = route.params;
  const plan = PLANS[type];

  const [modeChoisi, setModeChoisi] = useState<ModePaiement>('orange_money');
  const [telephone, setTelephone] = useState('');
  const [chargement, setChargement] = useState(false);

  const modeInfo = MODES.find((m) => m.id === modeChoisi)!;

  async function handleConfirmer() {
    if (modeInfo.mobileMoney && telephone.trim().length < 8) {
      Alert.alert('Numéro requis', `Entrez votre numéro ${modeInfo.label} pour continuer.`);
      return;
    }

    setChargement(true);
    const statut = await initierPaiementAbonnement(
      plan.montant,
      modeChoisi,
      telephone.trim() || undefined
    );

    if (statut === 'succes' || statut === 'en_attente') {
      const user = getSessionUser();
      if (user) {
        const abo = await creerAbonnement(user.id, type);
        setChargement(false);
        if (abo) {
          Alert.alert(
            'Abonnement activé !',
            `Votre abonnement ${plan.label} est maintenant actif jusqu\'au ${new Date(abo.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
            [{ text: 'Super !', onPress: () => navigation.navigate('DashboardChauffeur') }]
          );
        } else {
          Alert.alert('Erreur', 'Paiement réussi mais activation échouée. Contactez le support.');
          navigation.navigate('DashboardChauffeur');
        }
      } else {
        setChargement(false);
        navigation.navigate('DashboardChauffeur');
      }
    } else {
      setChargement(false);
      Alert.alert('Paiement échoué', 'Une erreur est survenue. Veuillez réessayer.', [{ text: 'OK' }]);
    }
  }

  return (
    <View style={styles.container}>
      {/* En-tête sombre */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitre}>Paiement abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Récapitulatif plan */}
        <View style={styles.recap}>
          <Text style={styles.recapEmoji}>{plan.emoji}</Text>
          <View style={styles.recapTextes}>
            <Text style={styles.recapLabel}>Plan choisi</Text>
            <Text style={styles.recapNom}>{plan.label}</Text>
          </View>
          <View style={styles.recapMontantWrapper}>
            <Text style={styles.recapMontant}>{plan.montant.toLocaleString('fr-FR')}</Text>
            <Text style={styles.recapMonnaie}>FCFA/mois</Text>
          </View>
        </View>

        {__DEV__ && (
          <View style={styles.devBanner}>
            <Text style={styles.devTexte}>Mode DEV — paiement simulé (2 s)</Text>
          </View>
        )}

        {/* Modes de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>MODE DE PAIEMENT</Text>
          <View style={styles.modesList}>
            {MODES.map((mode) => {
              const actif = modeChoisi === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeItem,
                    actif && { borderColor: mode.couleur, borderWidth: 2, backgroundColor: `${mode.couleur}10` },
                  ]}
                  onPress={() => setModeChoisi(mode.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                  <View style={styles.modeTextes}>
                    <Text style={[styles.modeLabel, actif && { color: mode.couleur, fontWeight: '700' }]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeDesc}>{mode.description}</Text>
                  </View>
                  {actif && (
                    <View style={[styles.modeCoche, { backgroundColor: mode.couleur }]}>
                      <Text style={styles.modeCocheTexte}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Champ téléphone */}
        {modeInfo.mobileMoney && (
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>NUMÉRO {modeInfo.label.toUpperCase()}</Text>
            <View style={[styles.champTel, { borderColor: modeInfo.couleur }]}>
              <Text style={styles.champTelPrefixe}>+225</Text>
              <TextInput
                style={styles.champTelInput}
                placeholder="07 XX XX XX XX"
                placeholderTextColor={COLORS.taupe}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
        )}

        {/* Bouton confirmer */}
        <TouchableOpacity
          style={[
            styles.bouton,
            { backgroundColor: modeInfo.couleur },
            chargement && styles.boutonDesactive,
          ]}
          onPress={handleConfirmer}
          activeOpacity={0.85}
          disabled={chargement}
        >
          {chargement ? (
            <ActivityIndicator color={COLORS.blanc} size="small" />
          ) : (
            <Text style={styles.boutonTexte}>
              Payer {plan.montant.toLocaleString('fr-FR')} FCFA
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ivoire,
    letterSpacing: 0.3,
  },
  inner: {
    backgroundColor: COLORS.ivoire,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 22,
  },

  // Récapitulatif
  recap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.graphite,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  recapEmoji: {
    fontSize: 36,
  },
  recapTextes: {
    flex: 1,
    gap: 2,
  },
  recapLabel: {
    fontSize: 10,
    color: '#9A9A9A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recapNom: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ivoire,
  },
  recapMontantWrapper: {
    alignItems: 'flex-end',
  },
  recapMontant: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.terracotta,
  },
  recapMonnaie: {
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '500',
  },

  // DEV banner
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

  // Section
  section: {
    gap: 12,
  },
  sectionTitre: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.taupe,
    letterSpacing: 1.2,
  },

  // Modes
  modesList: {
    gap: 10,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  modeEmoji: {
    fontSize: 26,
    width: 34,
    textAlign: 'center',
  },
  modeTextes: {
    flex: 1,
    gap: 2,
  },
  modeLabel: {
    fontSize: 14,
    color: COLORS.graphite,
    fontWeight: '500',
  },
  modeDesc: {
    fontSize: 11,
    color: COLORS.taupe,
  },
  modeCoche: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCocheTexte: {
    color: COLORS.blanc,
    fontSize: 12,
    fontWeight: '900',
  },

  // Champ téléphone
  champTel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  champTelPrefixe: {
    fontSize: 15,
    color: COLORS.graphite,
    fontWeight: '700',
    marginRight: 10,
    paddingVertical: 12,
  },
  champTelInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.graphite,
    paddingVertical: 12,
    fontWeight: '500',
  },

  // Bouton
  bouton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonDesactive: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  boutonTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
