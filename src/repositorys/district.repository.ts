import { ObjectId } from "mongodb";
import { District } from "../data/district.model";
import { mongoDb } from "../config/mongodb.config";

// Nombre de la colección en Mongo en una constante para no repetir el string
const COLLECTION_NAME = "districts";

// --- Tipos ---

// Lo que devuelve el GET /districts (sin polygon porque puede ser pesado)
interface DistrictListResponse {
    id: string;
    name: string;
}

// Lo que devuelve el GET /districts/:id (con polygon completo)
interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"]; // tomamos el tipo polygon directo del modelo
    createdAt: Date;
    updatedAt: Date;
}

// Lo que devuelve el GET /districts/:id (con polygon completo)
interface DistrictDetailResponse {
    id: string;
    name: string;
    polygon: District["polygon"]; // tomamos el tipo polygon directo del modelo
    createdAt: Date;
    updatedAt: Date;
}

// --- Repository ---

export class DistrictRepository {

    // GET /districts
    static async getDistricts(): Promise<DistrictListResponse[]> {
        try {
            const db = mongoDb();

            const districts = await db
                .collection<District>(COLLECTION_NAME)
                .aggregate([
                    {
                        $project: {
                            _id: 0,                         // excluimos el _id original
                            id: { $toString: "$_id" },      // convertimos ObjectId a string
                            name: 1,                        // incluimos solo el nombre
                            // polygon NO se incluye adrede, porque puede ser muy pesado
                        },
                    },
                ])
                .toArray();

            return districts as unknown as DistrictListResponse[];
        } catch (err) {
            throw new Error(`Error al obtener los distritos: ${err}`);
        }
    }

    // GET /districts/:id
    static async getDistrictById(id: string): Promise<DistrictDetailResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<District>(COLLECTION_NAME)
                .aggregate([
                    // Filtramos por el _id que llega como parámetro
                    // new ObjectId(id) convierte el string al tipo que usa Mongo internamente
                    { $match: { _id: new ObjectId(id) } },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            polygon: 1,     // acá sí incluimos el polygon completo
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            // Si no encontró nada el array viene vacío → devolvemos null
            // ?? significa: si result[0] es null o undefined, devolvé null
            return (result[0] as unknown as DistrictDetailResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al obtener el distrito: ${err}`);
        }
    }

    // GET district por nombre (para validar duplicados)
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

    // POST /districts
    static async createDistrict(
        data: Omit<District, "_id">  // Omit<> = el tipo District pero SIN el campo _id
    ): Promise<DistrictDetailResponse> {
        try {
            const db = mongoDb();

            // insertOne guarda el documento y devuelve el insertedId generado por Mongo
            const result = await db
                .collection<District>(COLLECTION_NAME)
                .insertOne(data as District);

            // Reutilizamos getDistrictById para traer el documento recién creado
            // ya formateado con el id como string
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
}