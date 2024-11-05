import { DataTypes } from "sequelize";
import sequelize from "../config/Db.js";

const R01Consultas = sequelize.define(
  "R01Consultas",
  {
    r01_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    p01_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: undefined,
    },
    p06_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: undefined,
    },
    p15_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_apellido: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_institucion: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_correo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_fechahora: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_infoguia: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_rutaguia: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_rutaguial: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_dim_ambiental: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_dim_laboral: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_dim_social: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_procesos: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_docshabilitantes: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_checklist: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_ip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_x: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_y: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_lat: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_lon: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_zona_utm: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_navegador: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_create_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_create_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_update_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_update_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_descarga_guia: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
    r01_descarga_rep: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: undefined,
    },
  },
  {
    tableName: "r01_consultas",
    timestamps: false, // Desactiva createdAt y updatedAt automáticos
  }
);

export default R01Consultas;
