import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "";
const client = new MongoClient(uri);

let db: Db;

export async function connectMongo(): Promise<void> {
  await client.connect();
  db = client.db(process.env.MONGO_DB);
  console.log("MongoDB conectado");
}

export function mongoDb(): Db {
  if (!db) {
    throw new Error("MongoDB no inicializado. Llama a connectMongo()");
  }
  return db;
}