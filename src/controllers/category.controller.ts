// src/controllers/category.controller.ts

import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";

export class CategoryController {

    // GET /categories
    // No recibe parámetros, devuelve el listado de categorías con id y name
    static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await CategoryService.getCategories();
            res.status(200).json(categories);
        } catch (err) {
            // next(err) le pasa el error al middleware global de errores en index.ts
            next(err);
        }
    }

    // POST /categories
    // Los datos llegan por body
    static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, description, iconUrl } = req.body;
            const category = await CategoryService.createCategory({ name, description, iconUrl });
            // 201 = Created, es el código correcto para un POST exitoso
            res.status(201).json(category);
        } catch (err) {
            next(err);
        }
    }
}