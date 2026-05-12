import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }

    next();
}