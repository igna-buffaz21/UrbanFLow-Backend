import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { NearbyIncidentForAi } from "../data/types/ia/ia.type";

interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

interface GetMapParams {
    lng: number;
    lat: number;
    radius: number;
    municipalityId: string;
};


type UserRole = "superadmin" | "admin" | "operator" | "citizen";

export type GeoJSONPoint = {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
};

export type IncidentDetailResponse = {
    id: string;
    title: string;
    description: string;
    photoUrl: string | null;
    resolutionPhotoUrl: string | null;
    resolvedAt: Date | null;
    location: GeoJSONPoint | null;
    category: {
        id: string;
        name: string;
    } | null;
    priority: string;
    status: string;
    createdAt: Date;
    createdBy: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;
    assignedTo: {
        id: string;
        name: string;
        photoUrl: string | null;
    } | null;
    is_owner: boolean;
};

type FindNearbyForAiParams = {
    lng: number;
    lat: number;
    radius: number;
};


export class IncidentsRepository {
    static async createIncident(incident: object) {
        try {
            const db = mongoDb();
            const result = await db.collection("incidents").insertOne(incident);

            return {
                id: result.insertedId.toString(),
                ...incident
            };
        } catch (err) {
            throw new Error("Error al crear el incidente: " + err);
        }
    }

