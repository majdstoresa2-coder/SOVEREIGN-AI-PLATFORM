/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-BUILD-17
 * ============================================================
 *
 * Purpose:
 * Sovereign Build Engine.
 *
 * Responsibilities:
 * - Create controlled build requests.
 * - Validate build inputs.
 * - Execute build pipelines.
 * - Track artifacts and manifests.
 * - Verify build integrity.
 * - Preserve reproducibility metadata.
 * - Integrate with Security, Jobs, Events and Audit.
 *
 * BUILD has NO sovereign authority.
 * BUILD cannot publish or deploy by itself.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY > BUILD
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. BUILD STATUS
 * ============================================================
 */

export type SovereignBuildStatus =
  | "CREATED"
  | "VALIDATING"
  | "QUEUED"
  | "BUILDING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/* ============================================================
 * 2. BUILD TYPE
 * ============================================================
 */

export type SovereignBuildType =
  | "PLATFORM"
  | "SERVICE"
  | "CAPABILITY"
  | "AGENT"
  | "GAME"
  | "WEB"
  | "API"
  | "WORKER"
  | "PACKAGE"
  | "CONTAINER"
  | "CUSTOM";

/* ============================================================
 * 3. BUILD TARGET
 * ============================================================
 */

export type SovereignBuildTarget =
  | "DEVELOPMENT"
  | "TEST"
  | "STAGING"
  | "PRODUCTION";

/* ============================================================
 * 4. BUILD PRIORITY
 * ============================================================
 */

export type SovereignBuildPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 5. BUILD SOURCE
 * ============================================================
 */

export interface SovereignBuildSource {
  repository?: string;

  branch?: string;

  commit?: string;

  directory: string;

  manifest?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. BUILD ARTIFACT
 * ============================================================
 */

export interface SovereignBuildArtifact {
  id: string;

  buildId: string;

  name: string;

  path: string;

  type: string;

  size?: number;

  checksum?: string;

  checksumAlgorithm?: "SHA256" | "SHA512";

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. BUILD ERROR
 * ============================================================
 */

export interface SovereignBuildError {
  code: string;

  message: string;

  stage: string;

  retryable: boolean;

  occurredAt: string;

  details?: Record<string, unknown>;
}

/* ============================================================
 * 8. BUILD REQUEST
 * ============================================================
 */

export interface SovereignBuildRequest {
  name: string;

  type: SovereignBuildType;

  target: SovereignBuildTarget;

  requestedBy: string;

  source: SovereignBuildSource;

  priority?: SovereignBuildPriority;

  commands?: string[];

  environment?: Record<string, string>;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. BUILD RECORD
 * ============================================================
 */

export interface SovereignBuildRecord {
  id: string;

  name: string;

  type: SovereignBuildType;

  target: SovereignBuildTarget;

  status: SovereignBuildStatus;

  priority: SovereignBuildPriority;

  requestedBy: string;

  source: SovereignBuildSource;

  commands: string[];

  environment: Record<string, string>;

  artifacts: SovereignBuildArtifact[];

  createdAt: string;

  updatedAt: string;

  startedAt?: string;

  completedAt?: string;

  durationMs?: number;

