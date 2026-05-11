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
}