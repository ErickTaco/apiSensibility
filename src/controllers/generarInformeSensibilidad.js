import { R01Consultas } from "../model/R01Consultas.js"; // Ajusta la ruta según tu estructura de archivos
import { pool } from "../config/Db.js";

export const updateST = async (req, res) => {
  const { r01_id, r01_navegador, r01_lat, r01_lon } = req.body;

  // Validación de entrada
  if (!r01_id || !r01_navegador) {
    return res
      .status(400)
      .json({ status: "BAD_REQUEST", message: "Missing required fields" });
  }

  try {
    const data = {
      r01_navegador,
      r01_update_at: new Date().toISOString().slice(0, 19).replace("T", " "), // Formato Y-m-d H:i:s
    };

    // Comprobación de las coordenadas
    if (r01_lat && r01_lon) {
      const Zone = convertLatLngToUtm(r01_lat, r01_lon); // Llama a la función de conversión
      data.r01_x = Zone[0];
      data.r01_y = Zone[1];
      data.r01_zona_utm = Zone[2];
    }

    // Actualización en la base de datos
    const consulta = await R01Consultas.findOne({ where: { r01_id } });

    if (!consulta) {
      return res
        .status(404)
        .json({ status: "NOT_FOUND", message: "Consulta not found" });
    }

    await consulta.update(data);
    return res.json({ status: "OK" });
  } catch (error) {
    console.error("Error updating consulta:", error);
    return res.status(500).json({ status: "ERROR", message: error.message });
  }
};
