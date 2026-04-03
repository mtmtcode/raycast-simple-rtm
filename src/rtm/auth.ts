import { LocalStorage, open } from "@raycast/api";
import { callApi, buildAuthUrl } from "./client";
import { RtmFrobResponse, RtmAuthResponse } from "./types";

const TOKEN_KEY = "rtm_auth_token";
const FROB_KEY = "rtm_frob";

export class AuthPendingError extends Error {
  constructor() {
    super("Please authorize in your browser, then run this command again.");
    this.name = "AuthPendingError";
  }
}

export async function getStoredToken(): Promise<string | undefined> {
  return LocalStorage.getItem<string>(TOKEN_KEY);
}

export async function storeToken(token: string): Promise<void> {
  await LocalStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await LocalStorage.removeItem(TOKEN_KEY);
}

async function getStoredFrob(): Promise<string | undefined> {
  return LocalStorage.getItem<string>(FROB_KEY);
}

async function storeFrob(frob: string): Promise<void> {
  await LocalStorage.setItem(FROB_KEY, frob);
}

async function clearFrob(): Promise<void> {
  await LocalStorage.removeItem(FROB_KEY);
}

export async function authenticate(apiKey: string, sharedSecret: string): Promise<string> {
  // Check for existing token
  const token = await getStoredToken();
  if (token) {
    return token;
  }

  // Check for pending frob (user may have just authorized in browser)
  const existingFrob = await getStoredFrob();
  if (existingFrob) {
    try {
      const authResponse = await callApi<RtmAuthResponse>(sharedSecret, {
        method: "rtm.auth.getToken",
        api_key: apiKey,
        frob: existingFrob,
      });
      const newToken = authResponse.rsp.auth.token;
      await storeToken(newToken);
      await clearFrob();
      return newToken;
    } catch {
      // Frob expired or not yet authorized — get a new one
      await clearFrob();
    }
  }

  // Start fresh auth flow: get frob, open browser
  const frobResponse = await callApi<RtmFrobResponse>(sharedSecret, {
    method: "rtm.auth.getFrob",
    api_key: apiKey,
  });
  const frob = frobResponse.rsp.frob;
  await storeFrob(frob);

  const authUrl = buildAuthUrl(apiKey, sharedSecret, frob);
  await open(authUrl);

  throw new AuthPendingError();
}
