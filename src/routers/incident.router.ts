import { Router } from "express";
import { IncidentsController } from "../controllers/incident.controller";

const router = Router()

router.get("/", IncidentsController.obtenerTodos)
router.post("/", IncidentsController.crear)
router.get("/map", IncidentsController.obtenerParaMapa)

export default router;