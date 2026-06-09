/**
 * Store en mémoire pour la session utilisateur.
 * Évite de rappeler Supabase à chaque écran.
 */

export interface SessionUser {
  id: string;
  prenom: string;
  telephone: string;
  role: 'passager' | 'chauffeur';
}

let _user: SessionUser | null = null;

export function setSessionUser(user: SessionUser): void {
  _user = user;
}

export function getSessionUser(): SessionUser | null {
  return _user;
}

export function clearSession(): void {
  _user = null;
}
