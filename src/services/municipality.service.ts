import { ObjectId } from "mongodb";
import { MunicipalityStatus } from "../data/municipality.model";
import { MunicipalityRepository } from "../repositorys/municipality.repository";

// Lista de valores válidos para el campo status.
// La usamos para validar en vez de comparar strings sueltos.
const VALID_STATUSES: MunicipalityStatus[] = ["active", "inactive"];

// --- Tipos de entrada para cada operación ---

// Los parámetros que acepta el GET /municipalities (todos opcionales)
interface GetMunicipalitiesParams {
    status?: string;
    districtId?: string;
}

// Los parámetros que acepta el POST /municipalities
interface CreateMunicipalityParams {
    name: string;
    districtId: string;
    status?: MunicipalityStatus;
}


// --- Helper privado ---

// Función reutilizable para construir errores con statusCode.
// Object.assign() copia propiedades de un objeto a otro.
// Acá lo usamos para agregarle statusCode al objeto Error, que por defecto no lo tiene.
function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

// --- Service ---

export class MunicipalityService {

    // GET /municipalities
    static async getMunicipalities(params: GetMunicipalitiesParams) {

        // Validamos el status solo si vino en la query
        if (params.status && !VALID_STATUSES.includes(params.status as MunicipalityStatus)) {
            throw buildError("El status debe ser 'active' o 'inactive'", 400);
        }

        // ObjectId.isValid() es un método de la librería mongodb que verifica
        // si un string tiene el formato correcto de un ObjectId de Mongo (24 chars hex)
        if (params.districtId && !ObjectId.isValid(params.districtId)) {
            throw buildError("El districtId no es un ObjectId válido", 400);
        }

        // Si todo está bien, llamamos al repository con los filtros
        return await MunicipalityRepository.getMunicipalities({
            status: params.status as MunicipalityStatus | undefined,
            districtId: params.districtId,
        });
    }
    // GET /municipalities/:id
    static async getMunicipalityById(id: string) {

        if (!ObjectId.isValid(id)) {
            throw buildError("El id no es un ObjectId válido", 400);
        }

        const municipality = await MunicipalityRepository.getMunicipalityById(id);

        // Si el repository devuelve null, significa que no existe → 404
        if (!municipality) {
            throw buildError("Municipalidad no encontrada", 404);
        }

        return municipality;
    }

    // POST /municipalities
    static async createMunicipality(params: CreateMunicipalityParams) {

        // Validar nombre vacío
        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre es requerido", 400);
        }

        // Validar que no exista otra municipalidad con el mismo nombre
        const existingMunicipality = await MunicipalityRepository.getMunicipalityByName(params.name.trim());
        if (existingMunicipality) {
            throw buildError("Ya existe una municipalidad con ese nombre", 409);
        }

        if (!params.districtId || !ObjectId.isValid(params.districtId)) {
            throw buildError("El districtId es requerido y debe ser un ObjectId válido", 400);
        }

        if (params.status && !VALID_STATUSES.includes(params.status)) {
            throw buildError("El status debe ser 'active' o 'inactive'", 400);
        }

        const now = new Date();

        return await MunicipalityRepository.createMunicipality({
            name: params.name.trim(),
            districtId: new ObjectId(params.districtId),
            // Si no mandaron status, por defecto es "active"
            // El operador ?? significa: "si lo que está a la izquierda es null o undefined, usá lo de la derecha"
            status: params.status ?? "active",
            createdAt: now,
            updatedAt: now,
        });
    }
}