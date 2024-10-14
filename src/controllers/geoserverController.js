// src/controllers/geoserverController.js
import fetch from "node-fetch";
import proj4 from "proj4";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path"; // Importar 'path' para manejar rutas

const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
const utm32717 = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";
const buffer = 50; // Buffer para bbox

export const getMap = async (req, res) => {
  // Obtenemos longitud y latitud de los parámetros de consulta
  const { longitude, latitude, layer } = req.query;

  // Validación de los parámetros
  if (!longitude || !latitude || !layer) {
    return res
      .status(400)
      .json({ error: "Longitud, latitud y capa son requeridos" });
  }

  const lon = parseFloat(longitude);
  const lat = parseFloat(latitude);

  if (isNaN(lon) || isNaN(lat)) {
    return res.status(400).json({ error: "Coordenadas inválidas" });
  }

  // Convertir coordenadas a UTM
  const [x, y] = proj4(wgs84, utm32717, [lon, lat]);

  // Calcular bbox
  const bbox = `${(x - buffer).toFixed(2)},${(y - buffer).toFixed(2)},${(
    x + buffer
  ).toFixed(2)},${(y + buffer).toFixed(2)}`;

  // URL de GeoServer
  const url = `http://45.136.18.138:8080/geoserver/Ceer/wms?service=WMS&version=1.1.0&request=GetFeatureInfo&layers=${layer}&query_layers=${layer}&bbox=${bbox}&width=706&height=768&srs=EPSG:32717&info_format=application/json&x=123&y=456`;
  console.log(url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error en la consulta WMS");

    const data = await response.json();

    // Verificar si se obtuvieron características
    if (data.features.length > 0) {
      const properties = data.features[0].properties;

      // Generar PDF basado en las propiedades
      const pdfPath = await generatePDF(properties);

      // Devolver la URL del PDF para que el cliente lo descargue
      return res.json({
        message: "PDF generado exitosamente",
        pdfUrl: `/download/${path.basename(pdfPath)}`,
      });
    } else {
      return res
        .status(404)
        .json({ message: "No se encontraron características." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "Error fetching map from GeoServer",
        details: error.message,
      });
  }
};

async function generatePDF(properties) {
  const doc = new PDFDocument();
  const pdfPath = `./output/${properties.layer.replace(
    /\s+/g,
    "_"
  )}_${Date.now()}.pdf`; // Generar un nombre de archivo único

  // Configurar el flujo de escritura del PDF
  doc.pipe(fs.createWriteStream(pdfPath));

  // Personalizar el contenido según el color
  if (properties.color === "Rojo") {
    doc
      .fillColor("red")
      .fontSize(20)
      .text("Advertencia: Sensibilidad Alta", { align: "center" });
    doc
      .fillColor("black")
      .fontSize(12)
      .text("Se ha detectado un área de riesgo alto.", { align: "left" });
  } else if (properties.color === "Amarillo") {
    doc
      .fillColor("orange")
      .fontSize(20)
      .text("Advertencia: Sensibilidad Media", { align: "center" });
    doc
      .fillColor("black")
      .fontSize(12)
      .text("El área presenta una sensibilidad media.", { align: "left" });
  } else if (properties.color === "Verde") {
    doc
      .fillColor("green")
      .fontSize(20)
      .text("Información: Sensibilidad Baja", { align: "center" });
    doc
      .fillColor("black")
      .fontSize(12)
      .text("El área presenta una sensibilidad baja.", { align: "left" });
  }

  // Añadir más detalles al PDF
  doc.text(`Capa: ${properties.layer}`, { align: "left" });
  doc.text(`Riesgo: ${properties.riesgo}`, { align: "left" });

  // Finalizar el PDF y cerrar el flujo
  doc.end();

  return pdfPath; // Retornar la ruta del PDF generado
}
