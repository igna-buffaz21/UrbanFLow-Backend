import { ObjectId } from "mongodb";
import { Municipality, MunicipalityStatus } from "../data/municipality.model";
import { mongoDb } from "../config/mongodb.config";

// Nombre de la colección en Mongo, en una constante para no repetir el string
const COLLECTION_NAME = "municipalities";

// --- Tipos ---

// Filtros opcionales para el GET /municipalities
interface GetMunicipalitiesFilters {
    status?: MunicipalityStatus;
    districtId?: string;
}

// Cómo queremos que luzca la municipalidad en la RESPUESTA al cliente
// (con el distrito ya "abierto" en vez de solo el districtId)
interface MunicipalityResponse {
    id: string;
    name: string;
    district: {
        id: string;
        name: string;
    };
    status: MunicipalityStatus;
    createdAt: Date;
    updatedAt: Date;
}

// --- Repository ---

export class MunicipalityRepository {

    // GET /municipalities
    static async getMunicipalities(
        filters: GetMunicipalitiesFilters
    ): Promise<MunicipalityResponse[]> {
        try {
            const db = mongoDb();

            // Construimos el filtro dinámicamente.
            // Arrancamos con un objeto vacío y solo agregamos campos si vienen en los filtros.
            // Si matchStage queda vacío {}, el $match devuelve todos los documentos.
            const matchStage: Record<string, unknown> = {};

            if (filters.status) {
                matchStage.status = filters.status;
            }
            if (filters.districtId) {
                // En Mongo los IDs no son strings, son ObjectId.
                // Convertimos el string que llega por query param al tipo correcto.
                matchStage.districtId = new ObjectId(filters.districtId);
            }

            // .aggregate() recibe un array de "etapas" (pipeline).
            // Cada etapa transforma los documentos y los pasa a la siguiente.
            const municipalities = await db
                .collection<Municipality>(COLLECTION_NAME)
                .aggregate([
                    // Etapa 1: filtrar por los criterios que llegaron
                    { $match: matchStage },

                    // Etapa 2: JOIN con la colección "districts"
                    // localField: campo en municipalities
                    // foreignField: campo en districts con el que hacer match
                    // as: nombre del array donde se guardan los resultados del join
                    {
                        $lookup: {
                            from: "districts",
                            localField: "districtId",
                            foreignField: "_id",
                            as: "districtData",
                        },
                    },

                    // Etapa 3: el $lookup devuelve un ARRAY (districtData: [...]).
                    // Como cada municipalidad tiene UN solo distrito, lo "aplanamos"
                    // para que districtData sea un objeto y no un array de un elemento.
                    { $unwind: "$districtData" },

                    // Etapa 4: elegimos exactamente qué campos devolver y con qué nombres.
                    // El "$" dentro de las comillas significa "tomá el valor de ese campo".
                    {
                        $project: {
                            _id: 0,                              // excluimos el _id original
                            id: { $toString: "$_id" },          // convertimos ObjectId a string
                            name: 1,                            // 1 = incluir el campo tal cual
                            district: {
                                id: { $toString: "$districtData._id" },
                                name: "$districtData.name",
                            },
                            status: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return municipalities as unknown as MunicipalityResponse[];
        } catch (err) {
            throw new Error(`Error al obtener las municipalidades: ${err}`);
        }
    }

    // GET /municipalities/:id
    static async getMunicipalityById(id: string): Promise<MunicipalityResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Municipality>(COLLECTION_NAME)
                .aggregate([
                    // Solo traemos el documento que tenga ese _id
                    { $match: { _id: new ObjectId(id) } },
                    {
                        $lookup: {
                            from: "districts",
                            localField: "districtId",
                            foreignField: "_id",
                            as: "districtData",
                        },
                    },
                    { $unwind: "$districtData" },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            district: {
                                id: { $toString: "$districtData._id" },
                                name: "$districtData.name",
                            },
                            status: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            // Si no encontró nada, el array viene vacío → devolvemos null
            return (result[0] as unknown as MunicipalityResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al obtener la municipalidad: ${err}`);
        }
    }

    // GET municipality por nombre (para validar duplicados)
    static async getMunicipalityByName(name: string) {
        try {
            const db = mongoDb();
            const municipality = await db
                .collection("municipalities")
                .findOne({ name: name });

            return municipality;
        } catch (err) {
            throw new Error(`Error al buscar la municipalidad por nombre: ${err}`);
        }
    }

    // POST /municipalities
    static async createMunicipality(
        data: Omit<Municipality, "_id">  // Omit<> = el tipo Municipality pero SIN el campo _id
    ): Promise<MunicipalityResponse> {
        try {
            const db = mongoDb();

            // insertOne guarda el documento y devuelve el insertedId generado por Mongo
            const result = await db
                .collection<Municipality>(COLLECTION_NAME)
                .insertOne(data as Municipality);

            // Reutilizamos getMunicipalityById para traer el documento ya con el distrito
            const created = await MunicipalityRepository.getMunicipalityById(
                result.insertedId.toString()
            );

            if (!created) {
                throw new Error("No se pudo recuperar la municipalidad recién creada");
            }

            return created;
        } catch (err) {
            throw new Error(`Error al crear la municipalidad: ${err}`);
        }
    }
}