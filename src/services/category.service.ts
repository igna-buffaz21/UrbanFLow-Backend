import { CategoryRepository } from "../repositorys/category.repository";
import { AuthService } from "./auth.services";

interface CreateCategoryParams {
    name: string;
    description?: string;
    iconUrl?: string;
}

function buildError(message: string, statusCode: number): Error {
    return Object.assign(new Error(message), { statusCode });
}

export class CategoryService {

    static async getCategories(clerkId: string) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        const allowedRoles = ["superadmin", "admin", "operator", "citizen"];
        if (!allowedRoles.includes(user.role)) {
            throw buildError("No tenés permisos para ver las categorías", 403);
        }

        return await CategoryRepository.getCategories();
    }

    static async createCategory(clerkId: string, params: CreateCategoryParams) {
        const user = await AuthService.getAuthenticatedUser(clerkId);

        if (user.role !== "superadmin") {
            throw buildError("No tenés permisos para crear categorías", 403);
        }

        if (!params.name || params.name.trim() === "") {
            throw buildError("El nombre es requerido", 400);
        }

        const existing = await CategoryRepository.getCategoryByName(params.name.trim());
        if (existing) {
            throw buildError("Ya existe una categoría con ese nombre", 409);
        }

        const now = new Date();

        return await CategoryRepository.createCategory({
            name: params.name.trim(),
            description: params.description?.trim(),
            iconUrl: params.iconUrl?.trim(),
            createdAt: now,
            updatedAt: now,
        });
    }
}