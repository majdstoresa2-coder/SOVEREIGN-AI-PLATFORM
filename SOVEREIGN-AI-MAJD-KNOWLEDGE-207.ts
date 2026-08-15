// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-MAJD-KNOWLEDGE-207.ts
// Final Closure 02/15
// Majd Sovereign Operational Knowledge
// ============================================================

export type MajdKnowledgeAuthority =
  | "OWNER"
  | "SOVEREIGN"
  | "PLATFORM";

export type MajdProductDomain =
  | "PLATFORM"
  | "GAMES"
  | "SOCIAL"
  | "MEDIA"
  | "ADMIN"
  | "PAYMENTS"
  | "DEVELOPERS"
  | "AI"
  | "INFRASTRUCTURE"
  | "SECURITY";

export interface MajdKnowledgeRule {
  id: string;
  domain: MajdProductDomain;
  authority: MajdKnowledgeAuthority;
  title: string;
  instruction: string;
  immutable: boolean;
  priority: number;
}

export interface MajdProductCapability {
  id: string;
  domain: MajdProductDomain;
  name: string;
  description: string;
  required: boolean;
  autonomousBuild: boolean;
  dependencies: string[];
}

export interface MajdOperationalKnowledge {
  platform: {
    id: "MAJD";
    sovereignPlatform:
      "SOVEREIGN-AI-PLATFORM";
    productType:
      "GLOBAL_DIGITAL_PLATFORM";
    aiOperated: true;
    ownerAuthority:
      "SUPREME";
  };

  mission: string[];

  rules: MajdKnowledgeRule[];

  capabilities:
    MajdProductCapability[];

  autonomousResponsibilities:
    string[];

  acceptanceCriteria:
    string[];
}

export interface MajdKnowledgeQuery {
  domain?: MajdProductDomain;
  capability?: string;
  text?: string;
}

export interface MajdKnowledgeResult {
  rules: MajdKnowledgeRule[];
  capabilities:
    MajdProductCapability[];
  responsibilities: string[];
}

export class SovereignAIMajdKnowledge {
  private readonly knowledge:
    MajdOperationalKnowledge;

  constructor() {
    this.knowledge =
      this.createKnowledge();
  }

  public getKnowledge():
    MajdOperationalKnowledge {
    return this.cloneKnowledge(
      this.knowledge
    );
  }

  public query(
    query: MajdKnowledgeQuery
  ): MajdKnowledgeResult {
    const text =
      query.text
        ?.trim()
        .toLowerCase();

    const capability =
      query.capability
        ?.trim()
        .toLowerCase();

    const rules =
      this.knowledge.rules.filter(
        rule => {
          if (
            query.domain &&
            rule.domain !==
              query.domain
          ) {
            return false;
          }

          if (
            text &&
            !`${rule.title} ${rule.instruction}`
              .toLowerCase()
              .includes(text)
          ) {
            return false;
          }

          return true;
        }
      );

    const capabilities =
      this.knowledge.capabilities
        .filter(item => {
          if (
            query.domain &&
            item.domain !==
              query.domain
          ) {
            return false;
          }

          if (
            capability &&
            !`${item.id} ${item.name}`
              .toLowerCase()
              .includes(
                capability
              )
          ) {
            return false;
          }

          if (
            text &&
            !`${item.name} ${item.description}`
              .toLowerCase()
              .includes(text)
          ) {
            return false;
          }

          return true;
        });

    return {
      rules:
        rules.map(
          rule => ({
            ...rule
          })
        ),

      capabilities:
        capabilities.map(
          item => ({
            ...item,
            dependencies: [
              ...item.dependencies
            ]
          })
        ),

      responsibilities: [
        ...this.knowledge
          .autonomousResponsibilities
      ]
    };
  }

  public getCapability(
    id: string
  ):
    | MajdProductCapability
    | undefined {
    const capability =
      this.knowledge.capabilities
        .find(
          item =>
            item.id === id
        );

    return capability
      ? {
          ...capability,
          dependencies: [
            ...capability.dependencies
          ]
        }
      : undefined;
  }

  public requiredCapabilities():
    MajdProductCapability[] {
    return this.knowledge
      .capabilities
      .filter(
        item =>
          item.required
      )
      .map(
        item => ({
          ...item,
          dependencies: [
            ...item.dependencies
          ]
        })
      );
  }

  public mayBuildAutonomously(
    capabilityId: string
  ): boolean {
    const capability =
      this.knowledge.capabilities
        .find(
          item =>
            item.id ===
            capabilityId
        );

    return (
      capability
        ?.autonomousBuild ===
      true
    );
  }

