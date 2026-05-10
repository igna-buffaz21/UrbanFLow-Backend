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
}