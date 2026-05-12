import { ObjectId } from "mongodb";
import { IncidentsRepository } from "../repositorys/incident.repository";

const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["in_review", "assigned", "resolved", "rejected"];

interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

export class IncidentsService {
    static async crear(body: any, citizenId: string) {
        if (!citizenId) {
            throw new Error("No se pudo obtener el usuario ciudadano");
        }

        if (!body.title || body.title.trim() === "") {
            throw new Error("El título es obligatorio");
        }

        if (!body.categoryId || !ObjectId.isValid(body.categoryId)) {
            throw new Error("La categoría es obligatoria o inválida");
        }

        if (!body.municipalityId || !ObjectId.isValid(body.municipalityId)) {
            throw new Error("El municipio es obligatorio o inválido");
        }

        if (!body.location || !Array.isArray(body.location.coordinates)) {
            throw new Error("La ubicación es obligatoria");
        }

        if (body.location.coordinates.length !== 2) {
            throw new Error("Las coordenadas deben tener latitud y longitud");
        }

        if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
            throw new Error("La prioridad es inválida");
        }

        const newIncident = {
            title: body.title.trim(),
            description: body.description || "",
            categoryId: new ObjectId(body.categoryId),
            status: "in_review",
            priority: body.priority || "medium",
            location: body.location,
            municipalityId: new ObjectId(body.municipalityId),
            createdBy: citizenId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return await IncidentsRepository.crear(newIncident);
    }

    static async obtenerTodos(filters: IncidentFilters, municipalityId: string) {
        if (!municipalityId || !ObjectId.isValid(municipalityId)) {
            throw new Error("El administrador debe tener un municipio válido asociado");
        }

        if (filters.status && !VALID_STATUSES.includes(filters.status)) {
            throw new Error("El estado es inválido");
        }

        if (filters.priority && !VALID_PRIORITIES.includes(filters.priority)) {
            throw new Error("La prioridad es inválida");
        }

        if (filters.categoryId && !ObjectId.isValid(filters.categoryId)) {
            throw new Error("La categoría es inválida");
        }

        if (filters.assignedTo && !ObjectId.isValid(filters.assignedTo)) {
            throw new Error("El usuario asignado es inválido");
        }

        return await IncidentsRepository.obtenerTodos(filters, municipalityId);
    }

    static async obtenerParaMapa(municipalityId: string) {
        if (!municipalityId || !ObjectId.isValid(municipalityId)) {
            throw new Error("El municipio es obligatorio o inválido");
        }

        return await IncidentsRepository.obtenerParaMapa(municipalityId);
    }
}