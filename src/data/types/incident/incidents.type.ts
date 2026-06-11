export type IncidentPriority = "low" | "medium" | "high";

export interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

export interface GetMapParams {
    lng: number;
    lat: number;
    radius: number;
    municipalityId: string;
};

export type GeoJSONPoint = {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
};

export interface IncidentDetailResponse {
    id: string;

    title: string;
    description?: string;

    photoUrl: string | null;
    resolutionPhotoUrl: string | null;
    resolvedAt: Date | null;
    location: GeoJSONPoint | null;

    category: {
        id: string;
        name: string;
    } | null;
    priority: string;
    status: string;

    aiUrgencyScore: number;

    createdAt: Date;

    is_owner: boolean;

    createdBy: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;

    assignedTo: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;
};

export type FindNearbyForAiParams = {
    lng: number;
    lat: number;
    radius: number;
};
