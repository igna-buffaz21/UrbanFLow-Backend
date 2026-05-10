import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";


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
}