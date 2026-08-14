/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-AUTHORIZATION-24
 * ============================================================
 *
 * Central Sovereign Authorization Engine.
 *
 * Responsibilities:
 * - Evaluate access after authentication.
 * - Manage roles and permissions.
 * - Support resource/action authorization.
 * - Support explicit grants and denies.
 * - Support delegated permissions.
 * - Enforce OWNER supremacy.
 * - Enforce STEWARD delegated authority.
 * - Prevent privilege escalation.
 * - Support temporary authorization grants.
 * - Preserve authorization decisions and audit events.
 *
 * AUTHORIZATION has NO sovereign authority of its own.
 * It evaluates authority already granted by sovereign governance.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * > IDENTITY > AUTHENTICATION > AUTHORIZATION
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. AUTHORIZATION SUBJECT TYPES
 * ============================================================
 */

export type SovereignAuthorizationSubjectType =
  | "OWNER"
  | "STEWARD"
  | "USER"
  | "ADMIN"
  | "DEVELOPER"
  | "AGENT"
  | "CAPABILITY"
  | "SERVICE"
  | "SYSTEM";

/* ============================================================
 * 2. EFFECT
 * ============================================================
 */

export type SovereignAuthorizationEffect =
  | "ALLOW"
  | "DENY";

/* ============================================================
 * 3. OPERATIONS
 * ============================================================
 */

export type SovereignAuthorizationOperation =
  | "CHECK"
  | "GRANT"
  | "REVOKE"
  | "CREATE_ROLE"
  | "UPDATE_ROLE"
  | "ASSIGN_ROLE"
  | "REMOVE_ROLE"
  | "DELEGATE"
  | "REVOKE_DELEGATION";

/* ============================================================
 * 4. PERMISSION
 * ============================================================
 */

export interface SovereignPermission {
  id: string;

  resource: string;

  action: string;

  effect: SovereignAuthorizationEffect;

  conditions?: Record<string, unknown>;

  description?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. ROLE
 * ============================================================
 */

export interface SovereignAuthorizationRole {
  id: string;

  name: string;

  description?: string;

  permissions: SovereignPermission[];

  systemRole: boolean;

  protected: boolean;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. ROLE ASSIGNMENT
 * ============================================================
 */

export interface SovereignRoleAssignment {
  id: string;

  identityId: string;

  roleId: string;

  grantedBy: string;

  createdAt: string;

  expiresAt?: string;

  revokedAt?: string;

  active: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. DIRECT GRANT
 * ============================================================
 */

export interface SovereignAuthorizationGrant {
  id: string;

  identityId: string;

  permission: SovereignPermission;

  grantedBy: string;

  createdAt: string;

  expiresAt?: string;

  revokedAt?: string;

  active: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. DELEGATION
 * ============================================================
 */

export interface SovereignAuthorizationDelegation {
  id: string;

  delegatorId: string;

  delegateId: string;

  permissions: SovereignPermission[];

  createdAt: string;

  expiresAt?: string;

  revokedAt?: string;

  active: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. AUTHORIZATION SUBJECT
 * ============================================================
 */

export interface SovereignAuthorizationSubject {
  identityId: string;

  type: SovereignAuthorizationSubjectType;

  authenticated: boolean;

  sessionId?: string;

  roles?: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. AUTHORIZATION REQUEST
 * ============================================================
 */

export interface SovereignAuthorizationRequest {
  subject: SovereignAuthorizationSubject;

  resource: string;

  action: string;

  context?: Record<string, unknown>;
}

/* ============================================================
 * 11. AUTHORIZATION DECISION
 * ============================================================
 */

export interface SovereignAuthorizationDecision {
  id: string;

  identityId: string;

  resource: string;

  action: string;

  allowed: boolean;

  effect: SovereignAuthorizationEffect;

  reason: string;

  matchedPermissionIds: string[];

  evaluatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 12. MANAGEMENT CONTEXT
 * ============================================================
 */

export interface SovereignAuthorizationContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  permissions: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 13. IDENTITY BRIDGE
 * ============================================================
 */

export interface SovereignAuthorizationIdentityBridge {
  identityExists(
    identityId: string
  ): Promise<boolean>;

  identityActive(
    identityId: string
  ): Promise<boolean>;

  identityType(
    identityId: string
  ): Promise<
    SovereignAuthorizationSubjectType | undefined
  >;
}

/* ============================================================
 * 14. STORE
 * ============================================================
 */

export interface SovereignAuthorizationStore {
  createRole(
    role: SovereignAuthorizationRole
  ): Promise<void>;

  updateRole(
    role: SovereignAuthorizationRole
  ): Promise<void>;

  getRole(
    roleId: string
  ): Promise<SovereignAuthorizationRole | undefined>;

  listRoles():
    Promise<SovereignAuthorizationRole[]>;

  createAssignment(
    assignment: SovereignRoleAssignment
  ): Promise<void>;

  updateAssignment(
    assignment: SovereignRoleAssignment
  ): Promise<void>;

  listAssignments(
    identityId: string
  ): Promise<SovereignRoleAssignment[]>;

  createGrant(
    grant: SovereignAuthorizationGrant
  ): Promise<void>;

