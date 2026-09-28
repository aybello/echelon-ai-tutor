#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod/v4";
import { BridgeInputError, openBridge } from "./bridge.mjs";

function response(data) {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

function register(server, name, config, callback) {
  server.registerTool(name, config, async args => {
    try {
      return response(await callback(args));
    } catch (error) {
      const message =
        error instanceof BridgeInputError
          ? error.message
          : "Database connection or query failed.";
      return { isError: true, content: [{ type: "text", text: message }] };
    }
  });
}

async function main() {
  const bridge = await openBridge();
  const server = new McpServer({
    name: "echelon-question-review",
    version: "1.0.0",
  });
  const bank = z.enum(bridge.banks);
  register(
    server,
    "question_bank_summary",
    {
      description:
        "Metadata and counts by module and review status for an allowed question bank.",
      inputSchema: z.object({ bank: bank.default(bridge.banks[0]) }),
    },
    ({ bank }) => bridge.summary(bank)
  );
  register(
    server,
    "list_questions",
    {
      description:
        "Read up to 100 questions after a given question number. Continue with nextAfter.",
      inputSchema: z.object({
        bank: bank.default(bridge.banks[0]),
        after: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    },
    ({ bank, after, limit }) => bridge.list(bank, after, limit)
  );
  register(
    server,
    "get_question",
    {
      description: "Read one question by its number in an allowed bank.",
      inputSchema: z.object({
        bank: bank.default(bridge.banks[0]),
        number: z.number().int().min(1),
      }),
    },
    ({ bank, number }) => bridge.get(bank, number)
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stdin.on("end", () => {
    void bridge.close();
  });
}

main().catch(error => {
  process.stderr.write(
    `${error instanceof BridgeInputError ? error.message : "Database connection or query failed."}\n`
  );
  process.exitCode = 1;
});
