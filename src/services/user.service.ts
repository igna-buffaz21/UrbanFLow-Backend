import { ObjectId } from "mongodb";
import { UserRepository } from "../repositorys/user.repository";
import { User, UserRole, UserStatus } from "../data/user.model";
import { ClerkRepository } from "../repositorys/clerk.repository";
import { MunicipalityRepository } from "../repositorys/municipality.repository";
import { USER_ROLES } from "../data/types/global/const.global";
import { AuthService } from "./auth.services";
import type { CitizenStatsResult } from "../data/types/user/user.type";

const VALID_USER_ROLES: UserRole[] = ["superadmin", "admin", "operator", "citizen"];
const VALID_USER_STATUSES: UserStatus[] = ["pending", "active", "inactive", "blocked"];
const INVITABLE_ROLES: UserRole[] = ["admin", "operator"];
const VALID_STATUS_TO_UPDATE_BY_ROLE: Record<UserRole, UserStatus[]> = {
    superadmin: [],
    admin: ["active", "inactive"],
    operator: ["active", "inactive"],
    citizen: ["active", "blocked"]
};

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

interface GetUsersQuery {
    role?: unknown;
    status?: unknown;
    municipalityId?: unknown;
    page?: unknown;
    limit?: unknown;
}

interface UpdateMyProfileDto {
    dni: string;
    phone: string;
    address: string;
    province: string;
    city: string;
    subDistrict: string;
    postalCode: string;
}

interface GetUserStatusParams {
    authenticatedClerkId: string | null;
    userId: string;
}

interface UpdateUserStatusParams {
    authenticatedClerkId: string | null;
    userId: string;
    status: UserStatus;
}

interface GetUserByIdParams {
    authenticatedClerkId: string;
    userId: string;
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
            const error = new Error("El usuario no está activo");
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

        const municipality = await MunicipalityRepository.getMunicipalityById(municipalityId?.toString() ?? "");

        if (!municipality) {
            const error = new Error("El municipio no existe");
            (error as any).statusCode = 404;
            throw error;
        }

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

    static async getUsers(clerkId: string, query: GetUsersQuery) {
        const authenticatedUser = await UserRepository.getUserByClerkId(clerkId);

        if (!authenticatedUser) {
            const error = new Error("Usuario autenticado no encontrado en la base de datos");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser.status !== "active") {
            const error = new Error("Usuario inactivo o bloqueado");
            (error as any).statusCode = 403;
            throw error;
        }

        if (authenticatedUser.role !== "superadmin" && authenticatedUser.role !== "admin") {
            const error = new Error("No tenés permisos para listar usuarios");
            (error as any).statusCode = 403;
            throw error;
        }

        const filters: {
            role?: UserRole;
            status?: UserStatus;
            municipalityId?: ObjectId;
        } = {};

        if (query.role) {
            if (typeof query.role !== "string" || !VALID_USER_ROLES.includes(query.role as UserRole)) {
                const error = new Error("Rol inválido");
                (error as any).statusCode = 400;
                throw error;
            }

            filters.role = query.role as UserRole;
        }

        if (query.status) {
            if (typeof query.status !== "string" || !VALID_USER_STATUSES.includes(query.status as UserStatus)) {
                const error = new Error("Estado inválido");
                (error as any).statusCode = 400;
                throw error;
            }

            filters.status = query.status as UserStatus;
        }

        if (authenticatedUser.role === "admin") {
            if (!authenticatedUser.municipalityId) {
                const error = new Error("El administrador no tiene municipio asignado");
                (error as any).statusCode = 400;
                throw error;
            }

            if (query.municipalityId && query.municipalityId !== authenticatedUser.municipalityId.toString()) {
                const error = new Error("No podés listar usuarios de otro municipio");
                (error as any).statusCode = 403;
                throw error;
            }

            filters.municipalityId = authenticatedUser.municipalityId;
        }

        if (authenticatedUser.role === "superadmin" && query.municipalityId) {
            if (typeof query.municipalityId !== "string" || !ObjectId.isValid(query.municipalityId)) {
                const error = new Error("municipalityId inválido");
                (error as any).statusCode = 400;
                throw error;
            }

            filters.municipalityId = new ObjectId(query.municipalityId);
        }

        let pagination: { page: number; limit: number } | undefined;

        if (query.page || query.limit) {
            const page = parseInt(query.page as string, 10) || 1;
            const limit = parseInt(query.limit as string, 10) || 10;
            pagination = { page, limit };
        }

        return await UserRepository.getUsers(filters, pagination);
    }

