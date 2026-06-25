import * as si from "systeminformation";
import type { Systeminformation } from "systeminformation";
import { mongoDb } from "../config/mongodb.config";
import { COLLECTION_NAMES } from "../data/types/global/const.global";
import {
    SystemCurrentResponse,
    SystemHistoryItem,
    SystemHistoryRange,
    SystemMetric,
    SystemResourceMetrics,
    SystemServiceStatus
} from "../data/types/system/system.types";

const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * 1024 * 1024;
const METRICS_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
const RANGE_DAYS: Record<SystemHistoryRange, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
};

type SystemMetricHistoryDocument = SystemMetric & {
    cpu?: {
        usagePercent?: number;
    };
    memory?: {
        usagePercent?: number;
        usedMb?: number;
        availableMb?: number;
    };
    disk?: {
        usagePercent?: number;
        usedGb?: number;
        freeGb?: number;
    };
};

export class SystemService {
    private static metricsScheduler: NodeJS.Timeout | null = null;

    static async getCurrent(): Promise<SystemCurrentResponse> {
        const [metrics, services] = await Promise.all([
            this.getResourceMetrics(),
            this.getServicesStatus()
        ]);

        return {
            ...metrics,
            services
        };
    }

    static startMetricsScheduler(intervalMs = METRICS_SNAPSHOT_INTERVAL_MS): void {
        if (this.metricsScheduler) {
            return;
        }

        void this.saveMetricSnapshot();

        this.metricsScheduler = setInterval(() => {
            void this.saveMetricSnapshot();
        }, intervalMs);
    }

    static async getHistory(query: {
        range?: unknown;
        limit?: unknown;
        from?: unknown;
        to?: unknown;
    }): Promise<SystemHistoryItem[]> {
        const { fromDate, toDate, limit } = this.resolveHistoryQuery(query);
        const db = mongoDb();
        const createdAtQuery: { $gte: Date; $lte?: Date } = { $gte: fromDate };

        if (toDate) {
            createdAtQuery.$lte = toDate;
        }

        const collection = db.collection<SystemMetric>(COLLECTION_NAMES.SYSTEM_METRICS);

        if (limit) {
            const latestItems = await collection
                .find({ createdAt: createdAtQuery })
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            return latestItems.reverse().map((item) => this.mapHistoryItem(item));
        }

        const items = await collection
            .find({ createdAt: createdAtQuery })
            .sort({ createdAt: 1 })
            .toArray();

        return items.map((item) => this.mapHistoryItem(item));
    }

    private static async saveMetricSnapshot(): Promise<SystemMetric | null> {
        try {
            const db = mongoDb();
            const metrics = await this.getResourceMetrics();
            const snapshot = this.mapMetricSnapshot(metrics);
            const result = await db.collection<SystemMetric>(COLLECTION_NAMES.SYSTEM_METRICS).insertOne(snapshot);

            return {
                ...snapshot,
                _id: result.insertedId
            };
        }
        catch (err) {
            console.warn("No se pudo guardar snapshot de métricas del sistema:", err);
            return null;
        }
    }

