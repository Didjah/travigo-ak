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
  Commande: { nom: string };
  Recherche: { nom: string; destination: string };
  Course: { nom: string; chauffeur: ChauffeurInfo };

  // Écrans chauffeur
  LoginChauffeur: undefined;
  OTPChauffeur: { phoneNumber: string };
  DashboardChauffeur: undefined;
  CourseEntrante: {
    passagerPrenom: string;
    depart: string;
    destination: string;
    prixEstime: string;
  };
  NavigationChauffeur: {
    passagerPrenom: string;
    depart: string;
    destination: string;
    prixEstime: string;
  };
  CourseEnCours: {
    passagerPrenom: string;
    destination: string;
    prixEstime: string;
  };
};
