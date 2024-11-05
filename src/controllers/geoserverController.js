import axios from "axios";
import proj4 from "proj4";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { Builder } from "xml2js";

import fetch from "node-fetch";
import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";
import puppeteer from "puppeteer";

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: "uploads/" }); // Carpeta para almacenar archivos subidos

// Obtener el directorio actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
const utm32717 = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";
const utm32617 = "+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs";

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

  const [xutm32617, yutm32617] = proj4(wgs84, utm32617, [lon, lat]);

  const [x, y] = proj4(wgs84, utm32717, [lon, lat]);
  console.log("datos de: " + x + " dfdsf: " + yutm32617);
  console.log("datos de: " + xutm32617 + " dfdsf: " + y);

  // Calcular bbox
  const bbox = `${(x - buffer).toFixed(2)},${(y - buffer).toFixed(2)},${(
    x + buffer
  ).toFixed(2)},${(y + buffer).toFixed(2)}`;
  console.log(bbox);
  // URL de GeoServer
  const url = `http://45.136.18.138:8080/geoserver/Ceer/wms?service=WMS&version=1.1.0&request=GetFeatureInfo&layers=${layer}&query_layers=${layer}&bbox=${bbox}&width=706&height=768&srs=EPSG:32717&info_format=application/json&x=123&y=456`;
  console.log(`URL de solicitud: ${url}`); // Log de la URL

  try {
    // Usar axios con un timeout de 30 segundos (30000 ms)
    const response = await axios.get(url, { timeout: 30000 });
    console.log(`Estado de respuesta: ${response.status}`); // Log del estado de respuesta

    const data = response.data;
    console.log("Datos recibidos de GeoServer:", data.features[0].properties); // Log de datos recibidos

    // Verificar si se obtuvieron características
    if (data.features.length > 0) {
      const properties = data.features[0].properties;

      // Redirigir a la ruta de carga del documento con los parámetros necesarios
      return res.redirect(
        `/api/geoserver/editDocument?layer=${properties.layer}&certificaciones=${properties.color}&datosGenerales=${data}`
      );
    } else {
      return res
        .status(404)
        .json({ message: "No se encontraron características." });
    }
  } catch (error) {
    console.error("Error en la solicitud a GeoServer:", error.message); // Log de error
    return res.status(500).json({
      error: "Error fetching map from GeoServer",
      details: error.message,
    });
  }
};

// Nueva función para manejar la carga de documentos
export const uploadDocument = (req, res) => {
  const { layer, certificaciones } = req.query;
  // Enviar HTML directamente
  res.send(`
    <form action="/api/geoserver/editDocument" method="post" enctype="multipart/form-data">
        <input type="hidden" name="layer" value="${layer}">
        <input type="hidden" name="certificaciones" value="${certificaciones}">
        <label for="document">Cargar documento Word:</label>
        <input type="file" name="document" accept=".docx" required>
        <button type="submit">Generar Documento</button>
    </form>
  `);
};

