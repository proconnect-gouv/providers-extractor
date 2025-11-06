import { ObjectId } from "mongodb";
import { IdentityProviderFromDb } from "./identity-provider.mongodb.entity";

function createIdentityProviderFromDb(
  partial: Partial<IdentityProviderFromDb>
): IdentityProviderFromDb {
  return {
    _id: new ObjectId(),
    name: "Default Name",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
    updatedBy: "jean_patoche",
    active: true,
    authzURL: "https://default.authorization-url.fr",
    clientID: "default_client_id",
    client_secret: "default_client_secret",
    discoveryUrl: "https://default.discovery-url.fr",
    discovery: true,
    endSessionURL: "https://default.logout-url.fr",
    url: "https://default.issuer.fr",
    statusURL: "https://default.status-url.fr",
    title: "Default Title",
    id_token_encrypted_response_alg: "default_alg",
    id_token_encrypted_response_enc: "default_enc",
    id_token_signed_response_alg: "ES256",
    jwksURL: "https://default.jwks-url.fr",
    siret: "",
    supportEmail: "support@email.fr",
    token_endpoint_auth_method: "default_auth_method",
    tokenURL: "https://default.token-url.fr",
    userinfo_encrypted_response_alg: "default_userinfo_alg",
    userinfo_encrypted_response_enc: "default_userinfo_enc",
    userinfo_signed_response_alg: "ES256",
    userInfoURL: "https://default.userinfo-url.fr",
    uid: "default_uid",
    fqdns: [],
    isRoutingEnabled: true,
    ...partial,
  };
}

const identityProviderFactory = {
  createIdentityProviderFromDb,
};

export { identityProviderFactory };
