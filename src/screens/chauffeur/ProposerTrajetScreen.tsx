import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  publierTrajet,
  VILLES_DESTINATIONS,
  VILLE_DEPART_DEFAUT,
  dateAujourdhui,
} from '../../services/covoiturageService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProposerTrajet'>;
};

const VILLES = Object.keys(VILLES_DESTINATIONS);

export default function ProposerTrajetScreen({ navigation }: Props) {
  const user = getSessionUser();

  const [villeArrivee, setVilleArrivee] = useState('');
  const [date, setDate] = useState(dateAujourdhui());
  const [heure, setHeure] = useState('07:00');
  const [placesTotales, setPlacesTotales] = useState(3);
  const [prixParPlace, setPrixParPlace] = useState(0);
  const [publication, setPublication] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  function choisirVille(ville: string) {
    setVilleArrivee(ville);
    const info = VILLES_DESTINATIONS[ville];
    if (info) setPrixParPlace(info.prixSuggere);
    setErreurs(e => ({ ...e, villeArrivee: '' }));
  }

  function valider(): boolean {
    const nouvellesErreurs: Record<string, string> = {};
    if (!villeArrivee) nouvellesErreurs.villeArrivee = 'Choisissez une destination.';
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      nouvellesErreurs.date = 'Format requis : AAAA-MM-JJ';
    if (date < dateAujourdhui()) nouvellesErreurs.date = 'La date doit être aujourd\'hui ou future.';
    if (!heure || !/^\d{2}:\d{2}$/.test(heure))
      nouvellesErreurs.heure = 'Format requis : HH:MM';
    if (placesTotales < 1 || placesTotales > 8)
      nouvellesErreurs.places = 'Entre 1 et 8 places.';
    if (prixParPlace < 100)
      nouvellesErreurs.prix = 'Prix minimum : 100 FCFA.';
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  }

  async function publier() {
    if (!valider()) return;
    if (!__DEV__ && !user) return;
    setPublication(true);

    if (__DEV__) {
      await new Promise(r => setTimeout(r, 800));
      Alert.alert(
        'Trajet publié !',
        `${VILLE_DEPART_DEFAUT} → ${villeArrivee}\n${date} à ${heure}\n${placesTotales} places · ${prixParPlace.toLocaleString()} FCFA/place`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setPublication(false);
      return;
    }

    const trajet = await publierTrajet(
      user.id,
      VILLE_DEPART_DEFAUT,
      villeArrivee,
      date,
      heure,
      placesTotales,
      prixParPlace
    );
    setPublication(false);
    if (trajet) {
      Alert.alert(
        'Trajet publié !',
        `Votre trajet ${VILLE_DEPART_DEFAUT} → ${villeArrivee} est maintenant visible.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de publier le trajet. Réessayez.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.retour} onPress={() => navigation.goBack()}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitre}>Proposer un trajet</Text>
          <Text style={styles.headerSous}>Covoiturage inter-villes</Text>
        </View>
        {__DEV__ && (
          <View style={styles.badgeDev}>
            <Text style={styles.badgeDevTexte}>DEV</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.corps} showsVerticalScrollIndicator={false}>
        {/* Départ — fixe */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ville de départ</Text>
          <View style={styles.champFixe}>
            <Text style={styles.champFixeIcone}>📍</Text>
            <Text style={styles.champFixeTexte}>{VILLE_DEPART_DEFAUT}</Text>
            <View style={styles.badgeFixe}>
              <Text style={styles.badgeFixeTexte}>Fixe</Text>
            </View>
          </View>
        </View>

        {/* Destination */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Destination <Text style={styles.obligatoire}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.villesRow}
          >
            {VILLES.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chipVille, villeArrivee === v && styles.chipVilleActif]}
                onPress={() => choisirVille(v)}
              >
                <Text
                  style={[
                    styles.chipVilleTexte,
                    villeArrivee === v && styles.chipVilleTexteActif,
                  ]}
                >
                  {v}
                </Text>
                {villeArrivee === v && (
                  <Text style={styles.chipVilleKm}>
                    {VILLES_DESTINATIONS[v].distance} km
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {erreurs.villeArrivee ? (
            <Text style={styles.erreur}>{erreurs.villeArrivee}</Text>
          ) : null}
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Date de départ <Text style={styles.obligatoire}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, erreurs.date && styles.inputErreur]}
            value={date}
            onChangeText={t => {
              setDate(t);
              setErreurs(e => ({ ...e, date: '' }));
            }}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={COLORS.taupe}
            keyboardType="numeric"
            maxLength={10}
          />
          {erreurs.date ? <Text style={styles.erreur}>{erreurs.date}</Text> : null}
        </View>

        {/* Heure */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Heure de départ <Text style={styles.obligatoire}>*</Text>
          </Text>
          <View style={styles.heuresRow}>
            {['05:00', '06:00', '07:00', '08:00', '09:00', '14:00', '15:00', '16:00'].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.chipHeure, heure === h && styles.chipHeureActif]}
                onPress={() => {
                  setHeure(h);
                  setErreurs(e => ({ ...e, heure: '' }));
                }}
              >
                <Text
                  style={[styles.chipHeureTexte, heure === h && styles.chipHeureTexteActif]}
                >
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 8 }, erreurs.heure && styles.inputErreur]}
            value={heure}
            onChangeText={t => {
              setHeure(t);
              setErreurs(e => ({ ...e, heure: '' }));
            }}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.taupe}
            keyboardType="numeric"
            maxLength={5}
          />
          {erreurs.heure ? <Text style={styles.erreur}>{erreurs.heure}</Text> : null}
        </View>

        {/* Nombre de places */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Nombre de places <Text style={styles.obligatoire}>*</Text>
          </Text>
          <View style={styles.placesControle}>
            <TouchableOpacity
              style={styles.placesBtn}
              onPress={() => setPlacesTotales(Math.max(1, placesTotales - 1))}
            >
              <Text style={styles.placesBtnTexte}>−</Text>
            </TouchableOpacity>
            <Text style={styles.placesValeur}>{placesTotales}</Text>
            <TouchableOpacity
              style={styles.placesBtn}
              onPress={() => setPlacesTotales(Math.min(8, placesTotales + 1))}
            >
              <Text style={styles.placesBtnTexte}>+</Text>
            </TouchableOpacity>
          </View>
          {erreurs.places ? <Text style={styles.erreur}>{erreurs.places}</Text> : null}
        </View>

        {/* Prix par place */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Prix par place (FCFA) <Text style={styles.obligatoire}>*</Text>
          </Text>
          {villeArrivee && VILLES_DESTINATIONS[villeArrivee] && (
            <View style={styles.suggestionBadge}>
              <Text style={styles.suggestionTexte}>
                💡 Suggestion pour {villeArrivee} :{' '}
                {VILLES_DESTINATIONS[villeArrivee].prixSuggere.toLocaleString()} FCFA
              </Text>
            </View>
          )}
          <TextInput
            style={[styles.input, erreurs.prix && styles.inputErreur]}
            value={prixParPlace > 0 ? String(prixParPlace) : ''}
            onChangeText={t => {
              setPrixParPlace(parseInt(t, 10) || 0);
              setErreurs(e => ({ ...e, prix: '' }));
            }}
            placeholder="Ex : 4000"
            placeholderTextColor={COLORS.taupe}
            keyboardType="numeric"
          />
          {erreurs.prix ? <Text style={styles.erreur}>{erreurs.prix}</Text> : null}
        </View>

        {/* Récap revenus */}
        {prixParPlace > 0 && placesTotales > 0 && (
          <View style={styles.recapRevenu}>
            <Text style={styles.recapRevenuTitre}>Revenu estimé</Text>
            <Text style={styles.recapRevenuMontant}>
              {(prixParPlace * placesTotales).toLocaleString()} FCFA
            </Text>
            <Text style={styles.recapRevenuSous}>
              si toutes les {placesTotales} places sont réservées
            </Text>
          </View>
        )}

        {/* Bouton publier */}
        <TouchableOpacity
          style={[styles.btnPublier, publication && styles.btnPublierDisabled]}
          onPress={publier}
          disabled={publication}
        >
          {publication ? (
            <ActivityIndicator color={COLORS.blanc} />
          ) : (
            <>
              <Text style={styles.btnPublierIcone}>🚗</Text>
              <Text style={styles.btnPublierTexte}>Publier le trajet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2A2A2A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  retour: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retourTexte: { fontSize: 20, color: COLORS.blanc, lineHeight: 22 },
  headerTitre: { fontSize: 20, fontWeight: '800', color: COLORS.blanc },
  headerSous: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  badgeDev: { marginLeft: 'auto' },
  badgeDevTexte: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.terracotta,
    backgroundColor: COLORS.terracotta + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  corps: {
    backgroundColor: COLORS.ivoire,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 22,
  },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.taupe, textTransform: 'uppercase', letterSpacing: 0.8 },
  obligatoire: { color: COLORS.terracotta },
  champFixe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  champFixeIcone: { fontSize: 18 },
  champFixeTexte: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.graphite },
  badgeFixe: {
    backgroundColor: COLORS.taupe + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeFixeTexte: { fontSize: 11, fontWeight: '600', color: COLORS.taupe },
  villesRow: { gap: 8, paddingBottom: 4 },
  chipVille: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.blanc,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    alignItems: 'center',
  },
  chipVilleActif: { backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta },
  chipVilleTexte: { fontSize: 14, fontWeight: '600', color: COLORS.graphite },
  chipVilleTexteActif: { color: COLORS.blanc },
  chipVilleKm: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  input: {
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.graphite,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  inputErreur: { borderColor: COLORS.rouge },
  erreur: { fontSize: 12, color: COLORS.rouge, marginTop: -4 },
  heuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipHeure: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.blanc,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  chipHeureActif: { backgroundColor: COLORS.graphite, borderColor: COLORS.graphite },
  chipHeureTexte: { fontSize: 13, fontWeight: '600', color: COLORS.graphite },
  chipHeureTexteActif: { color: COLORS.blanc },
  placesControle: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  placesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  placesBtnTexte: { fontSize: 22, color: COLORS.graphite, lineHeight: 24 },
  placesValeur: { fontSize: 28, fontWeight: '800', color: COLORS.graphite, minWidth: 40, textAlign: 'center' },
  suggestionBadge: {
    backgroundColor: COLORS.terracotta + '15',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.terracotta,
  },
  suggestionTexte: { fontSize: 13, color: COLORS.terracotta, fontWeight: '600' },
  recapRevenu: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  recapRevenuTitre: { fontSize: 13, color: COLORS.taupe, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  recapRevenuMontant: { fontSize: 28, fontWeight: '800', color: COLORS.terracotta },
  recapRevenuSous: { fontSize: 12, color: COLORS.taupe, textAlign: 'center' },
  btnPublier: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 8,
  },
  btnPublierDisabled: { opacity: 0.6 },
  btnPublierIcone: { fontSize: 20 },
  btnPublierTexte: { fontSize: 16, fontWeight: '800', color: COLORS.blanc },
});
