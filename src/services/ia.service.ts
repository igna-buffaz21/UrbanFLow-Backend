import { GoogleGenAI } from "@google/genai";

import { buildValidateIncidentPrompt } from "../data/types/ia/ia.prompts";
import type {
  AiIncidentValidationResult,
  ValidateIncidentWithAiInput,
} from "../data/types/ia/ia.type";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("Falta configurar GEMINI_API_KEY en las variables de entorno");
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

export class AiService {
  static async validateIncident(
    input: ValidateIncidentWithAiInput
  ): Promise<AiIncidentValidationResult> {
    const prompt = buildValidateIncidentPrompt(
      input.title,
      input.description
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const parsedResponse = JSON.parse(text) as AiIncidentValidationResult;

    this.validateAiIncidentResponse(parsedResponse);

    return parsedResponse;
  }

  private static validateAiIncidentResponse(
    response: AiIncidentValidationResult
  ) {
    if (response.decision !== "open" && response.decision !== "rejected") {
      throw new Error("Gemini devolvió una decisión inválida");
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
      !Number.isInteger(response.aiUrgencyScore) ||
      response.aiUrgencyScore < 1 ||
      response.aiUrgencyScore > 5
    ) {
      throw new Error("Gemini devolvió un aiUrgencyScore inválido");
    }

    if (
      response.decision === "open" &&
      response.isValid !== true
    ) {
      throw new Error("Gemini devolvió una respuesta inconsistente");
    }

    if (
      response.decision === "rejected" &&
      response.isValid !== false
    ) {
      throw new Error("Gemini devolvió una respuesta inconsistente");
    }
  }
}