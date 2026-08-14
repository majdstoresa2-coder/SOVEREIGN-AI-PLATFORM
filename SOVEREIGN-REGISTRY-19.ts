/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-REGISTRY-19
 * ============================================================
 *
 * Central Sovereign Component Registry.
 *
 * Responsibilities:
 * - Register sovereign platform components.
 * - Track component identity and versions.
 * - Track dependencies.
 * - Track lifecycle state.
 * - Discover components internally.
 * - Prevent duplicate identities.
 * - Preserve registry history.
 *
 * REGISTRY has NO sovereign authority.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY > REGISTRY
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. COMPONENT TYPES
 * ============================================================
 */

export type SovereignRegistryComponentType =
  | "CORE"
  | "RUNTIME"
  | "PLANNING"
  | "EXECUTION"
  | "AGENT"
  | "CAPABILITY"
  | "MEMORY"
  | "EVENTS"
  | "JOBS"
  | "MONITORING"
  | "DIAGNOSTICS"
  | "SECURITY"
  | "BUILD"
  | "DEPLOYMENT"
  | "DATABASE"
  | "SERVICE"
  | "API"
  | "WORKER"
  | "GAME"
  | "SYSTEM"
  | "CUSTOM";

/* ============================================================
 * 2. COMPONENT STATUS
 * ============================================================
 */

export type SovereignRegistryStatus =
  | "REGISTERED"
  | "ACTIVE"
  | "DEGRADED"
  | "DISABLED"
  | "DEPRECATED"
  | "REMOVED";

/* ============================================================
 * 3. COMPONENT DEPENDENCY
 * ============================================================
 */

export interface SovereignRegistryDependency {
  componentId: string;

  requiredVersion?: string;

  optional: boolean;

  description?: string;
}

/* ============================================================
 * 4. COMPONENT ENDPOINT
 * ============================================================
 */

export interface SovereignRegistryEndpoint {
  name: string;

  protocol:
    | "INTERNAL"
    | "HTTP"
    | "HTTPS"
    | "TCP"
    | "UDP"
    | "QUEUE"
    | "IPC"
    | "CUSTOM";

  address: string;

  enabled: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. COMPONENT RECORD
 * ============================================================
 */

export interface SovereignRegistryComponent {
  id: string;

  name: string;

  type: SovereignRegistryComponentType;

  version: string;

  status: SovereignRegistryStatus;

  owner: string;

  description?: string;

  dependencies: SovereignRegistryDependency[];

  endpoints: SovereignRegistryEndpoint[];

  capabilities: string[];

  tags: string[];

  checksum?: string;

  checksumAlgorithm?: "SHA256" | "SHA512";

  registeredAt: string;

  updatedAt: string;

  activatedAt?: string;

  deprecatedAt?: string;

  removedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. REGISTRATION REQUEST
 * ============================================================
 */

export interface SovereignRegistryRequest {
  id: string;

  name: string;

  type: SovereignRegistryComponentType;

  version: string;

  owner: string;

  description?: string;

  dependencies?: SovereignRegistryDependency[];

  endpoints?: SovereignRegistryEndpoint[];

  capabilities?: string[];

  tags?: string[];

  checksum?: string;

