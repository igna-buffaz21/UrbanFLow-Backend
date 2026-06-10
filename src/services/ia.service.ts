import { GoogleGenAI } from "@google/genai";

import { buildValidateIncidentPrompt } from "../data/types/ia/ia.prompts";
import type {
  AiIncidentValidationResult,
  ValidateIncidentWithAiInput,
  NearbyIncidentForAi,
  ValidateIncidentWithAiInputDEV,
} from "../data/types/ia/ia.type";

import { IncidentsRepository } from "../repositorys/incident.repository";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("Falta configurar GEMINI_API_KEY en las variables de entorno");
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

export class AiService {
  static async validateIncidentDEV(
    input: ValidateIncidentWithAiInputDEV
  ): Promise<AiIncidentValidationResult> {
    const lng = Number(input.lng);
    const lat = Number(input.lat);

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      throw new Error("Las coordenadas son obligatorias para validar duplicados");
    }

    if (lng < -180 || lng > 180) {
      throw new Error("La longitud es inválida");
    }

    if (lat < -90 || lat > 90) {
      throw new Error("La latitud es inválida");
    }

    const nearbyIncidents =
      await IncidentsRepository.findNearbyForAiDuplicateCheck({
        lng,
        lat,
        radius: 100
      });

    const prompt = buildValidateIncidentPrompt(
      input.title,
      input.description,
      nearbyIncidents
    );

