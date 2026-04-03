import { showToast, Toast, LaunchProps, getPreferenceValues } from "@raycast/api";
import { authenticate, AuthPendingError, clearToken } from "./rtm/auth";
import { callApi } from "./rtm/client";
import { RtmPreferences, RtmTimelineResponse, RtmAddTaskResponse, RtmError } from "./rtm/types";

interface Arguments {
  taskName: string;
}

export default async function Command(props: LaunchProps<{ arguments: Arguments }>) {
  const { taskName } = props.arguments;
  const { apiKey, sharedSecret } = getPreferenceValues<RtmPreferences>();

  try {
    await showToast({ style: Toast.Style.Animated, title: "Adding task..." });

    const authToken = await authenticate(apiKey, sharedSecret);

    const timelineResponse = await callApi<RtmTimelineResponse>(sharedSecret, {
      method: "rtm.timelines.create",
      api_key: apiKey,
      auth_token: authToken,
    });

    await callApi<RtmAddTaskResponse>(sharedSecret, {
      method: "rtm.tasks.add",
      api_key: apiKey,
      auth_token: authToken,
      timeline: timelineResponse.rsp.timeline,
      name: taskName,
      parse: "1",
    });

    await showToast({ style: Toast.Style.Success, title: "Task added!", message: taskName });
  } catch (error) {
    if (error instanceof AuthPendingError) {
      await showToast({
        style: Toast.Style.Success,
        title: "Authorization required",
        message: "Please authorize in your browser, then run again.",
      });
      return;
    }

    if (error instanceof RtmError && error.code === "98") {
      await clearToken();
      await showToast({
        style: Toast.Style.Failure,
        title: "Token expired",
        message: "Please run again to re-authorize.",
      });
      return;
    }

    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to add task",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
