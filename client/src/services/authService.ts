import { apiRequest, refreshSession, setAccessToken } from './apiClient';
import type { EmergencyContact, User } from '../types/user';

export type Credentials = { email: string; password: string };
export type Registration = Credentials & { name: string; confirmPassword: string };
export type AuthResult = { user: User; accessToken: string };

async function authenticate(
  path: '/auth/login' | '/auth/register',
  body: Credentials | Registration,
) {
  const result = await apiRequest<AuthResult>(path, { method: 'POST', body: JSON.stringify(body) });
  setAccessToken(result.accessToken);
  return result.user;
}

export const authService = {
  login: (input: Credentials) => authenticate('/auth/login', input),
  register: (input: Registration) => authenticate('/auth/register', input),
  restoreSession: refreshSession,
  async logout() {
    try {
      await apiRequest<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },
  getProfile: () => apiRequest<{ user: User }>('/users/me').then((result) => result.user),
  updateProfile: (input: Record<string, unknown>) =>
    apiRequest<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(input) }).then(
      (result) => result.user,
    ),
  getEmergencyContacts: () =>
    apiRequest<{ contacts: EmergencyContact[] }>('/users/me/emergency-contacts').then(
      (result) => result.contacts,
    ),
  createEmergencyContact: (input: Omit<EmergencyContact, '_id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<{ contact: EmergencyContact }>('/users/me/emergency-contacts', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((result) => result.contact),
  updateEmergencyContact: (
    id: string,
    input: Partial<Omit<EmergencyContact, '_id' | 'createdAt' | 'updatedAt'>>,
  ) =>
    apiRequest<{ contact: EmergencyContact }>(`/users/me/emergency-contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }).then((result) => result.contact),
  deleteEmergencyContact: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/users/me/emergency-contacts/${id}`, { method: 'DELETE' }),
};
