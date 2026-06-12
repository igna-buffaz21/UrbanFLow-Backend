export interface ReportFilter {
  incidentId: string;
  createdBy: string;
}

export interface MyIncidentReportResponse {
  reportId: string;
  reportedAt: Date;
  incident: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: string;
    photoUrl?: string | null;
    createdAt: Date;
  };
}
