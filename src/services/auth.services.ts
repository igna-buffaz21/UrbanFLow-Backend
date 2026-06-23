import { clerkClient } from "@clerk/express";
import { UserService } from "./user.service";
import { User, UserRole, UserStatus } from "../data/user.model";

const VALID_USER_ROLES: UserRole[] = ["superadmin", "admin", "operator", "citizen"];
const VALID_USER_STATUSES: UserStatus[] = ["pending", "active", "inactive", "blocked"];

export class AuthService {
    static async getAuthenticatedUser(clerkId: string) {
        if (!clerkId || typeof clerkId !== "string") {
            const error = new Error("Clerk ID inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        let user = await UserService.getUserByClerkId(clerkId);

        if (!user) {
            user = await this.resolveFirstLoginUser(clerkId);
        }

        this.validateUserAccess(user);

        return this.mapAuthenticatedUserResponse(user);
    }

    private static async resolveFirstLoginUser(clerkId: string): Promise<User> {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        const primaryEmail = clerkUser.emailAddresses.find(
            email => email.id === clerkUser.primaryEmailAddressId
        );

        if (!primaryEmail?.emailAddress) {
            const error = new Error("El usuario no tiene un email válido en Clerk");
            (error as any).statusCode = 400;
            throw error;
        }

        const email = primaryEmail.emailAddress.trim().toLowerCase();

        const pendingUser = await UserService.getPendingUserByEmail(email);

        if (pendingUser) {
            return await UserService.activatePendingUser(pendingUser._id!, {
                clerkId,
                name: this.buildUserName(clerkUser.firstName, clerkUser.lastName),
                photoUrl: clerkUser.imageUrl
            });
        }

        return await UserService.createUserEntity({
            clerkId,
            name: this.buildUserName(clerkUser.firstName, clerkUser.lastName),
            email,
            photoUrl: clerkUser.imageUrl,
            role: "citizen",
            status: "active"
        });
    }

    private static buildUserName(firstName: string | null, lastName: string | null): string {
        const fullName = `${firstName || ""} ${lastName || ""}`.trim();

        return fullName || "Usuario sin nombre";
    }

    private static validateUserAccess(user: User) {
        if (!VALID_USER_ROLES.includes(user.role)) {
            const error = new Error("El usuario tiene un rol inválido");
            (error as any).statusCode = 403;
            throw error;
        }

        if (!VALID_USER_STATUSES.includes(user.status)) {
            const error = new Error("El usuario tiene un estado inválido");
            (error as any).statusCode = 403;
            throw error;
        }

        if (user.status === "pending") {
            const error = new Error("El usuario todavía no fue activado");
            (error as any).statusCode = 403;
            throw error;
        }

        if (user.status === "inactive") {
            const error = new Error("El usuario está inactivo");
            (error as any).statusCode = 403;
            throw error;
        }

        if (user.status === "blocked") {
            const error = new Error("El usuario está bloqueado");
            (error as any).statusCode = 403;
            throw error;
        }

        if ((user.role === "admin" || user.role === "operator") && !user.municipalityId) {
            const error = new Error("El usuario no tiene municipio asignado");
            (error as any).statusCode = 403;
            throw error;
        }
    }

    private static mapAuthenticatedUserResponse(user: User) {
        return {
            id: user._id?.toString(),
            clerkId: user.clerkId,
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
            role: user.role,
            status: user.status,
            municipalityId: user.municipalityId?.toString(),
            isProfileCompleted: user.isProfileCompleted ?? false
        };
    }
}