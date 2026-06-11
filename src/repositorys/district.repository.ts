import { ObjectId } from "mongodb";
import { District } from "../data/district.model";
import { mongoDb } from "../config/mongodb.config";
import { DistrictDetailResponse, DistrictListResponse } from "../data/types/districts/districts.type";
import { COLLECTION_NAMES } from "../data/types/global/const.global";

export class DistrictRepository {
    static async getDistricts(): Promise<DistrictListResponse[]> {
        try {
            const db = mongoDb();

            const districts = await db
                .collection<District>(COLLECTION_NAMES.DISTRICTS)
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
                .collection<District>(COLLECTION_NAMES.DISTRICTS)
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
                .collection<District>(COLLECTION_NAMES.DISTRICTS)
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
                .collection<District>(COLLECTION_NAMES.DISTRICTS)
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
                .collection<District>(COLLECTION_NAMES.DISTRICTS)
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

    static async findMunicipalityByPoint(
        lng: number,
        lat: number
        ): Promise<string | null> {
        try {
            const db = mongoDb();

            const result = await db
            .collection<District>(COLLECTION_NAMES.DISTRICTS)
            .aggregate([
                {
                $match: {
                    polygon: {
                    $geoIntersects: {
                        $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                        },
                    },
                    },
                },
                },
                {
                $lookup: {
                    from: "municipalities",
                    localField: "_id",
                    foreignField: "districtId",
                    as: "municipality",
                },
                },
                {
                $unwind: "$municipality",
                },
                {
                $project: {
                    _id: 0,
                    municipalityId: {
                    $toString: "$municipality._id",
                    },
                },
                },
            ])
            .toArray();

            return result[0]?.municipalityId ?? null;
        } catch (err) {
            throw new Error(`Error al buscar municipalidad por punto: ${err}`);
        }
    }
}