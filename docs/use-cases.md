# Casos de uso del backend

Este documento resume los casos de uso implementados en el backend a partir de las rutas, controladores y servicios del proyecto.

## Actores del sistema

- **Usuario no autenticado**: puede consultar endpoints publicos puntuales como salud, categorias, feed, ubicacion de distrito y validacion IA de desarrollo.
- **Citizen**: ciudadano autenticado. Puede crear incidentes, consultar sus incidentes, comentar/reportar incidentes visibles y cancelar sus propios incidentes.
- **Operator**: operario municipal. Puede consultar incidentes asignados, comentar incidentes asignados y avanzar estados operativos.
- **Admin**: administrador municipal. Gestiona incidentes, prioridades, operadores y usuarios de su municipio.
- **Superadmin**: administrador global. Gestiona distritos, municipalidades y administradores.

## Estados y valores principales

- Roles de usuario: `superadmin`, `admin`, `operator`, `citizen`.
- Estados de usuario: `pending`, `active`, `inactive`, `blocked`.
- Estados de incidente: `in_review`, `open`, `assigned`, `in_progress`, `resolved`, `closed`, `rejected`.
- Prioridades de incidente: `low`, `medium`, `high`.
- Estados de comentario: `visible`, `hidden`, `deleted`.
- Estados de municipalidad: `active`, `inactive`.

## Autenticacion y perfil

### CU-AUTH-01 - Obtener usuario autenticado

- **Endpoint**: `GET /api/auth/me`
- **Actor**: usuario autenticado en Clerk.
- **Objetivo**: obtener el perfil interno asociado al usuario autenticado.
- **Flujo principal**:
  1. El backend valida la sesion de Clerk.
  2. Busca el usuario por `clerkId`.
  3. Si es el primer login, crea o activa el usuario segun corresponda.
  4. Devuelve datos del usuario: id, Clerk ID, nombre, email, foto, rol, estado y municipio.
- **Reglas**:
  - Si existe un usuario `pending` con el mismo email, se activa con los datos de Clerk.
  - Si no existe, se crea como `citizen` activo.
  - Usuarios `pending`, `inactive` o `blocked` no pueden acceder.
  - Admins y operadores deben tener `municipalityId`.

## Usuarios

### CU-USR-01 - Crear usuario manualmente

- **Endpoint**: `POST /api/users`
- **Actor**: usuario autenticado.
- **Objetivo**: crear un usuario en la base de datos.
- **Datos principales**: `clerkId`, `name`, `email`, `photoUrl`, `role`, `status`, `municipalityId`.
- **Resultado**: usuario creado con rol `citizen` y estado `active` por defecto si no se informan otros valores.
- **Reglas**:
  - No puede existir otro usuario con el mismo `clerkId`.
  - El email se normaliza a minusculas.

### CU-USR-02 - Invitar usuario

- **Endpoint**: `POST /api/users/invite`
- **Actor**: `superadmin` o `admin`.
- **Objetivo**: invitar usuarios administrativos mediante Clerk.
- **Datos principales**: `email`, `role`, `municipalityId`.
- **Resultado**: usuario creado como `pending` y asociado a una invitacion de Clerk.
- **Reglas**:
  - Solo se pueden invitar roles `admin` u `operator`.
  - `superadmin` puede invitar `admin`.
  - `admin` puede invitar `operator`.
  - Un admin solo puede invitar operadores para su propio municipio.
  - No puede existir otro usuario con el mismo email.
  - Si falla la persistencia local, se revoca la invitacion en Clerk.

### CU-USR-03 - Listar usuarios

- **Endpoint**: `GET /api/users`
- **Actor**: `superadmin` o `admin`.
- **Objetivo**: obtener usuarios filtrados.
- **Filtros**: `role`, `status`, `municipalityId`.
- **Reglas**:
  - El usuario autenticado debe estar `active`.
  - `admin` solo lista usuarios de su municipio.
  - `superadmin` puede filtrar por municipio.

### CU-USR-04 - Consultar estado de usuario

