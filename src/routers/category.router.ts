import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", CategoryController.getCategories);
router.post("/", CategoryController.createCategory);

export default router;