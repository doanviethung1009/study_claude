"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function getFriendlyLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const filename =
    typeof args.path === "string"
      ? (args.path.split("/").pop() ?? args.path)
      : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating file: ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing file: ${filename}`;
      case "view":
        return `Reading file: ${filename}`;
      case "undo_edit":
        return `Undoing edit: ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    const newFilename =
      typeof args.new_path === "string"
        ? (args.new_path.split("/").pop() ?? args.new_path)
        : "";
    switch (args.command) {
      case "rename":
        return `Renaming file: ${filename} → ${newFilename}`;
      case "delete":
        return `Deleting file: ${filename}`;
    }
  }

  return `Running tool: ${toolName}`;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const isDone = state === "result" && result != null;
  const label = getFriendlyLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
