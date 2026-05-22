import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";

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


export class IncidentsRepository {
    static async crear(incident: object) {
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
            }));
        } catch (err) {
            throw new Error("Error al obtener los incidentes: " + err);
        }
    }


    static async obtenerParaMapa(municipalityId: string) {
        try {
            const db = mongoDb();

            const visibleStatuses = ["open", "assigned", "resolved", "in_review"];

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


    static async actualizarEstado(incidentId: ObjectId, status: string) {
        try {
            const db = mongoDb();

            const updateData: any = {
                status,
                updatedAt: new Date()
            };

            if (status === "resolved") {
                updateData.resolvedAt = new Date();
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


    static async obtenerPorId(incidentId: ObjectId) {
        try {
            const db = mongoDb();

            return await db.collection("incidents").findOne({
                _id: incidentId
            });
        } catch (err) {
            throw new Error("Error al obtener el incidente: " + err);
        }
    }


    // igna y agus, este método es para obtener el detalle completo del incidente, 
    // con toda la info relacionada (usuario creador, operador asignado, categoría, municipio)
    // pasa que sino devuelve tal cual lo q esta en mongo, obvio esta hecho con el chat
    static async obtenerDetallePorId(incidentId: ObjectId, role: string) {
        try {
            const db = mongoDb();

            const incident: any = await db.collection("incidents").findOne({
                _id: incidentId
            });

            if (!incident) {
                return null;
            }

            const createdById = incident.createdBy ? new ObjectId(incident.createdBy.toString()) : null;
            const assignedToId = incident.assignedTo ? new ObjectId(incident.assignedTo.toString()) : null;
            const municipalityId = incident.municipalityId ? new ObjectId(incident.municipalityId.toString()) : null;
            const categoryId = incident.categoryId ? new ObjectId(incident.categoryId.toString()) : null;

            const createdBy = createdById
                ? await db.collection("users").findOne({ _id: createdById })
                : null;

            const assignedTo = assignedToId
                ? await db.collection("users").findOne({ _id: assignedToId })
                : null;

            const municipality = municipalityId
                ? await db.collection("municipalities").findOne({ _id: municipalityId })
                : null;

            const category = categoryId
                ? await db.collection("categories").findOne({ _id: categoryId })
                : null;

            const response: any = {
                id: incident._id.toString(),
                title: incident.title,
                description: incident.description,
                category: {
                    id: incident.categoryId?.toString(),
                    name: category?.name || incident.category?.name || ""
                },
                status: incident.status,
                priority: incident.priority,
                location: incident.location,
                municipality: {
                    id: incident.municipalityId?.toString(),
                    name: municipality?.name || ""
                },
                createdBy: {
                    id: incident.createdBy?.toString(),
                    name: createdBy?.name || ""
                },
                createdAt: incident.createdAt,
                assignedAt: incident.assignedAt,
                startedAt: incident.startedAt,
                resolvedAt: incident.resolvedAt,
                closedAt: incident.closedAt,
                updatedAt: incident.updatedAt
            };

            if (role !== "citizen") {
                response.assignedTo = assignedTo
                    ? {
                        id: assignedTo._id.toString(),
                        name: assignedTo.name,
                        photoUrl: assignedTo.photoUrl
                    }
                    : null;
            }

            return response;
        } catch (err) {
            throw new Error("Error al obtener el detalle del incidente: " + err);
        }
    }
}