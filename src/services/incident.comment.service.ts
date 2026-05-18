import { ObjectId } from "mongodb";
import { IncidentCommentStatus } from "../data/incident-comment.model";
import { IncidentCommentRepository } from "../repositorys/incident.comment.repository";

const VALID_STATUSES: IncidentCommentStatus[] = ["visible", "hidden", "deleted"];

interface GetCommentsParams {
    incidentId: string;
    status?: string;
}

interface CreateCommentParams {
    incidentId: string;
    createdBy: string;
    comment: string;
    photoUrl?: string;
}

interface UpdateCommentParams {
    comment?: string;
    photoUrl?: string;
}

function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

export class IncidentCommentService {

    static async getCommentsByIncidentId(params: GetCommentsParams) {
        if (!ObjectId.isValid(params.incidentId)) {
            throw buildError("El incidentId no es un ObjectId válido", 400);
        }

        if (params.status && !VALID_STATUSES.includes(params.status as IncidentCommentStatus)) {
            throw buildError("El status debe ser 'visible', 'hidden' o 'deleted'", 400);
        }

        return await IncidentCommentRepository.getCommentsByIncidentId({
            incidentId: params.incidentId,
            status: params.status as IncidentCommentStatus | undefined,
        });
    }

    static async createComment(params: CreateCommentParams) {
        if (!ObjectId.isValid(params.incidentId)) {
            throw buildError("El incidentId no es un ObjectId válido", 400);
        }

        if (!params.createdBy || !ObjectId.isValid(params.createdBy)) {
            throw buildError("El createdBy es requerido y debe ser un ObjectId válido", 400);
        }

        if (!params.comment || params.comment.trim() === "") {
            throw buildError("El comentario es requerido", 400);
        }

        const now = new Date();

        return await IncidentCommentRepository.createComment({
            incidentId: new ObjectId(params.incidentId),
            createdBy: new ObjectId(params.createdBy),
            comment: params.comment.trim(),
            photoUrl: params.photoUrl,
            status: "visible",
            createdAt: now,
            updatedAt: now,
        });
    }
}