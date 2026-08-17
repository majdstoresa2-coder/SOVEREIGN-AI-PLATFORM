name: Sovereign Owner Command

on:
  workflow_dispatch:
    inputs:
      command:
        description: "OWNER COMMAND"
        required: true
        type: string

permissions:
  contents: write
  actions: read

jobs:
  owner-command:
    name: Execute Owner Command
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Sovereign AI Platform
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Install dependencies
        run: npm install

      - name: Verify Sovereign Components
        run: |
          test -f SOVEREIGN-AI-OWNER-COMMAND-GATEWAY-208.ts
          test -f SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts
          test -f SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts

          echo "Sovereign OWNER execution components verified."

      - name: Execute Sovereign Owner Command
        env:
          OWNER_COMMAND: ${{ inputs.command }}
        run: |
          cat > /tmp/sovereign-owner-command.ts <<'EOF'
          import SovereignAIOwnerCommandGateway from "${{ github.workspace }}/SOVEREIGN-AI-OWNER-COMMAND-GATEWAY-208.ts";

          import {
            createSovereignRealRuntime
          } from "${{ github.workspace }}/SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts";

          import type {
            SovereignMasterCommandEnvelope
          } from "${{ github.workspace }}/SOVEREIGN-AI-OWNER-COMMAND-GATEWAY-208.ts";

          async function main(): Promise<void> {
            const instruction =
              process.env.OWNER_COMMAND?.trim();

            if (!instruction) {
              throw new Error(
                "OWNER command is empty."
              );
            }

            const ownerId =
              "OWNER";

            const projectId =
              "SOVEREIGN-AI-PLATFORM";

            const runtime =
              createSovereignRealRuntime(
                ownerId,
                projectId
              );

            const gateway =
              new SovereignAIOwnerCommandGateway({
                async validateAuthority(
                  authority
                ): Promise<boolean> {
                  return authority === "OWNER";
                },

                async dispatch(
                  command:
                    SovereignMasterCommandEnvelope
                ): Promise<unknown> {
                  console.log(
                    "=========================================="
                  );

                  console.log(
                    "OWNER COMMAND DISPATCHED TO SOVEREIGN RUNTIME"
                  );

                  console.log(
                    "COMMAND ID:",
                    command.id
                  );

                  console.log(
                    "INSTRUCTION:",
                    command.instruction
                  );

                  console.log(
                    "=========================================="
                  );

                  return await runtime.launch(
                    command.instruction
                  );
                },

                async recordEvent(
                  event
                ): Promise<void> {
                  console.log(
                    "[SOVEREIGN OWNER EVENT]",
                    event.type,
                    event.commandId
                  );
                }
              });

            const receipt =
              await gateway.receive({
                authority:
                  "OWNER",

                instruction,

                projectId,

                priority:
                  100,

                autonomous:
                  true,

                constraints: [
                  "OWNER authority must remain SUPREME.",
                  "Do not weaken sovereign architecture.",
                  "Do not delete established sovereign core files."
                ],

                metadata: {
                  source:
                    "SOVEREIGN-OWNER-COMMAND-WORKFLOW",

                  executionMode:
                    "PRODUCTION"
                }
              });

            console.log(
              "=========================================="
            );

            console.log(
              "SOVEREIGN OWNER COMMAND RECEIPT"
            );

            console.log(
              "=========================================="
            );

            console.log(
              JSON.stringify(
                receipt,
                null,
                2
              )
            );

            if (
              !receipt.accepted ||
              receipt.status === "FAILED" ||
              receipt.status === "REJECTED"
            ) {
              throw new Error(
                `OWNER command failed: ${receipt.reason}`
              );
            }

            if (
              receipt.status !==
              "DISPATCHED"
            ) {
              throw new Error(
                `OWNER command was accepted but not dispatched. State: ${receipt.status}`
              );
            }

            console.log(
              "=========================================="
            );

            console.log(
              "SOVEREIGN OWNER COMMAND: SUCCESS"
            );

            console.log(
              "OWNER AUTHORITY: SUPREME"
            );

            console.log(
              "GATEWAY: ACCEPTED"
            );

            console.log(
              "RUNTIME: DISPATCHED"
            );

            console.log(
              "=========================================="
            );
          }

          main().catch(
            (
              error: unknown
            ) => {
              console.error(
                "=========================================="
              );

              console.error(
                "SOVEREIGN OWNER COMMAND FAILED"
              );

              console.error(
                "=========================================="
              );

              if (
                error instanceof Error
              ) {
                console.error(
                  error.stack ??
                  error.message
                );
              } else {
                console.error(
                  String(error)
                );
              }

              process.exit(1);
            }
          );
          EOF

          npx tsx /tmp/sovereign-owner-command.ts

      - name: Owner Command Complete
        if: success()
        run: |
          echo "=========================================="
          echo "SOVEREIGN OWNER COMMAND: SUCCESS"
          echo "OWNER AUTHORITY: SUPREME"
          echo "EXECUTION PIPELINE: COMPLETED"
          echo "=========================================="
