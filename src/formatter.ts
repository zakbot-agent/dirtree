import { TreeNode } from "./scanner";
import { ScanStats } from "./scanner";

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

export function formatStats(stats: ScanStats): string {
  const lines = [
    "",
    "--- Stats ---",
    `Directories: ${stats.totalDirs}`,
    `Files:       ${stats.totalFiles}`,
    `Total size:  ${formatSize(stats.totalSize)}`,
  ];
  return lines.join("\n");
}

export function toMarkdown(treeOutput: string): string {
  return "```\n" + treeOutput + "\n```";
}

interface JsonNode {
  name: string;
  type: "directory" | "file";
  size?: number;
  fileCount?: number;
  children?: JsonNode[];
}

export function toJson(node: TreeNode, showSize: boolean, showCount: boolean): JsonNode {
  const result: JsonNode = {
    name: node.name,
    type: node.isDirectory ? "directory" : "file",
  };

  if (showSize) {
    if (node.isDirectory) {
      result.size = node.totalSize ?? 0;
    } else {
      result.size = node.size;
    }
  }

  if (showCount && node.isDirectory) {
    result.fileCount = node.fileCount ?? 0;
  }

  if (node.isDirectory && node.children.length > 0) {
    result.children = node.children.map((c) => toJson(c, showSize, showCount));
  }

  return result;
}