- **Endpoint**: `GET /api/users/:id/status`
- **Actor**: `superadmin` o `admin`.
- **Objetivo**: consultar el estado de un usuario.
- **Reglas**:
  - El solicitante debe estar activo.
  - `admin` solo puede consultar usuarios de su mismo municipio.

### CU-USR-05 - Actualizar estado de usuario

- **Endpoint**: `PATCH /api/users/:id/status`
- **Actor**: `superadmin` o `admin`.
- **Objetivo**: activar o inactivar usuarios.
- **Datos principales**: `status`.
- **Estados permitidos para actualizacion**: `active`, `inactive`.
- **Reglas**:
  - Nadie puede modificar su propio estado.
  - `superadmin` solo puede cambiar el estado de usuarios `admin`.
  - `admin` solo puede cambiar el estado de usuarios `operator` de su mismo municipio.

### CU-USR-06 - Obtener detalle de usuario

- **Endpoint**: `GET /api/users/:id`
- **Actor**: `superadmin`, `admin` o `citizen`.
- **Objetivo**: consultar informacion de un usuario.
- **Reglas**:
  - `superadmin` obtiene detalle completo solo de admins.
  - `admin` obtiene detalle de admins u operadores de su municipio.
  - `citizen` obtiene solo informacion publica de usuarios activos.

## Distritos

### CU-DIS-01 - Listar distritos

- **Endpoint**: `GET /api/districts`
- **Actor**: `superadmin`.
- **Objetivo**: obtener todos los distritos.

### CU-DIS-02 - Obtener distrito por ID

- **Endpoint**: `GET /api/districts/:id`
- **Actor**: `superadmin`.
- **Objetivo**: consultar el detalle de un distrito.
- **Reglas**:
  - `id` debe ser un ObjectId valido.

### CU-DIS-03 - Crear distrito

- **Endpoint**: `POST /api/districts`
- **Actor**: `superadmin`.
- **Objetivo**: crear un distrito con geometria.
- **Datos principales**: `name`, `polygon`.
- **Reglas**:
  - `polygon` debe ser GeoJSON `Polygon` o `MultiPolygon`.
  - No puede existir otro distrito con el mismo nombre.

### CU-DIS-04 - Buscar distrito por ubicacion

- **Endpoint**: `GET /api/districts/location?lng=&lat=`
- **Actor**: publico.
- **Objetivo**: resolver a que distrito pertenece una coordenada.
- **Reglas**:
  - `lng` y `lat` son obligatorios y deben estar en rango.

## Municipalidades

### CU-MUN-01 - Listar municipalidades

- **Endpoint**: `GET /api/municipalities`
- **Actor**: `superadmin`.
- **Objetivo**: obtener municipalidades filtradas.
- **Filtros**: `status`, `districtId`.

### CU-MUN-02 - Obtener municipalidad por ID

- **Endpoint**: `GET /api/municipalities/:id`
- **Actor**: `superadmin`.
- **Objetivo**: consultar una municipalidad.

### CU-MUN-03 - Crear municipalidad

- **Endpoint**: `POST /api/municipalities`
- **Actor**: `superadmin`.
- **Objetivo**: crear una municipalidad asociada a un distrito.
- **Datos principales**: `name`, `districtId`, `status`.
- **Reglas**:
  - `status` puede ser `active` o `inactive`.
  - No puede repetirse el nombre.

### CU-MUN-04 - Actualizar municipalidad

- **Endpoint**: `PATCH /api/municipalities/:id`
- **Actor**: `superadmin`.
- **Objetivo**: modificar nombre, distrito o estado de una municipalidad.
- **Reglas**:
  - Debe enviarse al menos un campo.
  - `districtId` debe ser ObjectId valido.

## Categorias

### CU-CAT-01 - Listar categorias

- **Endpoint**: `GET /api/categories`
- **Actor**: publico.
- **Objetivo**: obtener las categorias disponibles para incidentes.

### CU-CAT-02 - Crear categoria

- **Endpoint**: `POST /api/categories`
- **Actor**: publico segun la ruta actual.
- **Objetivo**: crear una categoria.
- **Datos principales**: `name`, `label`, `description`, `iconUrl`.
- **Reglas**:
  - `name` y `label` son obligatorios.
  - No puede existir otra categoria con el mismo `name`.

