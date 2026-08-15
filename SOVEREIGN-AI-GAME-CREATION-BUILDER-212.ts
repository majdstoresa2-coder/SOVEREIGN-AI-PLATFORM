// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-GAME-CREATION-BUILDER-212.ts
// Final Closure 07/15
// Autonomous Majd Game Creation Builder
// ============================================================

export type MajdGameGenre =
  | "ACTION"
  | "ADVENTURE"
  | "STRATEGY"
  | "RPG"
  | "PARKOUR"
  | "RACING"
  | "SPORTS"
  | "PUZZLE"
  | "SIMULATION"
  | "CASUAL"
  | "MULTIPLAYER"
  | "CUSTOM";

export type MajdGamePlatform =
  | "WEB"
  | "MOBILE"
  | "DESKTOP"
  | "TABLET";

export type MajdGameBuildStatus =
  | "RECEIVED"
  | "DESIGNING"
  | "PLANNING"
  | "GENERATING"
  | "INTEGRATING"
  | "TESTING"
  | "REPAIRING"
  | "BUILDING"
  | "VERIFYING"
  | "PLAYABLE"
  | "FAILED";

export interface MajdGameCreationRequest {
  id: string;
  commandId: string;
  projectId?: string;

  name: string;
  description: string;

  genre: MajdGameGenre;

  platforms: MajdGamePlatform[];

  language: string;

  multiplayer?: boolean;

  requirements: string[];

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface MajdGameSystem {
  id: string;

  name: string;

  description: string;

  required: boolean;

  dependencies: string[];
}

export interface MajdGameDesign {
  id: string;

  projectId: string;

  name: string;

  concept: string;

  gameplayLoop: string[];

  systems: MajdGameSystem[];

  scenes: string[];

  characters: string[];

  worldRequirements: string[];

  UIRequirements: string[];

  assetRequirements: string[];

  acceptanceCriteria: string[];

  createdAt: number;
}

export interface MajdGameGeneratedFile {
  path: string;

  purpose: string;

  content?: string;

  binary?: boolean;

  checksum?: string;
}

export interface MajdGameTestResult {
  success: boolean;

  playable: boolean;

  errors: string[];

  warnings: string[];

  checks: Record<string, boolean>;
}

export interface MajdGameArtifact {
  success: boolean;

  path?: string;

  launchTarget?: string;

  output?: unknown;

  errors: string[];
}

export interface MajdGameCreationResult {
  id: string;

  requestId: string;

  projectId: string;

  status: MajdGameBuildStatus;

  design?: MajdGameDesign;

  files: MajdGameGeneratedFile[];

  tests?: MajdGameTestResult;

  artifact?: MajdGameArtifact;

