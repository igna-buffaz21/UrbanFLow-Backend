import { MongoClient, Db } from "mongodb";
import { COLLECTION_NAMES } from "../data/types/global/const.global";

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
  await db.collection(COLLECTION_NAMES.DISTRICTS).createIndex({
    polygon: "2dsphere",
  });

  await db.collection(COLLECTION_NAMES.INCIDENTS).createIndex({
    location: "2dsphere",
  });

  await db.collection(COLLECTION_NAMES.INCIDENTS).createIndex({
    municipalityId: 1,
  });

  await db.collection(COLLECTION_NAMES.INCIDENTS).createIndex(
    { publicCode: 1 },
    {
      unique: true,
      partialFilterExpression: {
        publicCode: { $exists: true },
      },
    }
  );

  await db.collection(COLLECTION_NAMES.INCIDENT_REPORTS).createIndex(
    {
      incidentId: 1,
      createdBy: 1,
    },
    {
      unique: true,
    }
  );

  await db.collection(COLLECTION_NAMES.SUB_DISTRICTS).createIndex({
    polygon: "2dsphere",
  });

  await db.collection(COLLECTION_NAMES.SUB_DISTRICTS).createIndex(
    {
      municipalityId: 1,
      name: 1,
    },
    {
      unique: true,
    }
  );

  const systemMetricsCollection = db.collection(COLLECTION_NAMES.SYSTEM_METRICS);

  await systemMetricsCollection.createIndex({
    createdAt: -1,
  });

  try {
    await systemMetricsCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 365 }
    );
  }
  catch (err) {
    console.warn("No se pudo crear el índice TTL de system_metrics:", err);
  }
}

export function mongoDb(): Db {
  if (!db) {
    throw new Error("MongoDB no inicializado. Llama a connectMongo()");
  }

  return db;
}