    private static async getResourceMetrics(): Promise<SystemResourceMetrics> {
        const [cpuData, memoryData, diskData] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize()
        ]);
        const timeData = si.time();
        const disk = this.resolvePrimaryDisk(diskData);
        const memory = this.resolveMemoryUsage(memoryData);

        return {
            cpu: {
                usagePercent: this.roundToTwo(cpuData.currentLoad)
            },
            memory: {
                totalMb: this.bytesToMb(memoryData.total),
                usedMb: this.bytesToMb(memory.used),
                freeMb: this.bytesToMb(memory.free),
                availableMb: this.bytesToMb(memory.available),
                buffCacheMb: this.bytesToMb(memory.buffCache),
                usagePercent: this.calculatePercent(memory.used, memoryData.total)
            },
            disk: {
                totalGb: this.bytesToGb(disk.size),
                usedGb: this.bytesToGb(disk.used),
                freeGb: this.bytesToGb(disk.available),
                usagePercent: this.calculatePercent(disk.used, disk.size)
            },
            uptime: {
                seconds: Math.floor(timeData.uptime)
            }
        };
    }

    private static mapMetricSnapshot(metrics: SystemResourceMetrics): SystemMetric {
        return {
            cpuUsagePercent: metrics.cpu.usagePercent,
            memoryUsagePercent: metrics.memory.usagePercent,
            diskUsagePercent: metrics.disk.usagePercent,
            memoryUsedMb: metrics.memory.usedMb,
            memoryAvailableMb: metrics.memory.availableMb,
            diskUsedGb: metrics.disk.usedGb,
            diskFreeGb: metrics.disk.freeGb,
            createdAt: new Date()
        };
    }

    private static resolveMemoryUsage(memoryData: Systeminformation.MemData): {
        used: number;
        free: number;
        available: number;
        buffCache: number;
    } {
        if (memoryData.available > 0 && memoryData.available <= memoryData.total) {
            return {
                used: memoryData.total - memoryData.available,
                free: memoryData.free,
                available: memoryData.available,
                buffCache: memoryData.buffcache
            };
        }

        return {
            used: memoryData.used,
            free: memoryData.free,
            available: memoryData.free,
            buffCache: memoryData.buffcache
        };
    }

    private static async getServicesStatus(): Promise<SystemCurrentResponse["services"]> {
        const unknownServices: SystemCurrentResponse["services"] = {
            pm2: { status: "unknown" },
            nginx: { status: "unknown" },
            mongodb: { status: "unknown" }
        };

        try {
            const services = await si.services("pm2,nginx,mongod,mongodb");

            return {
                pm2: {
                    status: this.resolveServiceStatus(services, ["pm2"])
                },
                nginx: {
                    status: this.resolveServiceStatus(services, ["nginx"])
                },
                mongodb: {
                    status: this.resolveServiceStatus(services, ["mongod", "mongodb"])
                }
            };
        }
        catch {
            return unknownServices;
        }
    }

    private static resolveServiceStatus(
        services: Systeminformation.ServicesData[],
        names: string[]
    ): SystemServiceStatus {
        const normalizedNames = names.map((name) => name.toLowerCase());
        const matches = services.filter((service) =>
            normalizedNames.includes(service.name.toLowerCase())
        );

        if (matches.length === 0) {
            return "unknown";
        }

        return matches.some((service) => service.running) ? "online" : "offline";
    }

    private static resolvePrimaryDisk(disks: Systeminformation.FsSizeData[]): Systeminformation.FsSizeData {
        const rootDisk = disks.find((disk) => disk.mount === "/");

        if (rootDisk) {
            return rootDisk;
        }

        const largestDisk = [...disks].sort((a, b) => b.size - a.size)[0];

        if (!largestDisk) {
            const error = new Error("No se pudo obtener información de disco");
            (error as any).statusCode = 500;
            throw error;
        }

        return largestDisk;
    }

    private static resolveHistoryQuery(query: {
        range?: unknown;
        limit?: unknown;
        from?: unknown;
        to?: unknown;
    }): {
        fromDate: Date;
        toDate?: Date;
        limit?: number;
    } {
        const range = this.resolveRangeQuery(query.range);

        if (!range) {
            const error = new Error("Range inválido. Usá day, week, month o year");
            (error as any).statusCode = 400;
            throw error;
        }

        const fromDate = query.from
            ? this.resolveDateQuery(query.from, "From inválido")
            : new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
        const toDate = query.to ? this.resolveDateQuery(query.to, "To inválido") : undefined;

        if (toDate && toDate < fromDate) {
            const error = new Error("To debe ser posterior a from");
            (error as any).statusCode = 400;
            throw error;
        }

        if (!query.limit) {
            return { fromDate, toDate };
        }

        if (typeof query.limit !== "string") {
            const error = new Error("Limit inválido");
            (error as any).statusCode = 400;
            throw error;
        }

        const limit = Number(query.limit);

        if (!Number.isInteger(limit) || limit <= 0) {
            const error = new Error("Limit debe ser un número entero positivo");
            (error as any).statusCode = 400;
            throw error;
        }

        return { fromDate, toDate, limit };
    }

    private static resolveRangeQuery(value: unknown): SystemHistoryRange | null {
        if (!value) {
            return "week";
        }

        if (typeof value !== "string") {
            return null;
        }

        const range = value.trim().toLowerCase();

        if (!this.isValidRange(range)) {
            return null;
        }

        return range;
    }

    private static isValidRange(range: string): range is SystemHistoryRange {
        return range === "day" || range === "week" || range === "month" || range === "year";
    }

    private static resolveDateQuery(value: unknown, message: string): Date {
        if (typeof value !== "string") {
            const error = new Error(message);
            (error as any).statusCode = 400;
            throw error;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            const error = new Error(message);
            (error as any).statusCode = 400;
            throw error;
        }

        return date;
    }

    private static mapHistoryItem(metric: SystemMetricHistoryDocument): SystemHistoryItem {
        return {
            createdAt: metric.createdAt,
            cpuUsagePercent: metric.cpuUsagePercent ?? metric.cpu?.usagePercent ?? 0,
            memoryUsagePercent: metric.memoryUsagePercent ?? metric.memory?.usagePercent ?? 0,
            diskUsagePercent: metric.diskUsagePercent ?? metric.disk?.usagePercent ?? 0,
            memoryUsedMb: metric.memoryUsedMb ?? metric.memory?.usedMb ?? 0,
            memoryAvailableMb: metric.memoryAvailableMb ?? metric.memory?.availableMb ?? 0,
            diskUsedGb: metric.diskUsedGb ?? metric.disk?.usedGb ?? 0,
            diskFreeGb: metric.diskFreeGb ?? metric.disk?.freeGb ?? 0
        };
    }

    private static bytesToMb(bytes: number): number {
        return this.roundToTwo(bytes / BYTES_IN_MB);
    }

    private static bytesToGb(bytes: number): number {
        return this.roundToTwo(bytes / BYTES_IN_GB);
    }

    private static calculatePercent(part: number, total: number): number {
        if (total <= 0) {
            return 0;
        }

        return this.roundToTwo((part / total) * 100);
    }

    private static roundToTwo(value: number): number {
        return Math.round(value * 100) / 100;
    }
}