  checksumAlgorithm?: "SHA256" | "SHA512";

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. REGISTRY CONTEXT
 * ============================================================
 */

export interface SovereignRegistryContext {
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

export interface SovereignRegistryAccessValidator {
  validate(
    operation:
      | "REGISTER"
      | "UPDATE"
      | "ACTIVATE"
      | "DISABLE"
      | "DEPRECATE"
      | "REMOVE",
    context: SovereignRegistryContext,
    component?: SovereignRegistryComponent
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 9. EVENT BUS
 * ============================================================
 */

export interface SovereignRegistryEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    componentId: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 10. AUDIT
 * ============================================================
 */

export interface SovereignRegistryAudit {
  record(
    operation: string,
    componentId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 11. REGISTRY ENGINE
 * ============================================================
 */

export class SovereignRegistryEngine {
  public readonly id =
    "SOVEREIGN-REGISTRY-19";

  public readonly version =
    "1.0.0";

  private components =
    new Map<string, SovereignRegistryComponent>();

  private accessValidator?:
    SovereignRegistryAccessValidator;

  private eventBus?:
    SovereignRegistryEventBus;

  private audit?:
    SovereignRegistryAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: SovereignRegistryAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setEventBus(
    eventBus: SovereignRegistryEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignRegistryAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER COMPONENT
   * ==========================================================
   */

  async register(
    request: SovereignRegistryRequest,
    context: SovereignRegistryContext
  ): Promise<SovereignRegistryComponent> {
    this.requireAccess(
      "REGISTER",
      context
    );

    this.validateRequest(request);

    if (this.components.has(request.id)) {
      throw new Error(
        `Registry component already exists: ${request.id}`
      );
    }

    this.validateDependencies(
      request.id,
      request.dependencies ?? []
    );

    const now = this.now();

    const component:
      SovereignRegistryComponent = {
      id: request.id,

      name: request.name,

      type: request.type,

      version: request.version,

      status: "REGISTERED",

      owner: request.owner,

      description:
        request.description,

      dependencies: [
        ...(request.dependencies ?? []),
      ],

      endpoints: [
        ...(request.endpoints ?? []),
      ],

      capabilities: [
        ...(request.capabilities ?? []),
      ],

      tags: [
        ...(request.tags ?? []),
      ],

      checksum:
        request.checksum,

      checksumAlgorithm:
        request.checksumAlgorithm,

      registeredAt:
        now,

      updatedAt:
        now,

      metadata:
        request.metadata,
    };

    this.components.set(
      component.id,
      component
    );

    await this.publish(
      "registry.component.registered",
      component,
      {
        type: component.type,
        version: component.version,
      }
    );

    await this.recordAudit(
      "registry.register",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * UPDATE VERSION
   * ==========================================================
   */

  async updateVersion(
    componentId: string,
    version: string,
    context: SovereignRegistryContext,
    checksum?: string,
    checksumAlgorithm?: "SHA256" | "SHA512"
  ): Promise<SovereignRegistryComponent> {
    const component =
      this.requireComponent(componentId);

    this.requireAccess(
      "UPDATE",
      context,
      component
    );

    if (!version.trim()) {
      throw new Error(
        "Component version is required."
      );
    }

    const previousVersion =
      component.version;

    component.version =
      version;

    component.checksum =
      checksum;

    component.checksumAlgorithm =
      checksumAlgorithm;

    component.updatedAt =
      this.now();

    await this.publish(
      "registry.component.version.updated",
      component,
      {
        previousVersion,
        version,
      }
    );

    await this.recordAudit(
      "registry.version.update",
      component.id,
      "SUCCESS",
      {
        previousVersion,
        version,
      }
    );

    return component;
  }

  /* ==========================================================
   * ACTIVATE
   * ==========================================================
   */

  async activate(
    componentId: string,
    context: SovereignRegistryContext
  ): Promise<SovereignRegistryComponent> {
    const component =
      this.requireComponent(componentId);

    this.requireAccess(
      "ACTIVATE",
      context,
      component
    );

    this.ensureRequiredDependencies(
      component
    );

    component.status =
      "ACTIVE";

    component.activatedAt =
      this.now();

    component.updatedAt =
      component.activatedAt;

    await this.publish(
      "registry.component.activated",
      component,
      {}
    );

    await this.recordAudit(
      "registry.activate",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * DISABLE
   * ==========================================================
   */

  async disable(
    componentId: string,
    context: SovereignRegistryContext
  ): Promise<SovereignRegistryComponent> {
    const component =
      this.requireComponent(componentId);

    this.requireAccess(
      "DISABLE",
      context,
      component
    );

    component.status =
      "DISABLED";

    component.updatedAt =
      this.now();

    await this.publish(
      "registry.component.disabled",
      component,
      {}
    );

    await this.recordAudit(
      "registry.disable",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * DEPRECATE
   * ==========================================================
   */

  async deprecate(
    componentId: string,
    context: SovereignRegistryContext
  ): Promise<SovereignRegistryComponent> {
    const component =
      this.requireComponent(componentId);

    this.requireAccess(
      "DEPRECATE",
      context,
      component
    );

    component.status =
      "DEPRECATED";

    component.deprecatedAt =
      this.now();

    component.updatedAt =
      component.deprecatedAt;

    await this.publish(
      "registry.component.deprecated",
      component,
      {}
    );

    await this.recordAudit(
      "registry.deprecate",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * REMOVE
   * ==========================================================
   */

  async remove(
    componentId: string,
    context: SovereignRegistryContext
  ): Promise<SovereignRegistryComponent> {
    const component =
      this.requireComponent(componentId);

    this.requireAccess(
      "REMOVE",
      context,
      component
    );

    const dependents =
      this.findDependents(
        componentId
      ).filter(
        (dependent) =>
          dependent.status !==
          "REMOVED"
      );

    if (dependents.length > 0) {
      throw new Error(
        `Component ${componentId} cannot be removed while active dependencies exist: ${dependents
          .map((item) => item.id)
          .join(", ")}`
      );
    }

    component.status =
      "REMOVED";

    component.removedAt =
      this.now();

    component.updatedAt =
      component.removedAt;

    await this.publish(
      "registry.component.removed",
      component,
      {}
    );

    await this.recordAudit(
      "registry.remove",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * DISCOVERY
   * ==========================================================
   */

  discoverByType(
    type: SovereignRegistryComponentType,
    activeOnly = true
  ): SovereignRegistryComponent[] {
    return this.list().filter(
      (component) =>
        component.type === type &&
        (
          !activeOnly ||
          component.status ===
            "ACTIVE"
        )
    );
  }

  discoverByCapability(
    capability: string,
    activeOnly = true
  ): SovereignRegistryComponent[] {
    return this.list().filter(
      (component) =>
        component.capabilities.includes(
          capability
        ) &&
        (
          !activeOnly ||
          component.status ===
            "ACTIVE"
        )
    );
  }

  discoverByTag(
    tag: string,
    activeOnly = true
  ): SovereignRegistryComponent[] {
    return this.list().filter(
      (component) =>
        component.tags.includes(tag) &&
        (
          !activeOnly ||
          component.status ===
            "ACTIVE"
        )
    );
  }

  /* ==========================================================
   * DEPENDENCIES
   * ==========================================================
   */

  getDependencies(
    componentId: string
  ): SovereignRegistryDependency[] {
    return [
      ...this.requireComponent(
        componentId
      ).dependencies,
    ];
  }

  findDependents(
    componentId: string
  ): SovereignRegistryComponent[] {
    return this.list().filter(
      (component) =>
        component.dependencies.some(
          (dependency) =>
            dependency.componentId ===
            componentId
        )
    );
  }

  private ensureRequiredDependencies(
    component:
      SovereignRegistryComponent
  ): void {
    for (
      const dependency of
      component.dependencies
    ) {
      if (dependency.optional) {
        continue;
      }

      const registered =
        this.components.get(
          dependency.componentId
        );

      if (!registered) {
        throw new Error(
          `Required dependency not registered: ${dependency.componentId}`
        );
      }

      if (
        registered.status !==
        "ACTIVE"
      ) {
        throw new Error(
          `Required dependency is not active: ${dependency.componentId}`
        );
      }

      if (
        dependency.requiredVersion &&
        registered.version !==
          dependency.requiredVersion
      ) {
        throw new Error(
          `Dependency version mismatch for ${dependency.componentId}. Required ${dependency.requiredVersion}, found ${registered.version}.`
        );
      }
    }
  }

  private validateDependencies(
    componentId: string,
    dependencies:
      SovereignRegistryDependency[]
  ): void {
    const ids =
      new Set<string>();

    for (
      const dependency of
      dependencies
    ) {
      if (
        dependency.componentId ===
        componentId
      ) {
        throw new Error(
          "Component cannot depend on itself."
        );
      }

      if (
        ids.has(
          dependency.componentId
        )
      ) {
        throw new Error(
          `Duplicate dependency: ${dependency.componentId}`
        );
      }

      ids.add(
        dependency.componentId
      );
    }
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  get(
    componentId: string
  ):
    | SovereignRegistryComponent
    | undefined {
    return this.components.get(
      componentId
    );
  }

  list(
    status?: SovereignRegistryStatus
  ): SovereignRegistryComponent[] {
    const components =
      Array.from(
        this.components.values()
      );

    if (!status) {
      return components;
    }

    return components.filter(
      (component) =>
        component.status === status
    );
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;
    registered: number;
    active: number;
    degraded: number;
    disabled: number;
    deprecated: number;
    removed: number;
  } {
    const components =
      this.list();

    return {
      total:
        components.length,

      registered:
        components.filter(
          (item) =>
            item.status ===
            "REGISTERED"
        ).length,

      active:
        components.filter(
          (item) =>
            item.status ===
            "ACTIVE"
        ).length,

      degraded:
        components.filter(
          (item) =>
            item.status ===
            "DEGRADED"
        ).length,

      disabled:
        components.filter(
          (item) =>
            item.status ===
            "DISABLED"
        ).length,

      deprecated:
        components.filter(
          (item) =>
            item.status ===
            "DEPRECATED"
        ).length,

      removed:
        components.filter(
          (item) =>
            item.status ===
            "REMOVED"
        ).length,
    };
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "REGISTER"
      | "UPDATE"
      | "ACTIVATE"
      | "DISABLE"
      | "DEPRECATE"
      | "REMOVE",
    context: SovereignRegistryContext,
    component?:
      SovereignRegistryComponent
  ): void {
    if (!context.policyChecked) {
      throw new Error(
        "Registry blocked: policy check required."
      );
    }

    if (!context.permissionChecked) {
      throw new Error(
        "Registry blocked: permission check required."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Registry blocked: security check required."
      );
    }

    if (this.accessValidator) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          component
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
            "Registry operation denied."
        );
      }
    }
  }

  /* ==========================================================
   * VALIDATION
   * ==========================================================
   */

  private validateRequest(
    request:
      SovereignRegistryRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Component ID is required."
      );
    }

    if (!request.name.trim()) {
      throw new Error(
        "Component name is required."
      );
    }

    if (!request.version.trim()) {
      throw new Error(
        "Component version is required."
      );
    }

    if (!request.owner.trim()) {
      throw new Error(
        "Component owner is required."
      );
    }
  }

  /* ==========================================================
   * REQUIRE COMPONENT
   * ==========================================================
   */

  private requireComponent(
    componentId: string
  ): SovereignRegistryComponent {
    const component =
      this.components.get(
        componentId
      );

    if (!component) {
 
