import { Router } from "express";
import { IncidentsController } from "../controllers/incident.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { uploadIncidentImage } from "../middlewares/upload.middleware";

const router = Router()

router.get("/feed", IncidentsController.getFeed);
router.get("/me", requireAuth, IncidentsController.obtenerMisIncidentes)
router.get("/assigned", requireAuth, IncidentsController.obtenerAsignados);
router.get("/", requireAuth, IncidentsController.obtenerTodos)
router.get("/history", requireAuth, IncidentsController.getClosedIncidentsHistory);
router.get("/stats/frequency", requireAuth, IncidentsController.getFrequencyStats);
router.get("/stats/frequency/:municipalityId", requireAuth, IncidentsController.getFrequencyStats);
router.get("/stats/resolution", requireAuth, IncidentsController.getResolutionMetrics);
router.get("/stats/resolution/:municipalityId", requireAuth, IncidentsController.getResolutionMetrics);
router.patch("/:id/assign-operator", requireAuth, IncidentsController.asignarOperador);
router.patch("/:id/status", requireAuth, uploadIncidentImage.single("image"), IncidentsController.actualizarEstado);
router.patch("/:id/priority", requireAuth, IncidentsController.actualizarPrioridad);
router.patch("/:id/resolve", requireAuth, IncidentsController.resolverIncidente);
router.get("/map", requireAuth, IncidentsController.getMap);
router.get("/:id", requireAuth, IncidentsController.getDetailById);
router.post(
  "/",
  requireAuth,
  uploadIncidentImage.single("image"),
  IncidentsController.createIncident
);
router.post(
  "/pending/:pendingIncidentId/resolve-duplicate",
  requireAuth,
  IncidentsController.resolvePendingIncidentDuplicate
);

export default router;