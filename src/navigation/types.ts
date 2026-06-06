export type ChauffeurInfo = {
  nom: string;
  plaque: string;
  vehicule: string;
  telephone: string;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  OTP: { phoneNumber: string };
  Profile: { phoneNumber: string };
  Home: { nom: string };
  Commande: { nom: string };
  Recherche: { nom: string; destination: string };
  Course: { nom: string; chauffeur: ChauffeurInfo };
};
