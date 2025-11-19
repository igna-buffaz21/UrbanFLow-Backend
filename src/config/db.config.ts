import mysql from "mysql2/promise";

export const mysqlPool = mysql.createPool({
  host: process.env.BD_HOST,
  user: process.env.BD_USER,
  password: process.env.BD_PASSWORD,
  database: process.env.BD_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});