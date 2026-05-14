import { ObjectId } from "mongodb";
import { Municipality, MunicipalityStatus } from "../data/municipality.model";
import { mongoDb } from "../config/mongodb.config";

const COLLECTION_NAME = "municipalities";

interface GetMunicipalitiesFilters {
    status?: MunicipalityStatus;
    districtId?: string;
}

interface MunicipalityResponse {
    id: string;
    name: string;
    district: {
        id: string;
        name: string;
    };
    status: MunicipalityStatus;
    createdAt: Date;
    updatedAt: Date;
}

export class MunicipalityRepository {

    static async getMunicipalities(
        filters: GetMunicipalitiesFilters
    ): Promise<MunicipalityResponse[]> {
        try {
            const db = mongoDb();

            const matchStage: Record<string, unknown> = {};

            if (filters.status) {
                matchStage.status = filters.status;
            }
            if (filters.districtId) {
                matchStage.districtId = new ObjectId(filters.districtId);
            }

            const municipalities = await db
                .collection<Municipality>(COLLECTION_NAME)
                .aggregate([
                    { $match: matchStage },
                    {
                        $lookup: {
                            from: "districts",
                            localField: "districtId",
                            foreignField: "_id",
                            as: "districtData",
                        },
                    },

                    { $unwind: "$districtData" },

                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            district: {
                                id: { $toString: "$districtData._id" },
                                name: "$districtData.name",
                            },
                            status: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return municipalities as unknown as MunicipalityResponse[];
        } catch (err) {
            throw new Error(`Error al obtener las municipalidades: ${err}`);
        }
    }

    static async getMunicipalityById(id: string): Promise<MunicipalityResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Municipality>(COLLECTION_NAME)
                .aggregate([
                    { $match: { _id: new ObjectId(id) } },
                    {
                        $lookup: {
                            from: "districts",
                            localField: "districtId",
                            foreignField: "_id",
                            as: "districtData",
                        },
                    },
                    { $unwind: "$districtData" },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            district: {
                                id: { $toString: "$districtData._id" },
                                name: "$districtData.name",
                            },
                            status: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return (result[0] as unknown as MunicipalityResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al obtener la municipalidad: ${err}`);
        }
    }

    static async getMunicipalityByName(name: string) {
        try {
            const db = mongoDb();
            const municipality = await db
                .collection("municipalities")
                .findOne({ name: name });

            return municipality;
        } catch (err) {
            throw new Error(`Error al buscar la municipalidad por nombre: ${err}`);
        }
    }

    static async createMunicipality(
        data: Omit<Municipality, "_id">
    ): Promise<MunicipalityResponse> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Municipality>(COLLECTION_NAME)
                .insertOne(data as Municipality);

            const created = await MunicipalityRepository.getMunicipalityById(
                result.insertedId.toString()
            );

            if (!created) {
                throw new Error("No se pudo recuperar la municipalidad recién creada");
            }

            return created;
        } catch (err) {
            throw new Error(`Error al crear la municipalidad: ${err}`);
        }
    }

    static async updateMunicipality(
        id: string,
        data: Partial<Pick<Municipality, "name" | "districtId" | "status">>
    ): Promise<MunicipalityResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Municipality>(COLLECTION_NAME)
                .findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { ...data, updatedAt: new Date() } },
                    { returnDocument: "after" }
                );

            if (!result) return null;

            return await MunicipalityRepository.getMunicipalityById(id);
        } catch (err) {
            throw new Error(`Error al actualizar la municipalidad: ${err}`);
        }
    }
}