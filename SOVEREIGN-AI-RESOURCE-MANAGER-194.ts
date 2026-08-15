// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-RESOURCE-MANAGER-194.ts
// Sovereign Autonomous AI Resource Manager
// ============================================================

export type SovereignResourceType =
  | "CPU"
  | "MEMORY"
  | "STORAGE"
  | "GPU"
  | "NETWORK"
  | "WORKER"
  | "CUSTOM";

export type SovereignResourceHealth =
  | "HEALTHY"
  | "PRESSURED"
  | "CRITICAL"
  | "OFFLINE";

export interface SovereignResource {
  id: string;
  type: SovereignResourceType;
  name: string;

  capacity: number;
  reserved: number;
  used: number;

  health: SovereignResourceHealth;

  enabled: boolean;

  updatedAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignResourceRequirement {
  type: SovereignResourceType;
  amount: number;
  optional?: boolean;
}

export interface SovereignResourceRequest {
  id: string;

  taskId: string;
  schedulerTaskId?: string;

  requirements: SovereignResourceRequirement[];

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  autonomous: boolean;

  createdAt: number;
}

export interface SovereignResourceAllocation {
  id: string;

  requestId: string;
  taskId: string;

  allocations: {
    resourceId: string;
    type: SovereignResourceType;
    amount: number;
  }[];

  active: boolean;

  allocatedAt: number;
  releasedAt?: number;
}

export interface SovereignResourceSnapshot {
  id: string;

  resources: SovereignResource[];

  totalCapacity: number;
  totalReserved: number;
  totalUsed: number;

  pressure: number;

  generatedAt: number;
}

export interface SovereignResourceAdapter {
  inspect(
    resource: SovereignResource
  ): Promise<{
    used: number;
    reachable: boolean;
  }>;

  persistResource?(
    resource: SovereignResource
  ): Promise<void>;

