import { Request, Response, NextFunction } from "express";
import { HealthService } from "../services/health.service";


export class HealthController {
    static async checkHealth(req: Request, res: Response, next: NextFunction) {
        try {
            const health = await HealthService.checkHealth();

            return res.json(health);
        } catch (err) {
            next(err);
        }
    }
}