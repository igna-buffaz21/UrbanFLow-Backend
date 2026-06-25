import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { User, UserRole, UserStatus } from "../data/user.model";
import { GetUsersFilters, CitizenStatItem, CitizenStatsResult } from "../data/types/user/user.type";
import { COLLECTION_NAMES } from "../data/types/global/const.global";

export class UserRepository {
    static async createUser(user: User): Promise<User> {
        try {
            const db = mongoDb();

            const result = await db.collection<User>(COLLECTION_NAMES.USERS).insertOne(user);

            return {
                ...user,
                _id: result.insertedId
            };
        }
        catch (err) {
            throw new Error("Error al crear el usuario: " + err);
        }
    }

    static async getUserByClerkId(clerkId: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({
                clerkId
            });
        }
        catch (err) {
            throw new Error("Error al obtener el usuario por Clerk ID: " + err);
        }
    }

    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({
                email
            });
        }
        catch (err) {
            throw new Error("Error al obtener el usuario por email: " + err);
        }
    }

    static async getUserById(id: ObjectId): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({ _id: id });
        }
        catch (err) {
            throw new Error("Error al obtener el usuario por ID: " + err);
        }
    }

    static async getPendingUserByEmail(email: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({
                email,
                status: "pending"
            });
        }
        catch (err) {
            throw new Error("Error al obtener el usuario pendiente por email: " + err);
        }
    }

    static async activatePendingUser(
        userId: ObjectId,
        data: {
            clerkId: string;
            name: string;
            photoUrl?: string;
        }
    ): Promise<User | null> {
        try {
            const db = mongoDb();

            const result = await db.collection<User>(COLLECTION_NAMES.USERS).findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        clerkId: data.clerkId,
                        name: data.name,
                        photoUrl: data.photoUrl,
                        status: "active",
                        updatedAt: new Date()
                    }
                },
                { returnDocument: "after" }
            );

            return result;
        }
        catch (err) {
            throw new Error("Error al activar el usuario pendiente: " + err);
        }
    }

    static async getUsers(filters: GetUsersFilters, pagination?: { page: number; limit: number }) {
        try {
            const db = mongoDb();

            const match: any = {};

            if (filters.role) {
                match.role = filters.role;
            }

            if (filters.status) {
                match.status = filters.status;
            }

            if (filters.municipalityId) {
                match.municipalityId = filters.municipalityId;
            }

            const pipeline: any[] = [
                {
                    $match: match
                },
                {
                    $lookup: {
                        from: COLLECTION_NAMES.MUNICIPALITIES,
                        localField: "municipalityId",
                        foreignField: "_id",
                        as: "municipality"
                    }
                },
                {
                    $unwind: {
                        path: "$municipality",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: {
                            $toString: "$_id"
                        },
                        name: 1,
                        email: 1,
                        role: 1,
                        status: 1,
                        photoUrl: 1,
                        createdAt: 1,
                        dni: 1,
                        phone: 1,
                        address: 1,
                        province: 1,
                        city: 1,
                        subDistrict: 1,
                        postalCode: 1,
                        municipality: {
                            $cond: [
                                "$municipality",
                                {
                                    id: {
                                        $toString: "$municipality._id"
                                    },
                                    name: "$municipality.name"
                                },
                                null
                            ]
                        }
                    }
                }
            ];

            if (!pagination) {
                return await db.collection<User>(COLLECTION_NAMES.USERS)
                    .aggregate(pipeline)
                    .toArray();
            }

            const { page, limit } = pagination;
            const skip = (page - 1) * limit;

            const result = await db.collection<User>(COLLECTION_NAMES.USERS)
                .aggregate([
                    ...pipeline,
                    {
                        $facet: {
                            data: [{ $skip: skip }, { $limit: limit }],
                            totalCount: [{ $count: "count" }]
                        }
                    }
                ])
                .toArray();

            const data = result[0]?.data ?? [];
            const total = result[0]?.totalCount[0]?.count ?? 0;

            return { data, total };
        }
        catch (err) {
            throw new Error("Error al obtener los usuarios: " + err);
        }
    }


    static async updateMyProfile(clerkId: string, data: Partial<User>): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOneAndUpdate(
                { clerkId },
                { $set: data },
                { returnDocument: "after" }
            );
        }
        catch (err) {
            throw new Error("Error al actualizar el perfil del usuario: " + err);
        }

    }

    static async getUserByDni(dni: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({
                dni
            });
        }
        catch (err) {
            throw new Error("Error al obtener el usuario por DNI: " + err);
        }
    }

    static async updateUserStatus(id: ObjectId, status: UserStatus): Promise<User | null> {
        try {
            const db = mongoDb();

            const updatedUser = await db.collection<User>(COLLECTION_NAMES.USERS).findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        status,
                        updatedAt: new Date()
                    }
                },
                {
                    returnDocument: "after"
                }
            );

            return updatedUser;
        }
        catch (err) {
            throw new Error("Error al actualizar el estado del usuario: " + err);
        }
    }

    static async updateByClerkId(clerkId: string, data: Partial<User>): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOneAndUpdate(
            { clerkId },
            { $set: data },
            { returnDocument: "after" }
            );
        } catch (err) {
            throw new Error("Error al sincronizar usuario desde Clerk: " + err);
        }
    }

    static async getCitizenStats(municipalityId: string, groupBy: "day" | "week" | "month" = "month"): Promise<CitizenStatsResult> {
        const db = mongoDb();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const registrationDateFilter = groupBy === "day"
            ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : groupBy === "week"
                ? new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000)
                : new Date(now.getFullYear() - 1, now.getMonth(), 1);

        const [overallResult, registrationResult, topReportersResult] = await Promise.all([
            // Overall — sin filtro de fecha ni groupBy
            db.collection(COLLECTION_NAMES.USERS).aggregate([
                { $match: { role: "citizen", municipalityId: new ObjectId(municipalityId) } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                        blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
                        newThisMonth: { $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, 1, 0] } },
                    }
                }
            ]).toArray(),

            // Registros agrupados por groupBy
            db.collection(COLLECTION_NAMES.USERS).aggregate([
                {
                    $match: {
                        role: "citizen",
                        municipalityId: new ObjectId(municipalityId),
                        createdAt: { $gte: registrationDateFilter }
                    }
                },
                {
                    $group: {
                        _id: groupBy === "day"
                            ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } }
                            : groupBy === "week"
                                ? { year: { $isoWeekYear: "$createdAt" }, week: { $isoWeek: "$createdAt" } }
                                : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: groupBy === "day"
                        ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
                        : groupBy === "week"
                            ? { "_id.year": 1, "_id.week": 1 }
                            : { "_id.year": 1, "_id.month": 1 }
                },
                {
                    $project: {
                        _id: 0,
                        period: groupBy === "day"
                            ? {
                                $concat: [
                                    { $toString: "$_id.year" }, "-",
                                    { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }, "-",
                                    { $cond: [{ $lt: ["$_id.day", 10] }, { $concat: ["0", { $toString: "$_id.day" }] }, { $toString: "$_id.day" }] },
                                ]
                            }
                            : groupBy === "week"
                                ? {
                                    $concat: [
                                        { $toString: "$_id.year" }, "-W",
                                        { $cond: [{ $lt: ["$_id.week", 10] }, { $concat: ["0", { $toString: "$_id.week" }] }, { $toString: "$_id.week" }] },
                                    ]
                                }
                                : {
                                    $concat: [
                                        { $toString: "$_id.year" }, "-",
                                        { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] }
                                    ]
                                },
                        total: "$total"
                    }
                }
            ]).toArray(),

            // Top reporters — join con incidents
            db.collection(COLLECTION_NAMES.USERS).aggregate([
                { $match: { role: "citizen", municipalityId: new ObjectId(municipalityId) } },
                {
                    $lookup: {
                        from: COLLECTION_NAMES.INCIDENTS,
                        localField: "_id",
                        foreignField: "createdBy",
                        as: "incidents"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: { $toString: "$_id" },
                        name: { $ifNull: ["$name", "Sin nombre"] },
                        email: 1,
                        photoUrl: { $ifNull: ["$photoUrl", null] },
                        totalIncidents: { $size: "$incidents" },
                        openIncidents: {
                            $size: {
                                $filter: { input: "$incidents", as: "i", cond: { $eq: ["$$i.status", "open"] } }
                            }
                        },
                        closedIncidents: {
                            $size: {
                                $filter: { input: "$incidents", as: "i", cond: { $eq: ["$$i.status", "closed"] } }
                            }
                        },
                        rejectedIncidents: {
                            $size: {
                                $filter: { input: "$incidents", as: "i", cond: { $eq: ["$$i.status", "rejected"] } }
                            }
                        },
                    }
                },
                { $match: { totalIncidents: { $gt: 0 } } },
                { $sort: { totalIncidents: -1 } },
                { $limit: 10 }
            ]).toArray(),
        ]);

        const overall = overallResult[0] ?? { total: 0, active: 0, blocked: 0, newThisMonth: 0 };

        return {
            totalCitizens: overall.total,
            activeCitizens: overall.active,
            blockedCitizens: overall.blocked,
            newThisMonth: overall.newThisMonth,
            registrationByMonth: (registrationResult as any[]).filter(r => r?.period != null),
            topReporters: topReportersResult as CitizenStatItem[],
        };
    }

}