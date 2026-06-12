import { ObjectId } from "mongodb";

import { mongoDb } from "../config/mongodb.config";
import { COLLECTION_NAMES } from "../data/types/global/const.global";
import type { PendingIncident } from "../data/pending-incident.model";

export class PendingIncidentRepository {
    static async createPendingIncident(pendingIncident: PendingIncident) {
        const db = mongoDb();

        const result = await db
            .collection<PendingIncident>(COLLECTION_NAMES.PENDING_INCIDENTS)
            .insertOne(pendingIncident);

        return {
            ...pendingIncident,
            _id: result.insertedId,
        };
    }

    static async getPendingIncidentById(id: string) {
        const db = mongoDb();

        if (!ObjectId.isValid(id)) {
            return null;
        }

        return await db
            .collection<PendingIncident>(COLLECTION_NAMES.PENDING_INCIDENTS)
            .findOne({
                _id: new ObjectId(id),
            });
    }

    static async deletePendingIncidentById(id: ObjectId | string) {
        const db = mongoDb();

        const _id = typeof id === "string" ? new ObjectId(id) : id;

        const result = await db
            .collection<PendingIncident>(COLLECTION_NAMES.PENDING_INCIDENTS)
            .deleteOne({
                _id,
            });

        return result.deletedCount > 0;
    }

    static async getExpiredPendingIncidents() {
        const db = mongoDb();

        return await db
            .collection<PendingIncident>(COLLECTION_NAMES.PENDING_INCIDENTS)
            .find({
                expired_at: {
                    $lt: new Date(),
                },
            })
            .toArray();
    }
}