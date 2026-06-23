import { Router } from "express";
import { UsersController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware"; 

const router = Router()

router.post("/", requireAuth, UsersController.createUser);
router.post("/invite", requireAuth,UsersController.inviteUser);
router.get("/", requireAuth, UsersController.getUsers);
router.patch("/me/profile", requireAuth, UsersController.updateMyProfile);
router.get("/:id/status", requireAuth,UsersController.getUserStatus);
router.patch("/:id/status", requireAuth, UsersController.updateUserStatus);
router.get("/:id", requireAuth, UsersController.getUserById);


export default router;