/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-POLICY-PERMISSIONS-09
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Policy & Permission Enforcement Layer.
 *
 * Authority:
 * OWNER → STEWARD → CORE → POLICY/PERMISSIONS
 *                    ↓
 *                 AGENTS
 *                    ↓
 *               CAPABILITIES
 *
 * No Agent, Capability, Job or Runtime operation may bypass
 * this layer.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type PolicyDecision =
  | "ALLOW"
  | "DENY"
  | "REQUIRE_APPROVAL";

export type PermissionEffect =
  | "ALLOW"
  | "DENY";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type AuthorityLevel =
  | "OWNER"
  | "STEWARD"
  | "CORE"
  | "AGENT"
  | "CAPABILITY"
  | "SYSTEM";

/* ============================================================
 * 2. PERMISSION
 * ============================================================
 */

export interface SovereignPermission {
  id: string;

  name: string;

  description: string;

  resource: string;

  action: string;

  effect: PermissionEffect;

  enabled: boolean;

  restrictions: string[];

  createdAt: string;

  updatedAt: string;
}

/* ============================================================
 * 3. POLICY
 * ============================================================
 */

export interface SovereignPolicy {
  id: string;

  name: string;

  description: string;

  enabled: boolean;

  priority: number;

  subjects: string[];

  resources: string[];

  actions: string[];

  capabilities: string[];

  decision: PolicyDecision;

  riskLevel: RiskLevel;

  restrictions: string[];

  createdAt: string;

  updatedAt: string;
}

/* ============================================================
 * 4. AUTHORITY CONTEXT
 * ============================================================
 */

export interface AuthorityContext {
  actorId: string;

  authorityLevel: AuthorityLevel;

  ownerId: string;

  stewardId?: string;

  delegated: boolean;

  delegationScope: string[];

  permissions: string[];
}

/* ============================================================
 * 5. ACCESS REQUEST
 * ============================================================
 */

export interface SovereignAccessRequest {
  id: string;

  actor: AuthorityContext;

  resource: string;

  action: string;

  capabilityId?: string;

  jobId?: string;

  riskLevel: RiskLevel;

  metadata?: Record<string, unknown>;

  requestedAt: string;
}

/* ============================================================
 * 6. ACCESS RESULT
 * ============================================================
 */

export interface SovereignAccessResult {
  requestId: string;

  decision: PolicyDecision;

  allowed: boolean;

  requiresApproval: boolean;

  matchedPolicies: string[];

  matchedPermissions: string[];

  restrictions: string[];

  reason: string;

  evaluatedAt: string;
}

/* ============================================================
 * 7. APPROVAL RECORD
 * ============================================================
 */

export interface SovereignApproval {
  id: string;

  requestId: string;

  approvedBy: string;

  authorityLevel: AuthorityLevel;

  approved: boolean;

  reason?: string;

  createdAt: string;
}

/* ============================================================
 * 8. AUDIT RECORD
 * ============================================================
 */

export interface PolicyAuditRecord {
  id: string;

  requestId: string;

  actorId: string;

  resource: string;

  action: string;

  decision: PolicyDecision;

  reason: string;

  timestamp: string;
}

/* ============================================================
 * 9. POLICY & PERMISSION ENGINE
 * ============================================================
 */

export class SovereignPolicyPermissionEngine {
  public readonly id =
    "SOVEREIGN-POLICY-PERMISSIONS-09";

  public readonly version =
    "1.0.0";

  private permissions =
    new Map<string, SovereignPermission>();

  private policies =
    new Map<string, SovereignPolicy>();

  private approvals =
    new Map<string, SovereignApproval>();

  private audits: PolicyAuditRecord[] = [];

  /* ==========================================================
   * REGISTER PERMISSION
   * ==========================================================
   */

