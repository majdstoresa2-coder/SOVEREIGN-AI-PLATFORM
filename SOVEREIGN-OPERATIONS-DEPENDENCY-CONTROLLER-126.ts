// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-DEPENDENCY-CONTROLLER-126.ts
// Sequence: 126
// Purpose: Sovereign Dependency Readiness, Dependency Safety & Execution Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_DEPENDENCY_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-DEPENDENCY-CONTROLLER-126";

export const SOVEREIGN_OPERATIONS_DEPENDENCY_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignDependencyType =
  | "SERVICE"
  | "DATABASE"
  | "STORAGE"
  | "NETWORK"
  | "WORKER"
  | "MODEL"
  | "CAPABILITY"
  | "SECRET"
  | "QUEUE"
  | "REGISTRY"
  | "EXTERNAL_ADAPTER"
  | "OTHER";

export type SovereignDependencyHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type SovereignDependencyRequirement =
  | "REQUIRED"
  | "OPTIONAL";

export type SovereignDependencyDecision =
  | "ALLOW"
  | "ALLOW_DEGRADED"
  | "DEFER"
  | "BLOCK";

export interface SovereignDependencyAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignDependencyDescriptor {
  dependencyId: string;

  name: string;

  type: SovereignDependencyType;

  requirement: SovereignDependencyRequirement;

  health: SovereignDependencyHealth;

  lastCheckedAt: number;

  reason?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDependencyRequest {
  evaluationId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignDependencyAuthorityContext;

  dependencies: SovereignDependencyDescriptor[];

  allowOptionalDegradation: boolean;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;
}

export interface SovereignDependencyRecord {
  evaluationId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  decision: SovereignDependencyDecision;

  requiredHealthy: number;
  requiredDegraded: number;
  requiredUnavailable: number;

  optionalHealthy: number;
  optionalDegraded: number;
  optionalUnavailable: number;

  dependencies: SovereignDependencyDescriptor[];

  createdAt: number;
  evaluatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignDependencyResult {
  evaluationId: string;
  operationId: string;

  accepted: boolean;

  decision: SovereignDependencyDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsDependencyController {
  public readonly id =
    SOVEREIGN_OPERATIONS_DEPENDENCY_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_DEPENDENCY_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly dependencyControllerCanCreateAuthority = false;
  public readonly dependencyControllerCanEscalateAuthority = false;
  public readonly dependencyControllerCanOverrideOwner = false;
  public readonly dependencyControllerCanBypassSecurity = false;
  public readonly dependencyControllerCanIgnoreRequiredDependencies = false;
  public readonly dependencyControllerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignDependencyRecord>();

  private validate(
    request: SovereignDependencyRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.evaluationId) {
      reasons.push("EVALUATION_ID_REQUIRED");
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

    if (!Array.isArray(request.dependencies)) {
      reasons.push("DEPENDENCIES_REQUIRED");
    }

    const seen = new Set<string>();

    for (const dependency of request.dependencies) {
      if (!dependency.dependencyId) {
        reasons.push("DEPENDENCY_ID_REQUIRED");
        continue;
      }

      if (seen.has(dependency.dependencyId)) {
        reasons.push(
          `DUPLICATE_DEPENDENCY_${dependency.dependencyId}`
        );
      }

      seen.add(dependency.dependencyId);

      if (!dependency.name) {
        reasons.push(
          `DEPENDENCY_NAME_REQUIRED_${dependency.dependencyId}`
        );
      }

      if (
        !Number.isFinite(dependency.lastCheckedAt) ||
        dependency.lastCheckedAt < 0
      ) {
        reasons.push(
          `INVALID_DEPENDENCY_CHECK_TIME_${dependency.dependencyId}`
        );
      }
    }

    return reasons;
  }

  private evaluateDependencies(
    dependencies: SovereignDependencyDescriptor[],
    allowOptionalDegradation: boolean
  ): {
    decision: SovereignDependencyDecision;
    reasons: string[];

    requiredHealthy: number;
    requiredDegraded: number;
    requiredUnavailable: number;

    optionalHealthy: number;
    optionalDegraded: number;
    optionalUnavailable: number;
  } {
    const required = dependencies.filter(
      (dependency) =>
        dependency.requirement === "REQUIRED"
    );

    const optional = dependencies.filter(
      (dependency) =>
        dependency.requirement === "OPTIONAL"
    );

    const requiredHealthy = required.filter(
      (dependency) =>
        dependency.health === "HEALTHY"
    ).length;

    const requiredDegraded = required.filter(
      (dependency) =>
        dependency.health === "DEGRADED"
    ).length;

    const requiredUnavailable = required.filter(
      (dependency) =>
        dependency.health === "UNAVAILABLE" ||
        dependency.health === "UNKNOWN"
    ).length;

    const optionalHealthy = optional.filter(
      (dependency) =>
        dependency.health === "HEALTHY"
    ).length;

    const optionalDegraded = optional.filter(
      (dependency) =>
        dependency.health === "DEGRADED"
    ).length;

    const optionalUnavailable = optional.filter(
      (dependency) =>
        dependency.health === "UNAVAILABLE" ||
        dependency.health === "UNKNOWN"
    ).length;

    const reasons: string[] = [];

    if (requiredUnavailable > 0) {
      reasons.push(
        "REQUIRED_DEPENDENCY_UNAVAILABLE"
      );

      return {
        decision: "BLOCK",
        reasons,

        requiredHealthy,
        requiredDegraded,
        requiredUnavailable,

        optionalHealthy,
        optionalDegraded,
        optionalUnavailable
      };
    }

    if (requiredDegraded > 0) {
      reasons.push(
        "REQUIRED_DEPENDENCY_DEGRADED"
      );

      return {
        decision: "DEFER",
        reasons,

        requiredHealthy,
        requiredDegraded,
        requiredUnavailable,

        optionalHealthy,
        optionalDegraded,
        optionalUnavailable
      };
    }

    if (
      optionalUnavailable > 0 ||
      optionalDegraded > 0
    ) {
      if (allowOptionalDegradation) {
        reasons.push(
          "OPTIONAL_DEPENDENCY_DEGRADED"
        );

        return {
          decision: "ALLOW_DEGRADED",
          reasons,

          requiredHealthy,
          requiredDegraded,
          requiredUnavailable,

          optionalHealthy,
          optionalDegraded,
          optionalUnavailable
        };
      }

      reasons.push(
        "OPTIONAL_DEPENDENCY_NOT_READY"
      );

      return {
        decision: "DEFER",
        reasons,

        requiredHealthy,
        requiredDegraded,
        requiredUnavailable,

        optionalHealthy,
        optionalDegraded,
        optionalUnavailable
      };
    }

    return {
      decision: "ALLOW",
      reasons: [],

      requiredHealthy,
      requiredDegraded,
      requiredUnavailable,

      optionalHealthy,
      optionalDegraded,
      optionalUnavailable
    };
  }

  public evaluate(
    request: SovereignDependencyRequest
  ): SovereignDependencyResult {
    const now = Date.now();

    if (this.records.has(request.evaluationId)) {
      return this.failure(
        request.evaluationId,
        request.operationId,
        "DEPENDENCY_EVALUATION_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        evaluationId: request.evaluationId,
        operationId: request.operationId,

        accepted: false,

        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evaluation =
      this.evaluateDependencies(
        request.dependencies,
        request.allowOptionalDegradation
      );

    const record: SovereignDependencyRecord = {
      evaluationId: request.evaluationId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      decision:
