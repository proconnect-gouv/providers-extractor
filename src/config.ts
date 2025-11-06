import * as dotenv from "dotenv";

dotenv.config();

function getConfig() {
  const mandatoryVariables = [
    "MONGODB_HOSTNAME",
    "MONGODB_USER",
    "MONGODB_PASSWORD",
    "MONGODB_NAME",
    "MONGODB_PORT",
    "GRIST_DOMAIN",
    "GRIST_DOC_ID",
    "GRIST_API_KEY",
    "IDP_NETWORK_NAME", // `internet` or `rie`
    "GRIST_DOC_IDP_TABLE",
    "GRIST_DOC_SP_TABLE",
  ] as const;
  const optionalVariables = ["HTTP_PROXY", "HTTPS_PROXY"] as const;
  const config = {
    ...mandatoryVariables.reduce((acc, varName) => {
      const value = process.env[varName];
      if (value === undefined) {
        throw new Error(`Missing mandatory environment variable: ${varName}`);
      }
      acc[varName] = value;
      return acc;
    }, {} as Record<(typeof mandatoryVariables)[number], string>),
    ...optionalVariables.reduce(
      (acc, varName) => ({ ...acc, [varName]: process.env[varName] }),
      {} as Record<(typeof optionalVariables)[number], string | undefined>
    ),
  };
  return config;
}

const config = getConfig();

export { config };
