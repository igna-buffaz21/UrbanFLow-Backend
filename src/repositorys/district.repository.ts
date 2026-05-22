import { ObjectId } from "mongodb";
import { District } from "../data/district.model";
import { mongoDb } from "../config/mongodb.config";

const COLLECTION_NAME = "districts";

interface DistrictListResponse {
    id: string;
    name: string;
}

interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"];
    createdAt: Date;
    updatedAt: Date;
}

interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"];
    createdAt: Date;
    updatedAt: Date;
}


export class DistrictRepository {

    static async getDistricts(): Promise<DistrictListResponse[]> {
        try {
            const db = mongoDb();

            const districts = await db
                .collection<District>(COLLECTION_NAME)
                .aggregate([
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                        },
                    },
                ])
                .toArray();

            return districts as unknown as DistrictListResponse[];
        } catch (err) {
            throw new Error(`Error al obtener los distritos: ${err}`);
        }
    }

    static async getDistrictById(id: string): Promise<DistrictDetailResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<District>(COLLECTION_NAME)
                .aggregate([
                    { $match: { _id: new ObjectId(id) } },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            polygon: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return (result[0] as unknown as DistrictDetailResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al obtener el distrito: ${err}`);
        }
    }

    static async getDistrictByName(name: string): Promise<District | null> {
        try {
            const db = mongoDb();
            const district = await db
                .collection<District>(COLLECTION_NAME)
                .findOne({ name: name });

            return district;
        } catch (err) {
            throw new Error(`Error al buscar el distrito por nombre: ${err}`);
        }
    }

    static async createDistrict(
        data: Omit<District, "_id">
    ): Promise<DistrictDetailResponse> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<District>(COLLECTION_NAME)
                .insertOne(data as District);

            const created = await DistrictRepository.getDistrictById(
                result.insertedId.toString()
            );

            if (!created) {
                throw new Error("No se pudo recuperar el distrito recién creado");
            }

            return created;
        } catch (err) {
            throw new Error(`Error al crear el distrito: ${err}`);
        }
    }

    static async findDistrictByPoint(lng: number, lat: number): Promise<DistrictDetailResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<District>(COLLECTION_NAME)
                .aggregate([
                    {
                        $match: {
                            polygon: {
                                $geoIntersects: {
                                    $geometry: {
                                        type: "Point",
                                        coordinates: [lng, lat]
                                    }
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            polygon: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    }
                ])
                .toArray();

            return (result[0] as unknown as DistrictDetailResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al buscar distrito por punto: ${err}`);
        }
    }
}