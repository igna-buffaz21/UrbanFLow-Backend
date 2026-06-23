import { ObjectId } from "mongodb";

export type IncidentStatus =
    | "in_review"
    | "open"
    | "assigned"
    | "resolved"
    | "closed"
    | "rejected";

export const INCIDENT_STATUS = {
    IN_REVIEW: "in_review",
    OPEN: "open",
    ASSIGNED: "assigned",
    IN_PROGRESS: "in_progress",
    RESOLVED: "resolved",
    CLOSED: "closed",
    REJECTED: "rejected",
    CANCELED: "canceled",
} as const;

export type IncidentPriority = "low" | "medium" | "high";

export interface IncidentImage {
    url: string;
    publicId: string;
}

export interface IncidentAiValidation {
    confidence: number;
    aiUrgencyScore: number;

    imageMatchesText: boolean;
    imageContainsIncident: boolean;
    possibleFakeOrIrrelevantImage: boolean;

    isPossibleDuplicate: boolean;
    duplicateOfIncidentId: ObjectId | null;
    duplicateConfidence: number;
    duplicateReason: string | null;

    rejectionReason: string | null;
    reasons: string[];
}

export interface Incident {
    _id?: ObjectId;

    publicCode: string;

    title: string;
    description?: string;

    originalTitle?: string;
    originalDescription?: string;

    categoryId: ObjectId;

    status: IncidentStatus;

    priority: IncidentPriority;

    location: {
        type: "Point";
        coordinates: [number, number];
    };

    image?: IncidentImage | null;

    municipalityId: ObjectId;
    subDistrictId?: ObjectId | null;
    
    createdBy: ObjectId;
    assignedTo?: ObjectId;

    aiValidation?: IncidentAiValidation;

    createdAt: Date;
    assignedAt?: Date;
    startedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    closedBy?: ObjectId;

    updatedAt: Date;
}