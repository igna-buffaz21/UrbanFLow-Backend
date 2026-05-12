import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        message: err.message || "Error interno del servidor"
    });
}