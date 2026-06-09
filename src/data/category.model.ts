import { ObjectId } from "mongodb";

export interface Category {
  _id?: ObjectId;
  name: string; // road_damage, fallen_trees, etc.
  label: string; // Baches y calzada, Árboles y ramas caídas, etc.
  description?: string;
  iconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}