import { TreeNode } from "./scanner";
import { formatSize } from "./formatter";

export interface TreeRenderOptions {
  showSize: boolean;
  showCount: boolean;
  color: boolean;
  flat: boolean;
}

const BRANCH = "\u251C\u2500\u2500 ";
const LAST_BRANCH = "\u2514\u2500\u2500 ";
const VERTICAL = "\u2502   ";
const SPACE = "    ";

// ANSI colors
const BLUE = "\x1b[34;1m";
const WHITE = "\x1b[37m";
const GRAY = "\x1b[90m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function colorize(text: string, color: string, enabled: boolean): string {
  return enabled ? `${color}${text}${RESET}` : text;
}

function renderSuffix(node: TreeNode, options: TreeRenderOptions): string {
  const parts: string[] = [];

  if (options.showSize) {
    if (node.isDirectory && node.totalSize !== undefined) {
      parts.push(colorize(`[${formatSize(node.totalSize)}]`, CYAN, options.color));
    } else if (!node.isDirectory) {
      parts.push(colorize(`[${formatSize(node.size)}]`, CYAN, options.color));
    }
  }

  if (options.showCount && node.isDirectory && node.fileCount !== undefined) {
    parts.push(
      colorize(`(${node.fileCount} file${node.fileCount !== 1 ? "s" : ""})`, YELLOW, options.color)
    );
  }

  return parts.length > 0 ? " " + parts.join(" ") : "";
}

function getName(node: TreeNode, options: TreeRenderOptions): string {
  const name = node.isDirectory ? node.name + "/" : node.name;
  if (!options.color) return name;

  if (node.isDirectory) {
    return colorize(name, BLUE, true);
  }
  if (node.name.startsWith(".")) {
    return colorize(name, GRAY, true);
  }
  return colorize(name, WHITE, true);
}

export function renderTree(root: TreeNode, options: TreeRenderOptions): string {
  if (options.flat) {
    return renderFlat(root, options);
  }

  const lines: string[] = [];
  lines.push(getName(root, options) + renderSuffix(root, options));

  function walk(node: TreeNode, prefix: string): void {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      const connector = isLast ? LAST_BRANCH : BRANCH;
      const childPrefix = isLast ? SPACE : VERTICAL;

      lines.push(
        prefix + connector + getName(child, options) + renderSuffix(child, options)
      );

      if (child.isDirectory && child.children.length > 0) {
        walk(child, prefix + childPrefix);
      }
    }
  }

  walk(root, "");
  return lines.join("\n");
}

function renderFlat(root: TreeNode, options: TreeRenderOptions): string {
  const lines: string[] = [];

  function walk(node: TreeNode): void {
    const display = node.relativePath === "." ? node.name + "/" : node.relativePath;
    const suffix = renderSuffix(node, { ...options, color: false });
    lines.push(display + suffix);

    for (const child of node.children) {
      walk(child);
    }
  }

  walk(root);
  return lines.join("\n");
}
