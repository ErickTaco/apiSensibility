import { pool } from "../config/Db.js";
import { validationResult, body } from "express-validator";

// geoUtils.js

export const datos = async function (req, res) {
  const { longitude, latitude } = req.query;

  const utmCoords = geoToUTM(Number(latitude), Number(longitude));
  const zona = getCodeUTM(utmCoords.zone);
  //this.formSensibility.value.r01_x = utmCoords.x;
  //this.formSensibility.value.r01_y = utmCoords.y;
  //this.formSensibility.value.r01_zona_utm = this.getCodeUTM(utmCoords.zone);
  console.log(longitude, latitude);
  console.log(utmCoords);
  console.log(zona);

  const [events] = await pool.query(
    "SELECT a04_mapa.*, r03_riesgo_mapas.* FROM r03_riesgo_mapas INNER JOIN a04_mapa ON a04_mapa.a04_id = r03_riesgo_mapas.a04_id  WHERE a04_mapa.a04_alerta = 1  AND r03_riesgo_mapas.r01_id = 4028 ORDER BY a04_mapa.a04_orden;"
  );
  res.json(events);
};

// Middleware de validación
const validateUpdateST = [
  body("r01_id").notEmpty().withMessage("El campo r01_id es requerido"),
  body("r01_navegador")
    .notEmpty()
    .withMessage("El campo r01_navegador es requerido"),
  body("r01_update_at")
    .notEmpty()
    .withMessage("El campo r01_update_at es requerido"),
];

// Controlador para actualizar datos
export const updateST = async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    // Si hay coordenadas de latitud y longitud, convierte a UTM
    if (data.r01_lat && data.r01_lon) {
      const [x, y, zone] = convertLatLngToUtm(data.r01_lat, data.r01_lon);
      data.r01_x = x;
      data.r01_y = y;
      data.r01_zona_utm = zone;
    }

    // Actualiza la fecha de modificación
    data.r01_update_at = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Realiza la consulta para buscar y actualizar
    const [rows] = await pool.query(
      "UPDATE r01_consultas SET ? WHERE r01_id = ?",
      [data, data.r01_id]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    // Retorna un JSON con el estado "OK"
    res.json({ status: "OK" });
  } catch (error) {
    // Manejo de errores
    res.status(400).json({ error: error.message });
  }
};

// Exporta el middleware de validación y el controlador
export { validateUpdateST };

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
