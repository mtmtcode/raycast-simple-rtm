import { showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { clearToken } from "./rtm/auth";

export default async function Command() {
  const confirmed = await confirmAlert({
    title: "Sign out of Remember The Milk?",
    message: "You will need to re-authorize on next use.",
    primaryAction: { title: "Sign Out", style: Alert.ActionStyle.Destructive },
  });

  if (!confirmed) return;

  await clearToken();
  await showToast({ style: Toast.Style.Success, title: "Signed out" });
}
