import dotenv from "dotenv";

dotenv.config();

const config = {
  GEO_SERVER_URL:
    process.env.GEO_SERVER_URL || "http://45.136.18.138:8080/geoserver",
  LAYER_NAME: process.env.LAYER_NAME || "Ceer:humedal_ramsar",
};

export default config;
