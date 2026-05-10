import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { AuthService } from "../services/auth.services";

export class AuthController {
    static async getAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { isAuthenticated, userId } = getAuth(req);

            if (!isAuthenticated || !userId) {
                return res.status(401).json({
                    message: "Usuario no autenticado"
                });
            }

            const user = await AuthService.getAuthenticatedUser(userId);

            return res.json(user);
        } 
        catch (err) {
            next(err);
        }
    }
}