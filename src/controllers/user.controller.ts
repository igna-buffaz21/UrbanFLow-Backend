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
}