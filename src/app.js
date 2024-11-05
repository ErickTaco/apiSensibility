// src/app.js
import express from "express";
import cors from "cors"; // Importa el paquete cors
import geoserverRoutes from "./routes/geoserverRoutes.js";

const app = express();

// Habilita CORS para todas las rutas
app.use(cors());
app.use(express.static("public"));

// Rutas
app.use("/api/geoserver", geoserverRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendoooo en el puerto ${PORT}`);
});
