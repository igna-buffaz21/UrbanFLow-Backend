import { Router } from "express";
import { MunicipalityController } from "../controllers/municipality.controller";

const router = Router();

router.get("/", MunicipalityController.getMunicipalities);
router.get("/:id", MunicipalityController.getMunicipalityById);
router.post("/", MunicipalityController.createMunicipality);

export default router;