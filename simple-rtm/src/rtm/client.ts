import { createHash } from "node:crypto";
import { RtmBaseResponse, RtmError } from "./types";

const REST_BASE_URL = "https://api.rememberthemilk.com/services/rest/";
const AUTH_BASE_URL = "https://www.rememberthemilk.com/services/auth/";

export function generateSignature(sharedSecret: string, params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  return createHash("md5")
    .update(sharedSecret + paramString)
    .digest("hex");
}

export function buildSignedUrl(baseUrl: string, sharedSecret: string, params: Record<string, string>): string {
  const apiSig = generateSignature(sharedSecret, params);
  const allParams = { ...params, api_sig: apiSig };
  const query = new URLSearchParams(allParams).toString();
  return `${baseUrl}?${query}`;
}

export async function callApi<T extends RtmBaseResponse>(
  sharedSecret: string,
  params: Record<string, string>,
  fetchFn: typeof fetch = fetch,
): Promise<T> {
  const fullParams = { ...params, format: "json" };
  const url = buildSignedUrl(REST_BASE_URL, sharedSecret, fullParams);
  const response = await fetchFn(url);
  const data = (await response.json()) as T | { rsp: { stat: "fail"; err: { code: string; msg: string } } };

  if (data.rsp.stat === "fail") {
    const err = data.rsp.err!;
    throw new RtmError(err.code, err.msg);
  }

  return data as T;
}

export function buildAuthUrl(apiKey: string, sharedSecret: string, frob: string): string {
  const params = { api_key: apiKey, perms: "write", frob };
  return buildSignedUrl(AUTH_BASE_URL, sharedSecret, params);
}
