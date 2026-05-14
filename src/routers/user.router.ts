import { Router } from "express";
import { UsersController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware"; 

const router = Router()

router.post("/", requireAuth, UsersController.createUser);
router.post("/invite", requireAuth,UsersController.inviteUser);
router.get("/", UsersController.getUsers);

export default router;