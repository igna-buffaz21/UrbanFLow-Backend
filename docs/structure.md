# Estructura del backend

El backend está organizado con una arquitectura por capas. La idea principal es que cada carpeta tenga una responsabilidad clara y que el flujo de una petición sea fácil de seguir.

## Flujo principal

```txt
index.ts -> router -> controller -> service -> repository -> MongoDB
```

## Punto de entrada

`src/index.ts` inicializa la aplicación de Express.

Responsabilidades principales:

- Cargar variables de entorno.
- Configurar CORS.
- Habilitar JSON en las requests.
- Registrar middlewares globales.
- Conectar con MongoDB.
- Montar los routers bajo `/api`.
- Iniciar el servidor.
- Registrar el middleware global de errores.

## Routers

Carpeta: `src/routers`

Los routers definen los endpoints disponibles y conectan cada ruta con su controller correspondiente.

Ejemplo de responsabilidad:

- Definir método HTTP: `GET`, `POST`, `PATCH`, `DELETE`.
- Definir path: `/api/incidents`, `/api/users`, etc.
- Agregar middlewares puntuales como `requireAuth` o carga de imágenes.
- Llamar al método correcto del controller.

Los routers no deberían contener reglas de negocio.

## Controllers

Carpeta: `src/controllers`

Los controllers reciben la request HTTP y preparan los datos para llamar al service.

Responsabilidades principales:

- Leer `params`, `query`, `body` y archivos cargados.
- Obtener el usuario autenticado desde Clerk cuando corresponde.
- Llamar al service adecuado.
- Devolver la respuesta HTTP con el status correspondiente.
- Enviar errores al middleware global con `next(err)`.

Los controllers no deberían decidir reglas de negocio complejas.

## Services

Carpeta: `src/services`

Los services contienen la lógica de negocio del sistema.

Responsabilidades principales:

- Validar permisos por rol.
- Validar estados permitidos.
- Validar datos de entrada.
- Coordinar distintos repositories.
- Aplicar reglas del dominio.
- Procesar flujos completos, por ejemplo crear un incidente, validar con IA, subir imagen y guardar el resultado.

Ejemplos de reglas que viven en services:

- Solo un `citizen` puede crear incidentes.
- Solo un `admin` puede asignar operadores.
- Un `operator` solo puede modificar incidentes asignados a él.
- Un usuario `inactive` o `blocked` no puede operar.
- Un incidente duplicado puede quedar pendiente hasta que el usuario confirme la acción.

## Repositories

Carpeta: `src/repositorys`

Los repositories son la capa de acceso a datos y servicios externos relacionados con persistencia.

Responsabilidades principales:

- Consultar MongoDB.
- Insertar, actualizar o eliminar documentos.
- Ejecutar agregaciones.
- Mapear resultados de base de datos.
- Integrarse con servicios como Clerk o Cloudinary cuando actúan como fuente externa de datos.

Los repositories no deberían contener reglas de negocio. Su trabajo es obtener o persistir datos.

## Data

Carpeta: `src/data`

Esta carpeta contiene los modelos principales usados por MongoDB y el dominio del sistema.

Ejemplos:

- `user.model.ts`: usuarios, roles y estados.
- `incident.model.ts`: incidentes, estados, prioridad, imágenes y validación IA.
- `category.model.ts`: categorías de incidentes.
- `district.model.ts`: distritos y geometrías.
- `municipality.model.ts`: municipalidades.
- `incident-comment.model.ts`: comentarios.
- `incident-report.model.ts`: reportes.
- `pending-incident.model.ts`: incidentes pendientes por confirmación de duplicado.
- `incident-review.model.ts`: revisiones de IA.

Estos archivos definen la forma principal de los documentos y entidades que maneja el backend.

## Data types

Carpeta: `src/data/types`

Dentro de `data/types` se guardan tipos auxiliares, interfaces, constantes y contratos compartidos entre capas.

Responsabilidades principales:

- Definir interfaces de entrada y salida.
- Agrupar constantes globales.
- Centralizar valores válidos.
- Describir estructuras usadas por servicios, repositories o respuestas.

Ejemplos:

- `global/const.global.ts`: roles, nombres de colecciones y constantes compartidas.
- `incident/incidents.const.ts`: estados y prioridades válidas de incidentes.
- `incident/incidents.type.ts`: filtros, respuestas y estructuras relacionadas con incidentes.
- `ia/ia.type.ts`: contrato esperado para la respuesta de la IA.
- `ia/ia.prompts.ts`: prompt usado para validar incidentes.
- `user/user.type.ts`, `category/category.types.ts`, `municipality/municipality.type.ts`: tipos específicos por dominio.

## Middlewares

Carpeta: `src/middlewares`

Los middlewares agregan comportamiento transversal a la aplicación.

Ejemplos:

- `auth.middleware.ts`: valida que exista usuario autenticado.
- `upload.middleware.ts`: configura carga de imágenes con Multer.
- `logger.middleware.ts`: registra requests.
- `error.middleware.ts`: centraliza respuestas de error.

## Config

Carpeta: `src/config`

Contiene configuración de servicios usados por el backend.

Ejemplos:

- `mongodb.config.ts`: conexión con MongoDB.
- `cloudinary.config.ts`: configuración de Cloudinary.

## Resumen de responsabilidades

| Capa | Responsabilidad |
| --- | --- |
| `index.ts` | Inicializa Express, middlewares, rutas y conexión a MongoDB |
| `router` | Define endpoints y middlewares por ruta |
| `controller` | Traduce HTTP a llamadas de servicio |
| `service` | Contiene lógica de negocio y validaciones |
| `repository` | Accede a datos y servicios externos |
| `data` | Define modelos principales |
| `data/types` | Define interfaces, tipos y constantes compartidas |

