import { Request, Response, NextFunction } from "express";
import { MunicipalityService } from "../services/municipality.service";

export class MunicipalityController {

    static async getMunicipalities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, districtId } = req.query;

            const municipalities = await MunicipalityService.getMunicipalities({
                status: status as string | undefined,
                districtId: districtId as string | undefined,
            });

            res.status(200).json(municipalities);
        } catch (err) {
            next(err);
        }
    }

    static async getMunicipalityById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const municipality = await MunicipalityService.getMunicipalityById(id);

            res.status(200).json(municipality);
        } catch (err) {
            next(err);
        }
    }

    static async createMunicipality(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, districtId, status } = req.body;

            const municipality = await MunicipalityService.createMunicipality({
                name,
                districtId,
                status,
            });

            res.status(201).json(municipality);
        } catch (err) {
            next(err);
        }
    }
}