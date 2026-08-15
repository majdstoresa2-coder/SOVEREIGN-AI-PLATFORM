// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-HEALTH-GATE-127.ts
// Sequence: 127
// Purpose: Sovereign Operational Health Gate & Execution Safety
// ============================================================================

export const SOVEREIGN_OPERATIONS_HEALTH_GATE_ID =
  "SOVEREIGN-OPERATIONS-HEALTH-GATE-127";

export const SOVEREIGN_OPERATIONS_HEALTH_GATE_VERSION =
  "1.0.0";

export type SovereignOperationalHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "CRITICAL"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type SovereignHealthGateDecision =
  | "ALLOW"
  | "ALLOW_DEGRADED"
  | "DEFER"
  | "BLOCK";

export interface SovereignHealthGateAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignOperationalComponent {
  componentId: string;

  componentType:
    | "RUNTIME"
    | "WORKER"
    | "DATABASE"
    | "STORAGE"
    | "MEMORY"
    | "QUEUE"
    | "NETWORK"
    | "MODEL"
    | "SECURITY"
    | "OTHER";

  required: boolean;

  health: SovereignOperationalHealth;

  checkedAt: number;

  reason?: string;
}

export interface SovereignHealthGateRequest {
  gateId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignHealthGateAuthorityContext;

  components: SovereignOperationalComponent[];

  allowDegradedExecution: boolean;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;
}

export interface SovereignHealthGateRecord {
  gateId: string;
  operationId: string;

  target: string;

  decision: SovereignHealthGateDecision;

  healthy: number;
  degraded: number;
  critical: number;
  unavailable: number;
  unknown: number;

  createdAt: number;
  evaluatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignHealthGateResult {
  gateId: string;
  operationId: string;

  accepted: boolean;

  decision: SovereignHealthGateDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsHealthGate {
  public readonly id =
    SOVEREIGN_OPERATIONS_HEALTH_GATE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_HEALTH_GATE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly healthGateCanCreateAuthority = false;
  public readonly healthGateCanEscalateAuthority = false;
  public readonly healthGateCanOverrideOwner = false;
  public readonly healthGateCanBypassSecurity = false;
  public readonly healthGateCanIgnoreCriticalHealth = false;
  public readonly healthGateCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignHealthGateRecord>();

  private validate(
    request: SovereignHealthGateRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.gateId) {
      reasons.push("GATE_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
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

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    if (
      !Array.isArray(request.components) ||
      request.components.length === 0
    ) {
      reasons.push("HEALTH_COMPONENTS_REQUIRED");
    }

    const ids = new Set<string>();

    for (const component of request.components) {
      if (!component.componentId) {
        reasons.push("COMPONENT_ID_REQUIRED");
        continue;
      }

      if (ids.has(component.componentId)) {
        reasons.push(
          `DUPLICATE_COMPONENT_${component.componentId}`
        );
      }

      ids.add(component.componentId);

      if (
        !Number.isFinite(component.checkedAt) ||
        component.checkedAt < 0
      ) {
        reasons.push(
          `INVALID_COMPONENT_CHECK_TIME_${component.componentId}`
        );
      }
    }

    return reasons;
  }

  private decide(
    components: SovereignOperationalComponent[],
    allowDegradedExecution: boolean
  ): {
    decision: SovereignHealthGateDecision;
    reasons: string[];
  } {
    const required =
      components.filter(
        (component) => component.required
      );

    const requiredUnavailable =
      required.some(
        (component) =>
          component.health === "UNAVAILABLE" ||
          component.health === "UNKNOWN"
      );

    if (requiredUnavailable) {
      return {
        decision: "BLOCK",
        reasons: [
          "REQUIRED_COMPONENT_UNAVAILABLE"
        ]
      };
    }

    const requiredCritical =
      required.some(
        (component) =>
          component.health === "CRITICAL"
      );

    if (requiredCritical) {
      return {
        decision: "BLOCK",
        reasons: [
          "REQUIRED_COMPONENT_CRITICAL"
        ]
      };
    }

    const requiredDegraded =
      required.some(
        (component) =>
          component.health === "DEGRADED"
      );

    if (requiredDegraded) {
      return allowDegradedExecution
        ? {
            decision: "ALLOW_DEGRADED",
            reasons: [
              "REQUIRED_COMPONENT_DEGRADED"
            ]
          }
        : {
            decision: "DEFER",
            reasons: [
              "DEGRADED_EXECUTION_NOT_ALLOWED"
            ]
          };
    }

    const optionalProblem =
      components.some(
        (component) =>
          !component.required &&
          component.health !== "HEALTHY"
      );

    if (optionalProblem) {
      return {
        decision: "ALLOW_DEGRADED",
        reasons: [
          "OPTIONAL_COMPONENT_DEGRADED"
        ]
      };
    }

    return {
      decision: "ALLOW",
      reasons: []
    };
  }

  public evaluate(
    request: SovereignHealthGateRequest
  ): SovereignHealthGateResult {
    const now = Date.now();

    if (this.records.has(request.gateId)) {
      return this.failure(
        request.gateId,
        request.operationId,
        "HEALTH_GATE_ALREADY_EXISTS"
      );
    }

    const validation =
      this.validate(request);

    if (validation.length > 0) {
      return {
        gateId: request.gateId,
        operationId: request.operationId,

        accepted: false,

        decision: "BLOCK",

        reasons: validation,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evaluation =
      this.decide(
        request.components,
        request.allowDegradedExecution
      );

    const count = (
      health: SovereignOperationalHealth
    ): number =>
      request.components.filter(
        (component) =>
          component.health === health
      ).length;

    const record: SovereignHealthGateRecord = {
      gateId: request.gateId,
      operationId: request.operationId,

      target: request.target,

      decision: evaluation.decision,

      healthy: count("HEALTHY"),
      degraded: count("DEGRADED"),
      critical: count("CRITICAL"),
      unavailable: count("UNAVAILABLE"),
      unknown: count("UNKNOWN"),

      createdAt: request.createdAt,
      evaluatedAt: now,

      reasons: [...evaluation.reasons],

      authority: "NONE"
    };

    this.records.set(
      record.gateId,
      record
    );

    return this.result(record);
  }

  public canProceed(
    gateId: string
  ): boolean {
    const record =
      this.records.get(gateId);

    if (!record) {
      return false;
    }

    return (
      record.decision === "ALLOW" ||
      record.decision ===
        "ALLOW_DEGRADED"
    );
  }

  public getRecord(
    gateId: string
  ): SovereignHealthGateRecord | undefined {
    const record =
      this.records.get(gateId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getBlocked():
    SovereignHealthGateRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.decision === "BLOCK"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private result(
    record: SovereignHealthGateRecord
  ): SovereignHealthGateResult {
    return {
      gateId: record.gateId,
      operationId: record.operationId,

      accepted:
        record.decision === "ALLOW" ||
        record.decision ===
          "ALLOW_DEGRADED",

      decision: record.decision,

      reasons: [...record.reasons],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    gateId: string,
    operationId: string,
    reason: string
  ): SovereignHealthGateResult {
    return {
      gateId,
      operationId,

      accepted: false,

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
      this.healthGateCanCreateAuthority === false &&
      this.healthGateCanEscalateAuthority === false &&
      this.healthGateCanOverrideOwner === false &&
      this.healthGateCanBypassSecurity === false &&
      this.healthGateCanIgnoreCriticalHealth === false &&
      this.healthGateCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsHealthGate =
  new SovereignOperationsHealthGate();

export default sovereignOperationsHealthGate;
