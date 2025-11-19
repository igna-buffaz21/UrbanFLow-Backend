import { UsuariosRepository } from "../repositorys/user.repository";

export class UsuariosService {
    static async obtenerTodos() {
        return await UsuariosRepository.obtenerTodos();
    }
}