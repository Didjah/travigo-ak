export type ChauffeurInfo = {
  nom: string;
  plaque: string;
  vehicule: string;
  telephone: string;
};

export type RootStackParamList = {
  // Écrans partagés
  Splash: undefined;
  Onboarding: undefined;
  OTP: { phoneNumber: string };
  Profile: { phoneNumber: string };

  // Écrans passager
  Home: { nom: string };
  Historique: { nom: string };
  TransportScolaire: { nom: string };
  Livraison: { nom: string };
  Commande: { nom: string };
  Recherche: { nom: string; destination: string; courseId?: string };
  Course: { nom: string; chauffeur: ChauffeurInfo; courseId?: string; montant?: number };

  // Écrans chauffeur
  LoginChauffeur: undefined;
  OTPChauffeur: { phoneNumber: string };
  DashboardChauffeur: undefined;
  HistoriqueChauffeur: undefined;
  Abonnement: undefined;
  PaiementAbonnement: { type: 'taxi' | 'tricycle' | 'premium' };
  CourseScolaire: undefined;
  LivraisonChauffeur: undefined;
  CourseEntrante: {
    passagerPrenom: string;
    depart: string;
    destination: string;
    prixEstime: string;
    courseId?: string;
  };
  NavigationChauffeur: {
    passagerPrenom: string;
    depart: string;
    destination: string;
    prixEstime: string;
    courseId?: string;
  };
  CourseEnCours: {
    passagerPrenom: string;
    destination: string;
    prixEstime: string;
    courseId?: string;
  };

  // Paiement & post-course
  Paiement: { nom: string; montant: number; courseId?: string };
  SuccesPaiement: {
    nom: string;
    montant: number;
    modePaiement: string;
    courseId?: string;
  };
  Notation: { nom: string; courseId?: string };
};
