export type OrganizationProvisioningFailureStatus =
  | "unauthenticated"
  | "no_active_organization"
  | "forbidden"
  | "provisioning_failed"

export type OrganizationProvisioningActionState =
  | { kind: "idle" }
  | { kind: "business"; status: OrganizationProvisioningFailureStatus }
  | { kind: "error" }

export const organizationProvisioningMessages = {
  unauthenticated:
    "Sua sessão terminou. Entre novamente antes de configurar a organização.",
  no_active_organization:
    "Selecione uma organização antes de continuar a configuração.",
  forbidden: "Somente um administrador pode configurar esta organização.",
  provisioning_failed:
    "Não foi possível configurar a organização agora. Tente novamente.",
} satisfies Record<OrganizationProvisioningFailureStatus, string>

export const organizationProvisioningUnavailableMessage =
  "Não foi possível configurar a organização agora. Tente novamente."
