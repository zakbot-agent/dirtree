import * as fs from "fs";
import * as path from "path";
import { createFilter, FilterOptions } from "./filter";

export interface TreeNode {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  children: TreeNode[];
  fileCount?: number;
  totalSize?: number;
}

export interface ScanOptions extends FilterOptions {
  depth: number;
  showSize: boolean;
  showCount: boolean;
}

export interface ScanStats {
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
}

function countFilesInDir(node: TreeNode): number {
  if (!node.isDirectory) return 0;
  let count = 0;
  for (const child of node.children) {
    if (!child.isDirectory) count++;
    else count += countFilesInDir(child);
  }
  return count;
}

function computeTotalSize(node: TreeNode): number {
  if (!node.isDirectory) return node.size;
  let total = 0;
  for (const child of node.children) {
    total += computeTotalSize(child);
  }
  return total;
}

export function scanDirectory(
  rootDir: string,
  options: ScanOptions
): { tree: TreeNode; stats: ScanStats } {
  const resolvedRoot = path.resolve(rootDir);
  const filter = createFilter(resolvedRoot, options);
  const stats: ScanStats = { totalFiles: 0, totalDirs: 0, totalSize: 0 };

  function scan(dir: string, depth: number): TreeNode {
    const name = path.basename(dir);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(dir);
    } catch {
      return {
        name,
        path: dir,
        relativePath: path.relative(resolvedRoot, dir),
        isDirectory: false,
        size: 0,
        children: [],
      };
    }

    const node: TreeNode = {
      name,
      path: dir,
      relativePath: path.relative(resolvedRoot, dir) || ".",
      isDirectory: stat.isDirectory(),
      size: stat.isDirectory() ? 0 : stat.size,
      children: [],
    };

    if (!stat.isDirectory()) {
      stats.totalFiles++;
      stats.totalSize += stat.size;
      return node;
    }

    stats.totalDirs++;

    if (options.depth > 0 && depth >= options.depth) {
      return node;
    }

    let entries: string[];
    try {
      entries = fs.readdirSync(dir).sort((a, b) => {
        // Directories first, then alphabetical
        const aPath = path.join(dir, a);
        const bPath = path.join(dir, b);
        let aIsDir = false;
        let bIsDir = false;
        try { aIsDir = fs.lstatSync(aPath).isDirectory(); } catch {}
        try { bIsDir = fs.lstatSync(bPath).isDirectory(); } catch {}
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });
    } catch {
      return node;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      let entryStat: fs.Stats;
      try {
        entryStat = fs.lstatSync(fullPath);
      } catch {
        continue;
      }

      const relativePath = path.relative(resolvedRoot, fullPath);
      if (!filter.shouldInclude(entry, relativePath, entryStat.isDirectory())) {
        continue;
      }

      const child = scan(fullPath, depth + 1);
      node.children.push(child);
    }

    if (options.showCount) {
      node.fileCount = countFilesInDir(node);
    }

    if (options.showSize && node.isDirectory) {
      node.totalSize = computeTotalSize(node);
    }

    return node;
  }

  const tree = scan(resolvedRoot, 0);
  return { tree, stats };
}
