// src/routes/geoserverRoutes.js
import express from "express";
import { getMap } from "../controllers/geoserverController.js";
import path from "path"; // Importar 'path' para manejar rutas

const router = express.Router();

// Ruta para obtener el mapa y generar el PDF
router.get("/getMap", getMap);

// Ruta para servir el PDF generado
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../output", filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send("Archivo no encontrado.");
    }
  });
});

export default router;
