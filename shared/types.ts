/**
 * shared/types.ts
 * Shared interfaces between Frontend, Backend, and Chrome Extension.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  totalCarbonSaved: number;
  totalRupeesSaved: number;
  ecoScore: number;
  currentStreak: number;
  avatarUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  category: 'Browser' | 'Hardware' | 'Lifestyle';
  actionName: string;
  carbonImpact: number;
  costImpact: number;
  timestamp: string;
}

export interface Suggestion {
  id: string;
  userId: string;
  suggestionText: string;
  potentialSavingsKg: number;
  potentialSavingsInr: number;
  category: 'Browser' | 'Hardware' | 'Lifestyle';
  status: 'pending' | 'completed' | 'ignored';
}

export interface CarbonImpactResponse {
  carbonImpact: number;
  costImpact: number;
  breakdown?: any;
}
