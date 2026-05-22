import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { MunicipalityService } from "../services/municipality.service";

export class MunicipalityController {

    static async getMunicipalities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { status, districtId } = req.query;

            const municipalities = await MunicipalityService.getMunicipalities(userId!, {
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
            const { userId } = getAuth(req);
            const { id } = req.params;
            const municipality = await MunicipalityService.getMunicipalityById(userId!, id);
            res.status(200).json(municipality);
        } catch (err) {
            next(err);
        }
    }

    static async createMunicipality(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { name, districtId, status } = req.body;

            const municipality = await MunicipalityService.createMunicipality(userId!, {
                name,
                districtId,
                status,
            });

            res.status(201).json(municipality);
        } catch (err) {
            next(err);
        }
    }

    static async updateMunicipality(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { id } = req.params;
            const { name, districtId, status } = req.body;

            const municipality = await MunicipalityService.updateMunicipality(userId!, id, {
                name,
                districtId,
                status,
            });

            res.status(200).json(municipality);
        } catch (err) {
            next(err);
        }
    }
}