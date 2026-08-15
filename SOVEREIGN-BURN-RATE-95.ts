      recordId
    );
  }

  private async requireAuthorized(
    context: SovereignBurnRateContext,
    operation:
      | "REGISTER_BURN_RATE"
      | "EVALUATE_BURN_RATE"
      | "READ_BURN_RATE"
      | "ARCHIVE_BURN_RATE",
    recordId?: string,
    serviceId?: string,
    criticality?:
      SovereignBurnRateCriticality
  ): Promise<void> {
    const result =
      await this.requirePolicyBridge()
        .authorize({
          actorId:
            context.actorId,

          authority:
            context.authority,

          operation,

          recordId,

          serviceId,

          criticality,
        });

    if (!result.allowed) {
      await this.recordAudit(
        `burn-rate.${operation.toLowerCase()}`,
        recordId,
        "DENIED",
        {
          actorId:
            context.actorId,

          reason:
            result.reason,
        }
      );

      throw new Error(
        result.reason ??
        `Burn-rate operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignBurnRateContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Burn rate requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "Burn rate requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Burn rate requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "Burn rate requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignBurnRateStore {
    if (!this.store) {
      throw new Error(
        "Sovereign burn-rate store is not configured."
      );
    }

    return this.store;
  }

  private requireMetricsBridge():
    SovereignBurnRateMetricsBridge {
    if (!this.metricsBridge) {
      throw new Error(
        "Sovereign burn-rate metrics bridge is not configured."
      );
    }

    return this.metricsBridge;
  }

  private requirePolicyBridge():
    SovereignBurnRatePolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign burn-rate policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignBurnRateRecord> {
    const record =
      await this.requireStore()
        .getRecord(recordId);

    if (!record) {
      throw new Error(
        `Burn-rate record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publishEvent(
    type: string,
    record: SovereignBurnRateRecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "BURN-RATE-EVENT"
        ),

      type,

      source:
        this.id,

      recordId:
        record.id,

      serviceId:
        record.serviceId,

      timestamp:
        this.now(),

      correlationId:
        record.correlationId,

      payload,
    });
  }

  private async recordAudit(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.audit) {
      return;
    }

    await this.audit.record(
      operation,
      subjectId,
      result,
      metadata
    );
  }

  private round(
    value: number
  ): number {
    return Number(
      value.toFixed(4)
    );
  }

  private errorMessage(
    error: unknown
  ): string {
    return error instanceof Error
      ? error.message
      : String(error);
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${randomUUID()}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

export function createSovereignBurnRateEngine():
  SovereignBurnRateEngine {
  return new SovereignBurnRateEngine();
}

export const SOVEREIGN_BURN_RATE_CONTRACT = {
  id:
    "SOVEREIGN-BURN-RATE-94",

  role:
    "CENTRAL_SOVEREIGN_BURN_RATE_ENGINE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  sloIntegrated:
    true,

  sliIntegrated:
    true,

  errorBudgetIntegrated:
    true,

  multiWindowBurnRate:
    true,

  failureRateMeasurement:
    true,

  remainingBudgetTracking:
    true,

  projectedExhaustion:
    true,

  elevatedBurnDetection:
    true,

  criticalBurnDetection:
    true,

  exhaustionImminentDetection:
    true,

  operationalEvidenceRequired:
    true,

  falseHealthyBurnRateBlocked:
    true,

  policyAuthorizationRequired:
    true,

  securityVerificationRequired:
    true,

  auditRequired:
    true,

  directAuthorityModification:
    false,

  directPolicyModification:
    false,

  automaticPrivilegeElevation:
    false,

  burnRateCanCreateAuthority:
    false,

  burnRateCanOverrideOwner:
    false,

  stewardCanOverrideOwner:
    false,

  externalBurnRateSaaSRequired:
    false,

  status:
    "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-BURN-RATE-94
 * ============================================================
 */
