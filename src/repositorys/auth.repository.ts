import { mongoDb } from "../config/mongodb.config";
import { User } from "../data/user.model";
import { COLLECTION_NAMES } from "../data/types/global/const.global";

export class AuthRepository {
    static async getUserByClerkId(clerkId: string): Promise<User | null> {
        try {
            const db = mongoDb();

            return await db.collection<User>(COLLECTION_NAMES.USERS).findOne({
                clerkId
            });
        } 
        catch (err) {
            throw new Error("Error al obtener el usuario autenticado: " + err);
        }
    }
}