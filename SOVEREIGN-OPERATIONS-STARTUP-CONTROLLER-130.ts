// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-STARTUP-CONTROLLER-130.ts
// Sequence: 130
// Purpose: Sovereign Safe Startup, Dependency Ordering & Runtime Activation
// ============================================================================

export const SOVEREIGN_OPERATIONS_STARTUP_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-STARTUP-CONTROLLER-130";

export const SOVEREIGN_OPERATIONS_STARTUP_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignStartupState =
  | "REGISTERED"
  | "VALIDATING"
  | "WAITING_DEPENDENCIES"
  | "READY"
  | "STARTING"
  | "VERIFYING"
  | "RUNNING"
  | "FAILED"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export type SovereignStartupDecision =
  | "WAIT"
  | "START"
  | "VERIFY"
  | "RUN"
  | "RECOVER"
  | "BLOCK";

export interface SovereignStartupAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignStartupDependency {
  dependencyId: string;

  required: boolean;
  ready: boolean;

  reason?: string;
}

export interface SovereignStartupSignals {
  securityApproved: boolean;
  policyApproved: boolean;

  configurationReady: boolean;
  secretsReady: boolean;

  databaseReady: boolean;
  storageReady: boolean;
  networkReady: boolean;

  recoveryReady: boolean;

  dependencies: SovereignStartupDependency[];
}

export interface SovereignStartupRequest {
  startupId: string;
  target: string;

  requestedBy: string;

  authorityContext: SovereignStartupAuthorityContext;

  signals: SovereignStartupSignals;

  requireRecoveryReadiness: boolean;

