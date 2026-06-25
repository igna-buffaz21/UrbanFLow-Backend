import { SystemMetric } from "../../system-metric.model";

export type SystemServiceStatus = "online" | "offline" | "unknown";
export type SystemHistoryRange = "day" | "week" | "month" | "year";

export interface SystemResourceMetrics {
    cpu: {
        usagePercent: number;
    };

    memory: {
        totalMb: number;
        usedMb: number;
        freeMb: number;
        availableMb: number;
        buffCacheMb: number;
        usagePercent: number;
    };

    disk: {
        totalGb: number;
        usedGb: number;
        freeGb: number;
        usagePercent: number;
    };

    uptime: {
        seconds: number;
    };
}

export interface SystemCurrentResponse extends SystemResourceMetrics {
    services: {
        pm2: {
            status: SystemServiceStatus;
        };
        nginx: {
            status: SystemServiceStatus;
        };
        mongodb: {
            status: SystemServiceStatus;
        };
    };
}

export interface SystemHistoryItem {
    createdAt: Date;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    diskUsagePercent: number;
    memoryUsedMb: number;
    memoryAvailableMb: number;
    diskUsedGb: number;
    diskFreeGb: number;
}

export type { SystemMetric };
