import { UserRole, UserStatus } from "../../../data/user.model";
import { ObjectId } from "mongodb";

export interface GetUsersFilters {
    role?: UserRole;
    status?: UserStatus;
    municipalityId?: ObjectId;
}

export interface CitizenStatItem {
    userId: string;
    name: string;
    email: string;
    photoUrl: string | null;
    totalIncidents: number;
    openIncidents: number;
    closedIncidents: number;
    rejectedIncidents: number;
}

export interface CitizenStatsResult {
    totalCitizens: number;
    activeCitizens: number;
    blockedCitizens: number;
    newThisMonth: number;
    registrationByMonth: { period: string; total: number }[];
    topReporters: CitizenStatItem[];
}