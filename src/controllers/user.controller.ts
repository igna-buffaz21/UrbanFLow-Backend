import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { getAuth } from "@clerk/express";


export class UsersController {
    static async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.createUser(req.body);

            return res.status(201).json(user);
        }
        catch (err) {
            next(err);
        }
    }

    static async inviteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const auth = getAuth(req);

            if (!auth.isAuthenticated || !auth.userId) {
                return res.status(401).json({
                    message: "Usuario no autenticado"
                });
            }

            const invitedUser = await UserService.inviteUser(auth.userId, req.body);

            return res.status(201).json(invitedUser);
        }
        catch (err) {
            next(err);
        }
    }

    static async getUsers(req: Request, res: Response, next: NextFunction) {
        try {

            const { userId } = getAuth(req);


            if (!userId) {
                return res.status(401).json({
                    message: "Usuario no autenticado"
                });
            }

            const users = await UserService.getUsers(userId, req.query);

            return res.json(users);
        }
        catch (err) {
            next(err);
        }
    }

    static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const updatedUser = await UserService.updateMyProfile(userId, req.body);

            res.json(updatedUser);
        }
        catch (err) {
            next(err);
        }
    }

    static async getUserStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const { id } = req.params;

            const status = await UserService.getUserStatus({
                authenticatedClerkId: userId,
                userId: id
            });

            return res.json(status);
        }
        catch (err) {
            next(err);
        }
    }

    static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const updatedUserStatus = await UserService.updateUserStatus({
                authenticatedClerkId: userId,
                userId: req.params.id,
                status: req.body.status
            });

            return res.json(updatedUserStatus);
        }
        catch (err) {
            next(err);
        }
    }

    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);

            const user = await UserService.getUserById({
                authenticatedClerkId: userId!,
                userId: req.params.id
            });

            return res.json(user);
        }
        catch (err) {
            next(err);
        }
    }

    static async getCitizenStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = getAuth(req);
            const groupBy = (req.query.groupBy as "day" | "week" | "month") ?? "month";
            const data = await UserService.getCitizenStats(userId, groupBy);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
}