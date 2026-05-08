import { ObjectId } from "mongodb";

export interface District {
    _id?: ObjectId;
    name: string;
    polygon: GeoJSONPolygon | GeoJSONMultiPolygon;
    createdAt: Date;
    updatedAt: Date;
}

export interface GeoJSONPolygon {
    type: "Polygon";
    coordinates: number[][][];
}

export interface GeoJSONMultiPolygon {
    type: "MultiPolygon";
    coordinates: number[][][][];
}