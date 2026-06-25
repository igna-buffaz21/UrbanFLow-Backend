import { UserRole } from "../../user.model";

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
    publicCode: string;

    title: string;
    description?: string;

    photoUrl: string | null;
    resolutionPhotoUrl: string | null;
    resolvedAt: Date | null;
    assignedAt: Date | null;
    startedAt: Date | null;
    closedAt: Date | null;
    location: GeoJSONPoint | null;
    rejectedAt: Date | null;

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

    closedBy?: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;

    rejectedBy?: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;
    rejectionReason?: string | null;
};

export type FindNearbyForAiParams = {
    lng: number;
    lat: number;
    radius: number;
};

export type ValidatedCreateIncidentInput = {
    authenticatedUser: {
        id: string;
        role: UserRole;
    };
    title: string;
    description: string;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    lng: number;
    lat: number;
    image: Express.Multer.File;
};

export interface GetIncidentFeedInput {
    lat: number;
    lng: number;
    page?: number;
    limit?: number;
};

export interface GetIncidentFeedRepositoryParams {
    municipalityId: string;
    page: number;
    limit: number;
};

export interface FrequencyByCategoryResult {
    categoryId: string;
    categoryName: string;
    categoryLabel: string;
    total: number;
    open: number;
    assigned: number;
    resolved: number;
    closed: number;
};

export interface ResolutionByCategoryResult {
    categoryId: string;
    categoryName: string;
    categoryLabel: string;
    total: number;
    closed: number;
    closureRate: number;
    avgResolutionHours: number | null;
};

export interface ResolutionOverallResult {
    totalIncidents: number;
    closedIncidents: number;
    resolvedIncidents: number;
    criticalIncidents: number;
    closureRate: number;
    avgResolutionHours: number | null;
};

export interface ResolutionMetricsResult {
    overall: ResolutionOverallResult;
    byCategory: ResolutionByCategoryResult[];
};

export interface GeographicStatItem {
    subDistrictId: string;
    subDistrictName: string;
    total: number;
    open: number;
    assigned: number;
    resolved: number;
    closed: number;
    high: number;
    medium: number;
    low: number;
}

export interface GeographicStatsResult {
    withSubDistrict: GeographicStatItem[];
    withoutSubDistrict: number;
}

export interface TemporalStatItem {
    period: string;
    total: number;
    open: number;
    resolved: number;
    closed: number;
}

export type TemporalGroupBy = "day" | "week" | "month";

export interface OperatorStatItem {
    operatorId: string;
    operatorName: string;
    total: number;
    resolved: number;
    closed: number;
    avgResolutionHours: number | null;
}

export interface PriorityStatItem {
    priority: string;
    total: number;
}

export interface ExtendedStatsResult {
    temporal: TemporalStatItem[];
    byOperator: OperatorStatItem[];
    byPriority: PriorityStatItem[];
    groupBy: TemporalGroupBy;
}