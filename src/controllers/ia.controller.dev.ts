import type { Request, Response, NextFunction } from "express";

import { AiService } from "../services/ia.service";

export class AiController {
  static async validateIncident(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { title, description } = req.body;

      if (!title || !description) {
        res.status(400).json({
          message: "El título y la descripción son obligatorios",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          message: "La imagen es obligatoria",
        });
        return;
      }

      const imageBase64 = req.file.buffer.toString("base64");

      const result = await AiService.validateIncident({
        title,
        description,
        imageBase64,
        mimeType: req.file.mimetype,
      });

      res.status(200).json({
        message: "Incidente analizado correctamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}