import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  TrajetCovoiturage,
  getTrajetsDisponibles,
  reserverPlace,
  calculerMontantPassager,
  formatDateFr,
  dateAujourdhui,
  VILLES_DESTINATIONS,
  TRAJETS_POPULAIRES,
  VILLE_DEPART_DEFAUT,
} from '../../services/covoiturageService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Covoiturage'>;
  route: RouteProp<RootStackParamList, 'Covoiturage'>;
};

const TRAJETS_DEMO: TrajetCovoiturage[] = [
  {
    id: 'demo-1',
    chauffeur_id: 'ch1',
    ville_depart: 'Gagnoa',
    ville_arrivee: 'Abidjan',
    date_depart: dateAujourdhui(),
    heure_depart: '06:00',
    places_totales: 4,
    places_disponibles: 2,
    prix_par_place_fcfa: 4000,
    statut: 'ouvert',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    chauffeur_id: 'ch2',
    ville_depart: 'Gagnoa',
    ville_arrivee: 'Daloa',
    date_depart: dateAujourdhui(),
    heure_depart: '08:30',
    places_totales: 3,
    places_disponibles: 1,
    prix_par_place_fcfa: 1500,
    statut: 'ouvert',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    chauffeur_id: 'ch3',
    ville_depart: 'Gagnoa',
    ville_arrivee: 'San Pedro',
    date_depart: dateAujourdhui(),
    heure_depart: '07:00',
    places_totales: 5,
    places_disponibles: 3,
    prix_par_place_fcfa: 3500,
    statut: 'ouvert',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    chauffeur_id: 'ch4',
    ville_depart: 'Gagnoa',
    ville_arrivee: 'Yamoussoukro',
    date_depart: dateAujourdhui(),
    heure_depart: '09:00',
    places_totales: 4,
    places_disponibles: 4,
    prix_par_place_fcfa: 2500,
    statut: 'ouvert',
    created_at: new Date().toISOString(),
  },
];

