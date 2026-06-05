import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { IncidentCommentService } from "../services/incident.comment.service";
import { AuthService } from "../services/auth.services";
export class IncidentCommentController {

    static async getMyComments(
        req: Request,
        res: Response,
        next: NextFunction
        ): Promise<void> {
        try {
            const { userId } = getAuth(req);

            const requester = await AuthService.getAuthenticatedUser(userId!);

            const comments = await IncidentCommentService.getMyComments({
            requesterId: requester.id!,
            });

            res.status(200).json(comments);
        } catch (err) {
            next(err);
        }
    }

    static async getCommentsByIncidentId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { id } = req.params;
            const { status } = req.query;

            const requester = await AuthService.getAuthenticatedUser(userId!);


            const comments = await IncidentCommentService.getCommentsByIncidentId({
                incidentId: id,
                requesterId: requester.id!, requesterRole: requester.role,
                status: status as string | undefined,
            });

            res.status(200).json(comments);
        } catch (err) {
            next(err);
        }
    }

    static async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { id } = req.params;
            const { comment, photoUrl } = req.body;

            const requester = await AuthService.getAuthenticatedUser(userId!);

            const newComment = await IncidentCommentService.createComment({
                incidentId: id,
                requesterId: requester.id!,
                requesterRole: requester.role,
                comment,
                photoUrl,
            });

            res.status(201).json(newComment);
        } catch (err) {
            next(err);
        }
    }

    static async updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { id } = req.params;
            const { comment, photoUrl } = req.body;

            const requester = await AuthService.getAuthenticatedUser(userId!);

            const updated = await IncidentCommentService.updateComment(
                id,
                requester.id!,
                { comment, photoUrl }
            );

            res.status(200).json(updated);
        } catch (err) {
            next(err);
        }
    }

    static async updateCommentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId } = getAuth(req);
            const { id } = req.params;
            const { status } = req.body;

            const requester = await AuthService.getAuthenticatedUser(userId!);

            const updated = await IncidentCommentService.updateCommentStatus(
                id,
                requester.id!,
                status
            );

            res.status(200).json(updated);
        } catch (err) {
            next(err);
        }
    }
}