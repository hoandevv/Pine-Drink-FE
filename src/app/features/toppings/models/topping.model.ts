export type ToppingStatus = 'ACTIVE' | 'INACTIVE';

export interface Topping {
  id: string;
  code?: string;
  name: string;
  price: number;
  imageUrl?: string;
  groupName?: string;
  status: ToppingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToppingCreateRequest {
  name: string;
  price: number;
  imageUrl?: string;
  groupName?: string;
}

export interface ToppingUpdateRequest {
  name?: string;
  price?: number;
  imageUrl?: string;
  groupName?: string;
}

export interface ToppingStatusRequest {
  status: ToppingStatus;
}
