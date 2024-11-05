import express from "express";
import multer from "multer"; // Asegúrate de importar multer aquí
import {
  getMap,
  uploadDocument,
  editDocument,
  downloadMapImage,
  pruebaImagen,
  ejemplo,
} from "../controllers/geoserverController.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: "uploads/" }); // Carpeta para almacenar archivos subidos

// Obtener __dirname usando import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para obtener el mapa y generar el PDF
router.get("/getMap", getMap);

router.get("/prueba", pruebaImagen);
router.get("/prueba2", ejemplo);

// Ruta para manejar la carga de documentos
router.get("/uploadDocument", uploadDocument); // Nueva ruta para mostrar el formulario de carga

// Ruta para editar el documento
router.get("/editDocument", editDocument);

//Ruta para descargar la imagen
router.get("/downloadImage", downloadMapImage);

// Ruta para servir el documento generado
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(__dirname, "../output", sanitizedFilename);
  console.log(filePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send("Archivo no encontrado.");
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        return res.status(500).send("Error al descargar el archivo.");
      }
    });
  });
});

router.get("/downloadXml/:filename", (req, res) => {
  const filename = req.params.filename;
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(__dirname, "../output", sanitizedFilename);
  console.log(filePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send("Archivo no encontrado.");
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        return res.status(500).send("Error al descargar el archivo.");
      }
    });
  });
});

// Ruta para servir la página del editor (puedes cambiar el nombre del archivo según tu implementación)
router.get("/editor", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/editor.html"));
});

router.get("/descargar", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/editor.html"));
});

export default router;
