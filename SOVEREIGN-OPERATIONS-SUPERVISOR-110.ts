// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-SUPERVISOR-110.ts
// Sequence: 110
// Purpose: Sovereign Operations Supervision & Worker Health Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_SUPERVISOR_ID =
  "SOVEREIGN-OPERATIONS-SUPERVISOR-110";

export const SOVEREIGN_OPERATIONS_SUPERVISOR_VERSION = "1.0.0";

export type SovereignSupervisorState =
  | "ACTIVE"
  | "DEGRADED"
  | "PAUSED"
  | "STOPPED";

export type SovereignWorkerHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "UNRESPONSIVE"
  | "FAILED";

export interface SovereignSupervisorAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignWorkerRegistration {
  workerId: string;

  operationId?: string;

  registeredBy: string;

  authorityContext: SovereignSupervisorAuthorityContext;

  registeredAt: number;

  heartbeatAt: number;

  health: SovereignWorkerHealth;

  metadata?: Record<string, unknown>;
}

export interface SovereignSupervisorResult {
  workerId?: string;

  state: SovereignSupervisorState;

  accepted: boolean;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsSupervisor {
  public readonly id =
    SOVEREIGN_OPERATIONS_SUPERVISOR_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_SUPERVISOR_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly supervisorCanCreateAuthority = false;

  public readonly supervisorCanEscalateAuthority = false;

  public readonly supervisorCanOverrideOwner = false;

  public readonly stewardCanOverrideOwner = false;

  private state: SovereignSupervisorState = "ACTIVE";

  private readonly workers =
    new Map<string, SovereignWorkerRegistration>();

  private readonly heartbeatTimeoutMs = 60_000;

  private validateAuthority(
    authorityContext: SovereignSupervisorAuthorityContext,
    requestedBy: string
  ): string[] {
    const reasons: string[] = [];

    if (!authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  public registerWorker(
    registration: SovereignWorkerRegistration
  ): SovereignSupervisorResult {
    const reasons = this.validateAuthority(
      registration.authorityContext,
      registration.registeredBy
    );

    if (!registration.workerId) {
      reasons.push("WORKER_ID_REQUIRED");
    }

    if (this.workers.has(registration.workerId)) {
      reasons.push("WORKER_ALREADY_REGISTERED");
    }

    if (this.state === "STOPPED") {
      reasons.push("SUPERVISOR_STOPPED");
    }

    if (reasons.length > 0) {
      return {
        workerId: registration.workerId,

        state: this.state,

        accepted: false,

        reasons,

        timestamp: Date.now(),

        authority: "NONE"
      };
    }

    this.workers.set(
      registration.workerId,
      {
        ...registration,
        health: "HEALTHY",
        heartbeatAt: Date.now()
      }
    );

    return {
      workerId: registration.workerId,

      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public heartbeat(
    workerId: string
  ): SovereignSupervisorResult {
    const worker = this.workers.get(workerId);

    if (!worker) {
      return this.failure(
        workerId,
        "WORKER_NOT_FOUND"
      );
    }

    if (this.state === "STOPPED") {
      return this.failure(
        workerId,
        "SUPERVISOR_STOPPED"
      );
    }

    worker.heartbeatAt = Date.now();
    worker.health = "HEALTHY";

    this.workers.set(workerId, worker);

    return {
      workerId,

      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public evaluateWorkers(
    now = Date.now()
  ): SovereignWorkerRegistration[] {
    for (const worker of this.workers.values()) {
      const elapsed =
        now - worker.heartbeatAt;

      if (
        elapsed >
        this.heartbeatTimeoutMs * 3
      ) {
        worker.health = "FAILED";
      } else if (
        elapsed >
        this.heartbeatTimeoutMs * 2
      ) {
        worker.health = "UNRESPONSIVE";
      } else if (
        elapsed >
        this.heartbeatTimeoutMs
      ) {
        worker.health = "DEGRADED";
      } else {
        worker.health = "HEALTHY";
      }
    }

    const unhealthy =
      [...this.workers.values()].filter(
        (worker) =>
          worker.health !== "HEALTHY"
      );

    if (
      this.state !== "PAUSED" &&
      this.state !== "STOPPED"
    ) {
      this.state =
        unhealthy.length > 0
          ? "DEGRADED"
          : "ACTIVE";
    }

    return [...this.workers.values()]
      .map((worker) => ({
        ...worker,
        authorityContext: {
          ...worker.authorityContext,
          delegationScope: [
            ...worker.authorityContext.delegationScope
          ]
        }
      }));
  }

  public removeWorker(
    workerId: string
  ): SovereignSupervisorResult {
    const worker = this.workers.get(workerId);

    if (!worker) {
      return this.failure(
        workerId,
        "WORKER_NOT_FOUND"
      );
    }

    this.workers.delete(workerId);

    return {
      workerId,

      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public pause(): SovereignSupervisorResult {
    if (this.state === "STOPPED") {
      return this.failure(
        undefined,
        "SUPERVISOR_STOPPED"
      );
    }

    this.state = "PAUSED";

    return {
      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public resume(): SovereignSupervisorResult {
    if (this.state === "STOPPED") {
      return this.failure(
        undefined,
        "SUPERVISOR_STOPPED"
      );
    }

    this.state = "ACTIVE";

    this.evaluateWorkers();

    return {
      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public stop(): SovereignSupervisorResult {
    this.state = "STOPPED";

    return {
      state: this.state,

      accepted: true,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public getWorker(
    workerId: string
  ): SovereignWorkerRegistration | undefined {
    const worker = this.workers.get(workerId);

    return worker
      ? {
          ...worker,
          authorityContext: {
            ...worker.authorityContext,
            delegationScope: [
              ...worker.authorityContext.delegationScope
            ]
          }
        }
      : undefined;
  }

  public getState():
    SovereignSupervisorState {
    return this.state;
  }

  public getWorkers():
    SovereignWorkerRegistration[] {
    return this.evaluateWorkers();
  }

  private failure(
    workerId: string | undefined,
    reason: string
  ): SovereignSupervisorResult {
    return {
      workerId,

      state: this.state,

      accepted: false,

      reasons: [reason],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.supervisorCanCreateAuthority === false &&
      this.supervisorCanEscalateAuthority === false &&
      this.supervisorCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsSupervisor =
  new SovereignOperationsSupervisor();

export default sovereignOperationsSupervisor;