    static async updateMyProfile(clerkId: string | null, data: UpdateMyProfileDto) {
        if (!clerkId) {
            const error = new Error("Usuario no autenticado");
            (error as any).statusCode = 401;
            throw error;
        }

        const user = await UserRepository.getUserByClerkId(clerkId);

        if (!user) {
            const error = new Error("El usuario no existe");
            (error as any).statusCode = 404;
            throw error;
        }

        this.validateUpdateMyProfileData(data);

        const existingUserByDni = await UserRepository.getUserByDni(data.dni.trim());

        if (
            existingUserByDni &&
            existingUserByDni.clerkId !== clerkId
        ) {
            const error = new Error("Ya existe un usuario con ese DNI");
            (error as any).statusCode = 409;
            throw error;
        }

        const updatedUser = await UserRepository.updateMyProfile(clerkId, {
            dni: data.dni.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            province: data.province.trim(),
            city: data.city.trim(),
            subDistrict: data.subDistrict.trim(),
            postalCode: data.postalCode.trim(),
            isProfileCompleted: true,
            updatedAt: new Date()
        });

        if (!updatedUser) {
            const error = new Error("No se pudo actualizar el perfil");
            (error as any).statusCode = 500;
            throw error;
        }

        return this.mapUserResponse(updatedUser);
    }


