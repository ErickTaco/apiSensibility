export const formatearRespuesta = (data, index) => {
  return {
    id: data.a04_id,
    nombre: data.a04_nombre,
    descripcion: data.a04_descripcion,
    ponderacion: data.a04_ponderacion,
    rterritorial: data.a04_rterritorial,
    fuente: data.a04_fuente,
    orden: index + 1, // Se establece el orden de acuerdo con la posición en el array
  };
};
