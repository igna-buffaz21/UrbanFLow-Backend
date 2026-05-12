import { Router } from "express";
import { MunicipalityController } from "../controllers/municipality.controller";
import { requireAuth } from "../middlewares/auth.middleware"; 

const router = Router();

router.get("/", requireAuth, MunicipalityController.getMunicipalities);
router.get("/:id", requireAuth, MunicipalityController.getMunicipalityById);
router.post("/", requireAuth, MunicipalityController.createMunicipality);

export default router;