import { ObjectId } from "mongodb";

export type AiIncidentCategoryName =
  | "road_damage"
  | "fallen_trees"
  | "street_lighting"
  | "traffic_signals"
  | "waste_management"
  | "sidewalks"
  | "water_and_sewer"
  | "animals"
  | "vandalism"
  | "green_spaces"
  | "noise_complaints"
  | "other";

export type AiIncidentDecision = "open" | "rejected";

export type AiUrgencyScore = 1 | 2 | 3 | 4 | 5;

export interface IncidentAiReview {
  _id?: ObjectId;

  incidentId: ObjectId;

  provider: "gemini";
  model: string;

  isValid: boolean;
  confidence: number;

  decision: AiIncidentDecision;

  categoryId: ObjectId;
  categoryName: AiIncidentCategoryName;

  aiUrgencyScore: AiUrgencyScore;

  imageMatchesText: boolean;
  imageContainsIncident: boolean;
  possibleFakeOrIrrelevantImage: boolean;

  rejectionReason?: string | null;
  reasons: string[];

  rawResponse?: unknown;

  createdAt: Date;
}