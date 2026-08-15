// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-CAPABILITY-REGISTRY-183.ts
// Sovereign AI Capability Registry
// ============================================================

export type SovereignCapabilityStatus =
  | "REGISTERED"
  | "AVAILABLE"
  | "BUSY"
  | "DEGRADED"
  | "DISABLED"
  | "OFFLINE";

export type SovereignCapabilityRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignCapability {
  id: string;

  name: string;

  description: string;

  version: string;

  provider:
    | "CORE"
    | "AGENT"
    | "WORKER"
    | "SYSTEM"
    | "INTERNAL_SERVICE";

  actions: string[];

  status: SovereignCapabilityStatus;

  risk: SovereignCapabilityRisk;

  autonomous: boolean;

  requiresVerification: boolean;

  requiresOwnerAuthority?: boolean;

  metadata?: Record<string, unknown>;

  registeredAt: number;

  updatedAt: number;
}

export interface SovereignCapabilityRequest {
  capability: string;

  action: string;

  autonomous: boolean;

  context?: Record<string, unknown>;
}

export interface SovereignCapabilityResolution {
  allowed: boolean;

  capability?: SovereignCapability;

  reason: string;

  resolvedAt: number;
}

export interface SovereignCapabilityHealth {
  capabilityId: string;

  healthy: boolean;

  latencyMs?: number;

  message?: string;

  checkedAt: number;
}

export interface SovereignCapabilityRegistryAdapter {
  persistCapability?(
    capability: SovereignCapability
  ): Promise<void>;

  removeCapability?(
    capabilityId: string
  ): Promise<void>;

  healthCheck?(
    capability: SovereignCapability
  ): Promise<SovereignCapabilityHealth>;