  startupTimeoutMs: number;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignStartupRecord {
  startupId: string;
  target: string;

  requestedBy: string;

  state: SovereignStartupState;

  startedAt?: number;
  deadlineAt?: number;
  runningAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignStartupResult {
  startupId: string;
  target: string;

  accepted: boolean;

  state: SovereignStartupState;
  decision: SovereignStartupDecision;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsStartupController {
  public readonly id =
    SOVEREIGN_OPERATIONS_STARTUP_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_STARTUP_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly startupControllerCanCreateAuthority = false;
  public readonly startupControllerCanEscalateAuthority = false;
  public readonly startupControllerCanOverrideOwner = false;
  public readonly startupControllerCanBypassSecurity = false;
  public readonly startupControllerCanIgnoreRequiredDependencies = false;
  public readonly startupControllerCanIgnoreSecrets = false;
  public readonly startupControllerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignStartupRecord>();

  private readonly requests =
    new Map<string, SovereignStartupRequest>();

  private validate(
    request: SovereignStartupRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.startupId) {
      reasons.push("STARTUP_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (
      !Number.isFinite(request.startupTimeoutMs) ||
      request.startupTimeoutMs < 1
    ) {
      reasons.push("INVALID_STARTUP_TIMEOUT");
    }

    if (!request.signals.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.signals.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    return reasons;
  }

  private readinessReasons(
    request: SovereignStartupRequest
  ): string[] {
    const reasons: string[] = [];
    const signals = request.signals;

    if (!signals.configurationReady) {
      reasons.push("CONFIGURATION_NOT_READY");
    }

    if (!signals.secretsReady) {
      reasons.push("SECRETS_NOT_READY");
    }

    if (!signals.databaseReady) {
      reasons.push("DATABASE_NOT_READY");
    }

    if (!signals.storageReady) {
      reasons.push("STORAGE_NOT_READY");
    }

    if (!signals.networkReady) {
      reasons.push("NETWORK_NOT_READY");
    }

    if (
      request.requireRecoveryReadiness &&
      !signals.recoveryReady
    ) {
      reasons.push("RECOVERY_NOT_READY");
    }

    for (const dependency of signals.dependencies) {
      if (
        dependency.required &&
        !dependency.ready
      ) {
        reasons.push(
          `REQUIRED_DEPENDENCY_NOT_READY_${dependency.dependencyId}`
        );
      }
    }

    return reasons;
  }

  public register(
    request: SovereignStartupRequest
  ): SovereignStartupResult {
    const now = Date.now();

    if (this.records.has(request.startupId)) {
      return this.failure(
        request.startupId,
        request.target,
        "STARTUP_ALREADY_EXISTS"
      );
    }

    const validation =
      this.validate(request);

    if (validation.length > 0) {
      return {
        startupId: request.startupId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons: validation,

        timestamp: now,

        authority: "NONE"
      };
    }

    const readiness =
      this.readinessReasons(request);

    const record: SovereignStartupRecord = {
      startupId: request.startupId,
      target: request.target,

      requestedBy: request.requestedBy,

      state:
        readiness.length === 0
          ? "READY"
          : "WAITING_DEPENDENCIES",

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: readiness,

      authority: "NONE"
    };

    this.records.set(
      record.startupId,
      record
    );

    this.requests.set(
      record.startupId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      readiness.length === 0
        ? "START"
        : "WAIT",
      now
    );
  }

  public reevaluate(
    startupId: string,
    signals: SovereignStartupSignals,
    now = Date.now()
  ): SovereignStartupResult {
    const record =
      this.records.get(startupId);

    const request =
      this.requests.get(startupId);

    if (!record || !request) {
      return this.failure(
        startupId,
        "",
        "STARTUP_NOT_FOUND"
      );
    }

    if (
      record.state === "RUNNING" ||
      record.state === "BLOCKED"
    ) {
      return this.failure(
        record.startupId,
        record.target,
        "STARTUP_TERMINAL_STATE"
      );
    }

    request.signals =
      this.cloneSignals(signals);

    const readiness =
      this.readinessReasons(request);

    record.state =
      readiness.length === 0
        ? "READY"
        : "WAITING_DEPENDENCIES";

    record.reasons =
      [...readiness];

    record.updatedAt = now;

    this.requests.set(
      startupId,
      request
    );

    this.records.set(
      startupId,
      record
    );

    return this.result(
      record,
      readiness.length === 0
        ? "START"
        : "WAIT",
      now
    );
  }

  public start(
    startupId: string,
    now = Date.now()
  ): SovereignStartupResult {
    const record =
      this.records.get(startupId);

    const request =
      this.requests.get(startupId);

    if (!record || !request) {
      return this.failure(
        startupId,
        "",
        "STARTUP_NOT_FOUND"
      );
    }

    if (record.state !== "READY") {
      return this.failure(
        record.startupId,
        record.target,
        "STARTUP_NOT_READY"
      );
    }

    const readiness =
      this.readinessReasons(request);

    if (readiness.length > 0) {
      record.state =
        "WAITING_DEPENDENCIES";

      record.reasons =
        [...readiness];

      record.updatedAt = now;

      return this.result(
        record,
        "WAIT",
        now
      );
    }

    record.state = "STARTING";
    record.startedAt = now;

    record.deadlineAt =
      now + request.startupTimeoutMs;

    record.updatedAt = now;
    record.reasons = [];

    this.records.set(
      startupId,
      record
    );

    return this.result(
      record,
      "VERIFY",
      now
    );
  }

  public verify(
    startupId: string,
    healthy: boolean,
    now = Date.now()
  ): SovereignStartupResult {
    const record =
      this.records.get(startupId);

    if (!record) {
      return this.failure(
        startupId,
        "",
        "STARTUP_NOT_FOUND"
      );
    }

    if (
      record.state !== "STARTING" &&
      record.state !== "VERIFYING"
    ) {
      return this.failure(
        record.startupId,
        record.target,
        "STARTUP_NOT_VERIFYING"
      );
    }

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      record.state =
        "RECOVERY_REQUIRED";

      record.updatedAt = now;

      record.reasons = [
        "STARTUP_TIMEOUT_EXCEEDED"
      ];

      this.records.set(
        startupId,
        record
      );

      return this.result(
        record,
        "RECOVER",
        now
      );
    }

    if (!healthy) {
      record.state = "VERIFYING";

      record.updatedAt = now;

      record.reasons = [
        "STARTUP_HEALTH_NOT_CONFIRMED"
      ];

      this.records.set(
        startupId,
        record
      );

      return this.result(
        record,
        "VERIFY",
        now
      );
    }

    record.state = "RUNNING";
    record.runningAt = now;
    record.updatedAt = now;
    record.reasons = [];

    this.records.set(
      startupId,
      record
    );

    return this.result(
      record,
      "RUN",
      now
    );
  }

  public fail(
    startupId: string,
    reason = "STARTUP_FAILED"
  ): SovereignStartupResult {
    const record =
      this.records.get(startupId);

    if (!record) {
      return this.failure(
        startupId,
        "",
        "STARTUP_NOT_FOUND"
      );
    }

    record.state =
      "RECOVERY_REQUIRED";

    record.updatedAt =
      Date.now();

    record.reasons = [reason];

    this.records.set(
      startupId,
      record
    );

    return this.result(
      record,
      "RECOVER",
      Date.now()
    );
  }

  public getRecord(
    startupId: string
  ): SovereignStartupRecord | undefined {
    const record =
      this.records.get(startupId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getWaiting():
    SovereignStartupRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
          "WAITING_DEPENDENCIES"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  public getRecoveryRequired():
    SovereignStartupRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state ===
          "RECOVERY_REQUIRED"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private cloneSignals(
    signals: SovereignStartupSignals
  ): SovereignStartupSignals {
    return {
      ...signals,

      dependencies:
        signals.dependencies.map(
          (dependency) => ({
            ...dependency
          })
        )
    };
  }

  private cloneRequest(
    request: SovereignStartupRequest
  ): SovereignStartupRequest {
    return {
      ...request,

      authorityContext: {
        ...request.authorityContext,
        delegationScope: [
          ...request.authorityContext
            .delegationScope
        ]
      },

      signals:
        this.cloneSignals(
          request.signals
        ),

      metadata: request.metadata
        ? { ...request.metadata }
        : undefined
    };
  }

  private result(
    record: SovereignStartupRecord,
    decision: SovereignStartupDecision,
    now: number
  ): SovereignStartupResult {
    return {
      startupId: record.startupId,
      target: record.target,

      accepted:
        decision !== "BLOCK",

      state: record.state,
      decision,

      remainingMs:
        record.deadlineAt !== undefined
          ? Math.max(
              0,
              record.deadlineAt - now
            )
          : undefined,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    startupId: string,
    target: string,
    reason: string
  ): SovereignStartupResult {
    return {
      startupId,
      target,

      accepted: false,

      state: "BLOCKED",
      decision: "BLOCK",

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
      this.startupControllerCanCreateAuthority === false &&
      this.startupControllerCanEscalateAuthority === false &&
      this.startupControllerCanOverrideOwner === false &&
      this.startupControllerCanBypassSecurity === false &&
      this.startupControllerCanIgnoreRequiredDependencies === false &&
      this.startupControllerCanIgnoreSecrets === false &&
      this.startupControllerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsStartupController =
  new SovereignOperationsStartupController();

export default sovereignOperationsStartupController;
