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

export function buildValidateIncidentPrompt(title: string, description: string) {
  return `
    Sos un sistema de validación de reportes municipales.

    Analizá título, descripción e imagen. El reporte está en estado "in_review".

    Datos:
    Título: ${title}
    Descripción: ${description}

    Categorías disponibles:
    ${JSON.stringify(INCIDENT_CATEGORIES)}

    Objetivo:
    Decidir si el reporte debe publicarse como "open" o rechazarse como "rejected".

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
    - Si es válido: "decision": "open", "isValid": true y "rejectionReason": null.
    - Si no es válido: "decision": "rejected", "isValid": false y explicá "rejectionReason".
    - Elegí exactamente una categoría de la lista.
    - Devolvé "categoryId" y "categoryName" exactos.
    - No inventes IDs, nombres ni categorías.
    - Si es válido y no hay categoría clara, usá "other".
    - "confidence" debe ser número entre 0 y 1.
    - Respondé SOLO JSON válido, sin markdown ni texto extra.

    Formato exacto:
    {
      "isValid": boolean,
      "confidence": number,
      "decision": "open" | "rejected",
      "categoryId": string,
      "categoryName": string,
      "aiUrgencyScore": number,
      "imageMatchesText": boolean,
      "imageContainsIncident": boolean,
      "possibleFakeOrIrrelevantImage": boolean,
      "rejectionReason": string | null,
      "reasons": string[]
    }
    `;
}