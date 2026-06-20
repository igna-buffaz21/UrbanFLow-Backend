// src/modules/sub-districts/sub-district.model.ts

import { ObjectId } from "mongodb";

export type SubDistrictStatus = "active" | "inactive";

export type GeoJsonPolygon = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

export interface SubDistrict {
  _id?: ObjectId;
  name: string;
  polygon: GeoJsonPolygon;
  municipalityId: ObjectId;
  status: SubDistrictStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubDistrictGeoJsonFeature {
  type: "Feature";
  geometry: GeoJsonPolygon;
  properties: {
    id?: number | string;
    NOMBRE?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface SubDistrictGeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: SubDistrictGeoJsonFeature[];
}

export interface CreateSubDistrictsBulkInput {
  municipalityId: string;
  featureCollection: SubDistrictGeoJsonFeatureCollection;
}

export interface FindSubDistrictByCoordinatesInput {
  municipalityId: string;
  lat: number;
  lng: number;
}

export interface SubDistrictResponse {
  id: string;
  name: string;
  polygon: GeoJsonPolygon;
  municipalityId: string;
  status: SubDistrictStatus;
  createdAt: Date;
  updatedAt: Date;
}