import { Router } from "express";
//import multer from "multer";

//import { AiController } from "../controllers/ia.controller.dev";

const router = Router();

/*const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});*/

/*router.post(
  "/validate-incident",
  upload.single("image"),
  AiController.validateIncident
);*/

export default router;