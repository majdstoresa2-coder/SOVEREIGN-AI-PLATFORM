/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-STEWARD-03
 * ============================================================
 *
 * Purpose:
 * The executive Steward layer of the Sovereign AI Platform.
 *
 * Authority hierarchy:
 *
 * OWNER
 *   ↓
 * STEWARD
 *   ↓
 * CORE
 *   ↓
 * RUNTIME
 *   ↓
 * AGENTS / CAPABILITIES
 *
 * The STEWARD is the delegated executive authority.
 *
 * The Steward may:
 * - operate the platform autonomously within delegation
 * - supervise execution
 * - coordinate agents
 * - monitor jobs
 * - react to failures
 * - request repairs
 * - retry safe operations
 * - prevent invalid releases
 * - continue platform operations while OWNER is unavailable
 *
 * The Steward may NOT:
 * - become OWNER
 * - elevate its own authority
 * - change OWNER identity
 * - create supreme authority
 * - bypass policy
 * - bypass permissions
 * - exceed delegation scope
 *
 * This file defines Steward contracts and decision logic.
 * It does not directly execute privileged infrastructure commands.
 *
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. STEWARD STATUS
 * ============================================================
 */

export type StewardStatus =
  | "INITIALIZING"
  | "ACTIVE"
  | "SUPERVISING"
  | "RECOVERING"
  | "DEGRADED"
  | "PAUSED"
  | "SUSPENDED"
  | "REVOKED"
  | "STOPPED";

/* ============================================================
 * 2. STEWARD OPERATING MODE
 * ============================================================
 */

export type StewardOperatingMode =
  | "NORMAL"
  | "AUTONOMOUS"
  | "RECOVERY"
  | "SAFE_MODE"
  | "EMERGENCY";

/* ============================================================
 * 3. DECISION RISK
 * ============================================================
 */

export type StewardRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 4. DECISION TYPE
 * ============================================================
 */

export type StewardDecisionType =
  | "EXECUTE"
  | "RETRY"
  | "REPAIR"
  | "ROLLBACK"
  | "ISOLATE"
  | "PAUSE"
  | "REJECT"
  | "ESCALATE"
  | "VERIFY"
  | "CONTINUE";

/* ============================================================
 * 5. STEWARD IDENTITY
 * ============================================================
 */

export interface SovereignStewardIdentity {
  id: string;

  name: string;

  type: "STEWARD";

  authorityLevel: 800;

  ownerId: string;

  delegationId: string;

  status: StewardStatus;

  operatingMode: StewardOperatingMode;

  createdAt: string;

  lastHeartbeatAt?: string;
}

/* ============================================================
 * 6. STEWARD RESPONSIBILITIES
 * ============================================================
 */

export interface SovereignStewardResponsibilities {
  superviseCore: boolean;

  superviseRuntime: boolean;

  supervisePlanning: boolean;

  superviseExecution: boolean;

  superviseAgents: boolean;

  superviseCapabilities: boolean;

  superviseJobs: boolean;

  superviseBuilds: boolean;

  superviseDeployments: boolean;

  superviseMonitoring: boolean;

  superviseDiagnostics: boolean;

  superviseSecurity: boolean;

  superviseRecovery: boolean;

  superviseVerification: boolean;
}

/* ============================================================
 * 7. AUTONOMOUS OPERATION
 * ============================================================
 */

export interface SovereignAutonomousOperation {
  enabled: boolean;

  ownerUnavailable: boolean;

  continueSafeOperations: boolean;

  automaticRetryEnabled: boolean;

  automaticRepairEnabled: boolean;

  automaticRollbackEnabled: boolean;

  automaticIsolationEnabled: boolean;

  automaticVerificationRequired: boolean;

  criticalOperationsRequireOwner: boolean;
}

/* ============================================================
 * 8. STEWARD DECISION REQUEST
 * ============================================================
 */

export interface SovereignStewardDecisionRequest {
  id: string;

  operation: string;

  description: string;

  risk: StewardRiskLevel;

  resource?: string;

  jobId?: string;

  agentId?: string;

  capabilityId?: string;

  requiresOwnerApproval: boolean;

  policyChecked: boolean;

  permissionChecked: boolean;

  verificationRequired: boolean;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. STEWARD DECISION
 * ============================================================
 */

export interface SovereignStewardDecision {
  id: string;

  stewardId: string;

  requestId: string;

  type: StewardDecisionType;

  allowed: boolean;

  reason: string;

  risk: StewardRiskLevel;

  ownerApprovalRequired: boolean;

  policySatisfied: boolean;

  permissionSatisfied: boolean;

  verificationRequired: boolean;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. STEWARD HEALTH
 * ============================================================
 */

export interface SovereignStewardHealth {
  status: StewardStatus;

  operatingMode: StewardOperatingMode;

  coreConnected: boolean;

  runtimeConnected: boolean;

  planningConnected: boolean;

  executionConnected: boolean;

  agentsConnected: boolean;

  capabilitiesConnected: boolean;