## Incidentes

### CU-INC-01 - Crear incidente ciudadano con validacion IA

- **Endpoint**: `POST /api/incidents`
- **Actor**: `citizen`.
- **Objetivo**: registrar un incidente municipal con imagen, ubicacion y validacion automatica.
- **Datos principales**: `title`, `description`, `location` GeoJSON `Point`, `image`.
- **Flujo principal**:
  1. Valida que el usuario sea ciudadano.
  2. Valida titulo, ubicacion e imagen.
  3. Busca la municipalidad correspondiente a la coordenada.
  4. Busca incidentes cercanos en un radio de 100 metros para detectar duplicados.
  5. Envia titulo, descripcion, imagen e incidentes cercanos a Gemini.
  6. Procesa la imagen y la sube a Cloudinary si corresponde.
  7. Crea el incidente o devuelve una accion alternativa.
- **Resultados posibles**:
  - `created`: se crea un incidente `open`.
  - `rejected`: la IA rechaza el incidente y devuelve razones.
  - `possible_duplicate`: se crea un incidente pendiente por 30 minutos para que el usuario confirme si es duplicado.

### CU-INC-02 - Resolver incidente pendiente por posible duplicado

- **Endpoint**: `POST /api/incidents/pending/:pendingIncidentId/resolve-duplicate`
- **Actor**: ciudadano creador del incidente pendiente.
- **Objetivo**: decidir que hacer cuando la IA detecta un posible duplicado.
- **Datos principales**: `action`.
- **Acciones**:
  - `confirm_duplicate`: suma un reporte al incidente existente y elimina el pendiente.
  - `create_new`: crea un nuevo incidente abierto y elimina el pendiente.
- **Reglas**:
  - Solo el creador puede resolver el pendiente.
  - El pendiente expira a los 30 minutos.

### CU-INC-03 - Obtener mis incidentes

- **Endpoint**: `GET /api/incidents/me`
- **Actor**: `citizen`.
- **Objetivo**: listar incidentes creados por el ciudadano.
- **Filtros**: `status`.

### CU-INC-04 - Obtener incidentes asignados

- **Endpoint**: `GET /api/incidents/assigned`
- **Actor**: `operator`.
- **Objetivo**: listar los incidentes asignados al operario.
- **Filtros**: `status`, `priority`.
- **Reglas**:
  - Estados permitidos: `assigned`, `in_progress`, `resolved`.

### CU-INC-05 - Obtener todos los incidentes del municipio

- **Endpoint**: `GET /api/incidents`
- **Actor**: `admin`, `operator`, `superadmin`.
- **Objetivo**: listar incidentes del municipio del usuario.
- **Filtros**: `status`, `priority`, `categoryId`, `assignedTo`.
- **Reglas**:
  - El usuario debe tener un municipio valido asociado.

### CU-INC-06 - Obtener incidentes para mapa por cercania

- **Endpoint**: `GET /api/incidents/map?lng=&lat=&radius=`
- **Actor**: usuario autenticado.
- **Objetivo**: obtener incidentes cercanos a una coordenada.
- **Reglas**:
  - `radius` por defecto es 3000 metros.
  - `radius` maximo es 10000 metros.
  - Solo devuelve estados visibles para mapa: `open`, `assigned`, `resolved`, `in_progress`.

### CU-INC-07 - Obtener feed publico de incidentes

- **Endpoint**: `GET /api/incidents/feed?lat=&lng=&page=&limit=`
- **Actor**: publico.
- **Objetivo**: obtener un feed paginado de incidentes del municipio correspondiente a la ubicacion.
- **Ordenamiento**: por `relevanceScore` descendente y luego `createdAt` descendente.
- **Relevancia**:
  - Considera urgencia IA, cantidad de reportes y cantidad de comentarios.
  - Devuelve incidentes `open`, `in_review` e `in_progress`.

### CU-INC-08 - Asignar operador a incidente

