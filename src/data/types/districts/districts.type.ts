import { District } from "../../district.model";

export interface DistrictListResponse {
    id: string;
    name: string;
}

export interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"];
    createdAt: Date;
    updatedAt: Date;
}

export interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"];
    createdAt: Date;
    updatedAt: Date;
}
