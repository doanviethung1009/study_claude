import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getFriendlyLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// ── getFriendlyLabel unit tests ────────────────────────────────────────────────

test("getFriendlyLabel: str_replace_editor create", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })
  ).toBe("Creating file: Card.tsx");
});

test("getFriendlyLabel: str_replace_editor str_replace", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })
  ).toBe("Editing file: App.tsx");
});

test("getFriendlyLabel: str_replace_editor insert", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "insert", path: "src/index.tsx" })
  ).toBe("Editing file: index.tsx");
});

test("getFriendlyLabel: str_replace_editor view", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "view", path: "src/utils/helpers.ts" })
  ).toBe("Reading file: helpers.ts");
});

test("getFriendlyLabel: str_replace_editor undo_edit", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "undo_edit", path: "src/Button.tsx" })
  ).toBe("Undoing edit: Button.tsx");
});

test("getFriendlyLabel: file_manager rename", () => {
  expect(
    getFriendlyLabel("file_manager", {
      command: "rename",
      path: "src/OldName.tsx",
      new_path: "src/NewName.tsx",
    })
  ).toBe("Renaming file: OldName.tsx → NewName.tsx");
});

test("getFriendlyLabel: file_manager delete", () => {
  expect(
    getFriendlyLabel("file_manager", { command: "delete", path: "src/Unused.tsx" })
  ).toBe("Deleting file: Unused.tsx");
});

test("getFriendlyLabel: unknown tool falls back to tool name", () => {
  expect(getFriendlyLabel("some_other_tool", {})).toBe(
    "Running tool: some_other_tool"
  );
});

test("getFriendlyLabel: known tool with unknown command falls back", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "unknown_cmd", path: "src/file.tsx" })
  ).toBe("Running tool: str_replace_editor");
});

test("getFriendlyLabel: extracts basename from nested path", () => {
  expect(
    getFriendlyLabel("str_replace_editor", {
      command: "create",
      path: "a/b/c/d/MyComponent.tsx",
    })
  ).toBe("Creating file: MyComponent.tsx");
});

test("getFriendlyLabel: handles path with no slashes", () => {
  expect(
    getFriendlyLabel("str_replace_editor", { command: "create", path: "App.tsx" })
  ).toBe("Creating file: App.tsx");
});

// ── ToolCallBadge render tests ─────────────────────────────────────────────────

test("ToolCallBadge shows friendly label when done", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(screen.getByText("Creating file: Card.tsx")).toBeDefined();
});

test("ToolCallBadge shows green dot when state is result with result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.tsx" }}
      state="result"
      result="Success"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner when state is not result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when result is null even if state is result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.tsx" }}
      state="result"
      result={null}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when result is undefined", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/App.tsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge renders file_manager rename label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Renaming file: Old.tsx → New.tsx")).toBeDefined();
});

test("ToolCallBadge renders file_manager delete label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/Dead.tsx" }}
      state="result"
      result={{ success: true }}
    />
  );
  expect(screen.getByText("Deleting file: Dead.tsx")).toBeDefined();
});

test("ToolCallBadge renders fallback for unknown tool", () => {
  render(
    <ToolCallBadge
      toolName="mystery_tool"
      args={{}}
      state="result"
      result="done"
    />
  );
  expect(screen.getByText("Running tool: mystery_tool")).toBeDefined();
});