  error?: SovereignBuildError;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. BUILD CONTEXT
 * ============================================================
 */

export interface SovereignBuildContext {
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
 * 11. BUILD VALIDATOR
 * ============================================================
 */

export interface SovereignBuildValidator {
  validate(
    build: SovereignBuildRecord
  ): Promise<{
    valid: boolean;

    errors: string[];

    warnings?: string[];
  }>;
}

/* ============================================================
 * 12. BUILD EXECUTOR
 * ============================================================
 */

export interface SovereignBuildExecutor {
  execute(
    build: SovereignBuildRecord
  ): Promise<{
    success: boolean;

    artifacts?: Array<{
      name: string;

      path: string;

      type: string;

      size?: number;

      checksum?: string;

      checksumAlgorithm?: "SHA256" | "SHA512";

      metadata?: Record<string, unknown>;
    }>;

    error?: SovereignBuildError;

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 13. BUILD VERIFIER
 * ============================================================
 */

export interface SovereignBuildVerifier {
  verify(
    build: SovereignBuildRecord
  ): Promise<{
    valid: boolean;

    errors: string[];

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 14. ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignBuildAccessValidator {
  validate(
    operation:
      | "CREATE"
      | "EXECUTE"
      | "VERIFY"
      | "CANCEL",
    context: SovereignBuildContext,
    build?: SovereignBuildRecord
  ): {
    allowed: boolean;

    reason?: string;
  };
}

/* ============================================================
 * 15. EVENT BUS
 * ============================================================
 */

export interface SovereignBuildEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    buildId: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 16. AUDIT
 * ============================================================
 */

export interface SovereignBuildAudit {
  record(
    operation: string,
    buildId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 17. BUILD ENGINE
 * ============================================================
 */

export class SovereignBuildEngine {
  public readonly id =
    "SOVEREIGN-BUILD-17";

  public readonly version =
    "1.0.0";

  private builds =
    new Map<string, SovereignBuildRecord>();

  private validator?: SovereignBuildValidator;

  private executor?: SovereignBuildExecutor;

  private verifier?: SovereignBuildVerifier;

  private accessValidator?:
    SovereignBuildAccessValidator;

  private eventBus?: SovereignBuildEventBus;

  private audit?: SovereignBuildAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setValidator(
    validator: SovereignBuildValidator
  ): void {
    this.validator = validator;
  }

  setExecutor(
    executor: SovereignBuildExecutor
  ): void {
    this.executor = executor;
  }

  setVerifier(
    verifier: SovereignBuildVerifier
  ): void {
    this.verifier = verifier;
  }

  setAccessValidator(
    validator: SovereignBuildAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignBuildEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignBuildAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE BUILD
   * ==========================================================
   */

  async create(
    request: SovereignBuildRequest,
    context: SovereignBuildContext
  ): Promise<SovereignBuildRecord> {
    this.requireAccess(
      "CREATE",
      context
    );

    this.validateRequest(request);

    const now = this.now();

    const build: SovereignBuildRecord = {
      id: this.createId("BUILD"),

      name: request.name,

      type: request.type,

      target: request.target,

      status: "CREATED",

      priority:
        request.priority ?? "NORMAL",

      requestedBy:
        request.requestedBy,

      source: {
        ...request.source,
      },

      commands: [
        ...(request.commands ?? []),
      ],

      environment: {
        ...(request.environment ?? {}),
      },

      artifacts: [],

      createdAt: now,

      updatedAt: now,

      metadata:
        request.metadata,
    };

    this.builds.set(
      build.id,
      build
    );

    await this.publish(
      "build.created",
      build,
      {
        name: build.name,
        type: build.type,
        target: build.target,
      }
    );

    await this.recordAudit(
      "build.create",
      build.id,
      "SUCCESS"
    );

    return build;
  }

  /* ==========================================================
   * EXECUTE BUILD
   * ==========================================================
   */

  async execute(
    buildId: string,
    context: SovereignBuildContext
  ): Promise<SovereignBuildRecord> {
    const build =
      this.requireBuild(buildId);

    this.requireAccess(
      "EXECUTE",
      context,
      build
    );

    if (!this.executor) {
      throw new Error(
        "Sovereign Build executor is not configured."
      );
    }

    build.status = "VALIDATING";
    build.updatedAt = this.now();

    await this.publish(
      "build.validation.started",
      build,
      {}
    );

    if (this.validator) {
      const validation =
        await this.validator.validate(build);

      if (!validation.valid) {
        build.status = "FAILED";

        build.error = {
          code:
            "BUILD_VALIDATION_FAILED",

          message:
            validation.errors.join(" | "),

          stage:
            "VALIDATION",

          retryable:
            false,

          occurredAt:
            this.now(),

          details: {
            errors:
              validation.errors,

            warnings:
              validation.warnings ?? [],
          },
        };

        build.completedAt =
          this.now();

        build.updatedAt =
          build.completedAt;

        await this.publish(
          "build.validation.failed",
          build,
          {
            errors:
              validation.errors,
          }
        );

        await this.recordAudit(
          "build.validate",
          build.id,
          "FAILED"
        );

        return build;
      }
    }

    build.status = "BUILDING";

    build.startedAt =
      this.now();

    build.updatedAt =
      build.startedAt;

    await this.publish(
      "build.started",
      build,
      {
        target:
          build.target,
      }
    );

    const started =
      Date.now();

    try {
      const result =
        await this.executor.execute(
          build
        );

      if (!result.success) {
        build.status = "FAILED";

        build.error =
          result.error ?? {
            code:
              "BUILD_EXECUTION_FAILED",

            message:
              "Build execution failed.",

            stage:
              "BUILD",

            retryable:
              true,

            occurredAt:
              this.now(),
          };

        build.completedAt =
          this.now();

        build.durationMs =
          Date.now() - started;

        build.updatedAt =
          build.completedAt;

        await this.publish(
          "build.failed",
          build,
          {
            error:
              build.error.code,
          }
        );

        await this.recordAudit(
          "build.execute",
          build.id,
          "FAILED"
        );

        return build;
      }

      build.artifacts =
        (result.artifacts ?? []).map(
          (artifact) => ({
            id:
              this.createId(
                "ARTIFACT"
              ),

            buildId:
              build.id,

            name:
              artifact.name,

            path:
              artifact.path,

            type:
              artifact.type,

            size:
              artifact.size,

            checksum:
              artifact.checksum,

            checksumAlgorithm:
              artifact.checksumAlgorithm,

            createdAt:
              this.now(),

            metadata:
              artifact.metadata,
          })
        );

      build.status =
        "VERIFYING";

      build.updatedAt =
        this.now();

      await this.publish(
        "build.verification.started",
        build,
        {
          artifactCount:
            build.artifacts.length,
        }
      );

      if (this.verifier) {
        const verification =
          await this.verifier.verify(
            build
          );

        if (!verification.valid) {
          build.status =
            "FAILED";

          build.error = {
            code:
              "BUILD_VERIFICATION_FAILED",

            message:
              verification.errors.join(
                " | "
              ),

            stage:
              "VERIFY",

            retryable:
              false,

            occurredAt:
              this.now(),

            details:
              verification.metadata,
          };

          build.completedAt =
            this.now();

          build.durationMs =
            Date.now() - started;

          build.updatedAt =
            build.completedAt;

          await this.publish(
            "build.verification.failed",
            build,
            {
              errors:
                verification.errors,
            }
          );

          await this.recordAudit(
            "build.verify",
            build.id,
            "FAILED"
          );

          return build;
        }
      }

      build.status =
        "COMPLETED";

      build.error =
        undefined;

      build.completedAt =
        this.now();

      build.durationMs =
        Date.now() - started;

      build.updatedAt =
        build.completedAt;

      await this.publish(
        "build.completed",
        build,
        {
          artifactCount:
            build.artifacts.length,

          durationMs:
            build.durationMs,
        }
      );

      await this.recordAudit(
        "build.execute",
        build.id,
        "SUCCESS"
      );

      return build;
    } catch (error) {
      build.status =
        "FAILED";

      build.error = {
        code:
          "BUILD_ENGINE_ERROR",

        message:
          error instanceof Error
            ? error.message
            : String(error),

        stage:
          "BUILD",

        retryable:
          true,

        occurredAt:
          this.now(),
      };

      build.completedAt =
        this.now();

      build.durationMs =
        Date.now() - started;

      build.updatedAt =
        build.completedAt;

      await this.publish(
        "build.failed",
        build,
        {
          error:
            build.error.message,
        }
      );

      await this.recordAudit(
        "build.execute",
        build.id,
        "FAILED"
      );

      return build;
    }
  }

  /* ==========================================================
   * CANCEL
   * ==========================================================
   */

  async cancel(
    buildId: string,
    context: SovereignBuildContext
  ): Promise<SovereignBuildRecord> {
    const build =
      this.requireBuild(buildId);

    this.requireAccess(
      "CANCEL",
      context,
      build
    );

    if (
      build.status === "COMPLETED" ||
      build.status === "FAILED" ||
      build.status === "CANCELLED"
    ) {
      return build;
    }

    build.status =
      "CANCELLED";

    build.completedAt =
      this.now();

    build.updatedAt =
      build.completedAt;

    await this.publish(
      "build.cancelled",
      build,
      {
        actorId:
          context.actorId,
      }
    );

    await this.recordAudit(
      "build.cancel",
      build.id,
      "SUCCESS"
    );

    return build;
  }

  /* ==========================================================
   * GET BUILD
   * ==========================================================
   */

  get(
    buildId: string
  ): SovereignBuildRecord | undefined {
    return this.builds.get(buildId);
  }

  /* ==========================================================
   * LIST BUILDS
   * ==========================================================
   */

  list(
    status?: SovereignBuildStatus
  ): SovereignBuildRecord[] {
    const builds =
      Array.from(
        this.builds.values()
      );

    if (!status) {
      return builds;
    }

    return builds.filter(
      (build) =>
        build.status === status
    );
  }

  /* ==========================================================
   * ARTIFACTS
   * ==========================================================
   */

  getArtifacts(
    buildId: string
  ): SovereignBuildArtifact[] {
    return [
      ...this.requireBuild(buildId)
        .artifacts,
    ];
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;
    created: number;
    validating: number;
    building: number;
    verifying: number;
    completed: number;
    failed: number;
    cancelled: number;
    artifacts: number;
  } {
    const builds = this.list();

    return {
      total:
        builds.length,

      created:
        builds.filter(
          (build) =>
            build.status === "CREATED"
        ).length,

      validating:
        builds.filter(
          (build) =>
            build.status ===
            "VALIDATING"
        ).length,

      building:
        builds.filter(
          (build) =>
            build.status ===
            "BUILDING"
        ).length,

      verifying:
        builds.filter(
          (build) =>
            build.status ===
            "VERIFYING"
        ).length,

      completed:
        builds.filter(
          (build) =>
            build.status ===
            "COMPLETED"
        ).length,

      failed:
        builds.filter(
          (build) =>
            build.status === "FAILED"
        ).length,

      cancelled:
        builds.filter(
          (build) =>
            build.status ===
            "CANCELLED"
        ).length,

      artifacts:
        builds.reduce(
          (total, build) =>
            total +
            build.artifacts.length,
          0
        ),
    };
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "CREATE"
      | "EXECUTE"
      | "VERIFY"
      | "CANCEL",
    context: SovereignBuildContext,
    build?: SovereignBuildRecord
  ): void {
    if (!context.policyChecked) {
      throw new Error(
        "Build operation blocked: policy check required."
      );
    }

    if (!context.permissionChecke
