import { Request, Response, NextFunction } from "express";
import { SystemService } from "../services/system.service";

export class SystemController {
    static async getOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const overview = await SystemService.getOverview();

            return res.json(overview);
        }
        catch (err) {
            next(err);
        }
    }

    static async getCurrent(req: Request, res: Response, next: NextFunction) {
        try {
            const current = await SystemService.getCurrent();

            return res.json(current);
        }
        catch (err) {
            next(err);
        }
    }

    static async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const history = await SystemService.getHistory(req.query);

            return res.json(history);
        }
        catch (err) {
            next(err);
        }
    }
}