  updateGrant(
    grant: SovereignAuthorizationGrant
  ): Promise<void>;

  listGrants(
    identityId: string
  ): Promise<SovereignAuthorizationGrant[]>;

  createDelegation(
    delegation: SovereignAuthorizationDelegation
  ): Promise<void>;

  updateDelegation(
    delegation: SovereignAuthorizationDelegation
  ): Promise<void>;

  listDelegationsForDelegate(
    identityId: string
  ): Promise<SovereignAuthorizationDelegation[]>;
}

/* ============================================================
 * 15. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignAuthorizationAccessValidator {
  validate(
    operation: SovereignAuthorizationOperation,
    context: SovereignAuthorizationContext
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 16. EVENT BUS
 * ============================================================
 */

export interface SovereignAuthorizationEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    identityId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 17. AUDIT
 * ============================================================
 */

export interface SovereignAuthorizationAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 18. AUTHORIZATION ENGINE
 * ============================================================
 */

export class SovereignAuthorizationEngine {
  public readonly id =
    "SOVEREIGN-AUTHORIZATION-24";

  public readonly version =
    "1.0.0";

  private store?: SovereignAuthorizationStore;

  private identityBridge?:
    SovereignAuthorizationIdentityBridge;

  private accessValidator?:
    SovereignAuthorizationAccessValidator;

  private eventBus?:
    SovereignAuthorizationEventBus;

  private audit?: SovereignAuthorizationAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignAuthorizationStore
  ): void {
    this.store = store;
  }

  setIdentityBridge(
    bridge: SovereignAuthorizationIdentityBridge
  ): void {
    this.identityBridge = bridge;
  }

