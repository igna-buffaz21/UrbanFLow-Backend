import { ObjectId } from "mongodb";
import { IncidentComment, IncidentCommentStatus } from "../data/incident-comment.model";
import { mongoDb } from "../config/mongodb.config";

const COLLECTION_NAME = "incident_comments";

interface GetCommentsFilters {
    incidentId: string;
    status?: IncidentCommentStatus;
}

interface CommentResponse {
    id: string;
    comment: string;
    photoUrl?: string;
    status: IncidentCommentStatus;
    createdBy: {
        id: string;
        name: string;
        role: string;
        photoUrl?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export class IncidentCommentRepository {

    static async getCommentsByIncidentId(filters: GetCommentsFilters): Promise<CommentResponse[]> {
        try {
            const db = mongoDb();

            const matchStage: Record<string, unknown> = {
                incidentId: new ObjectId(filters.incidentId),
                status: filters.status ?? "visible",
            };

            const comments = await db
                .collection<IncidentComment>(COLLECTION_NAME)
                .aggregate([
                    { $match: matchStage },
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "userData",
                        },
                    },
                    { $unwind: "$userData" },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            comment: 1,
                            photoUrl: 1,
                            status: 1,
                            createdBy: {
                                id: { $toString: "$userData._id" },
                                name: "$userData.name",
                                role: "$userData.role",
                                photoUrl: "$userData.photoUrl",
                            },
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return comments as unknown as CommentResponse[];
        } catch (err) {
            throw new Error(`Error al obtener los comentarios: ${err}`);
        }
    }

    static async getCommentById(id: string): Promise<IncidentComment | null> {
        try {
            const db = mongoDb();
            const comment = await db
                .collection<IncidentComment>(COLLECTION_NAME)
                .findOne({ _id: new ObjectId(id) });

            return comment ?? null;
        } catch (err) {
            throw new Error(`Error al obtener el comentario: ${err}`);
        }
    }

    static async createComment(data: Omit<IncidentComment, "_id">): Promise<CommentResponse> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<IncidentComment>(COLLECTION_NAME)
                .insertOne(data as IncidentComment);

            const comments = await IncidentCommentRepository.getCommentsByIncidentId({
                incidentId: data.incidentId.toString(),
                status: "visible",
            });

            const created = comments.find((c) => {
                const inserted = result.insertedId.toString();
                return c.id === inserted;
            });

            if (!created) {
                throw new Error("No se pudo recuperar el comentario recién creado");
            }
            return created;
        } catch (err) {
            throw new Error(`Error al crear el comentario: ${err}`);
        }
    }

    static async updateComment(
        id: string,
        data: Partial<Pick<IncidentComment, "comment" | "photoUrl">>
    ): Promise<IncidentComment | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<IncidentComment>(COLLECTION_NAME)
                .findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { ...data, updatedAt: new Date() } },
                    { returnDocument: "after" }
                );

            return result ?? null;
        } catch (err) {
            throw new Error(`Error al actualizar el comentario: ${err}`);
        }
    }

    static async updateCommentStatus(
        id: string,
        status: IncidentCommentStatus
    ): Promise<IncidentComment | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<IncidentComment>(COLLECTION_NAME)
                .findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { status, updatedAt: new Date() } },
                    { returnDocument: "after" }
                );

            return result ?? null;
        } catch (err) {
            throw new Error(`Error al actualizar el estado del comentario: ${err}`);
        }
    }

}