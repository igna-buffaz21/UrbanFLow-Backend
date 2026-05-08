import { ObjectId } from "mongodb";

export type UserRole = "superadmin" | "admin" | "operator" | "citizen";

export type UserStatus = "active" | "inactive" | "blocked";

export interface User {
    _id?: ObjectId;

    clerkId: string;

    name: string;
    email: string;
    photoUrl?: string;

    role: UserRole;
    status: UserStatus;

    municipalityId?: ObjectId;

    createdAt: Date;
    updatedAt: Date;
}