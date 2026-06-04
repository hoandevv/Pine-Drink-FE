export interface BranchHours {
  id: string;
  branchId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchHoursRequest {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
}
