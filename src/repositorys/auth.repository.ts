import { mongoDb } from "../config/mongodb.config";
import { User } from "../data/user.model";

const USERS_COLLECTION = "users";

export class AuthRepository {
    static async getUserByClerkId(clerkId: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(USERS_COLLECTION).findOne({
                clerkId
            });
        } 
        catch (err) {
            throw new Error("Error al obtener el usuario autenticado: " + err);
        }
    }
}