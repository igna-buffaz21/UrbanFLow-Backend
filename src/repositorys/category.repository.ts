import { ObjectId } from "mongodb";
import { Category } from "../data/category.model";
import { mongoDb } from "../config/mongodb.config";
import { COLLECTION_NAMES } from "../data/types/global/const.global";
import { CategoryListResponse, CategoryDetailResponse } from "../data/types/category/category.types";

export class CategoryRepository {

    static async getCategories(): Promise<CategoryListResponse[]> {
        try {
            const db = mongoDb();

            const categories = await db
                .collection<Category>(COLLECTION_NAMES.CATEGORIES)
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
                .collection<Category>(COLLECTION_NAMES.CATEGORIES)
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

    static async getCategoryByName(name: string): Promise<Category | null> {
        try {
            const db = mongoDb();
            return await db
                .collection<Category>(COLLECTION_NAMES.CATEGORIES)
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
                .collection<Category>(COLLECTION_NAMES.CATEGORIES)
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