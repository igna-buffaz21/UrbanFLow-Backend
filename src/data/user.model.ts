import { ObjectId } from "mongodb";

export type UserRole = "superadmin" | "admin" | "operator" | "citizen";

export type UserStatus = "pending" | "active" | "inactive" | "blocked";

export interface User {
    _id?: ObjectId;

    clerkId?: string;
    clerkInvitationId?: string;
    name?: string;

    email: string;
    photoUrl?: string;

    role: UserRole;
    status: UserStatus;

    municipalityId?: ObjectId;

    createdAt: Date;
    updatedAt: Date;

    dni?: string;
    phone?: string;
    address?: string;
    province?: string;
    city?: string;
    subDistrict?: string;
    postalCode?: string;
    isProfileCompleted?: boolean;
}