  monitoringConnected: boolean;

  diagnosticsConnected: boolean;

  securityConnected: boolean;

  lastHeartbeatAt?: string;

  activeSupervisions: number;

  activeRecoveries: number;

  recordedFailures: number;
}

/* ============================================================
 * 11. STEWARD EVENTS
 * ============================================================
 */

export type SovereignStewardEventType =
  | "STEWARD_STARTED"
  | "STEWARD_STOPPED"
  | "STEWARD_HEARTBEAT"
  | "STEWARD_DECISION"
  | "STEWARD_RETRY"
  | "STEWARD_REPAIR"
  | "STEWARD_ROLLBACK"
  | "STEWARD_ISOLATION"
  | "STEWARD_ESCALATION"
  | "STEWARD_VERIFICATION"
  | "STEWARD_POLICY_BLOCK"
  | "STEWARD_PERMISSION_BLOCK"
  | "STEWARD_OWNER_REQUIRED";

/* ============================================================
 * 12. STEWARD EVENT
 * ============================================================
 */

export interface SovereignStewardEvent {
  id: string;

  type: SovereignStewardEventType;

  stewardId: string;

  timestamp: string;

  requestId?: string;

  jobId?: string;

  component?: string;

  message: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 13. STEWARD CONTROLLER
 * ============================================================
 */

export class SovereignStewardController {
  private readonly identity: SovereignStewardIdentity;

  private readonly responsibilities: SovereignStewardResponsibilities;

  private readonly autonomousOperation: SovereignAutonomousOperation;

  constructor(
    identity: SovereignStewardIdentity,
    responsibilities: SovereignStewardResponsibilities,
    autonomousOperation: SovereignAutonomousOperation,
  ) {
    this.identity = identity;

    this.responsibilities = responsibilities;

    this.autonomousOperation = autonomousOperation;
  }

  /* ========================================================
   * GET IDENTITY
   * ========================================================
   */

  getIdentity(): SovereignStewardIdentity {
    return this.identity;
  }

  /* ========================================================
   * GET RESPONSIBILITIES
   * ========================================================
   */

  getResponsibilities(): SovereignStewardResponsibilities {
    return this.responsibilities;
  }

  /* ========================================================
   * GET AUTONOMOUS OPERATION
   * ========================================================
   */

  getAutonomousOperation(): SovereignAutonomousOperation {
    return this.autonomousOperation;
  }

  /* ========================================================
   * CAN OPERATE AUTONOMOUSLY
   * ========================================================
   */

  canOperateAutonomously(): boolean {
    return (
      this.identity.status === "ACTIVE" ||
      this.identity.status === "SUPERVISING" ||
      this.identity.status === "RECOVERING"
    ) &&
    this.autonomousOperation.enabled &&
    this.identity.operatingMode !== "SAFE_MODE";
  }

  /* ========================================================
   * CAN EXECUTE
   * ========================================================
   */

  canExecute(
    request: SovereignStewardDecisionRequest,
  ): boolean {
    if (
      this.identity.status === "SUSPENDED" ||
      this.identity.status === "REVOKED" ||
      this.identity.status === "STOPPED"
    ) {
      return false;
    }

    if (!request.policyChecked) {
      return false;
    }

    if (!request.permissionChecked) {
      return false;
    }

    if (
      request.requiresOwnerApproval &&
      !this.autonomousOperation.criticalOperationsRequireOwner
    ) {
      return false;
    }

    if (
      request.risk === "CRITICAL" &&
      this.autonomousOperation.criticalOperationsRequireOwner
    ) {
      return false;
    }

    return true;
  }

  /* ========================================================
   * DECIDE
   * ========================================================
   */

  decide(
    request: SovereignStewardDecisionRequest,
  ): SovereignStewardDecision {
    const now = new Date().toISOString();

    if (this.identity.status === "REVOKED") {
      return {
        id: this.createId("decision"),
        stewardId: this.identity.id,
        requestId: request.id,
        type: "REJECT",
        allowed: false,
        reason:
          "Steward authority has been revoked by the sovereign authority.",
        risk: request.risk,
        ownerApprovalRequired: false,
        policySatisfied: request.policyChecked,
        permissionSatisfied: request.permissionChecked,
        verificationRequired: request.verificationRequired,
        createdAt: now,
      };
    }

    if (!request.policyChecked) {
      return {
        id: this.createId("decision"),
        stewardId: this.identity.id,
        requestId: request.id,
        type: "REJECT",
        allowed: false,
        reason:
          "Policy check is required before Steward execution.",
        risk: request.risk,
        ownerApprovalRequired: false,
        policySatisfied: false,
        permissionSatisfied: request.permissionChecked,
        verificationRequired: request.verificationRequired,
        createdAt: now,
      };
    }

    if (!request.permissionChecked) {
      return {
        id: this.createId("decision"),
        stewardId: this.identity.id,
        requestId: request.id,
        type: "REJECT",
        allowed: false,
        reason:
          "Permission check is required before Steward execution.",
        risk: request.risk,
        ownerApprovalRequired: false,
        policySatisfied: true,
        permissionSatisfied: false,
        verificationRequired: request.verificationRequired,
        createdAt: now,
      };
    }

    if (
      request.risk === "CRITICAL" &&
      this.autonomousOperation.criticalOperationsRequireOwner
    ) {
      return {
        id: this.createId("decision"),
        stewardId: this.identity.id,
        requestId: request.id,
        type: "ESCALATE",
        allowed: false,
        reason:
          "Critical operation requires OWNER authority.",
        risk: request.risk,
        ownerApprovalRequired: true,
        policySatisfied: true,
        permissionSatisfied: true,
        verificationRequired: true,
        createdAt: now,
      };
    }

    return {
      id: this.createId("decision"),
      stewardId: this.identity.id,
      requestId: request.id,
      type: "EXECUTE",
      allowed: this.canExecute(request),
      reason:
        "Operation is permitted within Steward delegated authority.",
      risk: request.risk,
      ownerApprovalRequired: false,
      policySatisfied: true,
      permissionSatisfied: true,
      verificationRequired: request.verificationRequired,
      createdAt: now,
    };
  }

