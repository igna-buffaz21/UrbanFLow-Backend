import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { CategoryService } from "../services/category.service";

export class CategoryController {

    static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            //const { userId } = getAuth(req);
            const categories = await CategoryService.getCategories();
            res.status(200).json(categories);
        } catch (err) {
            next(err);
        }
    }

    static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            //const { userId } = getAuth(req);
            const { name, label, description, iconUrl } = req.body;
            const category = await CategoryService.createCategory({ name, label, description, iconUrl });
            res.status(201).json(category);
        } catch (err) {
            next(err);
        }
    }
}