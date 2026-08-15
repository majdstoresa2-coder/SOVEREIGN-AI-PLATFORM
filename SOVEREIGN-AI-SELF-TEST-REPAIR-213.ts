// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-SELF-TEST-REPAIR-213.ts
// Final Closure 08/15
// Autonomous Test / Diagnose / Repair / Retest Loop
// ============================================================

export type SovereignRepairTarget =
  | "PLATFORM"
  | "GAME"
  | "ADMIN"
  | "FRONTEND"
  | "BACKEND"
  | "API"
  | "DATABASE"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "INFRASTRUCTURE"
  | "GENERAL";

export type SovereignTestType =
  | "STATIC"
  | "TYPECHECK"
  | "UNIT"
  | "INTEGRATION"
  | "BUILD"
  | "RUNTIME"
  | "SECURITY"
  | "SMOKE"
  | "PLAYABILITY"
  | "UI"
  | "API"
  | "DATABASE";

export type SovereignIssueSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignRepairStatus =
  | "CREATED"
  | "TESTING"
  | "DIAGNOSING"
  | "REPAIRING"
  | "RETESTING"
  | "VERIFYING"
  | "PASSED"
  | "BLOCKED"
  | "FAILED";

export interface SovereignSelfRepairRequest {
  id: string;
  commandId: string;
  projectId: string;

  target: SovereignRepairTarget;

  requiredTests?: SovereignTestType[];

  maximumAttempts?: number;

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignTestIssue {
  id: string;

  test: SovereignTestType;

  severity: SovereignIssueSeverity;

  code?: string;

  message: string;

  file?: string;

  line?: number;

  repairable: boolean;

  blocking: boolean;
}

export interface SovereignTestExecution {
  id: string;

  type: SovereignTestType;

  success: boolean;

  issues: SovereignTestIssue[];

  output?: unknown;

  startedAt: number;

  completedAt: number;
}

export interface SovereignRepairDiagnosis {
  id: string;

  projectId: string;

  rootCauses: string[];

  affectedFiles: string[];

  recommendedActions: string[];

  blockingIssues: string[];

  repairable: boolean;

  createdAt: number;
}

export interface SovereignRepairChange {
  path: string;

  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CONFIGURE";

  reason: string;

  verified: boolean;
}

export interface SovereignRepairAttempt {
  attempt: number;

  diagnosis: SovereignRepairDiagnosis;

  changes: SovereignRepairChange[];

  startedAt: number;

  completedAt: number;
}

export interface SovereignSelfRepairResult {
  id: string;

  requestId: string;

  projectId: string;

  target: SovereignRepairTarget;

  status: SovereignRepairStatus;

  tests: SovereignTestExecution[];

  repairs: SovereignRepairAttempt[];

  unresolvedIssues: SovereignTestIssue[];

