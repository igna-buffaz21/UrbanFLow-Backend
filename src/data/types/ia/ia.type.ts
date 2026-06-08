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
  isValid: boolean; // indica si la IA considera que el incidente es válido o no
  confidence: number; // indica un puntaje del 0 al 1 sobre la confianza que tiene la IA en su decisión
  decision: "open" | "rejected"; // indica el estado que le pondria la IA al incidente
  categoryId: string; // indica la categoría a la que la IA asignaría el incidente, tiene que coincidir con el nombre de la categoría
  categoryName: string; // indica el nombre de la categoría a la que la IA asignaría el incidente, tiene que coincidir con el ID
  aiUrgencyScore: number; // indica del 1 al 5 la urgencia que la IA asignaría al incidente, donde 1 es baja urgencia y 5 es alta urgencia
  imageMatchesText: boolean; // indica si coincide el cuerpo con la foto
  imageContainsIncident: boolean; // indica si la foto contiene un incidente municipal
  possibleFakeOrIrrelevantImage: boolean; // indica si la foto es posiblemente falsa o irrelevante
  rejectionReason: string | null; // indica la razón de rechazo del incidente
  reasons: string[]; // indica las razones por las cuales la IA toma su decisión
}