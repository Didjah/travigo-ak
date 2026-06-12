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
  creerLivraison,
  getLivraisonsExpediteur,
  TYPES_LIVRAISON,
  STATUTS,
  type TypeLivraison,
  type Livraison,
} from '../../services/livraisonService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Livraison'>;
  route: RouteProp<RootStackParamList, 'Livraison'>;
};

const TYPE_ORDRE: TypeLivraison[] = ['colis', 'medicament', 'autre'];

export default function LivraisonScreen({ navigation, route }: Props) {
  const { nom } = route.params;

  const [typeChoisi, setTypeChoisi] = useState<TypeLivraison>('colis');
  const [description, setDescription] = useState('');
  const [adresseCollecte, setAdresseCollecte] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [formulaireVisible, setFormulaireVisible] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    const user = getSessionUser();
    if (!user) { setChargement(false); return; }
    const liste = await getLivraisonsExpediteur(user.id);
    setLivraisons(liste);
    setFormulaireVisible(liste.length === 0);
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', charger);
    return unsub;
  }, [navigation, charger]);

  async function handleCommander() {
    const user = getSessionUser();
    if (!user) return;

    if (!description.trim()) {
      Alert.alert('Champ manquant', 'Décrivez le contenu du colis.');
      return;
    }
    if (!adresseCollecte.trim()) {
      Alert.alert('Champ manquant', "Indiquez l'adresse de collecte.");
      return;
    }
    if (!adresseLivraison.trim()) {
      Alert.alert('Champ manquant', "Indiquez l'adresse de livraison.");
      return;
    }

    setEnvoi(true);
    const result = await creerLivraison(
      user.id,
      typeChoisi,
      description.trim(),
      adresseCollecte.trim(),
      adresseLivraison.trim()
    );
    setEnvoi(false);

    if (result) {
      const info = TYPES_LIVRAISON[typeChoisi];
      Alert.alert(
        'Livraison commandée !',
        `Votre demande de livraison ${info.emoji} a été enregistrée.\nUn livreur va prendre en charge votre colis.\n\nPrix : ${info.prix.toLocaleString('fr-FR')} FCFA`,
        [{
          text: 'OK',
          onPress: () => {
            setDescription('');
            setAdresseCollecte('');
            setAdresseLivraison('');
            charger();
          },
        }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de créer la livraison. Réessayez.');
    }
  }

  const infoType = TYPES_LIVRAISON[typeChoisi];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCentre}>
          <Text style={styles.headerTitre}>Livraison</Text>
          <Text style={styles.headerSous}>{nom}</Text>
        </View>
        <View style={{ width: TOUCH.iconButton }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Sélecteur de type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TYPE DE LIVRAISON</Text>
          <View style={styles.typesRow}>
            {TYPE_ORDRE.map((type) => {
              const info = TYPES_LIVRAISON[type];
              const actif = typeChoisi === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeCard, actif && styles.typeCardActif]}
                  onPress={() => setTypeChoisi(type)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.typeEmoji}>{info.emoji}</Text>
                  <Text style={[styles.typeLabel, actif && styles.typeLabelActif]}>
                    {info.label}
                  </Text>
                  <Text style={[styles.typePrix, actif && styles.typePrixActif]}>
                    {info.prix.toLocaleString('fr-FR')} F
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.typeDesc}>{infoType.description}</Text>
        </View>

        {/* Livraisons en cours */}
        {chargement ? (
          <ActivityIndicator color={COLORS.terracotta} size="large" />
        ) : livraisons.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>MES LIVRAISONS</Text>
              <TouchableOpacity onPress={() => setFormulaireVisible((v) => !v)}>
                <Text style={styles.ajouterLien}>
                  {formulaireVisible ? '− Masquer' : '+ Nouvelle'}
                </Text>
              </TouchableOpacity>
            </View>
            {livraisons.map((liv) => {
              const info = TYPES_LIVRAISON[liv.type];
              const statut = STATUTS[liv.statut];
              return (
                <View key={liv.id} style={styles.livraisonCard}>
                  <View style={styles.livraisonCardTop}>
                    <View style={styles.livraisonIconeWrapper}>
                      <Text style={styles.livraisonIcone}>{info.emoji}</Text>
                    </View>
                    <View style={styles.livraisonTextes}>
                      <Text style={styles.livraisonDesc} numberOfLines={1}>
                        {liv.description_colis}
                      </Text>
                      <Text style={styles.livraisonType}>{info.label}</Text>
                    </View>
                    <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
                      <Text style={[styles.statutTexte, { color: statut.color }]}>
                        {statut.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.livraisonAdresses}>
                    <View style={styles.adresseRow}>
                      <View style={styles.adressePoint} />
                      <Text style={styles.adresseTexte} numberOfLines={1}>
                        {liv.adresse_collecte}
                      </Text>
                    </View>
                    <View style={styles.adresseTiret} />
                    <View style={styles.adresseRow}>
                      <View style={[styles.adressePoint, styles.adressePointDest]} />
                      <Text style={styles.adresseTexte} numberOfLines={1}>
                        {liv.adresse_livraison}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.livraisonPrix}>
                    {liv.prix_fcfa.toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Formulaire */}
        {(formulaireVisible || livraisons.length === 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DÉTAILS DE LA LIVRAISON</Text>

            <View style={styles.champ}>
              <Text style={styles.champLabel}>Description du contenu</Text>
              <TextInput
                style={styles.champInput}
                placeholder={
                  typeChoisi === 'medicament'
                    ? 'Ex : Doliprane 1000mg, ordonnance…'
                    : typeChoisi === 'autre'
                    ? 'Ex : Dossier de candidature, contrat…'
                    : 'Ex : Vêtements, téléphone, nourriture…'
                }
                placeholderTextColor={COLORS.taupe}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.champ}>
              <Text style={styles.champLabel}>📍 Adresse de collecte</Text>
              <TextInput
                style={styles.champInput}
                placeholder="Où récupérer le colis ?"
                placeholderTextColor={COLORS.taupe}
                value={adresseCollecte}
                onChangeText={setAdresseCollecte}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.champ}>
              <Text style={styles.champLabel}>🏁 Adresse de livraison</Text>
              <TextInput
                style={styles.champInput}
                placeholder="Où livrer le colis ?"
                placeholderTextColor={COLORS.taupe}
                value={adresseLivraison}
                onChangeText={setAdresseLivraison}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.estimationCard}>
              <Text style={styles.estimationLabel}>Estimation</Text>
              <Text style={styles.estimationPrix}>
                {infoType.prix.toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={styles.estimationSous}>
                Fourchette : 500 – 1 500 FCFA selon la distance
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.boutonCommander, envoi && styles.boutonDesactive]}
              onPress={handleCommander}
              activeOpacity={0.85}
              disabled={envoi}
            >
              {envoi ? (
                <ActivityIndicator color={COLORS.blanc} size="small" />
              ) : (
                <>
                  <Text style={styles.boutonIcone}>{infoType.emoji}</Text>
                  <Text style={styles.boutonTexte}>Commander la livraison</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.note}>
          * Le prix final peut varier selon la distance réelle.{'\n'}
          Paiement à la livraison (espèces ou mobile money).
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
    gap: SPACING.lg - 2,
  },

  section: { gap: SPACING.md - 2 },
  sectionLabel: { ...TYPOGRAPHY.micro, color: COLORS.taupe, letterSpacing: 1.2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ajouterLien: { ...TYPOGRAPHY.caption, color: COLORS.terracotta, fontWeight: '700' },

  typesRow: { flexDirection: 'row', gap: SPACING.sm + 2 },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    alignItems: 'center',
    gap: SPACING.xs + 2,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  typeCardActif: {
    borderColor: COLORS.terracotta,
    backgroundColor: '#FFF4F0',
    shadowColor: COLORS.terracotta,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  typeEmoji: { fontSize: 26 },
  typeLabel: { ...TYPOGRAPHY.caption, color: COLORS.graphite, textAlign: 'center' },
  typeLabelActif: { color: COLORS.terracotta },
  typePrix: { ...TYPOGRAPHY.micro, color: COLORS.taupe, fontWeight: '600' },
  typePrixActif: { color: COLORS.terracotta },
  typeDesc: { ...TYPOGRAPHY.caption, color: COLORS.taupe, textAlign: 'center', lineHeight: 17, fontWeight: '400' },

  livraisonCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md - 4,
    ...SHADOWS.card,
  },
  livraisonCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md - 4 },
  livraisonIconeWrapper: {
    width: TOUCH.iconButton - 4,
    height: TOUCH.iconButton - 4,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFF4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livraisonIcone: { fontSize: 20 },
  livraisonTextes: { flex: 1, gap: 2 },
  livraisonDesc: { ...TYPOGRAPHY.h3, color: COLORS.graphite },
  livraisonType: { ...TYPOGRAPHY.micro, color: COLORS.taupe, fontWeight: '600' },
  statutBadge: {
    paddingHorizontal: SPACING.sm + 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  statutTexte: { ...TYPOGRAPHY.micro, fontWeight: '700' },
  livraisonAdresses: {
    gap: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: SPACING.sm + 2,
  },
  adresseRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  adressePoint: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
  },
  adressePointDest: { borderRadius: 2, backgroundColor: COLORS.graphite },
  adresseTiret: { width: 1, height: 10, backgroundColor: COLORS.borderLight, marginLeft: 3.5 },
  adresseTexte: { ...TYPOGRAPHY.caption, color: COLORS.graphite, fontWeight: '500', flex: 1 },
  livraisonPrix: { ...TYPOGRAPHY.h3, color: COLORS.terracotta, textAlign: 'right' },

  champ: { gap: SPACING.xs + 2 },
  champLabel: { ...TYPOGRAPHY.micro, color: COLORS.graphite, textTransform: 'uppercase', letterSpacing: 0.6 },
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

  estimationCard: {
    backgroundColor: COLORS.graphite,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.card,
  },
  estimationLabel: {
    ...TYPOGRAPHY.micro,
    color: '#9A9A9A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  estimationPrix: { ...TYPOGRAPHY.display, color: COLORS.ivoire, letterSpacing: 1 },
  estimationSous: { ...TYPOGRAPHY.micro, color: '#9A9A9A', textAlign: 'center', fontWeight: '400' },

  boutonCommander: {
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm + 2,
    minHeight: TOUCH.minButton,
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
