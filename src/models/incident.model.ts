import { ObjectId } from "mongodb";

export type IncidentStatus =
    | "in_review"
    | "open"
    | "assigned"
    | "resolved"
    | "closed"
    | "rejected";

export type IncidentPriority = "low" | "medium" | "high" | "critical";

export interface Incident {
    _id?: ObjectId;

    title: string;
    description?: string;

    categoryId: ObjectId;

    status: IncidentStatus;
    priority: IncidentPriority;

    location: {
        type: "Point";
        coordinates: [number, number]; 
    };

    municipalityId: ObjectId;

    createdBy: ObjectId;
    assignedTo?: ObjectId;

    createdAt: Date;
    assignedAt?: Date;
    startedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;

    updatedAt: Date;
}