  private createKnowledge():
    MajdOperationalKnowledge {
    const rules:
      MajdKnowledgeRule[] = [
        this.rule(
          "MAJD-RULE-OWNER",
          "PLATFORM",
          "OWNER",
          "Owner supremacy",
          "OWNER is the supreme authority over Majd and SOVEREIGN-AI-PLATFORM. No autonomous process may override an explicit OWNER command.",
          true,
          100
        ),

        this.rule(
          "MAJD-RULE-AUTONOMY",
          "AI",
          "SOVEREIGN",
          "Autonomous operation",
          "The sovereign AI must autonomously plan, build, test, repair, operate, maintain and improve Majd within granted authority.",
          true,
          99
        ),

        this.rule(
          "MAJD-RULE-ORIGINAL",
          "PLATFORM",
          "OWNER",
          "Original Majd products",
          "Majd products and experiences must be original Majd implementations. External products may inspire capability categories but must not be copied.",
          true,
          98
        ),

        this.rule(
          "MAJD-RULE-QUALITY",
          "PLATFORM",
          "OWNER",
          "Quality gate",
          "Low-quality, broken or unverified releases must not be published to users.",
          true,
          97
        ),

        this.rule(
          "MAJD-RULE-SECURITY",
          "SECURITY",
          "SOVEREIGN",
          "Security by default",
          "All generated services must apply authentication, authorization, validation, auditability, least privilege and secure secret handling.",
          true,
          96
        ),

        this.rule(
          "MAJD-RULE-DATA",
          "INFRASTRUCTURE",
          "SOVEREIGN",
          "Sovereign data",
          "Majd data and operational knowledge must remain under sovereign platform control and must not create unnecessary external lock-in.",
          true,
          95
        ),

        this.rule(
          "MAJD-RULE-TEST",
          "AI",
          "SOVEREIGN",
          "Test before release",
          "Generated code must be validated, tested and repaired before a release is considered ready.",
          true,
          94
        ),

        this.rule(
          "MAJD-RULE-CONTINUITY",
          "AI",
          "OWNER",
          "Operational continuity",
          "Routine authorized development and operations should continue autonomously when OWNER is unavailable, under delegated sovereign authority.",
          true,
          93
        )
      ];

    const capabilities:
      MajdProductCapability[] = [
        this.capability(
          "majd-platform-core",
          "PLATFORM",
          "Majd Platform Core",
          "Build and maintain the complete Majd digital platform and its shared services.",
          true,
          true
        ),

        this.capability(
          "majd-web-frontend",
          "PLATFORM",
          "Majd Web Frontend",
          "Create responsive Majd user experiences for supported desktop, tablet and mobile devices.",
          true,
          true,
          ["majd-platform-core"]
        ),

        this.capability(
          "majd-backend",
          "PLATFORM",
          "Majd Backend",
          "Create APIs, business logic, service boundaries and server-side platform functionality.",
          true,
          true,
          ["majd-platform-core"]
        ),

        this.capability(
          "majd-database",
          "INFRASTRUCTURE",
          "Majd Data Layer",
          "Create schemas, persistence, migrations, indexes, integrity rules and data access required by Majd.",
          true,
          true,
          ["majd-backend"]
        ),

        this.capability(
          "majd-admin",
          "ADMIN",
          "Majd Administration",
          "Build the complete Majd administration and OWNER control experience.",
          true,
          true,
          [
            "majd-web-frontend",
            "majd-backend"
          ]
        ),

        this.capability(
          "majd-users",
          "PLATFORM",
          "Users and Identity",
          "Build registration, authentication, profiles, roles, permissions and account management.",
          true,
          true,
          [
            "majd-backend",
            "majd-database"
          ]
        ),

        this.capability(
          "majd-games",
          "GAMES",
          "Majd Games",
          "Design, generate, build, test, publish, operate and improve original Majd games.",
          true,
          true,
          [
            "majd-platform-core",
            "majd-backend"
          ]
        ),

        this.capability(
          "majd-game-runtime",
          "GAMES",
          "Game Runtime",
          "Provide runtime services required to execute and operate generated Majd games.",
          true,
          true,
          ["majd-games"]
        ),

        this.capability(
          "majd-game-factory",
          "GAMES",
          "Autonomous Game Creation",
          "Allow sovereign AI to transform OWNER game requirements into playable tested game builds.",
          true,
          true,
          [
            "majd-games",
            "majd-game-runtime"
          ]
        ),

        this.capability(
          "majd-social-feed",
          "SOCIAL",
          "Majd Social Feed",
          "Build original feeds for posts, discussions, reactions, sharing and discovery.",
          true,
          true,
          [
            "majd-users",
            "majd-backend"
          ]
        ),

        this.capability(
          "majd-short-video",
          "SOCIAL",
          "Majd Short Video",
          "Build an original Majd short-form vertical video experience with creation, viewing, discovery and engagement.",
          true,
          true,
          ["majd-social-feed"]
        ),

        this.capability(
          "majd-stories",
          "SOCIAL",
          "Majd Stories",
          "Build temporary visual story and moment-sharing experiences.",
          true,
          true,
          ["majd-users"]
        ),

        this.capability(
          "majd-micro-posts",
          "SOCIAL",
          "Majd Real-Time Posts",
          "Build concise real-time posting, following, discussion and discovery capabilities.",
          true,
          true,
          ["majd-social-feed"]
        ),

        this.capability(
          "majd-communities",
          "SOCIAL",
          "Majd Communities",
          "Build groups, communities, moderation and community interaction.",
          true,
          true,
          ["majd-social-feed"]
        ),

        this.capability(
          "majd-video",
          "MEDIA",
          "Majd Video",
          "Build long-form video publishing, viewing, channels, discovery and engagement.",
          true,
          true,
          [
            "majd-users",
            "majd-backend"
          ]
        ),

        this.capability(
          "majd-live",
          "MEDIA",
          "Majd Live",
          "Build live broadcasting, live events and real-time audience interaction.",
          true,
          true,
          ["majd-video"]
        ),

        this.capability(
          "majd-tv",
          "MEDIA",
          "Majd Television",
          "Build Majd-owned channels, scheduled programming, seasonal programming and streaming experiences.",
          true,
          true,
          ["majd-video"]
        ),

        this.capability(
          "majd-entertainment",
          "MEDIA",
          "Majd Entertainment",
          "Support original films, shows, events and other Majd media experiences.",
          false,
          true,
          ["majd-tv"]
        ),

        this.capability(
          "majd-wallet",
          "PAYMENTS",
          "Majd Wallet",
          "Build sovereign wallet accounting, balances, rewards, spending and refunds.",
          true,
          true,
          [
            "majd-users",
            "majd-database"
          ]
        ),

        this.capability(
          "majd-billing",
          "PAYMENTS",
          "Majd Billing",
          "Build subscription, package, invoice and internal billing capabilities.",
          true,
          true,
          ["majd-wallet"]
        ),

        this.capability(
          "majd-payments",
          "PAYMENTS",
          "Majd Payments",
          "Integrate approved payment methods while preserving sovereign internal billing and ledger control.",
          true,
          true,
          ["majd-billing"]
        ),

        this.capability(
          "majd-ledger",
          "PAYMENTS",
          "Majd Ledger",
          "Maintain auditable financial ledgers and required accounting separation.",
          true,
          true,
          ["majd-wallet"]
        ),

        this.capability(
          "majd-developers",
          "DEVELOPERS",
          "Majd Developer Platform",
          "Provide controlled developer publishing, tools, APIs and game/content submission workflows.",
          false,
          true,
          [
            "majd-users",
            "majd-admin"
          ]
        ),

        this.capability(
          "majd-ai-operations",
          "AI",
          "Majd AI Operations",
          "Operate Majd autonomously through sovereign planning, execution, monitoring, learning and repair.",
          true,
          true,
          ["majd-platform-core"]
        ),

        this.capability(
          "majd-monitoring",
          "INFRASTRUCTURE",
          "Majd Monitoring",
          "Monitor availability, performance, failures, security and operational health.",
          true,
          true,
          ["majd-platform-core"]
        ),

        this.capability(
          "majd-deployment",
          "INFRASTRUCTURE",
          "Majd Deployment",
          "Build, package, deploy, verify, update and roll back Majd releases.",
          true,
          true,
          [
            "majd-monitoring",
            "majd-ai-operations"
          ]
        ),

        this.capability(
          "majd-security",
          "SECURITY",
          "Majd Security",
          "Continuously enforce sovereign access control, security validation, auditing and defensive platform controls.",
          true,
          true,
          ["majd-platform-core"]
        )
      ];

    return {
      platform: {
        id: "MAJD",
        sovereignPlatform:
          "SOVEREIGN-AI-PLATFORM",
        productType:
          "GLOBAL_DIGITAL_PLATFORM",
        aiOperated: true,
        ownerAuthority:
          "SUPREME"
      },

      mission: [
        "Build Majd as a complete sovereign AI-operated global digital platform.",
        "Allow OWNER intent to be transformed into working platform capabilities without requiring manual implementation of every feature.",
        "Create and operate original Majd games.",
        "Create original Majd social and media experiences.",
        "Operate
