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
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCentre}>
          <Text style={styles.headerTitre}>Livraison</Text>
          <Text style={styles.headerSous}>{nom}</Text>
        </View>
        <View style={{ width: 40 }} />
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

            {/* Estimation prix */}
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
  headerCentre: { alignItems: 'center' },
  headerTitre: { fontSize: 17, fontWeight: '800', color: COLORS.graphite },
  headerSous: { fontSize: 11, color: COLORS.taupe, marginTop: 1 },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 22,
  },

  // Types
  section: { gap: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.taupe,
    letterSpacing: 1.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ajouterLien: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.terracotta,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.graphite,
    textAlign: 'center',
  },
  typeLabelActif: { color: COLORS.terracotta },
  typePrix: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.taupe,
  },
  typePrixActif: { color: COLORS.terracotta },
  typeDesc: {
    fontSize: 12,
    color: COLORS.taupe,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Livraisons existantes
  livraisonCard: {
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
  livraisonCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  livraisonIconeWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livraisonIcone: { fontSize: 20 },
  livraisonTextes: { flex: 1, gap: 2 },
  livraisonDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  livraisonType: { fontSize: 11, color: COLORS.taupe },
  statutBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statutTexte: { fontSize: 11, fontWeight: '700' },
  livraisonAdresses: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingTop: 10,
  },
  adresseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adressePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.terracotta,
  },
  adressePointDest: {
    borderRadius: 2,
    backgroundColor: COLORS.graphite,
  },
  adresseTiret: {
    width: 1,
    height: 10,
    backgroundColor: '#E5E0D8',
    marginLeft: 3.5,
  },
  adresseTexte: {
    fontSize: 12,
    color: COLORS.graphite,
    fontWeight: '500',
    flex: 1,
  },
  livraisonPrix: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.terracotta,
    textAlign: 'right',
  },

  // Formulaire
  champ: { gap: 6 },
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
    minHeight: 48,
  },

  // Estimation
  estimationCard: {
    backgroundColor: COLORS.graphite,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 4,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  estimationLabel: {
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  estimationPrix: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ivoire,
    letterSpacing: 1,
  },
  estimationSous: {
    fontSize: 11,
    color: '#9A9A9A',
    textAlign: 'center',
  },

  boutonCommander: {
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
  },
  boutonDesactive: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  boutonIcone: { fontSize: 18 },
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
