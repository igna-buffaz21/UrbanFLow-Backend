import { Request, Response, NextFunction } from "express";
import { IncidentCommentService } from "../services/incident.comment.service";

export class IncidentCommentController {

    static async getCommentsByIncidentId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.query;

            const comments = await IncidentCommentService.getCommentsByIncidentId({
                incidentId: id,
                status: status as string | undefined,
            });

            res.status(200).json(comments);
        } catch (err) {
            next(err);
        }
    }

    static async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { comment, photoUrl, createdBy } = req.body;

            const newComment = await IncidentCommentService.createComment({
                incidentId: id,
                createdBy,
                comment,
                photoUrl,
            });

            res.status(201).json(newComment);
        } catch (err) {
            next(err);
        }
    }

}