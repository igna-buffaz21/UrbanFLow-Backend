import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.get("/me", AuthController.getAuthenticatedUser);

export default router;