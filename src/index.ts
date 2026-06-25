//Importacion configuracion basica
import express from "express";
import "dotenv/config";
import cors from "cors";

//Importacion de middlewares
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";

//Importacion de servicios
import { connectMongo } from "./config/mongodb.config";
import { SystemService } from "./services/system.service";

//Importacion de rutas
import userRoutes from "./routers/user.router";
import districtRoutes from "./routers/district.router";
import municipalityRoutes from "./routers/municipality.router";
import incidentRoutes from "./routers/incident.router";
import healthRoutes from "./routers/health.router";
import authRouter from "./routers/auth.router";
import categoryRoutes from "./routers/category.router";
import incidentCommentRoutes from "./routers/incident.comment.router";
import incidentReportRoutes from "./routers/incident-report.router";
import iaRouterDev from "./routers/ia.router.dev";
import subDistrictsRoutes from "./routers/sub-districts.router";
import webhookRoutes from "./routers/webhook.router";
import systemRoutes from "./routers/system.router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.use("/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(clerkMiddleware());
app.use(requestLogger);

app.use("/api/users", userRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/municipalities", municipalityRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/auth", authRouter);
app.use("/api/health", healthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/incident-comments", incidentCommentRoutes);
app.use("/api/incident-report", incidentReportRoutes);
app.use("/api/ia-dev", iaRouterDev);
app.use("/api/sub-districts", subDistrictsRoutes);
app.use("/api/superadmin/system", systemRoutes);
app.use(errorHandler);

async function startServer() {
    try {
        await connectMongo();
        SystemService.startMetricsScheduler();

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
