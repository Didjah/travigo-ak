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
  Recherche: { nom: string; destination: string; courseId?: string };
  Course: { nom: string; chauffeur: ChauffeurInfo; courseId?: string };

  // Écrans chauffeur
  LoginChauffeur: undefined;
  OTPChauffeur: { phoneNumber: string };
  DashboardChauffeur: undefined;
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
};
