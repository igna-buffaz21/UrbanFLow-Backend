import express from "express";
import "dotenv/config";
import { connectMongo, mongoDb } from "./config/mongodb.config";
import userRoutes from "./routers/user.router";
import districtRoutes from "./routers/district.router";
import municipalityRoutes from "./routers/municipality.router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/municipalities", municipalityRoutes);




app.get("/", async (req, res) => {
    try {

        const db = mongoDb();
        const mongoPing = await db.command({ ping: 1 });

        res.json({
            mensaje: `Servidor funcionando correctamente`,
            fecha_servidor: new Date(),
            mongo_ping: mongoPing.ok,
            suma: 1 + 1
        });
    } catch (err) {
        res.status(500).json({
            error: `Error en el servidor: Error de conexiones`,
            detalle: err
        });
    }
});

// Middleware global de errores - SIEMPRE va después de todas las rutas
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";

    res.status(statusCode).json({
        error: message,
        statusCode: statusCode
    });
});


async function startServer() {
    try {
        await connectMongo();
        console.log("Mongo conectado ");

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (err) {
        console.error(`Error en el servidor: Error al iniciar el servidor ${err}`);
        process.exit(1);
    }
}

startServer();