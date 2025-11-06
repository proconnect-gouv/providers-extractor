import { MongoClient } from "mongodb";
import axios, { AxiosResponse } from "axios";
import * as https from "https";
import { ServiceProviderFromDb } from "../db/service-provider.mongodb.entity";
import { IdentityProviderFromDb } from "../db/identity-provider.mongodb.entity";
import { config } from "../config";

type GristIdentityProviderRecord = {
  UID: string;
  Nom: string;
  Titre: string;
  Actif: string;
  Reseau: string;
  URL_de_decouverte: string;
  Liste_des_FQDN: string;
  SIRET_par_defaut: string;
  Alg_ID_token: string;
  Alg_userinfo: string;
};

interface GristServiceProviderRecord {
  UID: string;
  Nom: string;
  Actif: string;
  Reseau: string;
  Accepte_le_prive: string;
  Liste_des_URL_de_callback: string;
  Liste_des_URL_de_logout: string;
  Alg_ID_token: string;
  Alg_userinfo: string;
  Scopes: string;
}

async function getProvidersFromDb(): Promise<{
  identityProviders: Record<string, IdentityProviderFromDb>;
  serviceProviders: Record<string, ServiceProviderFromDb>;
}> {
  const uri = `mongodb://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_HOSTNAME}:${config.MONGODB_PORT}/${config.MONGODB_NAME}?authSource=admin`;

  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    directConnection: true,
    family: 4, // Force IPv4
  });

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB.");

    // Initialize replica set if needed
    try {
      const admin = client.db("admin");
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log("Replica set status:", status.set);
    } catch (error: any) {
      if (error.codeName === "NotYetInitialized") {
        console.log("Initializing replica set...");
        const admin = client.db("admin");
        await admin.command({
          replSetInitiate: {
            _id: "rs0",
            members: [
              {
                _id: 0,
                host: `${config.MONGODB_HOSTNAME}:${config.MONGODB_PORT}`,
              },
            ],
          },
        });
        console.log("Replica set initialized. Waiting 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const db = client.db(config.MONGODB_NAME);

    console.log("Fetching identity providers...");
    const identityProvidersArray = await db
      .collection("provider")
      .find(
        {},
        {
          projection: {
            name: 1,
            title: 1,
            uid: 1,
            discoveryUrl: 1,
            active: 1,
            siret: 1,
            fqdns: 1,
            id_token_signed_response_alg: 1,
            userinfo_signed_response_alg: 1,
          },
        }
      )
      .toArray();

    console.log(`Fetched ${identityProvidersArray.length} identity providers`);

    const identityProviders: Record<string, IdentityProviderFromDb> = {};
    for (const provider of identityProvidersArray) {
      identityProviders[provider.uid] =
        provider as unknown as IdentityProviderFromDb;
    }

    console.log("Fetching service providers...");

    const serviceProvidersArray = await db
      .collection("client")
      .find(
        {},
        {
          projection: {
            name: 1,
            key: 1,
            active: 1,
            redirect_uris: 1,
            post_logout_redirect_uris: 1,
            type: 1,
            scopes: 1,
            id_token_signed_response_alg: 1,
            userinfo_signed_response_alg: 1,
          },
        }
      )
      .toArray();

    console.log(`Fetched ${serviceProvidersArray.length} service providers`);

    const serviceProviders: Record<string, ServiceProviderFromDb> = {};
    for (const provider of serviceProvidersArray) {
      serviceProviders[provider.key] =
        provider as unknown as ServiceProviderFromDb;
    }

    return { identityProviders, serviceProviders };
  } finally {
    await client.close();
  }
}

function identityProviderToRecord(
  provider: IdentityProviderFromDb
): GristIdentityProviderRecord {
  return {
    UID: provider.uid,
    Nom: provider.name,
    Titre: provider.title,
    Actif: provider.active ? "Oui" : "Non",
    Reseau: config.IDP_NETWORK_NAME,
    URL_de_decouverte:
      provider.discoveryUrl &&
      typeof provider.discoveryUrl === "string" &&
      provider.discoveryUrl.length > 0
        ? provider.discoveryUrl
        : "",
    Liste_des_FQDN: provider.fqdns.join(", "),
    SIRET_par_defaut: provider.siret,
    Alg_ID_token: provider.id_token_signed_response_alg || "",
    Alg_userinfo: provider.userinfo_signed_response_alg || "",
  };
}

function serviceProviderToRecord(
  provider: ServiceProviderFromDb
): GristServiceProviderRecord {
  return {
    UID: provider.key,
    Nom: provider.name,
    Actif: provider.active ? "Oui" : "Non",
    Reseau: config.IDP_NETWORK_NAME,
    Accepte_le_prive: provider.type === "private" ? "Oui" : "Non",
    Liste_des_URL_de_callback: provider.redirect_uris.join(", "),
    Liste_des_URL_de_logout: provider.post_logout_redirect_uris.join(", "),
    Alg_ID_token: provider.id_token_signed_response_alg || "",
    Alg_userinfo: provider.userinfo_signed_response_alg || "",
    Scopes: provider.scopes.join(", "),
  };
}

async function updateGristTable<T, R>(
  providers: Record<string, T>,
  tableId: string,
  providerToRecord: (provider: T) => R
): Promise<boolean> {
  const gristDocUrl = `https://${config.GRIST_DOMAIN}/api/docs/${config.GRIST_DOC_ID}/tables/${tableId}/records`;

  const axiosConfig: any = {
    headers: {
      Authorization: `Bearer ${config.GRIST_API_KEY}`,
    },
  };

  if (config.HTTP_PROXY || config.HTTPS_PROXY) {
    axiosConfig.proxy = false;
    axiosConfig.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  let getResponse: AxiosResponse;

  try {
    getResponse = await axios.get(gristDocUrl, axiosConfig);
  } catch (error: any) {
    console.error("Error during GET request to Grist:", error.response.data);
    return false;
  }

  const body = getResponse.data;

  const records: R[] = Object.values(providers).map((provider) =>
    providerToRecord(provider)
  );

  const recordUpdates = records.map((record) => ({
    fields: record,
    require: {
      Reseau: config.IDP_NETWORK_NAME,
      UID: (record as any).UID,
    },
  }));

  let hasChanged = false;

  const originals: Record<string, any> = {};
  for (const record of body.records) {
    if (record.fields.Reseau === config.IDP_NETWORK_NAME) {
      originals[record.fields.UID] = record.fields;
    }
  }

  for (const recordUpdate of recordUpdates) {
    if (!((recordUpdate.fields as any).UID in originals)) {
      console.log("nouveau fournisseur :", (recordUpdate.fields as any).Nom);
      console.log(recordUpdate.fields);
      hasChanged = true;
      break;
    }

    for (const [field, value] of Object.entries(recordUpdate.fields as any)) {
      if (
        !(field in originals[(recordUpdate.fields as any).UID]) ||
        originals[(recordUpdate.fields as any).UID][field] !== value
      ) {
        console.log(
          `[${(recordUpdate.fields as any).Nom}] changement ${field} : ${
            originals[(recordUpdate.fields as any).UID][field]
          } -> ${value}`
        );
        hasChanged = true;
      }
    }

    if (hasChanged) {
      break;
    }
  }

  if (!hasChanged) {
    console.log("No changes detected.");
    return true;
  }

  recordUpdates.sort((a, b) => {
    const aKey = `${(a.fields as any).Reseau}/${(a.fields as any).Nom}`;
    const bKey = `${(b.fields as any).Reseau}/${(b.fields as any).Nom}`;
    return aKey.localeCompare(bKey);
  });

  console.log(recordUpdates.length + " records to update in Grist.");

  try {
    await axios.put(gristDocUrl, { records: recordUpdates }, axiosConfig);
  } catch (error: any) {
    console.error("Error during PUT request to Grist:", error.response.data);
    return false;
  }

  return true;
}

async function extractProviders() {
  const { identityProviders, serviceProviders } = await getProvidersFromDb();
  await updateGristTable(
    identityProviders,
    config.GRIST_DOC_IDP_TABLE,
    identityProviderToRecord
  );
  await updateGristTable(
    serviceProviders,
    config.GRIST_DOC_SP_TABLE,
    serviceProviderToRecord
  );
}

extractProviders();
