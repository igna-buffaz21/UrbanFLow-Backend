import { IncidentCommentStatus } from "../../incident-comment.model";

export interface GetCommentsFilters {
    incidentId: string;
    status?: IncidentCommentStatus;
}

export interface CommentResponse {
    id: string;
    comment: string;
    photoUrl?: string;
    status: IncidentCommentStatus;
    createdBy: {
        id: string;
        name: string;
        role: string;
        photoUrl?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface MyIncidentCommentResponse {
  commentId: string;
  comment: string;
  photoUrl?: string;
  status: IncidentCommentStatus;
  commentedAt: Date;
  updatedAt: Date;
  incident: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: string;
    photoUrl?: string | null;
    createdAt: Date;
  };
}