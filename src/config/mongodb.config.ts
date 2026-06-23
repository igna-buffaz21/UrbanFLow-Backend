import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "";
const client = new MongoClient(uri);

let db: Db;

export async function connectMongo(): Promise<void> {
  await client.connect();

  db = client.db(process.env.MONGO_DB);

  console.log("MongoDB conectado");

  await createIndexes();
}

async function createIndexes(): Promise<void> {
  await db.collection("districts").createIndex({
    polygon: "2dsphere",
  });

  await db.collection("incidents").createIndex({
    location: "2dsphere",
  });

  await db.collection("incidents").createIndex({
    municipalityId: 1,
  });

  await db.collection("incidents").createIndex(
    { publicCode: 1 },
    {
      unique: true,
      partialFilterExpression: {
        publicCode: { $exists: true },
      },
    }
  );

  await db.collection("incident_reports").createIndex(
    {
      incidentId: 1,
      createdBy: 1,
    },
    {
      unique: true,
    }
  );

  await db.collection("sub_districts").createIndex({
    polygon: "2dsphere",
  });

  await db.collection("sub_districts").createIndex(
    {
      municipalityId: 1,
      name: 1,
    },
    {
      unique: true,
    }
  );
}

export function mongoDb(): Db {
  if (!db) {
    throw new Error("MongoDB no inicializado. Llama a connectMongo()");
  }

  return db;
}