import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { COLLECTION_NAMES } from "../data/types/global/const.global";
import { SubDistrict } from "../data/sub-districts.model";

export class SubDistrictRepository {
  static async createMany(subDistricts: SubDistrict[]): Promise<SubDistrict[]> {
    const db = mongoDb();

    if (subDistricts.length === 0) {
      return [];
    }

    const result = await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .insertMany(subDistricts);

    return subDistricts.map((subDistrict, index) => ({
      ...subDistrict,
      _id: result.insertedIds[index],
    }));
  }

  static async getByMunicipalityId(
    municipalityId: string
  ): Promise<SubDistrict[]> {
    const db = mongoDb();

    if (!ObjectId.isValid(municipalityId)) {
      return [];
    }

    return await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .find({
        municipalityId: new ObjectId(municipalityId),
        status: "active",
      })
      .sort({ name: 1 })
      .toArray();
  }

  static async findByCoordinates(params: {
    municipalityId: string;
    lat: number;
    lng: number;
  }): Promise<SubDistrict | null> {
    const db = mongoDb();

    if (!ObjectId.isValid(params.municipalityId)) {
      return null;
    }

    return await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .findOne({
        municipalityId: new ObjectId(params.municipalityId),
        status: "active",
        polygon: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [params.lng, params.lat],
            },
          },
        },
      });
  }

  static async deleteByMunicipalityId(municipalityId: string): Promise<void> {
    const db = mongoDb();

    if (!ObjectId.isValid(municipalityId)) {
      return;
    }

    await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .deleteMany({
        municipalityId: new ObjectId(municipalityId),
      });
  }

  static async createIndexes(): Promise<void> {
    const db = mongoDb();

    await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .createIndex({ polygon: "2dsphere" });

    await db
      .collection<SubDistrict>(COLLECTION_NAMES.SUB_DISTRICTS)
      .createIndex(
        {
          municipalityId: 1,
          name: 1,
        },
        {
          unique: true,
        }
      );
  }
}