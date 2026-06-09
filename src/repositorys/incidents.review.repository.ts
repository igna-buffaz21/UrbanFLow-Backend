import { ObjectId } from "mongodb";

import { mongoDb } from "../config/mongodb.config";
import type { IncidentAiReview } from "../data/incident-review.model";

const COLLECTION_NAME = "incident_ai_reviews";

export class IncidentAiReviewRepository {
  static async create(review: IncidentAiReview): Promise<IncidentAiReview> {
    const db = mongoDb();

    const result = await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .insertOne(review);

    return {
      ...review,
      _id: result.insertedId,
    };
  }

  static async getById(reviewId: ObjectId): Promise<IncidentAiReview | null> {
    const db = mongoDb();

    return await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .findOne({ _id: reviewId });
  }

  static async getLatestByIncidentId(
    incidentId: ObjectId
  ): Promise<IncidentAiReview | null> {
    const db = mongoDb();

    return await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .findOne(
        { incidentId },
        {
          sort: {
            createdAt: -1,
          },
        }
      );
  }

  static async getByIncidentId(
    incidentId: ObjectId
  ): Promise<IncidentAiReview[]> {
    const db = mongoDb();

    return await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .find({ incidentId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getRejectedReviews(): Promise<IncidentAiReview[]> {
    const db = mongoDb();

    return await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .find({ decision: "rejected" })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getOpenReviews(): Promise<IncidentAiReview[]> {
    const db = mongoDb();

    return await db
      .collection<IncidentAiReview>(COLLECTION_NAME)
      .find({ decision: "open" })
      .sort({ createdAt: -1 })
      .toArray();
  }
}