    static async getMap(params: GetMapParams) {
        try {
            const db = mongoDb();

            const result = await db
                .collection("incidents")
                .aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [params.lng, params.lat]
                            },
                            distanceField: "distance",
                            maxDistance: params.radius,
                            spherical: true,
                            /*query: {
                                municipalityId: new ObjectId(params.municipalityId)
                            }*/
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            title: 1,
                            status: 1,
                            priority: 1,
                            location: 1,
                            distance: 1
                        }
                    },
                    {
                        $sort: {
                            distance: 1
                        }
                    }
                ])
                .toArray();

            return result;
        } catch (err) {
            throw new Error(`Error al obtener incidentes para el mapa: ${err}`);
        }
    }

    static async obtenerMisIncidentes(citizenId: string, status?: string) {
        try {
            const db = mongoDb();

            const query: any = {
                $or: [
                    { createdBy: citizenId },
                    { createdBy: new ObjectId(citizenId) }
                ]
            };

            if (status) query.status = status;

            const incidents = await db.collection("incidents")
                .find(query)
                .project({
                    title: 1,
                    status: 1,
                    priority: 1,
                    createdAt: 1
                })
                .toArray();

            return incidents.map((incident: any) => ({
                id: incident._id.toString(),
                title: incident.title,
                status: incident.status,
                priority: incident.priority,
                createdAt: incident.createdAt
            }));
        } catch (err) {
            throw new Error("Error al obtener mis incidentes: " + err);
        }
    }

    static async obtenerAsignados(
        operatorId: string,
        filters: {
            status?: string;
            priority?: string;
        }
    ) {
        try {
            const db = mongoDb();

            const query: any = {
                $or: [
                    { assignedTo: operatorId },
                    { assignedTo: new ObjectId(operatorId) }
                ]
            };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.priority) {
                query.priority = filters.priority;
            }

            const incidents = await db.collection("incidents")
                .find(query)
                .project({
                    title: 1,
                    status: 1,
                    priority: 1,
                    assignedAt: 1
                })
                .toArray();

            return incidents.map((incident: any) => ({
                id: incident._id.toString(),
                title: incident.title,
                status: incident.status,
                priority: incident.priority,
                assignedAt: incident.assignedAt
            }));
        } catch (err) {
            throw new Error("Error al obtener los incidentes asignados: " + err);
        }
    }

    static async obtenerTodos(filters: IncidentFilters, municipalityId: string) {
        try {
            const db = mongoDb();

            const query: any = {
                municipalityId: new ObjectId(municipalityId),
            };

            if (filters.status) query.status = filters.status;
            if (filters.priority) query.priority = filters.priority;
            if (filters.categoryId) query.categoryId = new ObjectId(filters.categoryId);
            if (filters.assignedTo) query.assignedTo = new ObjectId(filters.assignedTo);

            const incidents = await db.collection("incidents")
                .find(query)
                .project({
                    title: 1,
                    status: 1,
                    priority: 1,
                    assignedTo: 1,
                    createdAt: 1,
                    assignedAt: 1,
                    resolvedAt: 1,
                    resolutionTime: 1,
                    location: 1,
                })
                .toArray();

            return incidents.map((incident: any) => ({
                id: incident._id.toString(),
                title: incident.title,
                status: incident.status,
                priority: incident.priority,
                assignedTo: incident.assignedTo,
                createdAt: incident.createdAt,
                assignedAt: incident.assignedAt,
                resolvedAt: incident.resolvedAt,
                resolutionTime: incident.resolutionTime,
                location: incident.location ?? null,
            }));
        } catch (err) {
            throw new Error("Error al obtener los incidentes: " + err);
        }
    }

    static async obtenerParaMapa(municipalityId: string) {
        try {
            const db = mongoDb();

            const visibleStatuses = ["open", "assigned", "in_progress", "resolved", "in_review"];

            const incidents = await db.collection("incidents")
                .find({
                    municipalityId: new ObjectId(municipalityId),
                    status: { $in: visibleStatuses },
                    location: {
                        $exists: true
                    }
                })
                .project({
                    title: 1,
                    status: 1,
                    priority: 1,
                    categoryId: 1,
                    category: 1,
                    location: 1
                })
                .toArray();

            return {
                type: "FeatureCollection",
                features: incidents.map((incident: any) => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: incident.location.coordinates
                    },
                    properties: {
                        id: incident._id.toString(),
                        title: incident.title,
                        status: incident.status,
                        priority: incident.priority,
                        category: {
                            id: incident.categoryId?.toString(),
                            name: incident.category?.name || ""
                        }
                    }
                }))
            };
        } catch (err) {
            throw new Error("Error al obtener los incidentes para el mapa: " + err);
        }
    }

    static async asignarOperador(incidentId: ObjectId, operatorId: ObjectId) {
        try {
            const db = mongoDb();

            const result = await db.collection("incidents").findOneAndUpdate(
                { _id: incidentId },
                {
                    $set: {
                        assignedTo: operatorId,
                        status: "assigned",
                        assignedAt: new Date(),
                        updatedAt: new Date()
                    }
                },
                { returnDocument: "after" }
            );

            if (!result) {
                throw new Error("No se pudo asignar el operador");
            }

            return {
                id: result._id.toString(),
                title: result.title,
                status: result.status,
                priority: result.priority,
                assignedTo: result.assignedTo?.toString(),
                assignedAt: result.assignedAt
            };
        } catch (err) {
            throw new Error("Error al asignar el operador: " + err);
        }
    }

    static async actualizarEstado(incidentId: ObjectId, status: string, resolutionPhotoUrl?: string) {
        try {
            const db = mongoDb();

            const updateData: any = {
                status,
                updatedAt: new Date()
            };

            if (status === "in_progress") {
                updateData.startedAt = new Date();
            }

            if (status === "resolved") {
                updateData.resolvedAt = new Date();

                if (resolutionPhotoUrl) {
                    updateData.resolutionPhotoUrl = resolutionPhotoUrl;
                }
            }

            if (status === "closed") {
                updateData.closedAt = new Date();
            }

            if (status === "assigned") {
                updateData.assignedAt = new Date();
            }

            const result = await db.collection("incidents").findOneAndUpdate(
                { _id: incidentId },
                {
                    $set: updateData
                },
                { returnDocument: "after" }
            );

            if (!result) {
                throw new Error("No se pudo actualizar el estado del incidente");
            }

            return {
                id: result._id.toString(),
                title: result.title,
                status: result.status,
                priority: result.priority,
                assignedAt: result.assignedAt,
                resolvedAt: result.resolvedAt,
                closedAt: result.closedAt,
                updatedAt: result.updatedAt
            };
        } catch (err) {
            throw new Error("Error al actualizar el estado del incidente: " + err);
        }
    }

    static async actualizarPrioridad(
        incidentId: ObjectId,
        priority: string
    ) {
        try {
            const db = mongoDb();

            const result = await db.collection("incidents").findOneAndUpdate(
                { _id: incidentId },
                {
                    $set: {
                        priority,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: "after" }
            );

            if (!result) {
                throw new Error("No se pudo actualizar la prioridad");
            }

            return {
                id: result._id.toString(),
                title: result.title,
                status: result.status,
                priority: result.priority,
                updatedAt: result.updatedAt
            };
        } catch (err) {
            throw new Error("Error al actualizar la prioridad: " + err);
        }
    }

    static async resolverIncidente(
        incidentId: ObjectId,
        operatorId: ObjectId,
        resolutionPhotoUrl: string,
    ) {
        try {
            const db = mongoDb();

            const resolvedAt = new Date();

            const result = await db.collection("incidents").findOneAndUpdate(
                {
                    _id: incidentId,
                    assignedTo: operatorId
                },
                {
                    $set: {
                        status: "resolved",
                        resolutionPhotoUrl,
                        resolvedBy: operatorId,
                        resolvedAt,
                        updatedAt: resolvedAt
                    }
                },
                { returnDocument: "after" }
            );

            if (!result) {
                throw new Error("No se pudo resolver el incidente");
            }

            return {
                id: result._id.toString(),
                title: result.title,
                status: result.status,
                resolutionPhotoUrl: result.resolutionPhotoUrl,
                resolvedBy: result.resolvedBy?.toString(),
                resolvedAt: result.resolvedAt
            };
        } catch (err) {
            throw new Error("Error al resolver el incidente: " + err);
        }
    }

    static async getIncidentById(incidentId: ObjectId) {
        try {
            const db = mongoDb();

            return await db.collection("incidents").findOne({
                _id: incidentId
            });
        } catch (err) {
            throw new Error("Error al obtener el incidente: " + err);
        }
    }

    static async getDetailById(
        incidentId: ObjectId,
        clerkUserId: string | null
    ): Promise<IncidentDetailResponse | null> {
        try {
            const db = mongoDb();

            const incident = await db.collection("incidents").findOne({
                _id: incidentId,
            });

            if (!incident) {
                return null;
            }

            const createdById = incident.createdBy
                ? new ObjectId(incident.createdBy.toString())
                : null;

            const categoryId = incident.categoryId
                ? new ObjectId(incident.categoryId.toString())
                : null;

            const assignedToId = incident.assignedTo
                ? new ObjectId(incident.assignedTo.toString())
                : null;

            const [createdBy, category, authenticatedUser, assignedTo] = await Promise.all([
                createdById
                    ? db.collection("users").findOne({ _id: createdById })
                    : Promise.resolve(null),

                categoryId
                    ? db.collection("categories").findOne({ _id: categoryId })
                    : Promise.resolve(null),

                clerkUserId
                    ? db.collection("users").findOne({ clerkId: clerkUserId })
                    : Promise.resolve(null),

                assignedToId
                    ? db.collection("users").findOne({ _id: assignedToId })
                    : Promise.resolve(null),
            ]);

            const isOwner =
                Boolean(authenticatedUser && createdById) &&
                authenticatedUser!._id.toString() === createdById!.toString();

            return {
                id: incident._id.toString(),
                title: incident.title,
                description: incident.description,
                photoUrl: incident.image?.url || null,
                resolutionPhotoUrl: incident.resolutionPhotoUrl || null,
                resolvedAt: incident.resolvedAt || null,
                location: incident.location
                    ? {
                        type: "Point",
                        coordinates: incident.location.coordinates,
                    }
                    : null,
                category: category
                    ? {
                        id: category._id.toString(),
                        name: category.name,
                    }
                    : null,
                priority: incident.priority,
                status: incident.status,
                createdAt: incident.createdAt,
                is_owner: isOwner,
                createdBy: createdBy
                    ? {
                        id: createdBy._id.toString(),
                        name: createdBy.name,
                        photoUrl: createdBy.photoUrl || null,
                    }
                    : null,
                assignedTo: assignedTo
                    ? {
                        id: assignedTo._id.toString(),
                        name: assignedTo.name,
                        photoUrl: assignedTo.photoUrl || null,
                    }
                    : null,
            };
        } catch (err) {
            throw new Error("Error al obtener el detalle del incidente: " + err);
        }
    }

    static async findNearbyForAiDuplicateCheck(params: FindNearbyForAiParams) {
        try {
            const db = mongoDb();

            const result = await db
                .collection("incidents")
                .aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [params.lng, params.lat],
                            },
                            distanceField: "distanceMeters",
                            maxDistance: params.radius,
                            spherical: true,
                            query: {
                                //municipalityId: new ObjectId(params.municipalityId),
                                status: {
                                    $in: ["in_review", "open", "assigned", "in_progress"],
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            title: 1,
                            description: 1,
                            categoryName: 1,
                            status: 1,
                            createdAt: 1,
                            distanceMeters: {
                                $round: ["$distanceMeters", 0],
                            },
                        },
                    },
                    {
                        $sort: {
                            distanceMeters: 1,
                        },
                    },
                    {
                        $limit: 10,
                    },
                ])
                .toArray();

            return result as NearbyIncidentForAi[];
        } catch (err) {
            throw new Error(`Error al obtener incidentes cercanos para IA: ${err}`);
        }
    }
}