  registerPermission(
    permission: Omit<
      SovereignPermission,
      "createdAt" | "updatedAt"
    >
  ): SovereignPermission {
    if (this.permissions.has(permission.id)) {
      throw new Error(
        `Permission already exists: ${permission.id}`
      );
    }

    const now = this.now();

    const record: SovereignPermission = {
      ...permission,
      createdAt: now,
      updatedAt: now,
    };

    this.permissions.set(record.id, record);

    return record;
  }

  /* ==========================================================
   * REGISTER POLICY
   * ==========================================================
   */

  registerPolicy(
    policy: Omit<
      SovereignPolicy,
      "createdAt" | "updatedAt"
    >
  ): SovereignPolicy {
    if (this.policies.has(policy.id)) {
      throw new Error(
        `Policy already exists: ${policy.id}`
      );
    }

    const now = this.now();

    const record: SovereignPolicy = {
      ...policy,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(record.id, record);

    return record;
  }

  /* ==========================================================
   * EVALUATE ACCESS
   * ==========================================================
   */

  evaluate(
    request: SovereignAccessRequest
  ): SovereignAccessResult {
    /*
     * OWNER is the supreme authority, but OWNER operations
     * are still audited.
     */
    if (
      request.actor.authorityLevel === "OWNER" &&
      request.actor.actorId === request.actor.ownerId
    ) {
      return this.finalizeDecision(
        request,
        "ALLOW",
        [],
        request.actor.permissions,
        [],
        "Authorized by sovereign OWNER authority."
      );
    }

    /*
     * Delegated actors cannot escape their delegation scope.
     */
    if (
      request.actor.delegated &&
      !this.scopeAllows(
        request.actor.delegationScope,
        request.resource,
        request.action
      )
    ) {
      return this.finalizeDecision(
        request,
        "DENY",
        [],
        [],
        [],
        "Operation exceeds delegated authority scope."
      );
    }

    const permissions =
      this.findMatchingPermissions(request);

    const policies =
      this.findMatchingPolicies(request);

    /*
     * Explicit DENY always wins.
     */
    const deniedPermission =
      permissions.find(
        (permission) =>
          permission.enabled &&
          permission.effect === "DENY"
      );

    if (deniedPermission) {
      return this.finalizeDecision(
        request,
        "DENY",
        policies.map((policy) => policy.id),
        [deniedPermission.id],
        deniedPermission.restrictions,
        `Denied by permission ${deniedPermission.id}.`
      );
    }

    const deniedPolicy =
      policies.find(
        (policy) =>
          policy.enabled &&
          policy.decision === "DENY"
      );

    if (deniedPolicy) {
      return this.finalizeDecision(
        request,
        "DENY",
        [deniedPolicy.id],
        permissions.map(
          (permission) => permission.id
        ),
        deniedPolicy.restrictions,
        `Denied by policy ${deniedPolicy.id}.`
      );
    }

    /*
     * Critical operations require explicit approval unless
     * performed directly by OWNER.
     */
    if (request.riskLevel === "CRITICAL") {
      return this.finalizeDecision(
        request,
        "REQUIRE_APPROVAL",
        policies.map((policy) => policy.id),
        permissions.map(
          (permission) => permission.id
        ),
        this.collectRestrictions(policies, permissions),
        "Critical-risk operation requires explicit approval."
      );
    }

    const approvalPolicy =
      policies.find(
        (policy) =>
          policy.enabled &&
          policy.decision === "REQUIRE_APPROVAL"
      );

    if (approvalPolicy) {
      return this.finalizeDecision(
        request,
        "REQUIRE_APPROVAL",
        policies.map((policy) => policy.id),
        permissions.map(
          (permission) => permission.id
        ),
        this.collectRestrictions(policies, permissions),
        `Approval required by policy ${approvalPolicy.id}.`
      );
    }

    const allowedPermission =
      permissions.find(
        (permission) =>
          permission.enabled &&
          permission.effect === "ALLOW"
      );

    const allowedPolicy =
      policies.find(
        (policy) =>
          policy.enabled &&
          policy.decision === "ALLOW"
      );

    if (allowedPermission || allowedPolicy) {
      return this.finalizeDecision(
        request,
        "ALLOW",
        policies.map((policy) => policy.id),
        permissions.map(
          (permission) => permission.id
        ),
        this.collectRestrictions(policies, permissions),
        "Operation authorized by sovereign policy and permission rules."
      );
    }

    /*
     * Default deny.
     */
    return this.finalizeDecision(
      request,
      "DENY",
      [],
      [],
      [],
      "No explicit permission or policy authorizes this operation."
    );
  }

  /* ==========================================================
   * APPROVAL
   * ==========================================================
   */

  recordApproval(
    approval: Omit<
      SovereignApproval,
      "id" | "createdAt"
    >
  ): SovereignApproval {
    if (
      approval.authorityLevel !== "OWNER" &&
      approval.authorityLevel !== "STEWARD"
    ) {
      throw new Error(
        "Only OWNER or authorized STEWARD may approve protected operations."
      );
    }

    const record: SovereignApproval = {
      ...approval,
      id: this.createId("APPROVAL"),
      createdAt: this.now(),
    };

    this.approvals.set(
      record.requestId,
      record
    );

    return record;
  }

  getApproval(
    requestId: string
  ): SovereignApproval | undefined {
    return this.approvals.get(requestId);
  }

  /* ==========================================================
   * VERIFY APPROVAL
   * ==========================================================
   */

  verifyApproval(
    requestId: string
  ): boolean {
    const approval =
      this.approvals.get(requestId);

    return approval?.approved === true;
  }

  /* ==========================================================
   * GET PERMISSION
   * ==========================================================
   */

  getPermission(
    permissionId: string
  ): SovereignPermission | undefined {
    return this.permissions.get(permissionId);
  }

  /* ==========================================================
   * GET POLICY
   * ==========================================================
   */

  getPolicy(
    policyId: string
  ): SovereignPolicy | undefined {
    return this.policies.get(policyId);
  }

  /* ==========================================================
   * LIST PERMISSIONS
   * ==========================================================
   */

  listPermissions(): SovereignPermission[] {
    return Array.from(this.permissions.values());
  }

  /* ==========================================================
   * LIST POLICIES
   * ==========================================================
   */

  listPolicies(): SovereignPolicy[] {
    return Array.from(this.policies.values())
      .sort(
        (a, b) =>
          b.priority - a.priority
      );
  }

  /* ==========================================================
   * AUDIT
   * ==========================================================
   */

  getAuditRecords(): PolicyAuditRecord[] {
    return [...this.audits];
  }

  /* ==========================================================
   * MATCH PERMISSIONS
   * ==========================================================
   */

  private findMatchingPermissions(
    request: SovereignAccessRequest
  ): SovereignPermission[] {
    return Array.from(
      this.permissions.values()
    ).filter((permission) => {
      if (!permission.enabled) {
        return false;
      }

      const assigned =
        request.actor.permissions.includes(
          permission.id
        );

      if (!assigned) {
        return false;
      }

      return (
        this.matches(
          permission.resource,
          request.resource
        ) &&
        this.matches(
          permission.action,
          request.action
        )
      );
    });
  }

  /* ==========================================================
   * MATCH POLICIES
   * ==========================================================
   */

  private findMatchingPolicies(
    request: SovereignAccessRequest
  ): SovereignPolicy[] {
    return Array.from(
      this.policies.values()
    )
      .filter((policy) => {
        if (!policy.enabled) {
          return false;
        }

        const subjectMatch =
          policy.subjects.length === 0 ||
          policy.subjects.includes("*") ||
          policy.subjects.includes(
            request.actor.actorId
          ) ||
          policy.subjects.includes(
            request.actor.authorityLevel
          );

        const resourceMatch =
          policy.resources.length === 0 ||
          policy.resources.some(
            (resource) =>
              this.matches(
                resource,
                request.resource
              )
          );

        const actionMatch =
          policy.actions.length === 0 ||
          policy.actions.some(
            (action) =>
              this.matches(
                action,
                request.action
              )
          );

        const capabilityMatch =
          policy.capabilities.length === 0 ||
          policy.capabilities.includes("*") ||
          (
            request.capabilityId !== undefined &&
            policy.capabilities.includes(
              request.capabilityId
            )
          );

        return (
          subjectMatch &&
          resourceMatch &&
          actionMatch &&
          capabilityMatch
        );
      })
      .sort(
        (a, b) =>
          b.priority - a.priority
      );
  }

  /* ==========================================================
   * SCOPE CHECK
   * ==========================================================
   */

  private scopeAllows(
    scopes: string[],
    resource: string,
    action: string
  ): boolean {
    if (
      scopes.includes("*")
    ) {
      return true;
    }

    return scopes.some(
      (scope) =>
        scope === resource ||
        scope === `${resource}:*` ||
        scope === `${resource}:${action}`
    );
  }

  /* ==========================================================
   * MATCH HELPER
   * ==========================================================
   */

  private matches(
    rule: string,
    value: string
  ): boolean {
    if (rule === "*") {
      return true;
    }

    if (rule === value) {
      return true;
    }

    if (
      rule.endsWith("*")
    ) {
      return value.startsWith(
        rule.slice(0, -1)
      );
    }

    return false;
  }

  /* ==========================================================
   * RESTRICTIONS
   * ==========================================================
   */

  private collectRestrictions(
    policies: SovereignPolicy[],
    permissions: SovereignPermission[]
  ): string[] {
    return Array.from(
      new Set([
        ...policies.flatMap(
          (policy) =>
            policy.restrictions
        ),

        ...permissions.flatMap(
          (permission) =>
            permission.restrictions
        ),
      ])
    );
  }

  /* ==========================================================
   * FINALIZE DECISION
   * ==========================================================
   */

  private finalizeDecision(
    request: SovereignAccessRequest,
    decision: PolicyDecision,
    matchedPolicies: string[],
    matchedPermissions: string[],
    restrictions: string[],
    reason: string
  ): SovereignAccessResult {
    const result: SovereignAccessResult = {
      requestId: request.id,

      decision,

      allowed:
        decision === "ALLOW",

      requiresApproval:
        decision === "REQUIRE_APPROVAL",

      matchedPolicies,

      matchedPermissions,

      restrictions,

      reason,

      evaluatedAt: this.now(),
    };

    this.audits.push({
      id: this.createId("AUDIT"),

      requestId: request.id,

      actorId:
        request.actor.actorId,

      resource:
        request.resource,

      action:
        request.action,

      decision,

      reason,

      timestamp:
        this.now(),
    });

    return result;
  }

  /* ==========================================================
   * HELPERS
   * ==========================================================
   */

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

/* ============================================================
 * 10. FACTORY
 * ============================================================
 */

export function createSovereignPolicyPermissionEngine():
  SovereignPolicyPermissionEngine {
  return new SovereignPolicyPermissionEngine();
}

/* ============================================================
 * 11. ARCHITECTURAL BOUNDARY
 * ============================================================
 *
 * SOVEREIGN-POLICY-PERMISSIONS-09:
 *
 * DOES:
 * - Enforce permissions.
 * - Enforce policies.
 * - Enforce delegation boundaries.
 * - Apply default-deny behavior.
 * - Require approval for protected operations.
 * - Protect capabilities and resources.
 * - Record authorization decisions.
 * - Preserve OWNER supreme authority.
 *
 * DOES NOT:
 * - Execute jobs.
 * - Execute tools.
 * - Replace Runtime.
 * - Replace Core.
 * - Give Agents unrestricted authority.
 * - Allow delegated authority beyond its scope.
 *
 * OWNER = SUPREME AUTHORITY.
 * STEWARD = DELEGATED EXECUTIVE AUTHORITY.
 * CORE = CENTRAL INTELLIGENCE.
 * AGENTS = CONTROLLED OPERATIONAL ACTORS.
 * ============================================================
 */
