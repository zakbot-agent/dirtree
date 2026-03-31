import * as fs from "fs";
import * as path from "path";

export interface FilterOptions {
  ignore: string[];
  gitignore: boolean;
  onlyDirs: boolean;
  only: string[];
}

interface GitignoreRule {
  pattern: RegExp;
  negated: boolean;
  dirOnly: boolean;
}

function parseGitignoreLine(line: string): GitignoreRule | null {
  let trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  let negated = false;
  let dirOnly = false;

  if (trimmed.startsWith("!")) {
    negated = true;
    trimmed = trimmed.slice(1);
  }

  if (trimmed.endsWith("/")) {
    dirOnly = true;
    trimmed = trimmed.slice(0, -1);
  }

  // Remove leading slash (anchored to root)
  trimmed = trimmed.replace(/^\//, "");

  // Convert glob to regex
  const regexStr = trimmed
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  const pattern = new RegExp(`(^|/)${regexStr}($|/)`);

  return { pattern, negated, dirOnly };
}

function loadGitignoreRules(dir: string): GitignoreRule[] {
  const gitignorePath = path.join(dir, ".gitignore");
  const rules: GitignoreRule[] = [];

  try {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    for (const line of content.split("\n")) {
      const rule = parseGitignoreLine(line);
      if (rule) rules.push(rule);
    }
  } catch {
    // No .gitignore or can't read it
  }

  return rules;
}

function matchesGlob(name: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  return new RegExp(`^${regexStr}$`).test(name);
}

export function createFilter(rootDir: string, options: FilterOptions) {
  const gitignoreRules = options.gitignore ? loadGitignoreRules(rootDir) : [];

  // Always ignore .git directory
  const ignoreSet = new Set([...options.ignore, ".git"]);

  return {
    shouldInclude(
      name: string,
      relativePath: string,
      isDirectory: boolean
    ): boolean {
      // Check ignore list (exact name match)
      if (ignoreSet.has(name)) return false;

      // Check ignore patterns (glob)
      for (const pattern of options.ignore) {
        if (pattern.includes("*") && matchesGlob(name, pattern)) return false;
      }

      // Check gitignore rules
      for (const rule of gitignoreRules) {
        if (rule.dirOnly && !isDirectory) continue;
        const matches = rule.pattern.test(relativePath);
        if (matches && !rule.negated) return false;
      }

      // Only dirs filter
      if (options.onlyDirs && !isDirectory) return false;

      // Only matching files filter (directories always pass to allow traversal)
      if (options.only.length > 0 && !isDirectory) {
        const matchesAny = options.only.some((pattern) =>
          matchesGlob(name, pattern)
        );
        if (!matchesAny) return false;
      }

      return true;
    },
  };
}
