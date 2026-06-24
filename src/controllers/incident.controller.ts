import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { IncidentsService } from "../services/incident.service";

export class IncidentsController {
    static async createIncident(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            console.log("Creating incident with data:", req.body, "and file:", req.file);

            const newIncident = await IncidentsService.createIncident(
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
            const rejectionReason = req.body.rejectionReason;

            const incident = await IncidentsService.actualizarEstado(
                userId,
                incidentId,
                status,
                req.file,
                rejectionReason
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

    static async resolverIncidente(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;

            const incident = await IncidentsService.resolverIncidente(
                userId,
                incidentId,
                req.body
            );

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }

    static async getDetailById(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const incidentId = req.params.id;

            const incident = await IncidentsService.getDetailById(userId, incidentId);

            res.json(incident);
        } catch (err) {
            next(err);
        }
    }

    static async resolvePendingIncidentDuplicate(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { pendingIncidentId } = req.params;
            const { action } = req.body;
            const { userId } = getAuth(req);

            console.log("pendingIncidentId:", req.params.pendingIncidentId);
            console.log("action:", req.body.action);
            console.log("auth:", userId);

            const result = await IncidentsService.resolvePendingIncidentDuplicate(
                pendingIncidentId,
                userId,
                action
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getFeed(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const incidents = await IncidentsService.getFeed({
                lat,
                lng,
                page,
                limit
            });

            res.status(200).json({
                message: "Feed de incidentes obtenido correctamente",
                data: incidents,
                pagination: {
                    page,
                    limit
                }
            });
        } catch (err) {
            next(err);
        }
    }

    static async getClosedIncidentsHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const result = await IncidentsService.getClosedIncidentsHistory(userId, page, limit);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
    
    static async getFrequencyStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);
            const municipalityId = req.params.municipalityId ?? null;
            const data = await IncidentsService.getFrequencyStats(userId, municipalityId);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    static async getResolutionMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);
            const municipalityId = req.params.municipalityId ?? null;
            const data = await IncidentsService.getResolutionMetrics(userId, municipalityId);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
}