import { config } from "dotenv";
config();

export const PORT = process.env.PORT || 3001;
export const DB_USER = process.env.DB_USER || "admin";
export const DB_PASSWORD = process.env.DB_PASSWORD || "Admin@12345";
export const DB_HOST = process.env.DB_HOST || "45.136.18.138";
export const DB_DATABASE = process.env.DB_DATABASE || "riesgos";
export const DB_PORT = process.env.DB_PORT || 3306;
