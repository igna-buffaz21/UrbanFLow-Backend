import { Router } from "express";
import { IncidentsController } from "../controllers/incident.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { uploadIncidentImage } from "../middlewares/upload.middleware";

const router = Router()

router.post("/", requireAuth, uploadIncidentImage.single("image"), IncidentsController.crear);

router.post("/", requireAuth, IncidentsController.crear)
router.get("/me", requireAuth, IncidentsController.obtenerMisIncidentes)
router.get("/assigned", requireAuth, IncidentsController.obtenerAsignados);
router.get("/", requireAuth, IncidentsController.obtenerTodos)
router.get("/map", requireAuth, IncidentsController.getMap);
router.patch("/:id/assign-operator", requireAuth, IncidentsController.asignarOperador);
router.patch("/:id/status", requireAuth, IncidentsController.actualizarEstado);
router.patch("/:id/priority", requireAuth, IncidentsController.actualizarPrioridad);
router.get("/:id", requireAuth, IncidentsController.obtenerPorId);


export default router;