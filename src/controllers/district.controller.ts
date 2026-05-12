import { Request, Response, NextFunction } from "express";
import { DistrictService } from "../services/district.service";

export class DistrictController {

    // GET /districts
    // No recibe parámetros, simplemente devuelve todos los distritos sin polygon
    static async getDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const districts = await DistrictService.getDistricts();
            res.status(200).json(districts);
        } catch (err) {
            // next(err) le pasa el error al middleware global de errores en index.ts
            // El middleware se encarga de responder con el statusCode correcto
            next(err);


        }

    }

    // GET /districts/:id
    // El id llega por param: /districts/abc123
    static async getDistrictById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const district = await DistrictService.getDistrictById({ id });
            res.status(200).json(district);
        } catch (err) {
            next(err);
        }
    }
    // POST /districts
    // Los datos llegan por body
    static async createDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, polygon } = req.body;
            const district = await DistrictService.createDistrict({ name, polygon });
            // 201 = Created, es el código correcto para un POST exitoso
            res.status(201).json(district);
        } catch (err) {
            next(err);
        }
    }

}