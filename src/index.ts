//Importacion de express y dotenv
import express from "express";
import "dotenv/config";

//Importacion de middlewares
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middlewares/error.middleware";

//Importacion de servicios
import { connectMongo } from "./config/mongodb.config";

//Importacion de rutas
import userRoutes from "./routers/user.router";
import districtRoutes from "./routers/district.router";
import municipalityRoutes from "./routers/municipality.router";
import incidentRoutes from "./routers/incident.router";
import healthRoutes from "./routers/health.router";
import authRouter from "./routers/auth.router";
import categoryRoutes from "./routers/category.router";
import incidentCommentRoutes from "./routers/incident.comment.router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/municipalities", municipalityRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/auth", authRouter);
app.use("/api/health", healthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/incident-comments", incidentCommentRoutes);
app.use(errorHandler);


async function startServer() { 
    try {
        await connectMongo();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } 
    catch (err) {
        console.error(`Error en el servidor: Error al iniciar el servidor ${err}`);
        process.exit(1);
    }
}

startServer();