    private static validateUpdateMyProfileData(data: UpdateMyProfileDto) {
        if (!data.dni || typeof data.dni !== "string") {
            const error = new Error("El DNI es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        const dniRegex = /^\d{7,8}$/;

        if (!dniRegex.test(data.dni.trim())) {
            const error = new Error("El DNI debe tener 7 u 8 números");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.phone || typeof data.phone !== "string") {
            const error = new Error("El teléfono es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        const phoneRegex = /^\d{8,15}$/;

        if (!phoneRegex.test(data.phone.trim())) {
            const error = new Error("El teléfono debe tener entre 8 y 15 números");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.address || typeof data.address !== "string" || data.address.trim().length < 3) {
            const error = new Error("La dirección es obligatoria");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.province || typeof data.province !== "string") {
            const error = new Error("La provincia es obligatoria");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!data.city || typeof data.city !== "string") {
            const error = new Error("La ciudad es obligatoria");
            (error as any).statusCode = 400;
            throw error;
        }

        if (data.city === "Villa María") {
            if (!data.subDistrict || typeof data.subDistrict !== "string") {
                const error = new Error("El barrio es obligatorio");
                (error as any).statusCode = 400;
                throw error;
            }
        }

        if (!data.postalCode || typeof data.postalCode !== "string") {
            const error = new Error("El código postal es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        const postalCodeRegex = /^\d{4,8}$/;

        if (!postalCodeRegex.test(data.postalCode.trim())) {
            const error = new Error("El código postal es inválido");
            (error as any).statusCode = 400;
            throw error;
        }
    }


    static async getUserStatus(params: GetUserStatusParams) {
        const { authenticatedClerkId, userId } = params;

        if (!authenticatedClerkId) {
            const error = new Error("Usuario no autenticado");
            (error as any).statusCode = 401;
            throw error;
        }

        if (!ObjectId.isValid(userId)) {
            const error = new Error("ID de usuario inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        const authenticatedUser = await UserRepository.getUserByClerkId(authenticatedClerkId);

        if (!authenticatedUser) {
            const error = new Error("Usuario autenticado no encontrado en la base de datos");
            (error as any).statusCode = 404;
            throw error;
        }

        const allowedRoles = ["superadmin", "admin"];

        if (!allowedRoles.includes(authenticatedUser.role)) {
            const error = new Error("No tenés permisos para consultar el estado de usuarios");
            (error as any).statusCode = 403;
            throw error;
        }

        if (authenticatedUser.status !== "active") {
            const error = new Error("Tu usuario no está activo");
            (error as any).statusCode = 403;
            throw error;
        }

        const userObjectId = new ObjectId(userId);

        const user = await UserRepository.getUserById(userObjectId);

        if (!user) {
            const error = new Error("Usuario no encontrado");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser.role === "admin") {
            if (!authenticatedUser.municipalityId || !user.municipalityId) {
                const error = new Error("No tenés permisos para consultar este usuario");
                (error as any).statusCode = 403;
                throw error;
            }

            const sameMunicipality = authenticatedUser.municipalityId.equals(user.municipalityId);

            if (!sameMunicipality) {
                const error = new Error("No podés consultar usuarios de otro municipio");
                (error as any).statusCode = 403;
                throw error;
            }
        }

        return {
            status: user.status
        };
    }

    static async updateUserStatus(params: UpdateUserStatusParams) {
        const { authenticatedClerkId, userId, status } = params;

        if (!authenticatedClerkId) {
            const error = new Error("Usuario no autenticado");
            (error as any).statusCode = 401;
            throw error;
        }

        if (!ObjectId.isValid(userId)) {
            const error = new Error("ID de usuario inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!status) {
            const error = new Error("El estado es obligatorio");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!VALID_USER_STATUSES.includes(status)) {
            const error = new Error("Estado inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        /* if (!VALID_STATUS_TO_UPDATE.includes(status)) {
             const error = new Error("Estado inválido. Solo se permite active o inactive");
             (error as any).statusCode = 400;
             throw error;
         }*/

        const authenticatedUser = await UserRepository.getUserByClerkId(authenticatedClerkId);

        if (!authenticatedUser) {
            const error = new Error("Usuario autenticado no encontrado en la base de datos");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser.status !== "active") {
            const error = new Error("Tu usuario no está activo");
            (error as any).statusCode = 403;
            throw error;
        }

        const allowedRoles = ["superadmin", "admin"];

        if (!allowedRoles.includes(authenticatedUser.role)) {
            const error = new Error("No tenés permisos para actualizar estados de usuarios");
            (error as any).statusCode = 403;
            throw error;
        }

        const userObjectId = new ObjectId(userId);

        const userToUpdate = await UserRepository.getUserById(userObjectId);

        if (!userToUpdate) {
            const error = new Error("Usuario no encontrado");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser._id?.equals(userToUpdate._id!)) {
            const error = new Error("No podés modificar tu propio estado");
            (error as any).statusCode = 400;
            throw error;
        }

        if (authenticatedUser.role === "superadmin") {
            if (userToUpdate.role !== "admin") {
                const error = new Error("El superadmin solo puede cambiar el estado de administradores");
                (error as any).statusCode = 403;
                throw error;
            }
        }

        if (authenticatedUser.role === "admin") {
            if (userToUpdate.role !== "operator" && userToUpdate.role !== "citizen") {
                const error = new Error("El admin solo puede cambiar el estado de operarios o usuarios");
                (error as any).statusCode = 403;
                throw error;
            }

            if (!authenticatedUser.municipalityId || !userToUpdate.municipalityId) {
                const error = new Error("No tenés permisos para modificar este usuario");
                (error as any).statusCode = 403;
                throw error;
            }

            const sameMunicipality = authenticatedUser.municipalityId.equals(userToUpdate.municipalityId);

            if (!sameMunicipality) {
                const error = new Error("No podés modificar usuarios de otro municipio");
                (error as any).statusCode = 403;
                throw error;
            }
        }

        const allowedStatusesForTarget = VALID_STATUS_TO_UPDATE_BY_ROLE[userToUpdate.role];

        if (!allowedStatusesForTarget.includes(status)) {
            const error = new Error(
                userToUpdate.role === "citizen"
                    ? "Para usuarios solo se permite active o blocked"
                    : "Estado inválido. Solo se permite active o inactive"
            );
            (error as any).statusCode = 400;
            throw error;
        }

        const updatedUser = await UserRepository.updateUserStatus(userObjectId, status);

        if (!updatedUser) {
            const error = new Error("No se pudo actualizar el estado del usuario");
            (error as any).statusCode = 500;
            throw error;
        }

        return {
            message: "Estado actualizado correctamente",
            user: {
                id: updatedUser._id,
                status: updatedUser.status
            }
        };
    }

    static async getUserById(params: GetUserByIdParams) {
        const { authenticatedClerkId, userId } = params;

        if (!ObjectId.isValid(userId)) {
            const error = new Error("ID de usuario inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        const authenticatedUser = await UserRepository.getUserByClerkId(authenticatedClerkId);

        if (!authenticatedUser) {
            const error = new Error("Usuario autenticado no encontrado en la base de datos");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser.status !== "active") {
            const error = new Error("Tu usuario no está activo");
            (error as any).statusCode = 403;
            throw error;
        }

        const userObjectId = new ObjectId(userId);

        const user = await UserRepository.getUserById(userObjectId);

        if (!user) {
            const error = new Error("Usuario no encontrado");
            (error as any).statusCode = 404;
            throw error;
        }

        if (authenticatedUser.role === "superadmin") {
            return await this.getUserDetailForSuperadmin(user);
        }

        if (authenticatedUser.role === "admin") {
            return await this.getUserDetailForAdmin(authenticatedUser, user);
        }

        if (authenticatedUser.role === "citizen") {
            return this.getPublicUserDetail(user);
        }

        const error = new Error("No tenés permisos para consultar este usuario");
        (error as any).statusCode = 403;
        throw error;
    }

    private static async getUserDetailForSuperadmin(user: User) {
        if (user.role !== "admin") {
            const error = new Error("El superadmin solo puede consultar el detalle completo de administradores");
            (error as any).statusCode = 403;
            throw error;
        }

        const municipality = await this.getUserMunicipality(user);

        return {
            id: user._id?.toString(),
            name: user.name || null,
            email: user.email,
            role: user.role,
            status: user.status,
            municipality,
            photoUrl: user.photoUrl || null,
            createdAt: user.createdAt
        };
    }

    private static async getUserDetailForAdmin(authenticatedUser: User, user: User) {
        if (user.role !== "admin" && user.role !== "operator" && user.role !== "citizen") {
            const error = new Error("El admin solo puede consultar admins, operarios o usuarios");
            (error as any).statusCode = 403;
            throw error;
        }

        if (!authenticatedUser.municipalityId || !user.municipalityId) {
            const error = new Error("No tenés permisos para consultar este usuario");
            (error as any).statusCode = 403;
            throw error;
        }

        const sameMunicipality = authenticatedUser.municipalityId.equals(user.municipalityId);

        if (!sameMunicipality) {
            const error = new Error("No podés consultar usuarios de otro municipio");
            (error as any).statusCode = 403;
            throw error;
        }

        const municipality = await this.getUserMunicipality(user);

        return {
            id: user._id?.toString(),
            name: user.name || null,
            email: user.email,
            role: user.role,
            status: user.status,
            municipality,
            photoUrl: user.photoUrl || null,
            createdAt: user.createdAt,
            ...(user.role === "citizen" && {
                dni: user.dni || null,
                phone: user.phone || null,
                address: user.address || null,
                province: user.province || null,
                city: user.city || null,
                subDistrict: user.subDistrict || null,
                postalCode: user.postalCode || null
            })
        };
    }

    private static getPublicUserDetail(user: User) {
        if (user.status !== "active") {
            const error = new Error("Usuario no disponible");
            (error as any).statusCode = 404;
            throw error;
        }

        return {
            id: user._id?.toString(),
            name: user.name || null,
            photoUrl: user.photoUrl || null,
            role: user.role,
            createdAt: user.createdAt
        };
    }

    private static async getUserMunicipality(user: User) {
        if (!user.municipalityId) {
            return null;
        }

        const municipality = await MunicipalityRepository.getMunicipalityById(user.municipalityId.toString());

        if (!municipality) {
            return null;
        }

        return {
            id: municipality.id?.toString(),
            name: municipality.name
        };
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
        if (authenticatedUser.role === "superadmin" && data.role === "admin") {
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

    static async getCitizenStats(clerkUserId: string | null, groupBy: "day" | "week" | "month" = "month"): Promise<CitizenStatsResult> {
        if (!clerkUserId) throw new Error("Unauthenticated user");

        const authenticatedUser = await AuthService.getAuthenticatedUser(clerkUserId);

        if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(authenticatedUser.role)) {
            throw new Error("Insufficient permissions");
        }

        if (!authenticatedUser.municipalityId || !ObjectId.isValid(authenticatedUser.municipalityId)) {
            throw new Error("User must have a valid municipality");
        }

        return UserRepository.getCitizenStats(authenticatedUser.municipalityId, groupBy);
    }


}