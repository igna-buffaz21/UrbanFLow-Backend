import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { IncidentsService } from "../services/incident.service";

export class IncidentsController {
    static async crear(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const newIncident = await IncidentsService.crear(
                req.body,
                userId,
                req.file
            );

            res.status(201).json(newIncident);
        } catch (err) {
            next(err);
        }
    }


    static async obtenerMisIncidentes(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const status = req.query.status as string;

            const incidents = await IncidentsService.obtenerMisIncidentes(userId, status);

            res.json(incidents);
        } catch (err) {
            next(err);
        }
    }


    static async obtenerAsignados(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const filters = {
                status: req.query.status as string,
                priority: req.query.priority as string,
            };

            const incidents = await IncidentsService.obtenerAsignados(userId, filters);

            res.json(incidents);
        } catch (err) {
            next(err);
        }
    }


    static async obtenerTodos(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const filters = {
                status: req.query.status as string,
                priority: req.query.priority as string,
                categoryId: req.query.categoryId as string,
                assignedTo: req.query.assignedTo as string,
            };

            const incidents = await IncidentsService.obtenerTodos(filters, userId);

            res.json(incidents);
        } catch (err) {
            next(err);
        }
    }


    static async getMap(req: Request, res: Response, next: NextFunction) {
        try {
            const clerkUserId = getAuth(req).userId || null;

            const incidents = await IncidentsService.getMap(
                clerkUserId,
                req.query
            );

            res.status(200).json(incidents);
        } catch (err) {
            next(err);
        }
    }


    static async asignarOperador(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;
            const operatorId = req.body.operatorId;

            const incident = await IncidentsService.asignarOperador(
                userId,
                incidentId,
                operatorId
            );

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }


    static async actualizarEstado(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;
            const status = req.body.status;

            const incident = await IncidentsService.actualizarEstado(
                userId,
                incidentId,
                status
            );

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }


    static async actualizarPrioridad(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;
            const priority = req.body.priority;

            const incident = await IncidentsService.actualizarPrioridad(
                userId,
                incidentId,
                priority
            );

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }


    static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;

            const incident = await IncidentsService.obtenerPorId(userId, incidentId);

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }
}