export interface CategoryCreateRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export interface CategoryUpdateRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export interface CategoryStatusRequest {
  status: string;
}
