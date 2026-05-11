import { Request, Response, NextFunction } from "express";
import { MunicipalityService } from "../services/municipality.service";

export class MunicipalityController {
    static async getMunicipalities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, districtId } = req.query;

            // Pasamos un solo objeto con los filtros
            const municipalities = await MunicipalityService.getMunicipalities({
                status: status as string | undefined,
                districtId: districtId as string | undefined,
            });

            res.status(200).json(municipalities);
        } catch (err) {
            next(err);
        }
    }
}