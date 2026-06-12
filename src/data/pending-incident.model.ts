import { ObjectId } from "mongodb";

export type PendingIncidentStatus =
    | "waiting_duplicate_confirmation"
    | "expired";

export interface PendingIncident {
    _id?: ObjectId;

    title: string;
    description: string;

    originalTitle: string;
    originalDescription: string;

    categoryId: ObjectId;

    location: {
        type: "Point";
        coordinates: [number, number];
    };

    image: {
        url: string;
        publicId: string;
    };

    municipalityId: ObjectId;

    aiValidation: {
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
    };

    duplicateCandidate: {
        incidentId: ObjectId;
        confidence: number;
        reason: string | null;
    };

    createdBy: ObjectId;

    createdAt: Date;
    expiredAt: Date;

    status: PendingIncidentStatus;
}