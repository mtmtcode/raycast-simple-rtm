import { createHash } from "node:crypto";
import { generateSignature, buildSignedUrl, callApi, buildAuthUrl } from "../../rtm/client";
import { RtmError } from "../../rtm/types";

describe("generateSignature", () => {
  it("sorts params alphabetically and produces correct MD5", () => {
    const params = { yxz: "foo", feg: "bar", abc: "baz" };
    const secret = "BANANAS";
    // Expected: MD5("BANANAS" + "abc" + "baz" + "feg" + "bar" + "yxz" + "foo")
    const expected = createHash("md5").update("BANANASabcbazfegbaryxzfoo").digest("hex");
    expect(generateSignature(secret, params)).toBe(expected);
  });

  it("handles empty params", () => {
    const expected = createHash("md5").update("SECRET").digest("hex");
    expect(generateSignature("SECRET", {})).toBe(expected);
  });

  it("handles single param", () => {
    const expected = createHash("md5").update("SECRETapi_keyABC123").digest("hex");
    expect(generateSignature("SECRET", { api_key: "ABC123" })).toBe(expected);
  });
});

describe("buildSignedUrl", () => {
  it("includes all params and api_sig in the URL", () => {
    const url = buildSignedUrl("https://example.com/", "secret", { foo: "bar", baz: "qux" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("foo")).toBe("bar");
    expect(parsed.searchParams.get("baz")).toBe("qux");
    expect(parsed.searchParams.get("api_sig")).toBeTruthy();
  });

  it("produces a valid api_sig", () => {
    const params = { method: "rtm.test.echo", api_key: "abc" };
    const url = buildSignedUrl("https://example.com/", "mysecret", params);
    const parsed = new URL(url);
    const expectedSig = generateSignature("mysecret", params);
    expect(parsed.searchParams.get("api_sig")).toBe(expectedSig);
  });
});

describe("callApi", () => {
  it("returns parsed response on success", async () => {
    const mockResponse = { rsp: { stat: "ok", frob: "test_frob" } };
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await callApi("secret", { method: "rtm.auth.getFrob", api_key: "key" }, mockFetch as typeof fetch);
    expect(result).toEqual(mockResponse);
  });

  it("throws RtmError on failure response", async () => {
    const mockResponse = { rsp: { stat: "fail", err: { code: "112", msg: "Method not found" } } };
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    await expect(callApi("secret", { method: "rtm.bad", api_key: "key" }, mockFetch as typeof fetch)).rejects.toThrow(
      RtmError,
    );
  });

  it("includes format=json in the request", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rsp: { stat: "ok" } }),
    });

    await callApi("secret", { method: "rtm.test", api_key: "key" }, mockFetch as typeof fetch);
    const calledUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(calledUrl.searchParams.get("format")).toBe("json");
  });
});

describe("buildAuthUrl", () => {
  it("builds URL with correct base and params", () => {
    const url = buildAuthUrl("mykey", "mysecret", "myfrob");
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.rememberthemilk.com/services/auth/");
    expect(parsed.searchParams.get("api_key")).toBe("mykey");
    expect(parsed.searchParams.get("perms")).toBe("write");
    expect(parsed.searchParams.get("frob")).toBe("myfrob");
    expect(parsed.searchParams.get("api_sig")).toBeTruthy();
  });
});
