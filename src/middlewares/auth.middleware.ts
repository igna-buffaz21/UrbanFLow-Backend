import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositorys/user.repository";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }

    next();
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Usuario no autenticado"
            });
        }

        const user = await UserRepository.getUserByClerkId(userId);

        if (!user || user.status !== "active" || user.role !== "superadmin") {
            return res.status(403).json({
                message: "Solo superadmin puede acceder a métricas del sistema"
            });
        }

        next();
    }
    catch (err) {
        next(err);
    }
}
