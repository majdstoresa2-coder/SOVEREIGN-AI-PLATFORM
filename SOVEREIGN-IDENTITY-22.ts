/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-IDENTITY-22
 * ============================================================
 *
 * Central Sovereign Identity Engine.
 *
 * Responsibilities:
 * - Create and manage sovereign identities.
 * - Maintain immutable internal identity IDs.
 * - Manage identity lifecycle.
 * - Manage credentials references.
 * - Manage sessions.
 * - Manage identity attributes.
 * - Support service/system identities.
 * - Enforce Policy, Permission and Security boundaries.
 * - Preserve identity audit events.
 *
 * IDENTITY has NO sovereign authority.
 * Identity does not grant authority by itself.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY > IDENTITY
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. IDENTITY TYPES
 * ============================================================
 */

export type SovereignIdentityType =
  | "OWNER"
  | "STEWARD"
  | "USER"
  | "ADMIN"
  | "DEVELOPER"
  | "AGENT"
  | "CAPABILITY"
  | "SERVICE"
  | "SYSTEM";

export type SovereignIdentityStatus =
  | "PENDING"
  | "ACTIVE"
  | "LOCKED"
  | "SUSPENDED"
  | "DISABLED"
  | "REVOKED";

export type SovereignIdentityOperation =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "ACTIVATE"
  | "LOCK"
  | "SUSPEND"
  | "DISABLE"
  | "REVOKE"
  | "CREATE_SESSION"
  | "REVOKE_SESSION";

/* ============================================================
 * 2. IDENTITY ATTRIBUTE
 * ============================================================
 */

export interface SovereignIdentityAttribute {
  key: string;

  value: string;

  verified: boolean;

  sensitive?: boolean;

  createdAt: string;

  verifiedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. CREDENTIAL REFERENCE
 * ============================================================
 */

export interface SovereignCredentialReference {
  id: string;

  type:
    | "PASSWORD"
    | "PASSKEY"
    | "OTP"
    | "TOKEN"
    | "CERTIFICATE"
    | "KEY"
    | "EXTERNAL_IDENTITY"
    | "CUSTOM";

  provider:
    | "SOVEREIGN"
    | "SYSTEM"
    | "CUSTOM";

  enabled: boolean;

  createdAt: string;

  rotatedAt?: string;

  expiresAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. IDENTITY RECORD
 * ============================================================
 */

export interface SovereignIdentity {
  id: string;

  type: SovereignIdentityType;

  status: SovereignIdentityStatus;

  displayName?: string;

  attributes: SovereignIdentityAttribute[];

  credentials: SovereignCredentialReference[];

  createdAt: string;

  updatedAt: string;

  activatedAt?: string;

  suspendedAt?: string;

  revokedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. CREATE REQUEST
 * ============================================================
 */

export interface SovereignIdentityCreateRequest {
  type: SovereignIdentityType;

  displayName?: string;

  attributes?: Array<{
    key: string;
    value: string;
    verified?: boolean;
    sensitive?: boolean;
    metadata?: Record<string, unknown>;
  }>;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. SESSION
 * ============================================================
 */

export interface SovereignIdentitySession {
  id: string;

  identityId: string;

  status:
    | "ACTIVE"
    | "EXPIRED"
    | "REVOKED";

  createdAt: string;

  lastSeenAt: string;

  expiresAt: string;

  revokedAt?: string;

  deviceId?: string;

  ipHash?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONTEXT
 * ============================================================
 */

export interface SovereignIdentityContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  policyChecked: boolean;

  permissionChecked: boolean;

  securityChecked: boolean;

  permissions: string[];
}

/* ============================================================
 * 8. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignIdentityAccessValidator {
  validate(
    operation: SovereignIdentityOperation,
    context: SovereignIdentityContext,
    identity?: SovereignIdentity
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 9. IDENTITY STORE
 * ============================================================
 */

export interface SovereignIdentityStore {
  create(
    identity: SovereignIdentity
  ): Promise<void>;

  update(
    identity: SovereignIdentity
  ): Promise<void>;

  get(
    identityId: string
  ): Promise<SovereignIdentity | undefined>;

  list():
    Promise<SovereignIdentity[]>;

  createSession(
    session: SovereignIdentitySession
  ): Promise<void>;

  updateSession(
    session: SovereignIdentitySession
  ): Promise<void>;

  getSession(
    sessionId: string
  ): Promise<SovereignIdentitySession | undefined>;

  listSessions(
    identityId: string
  ): Promise<SovereignIdentitySession[]>;
}

/* ============================================================
 * 10. EVENT BUS
 * ============================================================
 */

export interface SovereignIdentityEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    identityId?: string;

    sessionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 11. AUDIT
 * ============================================================
 */

export interface SovereignIdentityAudit {
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
 * 12. IDENTITY ENGINE
 * ============================================================
 */

export class SovereignIdentityEngine {
  public readonly id =
    "SOVEREIGN-IDENTITY-22";

