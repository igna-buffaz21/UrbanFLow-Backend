import { ObjectId } from "mongodb";
import { UserRepository } from "../repositorys/user.repository";
import { User, UserRole, UserStatus } from "../data/user.model";
import { ClerkRepository } from "../repositorys/clerk.repository";

const VALID_USER_ROLES: UserRole[] = ["superadmin", "admin", "operator", "citizen"];
const VALID_USER_STATUSES: UserStatus[] = ["pending", "active", "inactive", "blocked"];
const INVITABLE_ROLES: UserRole[] = ["admin", "operator"];

interface CreateUserDto {
    clerkId: string;
    name: string;
    email: string;
    photoUrl?: string;
    role?: UserRole;
    status?: UserStatus;
    municipalityId?: string;
}

interface InviteUserDto {
    email: string;
    role: UserRole;
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

    static async inviteUser(authenticatedClerkId: string, data: InviteUserDto) {
        this.validateInviteUserData(data);

        const authenticatedUser = await UserRepository.getUserByClerkId(authenticatedClerkId);

        if (!authenticatedUser) {
            const error = new Error("El usuario autenticado no existe en el sistema");
            (error as any).statusCode = 403;
            throw error;
        }

        if (authenticatedUser.status !== "active") {
            const error = new Error("El usuario autenticado no está activo");
            (error as any).statusCode = 403;
            throw error;
        }

        this.validateInvitePermissions(authenticatedUser, data);

        const normalizedEmail = data.email.trim().toLowerCase();

        const existingUser = await UserRepository.getUserByEmail(normalizedEmail);

        if (existingUser) {
            const error = new Error("Ya existe un usuario con ese email");
            (error as any).statusCode = 409;
            throw error;
        }

        const municipalityId = this.resolveMunicipalityId(authenticatedUser, data);

        const clerkInvitation = await ClerkRepository.createUserInvitation({
            email: normalizedEmail,
            role: data.role,
            municipalityId: municipalityId?.toString()
        });

        try {
            const now = new Date();

            const newUser: User = {
                clerkInvitationId: clerkInvitation.id,
                email: normalizedEmail,
                role: data.role,
                status: "pending",
                municipalityId,
                createdAt: now,
                updatedAt: now
            };

            const createdUser = await UserRepository.createUser(newUser);

            return this.mapInvitedUserResponse(createdUser);
        } 
        catch (err) {
            await ClerkRepository.revokeUserInvitation(clerkInvitation.id);
            throw err;
        }
    }

    static async getPendingUserByEmail(email: string): Promise<User | null> {
    if (!email || typeof email !== "string") {
        const error = new Error("Email inválido");
        (error as any).statusCode = 400;
        throw error;
    }

    return await UserRepository.getPendingUserByEmail(email.trim().toLowerCase());
    }

    static async createUserEntity(data: CreateUserDto): Promise<User> {
    this.validateCreateUserData(data);

    const existingUser = await UserRepository.getUserByEmail(data.email.trim().toLowerCase());

    if (existingUser) {
        const error = new Error("Ya existe un usuario con ese email");
        (error as any).statusCode = 409;
        throw error;
    }

    const now = new Date();

    const newUser: User = {
        clerkId: data.clerkId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        photoUrl: data.photoUrl,
        role: data.role || "citizen",
        status: data.status || "active",
        municipalityId: data.municipalityId ? new ObjectId(data.municipalityId) : undefined,
        createdAt: now,
        updatedAt: now
    };

    return await UserRepository.createUser(newUser);
    }

    static async activatePendingUser(
        userId: ObjectId,
        data: {
            clerkId: string;
            name: string;
            photoUrl?: string;
        }
    ): Promise<User> {
        if (!userId) {
            const error = new Error("ID de usuario inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.clerkId || typeof data.clerkId !== "string") {
            const error = new Error("Clerk ID inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.name || typeof data.name !== "string") {
            const error = new Error("El nombre es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        const updatedUser = await UserRepository.activatePendingUser(userId, {
            clerkId: data.clerkId,
            name: data.name.trim(),
            photoUrl: data.photoUrl
        });

        if (!updatedUser) {
            const error = new Error("No se pudo activar el usuario pendiente");
            (error as any).statusCode = 500;
            throw error;
        }

        return updatedUser;
    }

    private static validateInviteUserData(data: InviteUserDto) {
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

        if (!data.role || !INVITABLE_ROLES.includes(data.role)) {
            const error = new Error("Solo se pueden invitar usuarios admin u operator");
            (error as any).statusCode = 400;
            throw error;
        }

        if (data.municipalityId && !ObjectId.isValid(data.municipalityId)) {
            const error = new Error("El ID del municipio no es válido");
            (error as any).statusCode = 400;
            throw error;
        }
    }

    private static validateInvitePermissions(authenticatedUser: User, data: InviteUserDto) {
        if (authenticatedUser.role === "superadmin") {
            return;
        }

        if (authenticatedUser.role === "admin" && data.role === "operator") {
            return;
        }

        const error = new Error("No tenés permisos para invitar este tipo de usuario");
        (error as any).statusCode = 403;
        throw error;
    }

    private static resolveMunicipalityId(authenticatedUser: User, data: InviteUserDto): ObjectId | undefined {
        if (authenticatedUser.role === "admin") {
            if (!authenticatedUser.municipalityId) {
                const error = new Error("El admin autenticado no tiene municipio asignado");
                (error as any).statusCode = 403;
                throw error;
            }

            if (
                data.municipalityId &&
                data.municipalityId !== authenticatedUser.municipalityId.toString()
            ) {
                const error = new Error("No podés invitar usuarios de otro municipio");
                (error as any).statusCode = 403;
                throw error;
            }

            return authenticatedUser.municipalityId;
        }

        if (!data.municipalityId) {
            const error = new Error("El municipio es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        return new ObjectId(data.municipalityId);
    }

    private static mapInvitedUserResponse(user: User) {
        return {
            id: user._id?.toString(),
            clerkInvitationId: user.clerkInvitationId,
            email: user.email,
            role: user.role,
            status: user.status,
            municipalityId: user.municipalityId?.toString()
        };
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