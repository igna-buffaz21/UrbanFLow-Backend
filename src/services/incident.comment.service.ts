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

    static async updateComment(id: string, requesterId: string, params: UpdateCommentParams) {
        if (!ObjectId.isValid(id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        if (Object.keys(params).length === 0) {
            throw buildError("Debe enviar al menos un campo para actualizar", 400);
        }

        if (params.comment !== undefined && params.comment.trim() === "") {
            throw buildError("El comentario no puede estar vacío", 400);
        }

        const existing = await IncidentCommentRepository.getCommentById(id);

        if (!existing) {
            throw buildError("Comentario no encontrado", 404);
        }

        if (existing.createdBy.toString() !== requesterId) {
            throw buildError("No tenés permiso para editar este comentario", 403);
        }

        const updateData: { comment?: string; photoUrl?: string } = {};
        if (params.comment) updateData.comment = params.comment.trim();
        if (params.photoUrl !== undefined) updateData.photoUrl = params.photoUrl;

        const updated = await IncidentCommentRepository.updateComment(id, updateData);

        if (!updated) {
            throw buildError("No se pudo actualizar el comentario", 500);
        }

        return updated;
    }

    static async updateCommentStatus(id: string, requesterId: string, status: string) {
        if (!ObjectId.isValid(id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        if (!status || !VALID_STATUSES.includes(status as IncidentCommentStatus)) {
            throw buildError("El status debe ser 'visible', 'hidden' o 'deleted'", 400);
        }

        const existing = await IncidentCommentRepository.getCommentById(id);

        if (!existing) {
            throw buildError("Comentario no encontrado", 404);
        }

        if (existing.createdBy.toString() !== requesterId) {
            throw buildError("No tenés permiso para modificar el estado de este comentario", 403);
        }

        const updated = await IncidentCommentRepository.updateCommentStatus(
            id,
            status as IncidentCommentStatus
        );

        if (!updated) {
            throw buildError("No se pudo actualizar el estado del comentario", 500);
        }

        return updated;
    }
}