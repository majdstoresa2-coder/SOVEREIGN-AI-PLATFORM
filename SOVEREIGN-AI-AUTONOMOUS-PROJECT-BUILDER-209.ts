// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts
// Final Closure 04/15
// Autonomous Project Builder
// ============================================================

export type SovereignProjectType =
  | "PLATFORM"
  | "GAME"
  | "ADMIN"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "SERVICE"
  | "GENERAL";

export type SovereignProjectStatus =
  | "CREATED"
  | "ANALYZING"
  | "PLANNING"
  | "GENERATING"
  | "TESTING"
  | "REPAIRING"
  | "BUILDING"
  | "VERIFYING"
  | "READY"
  | "FAILED";

export interface SovereignProjectRequest {
  id: string;
  commandId: string;
  instruction: string;
  projectId?: string;
  type: SovereignProjectType;
  constraints: string[];
  autonomous: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface SovereignProjectFile {
  path: string;
  purpose: string;
  required: boolean;
  generated: boolean;
}

export interface SovereignProjectBlueprint {
  id: string;
  projectId: string;
  name: string;
  type: SovereignProjectType;

  objective: string;

  architecture: string[];

  files: SovereignProjectFile[];

  requirements: string[];

  acceptanceCriteria: string[];

  createdAt: number;
}

export interface SovereignGeneratedArtifact {
  path: string;
  content?: string;
  binary?: boolean;
  checksum?: string;
  createdAt: number;
}

export interface SovereignProjectValidation {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface SovereignProjectBuild {
  success: boolean;
  artifactPath?: string;
  output?: unknown;
  errors: string[];
}

export interface SovereignProjectResult {
  id: string;
  requestId: string;
  projectId: string;

  status: SovereignProjectStatus;

  blueprint?: SovereignProjectBlueprint;

  artifacts: SovereignGeneratedArtifact[];

  validation?: SovereignProjectValidation;

  build?: SovereignProjectBuild;

  repairAttempts: number;

  error?: string;

  startedAt: number;
  completedAt?: number;
}

export interface SovereignAutonomousProjectBuilderAdapter {
  inspectWorkspace(
    request: SovereignProjectRequest
  ): Promise<unknown>;

  createBlueprint(
    request: SovereignProjectRequest,
    workspace: unknown
  ): Promise<SovereignProjectBlueprint>;

  generateArtifact(
    blueprint: SovereignProjectBlueprint,
    file: SovereignProjectFile,
    existingArtifacts: SovereignGeneratedArtifact[]
  ): Promise<SovereignGeneratedArtifact>;

  writeArtifact(
    projectId: string,
    artifact: SovereignGeneratedArtifact
  ): Promise<void>;

  validateProject(
    projectId: string,
    blueprint: SovereignProjectBlueprint
  ): Promise<SovereignProjectValidation>;

  repairProject?(
    projectId: string,
    blueprint: SovereignProjectBlueprint,
    validation: SovereignProjectValidation,
    attempt: number
  ): Promise<SovereignGeneratedArtifact[]>;

  buildProject(
    projectId: string,
    blueprint: SovereignProjectBlueprint
  ): Promise<SovereignProjectBuild>;

  verifyBuild?(
    projectId: string,
    build: SovereignProjectBuild,
    blueprint: SovereignProjectBlueprint
  ): Promise<boolean>;