  repairAttempts: number;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAIGameCreationAdapter {
  inspectExistingGameWorkspace(
    request: MajdGameCreationRequest
  ): Promise<unknown>;

  designGame(
    request: MajdGameCreationRequest,
    workspace: unknown
  ): Promise<MajdGameDesign>;

  generateGameFile(
    request: MajdGameCreationRequest,
    design: MajdGameDesign,
    system: MajdGameSystem,
    existingFiles: MajdGameGeneratedFile[]
  ): Promise<MajdGameGeneratedFile[]>;

  writeGameFile(
    projectId: string,
    file: MajdGameGeneratedFile
  ): Promise<void>;

  integrateGame(
    request: MajdGameCreationRequest,
    design: MajdGameDesign,
    files: MajdGameGeneratedFile[]
  ): Promise<void>;

  testGame(
    request: MajdGameCreationRequest,
    design: MajdGameDesign
  ): Promise<MajdGameTestResult>;

  repairGame?(
    request: MajdGameCreationRequest,
    design: MajdGameDesign,
    tests: MajdGameTestResult,
    attempt: number
  ): Promise<MajdGameGeneratedFile[]>;

  buildGame(
    request: MajdGameCreationRequest,
    design: MajdGameDesign
  ): Promise<MajdGameArtifact>;

  verifyPlayable?(
    request: MajdGameCreationRequest,
    artifact: MajdGameArtifact
  ): Promise<boolean>;

  persistResult?(
    result: MajdGameCreationResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    projectId: string;

    requestId: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIGameCreationBuilder {
  constructor(
    private readonly adapter:
      SovereignAIGameCreationAdapter,

    private readonly maximumRepairAttempts = 4
  ) {}

  public async create(
    input: MajdGameCreationRequest
  ): Promise<MajdGameCreationResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const projectId =
      request.projectId ||
      this.createId("majd-game");

    const result: MajdGameCreationResult = {
      id: this.createId("game-build"),

      requestId: request.id,

      projectId,

      status: "RECEIVED",

      files: [],

      repairAttempts: 0,

      startedAt: Date.now()
    };

    try {
      const normalizedRequest = {
        ...request,
        projectId
      };

      await this.transition(
        result,
        "DESIGNING"
      );

      const workspace =
        await this.adapter
          .inspectExistingGameWorkspace(
            normalizedRequest
          );

      const design =
        await this.adapter.designGame(
          normalizedRequest,
          workspace
        );

      this.validateDesign(
        design,
        projectId
      );

      result.design =
        this.cloneDesign(design);

      await this.transition(
        result,
        "PLANNING"
      );

      const orderedSystems =
        this.orderSystems(
          design.systems
        );

      await this.transition(
        result,
        "GENERATING"
      );

      for (
        const system of orderedSystems
      ) {
        const generated =
          await this.adapter
            .generateGameFile(
              normalizedRequest,
              design,
              system,
              this.cloneFiles(
                result.files
              )
            );

        if (
          system.required &&
          generated.length === 0
        ) {
          throw new Error(
            `Required game system generated no files: ${system.id}`
          );
        }

        for (
          const file of generated
        ) {
          this.validateFile(file);

          await this.adapter
            .writeGameFile(
              projectId,
              file
            );

          this.upsertFile(
            result.files,
            file
          );
        }
      }

      await this.transition(
        result,
        "INTEGRATING"
      );

      await this.adapter.integrateGame(
        normalizedRequest,
        design,
        this.cloneFiles(
          result.files
        )
      );

      await this.transition(
        result,
        "TESTING"
      );

      let tests =
        await this.adapter.testGame(
          normalizedRequest,
          design
        );

      result.tests =
        this.cloneTests(tests);

      while (
        (
          !tests.success ||
          !tests.playable
        ) &&
        result.repairAttempts <
          this.maximumRepairAttempts &&
        this.adapter.repairGame
      ) {
        result.repairAttempts += 1;

        await this.transition(
          result,
          "REPAIRING"
        );

        const repairedFiles =
          await this.adapter.repairGame(
            normalizedRequest,
            design,
            tests,
            result.repairAttempts
          );

        for (
          const file of repairedFiles
        ) {
          this.validateFile(file);

          await this.adapter
            .writeGameFile(
              projectId,
              file
            );

          this.upsertFile(
            result.files,
            file
          );
        }

        await this.transition(
          result,
          "TESTING"
        );

        tests =
          await this.adapter.testGame(
            normalizedRequest,
            design
          );

        result.tests =
          this.cloneTests(tests);
      }

      if (
        !tests.success ||
        !tests.playable
      ) {
        throw new Error(
          `Game failed playable validation: ${tests.errors.join(
            "; "
          )}`
        );
      }

      await this.transition(
        result,
        "BUILDING"
      );

      const artifact =
        await this.adapter.buildGame(
          normalizedRequest,
          design
        );

      result.artifact = {
        ...artifact,
        errors: [
          ...artifact.errors
        ]
      };

      if (!artifact.success) {
        throw new Error(
          `Game build failed: ${artifact.errors.join(
            "; "
          )}`
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      if (
        this.adapter.verifyPlayable
      ) {
        const playable =
          await this.adapter
            .verifyPlayable(
              normalizedRequest,
              artifact
            );

        if (!playable) {
          throw new Error(
            "Generated game did not pass final playable verification."
          );
        }
      }

      result.status =
        "PLAYABLE";

      result.completedAt =
        Date.now();

      await this.finish(result);

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

      await this.finish(result);

      return this.cloneResult(
        result
      );
    }
  }

  private orderSystems(
    systems: MajdGameSystem[]
  ): MajdGameSystem[] {
    const map =
      new Map<
        string,
        MajdGameSystem
      >();

    for (const system of systems) {
      if (map.has(system.id)) {
        throw new Error(
          `Duplicate game system: ${system.id}`
        );
      }

      map.set(
        system.id,
        system
      );
    }

    const completed =
      new Set<string>();

    const remaining =
      systems.map(
        system => ({
          ...system,
          dependencies: [
            ...system.dependencies
          ]
        })
      );

    const ordered:
      MajdGameSystem[] = [];

    while (
      remaining.length > 0
    ) {
      const executable =
        remaining.filter(
          system =>
            system.dependencies.every(
              dependency =>
                completed.has(
                  dependency
                )
            )
        );

      if (
        executable.length === 0
      ) {
        throw new Error(
          "Game system dependency cycle or unresolved dependency detected."
        );
      }

      for (
        const system of executable
      ) {
        ordered.push(system);

        completed.add(
          system.id
        );

        const index =
          remaining.indexOf(
            system
          );

        if (index >= 0) {
          remaining.splice(
            index,
            1
          );
        }
      }
    }

    return ordered;
  }

  private validateRequest(
    request: MajdGameCreationRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Game creation request id is required."
      );
    }

    if (
      !request.commandId.trim()
    ) {
      throw new Error(
        "Game command id is required."
      );
    }

    if (!request.name.trim()) {
      throw new Error(
        "Game name is required."
      );
    }

    if (
      !request.description.trim()
    ) {
      throw new Error(
        "Game description is required."
      );
    }

    if (
      request.platforms.length ===
      0
    ) {
      throw new Error(
        "At least one game platform is required."
      );
    }
  }

  private validateDesign(
    design: MajdGameDesign,
    projectId: string
  ): void {
    if (
      design.projectId !==
      projectId
    ) {
      throw new Error(
        "Game design project id mismatch."
      );
    }

    if (
      design.gameplayLoop
        .length === 0
    ) {
      throw new Error(
        "Game design requires a gameplay loop."
      );
    }

    if (
      design.systems.length ===
      0
    ) {
      throw new Error(
        "Game design contains no game systems."
      );
    }

    const ids =
      new Set(
        design.systems.map(
          system =>
            system.id
        )
      );

    for (
      const system of
        design.systems
    ) {
      for (
        const dependency of
          system.dependencies
      ) {
        if (
          !ids.has(dependency)
        ) {
          throw new Error(
            `Unknown game dependency ${dependency} for ${system.id}.`
          );
        }

        if (
          dependency ===
          system.id
        ) {
          throw new Error(
            `Game system ${system.id} cannot depend on itself.`
          );
        }
      }
    }
  }

  private validateFile(
    file: MajdGameGeneratedFile
  ): void {
    if (!file.path.trim()) {
      throw new Error(
        "Generated game file path is required."
      );
    }

    if (
      file.binary !== true &&
      file.content ===
        undefined
    ) {
      throw new Error(
        `Generated game file has no content: ${file.path}`
      );
    }
  }

  private normalizeRequest(
    input: MajdGameCreationRequest
  ): MajdGameCreationRequest {
    return {
      ...input,

      name:
        input.name.trim(),

      description:
        input.description
          .trim()
          .replace(
            /\s+/g,
            " "
          ),

      language:
        input.language
          .trim() ||
        "ar",

      platforms: [
        ...new Set(
          input.platforms
        )
      ],

      requirements: [
        ...new Set(
          input.requirements
            .map(
              value =>
                value.trim()
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

  private upsertFile(
    files:
      MajdGameGeneratedFile[],
    file:
      MajdGameGeneratedFile
  ): void {
    const index =
      files.findIndex(
        current =>
          current.path ===
          file.path
      );

    if (index >= 0) {
      files[index] = {
        ...file
      };

      return;
    }

    files.push({
      ...file
    });
  }

  private async transition(
    result:
      MajdGameCreationResult,
    status:
      MajdGameBuildStatus
  ): Promise<void> {
    result.status = status;

    await this.persist(result);

    await this.record(
      `SOVEREIGN_GAME_${status}`,
      result
    );
  }

  private async finish(
    result:
      MajdGameCreationResult
  ): Promise<void> {
    await this.persist(result);

    await this.record(
      `SOVEREIGN_GAME_${result.status}`,
      result,
      {
        files:
          result.files.length,

        repairAttempts:
          result.repairAttempts,

        playable:
          result.tests
            ?.playable ??
          false,

        artifact:
          result.artifact
            ?.path,

        error:
          result.error
      }
    );
  }

  private async persist(
    result:
      MajdGameCreationResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
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
      MajdGameCreationResult,
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

  private cloneDesign(
    design: MajdGameDesign
  ): MajdGameDesign {
    return {
      ...design,

      gameplayLoop: [
        ...design.gameplayLoop
      ],

      systems:
        design.systems.map(
          system => ({
            ...system,

            dependencies: [
              ...system.dependencies
            ]
          })
        ),

      scenes: [
        ...design.scenes
      ],

      characters: [
        ...design.characters
      ],

      worldRequirements: [
        ...design
          .worldRequirements
      ],

      UIRequirements: [
        ...design.UIRequirements
      ],

      assetRequirements: [
        ...design
          .assetRequirements
      ],

      acceptanceCriteria: [
        ...design
          .acceptanceCriteria
      ]
    };
  }

  private cloneFiles(
    files:
      MajdGameGeneratedFile[]
  ): MajdGameGeneratedFile[] {
    return files.map(
      file => ({
        ...file
      })
    );
  }

  private cloneTests(
    tests: MajdGameTestResult
  ): MajdGameTestResult {
    return {
      ...tests,

      errors: [
        ...tests.errors
      ],

      warnings: [
        ...tests.warnings
      ],

      checks: {
        ...tests.checks
      }
    };
  }

  private cloneResult(
    result:
      MajdGameCreationResult
  ): MajdGameCreationResult {
    return {
      ...result,

      design:
        result.design
          ? this.cloneDesign(
              result.design
            )
          : undefined,

      files:
        this.cloneFiles(
          result.files
        ),

      tests:
        result.tests
          ? this.cloneTests(
              result.tests
            )
          : undefined,

      artifact:
        result.artifact
          ? {
              ...result.artifact,

              errors: [
                ...result.artifact
                  .errors
              ]
            }
          : undefined
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIGameCreationBuilder;
