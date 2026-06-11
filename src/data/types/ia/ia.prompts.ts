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
Título original escrito por el usuario: ${title}
Descripción original escrita por el usuario: ${description}

Categorías disponibles:
${JSON.stringify(INCIDENT_CATEGORIES)}

Incidentes cercanos dentro del radio configurado:
${JSON.stringify(nearbyIncidents)}

Objetivo:
Decidir si el reporte nuevo debe:
- publicarse como incidente nuevo,
- rechazarse,
- o pedir confirmación al usuario porque parece duplicado de un incidente existente.

Además, debés generar una versión corregida y publicable del título y la descripción:
- "normalizedTitle"
- "normalizedDescription"

Normalización del texto:
- La normalización debe ser mínima y natural.
- No reescribas el reporte como si fuera un informe técnico.
- No uses lenguaje institucional, robótico o demasiado formal.
- Mantené el estilo simple del usuario, pero sin insultos ni vulgaridades.
- Corregí errores de ortografía evidentes.
- Corregí puntuación básica si hace falta.
- Eliminá insultos, malas palabras o agresiones.
- No cambies palabras comunes por términos técnicos innecesarios.
- No cambies "pozo" por "bache" salvo que el usuario haya usado "bache".
- No cambies "calle" por "calzada" salvo que el usuario lo haya dicho.
- No cambies "motos" por "vehículos y motocicletas".
- No agregues detalles que el usuario no escribió.
- No agregues frases como "se observa", "requiere intervención", "circulación vehicular" o similares salvo que el usuario lo haya expresado así.
- No exageres ni suavices el problema.
- La versión normalizada debe parecer escrita por una persona común, no por una oficina municipal.
- El objetivo es limpiar y corregir, no reformular completamente.

Regla principal:
- Conservá la mayor cantidad posible de palabras originales.
- Solo modificá lo necesario para:
  - corregir ortografía,
  - eliminar lenguaje ofensivo,
  - mejorar claridad mínima,
  - y dejar el texto apto para publicarse.

Ejemplos de normalización correcta:
- Original: "poso en la esquina hijos de puta y un peligro para las motos"
  Normalizado:
  Título: "Pozo en la esquina"
  Descripción: "Hay un pozo en la esquina y es un peligro para las motos."

- Original: "hay un pozo de mierda en la calle, arreglen esto"
  Normalizado:
  Título: "Pozo en la calle"
  Descripción: "Hay un pozo en la calle, arreglen esto."

- Original: "la luz esta apagada hace dias loco, es un desastre"
  Normalizado:
  Título: "Luz apagada hace días"
  Descripción: "La luz está apagada hace días."

- Original: "unos mugrientos tiraron basura en la esquina"
  Normalizado:
  Título: "Basura en la esquina"
  Descripción: "Hay basura en la esquina."

- Original: "este semaforo no anda una porqueria"
  Normalizado:
  Título: "Semáforo no anda"
  Descripción: "Este semáforo no anda."

Ejemplos de normalización incorrecta:
- Original: "poso en la esquina hijos de puta y un peligro para las motos"
  Incorrecto:
  Título: "Bache en la calzada"
  Descripción: "Se observa un bache en la calzada que representa un riesgo para la circulación de vehículos y motocicletas."

Motivo:
- Cambia "pozo" por "bache".
- Cambia "esquina" por "calzada".
- Cambia "motos" por "vehículos y motocicletas".
- Usa lenguaje técnico.
- Agrega información no escrita por el usuario.

Importante:
- La presencia de malas palabras NO debe causar rechazo automático.
- Si el reporte describe un incidente municipal real, debe evaluarse normalmente.
- Solo limpiá el lenguaje ofensivo en "normalizedTitle" y "normalizedDescription".
- Rechazá únicamente si el reporte no es válido por las reglas de validación.

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

No rechaces solo por:
- Mala ortografía.
- Lenguaje informal.
- Enojo del usuario.
- Malas palabras, siempre que el incidente sea real y municipal.

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
- Siempre devolvé "normalizedTitle" y "normalizedDescription".
- Si el reporte es válido, ambos campos deben contener una versión limpia, natural y corregida.
- Si el reporte es inválido, igual devolvé una versión corregida si es posible.
- Si el texto original es imposible de interpretar, usá:
  - "normalizedTitle": "Reporte inválido"
  - "normalizedDescription": "No se pudo interpretar el contenido del reporte."

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
- No agregues campos extra.
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

  "normalizedTitle": string,
  "normalizedDescription": string,

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