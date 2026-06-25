import { ObjectId } from "mongodb";

export interface SystemMetric {
    _id?: ObjectId;

    cpuUsagePercent: number;
    memoryUsagePercent: number;
    diskUsagePercent: number;

    memoryUsedMb: number;
    memoryAvailableMb: number;

    diskUsedGb: number;
    diskFreeGb: number;

    createdAt: Date;
}
