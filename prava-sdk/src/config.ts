import {
  DEFAULT_PRAVA_API_URL,
  type PravaSdkConfig,
} from "./types.js";

export function configFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PravaSdkConfig {
  const mockMode =
    env.PRAVA_SDK_MOCK === "true" ||
    (!env.PRAVA_SECRET_KEY && env.NODE_ENV !== "production");
  return {
    apiUrl: env.PRAVA_API_URL || DEFAULT_PRAVA_API_URL,
    secretKey: env.PRAVA_SECRET_KEY || "",
    publicBaseUrl:
      env.PRAVA_PUBLIC_BASE_URL ||
      `http://127.0.0.1:${env.PORT ?? "8792"}`,
    mockMode: mockMode && !env.PRAVA_SECRET_KEY,
  };
}
