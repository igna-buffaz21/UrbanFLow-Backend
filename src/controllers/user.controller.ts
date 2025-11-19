import { Request, Response, NextFunction } from "express";
import { UsuariosService } from "../services/user.service";


export class UsuariosController {
    static async obtenerTodos(req: Request, res: Response, next: NextFunction) {
        try {
            const usuarios = await UsuariosService.obtenerTodos();
            res.json(usuarios);
        } catch (err) {
            next(err);
        }
    }
}