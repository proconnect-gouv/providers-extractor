import { ObjectId } from "mongodb";
import { ServiceProviderFromDb } from "./service-provider.mongodb.entity";

const serviceProviderFactory = {
  createServiceProviderFromDb,
};

function createServiceProviderFromDb(
  partial: Partial<ServiceProviderFromDb>
): ServiceProviderFromDb {
  return {
    _id: new ObjectId(),
    title: "monfs",
    name: "monfs",
    redirect_uris: ["https://monfs.com"],
    post_logout_redirect_uris: ["https://monfs.com/logout"],
    IPServerAddressesAndRanges: ["192.0.0.0"],
    email: "v@b.com",
    active: true,
    type: "private",
    scopes: [],
    userinfo_signed_response_alg: "RS256",
    id_token_signed_response_alg: "RS256",
    response_types: ["code"],
    introspection_signed_response_alg: "RS256",
    introspection_encrypted_response_alg: "RS256",
    introspection_encrypted_response_enc: "A128CBC-HS256",
    grant_types: ["authorization_code"],
    jwks_uri: "https://monfs.com/jwks",
    client_secret: "clientSecret",
    createdAt: new Date(),
    secretCreatedAt: new Date(),
    updatedAt: new Date(),
    secretUpdatedAt: new Date(),
    key: "key",
    updatedBy: "user",
    ...partial,
  };
}

export { serviceProviderFactory };
