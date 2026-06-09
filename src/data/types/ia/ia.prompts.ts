const INCIDENT_CATEGORIES = [
  {
    categoryId: "6a26c28967c373def334a63c",
    categoryName: "road_damage",
    label: "Baches y calzada",
    description: "Pozos, asfalto roto, hundimientos o daños en calle.",
  },
  {
    categoryId: "6a26c2d867c373def334a63d",
    categoryName: "fallen_trees",
    label: "Árboles y ramas caídas",
    description: "Árboles o ramas caídas que bloquean calle o vereda.",
  },
  {
    categoryId: "6a26c2de67c373def334a63e",
    categoryName: "street_lighting",
    label: "Alumbrado público",
    description: "Luminaria apagada, poste dañado o cables expuestos.",
  },
  {
    categoryId: "6a26c2e367c373def334a63f",
    categoryName: "traffic_signals",
    label: "Semáforos y señalización",
    description: "Semáforo roto, cartel caído, tapado o dañado.",
  },
  {
    categoryId: "6a26c2ea67c373def334a640",
    categoryName: "waste_management",
    label: "Residuos y limpieza urbana",
    description: "Basura acumulada, contenedores rotos o microbasurales.",
  },
  {
    categoryId: "6a26c2f567c373def334a641",
    categoryName: "sidewalks",
    label: "Veredas y espacios peatonales",
    description: "Vereda rota, rampa inaccesible u obstáculo peatonal.",
  },
  {
    categoryId: "6a26c2fb67c373def334a642",
    categoryName: "water_and_sewer",
    label: "Agua y cloacas",
    description: "Pérdida de agua, cloaca rebalsada o desagüe roto.",
  },
  {
    categoryId: "6a26c30067c373def334a643",
    categoryName: "animals",
    label: "Animales en la vía pública",
    description: "Animales peligrosos, abandonados o heridos.",
  },
  {
    categoryId: "6a26c30567c373def334a644",
    categoryName: "vandalism",
    label: "Vandalismo y daños",
    description: "Pintadas, mobiliario urbano roto o plazas dañadas.",
  },
  {
    categoryId: "6a26c30967c373def334a645",
    categoryName: "green_spaces",
    label: "Espacios verdes",
    description: "Plazas en mal estado, pasto alto o juegos rotos.",
  },
  {
    categoryId: "6a26c30e67c373def334a646",
    categoryName: "noise_complaints",
    label: "Ruido o molestias",
    description: "Ruidos molestos, actividad irregular o conflictos vecinales.",
  },
  {
    categoryId: "6a26c31467c373def334a647",
    categoryName: "other",
    label: "Otros",
    description: "Reporte válido que no encaja en otra categoría.",
  },
];

type NearbyIncidentForAi = {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  status: string;
  distanceMeters: number;
  createdAt: string;
};

