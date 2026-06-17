import { ObjectId } from "mongodb";
import { IncidentsRepository } from "../repositorys/incident.repository";
import { AuthService } from "./auth.services";
import { UserRepository } from "../repositorys/user.repository";
import { CloudinaryRepository } from "../repositorys/cloudinary.repository";
import { DistrictRepository } from "../repositorys/district.repository";
import { ImageService } from "./image.service";
import { ImageTypes } from "../data/types/image.types";
import { AiService } from "./ia.service";
import { IncidentReportRepository } from "../repositorys/incident-report.repository";
import { USER_ROLES } from "../data/types/global/const.global";
import { IncidentPriority, IncidentFilters, ValidatedCreateIncidentInput, GetIncidentFeedInput } from "../data/types/incident/incidents.type";
import { VALID_STATUSES, VALID_PRIORITIES, VALID_ASSIGNED_STATUSES } from "../data/types/incident/incidents.const";
import { PendingIncidentRepository } from "../repositorys/pending-incident.repository";
import { PendingIncident } from "../data/pending-incident.model";

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
        const {
            authenticatedUser,
            title,
            description,
            location,
            lng,
            lat,
            image: validatedImage,
        } = await this.validateCreateIncidentInput(body, clerkUserId, image);

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

        const aiResult = await AiService.validateIncident({
            title,
            description,
            mimeType: validatedImage.mimetype,
            imageBase64: validatedImage.buffer.toString("base64"),
            nearbyIncidents,
        });

        if (aiResult.nextAction === "reject") {
            return {
                status: "rejected",
                message: "El incidente fue rechazado por la IA",
                data: {
                    rejectionReason: aiResult.rejectionReason,
                    reasons: aiResult.reasons,
                },
            };
        }

        if (aiResult.nextAction === "ask_user_duplicate_confirmation") {
            if (!aiResult.duplicateOfIncidentId) {
                throw new Error(
                    "La IA detectó un duplicado pero no devolvió el ID del incidente"
                );
            }

            const pendingIncidentId = new ObjectId();

            const processedImage = await ImageService.processImage(validatedImage);

            const publicId = ImageTypes.buildPendingIncidentImageName(
                pendingIncidentId.toString()
            );

            const uploadedImage =
                await CloudinaryRepository.uploadProcessedImage(
                    processedImage,
                    publicId
                );

            const now = new Date();

            const pendingIncident: PendingIncident = {
                _id: pendingIncidentId,

                title: aiResult.normalizedTitle,
                description: aiResult.normalizedDescription,

                originalTitle: title,
                originalDescription: description,

                categoryId: new ObjectId(aiResult.categoryId),

                location,

                image: {
                    url: uploadedImage.secure_url,
                    publicId: uploadedImage.public_id,
                },

                municipalityId: new ObjectId(municipality),

                aiValidation: this.buildAiValidation(aiResult),

                duplicateCandidate: {
                    incidentId: new ObjectId(aiResult.duplicateOfIncidentId),
                    confidence: aiResult.duplicateConfidence,
                    reason: aiResult.duplicateReason,
                },

                createdBy: new ObjectId(authenticatedUser.id),

                createdAt: now,
                expiredAt: new Date(Date.now() + 1000 * 60 * 30),

                status: "waiting_duplicate_confirmation",
            };

            const createdPendingIncident =
                await PendingIncidentRepository.createPendingIncident(pendingIncident);

            return {
                status: "possible_duplicate",
                message: "El incidente podría ser un duplicado",
                data: {
                    pendingIncidentId: createdPendingIncident._id.toString(),
                    duplicateOfIncidentId: aiResult.duplicateOfIncidentId,
                    duplicateConfidence: aiResult.duplicateConfidence,
                    duplicateReason: aiResult.duplicateReason,
                },
            };
        }

        const incidentId = new ObjectId();

        const processedImage = await ImageService.processImage(validatedImage);

        const publicId = ImageTypes.buildIncidentImageName(
            incidentId.toString()
        );

        const uploadedImage =
            await CloudinaryRepository.uploadProcessedImage(
                processedImage,
                publicId
            );

        const newIncident = {
            _id: incidentId,

            title: aiResult.normalizedTitle,
            description: aiResult.normalizedDescription,

            originalTitle: title,
            originalDescription: description,

            categoryId: new ObjectId(aiResult.categoryId),

            status: "open",

            location,

            image: {
                url: uploadedImage.secure_url,
                publicId: uploadedImage.public_id,
            },

            municipalityId: new ObjectId(municipality),
            createdBy: new ObjectId(authenticatedUser.id),

            aiValidation: this.buildAiValidation(aiResult),

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

        if (authenticatedUser.role !== USER_ROLES.CITIZEN) {
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

        if (authenticatedUser.role !== USER_ROLES.OPERATOR) {
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

        if (![USER_ROLES.ADMIN, USER_ROLES.OPERATOR, USER_ROLES.SUPERADMIN].includes(authenticatedUser.role)) {
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

        if (authenticatedUser.role !== USER_ROLES.ADMIN) {
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

        if (operator.role !== USER_ROLES.OPERATOR) {
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

        if (authenticatedUser.role === USER_ROLES.ADMIN) {
            if (
                !incident.municipalityId ||
                incident.municipalityId.toString() !== authenticatedUser.municipalityId
            ) {
                throw new Error("No podés modificar incidentes de otro municipio");
            }
        }

        if (authenticatedUser.role === USER_ROLES.OPERATOR) {
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

        if (authenticatedUser.role === USER_ROLES.CITIZEN) {
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

        if (authenticatedUser.role !== USER_ROLES.ADMIN) {
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

        if (authenticatedUser.role !== USER_ROLES.OPERATOR) {
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

    private static buildAiValidation(aiResult: any) {
    return {
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
    };
    }

    private static async validateCreateIncidentInput(
        body: any,
        clerkUserId: string | null,
        image?: Express.Multer.File
    ): Promise<ValidatedCreateIncidentInput> {
        if (!clerkUserId) {
            throw new Error("Usuario no autenticado");
        }

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (!authenticatedUser || !authenticatedUser.id) {
            throw new Error("El usuario autenticado no existe en la base de datos");
        }

        if (authenticatedUser.role !== USER_ROLES.CITIZEN) {
            throw new Error("Solo los ciudadanos pueden crear incidentes");
        }

        if (!body.title || body.title.trim() === "") {
            throw new Error("El título es obligatorio");
        }

        const title = body.title.trim();
        const description = body.description?.trim() || "";

        let location: unknown;

        try {
            location =
                typeof body.location === "string"
                    ? JSON.parse(body.location)
                    : body.location;
        } catch {
            throw new Error("La ubicación tiene un formato inválido");
        }

        if (!location || typeof location !== "object") {
            throw new Error("La ubicación es obligatoria");
        }

        const parsedLocation = location as {
            type?: unknown;
            coordinates?: unknown;
        };

        if (parsedLocation.type !== "Point") {
            throw new Error("La ubicación debe ser de tipo Point");
        }

        if (!Array.isArray(parsedLocation.coordinates)) {
            throw new Error("Las coordenadas son obligatorias");
        }

        if (parsedLocation.coordinates.length !== 2) {
            throw new Error("Las coordenadas deben tener longitud y latitud");
        }

        const [lng, lat] = parsedLocation.coordinates;

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

        return {
            authenticatedUser: {
                id: authenticatedUser.id,
                role: authenticatedUser.role,
            },
            title,
            description,
            location: {
                type: "Point",
                coordinates: [lng, lat],
            },
            lng,
            lat,
            image,
        };
    }

    static async resolvePendingIncidentDuplicate(
        pendingIncidentId: string,
        clerkUserId: string | null,
        action: "confirm_duplicate" | "create_new"
    ) {
        console.log("1 - entra service");
        console.log("pendingIncidentId:", pendingIncidentId);
        console.log("clerkUserId:", clerkUserId);
        console.log("action:", action);

        if (!clerkUserId) {
            console.log("2 - falla clerkUserId");
            throw new Error("Usuario no autenticado");
        }

        if (!["confirm_duplicate", "create_new"].includes(action)) {
            console.log("3 - falla action:", action);
            throw new Error("Acción inválida");
        }

        console.log("4 - antes AuthService");

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        console.log("5 - authenticatedUser:", authenticatedUser);

        const authenticatedUserId = authenticatedUser?.id;

        if (!authenticatedUserId) {
            console.log("6 - falla authenticatedUserId");
            throw new Error("El usuario autenticado no existe en la base de datos");
        }

        console.log("7 - antes buscar pending");

        const pendingIncident = await PendingIncidentRepository.getPendingIncidentById(pendingIncidentId);

        console.log("8 - pendingIncident:", pendingIncident);

        if (!pendingIncident || !pendingIncident._id) {
            console.log("9 - no existe pending");
            throw new Error("El incidente pendiente no existe");
        }

        console.log("10 - createdBy pending:", pendingIncident.createdBy?.toString());
        console.log("11 - authenticatedUserId:", authenticatedUserId);

        if (pendingIncident.createdBy.toString() !== authenticatedUserId) {
            console.log("12 - falla permisos");
            throw new Error("No tenés permisos para resolver este incidente pendiente");
        }

        console.log("13 - expiredAt:", pendingIncident.expiredAt);
        console.log("14 - now:", new Date());

        if (pendingIncident.expiredAt < new Date()) {
            console.log("15 - pending expirado");

            await PendingIncidentRepository.deletePendingIncidentById(pendingIncident._id);

            throw new Error("El incidente pendiente expiró");
        }

        console.log("16 - antes switch action:", action);

        if (action === "confirm_duplicate") {
            console.log("17 - entra confirm_duplicate");
            console.log(
                "INCIDENTE ORIGINAL:",
                pendingIncident.aiValidation?.duplicateOfIncidentId
            );

            const duplicateIncidentId =
                pendingIncident.aiValidation?.duplicateOfIncidentId;

            if (!duplicateIncidentId) {
                console.log("18 - no hay duplicateIncidentId");
                throw new Error("El incidente pendiente no tiene un incidente duplicado asociado");
            }

            await IncidentReportRepository.createReport({
                incidentId: new ObjectId(duplicateIncidentId),
                createdBy: new ObjectId(authenticatedUserId),
                createdAt: new Date(),
            });

            await PendingIncidentRepository.deletePendingIncidentById(
                pendingIncident._id
            );

            return {
                status: "reported_existing_incident",
                message: "Se sumó tu reporte al incidente existente",
                data: {
                    incidentId: duplicateIncidentId.toString(),
                },
            };
        }

        if (action === "create_new") {
            console.log("19 - entra create_new");

            const now = new Date();

            const createdIncident = await IncidentsRepository.createIncident({
                title: pendingIncident.title,
                description: pendingIncident.description,

                originalTitle: pendingIncident.originalTitle,
                originalDescription: pendingIncident.originalDescription,

                categoryId: new ObjectId(pendingIncident.categoryId),

                status: "open",

                location: pendingIncident.location,

                image: pendingIncident.image
                    ? {
                        url: pendingIncident.image.url,
                        publicId: pendingIncident.image.publicId,
                    }
                    : null,

                municipalityId: new ObjectId(pendingIncident.municipalityId),

                createdBy: new ObjectId(authenticatedUserId),

                aiValidation: pendingIncident.aiValidation
                    ? {
                        confidence: pendingIncident.aiValidation.confidence,
                        aiUrgencyScore: pendingIncident.aiValidation.aiUrgencyScore,

                        imageMatchesText:
                            pendingIncident.aiValidation.imageMatchesText,
                        imageContainsIncident:
                            pendingIncident.aiValidation.imageContainsIncident,
                        possibleFakeOrIrrelevantImage:
                            pendingIncident.aiValidation.possibleFakeOrIrrelevantImage,

                        // Importante: el usuario confirmó que NO es duplicado
                        isPossibleDuplicate: false,
                        duplicateOfIncidentId: null,
                        duplicateConfidence: 0,
                        duplicateReason: null,

                        rejectionReason: pendingIncident.aiValidation.rejectionReason,
                        reasons: pendingIncident.aiValidation.reasons,
                    }
                    : undefined,

                createdAt: now,
                updatedAt: now,
            });

            await PendingIncidentRepository.deletePendingIncidentById(
                pendingIncident._id
            );

            return {
                status: "created_new_incident",
                message: "Se creó un nuevo incidente",
                data: {
                    incidentId:
                        createdIncident.id,
                },
            };
        }

        console.log("20 - action no manejada:", action);

        throw new Error("Acción no manejada");
    }

    static async getFeed(input: GetIncidentFeedInput) {

        if (Number.isNaN(input.lat) || Number.isNaN(input.lng)) {
            throw new Error("La ubicacion es obligatoria!");
        }

        const page = input.page && input.page > 0 ? input.page : 1;
        const limit = input.limit && input.limit > 0 ? input.limit : 10;

        const municipality = await DistrictRepository.findMunicipalityByPoint(input.lng, input.lat);


        if (!municipality) {
            throw new Error("No se encontró un municipio para la ubicación indicada");
        }

        return await IncidentsRepository.getFeedByMunicipality({
            municipalityId: municipality.toString(),
            page,
            limit
        });
    }
}