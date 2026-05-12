import { mongoDb } from "../config/mongodb.config";

export class HealthService {
    static async checkHealth() {
        const db = mongoDb();

        const mongoPing = await db.command({ ping: 1 });

        return {
            mensaje: "Servidor funcionando correctamente",
            fecha_servidor: new Date(),
            mongo_ping: mongoPing.ok
        };
    }
}