  persistResult?(
    result: SovereignProjectResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    projectId: string;
    requestId: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIAutonomousProjectBuilder {
  constructor(
    private readonly adapter:
      SovereignAutonomousProjectBuilderAdapter,

    private readonly maximumRepairAttempts = 3
  ) {}

  public async build(
    input: SovereignProjectRequest
  ): Promise<SovereignProjectResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const projectId =
      request.projectId ||
      this.createId(
        this.projectPrefix(
          request.type
        )
      );

    const result:
      SovereignProjectResult = {
        id: this.createId(
          "project-build"
        ),

        requestId:
          request.id,

        projectId,

        status:
          "CREATED",

        artifacts: [],

        repairAttempts: 0,

        startedAt:
          Date.now()
      };

    try {
      await this.transition(
        result,
        "ANALYZING"
      );

      const workspace =
        await this.adapter
          .inspectWorkspace(
            request
          );

      await this.transition(
        result,
        "PLANNING"
      );

      const blueprint =
        await this.adapter
          .createBlueprint(
            {
              ...request,
              projectId
            },
            workspace
          );

      this.validateBlueprint(
        blueprint,
        projectId
      );

      result.blueprint =
        this.cloneBlueprint(
          blueprint
        );

      await this.transition(
        result,
        "GENERATING"
      );

      const orderedFiles =
        [
          ...blueprint.files
        ].sort(
          (a, b) =>
            Number(b.required) -
            Number(a.required)
        );

      for (
        const file of
          orderedFiles
      ) {
        const artifact =
          await this.adapter
            .generateArtifact(
              blueprint,
              file,
              [...result.artifacts]
            );

        this.validateArtifact(
          artifact
        );

        await this.adapter
          .writeArtifact(
            projectId,
            artifact
          );

        result.artifacts.push({
          ...artifact
        });
      }

      await this.transition(
        result,
        "TESTING"
      );

      let validation =
        await this.adapter
          .validateProject(
            projectId,
            blueprint
          );

      result.validation =
        this.cloneValidation(
          validation
        );

      while (
        !validation.success &&
        result.repairAttempts <
          this.maximumRepairAttempts &&
        this.adapter.repairProject
      ) {
        result.repairAttempts += 1;

        await this.transition(
          result,
          "REPAIRING"
        );

        const repaired =
          await this.adapter
            .repairProject(
              projectId,
              blueprint,
              validation,
              result.repairAttempts
            );

        for (
          const artifact of
            repaired
        ) {
          this.validateArtifact(
            artifact
          );

          await this.adapter
            .writeArtifact(
              projectId,
              artifact
            );

          this.upsertArtifact(
            result.artifacts,
            artifact
          );
        }

        await this.transition(
          result,
          "TESTING"
        );

        validation =
          await this.adapter
            .validateProject(
              projectId,
              blueprint
            );

        result.validation =
          this.cloneValidation(
            validation
          );
      }

      if (
        !validation.success
      ) {
        throw new Error(
          `Project validation failed: ${validation.errors.join(
            "; "
          )}`
        );
      }

      await this.transition(
        result,
        "BUILDING"
      );

      const build =
        await this.adapter
          .buildProject(
            projectId,
            blueprint
          );

      result.build = {
        ...build,
        errors: [
          ...build.errors
        ]
      };

      if (!build.success) {
        throw new Error(
          `Project build failed: ${build.errors.join(
            "; "
          )}`
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      if (
        this.adapter.verifyBuild
      ) {
        const verified =
          await this.adapter
            .verifyBuild(
              projectId,
              build,
              blueprint
            );

        if (!verified) {
          throw new Error(
            "Generated project build verification failed."
          );
        }
      }

      result.status =
        "READY";

      result.completedAt =
        Date.now();

      await this.finish(
        result
      );

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.status =
        "FAILED";

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt =
        Date.now();

      await this.finish(
        result
      );

      return this.cloneResult(
        result
      );
    }
  }

  private normalizeRequest(
    input: SovereignProjectRequest
  ): SovereignProjectRequest {
    return {
      ...input,

      instruction:
        input.instruction
          .trim()
          .replace(
            /\s+/g,
            " "
          ),

      projectId:
        input.projectId
          ?.trim() ||
        undefined,

      constraints: [
        ...new Set(
          input.constraints
            .map(
              item =>
                item.trim()
            )
            .filter(Boolean)
        )
      ],

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateRequest(
    request:
      SovereignProjectRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Project request id is required."
      );
    }

    if (
      !request.commandId.trim()
    ) {
      throw new Error(
        "Command id is required."
      );
    }

    if (
      !request.instruction
    ) {
      throw new Error(
        "Project instruction is required."
      );
    }
  }

  private validateBlueprint(
    blueprint:
      SovereignProjectBlueprint,
    projectId: string
  ): void {
    if (
      !blueprint.id.trim()
    ) {
      throw new Error(
        "Blueprint id is required."
      );
    }

    if (
      blueprint.projectId !==
      projectId
    ) {
      throw new Error(
        "Blueprint project id mismatch."
      );
    }

    if (
      !blueprint.name.trim()
    ) {
      throw new Error(
        "Blueprint project name is required."
      );
    }

    if (
      !blueprint.objective.trim()
    ) {
      throw new Error(
        "Blueprint objective is required."
      );
    }

    if (
      !blueprint.files.length
    ) {
      throw new Error(
        "Blueprint contains no project files."
      );
    }

    const paths =
      new Set<string>();

    for (
      const file of
        blueprint.files
    ) {
      if (!file.path.trim()) {
        throw new Error(
          "Blueprint contains an invalid file path."
        );
      }

      if (
        paths.has(
          file.path
        )
      ) {
        throw new Error(
          `Duplicate blueprint file: ${file.path}`
        );
      }

      paths.add(
        file.path
      );
    }
  }

  private validateArtifact(
    artifact:
      SovereignGeneratedArtifact
  ): void {
    if (
      !artifact.path ||
      !artifact.path.trim()
    ) {
      throw new Error(
        "Generated artifact path is required."
      );
    }

    if (
      artifact.binary !== true &&
      artifact.content ===
        undefined
    ) {
      throw new Error(
        `Generated text artifact has no content: ${artifact.path}`
      );
    }
  }

  private upsertArtifact(
    artifacts:
      SovereignGeneratedArtifact[],
    artifact:
      SovereignGeneratedArtifact
  ): void {
    const index =
      artifacts.findIndex(
        item =>
          item.path ===
          artifact.path
      );

    if (index >= 0) {
      artifacts[index] = {
        ...artifact
      };

      return;
    }

    artifacts.push({
      ...artifact
    });
  }

  private async transition(
    result:
      SovereignProjectResult,
    status:
      SovereignProjectStatus
  ): Promise<void> {
    result.status =
      status;

    await this.record(
      `SOVEREIGN_PROJECT_${status}`,
      result
    );

    await this.persist(
      result
    );
  }

  private async finish(
    result:
      SovereignProjectResult
  ): Promise<void> {
    await this.record(
      `SOVEREIGN_PROJECT_${result.status}`,
      result,
      {
        artifacts:
          result.artifacts
            .length,

        repairAttempts:
          result.repairAttempts,

        error:
          result.error,

        completedAt:
          result.completedAt
      }
    );

    await this.persist(
      result
    );
  }

  private async persist(
    result:
      SovereignProjectResult
  ): Promise<void> {
    if (
      this.adapter
        .persistResult
    ) {
      await this.adapter
        .persistResult(
          this.cloneResult(
            result
          )
        );
    }
  }

  private async record(
    type: string,
    result:
      SovereignProjectResult,
    data?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
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

  private cloneBlueprint(
    blueprint:
      SovereignProjectBlueprint
  ): SovereignProjectBlueprint {
    return {
      ...blueprint,

      architecture: [
        ...blueprint
          .architecture
      ],

      files:
        blueprint.files.map(
          file => ({
            ...file
          })
        ),

      requirements: [
        ...blueprint
          .requirements
      ],

      acceptanceCriteria: [
        ...blueprint
          .acceptanceCriteria
      ]
    };
  }

  private cloneValidation(
    validation:
      SovereignProjectValidation
  ): SovereignProjectValidation {
    return {
      ...validation,

      errors: [
        ...validation.errors
      ],

      warnings: [
        ...validation.warnings
      ]
    };
  }

  private cloneResult(
    result:
      SovereignProjectResult
  ): SovereignProjectResult {
    return {
      ...result,

      blueprint:
        result.blueprint
          ? this.cloneBlueprint(
              result.blueprint
            )
          : undefined,

      artifacts:
        result.artifacts.map(
          artifact => ({
            ...artifact
          })
        ),

      validation:
        result.validation
          ? this.cloneValidation(
              result.validation
            )
          : undefined,

      build:
        result.build
          ? {
              ...result.build,

              errors: [
                ...result.build
                  .errors
              ]
            }
          : undefined
    };
  }

  private projectPrefix(
    type:
      SovereignProjectType
  ): string {
    return `majd-${type.toLowerCase()}`;
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIAutonomousProjectBuilder;
