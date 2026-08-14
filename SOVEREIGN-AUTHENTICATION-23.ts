/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-AUTHENTICATION-23
 * ============================================================
 *
 * Central Sovereign Authentication Engine.
 *
 * Responsibilities:
 * - Authenticate sovereign identities.
 * - Support password, OTP, passkey, key and certificate methods.
 * - Manage authentication challenges.
 * - Enforce attempt limits and temporary lockouts.
 * - Issue authenticated session requests.
 * - Support multi-factor authentication.
 * - Preserve authentication audit events.
 *
 * AUTHENTICATION has NO sovereign authority.
 * Authentication proves identity; it does NOT grant authority.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * > IDENTITY > AUTHENTICATION
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. AUTHENTICATION METHODS
 * ============================================================
 */

export type SovereignAuthenticationMethod =
  | "PASSWORD"
  | "OTP"
  | "PASSKEY"
  | "KEY"
  | "CERTIFICATE"
  | "TOKEN"
  | "CUSTOM";

export type SovereignAuthenticationStatus =
  | "PENDING"
  | "CHALLENGE_REQUIRED"
  | "MFA_REQUIRED"
  | "AUTHENTICATED"
  | "FAILED"
  | "LOCKED"
  | "EXPIRED"
  | "REVOKED";

export type SovereignAuthenticationOperation =
  | "BEGIN"
  | "VERIFY"
  | "MFA_VERIFY"
  | "REVOKE"
  | "UNLOCK";

/* ============================================================
 * 2. AUTHENTICATION CONTEXT
 * ============================================================
 */

export interface SovereignAuthenticationContext {
  actorId?: string;

  authority?:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  policyChecked: boolean;

  securityChecked: boolean;

  deviceId?: string;

  ipHash?: string;

  userAgentHash?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. AUTHENTICATION REQUEST
 * ============================================================
 */

export interface SovereignAuthenticationRequest {
  identityId: string;

  method: SovereignAuthenticationMethod;

  credentialId?: string;

  requireMfa?: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. CHALLENGE
 * ============================================================
 */

export interface SovereignAuthenticationChallenge {
  id: string;

  authenticationId: string;

  identityId: string;

  method: SovereignAuthenticationMethod;

  status:
    | "PENDING"
    | "VERIFIED"
    | "FAILED"
    | "EXPIRED"
    | "REVOKED";

  attempts: number;

  maxAttempts: number;

  createdAt: string;

  expiresAt: string;

  verifiedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. AUTHENTICATION RECORD
 * ============================================================
 */

export interface SovereignAuthenticationRecord {
  id: string;

  identityId: string;

  method: SovereignAuthenticationMethod;

  status: SovereignAuthenticationStatus;

  credentialId?: string;

  challengeId?: string;

  mfaRequired: boolean;

  mfaVerified: boolean;

  attempts: number;

  maxAttempts: number;

  createdAt: string;

  updatedAt: string;

  expiresAt: string;

  authenticatedAt?: string;

  failedAt?: string;

  lockedUntil?: string;

  revokedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. VERIFICATION INPUT
 * ============================================================
 */

export interface SovereignAuthenticationVerification {
  secret?: string;

  otp?: string;

  signature?: string;

  token?: string;

  certificate?: string;

  passkeyResponse?: unknown;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. IDENTITY BRIDGE
 * ============================================================
 */

export interface SovereignAuthenticationIdentityBridge {
  identityExists(
    identityId: string
  ): Promise<boolean>;

  identityActive(
    identityId: string
  ): Promise<boolean>;

  credentialEnabled(
    identityId: string,
    credentialId: string | undefined,
    method: SovereignAuthenticationMethod
  ): Promise<boolean>;

