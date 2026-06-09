# Iniciar servidor en el BackEnd

## 1. Clonar repositorio

git clone https://github.com/igna-buffaz21/UrbanFlow-Backend.git

## 2. Instalar dependencias

npm i

## 3. Configuracion de .env

cp .env.example .env

## 4. Configuracion de variables de entorno

- Ingresar numero de puerto (por defecto 3000)

- Ingresar MONGO_URI y MONGO_DB

- Traer la APISECRET Y PUBLISHABLE_KEY de Clerk

- Completar la url del frontend en el .env

- CLERK_INVITATION_REDIRECT_URL se forma con FRONTEND_URL + /accept-invitation

- Traer la APIKEY, APISECRET y CLOUDNAME de Cloudinary

- Traer la APIKEY de Gemini

## 5. Iniciar servidor en desarrollo

npm run dev

 - La aplicacion estara disponible en:

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/