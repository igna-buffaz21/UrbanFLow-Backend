export type AiIncidentValidationDecision =
  | "approved"
  | "rejected"
  | "needs_review";

export type AiIncidentUrgency =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface ValidateIncidentWithAiInput {
  title: string;
  description: string;
  imageBase64: string;
  mimeType: string;
}

export interface AiIncidentValidationResult {
  isValid: boolean;
  confidence: number;
  decision: "open" | "rejected";
  categoryId: string;
  categoryName: string;
  aiUrgencyScore: number;
  imageMatchesText: boolean;
  imageContainsIncident: boolean;
  possibleFakeOrIrrelevantImage: boolean;
  rejectionReason: string | null;
  reasons: string[];
}