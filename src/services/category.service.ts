import { CategoryRepository } from "../repositorys/category.repository";

interface CreateCategoryParams {
    name: string;
    description?: string;
    iconUrl?: string;
}

function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}


export class CategoryService {

    static async getCategories() {
        return await CategoryRepository.getCategories();
    }

    static async createCategory(params: CreateCategoryParams) {
        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre es requerido", 400);
        }

        const now = new Date();

        return await CategoryRepository.createCategory({
            name: params.name.trim(),
            // Si no mandaron description o iconUrl, no se guardan en Mongo
            // El operador ?? significa: si es null o undefined, no lo incluyas
            description: params.description?.trim(),
            iconUrl: params.iconUrl?.trim(),
            createdAt: now,
            updatedAt: now,
        });
    }
}