
import {
  CreateSubDistrictsBulkInput,
  FindSubDistrictByCoordinatesInput,
  GeoJsonPolygon,
  SubDistrict,
  SubDistrictResponse,
} from "../data/sub-districts.model";
import { SubDistrictRepository } from "../repositorys/sub-districts.repository";
import { ObjectId } from "mongodb";

export class SubDistrictService {
  static async createBulk(input: CreateSubDistrictsBulkInput): Promise<{
    created: number;
    data: SubDistrictResponse[];
  }> {
    const { municipalityId, featureCollection } = input;

    if (!featureCollection) {
      throw new Error("El body es obligatorio");
    }

    if (featureCollection.type !== "FeatureCollection") {
      throw new Error("El body debe ser de tipo FeatureCollection");
    }

    if (!Array.isArray(featureCollection.features)) {
      throw new Error("El FeatureCollection debe tener un array de features");
    }

    const now = new Date();

    const subDistricts: SubDistrict[] = featureCollection.features.map(
      (feature) => {
        const name = feature.properties?.NOMBRE ?? feature.properties?.name;

        if (!name) {
          throw new Error(
            "Cada barrio debe tener un nombre en properties.NOMBRE o properties.name"
          );
        }

        if (!feature.geometry) {
          throw new Error(`El barrio ${name} no tiene geometry`);
        }

        if (
          feature.geometry.type !== "Polygon" &&
          feature.geometry.type !== "MultiPolygon"
        ) {
          throw new Error(
            `El barrio ${name} debe tener geometry Polygon o MultiPolygon`
          );
        }

        return {
          name: String(name).trim(),
          polygon: feature.geometry as GeoJsonPolygon,
          municipalityId: new ObjectId(municipalityId),
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
      }
    );

    const createdSubDistricts = await SubDistrictRepository.createMany(
      subDistricts
    );

    return {
      created: createdSubDistricts.length,
      data: createdSubDistricts.map(this.mapToResponse),
    };
  }

  static async getByMunicipalityId(
    municipalityId: string
  ): Promise<SubDistrictResponse[]> {
    const subDistricts = await SubDistrictRepository.getByMunicipalityId(
      municipalityId
    );

    return subDistricts.map(this.mapToResponse);
  }

  static async findByCoordinates(
    input: FindSubDistrictByCoordinatesInput
  ): Promise<SubDistrictResponse | null> {
    const subDistrict = await SubDistrictRepository.findByCoordinates(input);

    if (!subDistrict) {
      return null;
    }

    return this.mapToResponse(subDistrict);
  }

  private static mapToResponse(subDistrict: SubDistrict): SubDistrictResponse {
    return {
      id: subDistrict._id?.toString() ?? "",
      name: subDistrict.name,
      polygon: subDistrict.polygon,
      municipalityId: subDistrict.municipalityId.toString(),
      status: subDistrict.status,
      createdAt: subDistrict.createdAt,
      updatedAt: subDistrict.updatedAt,
    };
  }
}