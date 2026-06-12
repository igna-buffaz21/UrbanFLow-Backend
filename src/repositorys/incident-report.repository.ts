import { ObjectId } from "mongodb";
import { mongoDb } from "../config/mongodb.config";
import { Incident } from "../data/incident.model";
import { IncidentReport } from "../data/incident-report.model";
import { ReportFilter, MyIncidentReportResponse} from "../data/types/incident/incidents-reports.type";
import { COLLECTION_NAMES } from "../data/types/global/const.global";

export class IncidentReportRepository {
  static async getMyReports(
    requesterId: string
  ): Promise<MyIncidentReportResponse[]> {
    try {
      const db = mongoDb();

      const reports = await db
        .collection<IncidentReport>(COLLECTION_NAMES.INCIDENT_REPORTS)
        .aggregate([
          {
            $match: {
              createdBy: new ObjectId(requesterId),
            },
          },
          {
            $lookup: {
              from: COLLECTION_NAMES.INCIDENTS,
              localField: "incidentId",
              foreignField: "_id",
              as: "incidentData",
            },
          },
          {
            $unwind: "$incidentData",
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $project: {
              _id: 0,
              reportId: { $toString: "$_id" },
              reportedAt: "$createdAt",
              incident: {
                id: { $toString: "$incidentData._id" },
                title: "$incidentData.title",
                description: "$incidentData.description",
                status: "$incidentData.status",
                priority: "$incidentData.priority",
                photoUrl: {
                  $ifNull: ["$incidentData.image.url", null],
                },
                createdAt: "$incidentData.createdAt",
              },
            },
          },
        ])
        .toArray();

      return reports as unknown as MyIncidentReportResponse[];
    } catch (err) {
      throw new Error(`Error al obtener mis reportes: ${err}`);
    }
  }

  static async getIncidentById(incidentId: string): Promise<Incident | null> {
    try {
      const db = mongoDb();

      const incident = await db
        .collection<Incident>(COLLECTION_NAMES.INCIDENTS)
        .findOne({ _id: new ObjectId(incidentId) });

      return incident ?? null;
    } catch (err) {
      throw new Error(`Error al obtener el incidente: ${err}`);
    }
  }

  static async existsReport(filter: ReportFilter): Promise<boolean> {
    try {
      const db = mongoDb();

      const report = await db
        .collection<IncidentReport>(COLLECTION_NAMES.INCIDENT_REPORTS)
        .findOne({
          incidentId: new ObjectId(filter.incidentId),
          createdBy: new ObjectId(filter.createdBy),
        });

      return !!report;
    } catch (err) {
      throw new Error(`Error al verificar el reporte: ${err}`);
    }
  }

  static async countReportsByIncidentId(incidentId: string): Promise<number> {
    try {
      const db = mongoDb();

      return await db
        .collection<IncidentReport>(COLLECTION_NAMES.INCIDENT_REPORTS)
        .countDocuments({
          incidentId: new ObjectId(incidentId),
        });
    } catch (err) {
      throw new Error(`Error al contar los reportes: ${err}`);
    }
  }

  static async createReport(
    data: Omit<IncidentReport, "_id">
  ): Promise<IncidentReport> {
    try {
      const db = mongoDb();

      const result = await db
        .collection<IncidentReport>(COLLECTION_NAMES.INCIDENT_REPORTS)
        .insertOne(data as IncidentReport);

      return {
        _id: result.insertedId,
        ...data,
      };
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new Error("Ya reportaste este incidente");
      }

      throw new Error(`Error al crear el reporte: ${err}`);
    }
  }

  static async deleteReport(filter: ReportFilter): Promise<boolean> {
    try {
      const db = mongoDb();

      const result = await db
        .collection<IncidentReport>(COLLECTION_NAMES.INCIDENT_REPORTS)
        .deleteOne({
          incidentId: new ObjectId(filter.incidentId),
          createdBy: new ObjectId(filter.createdBy),
        });

      return result.deletedCount > 0;
    } catch (err) {
      throw new Error(`Error al eliminar el reporte: ${err}`);
    }
  }
}