  releaseAllowed: boolean;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAISelfTestRepairAdapter {
  runTest(
    request: SovereignSelfRepairRequest,
    test: SovereignTestType
  ): Promise<SovereignTestExecution>;

  diagnose(
    request: SovereignSelfRepairRequest,
    failures: SovereignTestExecution[],
    attempt: number
  ): Promise<SovereignRepairDiagnosis>;

  repair(
    request: SovereignSelfRepairRequest,
    diagnosis: SovereignRepairDiagnosis,
    attempt: number
  ): Promise<SovereignRepairChange[]>;

  verifyChanges?(
    request: SovereignSelfRepairRequest,
    changes: SovereignRepairChange[]
  ): Promise<boolean>;

  finalVerification?(
    request: SovereignSelfRepairRequest,
    result: SovereignSelfRepairResult
  ): Promise<boolean>;

  persistResult?(
    result: SovereignSelfRepairResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    projectId: string;
    requestId: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAISelfTestRepair {
  private readonly defaultTests:
    SovereignTestType[] = [
      "STATIC",
      "TYPECHECK",
      "UNIT",
      "INTEGRATION",
      "BUILD",
      "RUNTIME",
      "SECURITY",
      "SMOKE"
    ];

  constructor(
    private readonly adapter:
      SovereignAISelfTestRepairAdapter
  ) {}

  public async execute(
    input: SovereignSelfRepairRequest
  ): Promise<SovereignSelfRepairResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const maximumAttempts =
      this.normalizeAttempts(
        request.maximumAttempts ?? 4
      );

    const result:
      SovereignSelfRepairResult = {
        id: this.createId(
          "self-repair"
        ),

        requestId: request.id,

        projectId:
          request.projectId,

        target:
          request.target,

        status: "CREATED",

        tests: [],

        repairs: [],

        unresolvedIssues: [],

        releaseAllowed: false,

        startedAt: Date.now()
      };

    try {
      let tests =
        await this.executeTestSuite(
          request,
          "TESTING",
          result
        );

      let failures =
        this.failedTests(tests);

      let attempt = 0;

      while (
        failures.length > 0 &&
        attempt < maximumAttempts
      ) {
        attempt += 1;

        await this.transition(
          result,
          "DIAGNOSING"
        );

        const diagnosis =
          await this.adapter.diagnose(
            request,
            failures,
            attempt
          );

        this.validateDiagnosis(
          diagnosis,
          request.projectId
        );

        if (!diagnosis.repairable) {
          result.unresolvedIssues =
            this.collectIssues(
              failures
            );

          result.status = "BLOCKED";

          result.error =
            "Detected failures require intervention outside autonomous repair authority.";

          result.completedAt =
            Date.now();

          await this.finish(result);

          return this.cloneResult(
            result
          );
        }

        await this.transition(
          result,
          "REPAIRING"
        );

        const startedAt =
          Date.now();

        const changes =
          await this.adapter.repair(
            request,
            diagnosis,
            attempt
          );

        if (
          changes.length === 0
        ) {
          throw new Error(
            "Repair engine produced no changes for repairable failures."
          );
        }

        if (
          this.adapter.verifyChanges
        ) {
          const verified =
            await this.adapter
              .verifyChanges(
                request,
                changes
              );

          if (!verified) {
            throw new Error(
              "Repair changes failed verification."
            );
          }
        }

        result.repairs.push({
          attempt,

          diagnosis:
            this.cloneDiagnosis(
              diagnosis
            ),

          changes:
            changes.map(
              change => ({
                ...change
              })
            ),

          startedAt,

          completedAt:
            Date.now()
        });

        tests =
          await this.executeTestSuite(
            request,
            "RETESTING",
            result
          );

        failures =
          this.failedTests(tests);
      }

      if (
        failures.length > 0
      ) {
        result.unresolvedIssues =
          this.collectIssues(
            failures
          );

        result.status =
          "BLOCKED";

        result.error =
          `Maximum autonomous repair attempts reached with ${result.unresolvedIssues.length} unresolved issue(s).`;

        result.completedAt =
          Date.now();

        await this.finish(result);

        return this.cloneResult(
          result
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      result.unresolvedIssues =
        [];

      result.releaseAllowed =
        !this.hasBlockingIssues(
          result.tests
        );

      if (
        this.adapter
          .finalVerification
      ) {
        const verified =
          await this.adapter
            .finalVerification(
              request,
              this.cloneResult(
                result
              )
            );

        if (!verified) {
          result.releaseAllowed =
            false;

          throw new Error(
            "Final sovereign verification failed."
          );
        }
      }

      if (
        !result.releaseAllowed
      ) {
        throw new Error(
          "Release blocked by sovereign quality gate."
        );
      }

      result.status =
        "PASSED";

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.status =
        "FAILED";

      result.releaseAllowed =
        false;

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

  private async executeTestSuite(
    request:
      SovereignSelfRepairRequest,
    stage:
      "TESTING" | "RETESTING",
    result:
      SovereignSelfRepairResult
  ): Promise<SovereignTestExecution[]> {
    await this.transition(
      result,
      stage
    );

    const tests =
      this.resolveTests(
        request
      );

    const executions:
      SovereignTestExecution[] = [];

    for (const test of tests) {
      const execution =
        await this.adapter.runTest(
          request,
          test
        );

      this.validateExecution(
        execution,
        test
      );

      executions.push(
        this.cloneExecution(
          execution
        )
      );
    }

    result.tests =
      executions.map(
        execution =>
          this.cloneExecution(
            execution
          )
      );

    return executions;
  }

  private resolveTests(
    request:
      SovereignSelfRepairRequest
  ): SovereignTestType[] {
    const requested =
      request.requiredTests &&
      request.requiredTests.length >
        0
        ? request.requiredTests
        : this.defaultTests;

    const tests =
      new Set<SovereignTestType>(
        requested
      );

    if (
      request.target ===
        "GAME"
    ) {
      tests.add(
        "PLAYABILITY"
      );
    }

    if (
      request.target ===
        "FRONTEND" ||
      request.target ===
        "ADMIN" ||
      request.target ===
        "PLATFORM"
    ) {
      tests.add("UI");
    }

    if (
      request.target ===
        "BACKEND" ||
      request.target ===
        "API" ||
      request.target ===
        "PLATFORM"
    ) {
      tests.add("API");
    }

    if (
      request.target ===
        "DATABASE" ||
      request.target ===
        "PLATFORM"
    ) {
      tests.add(
        "DATABASE"
      );
    }

    return [...tests];
  }

  private failedTests(
    tests:
      SovereignTestExecution[]
  ): SovereignTestExecution[] {
    return tests.filter(
      test =>
        !test.success ||
        test.issues.some(
          issue =>
            issue.blocking
        )
    );
  }

  private collectIssues(
    tests:
      SovereignTestExecution[]
  ): SovereignTestIssue[] {
    const issues:
      SovereignTestIssue[] = [];

    const ids =
      new Set<string>();

    for (const test of tests) {
      for (
        const issue of
          test.issues
      ) {
        if (!ids.has(issue.id)) {
          ids.add(issue.id);

          issues.push({
            ...issue
          });
        }
      }
    }

    return issues;
  }

  private hasBlockingIssues(
    tests:
      SovereignTestExecution[]
  ): boolean {
    return tests.some(
      test =>
        test.issues.some(
          issue =>
            issue.blocking ||
            issue.severity ===
              "CRITICAL"
        )
    );
  }

  private validateRequest(
    request:
      SovereignSelfRepairRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Self-repair request id is required."
      );
    }

    if (
      !request.commandId.trim()
    ) {
      throw new Error(
        "Self-repair command id is required."
      );
    }

    if (
      !request.projectId.trim()
    ) {
      throw new Error(
        "Self-repair project id is required."
      );
    }
  }

  private validateExecution(
    execution:
      SovereignTestExecution,
    expected:
      SovereignTestType
  ): void {
    if (
      execution.type !==
      expected
    ) {
      throw new Error(
        `Test execution mismatch. Expected ${expected}.`
      );
    }

    for (
      const issue of
        execution.issues
    ) {
      if (
        !issue.id.trim() ||
        !issue.message.trim()
      ) {
        throw new Error(
          `Invalid issue returned by ${expected}.`
        );
      }
    }
  }

  private validateDiagnosis(
    diagnosis:
      SovereignRepairDiagnosis,
    projectId: string
  ): void {
    if (
      !diagnosis.id.trim()
    ) {
      throw new Error(
        "Repair diagnosis id is required."
      );
    }

    if (
      diagnosis.projectId !==
      projectId
    ) {
      throw new Error(
        "Repair diagnosis project id mismatch."
      );
    }

    if (
      diagnosis.rootCauses
        .length === 0
    ) {
      throw new Error(
        "Repair diagnosis contains no root cause."
      );
    }
  }

  private normalizeRequest(
    input:
      SovereignSelfRepairRequest
  ): SovereignSelfRepairRequest {
    return {
      ...input,

      requiredTests:
        input.requiredTests
          ? [
              ...new Set(
                input.requiredTests
              )
            ]
          : undefined,

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private normalizeAttempts(
    attempts: number
  ): number {
    if (
      !Number.isFinite(
        attempts
      )
    ) {
      return 4;
    }

    return Math.max(
      1,
      Math.min(
        10,
        Math.floor(attempts)
      )
    );
  }

  private async transition(
    result:
      SovereignSelfRepairResult,
    status:
      SovereignRepairStatus
  ): Promise<void> {
    result.status = status;

    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_SELF_REPAIR_${status}`,
      result
    );
  }

  private async finish(
    result:
      SovereignSelfRepairResult
  ): Promise<void> {
    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_SELF_REPAIR_${result.status}`,
      result,
      {
        repairs:
          result.repairs.length,

        unresolvedIssues:
          result
            .unresolvedIssues
            .length,

        releaseAllowed:
          result.releaseAllowed,

        error:
          result.error
      }
    );
  }

  private async persist(
    result:
      SovereignSelfRepairResult
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
      SovereignSelfRepairResult,
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

  private cloneExecution(
    execution:
      SovereignTestExecution
  ): SovereignTestExecution {
    return {
      ...execution,

      issues:
        execution.issues.map(
          issue => ({
            ...issue
          })
        )
    };
  }

  private cloneDiagnosis(
    diagnosis:
      SovereignRepairDiagnosis
  ): SovereignRepairDiagnosis {
    return {
      ...diagnosis,

      rootCauses: [
        ...diagnosis.rootCauses
      ],

      affectedFiles: [
        ...diagnosis
          .affectedFiles
      ],

      recommendedActions: [
        ...diagnosis
          .recommendedActions
      ],

      blockingIssues: [
        ...diagnosis
          .blockingIssues
      ]
    };
  }

  private cloneResult(
    result:
      SovereignSelfRepairResult
  ): SovereignSelfRepairResult {
    return {
      ...result,

      tests:
        result.tests.map(
          test =>
            this.cloneExecution(
              test
            )
        ),

      repairs:
        result.repairs.map(
          repair => ({
            ...repair,

            diagnosis:
              this.cloneDiagnosis(
                repair.diagnosis
              ),

            changes:
              repair.changes.map(
                change => ({
                  ...change
                })
              )
          })
        ),

      unresolvedIssues:
        result
          .unresolvedIssues
          .map(
            issue => ({
              ...issue
            })
          )
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

export default SovereignAISelfTestRepair;
