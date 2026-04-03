import { LocalStorage, open } from "@raycast/api";
import { authenticate, AuthPendingError } from "../../rtm/auth";
import * as client from "../../rtm/client";

jest.mock("../../rtm/client");

const mockedCallApi = client.callApi as jest.MockedFunction<typeof client.callApi>;
const mockedBuildAuthUrl = client.buildAuthUrl as jest.MockedFunction<typeof client.buildAuthUrl>;

beforeEach(() => {
  (LocalStorage as unknown as { _clear: () => void })._clear();
  jest.clearAllMocks();
});

describe("authenticate", () => {
  it("returns stored token immediately if available", async () => {
    await LocalStorage.setItem("rtm_auth_token", "existing_token");

    const token = await authenticate("key", "secret");
    expect(token).toBe("existing_token");
    expect(mockedCallApi).not.toHaveBeenCalled();
  });

  it("exchanges stored frob for token on second run", async () => {
    await LocalStorage.setItem("rtm_frob", "pending_frob");

    mockedCallApi.mockResolvedValueOnce({
      rsp: {
        stat: "ok",
        auth: { token: "new_token", perms: "write", user: { id: "1", username: "u", fullname: "U" } },
      },
    });

    const token = await authenticate("key", "secret");
    expect(token).toBe("new_token");
    expect(mockedCallApi).toHaveBeenCalledWith("secret", {
      method: "rtm.auth.getToken",
      api_key: "key",
      frob: "pending_frob",
    });
    // Token stored, frob cleared
    expect(await LocalStorage.getItem("rtm_auth_token")).toBe("new_token");
    expect(await LocalStorage.getItem("rtm_frob")).toBeUndefined();
  });

  it("starts fresh auth flow when no token or frob exists", async () => {
    mockedCallApi.mockResolvedValueOnce({
      rsp: { stat: "ok", frob: "new_frob" },
    });
    mockedBuildAuthUrl.mockReturnValue("https://rtm.com/auth?frob=new_frob");

    await expect(authenticate("key", "secret")).rejects.toThrow(AuthPendingError);

    expect(mockedCallApi).toHaveBeenCalledWith("secret", {
      method: "rtm.auth.getFrob",
      api_key: "key",
    });
    expect(await LocalStorage.getItem("rtm_frob")).toBe("new_frob");
    expect(open).toHaveBeenCalledWith("https://rtm.com/auth?frob=new_frob");
  });

  it("gets new frob when stored frob is expired", async () => {
    await LocalStorage.setItem("rtm_frob", "expired_frob");

    // First call (getToken) fails
    mockedCallApi.mockRejectedValueOnce(new Error("Invalid frob"));
    // Second call (getFrob) succeeds
    mockedCallApi.mockResolvedValueOnce({
      rsp: { stat: "ok", frob: "fresh_frob" },
    });
    mockedBuildAuthUrl.mockReturnValue("https://rtm.com/auth?frob=fresh_frob");

    await expect(authenticate("key", "secret")).rejects.toThrow(AuthPendingError);
    expect(await LocalStorage.getItem("rtm_frob")).toBe("fresh_frob");
  });
});
