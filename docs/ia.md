# Uso de la IA para validar incidentes

## 1. Configurar la API Key

Primero entran a esta web https://aistudio.google.com/

Van a la seccion de Get APIKEY, creo que les pide crear un proyecto, lo crean y ahi obtienen la APIKEY

Luego agregarla en el archivo .env del backend:

GEMINI_API_KEY=

---

## 2. Ubicación del prompt

El prompt principal de la IA se encuentra en el backend, dentro src/data/types/ia.prompts.ts

En este archivo se define cómo debe comportarse la IA, qué criterios debe usar para validar un incidente, cómo calcular la urgencia y qué formato de respuesta debe devolver.

---

## 3. Tipo de respuesta de la IA

La respuesta esperada de la IA está tipada con una interfaz.

Se encuenta en src/data/types/ia.type.ts

```ts
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

  isPossibleDuplicate: boolean; // indica si la IA considera que el incidente podría ser un duplicado de otro incidente existente
  duplicateOfIncidentId: string | null; // aqui iria el ID del incidente existente del cual la IA considera que el incidente podría ser un duplicado, o null si no hay ningún incidente del cual la IA considere que podría ser un duplicado
  duplicateConfidence: number; // indica un puntaje del 0 al 1 sobre la confianza que tiene la IA en que el incidente es un duplicado de otro incidente existente
  duplicateReason: string | null; // indica la razón por la cual la IA considera que el incidente podría ser un duplicado de otro incidente existente, o null si no hay ningún incidente del cual la IA considere que podría ser un duplicado

  rejectionReason: string | null; // indica la razón de rechazo del incidente, o null si el incidente no fue rechazado
  reasons: string[]; // indica las razones por las cuales la IA toma su decisión, incluyendo tanto razones de validación como de urgencia, categoría, posible duplicado, etc.
}
```

Este type sirve para asegurar que la IA siempre responda con una estructura válida y fácil de usar desde el backend.

---

## 4. Endpoint para usar la IA

Para probar la IA se usa el siguiente endpoint:

```http
POST http://localhost:3000/api/ia-dev/validate-incident
```

Este endpoint recibe los datos del incidente y devuelve el análisis realizado por la IA.

---

## 5. Cómo probarlo en Postman

En la pestaña `Body`, seleccionar `form-data`


Tiene que tener lo siguiente:

- title
- description
- image
- lng
- lat

Luego ejecutar la petición.

---

## 6. Ejemplo de respuesta esperada

```json
{
  "message": "Incidente analizado correctamente",
  "data": {
    "isValid": true,
    "confidence": 0.8,
    "decision": "open",
    "nextAction": "create_new_incident",
    "categoryId": "6a26c2ea67c373def334a640",
    "categoryName": "waste_management",
    "aiUrgencyScore": 4,
    "imageMatchesText": true,
    "imageContainsIncident": true,
    "possibleFakeOrIrrelevantImage": false,
    "isPossibleDuplicate": false,
    "duplicateOfIncidentId": null,
    "duplicateConfidence": 0,
    "duplicateReason": null,
    "rejectionReason": null,
    "reasons": []
  }
}
```

## 7. Testear

En ClickUp en la seccion PruebasIA estan las pruebas que se les fue haciendo a cada modelo, para ir trackeando casos y refirnala. 