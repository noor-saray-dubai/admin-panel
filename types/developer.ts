// types/developer.ts

export interface IDescriptionSection {
  title?: string;
  description: string;
}

export interface IAward {
  name: string;
  year: number;
}

export interface IDeveloper {
  _id?: string;
  name: string;
  slug?: string;
  logo: string;
  coverImage: string;
  description: IDescriptionSection[];
  overview: string;
  location: string;
  establishedYear: number;
  website: string;
  email: string;
  phone: string;
  specialization: string[];
  awards: IAward[];
  verified: boolean;
  isActive: boolean;
  featured: boolean;
  totalProjects?: number;
  completedProjects?: number;
  ongoingProjects?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDevelopers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FiltersData {
  locations: string[];
  specializations: string[];
  establishedYears: number[];
  statuses: string[];
}

export interface DeveloperTabsProps {
  initialModalOpen?: boolean;
  onModalClose?: () => void;
}

// Developer status types for tabs
export type DeveloperStatus = 'all' | 'verified' | 'active' | 'featured' | 'new';

// Specialization categories for tabs
export type SpecializationType = 
  | 'residential' 
  | 'commercial' 
  | 'industrial' 
  | 'mixed-use' 
  | 'luxury'
  | 'affordable';