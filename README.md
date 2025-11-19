Backend Base en Express con TypeScript + MySQL + MongoDB

--------------------------------------------------------------------------------

Estructura Base:

.
├── src
│   ├── config
│   │   ├── db.config.ts          → Configuración MySQL
│   │   └── mongodb.config.ts     → Configuración MongoDB
│   │
│   ├── routes                    → Rutas de la API
│   ├── controllers               → Controladores (http)
│   ├── services                  → Servicios (lógica de negocio)
│   ├── repositories              → Acceso a datos (MySQL / Mongo)
│   ├── utils                     → Extras (constantes, etc)
│   │
│   └── index.ts                  → Punto de entrada de la app
│
├── .env                  → Variables de entorno
├── .gitignore            → Todo lo que ignora git al subir al repositorio           
├── package.json
└── tsconfig.json

--------------------------------------------------------------------------------

Flujo:

1) Router

Define las rutas de la API y llama al controlador correspondiente.
- No contiene lógica.

2) Controller

Recibe la request, llama al service y devuelve una respuesta.
- No contiene lógica.

3) Service

Contiene la lógica de negocio y llama a repository si hace falta.

4) Repository

Capa que accede a la base de datos y devuelve una respuesta a service.

--------------------------------------------------------------------------------

Scripts disponibles

- Modo desarrollo

npm run dev

- Compilar TypeScript

npm run build

- Ejecutar versión compilada

npm start

--------------------------------------------------------------------------------

Endpoint de prueba

GET /

Responde:

- Fecha del servidor

- Ping MySQL (NOW())

- Ping Mongo (db.command())

- Resultado de 1 + 1

Sirve para verificar que TODO funciona correctamente.