import { ObjectId } from "mongodb";

export type IncidentCommentStatus = "visible" | "hidden" | "deleted";

export interface IncidentComment {
    _id?: ObjectId;

    incidentId: ObjectId;

    photoUrl?: string;
    comment: string;

    status: IncidentCommentStatus;

    createdBy: ObjectId;

    createdAt: Date;
    updatedAt: Date;
}