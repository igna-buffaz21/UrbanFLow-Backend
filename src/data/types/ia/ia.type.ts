export type AiIncidentValidationDecision =
  | "approved"
  | "rejected"
  | "needs_review";

export type AiIncidentUrgency =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ValidateIncidentWithAiInputDEV = {
  title: string;
  description: string;
  mimeType: string;
  imageBase64: string;

  lng: number;
  lat: number;
  municipalityId?: string;
};

export interface ValidateIncidentWithAiInput {
  title: string;
  description: string;
  mimeType: string;
  imageBase64: string;
  nearbyIncidents?: NearbyIncidentForAi[];
}

export type NearbyIncidentForAi = {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  status: string;
  distanceMeters: number;
  createdAt: string;
};

export interface AiIncidentValidationResult {
  isValid: boolean; // indica si la IA considera que el incidente es válido o no
  confidence: number;// indica un puntaje del 0 al 1 sobre la confianza que tiene la IA en su decisión
  decision: "open" | "rejected"; // indica el estado que le pondria la IA al incidente

  nextAction:
    | "reject" // rechazar el incidente
    | "create_new_incident" // crear un nuevo incidente con la categoría y urgencia asignada por la IA
    | "ask_user_duplicate_confirmation"; // pedirle al usuario que confirme si el incidente es un duplicado de otro incidente existente, mostrando el incidente posible duplicado y la razón por la cual la IA considera que podría ser un duplicado

  categoryId: string; // indica la categoría a la que la IA asignaría el incidente, tiene que coincidir con el nombre de la categoría
  categoryName: string; // indica el nombre de la categoría a la que la IA asignaría el incidente, tiene que coincidir con el ID
  aiUrgencyScore: number; // indica del 1 al 5 la urgencia que la IA asignaría al incidente, donde 1 es baja urgencia y 5 es alta urgencia

  imageMatchesText: boolean; // indica si coincide el cuerpo con la foto
  imageContainsIncident: boolean; // indica si la foto contiene un incidente municipal
  possibleFakeOrIrrelevantImage: boolean; // indica si la foto es posiblemente falsa o irrelevante

  normalizedTitle: string; // título normalizado por la IA, por ejemplo corrigiendo errores ortográficos, eliminando emojis, etc.
  normalizedDescription: string; // descripción normalizada por la IA, por ejemplo corrigiendo errores ortográficos, eliminando emojis, etc.

  isPossibleDuplicate: boolean; // indica si la IA considera que el incidente podría ser un duplicado de otro incidente existente
  duplicateOfIncidentId: string | null; // aqui iria el ID del incidente existente del cual la IA considera que el incidente podría ser un duplicado, o null si no hay ningún incidente del cual la IA considere que podría ser un duplicado
  duplicateConfidence: number; // indica un puntaje del 0 al 1 sobre la confianza que tiene la IA en que el incidente es un duplicado de otro incidente existente
  duplicateReason: string | null; // indica la razón por la cual la IA considera que el incidente podría ser un duplicado de otro incidente existente, o null si no hay ningún incidente del cual la IA considere que podría ser un duplicado

  rejectionReason: string | null; // indica la razón de rechazo del incidente, o null si el incidente no fue rechazado
  reasons: string[]; // indica las razones por las cuales la IA toma su decisión, incluyendo tanto razones de validación como de urgencia, categoría, posible duplicado, etc.
}