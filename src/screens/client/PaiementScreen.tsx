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
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
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

        {/* Champ téléphone mobile money */}
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
  container: { flex: 1, backgroundColor: COLORS.ivoire },
  inner: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl + SPACING.sm,
    gap: SPACING.lg,
  },

  header: { gap: SPACING.xs },
  titre: { ...TYPOGRAPHY.display, color: COLORS.graphite, fontSize: 28 },
  sousTitre: { ...TYPOGRAPHY.body, color: COLORS.taupe },

  montantCard: {
    backgroundColor: COLORS.graphite,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl - 4,
    alignItems: 'center',
    gap: SPACING.xs + 2,
    ...SHADOWS.modal,
  },
  montantLabel: {
    ...TYPOGRAPHY.micro,
    color: '#9A9A9A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  montantValeur: { ...TYPOGRAPHY.display, color: COLORS.ivoire, fontSize: 38, letterSpacing: 1 },
  devTexte: { ...TYPOGRAPHY.micro, color: '#FFD700', marginTop: SPACING.xs, fontWeight: '500' },

  section: { gap: SPACING.md - 4 },
  sectionTitre: {
    ...TYPOGRAPHY.micro,
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  modesList: { gap: SPACING.sm + 2 },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md - 2,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: TOUCH.minSize + 4,
    ...SHADOWS.card,
  },
  modeEmoji: { fontSize: 26, width: 34, textAlign: 'center' },
  modeTextes: { flex: 1, gap: 2 },
  modeLabel: { ...TYPOGRAPHY.h3, color: COLORS.graphite, fontWeight: '500' },
  modeDesc: { ...TYPOGRAPHY.micro, color: COLORS.taupe, fontWeight: '400' },
  modeCoche: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCocheTexte: { color: COLORS.blanc, fontSize: 12, fontWeight: '900' },

  champTel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: 2,
    minHeight: TOUCH.minSize,
  },
  champTelPrefixe: {
    ...TYPOGRAPHY.h3,
    color: COLORS.graphite,
    marginRight: SPACING.sm + 2,
    paddingVertical: SPACING.md - 4,
  },
  champTelInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.graphite,
    paddingVertical: SPACING.md - 4,
    fontWeight: '500',
  },

  bouton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    minHeight: TOUCH.minButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonDesactive: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  boutonTexte: { ...TYPOGRAPHY.h2, color: COLORS.blanc, letterSpacing: 0.4 },
});
