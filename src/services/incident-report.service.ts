import { ObjectId } from "mongodb";
import { IncidentReportRepository } from "../repositorys/incident-report.repository";

interface GetReportParams {
  incidentId: string;
  requesterId: string;
}

interface CreateReportParams {
  incidentId: string;
  requesterId: string;
}

interface DeleteReportParams {
  incidentId: string;
  requesterId: string;
}

interface GetMyReportsParams {
  requesterId: string;
}

function buildError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

export class IncidentReportService {
  static async getMyReports(params: GetMyReportsParams) {
    if (!ObjectId.isValid(params.requesterId)) {
      throw buildError("El requesterId no es un ObjectId válido", 400);
    }

    return await IncidentReportRepository.getMyReports(params.requesterId);
  }

  static async getReportByIncidentId(params: GetReportParams) {
    if (!ObjectId.isValid(params.incidentId)) {
      throw buildError("El incidentId no es un ObjectId válido", 400);
    }

    if (!ObjectId.isValid(params.requesterId)) {
      throw buildError("El requesterId no es un ObjectId válido", 400);
    }

    const incident = await IncidentReportRepository.getIncidentById(
      params.incidentId
    );

    if (!incident) {
      throw buildError("Incidente no encontrado", 404);
    }

    const reportedByMe = await IncidentReportRepository.existsReport({
      incidentId: params.incidentId,
      createdBy: params.requesterId,
    });

    const reportsCount = await IncidentReportRepository.countReportsByIncidentId(
      params.incidentId
    );

    return {
      reportedByMe,
      reportsCount,
    };
  }

  static async createReport(params: CreateReportParams) {
    if (!ObjectId.isValid(params.incidentId)) {
      throw buildError("El incidentId no es un ObjectId válido", 400);
    }

    if (!ObjectId.isValid(params.requesterId)) {
      throw buildError("El requesterId no es un ObjectId válido", 400);
    }

    const incident = await IncidentReportRepository.getIncidentById(
      params.incidentId
    );

    if (!incident) {
      throw buildError("Incidente no encontrado", 404);
    }

    const alreadyReported = await IncidentReportRepository.existsReport({
      incidentId: params.incidentId,
      createdBy: params.requesterId,
    });

    if (alreadyReported) {
      throw buildError("Ya reportaste este incidente", 409);
    }

    await IncidentReportRepository.createReport({
      incidentId: new ObjectId(params.incidentId),
      createdBy: new ObjectId(params.requesterId),
      createdAt: new Date(),
    });

    const reportsCount = await IncidentReportRepository.countReportsByIncidentId(
      params.incidentId
    );

    return {
      reportedByMe: true,
      reportsCount,
    };
  }

  static async deleteReport(params: DeleteReportParams) {
    if (!ObjectId.isValid(params.incidentId)) {
      throw buildError("El incidentId no es un ObjectId válido", 400);
    }

    if (!ObjectId.isValid(params.requesterId)) {
      throw buildError("El requesterId no es un ObjectId válido", 400);
    }

    const incident = await IncidentReportRepository.getIncidentById(
      params.incidentId
    );

    if (!incident) {
      throw buildError("Incidente no encontrado", 404);
    }

    const existingReport = await IncidentReportRepository.existsReport({
      incidentId: params.incidentId,
      createdBy: params.requesterId,
    });

    if (!existingReport) {
      throw buildError("No habías reportado este incidente", 404);
    }

    await IncidentReportRepository.deleteReport({
      incidentId: params.incidentId,
      createdBy: params.requesterId,
    });

    const reportsCount = await IncidentReportRepository.countReportsByIncidentId(
      params.incidentId
    );

    return {
      reportedByMe: false,
      reportsCount,
    };
  }
}