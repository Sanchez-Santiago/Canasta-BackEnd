import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./shared/middlewares/auth";
import { errorMiddleware } from "./shared/middlewares/error";
import authRoutes from "./modules/user/user.router";
import grupoRoutes from "./modules/grupo/grupo.router";
import { getDb } from "./config/database";
import { env } from "./config/env";

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);

app.use("/auth", authRoutes);
app.use("/grupos", grupoRoutes);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

app.use(errorMiddleware);

const PORT = env.PORT || 3000;
const HOST = "0.0.0.0";
const API_URL = `http://localhost:${PORT}`;

async function iniciarServidor() {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    console.log("✅ Conexión a la base de datos establecida correctamente");
    console.log(`📌 URL de la base de datos: ${env.TURSO_DATABASE_URL}`);
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Canasta+ backend escuchando en ${HOST}:${PORT}`);
    console.log(`🌍 Entorno: ${env.NODE_ENV}`);
    console.log(`🔗 API disponible en: ${API_URL}`);
    console.log(`📚 Rutas de Auth:`);
    console.log(`   POST ${API_URL}/auth/registrar`);
    console.log(`   POST ${API_URL}/auth/login`);
    console.log(`   GET  ${API_URL}/auth/yo`);
    console.log(`   POST ${API_URL}/auth/logout`);
  });
}

iniciarServidor();

