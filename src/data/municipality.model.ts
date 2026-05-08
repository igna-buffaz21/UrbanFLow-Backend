import { ObjectId } from "mongodb";

export type MunicipalityStatus = "active" | "inactive";

export interface Municipality {
    _id?: ObjectId;
    name: string;
    districtId: ObjectId;
    status: MunicipalityStatus;
    createdAt: Date;
    updatedAt: Date;
}