  persistAllocation?(
    allocation: SovereignResourceAllocation
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    taskId?: string;
    resourceId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIResourceManager {
  private readonly resources =
    new Map<string, SovereignResource>();

  private readonly allocations =
    new Map<string, SovereignResourceAllocation>();

  constructor(
    private readonly adapter: SovereignResourceAdapter
  ) {}

  public register(
    resource: Omit<
      SovereignResource,
      "reserved" | "used" | "health" | "updatedAt"
    >
  ): SovereignResource {
    if (!resource.id.trim()) {
      throw new Error(
        "Resource id is required."
      );
    }

    if (!resource.name.trim()) {
      throw new Error(
        "Resource name is required."
      );
    }

    if (
      !Number.isFinite(resource.capacity) ||
      resource.capacity <= 0
    ) {
      throw new Error(
        "Resource capacity must be greater than zero."
      );
    }

    if (
      this.resources.has(resource.id)
    ) {
      throw new Error(
        `Resource already registered: ${resource.id}`
      );
    }

    const entry: SovereignResource = {
      ...resource,

      reserved: 0,
      used: 0,

      health: "HEALTHY",

      updatedAt: Date.now()
    };

    this.resources.set(
      entry.id,
      entry
    );

    return this.cloneResource(entry);
  }

  public async refresh():
    Promise<SovereignResourceSnapshot> {
    for (
      const resource of
        this.resources.values()
    ) {
      if (!resource.enabled) {
        resource.health =
          "OFFLINE";

        continue;
      }

      try {
        const inspection =
          await this.adapter.inspect(
            this.cloneResource(resource)
          );

        if (!inspection.reachable) {
          resource.health =
            "OFFLINE";

          resource.updatedAt =
            Date.now();

          continue;
        }

        resource.used =
          this.clamp(
            inspection.used,
            0,
            resource.capacity
          );

        resource.health =
          this.resolveHealth(
            resource
          );

        resource.updatedAt =
          Date.now();

        await this.persistResource(
          resource
        );
      } catch {
        resource.health =
          "OFFLINE";

        resource.updatedAt =
          Date.now();

        await this.persistResource(
          resource
        );
      }
    }

    return this.snapshot();
  }

  public async allocate(
    request: SovereignResourceRequest
  ): Promise<SovereignResourceAllocation> {
    this.validateRequest(request);

    const selected: {
      resource: SovereignResource;
      amount: number;
    }[] = [];

    for (
      const requirement of
        request.requirements
    ) {
      const candidate =
        this.findBestResource(
          requirement
        );

      if (!candidate) {
        if (requirement.optional) {
          continue;
        }

        throw new Error(
          `Insufficient sovereign resource: ${requirement.type}`
        );
      }

      selected.push({
        resource: candidate,
        amount: requirement.amount
      });
    }

    for (const item of selected) {
      item.resource.reserved +=
        item.amount;

      item.resource.health =
        this.resolveHealth(
          item.resource
        );

      item.resource.updatedAt =
        Date.now();

      await this.persistResource(
        item.resource
      );
    }

    const allocation:
      SovereignResourceAllocation = {
        id: this.createId(
          "resource-allocation"
        ),

        requestId: request.id,

        taskId: request.taskId,

        allocations:
          selected.map(
            item => ({
              resourceId:
                item.resource.id,

              type:
                item.resource.type,

              amount:
                item.amount
            })
          ),

        active: true,

        allocatedAt:
          Date.now()
      };

    this.allocations.set(
      allocation.id,
      allocation
    );

    if (
      this.adapter.persistAllocation
    ) {
      await this.adapter
        .persistAllocation(
          allocation
        );
    }

    await this.record(
      "AI_RESOURCES_ALLOCATED",
      request.taskId,
      undefined,
      {
        allocationId:
          allocation.id,

        resources:
          allocation.allocations
      }
    );

    return this.cloneAllocation(
      allocation
    );
  }

  public async release(
    allocationId: string
  ): Promise<SovereignResourceAllocation> {
    const allocation =
      this.allocations.get(
        allocationId
      );

    if (!allocation) {
      throw new Error(
        `Resource allocation not found: ${allocationId}`
      );
    }

    if (!allocation.active) {
      return this.cloneAllocation(
        allocation
      );
    }

    for (
      const reserved of
        allocation.allocations
    ) {
      const resource =
        this.resources.get(
          reserved.resourceId
        );

      if (!resource) {
        continue;
      }

      resource.reserved =
        Math.max(
          0,
          resource.reserved -
            reserved.amount
        );

      resource.health =
        this.resolveHealth(
          resource
        );

      resource.updatedAt =
        Date.now();

      await this.persistResource(
        resource
      );
    }

    allocation.active =
      false;

    allocation.releasedAt =
      Date.now();

    if (
      this.adapter.persistAllocation
    ) {
      await this.adapter
        .persistAllocation(
          allocation
        );
    }

    await this.record(
      "AI_RESOURCES_RELEASED",
      allocation.taskId,
      undefined,
      {
        allocationId:
          allocation.id
      }
    );

    return this.cloneAllocation(
      allocation
    );
  }

  public canAllocate(
    requirements: SovereignResourceRequirement[]
  ): boolean {
    return requirements.every(
      requirement =>
        requirement.optional ||
        !!this.findBestResource(
          requirement
        )
    );
  }

  public snapshot():
    SovereignResourceSnapshot {
    const resources =
      [...this.resources.values()]
        .map(
          resource =>
            this.cloneResource(
              resource
            )
        );

    const totalCapacity =
      resources.reduce(
        (total, resource) =>
          total +
          resource.capacity,
        0
      );

    const totalReserved =
      resources.reduce(
        (total, resource) =>
          total +
          resource.reserved,
        0
      );

    const totalUsed =
      resources.reduce(
        (total, resource) =>
          total +
          resource.used,
        0
      );

    const pressure =
      totalCapacity > 0
        ? this.clamp(
            (
              totalReserved +
              totalUsed
            ) /
              totalCapacity,
            0,
            1
          )
        : 1;

    return {
      id: this.createId(
        "resource-snapshot"
      ),

      resources,

      totalCapacity,

      totalReserved,

      totalUsed,

      pressure,

      generatedAt:
        Date.now()
    };
  }

  public getAvailable(
    type: SovereignResourceType
  ): number {
    return [
      ...this.resources.values()
    ]
      .filter(
        resource =>
          resource.type === type &&
          resource.enabled &&
          resource.health !==
            "OFFLINE"
      )
      .reduce(
        (total, resource) =>
          total +
          this.available(
            resource
          ),
        0
      );
  }

  private findBestResource(
    requirement: SovereignResourceRequirement
  ): SovereignResource | undefined {
    return [
      ...this.resources.values()
    ]
      .filter(
        resource =>
          resource.type ===
            requirement.type &&
          resource.enabled &&
          resource.health !==
            "OFFLINE" &&
          this.available(
            resource
          ) >= requirement.amount
      )
      .sort(
        (a, b) =>
          this.available(b) -
          this.available(a)
      )[0];
  }

  private available(
    resource: SovereignResource
  ): number {
    return Math.max(
      0,
      resource.capacity -
        resource.used -
        resource.reserved
    );
  }

  private resolveHealth(
    resource: SovereignResource
  ): SovereignResourceHealth {
    if (!resource.enabled) {
      return "OFFLINE";
    }

    const pressure =
      (
        resource.used +
        resource.reserved
      ) /
      resource.capacity;

    if (pressure >= 0.95) {
      return "CRITICAL";
    }

    if (pressure >= 0.80) {
      return "PRESSURED";
    }

    return "HEALTHY";
  }

  private validateRequest(
    request: SovereignResourceRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Resource request id is required."
      );
    }

    if (!request.taskId.trim()) {
      throw new Error(
        "Resource request taskId is required."
      );
    }

    if (!request.requirements.length) {
      throw new Error(
        "Resource request requires at least one resource."
      );
    }

    for (
      const requirement of
        request.requirements
    ) {
      if (
        !Number.isFinite(
          requirement.amount
        ) ||
        requirement.amount <= 0
      ) {
        throw new Error(
          `Invalid resource amount: ${requirement.type}`
        );
      }
    }
  }

  private async persistResource(
    resource: SovereignResource
  ): Promise<void> {
    if (
      this.adapter.persistResource
    ) {
      await this.adapter
        .persistResource(
          resource
        );
    }
  }

  private async record(
    type: string,
    taskId?: string,
    resourceId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          taskId,

          resourceId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private clamp(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (!Number.isFinite(value)) {
      return minimum;
    }

    return Math.max(
      minimum,
      Math.min(
        maximum,
        value
      )
    );
  }

  private cloneResource(
    resource: SovereignResource
  ): SovereignResource {
    return {
      ...resource,

      metadata:
        resource.metadata
          ? {
              ...resource.metadata
            }
          : undefined
    };
  }

  private cloneAllocation(
    allocation: SovereignResourceAllocation
  ): SovereignResourceAllocation {
    return {
      ...allocation,

      allocations:
        allocation.allocations.map(
          item => ({
            ...item
          })
        )
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIResourceManager;
