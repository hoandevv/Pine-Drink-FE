import { BranchHours } from './branch-hours.model';

export interface Branch {
  id: string;
  code?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  averagePreparationMinutes?: number;
  hours?: BranchHours[];
  status: BranchStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
