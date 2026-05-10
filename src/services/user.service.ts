import { ObjectId } from "mongodb";
import { UserRepository } from "../repositorys/user.repository";
import { User, UserRole, UserStatus } from "../data/user.model";

const VALID_USER_ROLES: UserRole[] = ["superadmin", "admin", "operator", "citizen"];
const VALID_USER_STATUSES: UserStatus[] = ["active", "inactive", "blocked"];

interface CreateUserDto {
    clerkId: string;
    name: string;
    email: string;
    photoUrl?: string;
    role?: UserRole;
    status?: UserStatus;
    municipalityId?: string;
}

export class UserService {
    static async createUser(data: CreateUserDto) {
        this.validateCreateUserData(data);

        const existingUser = await UserRepository.getUserByClerkId(data.clerkId);

        if (existingUser) {
            const error = new Error("Ya existe un usuario con ese Clerk ID");
            (error as any).statusCode = 409;
            throw error;
        }

        const now = new Date();

        const newUser: User = {
            clerkId: data.clerkId.trim(),
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            photoUrl: data.photoUrl,
            role: data.role || "citizen",
            status: data.status || "active",
            municipalityId: data.municipalityId ? new ObjectId(data.municipalityId) : undefined,
            createdAt: now,
            updatedAt: now
        };

        const createdUser = await UserRepository.createUser(newUser);

        return this.mapUserResponse(createdUser);
    }

    static async getUserByClerkId(clerkId: string): Promise<User | null> {
        if (!clerkId || typeof clerkId !== "string") {
            const error = new Error("Clerk ID inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        return await UserRepository.getUserByClerkId(clerkId);
    }

    private static validateCreateUserData(data: CreateUserDto) {
        if (!data.clerkId || typeof data.clerkId !== "string") {
            const error = new Error("El Clerk ID es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.name || typeof data.name !== "string") {
            const error = new Error("El nombre es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.email || typeof data.email !== "string") {
            const error = new Error("El email es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(data.email)) {
            const error = new Error("El email no tiene un formato válido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (data.role && !VALID_USER_ROLES.includes(data.role)) {
            const error = new Error("El rol no es válido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (data.status && !VALID_USER_STATUSES.includes(data.status)) {
            const error = new Error("El estado no es válido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (data.municipalityId && !ObjectId.isValid(data.municipalityId)) {
            const error = new Error("El ID del municipio no es válido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (
            (data.role === "admin" || data.role === "operator") &&
            !data.municipalityId
        ) {
            const error = new Error("El municipio es obligatorio para admin y operator");
            (error as any).statusCode = 400;
            throw error;
        }
    }

    private static mapUserResponse(user: User) {
        return {
            id: user._id?.toString(),
            clerkId: user.clerkId,
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
            role: user.role,
            status: user.status,
            municipalityId: user.municipalityId?.toString()
        };
    }
}