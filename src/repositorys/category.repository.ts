import { ObjectId } from "mongodb";
import { Category } from "../data/category.model";
import { mongoDb } from "../config/mongodb.config";

const COLLECTION_NAME = "categories";

interface CategoryListResponse {
    id: string;
    name: string;
}

interface CategoryDetailResponse {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CategoryRepository {

    static async getCategories(): Promise<CategoryListResponse[]> {
        try {
            const db = mongoDb();

            const categories = await db
                .collection<Category>(COLLECTION_NAME)
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

            return categories as unknown as CategoryListResponse[];
        } catch (err) {
            throw new Error(`Error al obtener las categorías: ${err}`);
        }
    }

    static async getCategoryById(id: string): Promise<CategoryDetailResponse | null> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Category>(COLLECTION_NAME)
                .aggregate([
                    { $match: { _id: new ObjectId(id) } },
                    {
                        $project: {
                            _id: 0,
                            id: { $toString: "$_id" },
                            name: 1,
                            description: 1,
                            iconUrl: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ])
                .toArray();

            return (result[0] as unknown as CategoryDetailResponse) ?? null;
        } catch (err) {
            throw new Error(`Error al obtener la categoría: ${err}`);
        }
    }

    // NUEVO: para verificar duplicados antes de crear
    static async getCategoryByName(name: string): Promise<Category | null> {
        try {
            const db = mongoDb();
            return await db
                .collection<Category>(COLLECTION_NAME)
                .findOne({ name });
        } catch (err) {
            throw new Error(`Error al buscar la categoría por nombre: ${err}`);
        }
    }

    static async createCategory(
        data: Omit<Category, "_id">
    ): Promise<CategoryDetailResponse> {
        try {
            const db = mongoDb();

            const result = await db
                .collection<Category>(COLLECTION_NAME)
                .insertOne(data as Category);

            const created = await CategoryRepository.getCategoryById(
                result.insertedId.toString()
            );

            if (!created) {
                throw new Error("No se pudo recuperar la categoría recién creada");
            }

            return created;
        } catch (err) {
            throw new Error(`Error al crear la categoría: ${err}`);
        }
    }
}