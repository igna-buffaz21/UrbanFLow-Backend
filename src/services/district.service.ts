import { ObjectId } from "mongodb";
import { GeoJSONPolygon, GeoJSONMultiPolygon } from "../data/district.model";
import { DistrictRepository } from "../repositorys/district.repository";

const VALID_POLYGON_TYPES = ["Polygon", "MultiPolygon"];


interface GetDistrictByIdParams {
    id: string;
}

interface CreateDistrictParams {
    name: string;
    polygon: GeoJSONPolygon | GeoJSONMultiPolygon;
}

function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

function validatePolygon(polygon: any): boolean {
    if (!polygon || !polygon.type || !polygon.coordinates) return false;
    if (!VALID_POLYGON_TYPES.includes(polygon.type)) return false;
    if (!Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) return false;

    return true;
}

export class DistrictService {

    static async getDistricts() {
        return await DistrictRepository.getDistricts();
    }

    static async getDistrictById(params: GetDistrictByIdParams) {

        if (!ObjectId.isValid(params.id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        const district = await DistrictRepository.getDistrictById(params.id);

        if (!district) {
            throw buildError("Distrito no encontrado", 404);
        }

        return district;
    }

    static async createDistrict(params: CreateDistrictParams) {

        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre     es requerido", 400);
        }

        if (!validatePolygon(params.polygon)) {
            throw buildError(
                "El polygon es requerido y debe ser un GeoJSON válido (Polygon o MultiPolygon)",
                400
            );
        }
        const existingDistrict = await DistrictRepository.getDistrictByName(params.name.trim());
        if (existingDistrict) {
            throw buildError("Ya existe un distrito con ese nombre", 409); // 409 Conflict
        }

        const now = new Date();

        return await DistrictRepository.createDistrict({
            name: params.name.trim(),
            polygon: params.polygon,
            createdAt: now,
            updatedAt: now,
        });
    }

}