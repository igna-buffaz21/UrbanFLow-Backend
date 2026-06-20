// src/controllers/sub-district.controller.ts

import { Request, Response } from "express";
import { SubDistrictService } from "../services/sub-districts.service";

export class SubDistrictController {
  static async createBulk(req: Request, res: Response) {
    try {
      const { municipalityId } = req.params;

      const result = await SubDistrictService.createBulk({
        municipalityId,
        featureCollection: req.body,
      });

      return res.status(201).json({
        message: "Subdistritos creados correctamente",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error al crear subdistritos",
      });
    }
  }

  static async getByMunicipalityId(req: Request, res: Response) {
    try {
      const { municipalityId } = req.params;

      const result = await SubDistrictService.getByMunicipalityId(
        municipalityId
      );

      return res.status(200).json({
        message: "Subdistritos obtenidos correctamente",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener subdistritos",
      });
    }
  }
}