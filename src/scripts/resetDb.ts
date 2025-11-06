import { MongoClient } from "mongodb";
import { config } from "../config";
import { serviceProviderFactory } from "../db/service-provider.factory";
import { identityProviderFactory } from "../db/identity-provider.factory";

async function resetDb() {
  const uri = `mongodb://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_HOSTNAME}:${config.MONGODB_PORT}/${config.MONGODB_NAME}?authSource=admin`;

  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    directConnection: true,
    family: 4, // Force IPv4
  });

  console.log("Connecting to MongoDB...");
  await client.connect();
  console.log("Connected to MongoDB.");

  const db = client.db(config.MONGODB_NAME);
  console.log("Dropping collections...");
  await db.dropCollection("provider");
  await db.dropCollection("client");
  console.log("Collections dropped.");

  const serviceProviderNames = ["ServiceProviderA", "ServiceProviderB"];
  const identityProviderNames = ["IdentityProviderA", "IdentityProviderB"];

  console.log("Recreating collections with sample data...");

  const serviceProviders = serviceProviderNames.map((serviceProviderName) =>
    serviceProviderFactory.createServiceProviderFromDb({
      name: serviceProviderName,
      scopes: ["openid", "email"],
      key: serviceProviderName.toLowerCase(),
    })
  );

  const identityProviders = identityProviderNames.map((identityProviderName) =>
    identityProviderFactory.createIdentityProviderFromDb({
      name: identityProviderName,
      siret: "12345678900013",
      fqdns: [`${identityProviderName.toLowerCase()}.com`],
      uid: identityProviderName.toLowerCase(),
    })
  );

  await db.collection("provider").insertMany(identityProviders);
  await db.collection("client").insertMany(serviceProviders);

  console.log("Collections recreated with sample data.");
  await client.close();
}

resetDb();