- **Endpoint**: `PATCH /api/incidents/:id/assign-operator`
- **Actor**: `admin`.
- **Objetivo**: asignar un operador activo a un incidente.
- **Datos principales**: `operatorId`.
- **Reglas**:
  - El operador debe estar activo y pertenecer al mismo municipio.
  - El incidente debe estar en `in_review` u `open`.
  - El incidente no debe tener operador asignado.
  - Al asignar, el incidente pasa a `assigned`.

### CU-INC-09 - Actualizar estado de incidente

- **Endpoint**: `PATCH /api/incidents/:id/status`
- **Actor**: `admin`, `operator` o `citizen`.
- **Objetivo**: cambiar el estado de un incidente.
- **Datos principales**: `status`, `image` opcional segun estado.
- **Reglas por actor**:
  - `admin`: puede modificar incidentes de su municipio.
  - `operator`: solo puede modificar incidentes asignados a el y usar `assigned`, `in_progress` o `resolved`.
  - `operator`: para marcar `resolved`, el incidente debe estar `in_progress` y debe subir imagen de resolucion.
  - `citizen`: solo puede cancelar sus propios incidentes enviando estado `rejected`.
- **Efectos**:
  - `in_progress` registra `startedAt`.
  - `resolved` registra `resolvedAt` y puede guardar foto de resolucion.
  - `closed` registra `closedAt`.
  - `assigned` registra `assignedAt`.

### CU-INC-10 - Actualizar prioridad de incidente

- **Endpoint**: `PATCH /api/incidents/:id/priority`
- **Actor**: `admin`.
- **Objetivo**: cambiar prioridad manualmente.
- **Datos principales**: `priority`.
- **Reglas**:
  - Prioridad permitida: `low`, `medium`, `high`.
  - El incidente debe pertenecer al municipio del admin.

### CU-INC-11 - Resolver incidente con URL de foto

- **Endpoint**: `PATCH /api/incidents/:id/resolve`
- **Actor**: `operator`.
- **Objetivo**: marcar un incidente asignado como resuelto usando una URL de foto ya disponible.
- **Datos principales**: `resolutionPhotoUrl`.
- **Reglas**:
  - Solo el operador asignado puede resolverlo.
  - El incidente debe estar en `assigned`.

### CU-INC-12 - Obtener detalle de incidente

- **Endpoint**: `GET /api/incidents/:id`
- **Actor**: `citizen`, `admin` u `operator`.
- **Objetivo**: consultar detalle de un incidente.
- **Resultado**: incluye datos del incidente, categoria, creador, operador asignado, imagen, foto de resolucion, estado, prioridad y contadores.
- **Reglas de prioridad calculada**:
  - `priorityScore = aiUrgencyScore + boostPorReportes`.
  - Boost por reportes: 0 hasta 1 reporte, 1 entre 2 y 4 reportes, 2 con 5 o mas reportes.
  - `priorityScore <= 2` produce `low`.
  - `priorityScore <= 4` produce `medium`.
  - Valores mayores producen `high`.

## Comentarios de incidentes

### CU-COM-01 - Obtener mis comentarios

- **Endpoint**: `GET /api/incident-comments/me`
- **Actor**: usuario autenticado.
- **Objetivo**: listar comentarios creados por el usuario.

### CU-COM-02 - Listar comentarios de un incidente

- **Endpoint**: `GET /api/incident-comments/:id/comments`
- **Actor**: usuario autenticado.
- **Objetivo**: obtener comentarios de un incidente.
- **Filtros**: `status`.
- **Reglas**:
  - `status` puede ser `visible`, `hidden` o `deleted`.
  - Si el actor es `citizen`, debe ser el creador del incidente o el incidente debe ser publico (`open`, `assigned`, `resolved`).

### CU-COM-03 - Crear comentario

- **Endpoint**: `POST /api/incident-comments/:id/comments`
- **Actor**: usuario autenticado.
- **Objetivo**: comentar un incidente.
- **Datos principales**: `comment`, `photoUrl`.
- **Reglas**:
  - El comentario es obligatorio.
  - Operadores solo pueden comentar incidentes asignados a ellos.
  - Ciudadanos solo pueden comentar incidentes propios o publicos.
  - El comentario se crea como `visible`.

### CU-COM-04 - Editar comentario