  createAuthenticatedSession(
    identityId: string,
    options?: {
      deviceId?: string;
      ipHash?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{
    sessionId: string;
    expiresAt: string;
  }>;
}

/* ============================================================
 * 8. CREDENTIAL VERIFIER
 * ============================================================
 */

export interface SovereignCredentialVerifier {
  verify(
    identityId: string,
    method: SovereignAuthenticationMethod,
    credentialId: string | undefined,
    verification: SovereignAuthenticationVerification
  ): Promise<{
    valid: boolean;
    reason?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 9. CHALLENGE PROVIDER
 * ============================================================
 */

export interface SovereignAuthenticationChallengeProvider {
  create(
    identityId: string,
    method: SovereignAuthenticationMethod,
    authenticationId: string
  ): Promise<{
    challengeId?: string;
    expiresInSeconds?: number;
    metadata?: Record<string, unknown>;
  }>;

  verify?(
    challenge: SovereignAuthenticationChallenge,
    verification: SovereignAuthenticationVerification
  ): Promise<boolean>;
}

/* ============================================================
 * 10. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignAuthenticationAccessValidator {
  validate(
    operation: SovereignAuthenticationOperation,
    context: SovereignAuthenticationContext,
    authentication?: SovereignAuthenticationRecord
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 11. STORE
 * ============================================================
 */

export interface SovereignAuthenticationStore {
  create(
    authentication: SovereignAuthenticationRecord
  ): Promise<void>;

  update(
    authentication: SovereignAuthenticationRecord
  ): Promise<void>;

  get(
    authenticationId: string
  ): Promise<SovereignAuthenticationRecord | undefined>;

  createChallenge(
    challenge: SovereignAuthenticationChallenge
  ): Promise<void>;

  updateChallenge(
    challenge: SovereignAuthenticationChallenge
  ): Promise<void>;

  getChallenge(
    challengeId: string
  ): Promise<SovereignAuthenticationChallenge | undefined>;

  recentFailures(
    identityId: string,
    since: string
  ): Promise<number>;
}

/* ============================================================
 * 12. EVENT BUS
 * ============================================================
 */

export interface SovereignAuthenticationEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    authenticationId?: string;

    identityId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 13. AUDIT
 * ============================================================
 */

export interface SovereignAuthenticationAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 14. AUTHENTICATION ENGINE
 * ============================================================
 */

export class SovereignAuthenticationEngine {
  public readonly id =
    "SOVEREIGN-AUTHENTICATION-23";

  public readonly version =
    "1.0.0";

  private store?: SovereignAuthenticationStore;

  private identityBridge?:
    SovereignAuthenticationIdentityBridge;

  private verifier?: SovereignCredentialVerifier;

  private challengeProvider?:
    SovereignAuthenticationChallengeProvider;

  private accessValidator?:
    SovereignAuthenticationAccessValidator;

  private eventBus?:
    SovereignAuthenticationEventBus;

  private audit?: SovereignAuthenticationAudit;

  private readonly authenticationTtlSeconds = 300;

  private readonly maxAttempts = 5;

  private readonly lockoutSeconds = 900;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(store: SovereignAuthenticationStore): void {
    this.store = store;
  }

  setIdentityBridge(
    bridge: SovereignAuthenticationIdentityBridge
  ): void {
    this.identityBridge = bridge;
  }

  setCredentialVerifier(
    verifier: SovereignCredentialVerifier
  ): void {
    this.verifier = verifier;
  }

  setChallengeProvider(
    provider: SovereignAuthenticationChallengeProvider
  ): void {
    this.challengeProvider = provider;
  }

  setAccessValidator(
    validator: SovereignAuthenticationAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignAuthenticationEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignAuthenticationAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * BEGIN AUTHENTICATION
   * ==========================================================
   */

  async begin(
    request: SovereignAuthenticationRequest,
    context: SovereignAuthenticationContext
  ): Promise<SovereignAuthenticationRecord> {
    this.requireAccess("BEGIN", context);

    const store = this.requireStore();
    const identity = this.requireIdentityBridge();

    if (
      !(await identity.identityExists(request.identityId))
    ) {
      throw new Error("Authentication identity not found.");
    }

    if (
      !(await identity.identityActive(request.identityId))
    ) {
      throw new Error("Authentication identity is not active.");
    }

    if (
      !(await identity.credentialEnabled(
        request.identityId,
        request.credentialId,
        request.method
      ))
    ) {
      throw new Error(
        "Authentication credential is unavailable or disabled."
      );
    }

    const since = new Date(
      Date.now() - this.lockoutSeconds * 1000
    ).toISOString();

    const recentFailures =
      await store.recentFailures(
        request.identityId,
        since
      );

    const now = new Date();

    const authentication:
      SovereignAuthenticationRecord = {
      id: this.createId("AUTH"),

      identityId: request.identityId,

      method: request.method,

      status:
        recentFailures >= this.maxAttempts
          ? "LOCKED"
          : "PENDING",

      credentialId: request.credentialId,

      mfaRequired:
        request.requireMfa ?? false,

      mfaVerified: false,

      attempts: 0,

      maxAttempts: this.maxAttempts,

      createdAt: now.toISOString(),

      updatedAt: now.toISOString(),

      expiresAt: new Date(
        now.getTime() +
          this.authenticationTtlSeconds * 1000
      ).toISOString(),

      lockedUntil:
        recentFailures >= this.maxAttempts
          ? new Date(
              now.getTime() +
                this.lockoutSeconds * 1000
            ).toISOString()
          : undefined,

      metadata: request.metadata,
    };

    await store.create(authentication);

    if (authentication.status === "LOCKED") {
      await this.publish(
        "authentication.locked",
        authentication,
        {
          lockedUntil: authentication.lockedUntil,
        }
      );

      await this.recordAudit(
        "authentication.begin",
        authentication.id,
        "DENIED",
        {
          identityId: request.identityId,
          reason: "TOO_MANY_FAILURES",
        }
      );

      return authentication;
    }

    if (this.challengeProvider) {
      const challengeResult =
        await this.challengeProvider.create(
          request.identityId,
          request.method,
          authentication.id
        );

      const challenge:
        SovereignAuthenticationChallenge = {
        id:
          challengeResult.challengeId ??
          this.createId("AUTH-CHALLENGE"),

        authenticationId: authentication.id,

        identityId: request.identityId,

        method: request.method,

        status: "PENDING",

        attempts: 0,

        maxAttempts: this.maxAttempts,

        createdAt: now.toISOString(),

        expiresAt: new Date(
          now.getTime() +
            (challengeResult.expiresInSeconds ?? 300) *
              1000
        ).toISOString(),

        metadata: challengeResult.metadata,
      };

      authentication.challengeId = challenge.id;
      authentication.status = "CHALLENGE_REQUIRED";
      authentication.updatedAt = this.now();

      await store.createChallenge(challenge);
      await store.update(authentication);
    }

    await this.publish(
      "authentication.started",
      authentication,
      {
        method: request.method,
        challengeRequired:
          authentication.status ===
          "CHALLENGE_REQUIRED",
      }
    );

    await this.recordAudit(
      "authentication.begin",
      authentication.id,
      "SUCCESS",
      {
        identityId: request.identityId,
        method: request.method,
      }
    );

    return authentication;
  }

  /* ==========================================================
   * VERIFY
   * ==========================================================
   */

  async verify(
    authenticationId: string,
    verification: SovereignAuthenticationVerification,
    context: SovereignAuthenticationContext
  ): Promise<{
    authentication: SovereignAuthenticationRecord;
    sessionId?: string;
    sessionExpiresAt?: string;
  }> {
    const authentication =
      await this.requireAuthentication(
        authenticationId
      );

    this.requireAccess(
      "VERIFY",
      context,
      authentication
    );

    if (this.isExpired(authentication.expiresAt)) {
      authentication.status = "EXPIRED";
      authentication.updatedAt = this.now();

      await this.requireStore().update(authentication);

      return { authentication };
    }

    if (authentication.status === "LOCKED") {
      if (
        authentication.lockedUntil &&
        !this.isExpired(authentication.lockedUntil)
      ) {
        throw new Error(
          "Authentication is temporarily locked."
        );
      }

      authentication.status = "PENDING";
      authentication.lockedUntil = undefined;
    }

    if (
      authentication.status === "REVOKED" ||
      authentication.status === "AUTHENTICATED"
    ) {
      return { authentication };
    }

    authentication.attempts += 1;
    authentication.updatedAt = this.now();

    let valid = false;

    if (authentication.challengeId) {
      const challenge =
        await this.requireChallenge(
          authentication.challengeId
        );

      if (this.isExpired(challenge.expiresAt)) {
        challenge.status = "EXPIRED";
        authentication.status = "EXPIRED";

        await this.requireStore()
          .updateChallenge(challenge);

        await this.requireStore()
          .update(authentication);

        return { authentication };
      }

      challenge.attempts += 1;

      if (
        this.challengeProvider?.verify
      ) {
        valid =
          await this.challengeProvider.verify(
            challenge,
            verification
          );
      } else {
        valid =
          await this.verifyCredential(
            authentication,
            verification
          );
      }

      challenge.status =
        valid ? "VERIFIED" : "FAILED";

      if (valid) {
        challenge.verifiedAt = this.now();
      }

      await this.requireStore()
        .updateChallenge(challenge);
    } else {
      valid =
        await this.verifyCredential(
          authentication,
          verification
        );
    }

    if (!valid) {
      await this.authenticationFailure(
        authentication,
        context
      );

      return { authentication };
    }

    if (
      authentication.mfaRequired &&
      !authentication.mfaVerified
    ) {
      authentication.status = "MFA_REQUIRED";
      authentication.updatedAt = this.now();

      await this.requireStore()
        .update(authentication);

      await this.publish(
        "authentication.mfa.required",
        authentication,
        {}
      );

      return { authentication };
    }

    return this.completeAuthentication(
      authentication,
      context
    );
  }

  /* ==========================================================
   * VERIFY MFA
   * ==========================================================
   */

  async verifyMfa(
    authenticationId: string,
    verification: SovereignAuthenticationVerification,
    context: SovereignAuthenticationContext
  ): Promise<{
    authentication: SovereignAuthenticationRecord;
    sessionId?: string;
    sessionExpiresAt?: string;
  }> {
    const authentication =
      await this.requireAuthentication(
        authenticationId
      );

    this.requireAccess(
      "MFA_VERIFY",
      context,
      authentication
    );

    if (
      authentication.status !== "MFA_REQUIRED"
    ) {
      throw new Error(
        "Authentication is not waiting for MFA."
      );
    }

    if (this.isExpired(authentication.expiresAt)) {
      authentication.status = "EXPIRED";
      authentication.updatedAt = this.now();

      await this.requireStore()
        .update(authentication);

      return { authentication };
    }

    const valid =
      await this.verifyCredential(
        authentication,
        verification
      );

    if (!valid) {
      authentication.attempts += 1;

      await this.authenticationFailure(
        authentication,
        context
      );

      return { authentication };
    }

    authentication.mfaVerified = true;

    return this.completeAuthentication(
      authentication,
      context
    );
  }

  /* ==========================================================
   * COMPLETE AUTHENTICATION
   * ==========================================================
   */

  private async completeAuthentication(
    authentication: SovereignAuthenticationRecord,
    context: SovereignAuthenticationContext
  ): Promise<{
    authentication: SovereignAuthenticationRecord;
    sessionId: string;
    sessionExpiresAt: string;
  }> {
    const identity =
      this.requireIdentityBridge();

    authentication.status = "AUTHENTICATED";
    authentication.authenticatedAt = this.now();
    authentication.updatedAt =
      authentication.authenticatedAt;

    await this.requireStore()
      .update(authentication);

    const session =
      await identity.createAuthenticatedSession(
        authentication.identityId,
        {
          deviceId: context.deviceId,
          ipHash: context.ipHash,
          metadata: {
            authenticationId:
              authentication.id,
            method:
              authentication.method,
          },
        }
      );

    await this.publish(
      "authentication.succeeded",
      authentication,
      {
        sessionId: session.sessionId,
      }
    );

    await this.recordAudit(
      "authentication.verify",
      authentication.id,
      "SUCCESS",
      {
        identityId:
          authentication.identityId,
        method:
          authentication.method,
      }
    );

    return {
      authentication,
      sessionId: session.sessionId,
      sessionExpiresAt: session.expiresAt,
    };
  }

  /* ==================================
