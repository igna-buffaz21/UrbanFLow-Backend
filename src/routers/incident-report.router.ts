import { Router } from "express";
import { IncidentReportController } from "../controllers/incident.report.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/reports/me",
  requireAuth,
  IncidentReportController.getMyReports
);

router.get(
  "/:id/report",
  requireAuth,
  IncidentReportController.getReportByIncidentId
);

router.post(
  "/:id/report",
  requireAuth,
  IncidentReportController.createReport
);

router.delete(
  "/:id/report",
  requireAuth,
  IncidentReportController.deleteReport
);



export default router;