  public readonly version =
    "1.0.0";

  private store?:
    SovereignIdentityStore;

  private accessValidator?:
    SovereignIdentityAccessValidator;

  private eventBus?:
    SovereignIdentityEventBus;

  private audit?:
    SovereignIdentityAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignIdentityStore
  ): void {
    this.store = store;
  }

  setAccessValidator(
    validator: SovereignIdentityAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignIdentityEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignIdentityAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE IDENTITY
   * ==========================================================
   */

  async create(
    request: SovereignIdentityCreateRequest,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    this.requireAccess(
      "CREATE",
      context
    );

    const store =
      this.requireStore();

    const now =
      this.now();

    const identity:
      SovereignIdentity = {
      id:
        this.createId(
          "IDENTITY"
        ),

      type:
        request.type,

      status:
        "PENDING",

      displayName:
        request.displayName,

      attributes:
        (request.attributes ?? []).map(
          (attribute) => ({
            key:
              attribute.key,

            value:
              attribute.value,

            verified:
              attribute.verified ??
              false,

            sensitive:
              attribute.sensitive,

            createdAt:
              now,

            verifiedAt:
              attribute.verified
                ? now
                : undefined,

            metadata:
              attribute.metadata,
          })
        ),

      credentials: [],

      createdAt:
        now,

      updatedAt:
        now,

      metadata:
        request.metadata,
    };

    this.validateAttributes(
      identity.attributes
    );

    await store.create(
      identity
    );

    await this.publish(
      "identity.created",
      identity.id,
      undefined,
      {
        type:
          identity.type,

        status:
          identity.status,
      }
    );

    await this.recordAudit(
      "identity.create",
      identity.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return identity;
  }

  /* ==========================================================
   * ACTIVATE
   * ==========================================================
   */

  async activate(
    identityId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "ACTIVATE",
      context,
      identity
    );

    if (
      identity.status ===
      "REVOKED"
    ) {
      throw new Error(
        "Revoked identity cannot be activated."
      );
    }

    identity.status =
      "ACTIVE";

    identity.activatedAt =
      this.now();

    identity.updatedAt =
      identity.activatedAt;

    await this.requireStore()
      .update(identity);

    await this.publish(
      "identity.activated",
      identity.id,
      undefined,
      {}
    );

    await this.recordAudit(
      "identity.activate",
      identity.id,
      "SUCCESS"
    );

    return identity;
  }

  /* ==========================================================
   * UPDATE DISPLAY NAME
   * ==========================================================
   */

  async updateDisplayName(
    identityId: string,
    displayName: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "UPDATE",
      context,
      identity
    );

    identity.displayName =
      displayName.trim();

    identity.updatedAt =
      this.now();

    await this.requireStore()
      .update(identity);

    await this.publish(
      "identity.updated",
      identity.id,
      undefined,
      {
        field:
          "displayName",
      }
    );

    return identity;
  }

  /* ==========================================================
   * ADD ATTRIBUTE
   * ==========================================================
   */

  async addAttribute(
    identityId: string,
    input: {
      key: string;
      value: string;
      verified?: boolean;
      sensitive?: boolean;
      metadata?: Record<string, unknown>;
    },
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "UPDATE",
      context,
      identity
    );

    if (!input.key.trim()) {
      throw new Error(
        "Identity attribute key is required."
      );
    }

    if (
      identity.attributes.some(
        (attribute) =>
          attribute.key ===
          input.key
      )
    ) {
      throw new Error(
        `Identity attribute already exists: ${input.key}`
      );
    }

    const now =
      this.now();

    identity.attributes.push({
      key:
        input.key,

      value:
        input.value,

      verified:
        input.verified ??
        false,

      sensitive:
        input.sensitive,

      createdAt:
        now,

      verifiedAt:
        input.verified
          ? now
          : undefined,

      metadata:
        input.metadata,
    });

    identity.updatedAt =
      now;

    await this.requireStore()
      .update(identity);

    await this.publish(
      "identity.attribute.added",
      identity.id,
      undefined,
      {
        key:
          input.key,
      }
    );

    return identity;
  }

  /* ==========================================================
   * ADD CREDENTIAL REFERENCE
   * ==========================================================
   */

  async addCredential(
    identityId: string,
    credential: Omit<
      SovereignCredentialReference,
      "id" | "createdAt"
    >,
    context: SovereignIdentityContext
  ): Promise<SovereignCredentialReference> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "UPDATE",
      context,
      identity
    );

    const created:
      SovereignCredentialReference = {
      ...credential,

      id:
        this.createId(
          "CREDENTIAL"
        ),

      createdAt:
        this.now(),
    };

    identity.credentials.push(
      created
    );

    identity.updatedAt =
      this.now();

    await this.requireStore()
      .update(identity);

    await this.publish(
      "identity.credential.added",
      identity.id,
      undefined,
      {
        credentialId:
          created.id,

        type:
          created.type,
      }
    );

