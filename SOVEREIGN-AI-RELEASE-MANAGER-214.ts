// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-RELEASE-MANAGER-214.ts
// Final Closure 09/15
// Autonomous Release / Deploy / Verify / Rollback Manager
// ============================================================

export type SovereignReleaseTarget =
  | "PLATFORM"
  | "GAME"
  | "ADMIN"
  | "SERVICE";

export type SovereignReleaseEnvironment =
  | "DEVELOPMENT"
  | "STAGING"
  | "PRODUCTION";

export type SovereignReleaseStatus =
  | "CREATED"
  | "CHECKING"
  | "PACKAGING"
  | "DEPLOYING"
  | "VERIFYING"
  | "LIVE"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "BLOCKED"
  | "FAILED";

export interface SovereignReleaseRequest {
  id: string;
  commandId: string;
  projectId: string;

  target: SovereignReleaseTarget;

  environment: SovereignReleaseEnvironment;

  artifactPath: string;

  releaseAllowed: boolean;

  autonomous: boolean;

  version?: string;

  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignReleasePackage {
  id: string;
  projectId: string;

  version: string;

  artifactPath: string;

  checksum?: string;

  manifestPath?: string;

  createdAt: number;
}

export interface SovereignDeploymentResult {
  success: boolean;

  deploymentId?: string;

  runtimeTarget?: string;

  publicTarget?: string;

  previousReleaseId?: string;

  output?: unknown;

  errors: string[];
}

export interface SovereignReleaseVerification {
  success: boolean;

  reachable: boolean;

  healthy: boolean;

  functional: boolean;

  checks: Record<string, boolean>;

  errors: string[];
}

export interface SovereignRollbackResult {
  success: boolean;

  restoredReleaseId?: string;

  errors: string[];
}

export interface SovereignReleaseResult {
  id: string;

  requestId: string;

  projectId: string;

  target: SovereignReleaseTarget;

  environment: SovereignReleaseEnvironment;

  status: SovereignReleaseStatus;

  package?: SovereignReleasePackage;

  deployment?: SovereignDeploymentResult;

  verification?: SovereignReleaseVerification;

  rollback?: SovereignRollbackResult;

