export type TravelPreferences = {
  travelStyle: 'adventure' | 'culture' | 'relaxation' | 'nature' | 'food' | 'mixed';
  favoriteActivities: string[];
  budgetPreference: 'budget' | 'moderate' | 'premium' | 'flexible';
  dietaryPreferences: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  language: string;
  travelPreferences: TravelPreferences;
  createdAt: string;
};

export type EmergencyContact = {
  _id: string;
  name: string;
  phone: string;
  relationship: 'family' | 'friend' | 'partner' | 'colleague' | 'other';
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};
