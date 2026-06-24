import { ObjectId } from "mongodb";
import { GeoJSONPolygon, GeoJSONMultiPolygon } from "../data/district.model";
import { DistrictRepository } from "../repositorys/district.repository";
import { AuthService } from "./auth.services";
import { MunicipalityRepository } from "../repositorys/municipality.repository";

const VALID_POLYGON_TYPES = ["Polygon", "MultiPolygon"];

interface GetDistrictByIdParams {
    id: string;
}

interface CreateDistrictParams {
    name: string;
    polygon: GeoJSONPolygon | GeoJSONMultiPolygon;
}

interface FindDistrictByPointParams {
    lng: number;
    lat: number;
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

    static async getDistricts(clerkId: string) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        if (user.role !== "superadmin") {
            throw buildError("No tenés permisos para ver los distritos", 403);
        }

        return await DistrictRepository.getDistricts();
    }

    static async getDistrictById(clerkId: string, params: GetDistrictByIdParams) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        if (user.role !== "superadmin") {
            throw buildError("No tenés permisos para ver este distrito", 403);
        }

        if (!ObjectId.isValid(params.id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        const district = await DistrictRepository.getDistrictById(params.id);

        if (!district) {
            throw buildError("Distrito no encontrado", 404);
        }

        return district;
    }

    static async createDistrict(clerkId: string, params: CreateDistrictParams) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        if (user.role !== "superadmin") {
            throw buildError("No tenés permisos para crear distritos", 403);
        }

        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre es requerido", 400);
        }

        if (!validatePolygon(params.polygon)) {
            throw buildError(
                "El polygon es requerido y debe ser un GeoJSON válido (Polygon o MultiPolygon)",
                400
            );
        }

        const existingDistrict = await DistrictRepository.getDistrictByName(params.name.trim());
        if (existingDistrict) {
            throw buildError("Ya existe un distrito con ese nombre", 409);
        }

        const now = new Date();

        return await DistrictRepository.createDistrict({
            name: params.name.trim(),
            polygon: params.polygon,
            createdAt: now,
            updatedAt: now,
        });
    }

    static async findDistrictByPoint(params: FindDistrictByPointParams) {
        const { lng, lat } = params;

        // Validaciones básicas
        if (lng === undefined || lat === undefined) {
            throw buildError("Longitud y latitud son requeridas", 400);
        }
        if (typeof lng !== "number" || typeof lat !== "number") {
            throw buildError("Longitud y latitud deben ser números", 400);
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            throw buildError("Coordenadas fuera de rango", 400);
        }

        const district = await DistrictRepository.findDistrictByPoint(lng, lat);

        if (!district) {
            throw buildError("No se encontró ningún distrito en esa ubicación", 404);
        }

        return district;
    }

    static async getMyDistrict(clerkId: string) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        if (user.role !== "admin" && user.role !== "superadmin") {
            throw buildError("No tenés permisos para ver este distrito", 403);
        }

        if (!user.municipalityId) {
            throw buildError("El usuario no tiene un municipio asociado", 400);
        }

        const municipality = await MunicipalityRepository.getMunicipalityById(user.municipalityId);

        if (!municipality) {
            throw buildError("Municipio no encontrado", 404);
        }

        const district = await DistrictRepository.getDistrictById(municipality.district.id);

        if (!district) {
            throw buildError("Distrito no encontrado", 404);
        }

        return district;
    }
}