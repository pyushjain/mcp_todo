import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

let todos = [];
let nextId = 1;

const addTodoInputSchema = {
  title: z.string().min(1),
};

const replyWithTodos = (message) => ({
  content: message ? [{ type: "text", text: message }] : [],
  structuredContent: { tasks: todos },
});

function createTodoServer() {
  const server = new McpServer({ name: "todo-app", version: "0.1.0" });
  server.registerTool(
    "complete_todo",

    {
      title: "Complete todo",
      description: "Marks a todo as done by id.",
      inputSchema: completeTodoInputSchema,
      _meta: {
        "openai/toolInvocation/invoking": "Completing todo",
        "openai/toolInvocation/invoked": "Completed todo",
      },
    },

    async (args) => {
      const id = args?.id;
      if (!id) return replyWithTodos("Missing todo id.");
      const todo = todos.find((task) => task.id === id);
      if (!todo) {
        return replyWithTodos(`Todo ${id} was not found.`);
      }
      todos = todos.map((task) =>
        task.id === id ? { ...task, completed: true } : task,
      );
      return replyWithTodos(`Completed "${todo.title}".`);
    },
  );
  return server;
}

const port = Number(process.env.PORT ?? 8787);

const httpServer = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (!req.url) {
    res.writeHead(400).end("Missing URL");

    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(
    `Todo MCP server listening on http://localhost:${port}, press Ctrl+C to stop`,
  );
});
