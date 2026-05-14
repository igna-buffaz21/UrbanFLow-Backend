import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "../services/incident.service";


export class IncidentsController {
    static async crear(req: Request, res: Response, next: NextFunction) {
        try {
            const citizenId = req.body.createdBy;
            // Provisorio hasta integrar Clerk

            const newIncident = await IncidentsService.crear(req.body, citizenId);

            res.status(201).json(newIncident);
        } catch (err) {
            next(err);
        }
    }

    static async obtenerTodos(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                status: req.query.status as string,
                priority: req.query.priority as string,
                categoryId: req.query.categoryId as string,
                assignedTo: req.query.assignedTo as string,
            }; 

            const adminMunicipalityId = req.query.municipalityId as string; 

            const incidents = await IncidentsService.obtenerTodos(filters, adminMunicipalityId);
            res.json(incidents);
        } catch (err) {
            next(err);
        }
    }

    static async obtenerParaMapa(req: Request, res: Response, next: NextFunction) {
        try {
            const municipalityId = req.query.municipalityId as string;

            const incidents = await IncidentsService.obtenerParaMapa(municipalityId);
            res.json(incidents);
        } catch (err) {
            next(err);
        }
    }
}
