import { Router } from "express";
import { UsuariosController } from "../controllers/user.controller";

const router = Router()

router.get("/", UsuariosController.obtenerTodos)

export default router;