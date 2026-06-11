import { UserRole, UserStatus } from "../../../data/user.model";
import { ObjectId } from "mongodb";

export interface GetUsersFilters {
    role?: UserRole;
    status?: UserStatus;
    municipalityId?: ObjectId;
}