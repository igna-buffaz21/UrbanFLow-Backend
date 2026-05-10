import express from "express";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";

import { connectMongo, mongoDb } from "./config/mongodb.config";
import userRoutes from "./routers/user.router";
import authRouter from "./routers/auth.router";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(clerkMiddleware());

app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);

app.get("/", async (req, res) => {
    try {
        const db = mongoDb();
        const mongoPing = await db.command({ ping: 1 });

        res.json({
            mensaje: "Servidor funcionando correctamente",
            fecha_servidor: new Date(),
            mongo_ping: mongoPing.ok
        });
    } 
    catch (err) {
        res.status(500).json({
            error: "Error en el servidor: Error de conexiones",
            detalle: err
        });
    }
});

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

app.use(errorHandler);

startServer();