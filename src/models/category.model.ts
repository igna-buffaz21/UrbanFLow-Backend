import { ObjectId } from "mongodb";

export interface Category {
    _id?: ObjectId;
    name: string;
    description?: string;
    iconUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}