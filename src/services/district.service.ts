import { ObjectId } from "mongodb";
import { GeoJSONPolygon, GeoJSONMultiPolygon } from "../data/district.model";
import { DistrictRepository } from "../repositorys/district.repository";

// Tipos válidos de polígono GeoJSON que aceptamos
const VALID_POLYGON_TYPES = ["Polygon", "MultiPolygon"];

// --- Tipos de entrada para cada operación ---

// GET /districts/:id
interface GetDistrictByIdParams {
    id: string;
}

// POST /districts
interface CreateDistrictParams {
    name: string;
    polygon: GeoJSONPolygon | GeoJSONMultiPolygon;
}

// PATCH /districts/:id
// Partial<> hace que todos los campos sean opcionales
interface UpdateDistrictParams {
    name?: string;
    polygon?: GeoJSONPolygon | GeoJSONMultiPolygon;
}


// --- Helper privado ---

// Función reutilizable para construir errores con statusCode.
// Object.assign() copia propiedades de un objeto a otro.
// Acá lo usamos para agregarle statusCode al objeto Error, que por defecto no lo tiene.
function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

// Validación del polígono GeoJSON.
// Usamos "any" porque el dato viene del body sin tipar todavía.
// Verificamos manualmente que tenga la estructura correcta.
function validatePolygon(polygon: any): boolean {
    // Si no existe el objeto o le faltan campos clave, no es válido
    if (!polygon || !polygon.type || !polygon.coordinates) return false;
    // El type tiene que ser Polygon o MultiPolygon
    if (!VALID_POLYGON_TYPES.includes(polygon.type)) return false;
    // Las coordenadas tienen que ser un array con al menos un elemento
    if (!Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) return false;

    return true;
}

// --- Service ---

export class DistrictService {

    // GET /districts
    // No necesita validaciones porque no recibe parámetros
    static async getDistricts() {
        return await DistrictRepository.getDistricts();
    }

    // GET /districts/:id
    static async getDistrictById(params: GetDistrictByIdParams) {

        // ObjectId.isValid() verifica que el string tenga el formato correcto
        // de un ObjectId de Mongo (24 caracteres hexadecimales)
        if (!ObjectId.isValid(params.id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        const district = await DistrictRepository.getDistrictById(params.id);

        // Si el repository devuelve null significa que no existe → 404
        if (!district) {
            throw buildError("Distrito no encontrado", 404);
        }

        return district;
    }


    // POST /districts
    static async createDistrict(params: CreateDistrictParams) {

        // .trim() elimina espacios al inicio y al final del string
        // Si después del trim queda vacío, el nombre no es válido
        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre     es requerido", 400);
        }

        // Validamos que el polygon tenga la estructura GeoJSON correcta
        // Validamos que el polygon tenga la estructura GeoJSON correcta
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