  /* ========================================================
   * FAILURE RESPONSE
   * ========================================================
   */

  handleFailure(
    retryable: boolean,
    risk: StewardRiskLevel,
  ): StewardDecisionType {
    if (risk === "CRITICAL") {
      return "ESCALATE";
    }

    if (
      retryable &&
      this.autonomousOperation.automaticRetryEnabled
    ) {
      return "RETRY";
    }

    if (
      this.autonomousOperation.automaticIsolationEnabled
    ) {
      return "ISOLATE";
    }

    return "ESCALATE";
  }

  /* ========================================================
   * RECOVERY DECISION
   * ========================================================
   */

  recover(
    retryable: boolean,
    risk: StewardRiskLevel,
  ): StewardDecisionType {
    const response = this.handleFailure(
      retryable,
      risk,
    );

    if (
      response === "RETRY" &&
      this.autonomousOperation.automaticRetryEnabled
    ) {
      return "RETRY";
    }

    if (
      response === "ISOLATE" &&
      this.autonomousOperation.automaticIsolationEnabled
    ) {
      return "ISOLATE";
    }

    return "ESCALATE";
  }

  /* ========================================================
   * VERIFICATION
   * ========================================================
   */

  verify(
    success: boolean,
  ): StewardDecisionType {
    if (success) {
      return "VERIFY";
    }

    if (
      this.autonomousOperation.automaticRollbackEnabled
    ) {
      return "ROLLBACK";
    }

    return "ESCALATE";
  }

  /* ========================================================
   * OWNER BOUNDARY
   * ========================================================
   */

  cannotBecomeOwner(): true {
    return true;
  }

  /* ========================================================
   * ID GENERATOR
   * ========================================================
   */

  private createId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

/* ============================================================
 * 14. DEFAULT STEWARD CONTRACT
 * ============================================================
 */

export const SOVEREIGN_STEWARD_CONTRACT = {
  id: "SOVEREIGN-STEWARD-03",

  version: "1.0.0",

  type: "STEWARD",

  authorityLevel: 800,

  delegatedBy: "OWNER",

  supremeAuthority: false,

  autonomousOperation: true,

  ownerReplacement: false,

  selfElevation: false,

  policyBypass: false,

  permissionBypass: false,

  criticalOperationOwnerApproval: true,

  verificationRequired: true,

  failureRecovery: true,

  safeRetry: true,

  rollbackSupport: true,

  isolationSupport: true,

  continuousOperationDuringOwnerAbsence: true,

  status: "FOUNDATION",
} as const;

/* ============================================================
 * 15. DEFAULT RESPONSIBILITIES
 * ============================================================
 */

export const DEFAULT_STEWARD_RESPONSIBILITIES: SovereignStewardResponsibilities =
  {
    superviseCore: true,

    superviseRuntime: true,

    supervisePlanning: true,

    superviseExecution: true,

    superviseAgents: true,

    superviseCapabilities: true,

    superviseJobs: true,

    superviseBuilds: true,

    superviseDeployments: true,

    superviseMonitoring: true,

    superviseDiagnostics: true,

    superviseSecurity: true,

    superviseRecovery: true,

    superviseVerification: true,
  };

/* ============================================================
 * 16. DEFAULT AUTONOMOUS OPERATION
 * ============================================================
 */

export const DEFAULT_STEWARD_AUTONOMOUS_OPERATION: SovereignAutonomousOperation =
  {
    enabled: true,

    ownerUnavailable: true,

    continueSafeOperations: true,

    automaticRetryEnabled: true,

    automaticRepairEnabled: true,

    automaticRollbackEnabled: true,

    automaticIsolationEnabled: true,

    automaticVerificationRequired: true,

    criticalOperationsRequireOwner: true,
  };

/* ============================================================
 * END OF SOVEREIGN-STEWARD-03
 * ============================================================
 */