export function buildValidateIncidentPrompt(
  title: string,
  description: string,
  nearbyIncidents: NearbyIncidentForAi[]
) {
  return `
Sos un sistema de validación de reportes municipales.

Analizá título, descripción, imagen e incidentes cercanos.
El reporte nuevo está en estado "in_review".

Datos del nuevo reporte:
Título: ${title}
Descripción: ${description}

Categorías disponibles:
${JSON.stringify(INCIDENT_CATEGORIES)}

Incidentes cercanos dentro del radio configurado:
${JSON.stringify(nearbyIncidents)}

Objetivo:
Decidir si el reporte nuevo debe:
- publicarse como incidente nuevo,
- rechazarse,
- o pedir confirmación al usuario porque parece duplicado de un incidente existente.

Aprobá solo si:
- Describe un problema urbano/municipal real.
- La imagen muestra evidencia relacionada.
- Texto e imagen son coherentes.
- El municipio podría intervenir.

Rechazá si:
- Es spam, prueba, texto sin sentido o sin evidencia suficiente.
- La imagen no muestra un incidente municipal.
- La imagen es selfie, meme, captura, negra o irrelevante.
- Texto e imagen no coinciden.
- El problema no corresponde a intervención municipal.

Detección de duplicados:
- Analizá los incidentes cercanos recibidos.
- Considerá duplicado solo si el nuevo reporte parece describir el mismo problema físico que un incidente cercano.
- Para marcar duplicado debe coincidir razonablemente:
  - tipo de problema,
  - categoría,
  - ubicación aproximada,
  - y descripción del hecho.
- No marques duplicado solo porque esté cerca.
- No marques duplicado si son problemas distintos en la misma zona.
- No marques duplicado si la categoría o el tipo de problema son diferentes.
- Si hay duda razonable, no lo marques como duplicado.
- Si no hay incidentes cercanos, no puede ser duplicado.
- Si el reporte es inválido, no puede ser duplicado.

Ejemplos de duplicado:
- Nuevo: "Hay un pozo grande en la calle".
  Existente cercano: "Bache profundo sobre la misma cuadra".
  Resultado: posible duplicado.

- Nuevo: "Luminaria apagada en la esquina".
  Existente cercano: "Farola sin funcionar en la misma esquina".
  Resultado: posible duplicado.

Ejemplos de NO duplicado:
- Nuevo: "Basura acumulada".
  Existente cercano: "Bache en la calle".
  Resultado: no es duplicado.

- Nuevo: "Árbol caído en la vereda".
  Existente cercano: "Ramas bajas molestan al pasar".
  Resultado: no marcar duplicado salvo que claramente sea el mismo árbol y el mismo problema.

Acciones posibles para "nextAction":
- "reject": usar si el reporte no es válido.
- "create_new_incident": usar si el reporte es válido y no parece duplicado.
- "ask_user_duplicate_confirmation": usar si el reporte es válido y hay un incidente cercano que probablemente sea el mismo problema.

Urgencia técnica "aiUrgencyScore" del 1 al 5:
1 = Muy baja: problema menor/estético, sin riesgo claro.
2 = Baja: problema leve, requiere mantenimiento, sin peligro inmediato.
3 = Media: problema visible que afecta circulación, accesibilidad, higiene o comodidad, pero permite uso del espacio.
4 = Alta: riesgo claro o afectación importante; posible accidente, bloqueo parcial o muchas personas afectadas.
5 = Crítica: peligro inmediato o bloqueo grave; requiere intervención prioritaria.

Ejemplos:
- Bache común: 3.
- Bache grande/profundo o en vía rápida: 4.
- Luminaria apagada en zona poco transitada: 2.
- Basura moderada o pasto alto: 2.
- Ramas ocupando parte de vereda: 3.
- Árbol caído bloqueando paso: 4.
- Cable expuesto: 4.
- Cable eléctrico caído: 5.
- Inundación severa, incendio o accidente activo: 5.

Reglas de urgencia:
- Usá escala conservadora.
- No uses 4 solo porque el reporte sea válido.
- No uses 5 salvo peligro inmediato o bloqueo grave.
- Si dudás entre dos puntajes, elegí el menor.
- Si rechazás, "aiUrgencyScore" debe ser 1.

Reglas de salida:
- Si es válido y no es duplicado:
  - "decision": "open"
  - "isValid": true
  - "nextAction": "create_new_incident"
  - "isPossibleDuplicate": false
  - "duplicateOfIncidentId": null
  - "duplicateConfidence": 0
  - "duplicateReason": null
  - "rejectionReason": null

- Si es válido y parece duplicado:
  - "decision": "open"
  - "isValid": true
  - "nextAction": "ask_user_duplicate_confirmation"
  - "isPossibleDuplicate": true
  - "duplicateOfIncidentId": id exacto del incidente cercano más similar
  - "duplicateConfidence": número entre 0 y 1
  - "duplicateReason": explicación breve
  - "rejectionReason": null

- Si no es válido:
  - "decision": "rejected"
  - "isValid": false
  - "nextAction": "reject"
  - "aiUrgencyScore": 1
  - "isPossibleDuplicate": false
  - "duplicateOfIncidentId": null
  - "duplicateConfidence": 0
  - "duplicateReason": null
  - explicar "rejectionReason"

Reglas de categoría:
- Elegí exactamente una categoría de la lista.
- Devolvé "categoryId" y "categoryName" exactos.
- No inventes IDs, nombres ni categorías.
- Si es válido y no hay categoría clara, usá "other".
- Si es inválido, usá la categoría más cercana o "other" si no corresponde ninguna.

Reglas estrictas:
- "confidence" debe ser número entre 0 y 1.
- "duplicateConfidence" debe ser número entre 0 y 1.
- "duplicateOfIncidentId" solo puede ser null o un id exacto incluido en los incidentes cercanos.
- No inventes incidentes cercanos.
- No inventes IDs.
- Respondé SOLO JSON válido.
- No uses markdown.
- No agregues texto extra fuera del JSON.

Formato exacto:
{
  "isValid": boolean,
  "confidence": number,
  "decision": "open" | "rejected",
  "nextAction": "reject" | "create_new_incident" | "ask_user_duplicate_confirmation",

  "categoryId": string,
  "categoryName": string,
  "aiUrgencyScore": number,

  "imageMatchesText": boolean,
  "imageContainsIncident": boolean,
  "possibleFakeOrIrrelevantImage": boolean,

  "isPossibleDuplicate": boolean,
  "duplicateOfIncidentId": string | null,
  "duplicateConfidence": number,
  "duplicateReason": string | null,

  "rejectionReason": string | null,
  "reasons": string[]
}
`;
}