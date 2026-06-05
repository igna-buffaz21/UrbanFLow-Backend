import { ObjectId } from "mongodb";

export interface IncidentReport{
  _id?: ObjectId;
  incidentId: ObjectId;
  createdBy: ObjectId;
  createdAt: Date;
}