export default function CovoiturageScreen({ navigation, route }: Props) {
  const { nom } = route.params;
  const user = getSessionUser();

  const [trajets, setTrajets] = useState<TrajetCovoiturage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreDestination, setFiltreDestination] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [trajetSelectionne, setTrajetSelectionne] = useState<TrajetCovoiturage | null>(null);
  const [placesVoulues, setPlacesVoulues] = useState(1);
  const [reservation, setReservation] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    if (__DEV__) {
      await new Promise(r => setTimeout(r, 400));
      let liste = TRAJETS_DEMO;
      if (filtreDestination)
        liste = liste.filter(t =>
          t.ville_arrivee.toLowerCase().includes(filtreDestination.toLowerCase())
        );
      if (filtreDate) liste = liste.filter(t => t.date_depart === filtreDate);
      setTrajets(liste);
    } else {
      const data = await getTrajetsDisponibles(
        filtreDestination || undefined,
        filtreDate || undefined
      );
      setTrajets(data);
    }
    setLoading(false);
  }, [filtreDestination, filtreDate]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  function handleFiltrePopulaire(ville: string) {
    setFiltreDestination(ville === filtreDestination ? '' : ville);
  }

  function ouvrirReservation(trajet: TrajetCovoiturage) {
    setTrajetSelectionne(trajet);
    setPlacesVoulues(1);
  }

  function fermerReservation() {
    setTrajetSelectionne(null);
    setPlacesVoulues(1);
  }

  async function confirmerReservation() {
    if (!trajetSelectionne || !user) return;
    if (placesVoulues > trajetSelectionne.places_disponibles) {
      Alert.alert('Places insuffisantes', 'Il n\'y a pas assez de places disponibles.');
      return;
    }
    const montants = calculerMontantPassager(trajetSelectionne.prix_par_place_fcfa, placesVoulues);
    const msg =
      `Trajet : ${trajetSelectionne.ville_depart} → ${trajetSelectionne.ville_arrivee}\n` +
      `Date : ${formatDateFr(trajetSelectionne.date_depart)} à ${trajetSelectionne.heure_depart}\n` +
      `Places : ${placesVoulues}\n\n` +
      `Sous-total : ${montants.sousTotal.toLocaleString()} FCFA\n` +
      `Commission TRAVIGO (10%) : ${montants.commission.toLocaleString()} FCFA\n` +
      `Total : ${montants.total.toLocaleString()} FCFA`;

    Alert.alert('Confirmer la réservation', msg, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réserver',
        onPress: async () => {
          setReservation(true);
          fermerReservation();
          if (__DEV__) {
            await new Promise(r => setTimeout(r, 800));
            Alert.alert(
              'Réservation confirmée !',
              `Votre place est réservée.\nTotal payé : ${montants.total.toLocaleString()} FCFA`,
              [{ text: 'OK' }]
            );
          } else {
            const resa = await reserverPlace(
              trajetSelectionne.id,
              user.id,
              placesVoulues,
              trajetSelectionne.prix_par_place_fcfa
            );
            if (resa) {
              Alert.alert(
                'Réservation confirmée !',
                `Votre place est réservée.\nTotal : ${montants.total.toLocaleString()} FCFA`,
                [{ text: 'OK', onPress: charger }]
              );
            } else {
              Alert.alert('Erreur', 'Impossible de réserver. Veuillez réessayer.');
            }
          }
          setReservation(false);
        },
      },
    ]);
  }

  const montantPreview = trajetSelectionne
    ? calculerMontantPassager(trajetSelectionne.prix_par_place_fcfa, placesVoulues)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.retour} onPress={() => navigation.goBack()}>
          <Text style={styles.retourTexte}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitre}>Covoiturage</Text>
          <Text style={styles.headerSous}>Depuis {VILLE_DEPART_DEFAUT}</Text>
        </View>
        <View style={styles.badgeDev}>
          {__DEV__ && <Text style={styles.badgeDevTexte}>DEV</Text>}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtres}>
        <TextInput
          style={styles.inputFiltre}
          placeholder="Destination (ex : Abidjan)"
          placeholderTextColor={COLORS.taupe}
          value={filtreDestination}
          onChangeText={setFiltreDestination}
          onSubmitEditing={charger}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.boutonRecherche} onPress={charger}>
          <Text style={styles.boutonRechercheTexte}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres populaires */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.populairesRow}
      >
        {TRAJETS_POPULAIRES.map(v => (
          <TouchableOpacity
            key={v}
            style={[
              styles.chipPopulaire,
              filtreDestination === v && styles.chipPoplaireActif,
            ]}
            onPress={() => handleFiltrePopulaire(v)}
          >
            <Text
              style={[
                styles.chipPopulaireTexte,
                filtreDestination === v && styles.chipPopulaireTexteActif,
              ]}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste trajets */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.terracotta} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
        >
          {trajets.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.videIcone}>🚗</Text>
              <Text style={styles.videTexte}>Aucun trajet disponible</Text>
              <Text style={styles.videSous}>Modifiez vos filtres ou revenez plus tard</Text>
            </View>
          ) : (
            trajets.map(t => <CarteTrajet key={t.id} trajet={t} onReserver={() => ouvrirReservation(t)} />)
          )}
        </ScrollView>
      )}

      {/* Modal réservation */}
      <Modal visible={!!trajetSelectionne} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenu}>
            {trajetSelectionne && (
              <>
                <Text style={styles.modalTitre}>Réserver une place</Text>
                <Text style={styles.modalTrajet}>
                  {trajetSelectionne.ville_depart} → {trajetSelectionne.ville_arrivee}
                </Text>
                <Text style={styles.modalSous}>
                  {formatDateFr(trajetSelectionne.date_depart)} · {trajetSelectionne.heure_depart}
                </Text>

                <View style={styles.placesSelector}>
                  <Text style={styles.placesSelectorLabel}>Nombre de places</Text>
                  <View style={styles.placesControle}>
                    <TouchableOpacity
                      style={styles.placesBtn}
                      onPress={() => setPlacesVoulues(Math.max(1, placesVoulues - 1))}
                    >
                      <Text style={styles.placesBtnTexte}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.placesValeur}>{placesVoulues}</Text>
                    <TouchableOpacity
                      style={styles.placesBtn}
                      onPress={() =>
                        setPlacesVoulues(
                          Math.min(trajetSelectionne.places_disponibles, placesVoulues + 1)
                        )
                      }
                    >
                      <Text style={styles.placesBtnTexte}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {montantPreview && (
                  <View style={styles.recapMontant}>
                    <View style={styles.recapLigne}>
                      <Text style={styles.recapLabel}>
                        {placesVoulues} place{placesVoulues > 1 ? 's' : ''} ×{' '}
                        {trajetSelectionne.prix_par_place_fcfa.toLocaleString()} FCFA
                      </Text>
                      <Text style={styles.recapValeur}>
                        {montantPreview.sousTotal.toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.recapLigne}>
                      <Text style={styles.recapLabel}>Commission TRAVIGO (10%)</Text>
                      <Text style={styles.recapValeur}>
                        {montantPreview.commission.toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={[styles.recapLigne, styles.recapTotal]}>
                      <Text style={styles.recapTotalLabel}>Total</Text>
                      <Text style={styles.recapTotalValeur}>
                        {montantPreview.total.toLocaleString()} FCFA
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalBoutons}>
                  <TouchableOpacity style={styles.btnAnnuler} onPress={fermerReservation}>
                    <Text style={styles.btnAnnulerTexte}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnConfirmer, reservation && styles.btnConfirmerDisabled]}
                    onPress={confirmerReservation}
                    disabled={reservation}
                  >
                    {reservation ? (
                      <ActivityIndicator color={COLORS.blanc} size="small" />
                    ) : (
                      <Text style={styles.btnConfirmerTexte}>Réserver</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CarteTrajet({
  trajet,
  onReserver,
}: {
  trajet: TrajetCovoiturage;
  onReserver: () => void;
}) {
  const placesRestantes = trajet.places_disponibles;
  const complet = placesRestantes === 0;

  return (
    <View style={styles.carte}>
      <View style={styles.carteHaut}>
        <View style={styles.carteItineraire}>
          <Text style={styles.carteVille}>{trajet.ville_depart}</Text>
          <Text style={styles.carteArrow}>→</Text>
          <Text style={styles.carteVille}>{trajet.ville_arrivee}</Text>
        </View>
        <View style={[styles.carteBadgePlaces, complet && styles.carteBadgePlacesComplet]}>
          <Text style={[styles.carteBadgePlacesTexte, complet && styles.carteBadgePlacesTexteComplet]}>
            {complet ? 'Complet' : `${placesRestantes} place${placesRestantes > 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <View style={styles.carteMeta}>
        <Text style={styles.carteMetaTexte}>
          📅 {formatDateFr(trajet.date_depart)}
        </Text>
        <Text style={styles.carteMetaTexte}>🕐 {trajet.heure_depart}</Text>
        <Text style={styles.carteMetaTexte}>
          💺 {trajet.places_totales} places total
        </Text>
      </View>

      <View style={styles.carteBas}>
        <View>
          <Text style={styles.cartePrix}>
            {trajet.prix_par_place_fcfa.toLocaleString()} FCFA
          </Text>
          <Text style={styles.cartePrixSous}>par place</Text>
        </View>
        <TouchableOpacity
          style={[styles.btnReserver, complet && styles.btnReserverDisabled]}
          onPress={onReserver}
          disabled={complet}
        >
          <Text style={styles.btnReserverTexte}>
            {complet ? 'Complet' : 'Réserver'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ivoire },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  retour: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  retourTexte: { fontSize: 20, color: COLORS.graphite, lineHeight: 22 },
  headerTitre: { fontSize: 20, fontWeight: '800', color: COLORS.graphite },
  headerSous: { fontSize: 12, color: COLORS.taupe, marginTop: 1 },
  badgeDev: { marginLeft: 'auto' },
  badgeDevTexte: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.terracotta,
    backgroundColor: COLORS.terracotta + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  filtres: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  inputFiltre: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.graphite,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  boutonRecherche: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonRechercheTexte: { fontSize: 20 },
  populairesRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  chipPopulaire: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.blanc,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  chipPoplaireActif: {
    backgroundColor: COLORS.terracotta,
    borderColor: COLORS.terracotta,
  },
  chipPopulaireTexte: { fontSize: 13, fontWeight: '600', color: COLORS.graphite },
  chipPopulaireTexteActif: { color: COLORS.blanc },
  liste: { paddingHorizontal: 20, paddingBottom: 30, gap: 14 },
  vide: { alignItems: 'center', marginTop: 60, gap: 8 },
  videIcone: { fontSize: 48 },
  videTexte: { fontSize: 18, fontWeight: '700', color: COLORS.graphite },
  videSous: { fontSize: 14, color: COLORS.taupe, textAlign: 'center' },
  carte: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  carteHaut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carteItineraire: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  carteVille: { fontSize: 17, fontWeight: '800', color: COLORS.graphite },
  carteArrow: { fontSize: 16, color: COLORS.terracotta, fontWeight: '700' },
  carteBadgePlaces: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  carteBadgePlacesComplet: { backgroundColor: '#FFEBEE' },
  carteBadgePlacesTexte: { fontSize: 12, fontWeight: '700', color: '#388E3C' },
  carteBadgePlacesTexteComplet: { color: COLORS.rouge },
  carteMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  carteMetaTexte: { fontSize: 13, color: COLORS.taupe },
  carteBas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartePrix: { fontSize: 20, fontWeight: '800', color: COLORS.terracotta },
  cartePrixSous: { fontSize: 11, color: COLORS.taupe },
  btnReserver: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  btnReserverDisabled: { backgroundColor: COLORS.taupe },
  btnReserverTexte: { fontSize: 14, fontWeight: '700', color: COLORS.blanc },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenu: {
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    gap: 14,
  },
  modalTitre: { fontSize: 20, fontWeight: '800', color: COLORS.graphite },
  modalTrajet: { fontSize: 18, fontWeight: '700', color: COLORS.terracotta },
  modalSous: { fontSize: 14, color: COLORS.taupe },
  placesSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.ivoire,
    borderRadius: 12,
    padding: 14,
  },
  placesSelectorLabel: { fontSize: 15, fontWeight: '600', color: COLORS.graphite },
  placesControle: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  placesBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  placesBtnTexte: { fontSize: 20, color: COLORS.graphite, lineHeight: 22 },
  placesValeur: { fontSize: 22, fontWeight: '800', color: COLORS.graphite, minWidth: 28, textAlign: 'center' },
  recapMontant: {
    backgroundColor: COLORS.ivoire,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  recapLigne: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontSize: 13, color: COLORS.taupe },
  recapValeur: { fontSize: 13, fontWeight: '600', color: COLORS.graphite },
  recapTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
    paddingTop: 8,
    marginTop: 4,
  },
  recapTotalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.graphite },
  recapTotalValeur: { fontSize: 17, fontWeight: '800', color: COLORS.terracotta },
  modalBoutons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnAnnuler: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.ivoire,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  btnAnnulerTexte: { fontSize: 15, fontWeight: '700', color: COLORS.graphite },
  btnConfirmer: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
  },
  btnConfirmerDisabled: { opacity: 0.6 },
  btnConfirmerTexte: { fontSize: 15, fontWeight: '700', color: COLORS.blanc },
});