  setAccessValidator(
    validator: SovereignAuthorizationAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignAuthorizationEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignAuthorizationAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE ROLE
   * ==========================================================
   */

  async createRole(
    input: {
      id: string;
      name: string;
      description?: string;
      permissions?: SovereignPermission[];
      systemRole?: boolean;
      protected?: boolean;
      metadata?: Record<string, unknown>;
    },
    context: SovereignAuthorizationContext
  ): Promise<SovereignAuthorizationRole> {
    this.requireManagementAccess(
      "CREATE_ROLE",
      context
    );

    if (!input.id.trim()) {
      throw new Error(
        "Authorization role ID is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Authorization role name is required."
      );
    }

    const store = this.requireStore();

    if (await store.getRole(input.id)) {
      throw new Error(
        `Authorization role already exists: ${input.id}`
      );
    }

    const now = this.now();

    const role:
      SovereignAuthorizationRole = {
      id: input.id,

      name: input.name,

      description:
        input.description,

      permissions:
        input.permissions
          ? [...input.permissions]
          : [],

      systemRole:
        input.systemRole ?? false,

      protected:
        input.protected ?? false,

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    this.validatePermissions(
      role.permissions
    );

    await store.createRole(role);

    await this.publish(
      "authorization.role.created",
      context.actorId,
      {
        roleId: role.id,
        name: role.name,
      }
    );

    await this.recordAudit(
      "authorization.role.create",
      role.id,
      "SUCCESS",
      {
        actorId: context.actorId,
      }
    );

    return role;
  }

  /* ==========================================================
   * ADD PERMISSION TO ROLE
   * ==========================================================
   */

  async addRolePermission(
    roleId: string,
    permission: SovereignPermission,
    context: SovereignAuthorizationContext
  ): Promise<SovereignAuthorizationRole> {
    this.requireManagementAccess(
      "UPDATE_ROLE",
      context
    );

    const role =
      await this.requireRole(roleId);

    this.protectRoleMutation(
      role,
      context
    );

    this.validatePermission(
      permission
    );

    if (
      role.permissions.some(
        (item) =>
          item.id === permission.id
      )
    ) {
      throw new Error(
        `Permission already exists on role: ${permission.id}`
      );
    }

    role.permissions.push(
      permission
    );

    role.updatedAt =
      this.now();

    await this.requireStore()
      .updateRole(role);

    await this.publish(
      "authorization.role.permission.added",
      context.actorId,
      {
        roleId,
        permissionId:
          permission.id,
      }
    );

    return role;
  }

  /* ==========================================================
   * ASSIGN ROLE
   * ==========================================================
   */

  async assignRole(
    identityId: string,
    roleId: string,
    context: SovereignAuthorizationContext,
    options?: {
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignRoleAssignment> {
    this.requireManagementAccess(
      "ASSIGN_ROLE",
      context
    );

    await this.requireActiveIdentity(
      identityId
    );

    const role =
      await this.requireRole(roleId);

    this.protectRoleAssignment(
      identityId,
      role,
      context
    );

    const assignment:
      SovereignRoleAssignment = {
      id:
        this.createId(
          "ROLE-ASSIGNMENT"
        ),

      identityId,

      roleId,

      grantedBy:
        context.actorId,

      createdAt:
        this.now(),

      expiresAt:
        options?.expiresAt,

      active: true,

      metadata:
        options?.metadata,
    };

    await this.requireStore()
      .createAssignment(
        assignment
      );

    await this.publish(
      "authorization.role.assigned",
      identityId,
      {
        roleId,
        assignmentId:
          assignment.id,
        grantedBy:
          context.actorId,
      }
    );

    await this.recordAudit(
      "authorization.role.assign",
      assignment.id,
      "SUCCESS",
      {
        identityId,
        roleId,
        actorId:
          context.actorId,
      }
    );

    return assignment;
  }

  /* ==========================================================
   * REMOVE ROLE
   * ==========================================================
   */

  async removeRole(
    identityId: string,
    assignmentId: string,
    context: SovereignAuthorizationContext
  ): Promise<SovereignRoleAssignment> {
    this.requireManagementAccess(
      "REMOVE_ROLE",
      context
    );

    const assignments =
      await this.requireStore()
        .listAssignments(
          identityId
        );

    const assignment =
      assignments.find(
        (item) =>
          item.id ===
          assignmentId
      );

    if (!assignment) {
      throw new Error(
        `Role assignment not found: ${assignmentId}`
      );
    }

    const role =
      await this.requireRole(
        assignment.roleId
      );

    this.protectRoleMutation(
      role,
      context
    );

    assignment.active = false;
    assignment.revokedAt =
      this.now();

    await this.requireStore()
      .updateAssignment(
        assignment
      );

    await this.publish(
      "authorization.role.removed",
      identityId,
      {
        assignmentId,
        roleId:
          assignment.roleId,
      }
    );

    return assignment;
  }

  /* ==========================================================
   * DIRECT GRANT
   * ==========================================================
   */

  async grant(
    identityId: string,
    permission: SovereignPermission,
    context: SovereignAuthorizationContext,
    options?: {
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignAuthorizationGrant> {
    this.requireManagementAccess(
      "GRANT",
      context
    );

    await this.requireActiveIdentity(
      identityId
    );

    this.validatePermission(
      permission
    );

    this.preventPrivilegeEscalation(
      permission,
      context
    );

    const grant:
      SovereignAuthorizationGrant = {
      id:
        this.createId(
          "AUTH-GRANT"
        ),

      identityId,

      permission,

      grantedBy:
        context.actorId,

      createdAt:
        this.now(),

      expiresAt:
        options?.expiresAt,

      active: true,

      metadata:
        options?.metadata,
    };

    await this.requireStore()
      .createGrant(grant);

    await this.publish(
      "authorization.grant.created",
      identityId,
      {
        grantId:
          grant.id,

        resource:
          permission.resource,

        action:
          permission.action,

        effect:
          permission.effect,
      }
    );

    await this.recordAudit(
      "authorization.grant",
      grant.id,
      "SUCCESS",
      {
        identityId,
        actorId:
          context.actorId,
      }
    );

    return grant;
  }

  /* ==========================================================
   * REVOKE GRANT
   * ==========================================================
   */

  async revokeGrant(
    identityId: string,
    grantId: string,
    context: SovereignAuthorizationContext
  ): Promise<SovereignAuthorizationGrant> {
    this.requireManagementAccess(
      "REVOKE",
      context
    );

    const grants =
      await this.requireStore()
        .listGrants(identityId);

    const grant =
      grants.find(
        (item) =>
          item.id === grantId
      );

    if (!grant) {
      throw new Error(
        `Authorization grant not found: ${grantId}`
      );
    }

    grant.active = false;
    grant.revokedAt =
      this.now();

    await this.requireStore()
      .updateGrant(grant);

    await this.publish(
      "authorization.grant.revoked",
      identityId,
      {
        grantId,
      }
    );

    return grant;
  }

  /* ==========================================================
   * DELEGATE
   * ==========================================================
   */

  async delegate(
    delegateId: string,
    permissions: SovereignPermission[],
    context: SovereignAuthorizationContext,
    options?: {
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignAuthorizationDelegation> {
    this.requireManagementAccess(
      "DELEGATE",
      context
    );

    await this.requireActiveIdentity(
      delegateId
    );

    this.validatePermissions(
      permissions
    );

    for (
      const permission of
      permissions
    ) {
      this.preventPrivilegeEscalation(
        permission,
        context
      );
    }

    const delegation:
      SovereignAuthorizationDelegation = {
      id:
        this.createId(
          "AUTH-DELEGATION"
        ),

      delegatorId:
        context.actorId,

      delegateId,

      permissions:
        [...permissions],

      createdAt:
        this.now(),

      expiresAt:
        options?.expiresAt,

      active: true,

      metadata:
        options?.metadata,
    };

    await this.requireStore()
      .createDelegation(
        delegation
      );

    await this.publish(
      "authorization.delegation.created",
      delegateId,
      {
        delegationId:
          delegation.id,

        delegatorId:
          context.actorId,
      }
    );

    await this.recordAudit(
      "authorization.delegate",
      delegation.id,
      "SUCCESS",
      {
        delegatorId:
          context.actorId,

        delegateId,
      }
    );

    return delegation;
  }

  /* ==========================================================
   * REVOKE DELEGATION
   * ==========================================================
   */

  async revokeDelegation(
    delegationId: string,
    delegateId: string,
    context: SovereignAuthorizationContext
  ): 
