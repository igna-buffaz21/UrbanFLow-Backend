# UrbanFlow Backend

Backend para una plataforma de gestión de incidentes urbanos. Permite registrar incidentes con ubicación e imagen, validarlos con IA, asignarlos a operarios municipales, gestionar usuarios por roles y consultar información territorial como distritos y municipalidades.

## Stack

- **Node.js**
- **Express**
- **TypeScript**
- **MongoDB**
- **Clerk** para autenticación e invitación de usuarios
- **Cloudinary** para almacenamiento de imágenes
- **Google Gemini** para validación de incidentes con IA
- **Multer** para carga de archivos
- **Sharp / HEIC convert** para procesamiento de imágenes

## Estructura general

El proyecto usa una arquitectura por capas:

- `src/index.ts`: punto de entrada de la aplicación.
- `src/routers`: definición de rutas HTTP.
- `src/controllers`: adaptación entre HTTP y la lógica de negocio.
- `src/services`: reglas de negocio y validaciones principales.
- `src/repositorys`: acceso a MongoDB y servicios externos de persistencia.
- `src/data`: modelos principales de MongoDB.
- `src/data/types`: interfaces, tipos y constantes compartidas.
- `src/middlewares`: autenticación, subida de archivos, logging y manejo de errores.
- `src/config`: configuración de servicios como MongoDB y Cloudinary.

## Documentación

La documentación del proyecto se encuentra dentro de la carpeta `docs`:

- `docs/start.md`: pasos para iniciar el backend.
- `docs/structure.md`: explicación de la estructura interna del proyecto.
- `docs/ia.md`: explicación de la validación de incidentes con IA.
- `docs/use-cases.md`: casos de uso implementados por el backend.
