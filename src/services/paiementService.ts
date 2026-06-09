export type ModePaiement = 'especes' | 'orange_money' | 'mtn_money' | 'wave';

export interface ResultatPaiement {
  transactionId: string;
  statut: 'succes' | 'en_attente' | 'echec';
  messageErreur?: string;
}

// Clés CinetPay — à renseigner pour la production
const CINETPAY_API_KEY = '';
const CINETPAY_SITE_ID = '';
const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

function genererTransactionId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRV-${Date.now()}-${rand}`;
}

/**
 * Initie un paiement.
 * DEV : simulation 2 s → succès.
 * PROD espèces : succès immédiat (paiement physique).
 * PROD mobile money : appel CinetPay (nécessite apikey + site_id configurés).
 */
export async function initierPaiement(
  courseId: string,
  montant: number,
  mode: ModePaiement,
  telephone?: string
): Promise<ResultatPaiement> {
  const transactionId = genererTransactionId();

  if (__DEV__) {
    await new Promise((r) => setTimeout(r, 2000));
    return { transactionId, statut: 'succes' };
  }

  if (mode === 'especes') {
    return { transactionId, statut: 'succes' };
  }

  // Mobile Money via CinetPay
  try {
    const response = await fetch(CINETPAY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
        amount: montant,
        currency: 'XOF',
        description: `Course TRAVIGO-AK #${courseId.slice(0, 8)}`,
        customer_phone_number: telephone ?? '',
        channels: 'MOBILE_MONEY',
        lang: 'FR',
        metadata: JSON.stringify({ courseId }),
      }),
    });
    const data = await response.json();
    // Code 201 = transaction créée, en attente de confirmation du client
    if (data.code === '201') {
      return { transactionId, statut: 'en_attente' };
    }
    return { transactionId, statut: 'echec', messageErreur: data.message ?? 'Échec CinetPay' };
  } catch {
    return { transactionId, statut: 'echec', messageErreur: 'Erreur réseau — réessayez.' };
  }
}

/**
 * Vérifie le statut d'une transaction CinetPay.
 * DEV : toujours succès.
 */
export async function verifierPaiement(
  transactionId: string
): Promise<'succes' | 'en_attente' | 'echec'> {
  if (__DEV__) return 'succes';

  try {
    const url =
      `https://api-checkout.cinetpay.com/v2/payment/check` +
      `?apikey=${CINETPAY_API_KEY}&site_id=${CINETPAY_SITE_ID}&transaction_id=${transactionId}`;
    const response = await fetch(url);
    const data = await response.json();
    const statut = data.data?.status ?? '';
    if (statut === 'ACCEPTED') return 'succes';
    if (statut === 'REFUSED') return 'echec';
    return 'en_attente';
  } catch {
    return 'en_attente';
  }
}