    console.log("Prompt enviado a Gemini:", prompt);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini no devolvió una respuesta válida");
    }

    let parsedResponse: AiIncidentValidationResult;

    try {
      parsedResponse = JSON.parse(text) as AiIncidentValidationResult;
    } catch {
      throw new Error("Gemini devolvió un JSON inválido");
    }

    this.validateAiIncidentResponse(parsedResponse, nearbyIncidents);

    return parsedResponse; 
  } //endpoint de desarrollo, eliminar para produccion

  static async validateIncident(
    input: ValidateIncidentWithAiInput
  ): Promise<AiIncidentValidationResult> {
    const nearbyIncidents = input.nearbyIncidents ?? [];

    const prompt = buildValidateIncidentPrompt(
      input.title,
      input.description,
      nearbyIncidents
    );

    console.log("Prompt enviado a Gemini:", prompt);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini no devolvió una respuesta válida");
    }

    let parsedResponse: AiIncidentValidationResult;

    try {
      parsedResponse = JSON.parse(text) as AiIncidentValidationResult;
    } catch {
      throw new Error("Gemini devolvió un JSON inválido");
    }

    this.validateAiIncidentResponse(parsedResponse, nearbyIncidents);

    return parsedResponse;
  }

  private static validateAiIncidentResponse(
    response: AiIncidentValidationResult,
    nearbyIncidents: NearbyIncidentForAi[]
  ) {
    const validDecisions: AiIncidentValidationResult["decision"][] = [
      "open",
      "rejected",
    ];

    const validNextActions: AiIncidentValidationResult["nextAction"][] = [
      "reject",
      "create_new_incident",
      "ask_user_duplicate_confirmation",
    ];

    if (!validDecisions.includes(response.decision)) {
      throw new Error("Gemini devolvió una decisión inválida");
    }

    if (!validNextActions.includes(response.nextAction)) {
      throw new Error("Gemini devolvió una nextAction inválida");
    }

    if (typeof response.isValid !== "boolean") {
      throw new Error("Gemini devolvió un isValid inválido");
    }

    if (
      typeof response.confidence !== "number" ||
      response.confidence < 0 ||
      response.confidence > 1
    ) {
      throw new Error("Gemini devolvió una confianza inválida");
    }

    if (
      typeof response.categoryId !== "string" ||
      response.categoryId.trim() === ""
    ) {
      throw new Error("Gemini devolvió un categoryId inválido");
    }

    if (
      typeof response.categoryName !== "string" ||
      response.categoryName.trim() === ""
    ) {
      throw new Error("Gemini devolvió un categoryName inválido");
    }

    if (
      typeof response.normalizedTitle !== "string" ||
      response.normalizedTitle.trim() === ""
    ) {
      throw new Error("Gemini devolvió un normalizedTitle inválido");
    }

    if (
      typeof response.normalizedDescription !== "string" ||
      response.normalizedDescription.trim() === ""
    ) {
      throw new Error("Gemini devolvió un normalizedDescription inválido");
    }

    if (
      !Number.isInteger(response.aiUrgencyScore) ||
      response.aiUrgencyScore < 1 ||
      response.aiUrgencyScore > 5
    ) {
      throw new Error("Gemini devolvió un aiUrgencyScore inválido");
    }

    if (typeof response.imageMatchesText !== "boolean") {
      throw new Error("Gemini devolvió un imageMatchesText inválido");
    }

    if (typeof response.imageContainsIncident !== "boolean") {
      throw new Error("Gemini devolvió un imageContainsIncident inválido");
    }

    if (typeof response.possibleFakeOrIrrelevantImage !== "boolean") {
      throw new Error("Gemini devolvió un possibleFakeOrIrrelevantImage inválido");
    }

    if (typeof response.isPossibleDuplicate !== "boolean") {
      throw new Error("Gemini devolvió un isPossibleDuplicate inválido");
    }

    if (
      response.duplicateOfIncidentId !== null &&
      typeof response.duplicateOfIncidentId !== "string"
    ) {
      throw new Error("Gemini devolvió un duplicateOfIncidentId inválido");
    }

    if (
      typeof response.duplicateConfidence !== "number" ||
      response.duplicateConfidence < 0 ||
      response.duplicateConfidence > 1
    ) {
      throw new Error("Gemini devolvió un duplicateConfidence inválido");
    }

    if (
      response.duplicateReason !== null &&
      typeof response.duplicateReason !== "string"
    ) {
      throw new Error("Gemini devolvió un duplicateReason inválido");
    }

    if (
      response.rejectionReason !== null &&
      typeof response.rejectionReason !== "string"
    ) {
      throw new Error("Gemini devolvió un rejectionReason inválido");
    }

    if (!Array.isArray(response.reasons)) {
      throw new Error("Gemini devolvió reasons inválido");
    }

    if (response.reasons.some((reason) => typeof reason !== "string")) {
      throw new Error("Gemini devolvió reasons con valores inválidos");
    }

    if (response.decision === "open" && response.isValid !== true) {
      throw new Error("Gemini devolvió una respuesta inconsistente");
    }

    if (response.decision === "rejected" && response.isValid !== false) {
      throw new Error("Gemini devolvió una respuesta inconsistente");
    }

    if (response.nextAction === "reject") {
      if (response.decision !== "rejected" || response.isValid !== false) {
        throw new Error("Gemini devolvió una acción reject inconsistente");
      }

      if (response.aiUrgencyScore !== 1) {
        throw new Error("Gemini devolvió urgencia inválida para un rechazo");
      }

      if (response.isPossibleDuplicate !== false) {
        throw new Error("Un incidente rechazado no puede ser duplicado");
      }

      if (response.duplicateOfIncidentId !== null) {
        throw new Error("Un incidente rechazado no puede tener duplicateOfIncidentId");
      }

      if (response.duplicateConfidence !== 0) {
        throw new Error("Un incidente rechazado no puede tener duplicateConfidence");
      }

      if (response.duplicateReason !== null) {
        throw new Error("Un incidente rechazado no puede tener duplicateReason");
      }

      if (
        typeof response.rejectionReason !== "string" ||
        response.rejectionReason.trim() === ""
      ) {
        throw new Error("Un incidente rechazado debe tener rejectionReason");
      }
    }

    if (response.nextAction === "create_new_incident") {
      if (response.decision !== "open" || response.isValid !== true) {
        throw new Error("Gemini devolvió una acción create_new_incident inconsistente");
      }

      if (response.isPossibleDuplicate !== false) {
        throw new Error("Un incidente nuevo no debería estar marcado como duplicado");
      }

      if (response.duplicateOfIncidentId !== null) {
        throw new Error("Un incidente nuevo no debe tener duplicateOfIncidentId");
      }

      if (response.duplicateConfidence !== 0) {
        throw new Error("Un incidente nuevo no debe tener duplicateConfidence");
      }

      if (response.duplicateReason !== null) {
        throw new Error("Un incidente nuevo no debe tener duplicateReason");
      }

      if (response.rejectionReason !== null) {
        throw new Error("Un incidente válido no debe tener rejectionReason");
      }
    }

    if (response.nextAction === "ask_user_duplicate_confirmation") {
      if (response.decision !== "open" || response.isValid !== true) {
        throw new Error(
          "Gemini devolvió una acción ask_user_duplicate_confirmation inconsistente"
        );
      }

      if (response.isPossibleDuplicate !== true) {
        throw new Error("La confirmación de duplicado requiere isPossibleDuplicate true");
      }

      if (
        typeof response.duplicateOfIncidentId !== "string" ||
        response.duplicateOfIncidentId.trim() === ""
      ) {
        throw new Error("La confirmación de duplicado requiere duplicateOfIncidentId");
      }

      const duplicateExists = nearbyIncidents.some(
        (incident) => incident.id === response.duplicateOfIncidentId
      );

      if (!duplicateExists) {
        throw new Error("Gemini devolvió un duplicateOfIncidentId inexistente");
      }

      if (response.duplicateConfidence <= 0) {
        throw new Error(
          "La confirmación de duplicado requiere duplicateConfidence mayor a 0"
        );
      }

      if (
        typeof response.duplicateReason !== "string" ||
        response.duplicateReason.trim() === ""
      ) {
        throw new Error("La confirmación de duplicado requiere duplicateReason");
      }

      if (response.rejectionReason !== null) {
        throw new Error("Un incidente válido no debe tener rejectionReason");
      }
    }
  }
}