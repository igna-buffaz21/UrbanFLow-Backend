import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { User } from "../data/user.model";

const USERS_COLLECTION = "users";

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

    static async getUserById(userId: ObjectId): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(USERS_COLLECTION).findOne({
                _id: userId
            });
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
}