  liveTarget?: string;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAIReleaseManagerAdapter {
  preflight(
    request: SovereignReleaseRequest
  ): Promise<{
    success: boolean;
    errors: string[];
  }>;

  packageRelease(
    request: SovereignReleaseRequest
  ): Promise<SovereignReleasePackage>;

  deploy(
    request: SovereignReleaseRequest,
    releasePackage: SovereignReleasePackage
  ): Promise<SovereignDeploymentResult>;

  verify(
    request: SovereignReleaseRequest,
    deployment: SovereignDeploymentResult
  ): Promise<SovereignReleaseVerification>;

  rollback?(
    request: SovereignReleaseRequest,
    deployment: SovereignDeploymentResult
  ): Promise<SovereignRollbackResult>;

  persistResult?(
    result: SovereignReleaseResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    projectId: string;
    requestId: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIReleaseManager {
  constructor(
    private readonly adapter:
      SovereignAIReleaseManagerAdapter
  ) {}

  public async release(
    input: SovereignReleaseRequest
  ): Promise<SovereignReleaseResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const result: SovereignReleaseResult = {
      id: this.createId("release"),
      requestId: request.id,
      projectId: request.projectId,
      target: request.target,
      environment: request.environment,
      status: "CREATED",
      startedAt: Date.now()
    };

    try {
      if (!request.releaseAllowed) {
        result.status = "BLOCKED";
        result.error =
          "Release blocked because sovereign quality approval was not granted.";
        result.completedAt = Date.now();

        await this.finish(result);

        return this.cloneResult(result);
      }

      await this.transition(
        result,
        "CHECKING"
      );

      const preflight =
        await this.adapter.preflight(
          request
        );

      if (!preflight.success) {
        result.status = "BLOCKED";
        result.error =
          `Release preflight failed: ${preflight.errors.join("; ")}`;
        result.completedAt = Date.now();

        await this.finish(result);

        return this.cloneResult(result);
      }

      await this.transition(
        result,
        "PACKAGING"
      );

      const releasePackage =
        await this.adapter.packageRelease(
          request
        );

      this.validatePackage(
        releasePackage,
        request.projectId
      );

      result.package = {
        ...releasePackage
      };

      await this.transition(
        result,
        "DEPLOYING"
      );

      const deployment =
        await this.adapter.deploy(
          request,
          releasePackage
        );

      result.deployment =
        this.cloneDeployment(
          deployment
        );

      if (!deployment.success) {
        throw new Error(
          `Deployment failed: ${deployment.errors.join("; ")}`
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      const verification =
        await this.adapter.verify(
          request,
          deployment
        );

      result.verification =
        this.cloneVerification(
          verification
        );

      if (
        !verification.success ||
        !verification.reachable ||
        !verification.healthy ||
        !verification.functional
      ) {
        if (
          this.adapter.rollback &&
          deployment.previousReleaseId
        ) {
          await this.transition(
            result,
            "ROLLING_BACK"
          );

          const rollback =
            await this.adapter.rollback(
              request,
              deployment
            );

          result.rollback = {
            ...rollback,
            errors: [
              ...rollback.errors
            ]
          };

          if (!rollback.success) {
            throw new Error(
              `Release verification failed and rollback failed: ${rollback.errors.join("; ")}`
            );
          }

          result.status =
            "ROLLED_BACK";

          result.error =
            `New release failed verification and previous release was restored: ${verification.errors.join("; ")}`;

          result.completedAt =
            Date.now();

          await this.finish(result);

          return this.cloneResult(
            result
          );
        }

        throw new Error(
          `Release verification failed: ${verification.errors.join("; ")}`
        );
      }

      result.liveTarget =
        deployment.publicTarget ||
        deployment.runtimeTarget;

      result.status = "LIVE";

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(result);
    } catch (error) {
      result.status = "FAILED";

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(result);
    }
  }

  private validateRequest(
    request: SovereignReleaseRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Release request id is required."
      );
    }

    if (!request.commandId.trim()) {
      throw new Error(
        "Release command id is required."
      );
    }

    if (!request.projectId.trim()) {
      throw new Error(
        "Release project id is required."
      );
    }

    if (!request.artifactPath.trim()) {
      throw new Error(
        "Release artifact path is required."
      );
    }

    if (
      request.environment ===
        "PRODUCTION" &&
      !request.releaseAllowed
    ) {
      throw new Error(
        "Production release requires sovereign quality approval."
      );
    }
  }

  private validatePackage(
    releasePackage:
      SovereignReleasePackage,
    projectId: string
  ): void {
    if (!releasePackage.id.trim()) {
      throw new Error(
        "Release package id is required."
      );
    }

    if (
      releasePackage.projectId !==
      projectId
    ) {
      throw new Error(
        "Release package project id mismatch."
      );
    }

    if (
      !releasePackage.artifactPath.trim()
    ) {
      throw new Error(
        "Release package artifact path is required."
      );
    }

    if (!releasePackage.version.trim()) {
      throw new Error(
        "Release package version is required."
      );
    }
  }

  private normalizeRequest(
    input: SovereignReleaseRequest
  ): SovereignReleaseRequest {
    return {
      ...input,

      projectId:
        input.projectId.trim(),

      commandId:
        input.commandId.trim(),

      artifactPath:
        input.artifactPath.trim(),

      version:
        input.version?.trim() ||
        this.createVersion(),

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private async transition(
    result: SovereignReleaseResult,
    status: SovereignReleaseStatus
  ): Promise<void> {
    result.status = status;

    await this.persist(result);

    await this.record(
      `SOVEREIGN_RELEASE_${status}`,
      result
    );
  }

  private async finish(
    result: SovereignReleaseResult
  ): Promise<void> {
    await this.persist(result);

    await this.record(
      `SOVEREIGN_RELEASE_${result.status}`,
      result,
      {
        environment:
          result.environment,

        target:
          result.target,

        liveTarget:
          result.liveTarget,

        error:
          result.error
      }
    );
  }

  private async persist(
    result: SovereignReleaseResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
    ) {
      await this.adapter.persistResult(
        this.cloneResult(result)
      );
    }
  }

  private async record(
    type: string,
    result: SovereignReleaseResult,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,
        projectId:
          result.projectId,
        requestId:
          result.requestId,
        timestamp:
          Date.now(),
        data
      });
    }
  }

  private cloneDeployment(
    deployment:
      SovereignDeploymentResult
  ): SovereignDeploymentResult {
    return {
      ...deployment,
      errors: [
        ...deployment.errors
      ]
    };
  }

  private cloneVerification(
    verification:
      SovereignReleaseVerification
  ): SovereignReleaseVerification {
    return {
      ...verification,

      checks: {
        ...verification.checks
      },

      errors: [
        ...verification.errors
      ]
    };
  }

  private cloneResult(
    result: SovereignReleaseResult
  ): SovereignReleaseResult {
    return {
      ...result,

      package:
        result.package
          ? {
              ...result.package
            }
          : undefined,

      deployment:
        result.deployment
          ? this.cloneDeployment(
              result.deployment
            )
          : undefined,

      verification:
        result.verification
          ? this.cloneVerification(
              result.verification
            )
          : undefined,

      rollback:
        result.rollback
          ? {
              ...result.rollback,
              errors: [
                ...result.rollback.errors
              ]
            }
          : undefined
    };
  }

  private createVersion(): string {
    const date =
      new Date();

    return [
      date.getUTCFullYear(),
      String(
        date.getUTCMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getUTCDate()
      ).padStart(2, "0"),
      String(
        date.getUTCHours()
      ).padStart(2, "0"),
      String(
        date.getUTCMinutes()
      ).padStart(2, "0"),
      String(
        date.getUTCSeconds()
      ).padStart(2, "0")
    ].join(".");
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIReleaseManager;
