import type { AutomaticProvisioningActionState } from "./actions"

export function shouldStartAutomaticProvisioning(
  attempted: boolean,
  state: AutomaticProvisioningActionState
) {
  return !attempted && state.kind === "idle"
}