    await this.recordAudit(
      "identity.credential.add",
      created.id,
      "SUCCESS",
      {
        identityId,
      }
    );

    return created;
  }

  /* ==========================================================
   * LOCK
   * ==========================================================
   */

  async lock(
    identityId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    return this.changeStatus(
      identityId,
      "LOCK",
      "LOCKED",
      context
    );
  }

  /* ==========================================================
   * SUSPEND
   * ==========================================================
   */

  async suspend(
    identityId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    const identity =
      await this.changeStatus(
        identityId,
        "SUSPEND",
        "SUSPENDED",
        context
      );

    identity.suspendedAt =
      this.now();

    identity.updatedAt =
      identity.suspendedAt;

    await this.requireStore()
      .update(identity);

    return identity;
  }

  /* ==========================================================
   * DISABLE
   * ==========================================================
   */

  async disable(
    identityId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    return this.changeStatus(
      identityId,
      "DISABLE",
      "DISABLED",
      context
    );
  }

  /* ==========================================================
   * REVOKE
   * ==========================================================
   */

  async revoke(
    identityId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentity> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "REVOKE",
      context,
      identity
    );

    identity.status =
      "REVOKED";

    identity.revokedAt =
      this.now();

    identity.updatedAt =
      identity.revokedAt;

    await this.requireStore()
      .update(identity);

    const sessions =
      await this.requireStore()
        .listSessions(
          identity.id
        );

    for (
      const session of sessions
    ) {
      if (
        session.status ===
        "ACTIVE"
      ) {
        session.status =
          "REVOKED";

        session.revokedAt =
          this.now();

        await this.requireStore()
          .updateSession(
            session
          );
      }
    }

    await this.publish(
      "identity.revoked",
      identity.id,
      undefined,
      {
        revokedSessions:
          sessions.filter(
            (session) =>
              session.status ===
              "REVOKED"
          ).length,
      }
    );

    await this.recordAudit(
      "identity.revoke",
      identity.id,
      "SUCCESS"
    );

    return identity;
  }

  /* ==========================================================
   * CREATE SESSION
   * ==========================================================
   */

  async createSession(
    identityId: string,
    context: SovereignIdentityContext,
    options?: {
      ttlSeconds?: number;
      deviceId?: string;
      ipHash?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignIdentitySession> {
    const identity =
      await this.requireIdentity(
        identityId
      );

    this.requireAccess(
      "CREATE_SESSION",
      context,
      identity
    );

    if (
      identity.status !==
      "ACTIVE"
    ) {
      throw new Error(
        "Sessions can only be created for active identities."
      );
    }

    const ttlSeconds =
      Math.min(
        Math.max(
          options?.ttlSeconds ??
            3600,
          60
        ),
        2592000
      );

    const now =
      new Date();

    const session:
      SovereignIdentitySession = {
      id:
        this.createId(
          "SESSION"
        ),

      identityId,

      status:
        "ACTIVE",

      createdAt:
        now.toISOString(),

      lastSeenAt:
        now.toISOString(),

      expiresAt:
        new Date(
          now.getTime() +
            ttlSeconds * 1000
        ).toISOString(),

      deviceId:
        options?.deviceId,

      ipHash:
        options?.ipHash,

      metadata:
        options?.metadata,
    };

    await this.requireStore()
      .createSession(
        session
      );

    await this.publish(
      "identity.session.created",
      identityId,
      session.id,
      {
        expiresAt:
          session.expiresAt,
      }
    );

    await this.recordAudit(
      "identity.session.create",
      session.id,
      "SUCCESS",
      {
        identityId,
      }
    );

    return session;
  }

  /* ==========================================================
   * VALIDATE SESSION
   * ==========================================================
   */

  async validateSession(
    sessionId: string
  ): Promise<boolean> {
    const session =
      await this.requireStore()
        .getSession(
          sessionId
        );

    if (!session) {
      return false;
    }

    if (
      session.status !==
      "ACTIVE"
    ) {
      return false;
    }

    if (
      new Date(
        session.expiresAt
      ).getTime() <=
      Date.now()
    ) {
      session.status =
        "EXPIRED";

      await this.requireStore()
        .updateSession(
          session
        );

      return false;
    }

    const identity =
      await this.requireStore()
        .get(
          session.identityId
        );

    if (
      !identity ||
      identity.status !==
        "ACTIVE"
    ) {
      return false;
    }

    session.lastSeenAt =
      this.now();

    await this.requireStore()
      .updateSession(
        session
      );

    return true;
  }

  /* ==========================================================
   * REVOKE SESSION
   * ==========================================================
   */

  async revokeSession(
    sessionId: string,
    context: SovereignIdentityContext
  ): Promise<SovereignIdentitySession> {
    const store =
      this.requireStore();

    const session =
      await store.getSession(
        sessionId
      );

    if (!session) {
      throw new Error(
        `Identity session not found: ${sessionId}`
      );
    }

    const identity =
      await this.requireIde
