import { Router } from "express";
import { IncidentsController } from "../controllers/incident.controller";
import { requireAuth } from "../middlewares/auth.middleware"; 

const router = Router()

router.get("/", requireAuth, IncidentsController.obtenerTodos)
router.post("/", requireAuth, IncidentsController.crear)
router.get("/map", requireAuth, IncidentsController.obtenerParaMapa)

export default router;