- **Endpoint**: `PATCH /api/incident-comments/:id`
- **Actor**: creador del comentario.
- **Objetivo**: modificar texto o foto del comentario.
- **Datos principales**: `comment`, `photoUrl`.
- **Reglas**:
  - Debe enviarse al menos un campo.
  - Solo el creador puede editarlo.

### CU-COM-05 - Actualizar estado de comentario

- **Endpoint**: `PATCH /api/incident-comments/:id/status`
- **Actor**: creador del comentario.
- **Objetivo**: cambiar estado del comentario.
- **Datos principales**: `status`.
- **Reglas**:
  - Estados permitidos: `visible`, `hidden`, `deleted`.
  - Solo el creador puede modificar el estado.

## Reportes de incidentes

### CU-REP-01 - Obtener mis reportes

- **Endpoint**: `GET /api/incident-report/reports/me`
- **Actor**: usuario autenticado.
- **Objetivo**: listar reportes realizados por el usuario.

### CU-REP-02 - Consultar reporte propio sobre un incidente

- **Endpoint**: `GET /api/incident-report/:id/report`
- **Actor**: usuario autenticado.
- **Objetivo**: saber si el usuario ya reporto el incidente y obtener el total de reportes.
- **Resultado**: `reportedByMe`, `reportsCount`.

### CU-REP-03 - Reportar incidente

- **Endpoint**: `POST /api/incident-report/:id/report`
- **Actor**: usuario autenticado.
- **Objetivo**: sumar un reporte a un incidente existente.
- **Reglas**:
  - El incidente debe existir.
  - Un usuario no puede reportar dos veces el mismo incidente.

### CU-REP-04 - Eliminar reporte propio

- **Endpoint**: `DELETE /api/incident-report/:id/report`
- **Actor**: usuario autenticado.
- **Objetivo**: quitar el reporte propio de un incidente.
- **Reglas**:
  - El reporte debe existir previamente.

## IA

### CU-IA-01 - Validar incidente con IA en entorno de desarrollo

- **Endpoint**: `POST /api/ia-dev/validate-incident`
- **Actor**: publico segun la ruta actual.
- **Objetivo**: probar la validacion de incidentes con Gemini sin crear un incidente.
- **Datos principales**: `title`, `description`, `lng`, `lat`, `image`.
- **Flujo principal**:
  1. Valida titulo, descripcion, coordenadas e imagen.
  2. Busca incidentes cercanos en un radio de 100 metros.
  3. Envia datos e imagen a Gemini.
  4. Valida que Gemini devuelva JSON con la estructura esperada.
  5. Devuelve el analisis de IA.
- **Respuesta IA esperada**:
  - Validez del incidente.
  - Confianza.
  - Decision.
  - Accion siguiente.
  - Categoria.
  - Urgencia.
  - Normalizacion de titulo y descripcion.
  - Validaciones de imagen.
  - Posible duplicado.
  - Motivos de rechazo o explicacion.

## Salud del sistema

### CU-HEALTH-01 - Verificar salud del backend

- **Endpoint**: `GET /api/health`
- **Actor**: publico.
- **Objetivo**: comprobar que el servidor y MongoDB responden.
- **Resultado**: mensaje de estado, fecha del servidor y resultado de `mongo_ping`.

## Gestion de imagenes

### CU-IMG-01 - Subir y procesar imagen de incidente

- **Endpoint asociado**: `POST /api/incidents`
- **Actor**: `citizen`.
- **Objetivo**: adjuntar evidencia visual al crear un incidente.
- **Reglas**:
  - Tamano maximo: 5 MB.
  - Formatos permitidos: JPG, PNG, WEBP, HEIC, HEIF y `application/octet-stream`.
  - La imagen se procesa y se sube a Cloudinary.

### CU-IMG-02 - Subir imagen de resolucion

- **Endpoint asociado**: `PATCH /api/incidents/:id/status`
- **Actor**: `operator`.
- **Objetivo**: guardar evidencia visual al resolver un incidente.
- **Reglas**:
  - Es obligatoria cuando un operador marca un incidente como `resolved`.
  - Se procesa y se sube a Cloudinary.

