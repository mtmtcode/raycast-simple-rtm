// RTM API response types

export interface RtmBaseResponse {
  rsp: {
    stat: "ok" | "fail";
    err?: { code: string; msg: string };
  };
}

export interface RtmFrobResponse {
  rsp: {
    stat: "ok";
    frob: string;
  };
}

export interface RtmAuthResponse {
  rsp: {
    stat: "ok";
    auth: {
      token: string;
      perms: string;
      user: { id: string; username: string; fullname: string };
    };
  };
}

export interface RtmTimelineResponse {
  rsp: {
    stat: "ok";
    timeline: string;
  };
}

export interface RtmAddTaskResponse {
  rsp: {
    stat: "ok";
    transaction: { id: string; undoable: string };
    list: { id: string };
  };
}

export class RtmError extends Error {
  code: string;

  constructor(code: string, msg: string) {
    super(msg);
    this.name = "RtmError";
    this.code = code;
  }
}

export interface RtmPreferences {
  apiKey: string;
  sharedSecret: string;
}
