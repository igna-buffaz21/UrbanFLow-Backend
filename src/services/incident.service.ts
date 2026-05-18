import { ObjectId } from "mongodb";
import { IncidentsRepository } from "../repositorys/incident.repository";
import { AuthService } from "./auth.services";
import { UserRepository } from "../repositorys/user.repository";

const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["in_review", "open", "assigned", "resolved", "closed", "rejected"];
const VALID_ASSIGNED_STATUSES = ["assigned", "resolved"];

interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

export class IncidentsService {
    static async crear(body: any, clerkUserId: string | null) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "citizen") {
            throw new Error("Solo los ciudadanos pueden crear incidentes");
        }

        if (!authenticatedUser.id) {
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
            createdBy: new ObjectId(authenticatedUser.id),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        return await IncidentsRepository.crear(newIncident);
    }


    static async obtenerMisIncidentes(clerkUserId: string | null, status?: string) {

        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "citizen") {
            throw new Error("Solo los ciudadanos pueden consultar sus incidentes");
        }

        if (!authenticatedUser.id || !ObjectId.isValid(authenticatedUser.id)) {
            throw new Error("Usuario inválido");
        }

        if (status && !VALID_STATUSES.includes(status)) {
            throw new Error("El estado es inválido");
        }

        return await IncidentsRepository.obtenerMisIncidentes(authenticatedUser.id, status);

    }


    static async obtenerAsignados(
        clerkUserId: string | null,
        filters: {
            status?: string;
            priority?: string;
        }
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "operator") {
            throw new Error("Solo los operadores pueden consultar incidentes asignados");
        }

        if (!authenticatedUser.id) {
            throw new Error("Usuario inválido");
        }

        if (
            filters.status &&
            !VALID_ASSIGNED_STATUSES.includes(filters.status)
        ) {
            throw new Error("El estado es inválido");
        }

        if (
            filters.priority &&
            !VALID_PRIORITIES.includes(filters.priority)
        ) {
            throw new Error("La prioridad es inválida");
        }

        return await IncidentsRepository.obtenerAsignados(
            authenticatedUser.id,
            filters
        );
    }


    static async obtenerTodos(filters: IncidentFilters, clerkUserId: string | null) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!["admin", "operator", "superadmin"].includes(authenticatedUser.role)) {
            throw new Error("No tenés permisos para obtener incidentes");
        }

        if (!authenticatedUser.municipalityId || !ObjectId.isValid(authenticatedUser.municipalityId)) {
            throw new Error("El usuario debe tener un municipio válido asociado");
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

        return await IncidentsRepository.obtenerTodos(filters, authenticatedUser.municipalityId);
    }


    static async obtenerParaMapa(clerkUserId: string | null) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!authenticatedUser.municipalityId || !ObjectId.isValid(authenticatedUser.municipalityId)) {
            throw new Error("El usuario debe tener un municipio válido asociado");
        }

        return await IncidentsRepository.obtenerParaMapa(authenticatedUser.municipalityId);
    }


    static async asignarOperador(
        clerkUserId: string | null,
        incidentId: string,
        operatorId: string
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "admin") {
            throw new Error("Solo los administradores pueden asignar operadores");
        }

        if (!authenticatedUser.municipalityId || !ObjectId.isValid(authenticatedUser.municipalityId)) {
            throw new Error("El administrador debe tener un municipio válido asociado");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        if (!operatorId || !ObjectId.isValid(operatorId)) {
            throw new Error("El operador es inválido");
        }

        const operator = await UserRepository.getUserById(new ObjectId(operatorId));

        if (!operator) {
            throw new Error("El operador no existe");
        }

        if (operator.role !== "operator") {
            throw new Error("El usuario seleccionado no es operador");
        }

        if (operator.status !== "active") {
            throw new Error("El operador no está activo");
        }

        if (!operator.municipalityId) {
            throw new Error("El operador no tiene municipio asignado");
        }

        if (operator.municipalityId.toString() !== authenticatedUser.municipalityId) {
            throw new Error("El operador no pertenece al mismo municipio");
        }

        const incident = await IncidentsRepository.obtenerPorId(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        if (!incident.municipalityId) {
            throw new Error("El incidente no tiene municipio asignado");
        }

        if (incident.municipalityId.toString() !== authenticatedUser.municipalityId) {
            throw new Error("No podés asignar incidentes de otro municipio");
        }

        return await IncidentsRepository.asignarOperador(
            new ObjectId(incidentId),
            new ObjectId(operatorId)
        );
    }


    static async actualizarEstado(
        clerkUserId: string | null,
        incidentId: string,
        status: string
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        if (!status || !VALID_STATUSES.includes(status)) {
            throw new Error("El estado es inválido");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!["admin", "operator", "citizen"].includes(authenticatedUser.role)) {
            throw new Error("No tenés permisos para actualizar el estado");
        }

        const incident = await IncidentsRepository.obtenerPorId(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        if (authenticatedUser.role === "admin") {
            if (
                !incident.municipalityId ||
                incident.municipalityId.toString() !== authenticatedUser.municipalityId
            ) {
                throw new Error("No podés modificar incidentes de otro municipio");
            }
        }

        if (authenticatedUser.role === "operator") {
            if (
                !incident.assignedTo ||
                incident.assignedTo.toString() !== authenticatedUser.id
            ) {
                throw new Error("Solo podés modificar incidentes asignados a vos");
            }
        }

        if (authenticatedUser.role === "citizen") {
            const isOwner = incident.createdBy?.toString() === authenticatedUser.id;

            if (!isOwner) {
                throw new Error("Solo podés cancelar tus propios incidentes");
            }

            if (status !== "rejected") {
                throw new Error("El ciudadano solo puede cancelar sus incidentes");
            }
        }

        return await IncidentsRepository.actualizarEstado(
            new ObjectId(incidentId),
            status
        );
    }


    static async actualizarPrioridad(
        clerkUserId: string | null,
        incidentId: string,
        priority: string
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        if (!priority || !VALID_PRIORITIES.includes(priority)) {
            throw new Error("La prioridad es inválida");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "admin") {
            throw new Error("Solo los administradores pueden cambiar prioridades");
        }

        if (!authenticatedUser.municipalityId) {
            throw new Error("El administrador no tiene municipio asignado");
        }

        const incident = await IncidentsRepository.obtenerPorId(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        if (
            !incident.municipalityId ||
            incident.municipalityId.toString() !== authenticatedUser.municipalityId
        ) {
            throw new Error("No podés modificar incidentes de otro municipio");
        }

        return await IncidentsRepository.actualizarPrioridad(
            new ObjectId(incidentId),
            priority
        );
    }


    static async obtenerPorId(clerkUserId: string | null, incidentId: string) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        const incident = await IncidentsRepository.obtenerPorId(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        if (authenticatedUser.role === "admin") {
            if (
                !incident.municipalityId ||
                incident.municipalityId.toString() !== authenticatedUser.municipalityId
            ) {
                throw new Error("No podés ver incidentes de otro municipio");
            }
        }

        if (authenticatedUser.role === "operator") {
            if (
                !incident.assignedTo ||
                incident.assignedTo.toString() !== authenticatedUser.id
            ) {
                throw new Error("Solo podés ver incidentes asignados a vos");
            }
        }

        if (authenticatedUser.role === "citizen") {
            const publicStatuses = ["open", "assigned", "resolved", "closed"];

            const isOwner = incident.createdBy?.toString() === authenticatedUser.id;
            const isPublic = publicStatuses.includes(incident.status);

            if (!isOwner && !isPublic) {
                throw new Error("No tenés permisos para ver este incidente");
            }
        }

        return await IncidentsRepository.obtenerDetallePorId(
            new ObjectId(incidentId),
            authenticatedUser.role
        );
    }
}