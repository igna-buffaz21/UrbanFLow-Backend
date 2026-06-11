import type { Request, Response, NextFunction } from "express";

import { AiService } from "../services/ia.service";

export class AiController {
  static async validateIncident(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { title, description, lng, lat } = req.body;

      if (!title || !description) {
        res.status(400).json({
          message: "El título y la descripción son obligatorios",
        });
        return;
      }

      if (!lng || !lat) {
        res.status(400).json({
          message: "La longitud y la latitud son obligatorias",
        });
        return;
      }

      const parsedLng = Number(lng);
      const parsedLat = Number(lat);

      if (Number.isNaN(parsedLng) || Number.isNaN(parsedLat)) {
        res.status(400).json({
          message: "Las coordenadas son inválidas",
        });
        return;
      }

      if (parsedLng < -180 || parsedLng > 180) {
        res.status(400).json({
          message: "La longitud es inválida",
        });
        return;
      }

      if (parsedLat < -90 || parsedLat > 90) {
        res.status(400).json({
          message: "La latitud es inválida",
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

      const result = await AiService.validateIncidentDEV({
        title,
        description,
        lng: parsedLng,
        lat: parsedLat,
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