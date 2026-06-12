export interface CategoryListResponse {
    id: string;
    name: string;
}

export interface CategoryDetailResponse {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}