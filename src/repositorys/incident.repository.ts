import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";

interface IncidentFilters {
    status?: string;
    priority?: string;
    categoryId?: string;
    assignedTo?: string;
}

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
}