import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { initierPaiement, ModePaiement } from '../../services/paiementService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paiement'>;
  route: RouteProp<RootStackParamList, 'Paiement'>;
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
    id: 'especes',
    label: 'Espèces',
    emoji: '💵',
    couleur: COLORS.graphite,
    mobileMoney: false,
    description: 'Paiement en cash au chauffeur',
  },
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
];

export default function PaiementScreen({ navigation, route }: Props) {
  const { nom, montant, courseId } = route.params;
  const [modeChoisi, setModeChoisi] = useState<ModePaiement>('especes');
  const [telephone, setTelephone] = useState('');
  const [chargement, setChargement] = useState(false);

  const modeInfo = MODES.find((m) => m.id === modeChoisi)!;

  async function handleConfirmer() {
    if (modeInfo.mobileMoney && telephone.trim().length < 8) {
      Alert.alert(
        'Numéro requis',
        `Veuillez entrer votre numéro ${modeInfo.label} (10 chiffres).`
      );
      return;
    }

    setChargement(true);
    const resultat = await initierPaiement(
      courseId ?? 'dev',
      montant,
      modeChoisi,
      telephone.trim() || undefined
    );
    setChargement(false);

    if (resultat.statut === 'succes' || resultat.statut === 'en_attente') {
      navigation.replace('SuccesPaiement', {
        nom,
        montant,
        modePaiement: modeChoisi,
        courseId,
      });
    } else {
      Alert.alert(
        'Paiement échoué',
        resultat.messageErreur ?? 'Une erreur est survenue. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.titre}>Paiement</Text>
          <Text style={styles.sousTitre}>Choisissez votre mode de paiement</Text>
        </View>

        {/* Montant */}
        <View style={styles.montantCard}>
          <Text style={styles.montantLabel}>Total à régler</Text>
          <Text style={styles.montantValeur}>{montant.toLocaleString('fr-FR')} FCFA</Text>
          {__DEV__ && (
            <Text style={styles.devTexte}>Mode DEV — paiement simulé (2 s)</Text>
          )}
        </View>

        {/* Modes de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Mode de paiement</Text>
          <View style={styles.modesList}>
            {MODES.map((mode) => {
              const actif = modeChoisi === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeItem,
                    actif && {
                      borderColor: mode.couleur,
                      borderWidth: 2,
                      backgroundColor: `${mode.couleur}12`,
                    },
                  ]}
                  onPress={() => setModeChoisi(mode.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                  <View style={styles.modeTextes}>
                    <Text
                      style={[
                        styles.modeLabel,
                        actif && { color: mode.couleur, fontWeight: '700' },
                      ]}
                    >
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

        {/* Champ téléphone — affiché uniquement pour les modes mobile money */}
        {modeInfo.mobileMoney && (
          <View style={styles.section}>
            <Text style={styles.sectionTitre}>Numéro {modeInfo.label}</Text>
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
            <Text style={styles.boutonTexte}>Confirmer le paiement</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    gap: 24,
  },

  // En-tête
  header: {
    gap: 4,
  },
  titre: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.graphite,
    letterSpacing: 0.2,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
  },

  // Montant
  montantCard: {
    backgroundColor: COLORS.graphite,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  montantLabel: {
    fontSize: 12,
    color: '#9A9A9A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  montantValeur: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.ivoire,
    letterSpacing: 1,
  },
  devTexte: {
    fontSize: 11,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '500',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionTitre: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    fontSize: 15,
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
