import { Router } from "express";
import { IncidentsController } from "../controllers/incident.controller";
import { requireAuth } from "../middlewares/auth.middleware"; 

const router = Router()

/*
router.get("/", requireAuth, IncidentsController.obtenerTodos)
router.post("/", requireAuth, IncidentsController.crear)
router.get("/map", requireAuth, IncidentsController.obtenerParaMapa)
*/

router.get("/", IncidentsController.obtenerTodos)
router.post("/", IncidentsController.crear)
router.get("/map", IncidentsController.obtenerParaMapa)

export default router;