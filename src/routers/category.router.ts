import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requireAuth, CategoryController.getCategories);
router.post("/", requireAuth, CategoryController.createCategory);

export default router;