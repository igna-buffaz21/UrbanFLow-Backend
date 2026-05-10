import { Router } from "express";
import { UsersController } from "../controllers/user.controller";

const router = Router()

router.post("/", UsersController.createUser);

export default router;