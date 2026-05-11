// src/routers/district.router.ts

import { Router } from "express";
import { DistrictController } from "../controllers/district.controller";

const router = Router();

// GET /districts
router.get("/", DistrictController.getDistricts);

// GET /districts/:id
router.get("/:id", DistrictController.getDistrictById);

export default router;