export const downloadMapImage = async (req, res) => {
  const url = `http://45.136.18.138:8080/geoserver/Ceer/wms?service=WMS&version=1.1.0&request=GetMap&layers=Ceer%3Ahumedal_ramsar&bbox=488716.40625%2C9445216.0%2C1149536.5%2C1.0163559E7&width=706&height=768&srs=EPSG%3A32717&styles=&format=image%2Fjpeg`;

  try {
    // Hacer la solicitud a GeoServer
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Establecer las cabeceras para descargar la imagen
    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="mapa.jpg"`,
    });

    // Enviar la imagen como respuesta
    res.send(response.data);
  } catch (error) {
    console.error("Error al descargar la imagen:", error.message);
    return res.status(500).json({
      error: "Error al descargar la imagen del mapa",
      details: error.message,
    });
  }
};

export const editDocument = async (req, res) => {
  const { layer, certificaciones, datosGenerales } = req.query;

  let riesgoText = "";

  switch (certificaciones.toLowerCase()) {
    case "rojo":
      riesgoText = "Sensibilidad Alta";
      break;
    case "amarillo":
      riesgoText = "Sensibilidad Media";
      break;
    case "verde":
      riesgoText = "Sensibilidad Baja";
      break;
    default:
      riesgoText = "Sensibilidad No Especificada"; // O cualquier valor por defecto
  }

  // Obtener datos desde la base de datos (ejemplo)
  const dataFromDB = {
    mapa: layer,
    color: certificaciones,
    // Otros datos a insertar...
  };

  // Leer el archivo de Word
  const filePath = path.join(__dirname, "../output/prueba.docx");
  const content = fs.readFileSync(filePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip);

  // Establecer los datos a insertar en el documento
  doc.setData(dataFromDB);

  // Renderizar el documento
  try {
    doc.render();
  } catch (error) {
    console.error("Error al renderizar el documento:", error);
    return res.status(500).json({ error: "Error al procesar el documento" });
  }

  // Generar la ruta del nuevo documento
  const outputPath = path.join(
    __dirname,
    "../output",
    `document_${Date.now()}.docx`
  );

  // Guardar el documento generado
  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(outputPath, buffer);

  // Crear el archivo XML
  const builder = new Builder();
  const xmlContent = builder.buildObject(datosGenerales);

  // Guardar el archivo XML
  const xmlFilePath = path.join(
    __dirname,
    "../output",
    `data_${Date.now()}.xml`
  );
  fs.writeFileSync(xmlFilePath, xmlContent);

  // Devolver la URL de los nuevos documentos para descarga

  const docUrl = `/api/geoserver/download/${path.basename(outputPath)}`;
  const xmlUrl = `/api/geoserver/downloadXml/${path.basename(xmlFilePath)}`;

  // Redirigir a la página de descarga, pasando las URLs como parámetros
  res.redirect(
    `/api/geoserver/descargar?docUrl=${encodeURIComponent(
      docUrl
    )}&xmlUrl=${encodeURIComponent(xmlUrl)}`
  );
};

const WGS84 = "EPSG:4326";
const EPSG32717 = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";

export const pruebaImagen = async (req, res) => {
  const { longitude, latitude, layer } = req.query;
  console.log(longitude, latitude, layer);

  // Validar los parámetros
  if (!longitude || !latitude || !layer) {
    return res
      .status(400)
      .send("Faltan parámetros: longitude, latitude o layer.");
  }

  try {
    // URL pública del HTML con coordenadas y capa en query params
    const port = process.env.PORT || 3001;
    const htmlPath = `http://localhost:${port}/mapCaptura.html?layer=${encodeURIComponent(
      layer
    )}&longitude=${longitude}&latitude=${latitude}`;

    console.log(`Cargando URL: ${htmlPath}`);

    // Inicia Puppeteer y navega a la página
    const browser = await puppeteer.launch({
      headless: true, // Cambia a true después de depurar
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
      ],
    });

    const page = await browser.newPage();

    await page.goto(htmlPath, { waitUntil: "networkidle2" });
    console.log("Página cargada en Puppeteer");

    // Espera que el mapa se haya renderizado completamente
    await page.waitForSelector("#map", { timeout: 60000 });
    console.log("El selector #map se encontró en la página");

    const mapElement = await page.$("#map");
    if (!mapElement) {
      throw new Error("No se pudo encontrar el elemento #map");
    }

    const screenshotBuffer = await mapElement.screenshot();
    console.log(`Tamaño del buffer: ${screenshotBuffer.length}`); // Verificar tamaño del buffer

    await browser.close();
    console.log("Navegador cerrado");

    // Guardar como archivo para verificar
    const filePath = path.join(__dirname, "map_test.png"); // Cambia según tu ruta
    fs.writeFile(filePath, screenshotBuffer, (err) => {
      if (err) {
        console.error("Error al guardar la imagen:", err);
        return res
          .status(500)
          .send(`Error al guardar la imagen: ${err.message}`);
      } else {
        console.log("Imagen guardada como map_test.png");

        // Enviar el archivo como respuesta
        res.set("Content-Type", "image/png");
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error("Error al enviar la imagen:", err);
            res.status(err.status).end();
          } else {
            console.log("Imagen enviada correctamente");
          }
        });
      }
    });
  } catch (error) {
    console.error("Error al capturar el mapa:", error);
    res.status(500).send(`Error al capturar el mapa: ${error.message}`);
  }
};
export const ejemplo = async (req, res) => {
  const { longitude, latitude, layer } = req.query;
  const utmCoords = geoToUTM(Number(latitude), Number(longitude));
  const longitudeutmCoords = utmCoords.x;
  const latitudeutmCoords = utmCoords.y;
  const formSensibilityr01_zona_utm = getCodeUTM(utmCoords.zone);

  console.log(longitudeutmCoords);
};

// Función que transforma de grados a radianes
const deg2rad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Función que transforma de coordenadas geográficas a UTM
const geoToUTM = (latitude, longitude) => {
  const earthRadius = 6378137; // Radio de la Tierra en metros
  const k0 = 0.9996; // Factor de escala de la proyección

  // Constantes para el cálculo
  const a = 6378137;
  const e = 0.081819191;

  const latRad = deg2rad(latitude);
  const lonRad = deg2rad(longitude);

  const lonOrigin = Math.floor((longitude + 180) / 6) * 6 - 180 + 3; // Longitud del meridiano central
  const lonOriginRad = deg2rad(lonOrigin);

  const eccPrimeSquared = (e * e) / (1 - e * e); // Eccentricidad al cuadrado

  const N =
    earthRadius / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad)); // Radio de curvatura en el plano normal
  const T = Math.tan(latRad) * Math.tan(latRad); // Tangente cuadrada de la latitud
  const C = eccPrimeSquared * Math.cos(latRad) * Math.cos(latRad); // Coeficiente de la segunda potencia de la función de expansión

  const A = Math.cos(latRad) * (lonRad - lonOriginRad);
  const M =
    earthRadius *
    ((1 -
      (e * e) / 4 -
      (3 * e * e * e * e) / 64 -
      (5 * e * e * e * e * e * e) / 256) *
      latRad -
      ((3 * e * e) / 8 +
        (3 * e * e * e * e) / 32 +
        (45 * e * e * e * e * e * e) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * e * e * e * e) / 256 + (45 * e * e * e * e * e * e) / 1024) *
        Math.sin(4 * latRad) -
      ((35 * e * e * e * e * e * e) / 3072) * Math.sin(6 * latRad));

  const easting =
    k0 *
      N *
      (A +
        (1 - T + C) * ((A * A * A) / 6) +
        (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) *
          ((A * A * A * A * A) / 120) +
        ((1 - T + 2 * C) * (A * A)) / 2) +
    500000; // Coordenada este (x)

  let northing =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        ((A * A) / 2 +
          (5 - T + 9 * C + 4 * C * C) * ((A * A * A * A) / 24) +
          (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) *
            ((A * A * A * A * A * A) / 720))); // Coordenada norte (y)

  let hemisphere = latitude >= 0 ? "N" : "S";

  if (latitude < 0) {
    northing += 10000000; // Corrección para el hemisferio sur
  }

  const zone = Math.floor((longitude + 180) / 6) + 1; // Determinación de la zona UTM

  return { x: easting, y: northing, zone: `${zone}${hemisphere}` };
};

// Función que obtiene el código de la zona UTM
const getCodeUTM = (zUTM) => {
  if (zUTM != null) {
    const zUTMStr = zUTM.toString();
    const zonaUTMMap = {
      "17N": "32617",
      "17S": "32717",
      "18N": "32618",
      "18S": "32718",
    };
    return zonaUTMMap[zUTMStr] || null;
  }
  return null;
};