  recordEvent?(event: {
    type: string;

    capabilityId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAICapabilityRegistry {
  private readonly capabilities =
    new Map<string, SovereignCapability>();

  constructor(
    private readonly adapter:
      SovereignCapabilityRegistryAdapter
  ) {}

  public async register(
    capability: SovereignCapability
  ): Promise<SovereignCapability> {
    this.validate(capability);

    if (
      this.capabilities.has(
        capability.id
      )
    ) {
      throw new Error(
        `Capability already registered: ${capability.id}`
      );
    }

    const normalized:
      SovereignCapability = {
        ...capability,

        actions: [
          ...new Set(
            capability.actions
          )
        ],

        status:
          capability.status ||
          "REGISTERED",

        registeredAt:
          capability.registeredAt ||
          Date.now(),

        updatedAt:
          Date.now()
      };

    this.capabilities.set(
      normalized.id,
      normalized
    );

    await this.persist(
      normalized
    );

    await this.record(
      "CAPABILITY_REGISTERED",
      normalized.id,
      {
        name:
          normalized.name,

        provider:
          normalized.provider,

        version:
          normalized.version
      }
    );

    return this.clone(
      normalized
    );
  }

  public async updateStatus(
    capabilityId: string,
    status: SovereignCapabilityStatus
  ): Promise<SovereignCapability> {
    const capability =
      this.getMutable(
        capabilityId
      );

    capability.status =
      status;

    capability.updatedAt =
      Date.now();

    await this.persist(
      capability
    );

    await this.record(
      "CAPABILITY_STATUS_CHANGED",
      capability.id,
      {
        status
      }
    );

    return this.clone(
      capability
    );
  }

  public resolve(
    request: SovereignCapabilityRequest
  ): SovereignCapabilityResolution {
    const candidates =
      [...this.capabilities.values()]
        .filter(capability => {
          return (
            (
              capability.id ===
                request.capability ||
              capability.name ===
                request.capability
            ) &&
            capability.actions.includes(
              request.action
            )
          );
        });

    if (!candidates.length) {
      return {
        allowed: false,

        reason:
          `Capability not found for ${request.capability}:${request.action}`,

        resolvedAt:
          Date.now()
      };
    }

    const available =
      candidates.find(
        capability =>
          capability.status ===
          "AVAILABLE"
      );

    if (!available) {
      return {
        allowed: false,

        reason:
          "Capability exists but is not available.",

        resolvedAt:
          Date.now()
      };
    }

    if (
      request.autonomous &&
      !available.autonomous
    ) {
      return {
        allowed: false,

        capability:
          this.clone(
            available
          ),

        reason:
          "Capability does not permit autonomous execution.",

        resolvedAt:
          Date.now()
      };
    }

    if (
      available.requiresOwnerAuthority
    ) {
      return {
        allowed: false,

        capability:
          this.clone(
            available
          ),

        reason:
          "Capability requires OWNER authority.",

        resolvedAt:
          Date.now()
      };
    }

    return {
      allowed: true,

      capability:
        this.clone(
          available
        ),

      reason:
        "Capability resolved and available.",

      resolvedAt:
        Date.now()
    };
  }

  public async healthCheck(
    capabilityId: string
  ): Promise<SovereignCapabilityHealth> {
    const capability =
      this.getMutable(
        capabilityId
      );

    if (
      !this.adapter.healthCheck
    ) {
      return {
        capabilityId,

        healthy:
          capability.status ===
            "AVAILABLE" ||
          capability.status ===
            "BUSY",

        message:
          "No external health adapter configured.",

        checkedAt:
          Date.now()
      };
    }

    const health =
      await this.adapter.healthCheck(
        capability
      );

    if (!health.healthy) {
      capability.status =
        "DEGRADED";

      capability.updatedAt =
        Date.now();

      await this.persist(
        capability
      );

      await this.record(
        "CAPABILITY_DEGRADED",
        capability.id,
        {
          message:
            health.message
        }
      );
    }

    return health;
  }

  public async healthCheckAll():
    Promise<SovereignCapabilityHealth[]> {
    const results:
      SovereignCapabilityHealth[] = [];

    for (
      const capability of
        this.capabilities.values()
    ) {
      if (
        capability.status ===
        "DISABLED"
      ) {
        continue;
      }

      results.push(
        await this.healthCheck(
          capability.id
        )
      );
    }

    return results;
  }

  public get(
    capabilityId: string
  ): SovereignCapability {
    return this.clone(
      this.getMutable(
        capabilityId
      )
    );
  }

  public list():
    SovereignCapability[] {
    return [
      ...this.capabilities.values()
    ].map(
      capability =>
        this.clone(
          capability
        )
    );
  }

  public listAvailable():
    SovereignCapability[] {
    return this.list()
      .filter(
        capability =>
          capability.status ===
          "AVAILABLE"
      );
  }

  public findByAction(
    action: string
  ): SovereignCapability[] {
    return this.list()
      .filter(
        capability =>
          capability.actions.includes(
            action
          )
      );
  }

  public async disable(
    capabilityId: string
  ): Promise<void> {
    await this.updateStatus(
      capabilityId,
      "DISABLED"
    );
  }

  public async enable(
    capabilityId: string
  ): Promise<void> {
    await this.updateStatus(
      capabilityId,
      "AVAILABLE"
    );
  }

  private validate(
    capability: SovereignCapability
  ): void {
    if (!capability.id.trim()) {
      throw new Error(
        "Capability id is required."
      );
    }

    if (!capability.name.trim()) {
      throw new Error(
        "Capability name is required."
      );
    }

    if (!capability.version.trim()) {
      throw new Error(
        "Capability version is required."
      );
    }

    if (!capability.actions.length) {
      throw new Error(
        "Capability requires at least one action."
      );
    }

    for (
      const action of
        capability.actions
    ) {
      if (!action.trim()) {
        throw new Error(
          "Capability action cannot be empty."
        );
      }
    }
  }

  private getMutable(
    capabilityId: string
  ): SovereignCapability {
    const capability =
      this.capabilities.get(
        capabilityId
      );

    if (!capability) {
      throw new Error(
        `Capability not registered: ${capabilityId}`
      );
    }

    return capability;
  }

  private async persist(
    capability: SovereignCapability
  ): Promise<void> {
    if (
      this.adapter.persistCapability
    ) {
      await this.adapter
        .persistCapability(
          capability
        );
    }
  }

  private async record(
    type: string,
    capabilityId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,

        capabilityId,

        timestamp:
          Date.now(),

        data
      });
    }
  }

  private clone(
    capability: SovereignCapability
  ): SovereignCapability {
    return {
      ...capability,

      actions: [
        ...capability.actions
      ],

      metadata:
        capability.metadata
          ? {
              ...capability.metadata
            }
          : undefined
    };
  }
}

export default SovereignAICapabilityRegistry;
