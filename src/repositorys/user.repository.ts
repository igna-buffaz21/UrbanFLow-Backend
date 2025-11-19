import { mysqlPool } from "../config/db.config";

export class UsuariosRepository {
    static async obtenerTodos() {
        try {
            const [rows] = await mysqlPool.query("SELECT * FROM usuarios ORDER BY id");
            return rows
        }
        catch (err) {
            throw new Error("Error al obtener los usuarios" + err)
        }

    }
}