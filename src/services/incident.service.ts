import { ObjectId } from "mongodb";
import { IncidentsRepository } from "../repositorys/incident.repository";
import { AuthService } from "./auth.services";
import { UserRepository } from "../repositorys/user.repository";
import { CloudinaryRepository } from "../repositorys/cloudinary.repository";
import { DistrictRepository } from "../repositorys/district.repository";
<<<<<<< HEAD
import { ImageService } from "./image.service";
import { ImageTypes } from "../data/types/image.types";
=======
import { AiService } from "./ia.service";
import { IncidentReportRepository } from "../repositorys/incident-report.repository";

>>>>>>> 363ce7e (refactor: se agrego la funcionalidad de la ia al modulo incidentes)
const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["in_review", "open", "assigned", "in_progress", "resolved", "closed", "rejected"];
const VALID_ASSIGNED_STATUSES = ["assigned", "in_progress", "resolved"];

interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

type IncidentPriority = "low" | "medium" | "high";

const USER_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    OPERATOR: "operator",
    CITIZEN: "citizen"
} as const;


function getReportBoost(reportsCount: number): number {
    if (reportsCount <= 1) return 0;
    if (reportsCount <= 4) return 1;
    return 2;
}

function calculatePriorityScore(params: {
    aiUrgencyScore: number;
    reportsCount: number;
}): number {
    return params.aiUrgencyScore + getReportBoost(params.reportsCount);
}

function getPriorityFromScore(priorityScore: number): IncidentPriority {
    if (priorityScore <= 2) return "low";
    if (priorityScore <= 4) return "medium";
    return "high";
}

export class IncidentsService {
    static async createIncident(
        body: any,
        clerkUserId: string | null,
        image?: Express.Multer.File
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!authenticatedUser || !authenticatedUser.id) {
            throw new Error("El usuario autenticado no existe en la base de datos");
        }

        if (authenticatedUser.role !== "citizen") {
            throw new Error("Solo los ciudadanos pueden crear incidentes");
        }

        if (!body.title || body.title.trim() === "") {
            throw new Error("El título es obligatorio");
        }

        const title = body.title.trim();
        const description = body.description?.trim() || "";

        let location;

        try {
            location =
                typeof body.location === "string"
                    ? JSON.parse(body.location)
                    : body.location;
        } catch {
            throw new Error("La ubicación tiene un formato inválido");
        }

        if (!location) {
            throw new Error("La ubicación es obligatoria");
        }

        if (location.type !== "Point") {
            throw new Error("La ubicación debe ser de tipo Point");
        }

        if (!Array.isArray(location.coordinates)) {
            throw new Error("Las coordenadas son obligatorias");
        }

        if (location.coordinates.length !== 2) {
            throw new Error("Las coordenadas deben tener longitud y latitud");
        }

        const [lng, lat] = location.coordinates;

        if (typeof lng !== "number" || typeof lat !== "number") {
            throw new Error("Las coordenadas deben ser numéricas");
        }

        if (lng < -180 || lng > 180) {
            throw new Error("La longitud es inválida");
        }

        if (lat < -90 || lat > 90) {
            throw new Error("La latitud es inválida");
        }

        if (!image) {
            throw new Error("La imagen es obligatoria para validar el incidente");
        }

        if (!image.mimetype) {
            throw new Error("La imagen no tiene un formato válido");
        }

        if (!image.buffer) {
            throw new Error("No se pudo procesar la imagen");
        }

        const municipality = await DistrictRepository.findMunicipalityByPoint(lng, lat);

        if (!municipality) {
            throw new Error("No hay ningún municipio asociado a esta ubicación");
        }

        const nearbyIncidents =
            await IncidentsRepository.findNearbyForAiDuplicateCheck({
                lng,
                lat,
                radius: 100,
            });

<<<<<<< HEAD
        const incidentId = new ObjectId();

