import { Router } from "express";
import { MunicipalityController } from "../controllers/municipality.controller";

const router = Router();

router.get("/", MunicipalityController.getMunicipalities);

export default router;