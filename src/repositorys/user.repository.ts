import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { User, UserRole, UserStatus } from "../data/user.model";

const USERS_COLLECTION = "users";
const MUNICIPALITIES_COLLECTION = "municipalities";

interface GetUsersFilters {
    role?: UserRole;
    status?: UserStatus;
    municipalityId?: ObjectId;
}

export class UserRepository {
    static async createUser(user: User): Promise<User> {
        try {
            const db = mongoDb();

            const result = await db.collection<User>(USERS_COLLECTION).insertOne(user);

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

            return await db.collection<User>(USERS_COLLECTION).findOne({
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

            return await db.collection<User>(USERS_COLLECTION).findOne({
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

            return await db.collection<User>(USERS_COLLECTION).findOne({ _id: id });
        } 
        catch (err) {
            throw new Error("Error al obtener el usuario por ID: " + err);
        }
    }

    static async getPendingUserByEmail(email: string): Promise<User | null> {
    try {
        const db = mongoDb();

        return await db.collection<User>(USERS_COLLECTION).findOne({
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

            const result = await db.collection<User>(USERS_COLLECTION).findOneAndUpdate(
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

    static async getUsers(filters: GetUsersFilters) {
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

            return await db.collection<User>(USERS_COLLECTION)
                .aggregate([
                    {
                        $match: match
                    },
                    {
                        $lookup: {
                            from: MUNICIPALITIES_COLLECTION,
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
                ])
                .toArray();
        } 
        catch (err) {
            throw new Error("Error al obtener los usuarios: " + err);
        }
    }

    static async updateUserStatus(id: ObjectId, status: UserStatus): Promise<User | null> {
        try {
            const db = mongoDb();

            const updatedUser = await db.collection<User>(USERS_COLLECTION).findOneAndUpdate(
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

}