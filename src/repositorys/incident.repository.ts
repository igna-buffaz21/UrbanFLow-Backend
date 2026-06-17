import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { NearbyIncidentForAi } from "../data/types/ia/ia.type";
import { IncidentDetailResponse, GetMapParams, IncidentFilters, FindNearbyForAiParams, GetIncidentFeedRepositoryParams } from "../data/types/incident/incidents.type";
import { COLLECTION_NAMES } from "../data/types/global/const.global";
import { INCIDENT_STATUS } from "../data/incident.model";

export type GeoJSONPoint = {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
};

export class IncidentsRepository {
    static async createIncident(incident: object) {
        try {
            const db = mongoDb();
            const result = await db.collection(COLLECTION_NAMES.INCIDENTS).insertOne(incident);

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
                .collection(COLLECTION_NAMES.INCIDENTS)
                .aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: "Point",
                                coordinates: [params.lng, params.lat],
                            },
                            distanceField: "distance",
                            maxDistance: params.radius,
                            spherical: true,
                            query: {
                                status: {
                                    $in: [
                                        INCIDENT_STATUS.OPEN,
                                        INCIDENT_STATUS.ASSIGNED,
                                        INCIDENT_STATUS.RESOLVED,
                                        INCIDENT_STATUS.IN_PROGRESS,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            title: 1,
                            status: 1,
                            priority: 1,
                            location: 1,
                            distance: 1,
                        },
                    },
                    {
                        $sort: {
                            distance: 1,
                        },
                    },
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

            const incidents = await db.collection(COLLECTION_NAMES.INCIDENTS)
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

            const incidents = await db.collection(COLLECTION_NAMES.INCIDENTS)
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

            const incidents = await db.collection(COLLECTION_NAMES.INCIDENTS)
                .aggregate([
                    {
                        $match: query
                    },
                    {
                        $lookup: {
                            from: COLLECTION_NAMES.USERS,
                            localField: "assignedTo",
                            foreignField: "_id",
                            as: "assignedOperator"
                        }
                    },
                    {
                        $unwind: {
                            path: "$assignedOperator",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            status: 1,
                            priority: 1,
                            createdAt: 1,
                            assignedAt: 1,
                            resolvedAt: 1,
                            closedAt: 1,
                            resolutionTime: 1,
                            location: 1,
                            assignedTo: {
                                id: "$assignedOperator._id",
                                name: "$assignedOperator.name",
                                photoUrl: "$assignedOperator.photoUrl"
                            }
                        }
                    }
                ])
                .toArray();

            console.log(
                incidents.map(i => ({
                    title: i.title,
                    priority: i.priority,
                }))
            );

            return incidents.map((incident: any) => ({
                id: incident._id.toString(),
                title: incident.title,
                status: incident.status,
                priority: incident.priority,
                createdAt: incident.createdAt,
                assignedAt: incident.assignedAt,
                resolvedAt: incident.resolvedAt,
                closedAt: incident.closedAt,
                resolutionTime: incident.resolutionTime,
                assignedTo: incident.assignedTo?.id
                    ? {
                        id: incident.assignedTo.id.toString(),
                        name: incident.assignedTo.name,
                        photoUrl: incident.assignedTo.photoUrl || null
                    }
                    : null,
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

            const incidents = await db.collection(COLLECTION_NAMES.INCIDENTS)
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

            console.log(
                incidents.map(i => ({
                    title: i.title,
                    priority: i.priority,
                    municipalityId: i.municipalityId?.toString(),
                }))
            );

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

            const result = await db.collection(COLLECTION_NAMES.INCIDENTS).findOneAndUpdate(
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

            const result = await db.collection(COLLECTION_NAMES.INCIDENTS).findOneAndUpdate(
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

            const result = await db.collection(COLLECTION_NAMES.INCIDENTS).findOneAndUpdate(
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

            const result = await db.collection(COLLECTION_NAMES.INCIDENTS).findOneAndUpdate(
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

            return await db.collection(COLLECTION_NAMES.INCIDENTS).findOne({
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

            const incident = await db.collection(COLLECTION_NAMES.INCIDENTS).findOne({
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
                    ? db.collection(COLLECTION_NAMES.USERS).findOne({ _id: createdById })
                    : Promise.resolve(null),

                categoryId
                    ? db.collection(COLLECTION_NAMES.CATEGORIES).findOne({ _id: categoryId })
                    : Promise.resolve(null),

                clerkUserId
                    ? db.collection(COLLECTION_NAMES.USERS).findOne({ clerkId: clerkUserId })
                    : Promise.resolve(null),

                assignedToId
                    ? db.collection(COLLECTION_NAMES.USERS).findOne({ _id: assignedToId })
                    : Promise.resolve(null),
            ]);

            const isOwner =
                Boolean(authenticatedUser && createdById) &&
                authenticatedUser!._id.toString() === createdById!.toString();

            const aiUrgencyScore = incident.aiValidation?.aiUrgencyScore ?? 1;

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

                aiUrgencyScore,

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
                .collection(COLLECTION_NAMES.INCIDENTS)
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
                                    $in: ["in_review", "open", "assigned", "in_progress", "resolved"],
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

    static async getFeedByMunicipality(params: GetIncidentFeedRepositoryParams) {
        try {
            const db = mongoDb();

            const skip = (params.page - 1) * params.limit;

            const result = await db
                .collection(COLLECTION_NAMES.INCIDENTS)
                .aggregate([
                    {
                        $match: {
                            municipalityId: new ObjectId(params.municipalityId),
                            status: {
                                $in: ["open", "in_review", "in_progress"]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: COLLECTION_NAMES.INCIDENT_REPORTS,
                            localField: "_id",
                            foreignField: "incidentId",
                            as: "reports"
                        }
                    },
                    {
                        $lookup: {
                            from: COLLECTION_NAMES.INCIDENT_COMMENTS,
                            localField: "_id",
                            foreignField: "incidentId",
                            as: "comments"
                        }
                    },
                    {
                        $lookup: {
                            from: COLLECTION_NAMES.CATEGORIES,
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $unwind: {
                            path: "$category",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: COLLECTION_NAMES.USERS,
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdByUser"
                        }
                    },
                    {
                        $unwind: {
                            path: "$createdByUser",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            reportsCount: {
                                $size: "$reports"
                            },
                            commentsCount: {
                                $size: "$comments"
                            },
                            aiUrgencyScore: {
                                $ifNull: ["$aiValidation.aiUrgencyScore", 0]
                            },
                            relevanceScore: {
                                $add: [
                                    {
                                        $multiply: [
                                            {
                                                $ifNull: ["$aiValidation.aiUrgencyScore", 0]
                                            },
                                            2
                                        ]
                                    },
                                    {
                                        $min: [
                                            {
                                                $size: "$reports"
                                            },
                                            10
                                        ]
                                    },
                                    {
                                        $multiply: [
                                            {
                                                $min: [
                                                    {
                                                        $size: "$comments"
                                                    },
                                                    20
                                                ]
                                            },
                                            0.5
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $sort: {
                            relevanceScore: -1,
                            createdAt: -1
                        }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: params.limit
                    },
                    {
                        $project: {
                            _id: 0,
                            id: {
                                $toString: "$_id"
                            },

                            title: 1,
                            description: 1,

                            photoUrl: "$image.url",

                            status: 1,

                            aiUrgencyScore: 1,
                            reportsCount: 1,
                            commentsCount: 1,
                            relevanceScore: 1,

                            createdAt: 1,

                            category: {
                                id: {
                                    $toString: "$category._id"
                                },
                                name: "$category.name"
                            },

                            createdBy: {
                                id: {
                                    $toString: "$createdByUser._id"
                                },
                                name: "$createdByUser.name",
                                photoUrl: "$createdByUser.photoUrl"
                            }
                        }
                    }
                ])
                .toArray();

            return result;
        } catch (err) {
            throw new Error(`Error al obtener el feed de incidentes por municipio: ${err}`);
        }
    }
}