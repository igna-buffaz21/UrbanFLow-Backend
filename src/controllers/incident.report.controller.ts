import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { IncidentReportService } from "../services/incident-report.service";
import { AuthService } from "../services/auth.services";

export class IncidentReportController {
  static async getMyReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = getAuth(req);

      const requester = await AuthService.getAuthenticatedUser(userId!);

      const reports = await IncidentReportService.getMyReports({
        requesterId: requester.id!,
      });

      res.status(200).json(reports);
    } catch (err) {
      next(err);
    }
  }

  static async getReportByIncidentId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      const requester = await AuthService.getAuthenticatedUser(userId!);

      const reportStatus = await IncidentReportService.getReportByIncidentId({
        incidentId: id,
        requesterId: requester.id!,
      });

      res.status(200).json(reportStatus);
    } catch (err) {
      next(err);
    }
  }

  static async createReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      const requester = await AuthService.getAuthenticatedUser(userId!);

      const newReport = await IncidentReportService.createReport({
        incidentId: id,
        requesterId: requester.id!,
      });

      res.status(201).json(newReport);
    } catch (err) {
      next(err);
    }
  }

  static async deleteReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = getAuth(req);
      const { id } = req.params;

      const requester = await AuthService.getAuthenticatedUser(userId!);

      const deletedReport = await IncidentReportService.deleteReport({
        incidentId: id,
        requesterId: requester.id!,
      });

      res.status(200).json(deletedReport);
    } catch (err) {
      next(err);
    }
  }
}