        if (image) {
            const processedImage = await ImageService.processImage(image);
            const publicId = ImageTypes.buildIncidentImageName(incidentId.toString());
            const uploadedImage = await CloudinaryRepository.uploadProcessedImage(processedImage, publicId);
            imageData = {
                url: uploadedImage.secure_url,
                publicId: uploadedImage.public_id
=======
        const aiResult = await AiService.validateIncident({
            title,
            description,
            mimeType: image.mimetype,
            imageBase64: image.buffer.toString("base64"),
            nearbyIncidents,
        });

        if (aiResult.nextAction === "reject") {
            const uploadedImage = await CloudinaryRepository.uploadImage(image);

            /*const rejectedReport =
                await RejectedIncidentReportsRepository.createRejectedIncidentReport({
                    title,
                    description,

                    normalizedTitle: aiResult.normalizedTitle,
                    normalizedDescription: aiResult.normalizedDescription,

                    categoryId: new ObjectId(aiResult.categoryId),

                    location: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },

                    image: {
                        url: uploadedImage.secure_url,
                        publicId: uploadedImage.public_id,
                    },

                    municipalityId: new ObjectId(municipality),
                    createdBy: new ObjectId(authenticatedUser.id),

                    aiValidation: {
                        confidence: aiResult.confidence,
                        aiUrgencyScore: aiResult.aiUrgencyScore,

                        imageMatchesText: aiResult.imageMatchesText,
                        imageContainsIncident: aiResult.imageContainsIncident,
                        possibleFakeOrIrrelevantImage:
                            aiResult.possibleFakeOrIrrelevantImage,

                        rejectionReason:
                            aiResult.rejectionReason ?? "Reporte rechazado por la IA",
                        reasons: aiResult.reasons,
                    },

                    createdAt: new Date(),
                }); */

            return {
                status: "rejected",
                message: "El incidente fue rechazado por la IA",
                data: {
                    //rejectedReportId: rejectedReport._id,
                    rejectionReason: aiResult.rejectionReason,
                    reasons: aiResult.reasons,
                },
>>>>>>> 363ce7e (refactor: se agrego la funcionalidad de la ia al modulo incidentes)
            };
        }

        if (aiResult.nextAction === "ask_user_duplicate_confirmation") {
            return {
                status: "possible_duplicate",
                message: "El incidente podría ser un duplicado",
                data: {
                    duplicateOfIncidentId: aiResult.duplicateOfIncidentId,
                    duplicateConfidence: aiResult.duplicateConfidence,
                    duplicateReason: aiResult.duplicateReason,
                    aiResult,
                },
            };
        }

        const uploadedImage = await CloudinaryRepository.uploadImage(image);

        const newIncident = {
<<<<<<< HEAD
            _id: incidentId,
            title: body.title.trim(),
            description: body.description?.trim() || "",
            category: "Incident",
=======
            title: aiResult.normalizedTitle,
            description: aiResult.normalizedDescription,

            originalTitle: title,
            originalDescription: description,

            categoryId: new ObjectId(aiResult.categoryId),

>>>>>>> 363ce7e (refactor: se agrego la funcionalidad de la ia al modulo incidentes)
            status: "in_review",

            location: {
                type: "Point",
                coordinates: [lng, lat],
            },

            image: {
                url: uploadedImage.secure_url,
                publicId: uploadedImage.public_id,
            },

            municipalityId: new ObjectId(municipality),
            createdBy: new ObjectId(authenticatedUser.id),

            aiValidation: {
                confidence: aiResult.confidence,
                aiUrgencyScore: aiResult.aiUrgencyScore,

                imageMatchesText: aiResult.imageMatchesText,
                imageContainsIncident: aiResult.imageContainsIncident,
                possibleFakeOrIrrelevantImage: aiResult.possibleFakeOrIrrelevantImage,

                isPossibleDuplicate: aiResult.isPossibleDuplicate,
                duplicateOfIncidentId: aiResult.duplicateOfIncidentId
                    ? new ObjectId(aiResult.duplicateOfIncidentId)
                    : null,
                duplicateConfidence: aiResult.duplicateConfidence,
                duplicateReason: aiResult.duplicateReason,

                rejectionReason: aiResult.rejectionReason,
                reasons: aiResult.reasons,
            },

            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const incident = await IncidentsRepository.createIncident(newIncident);

        return {
            status: "created",
            message: "Incidente creado correctamente",
            data: incident,
        };
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


    static async getMap(clerkUserId: string | null, query: any) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!authenticatedUser || !authenticatedUser.id) {
            throw new Error("El usuario autenticado no existe en la base de datos");
        }

        const lng = Number(query.lng);
        const lat = Number(query.lat);

        if (Number.isNaN(lng) || Number.isNaN(lat)) {
            throw new Error("Las coordenadas son obligatorias");
        }

        if (lng < -180 || lng > 180) {
            throw new Error("La longitud es inválida");
        }

        if (lat < -90 || lat > 90) {
            throw new Error("La latitud es inválida");
        }

        const radius = query.radius ? Number(query.radius) : 3000;

        if (Number.isNaN(radius) || radius <= 0) {
            throw new Error("El radio es inválido");
        }

        const MAX_RADIUS = 10000;

        if (radius > MAX_RADIUS) {
            throw new Error(`El radio máximo permitido es de ${MAX_RADIUS} metros`);
        }

        const district = await DistrictRepository.findDistrictByPoint(lng, lat);

        if (!district) {
            throw new Error("No hay ningún municipio asociado a esta ubicación");
        }

        return await IncidentsRepository.getMap({
            lng,
            lat,
            radius,
            municipalityId: district.id
        });
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

        const incident = await IncidentsRepository.getIncidentById(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        const ASSIGNABLE_STATUSES = ["in_review", "open"];

        if (!ASSIGNABLE_STATUSES.includes(incident.status)) {
            throw new Error(
                "Solo se pueden asignar operadores a incidentes en revisión o abiertos"
            );
        }

        if (incident.assignedTo) {
            throw new Error(
                "Este incidente ya tiene un operador asignado"
            );
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
        status: string,
        image?: Express.Multer.File
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

        const incident = await IncidentsRepository.getIncidentById(new ObjectId(incidentId));

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

            if (!["assigned", "in_progress", "resolved"].includes(status)) {
                throw new Error("El operador solo puede usar los estados asignado, en progreso o resuelto");
            }

            if (status === "resolved") {
                if (incident.status !== "in_progress") {
                    const error = new Error("Para marcar como resuelto, primero el incidente debe estar en progreso");
                    (error as any).statusCode = 400;
                    throw error;
                }

                if (!image) {
                    throw new Error("Para resolver el incidente tenés que subir una foto");
                }
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

        let resolutionPhotoUrl: string | undefined;

        if (status === "resolved" && image) {
            const processedImage = await ImageService.processImage(image);
            const publicId = ImageTypes.buildResolutionImageName(incidentId);
            const uploadedImage = await CloudinaryRepository.uploadProcessedImage(processedImage, publicId);
            resolutionPhotoUrl = uploadedImage.secure_url;
        }

        return await IncidentsRepository.actualizarEstado(
            new ObjectId(incidentId),
            status,
            resolutionPhotoUrl
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

        const incident = await IncidentsRepository.getIncidentById(new ObjectId(incidentId));

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


    static async resolverIncidente(
        clerkUserId: string | null,
        incidentId: string,
        body: any
    ) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (authenticatedUser.role !== "operator") {
            throw new Error("Solo los operadores pueden resolver incidentes");
        }

        if (!authenticatedUser.id || !ObjectId.isValid(authenticatedUser.id)) {
            throw new Error("Usuario inválido");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        if (!body.resolutionPhotoUrl || typeof body.resolutionPhotoUrl !== "string") {
            throw new Error("La foto de resolución es obligatoria");
        }

        const incident = await IncidentsRepository.getIncidentById(new ObjectId(incidentId));

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        if (!incident.assignedTo || incident.assignedTo.toString() !== authenticatedUser.id) {
            throw new Error("Solo podés resolver incidentes asignados a vos");
        }

        if (incident.status !== "assigned") {
            throw new Error("Solo se pueden resolver incidentes asignados");
        }

        return await IncidentsRepository.resolverIncidente(
            new ObjectId(incidentId),
            new ObjectId(authenticatedUser.id),
            body.resolutionPhotoUrl.trim(),
        );
    }


    static async getDetailById(clerkUserId: string | null, incidentId: string) {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        if (!incidentId || !ObjectId.isValid(incidentId)) {
            throw new Error("El incidente es inválido");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!authenticatedUser) {
            throw new Error("Usuario no encontrado");
        }

        if (
            authenticatedUser.role !== USER_ROLES.CITIZEN &&
            authenticatedUser.role !== USER_ROLES.ADMIN &&
            authenticatedUser.role !== USER_ROLES.OPERATOR
        ) {
            throw new Error("Solo los ciudadanos y administradores pueden ver el detalle de un incidente");
        }

        const incidentObjectId = new ObjectId(incidentId);

        const incident = await IncidentsRepository.getDetailById(
            incidentObjectId,
            clerkUserId
        );

        if (!incident) {
            throw new Error("El incidente no existe");
        }

        const reportsCount = await IncidentReportRepository.countReportsByIncidentId(
            incidentId
        );

        const aiUrgencyScore = incident.aiUrgencyScore ?? 1;

        const priorityScore = calculatePriorityScore({
            aiUrgencyScore,
            reportsCount,
        });

        const priority = getPriorityFromScore(priorityScore);

        return {
            ...incident,
            reportsCount,
            aiUrgencyScore,
            priorityScore,
            priority,
        };
    }
}