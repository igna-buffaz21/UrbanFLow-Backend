import { Request, Response, NextFunction } from "express";
import { DistrictService } from "../services/district.service";

export class DistrictController {

    static async getDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const districts = await DistrictService.getDistricts();
            res.status(200).json(districts);
        } catch (err) {
            next(err);


        }

    }

    static async getDistrictById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const district = await DistrictService.getDistrictById({ id });
            res.status(200).json(district);
        } catch (err) {
            next(err);
        }
    }

    static async createDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, polygon } = req.body;
            const district = await DistrictService.createDistrict({ name, polygon });
            res.status(201).json(district);
        } catch (err) {
            next(err);
        }
    }

}