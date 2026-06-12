export class ImageTypes {
    static buildIncidentImageName(incidentId: string): string {
        return `incident_${incidentId}_report`;
    }

    static buildResolutionImageName(incidentId: string): string {
        return `incident_${incidentId}_resolution`;
    }

    static buildPendingIncidentImageName(pendingIncidentId: string) {
        return `pending-incidents/${pendingIncidentId}`;
    }
}