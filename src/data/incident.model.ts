import { ObjectId } from "mongodb";

export type IncidentStatus =
    | "in_review"
    | "open"
    | "assigned"
    | "resolved"
    | "closed"
    | "rejected";

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

    title: string;
    description?: string;

    originalTitle?: string;
    originalDescription?: string;

    categoryId: ObjectId;

    status: IncidentStatus;

    location: {
        type: "Point";
        coordinates: [number, number];
    };

    image?: IncidentImage | null;

    municipalityId: ObjectId;

    createdBy: ObjectId;
    assignedTo?: ObjectId;

    aiValidation?: IncidentAiValidation;

    createdAt: Date;
    assignedAt?: Date;
    startedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;

    updatedAt: Date;
}