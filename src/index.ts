#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { scanDirectory, ScanOptions } from "./scanner";
import { renderTree, TreeRenderOptions } from "./tree";
import { formatStats, toMarkdown, toJson } from "./formatter";

interface CliArgs {
  target: string;
  depth: number;
  ignore: string[];
  gitignore: boolean;
  onlyDirs: boolean;
  only: string[];
  showSize: boolean;
  showCount: boolean;
  markdown: boolean;
  json: boolean;
  flat: boolean;
  output: string | null;
  stats: boolean;
  color: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    target: ".",
    depth: 0,
    ignore: [],
    gitignore: true,
    onlyDirs: false,
    only: [],
    showSize: false,
    showCount: false,
    markdown: false,
    json: false,
    flat: false,
    output: null,
    stats: false,
    color: process.stdout.isTTY !== undefined,
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;

      case "--version":
      case "-v":
        console.log("dirtree v1.0.0");
        process.exit(0);
        break;

      case "--depth":
      case "-d":
        args.depth = parseInt(argv[++i], 10) || 0;
        break;

      case "--ignore":
      case "-i":
        args.ignore = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
        break;

      case "--gitignore":
        args.gitignore = true;
        break;

      case "--no-gitignore":
        args.gitignore = false;
        break;

      case "--only-dirs":
        args.onlyDirs = true;
        break;

      case "--only":
        args.only = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
        break;

      case "--size":
      case "-s":
        args.showSize = true;
        break;

      case "--count":
        args.showCount = true;
        break;

      case "--markdown":
      case "--md":
        args.markdown = true;
        args.color = false;
        break;

      case "--json":
        args.json = true;
        args.color = false;
        break;

      case "--flat":
        args.flat = true;
        break;

      case "-o":
      case "--output":
        args.output = argv[++i] || null;
        args.color = false;
        break;

      case "--stats":
        args.stats = true;
        break;

      case "--color":
        args.color = true;
        break;

      case "--no-color":
        args.color = false;
        break;

      default:
        if (!arg.startsWith("-")) {
          args.target = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
    i++;
  }

  return args;
}

function printHelp(): void {
  console.log(`
dirtree - Beautiful ASCII directory trees

USAGE:
  dirtree [path] [options]

OPTIONS:
  -h, --help            Show this help
  -v, --version         Show version
  -d, --depth <n>       Max depth (default: unlimited)
  -i, --ignore <list>   Comma-separated ignore patterns
  --gitignore           Respect .gitignore (default: true)
  --no-gitignore        Don't respect .gitignore
  --only-dirs           Show only directories
  --only <list>         Show only matching file patterns (e.g. "*.ts,*.js")
  -s, --size            Show file sizes
  --count               Show file count per directory
  --markdown, --md      Output as markdown code block
  --json                JSON output
  --flat                Flat list instead of tree
  -o, --output <file>   Save output to file
  --stats               Show summary stats
  --color               Force color output (default: auto)
  --no-color            Disable color output

EXAMPLES:
  dirtree                          Current directory
  dirtree /path/to/dir             Specific directory
  dirtree --depth 3                Limit depth
  dirtree --ignore "node_modules,dist,.git"
  dirtree --only "*.ts,*.js"       Only TypeScript and JS files
  dirtree --size --stats           Show sizes and summary
  dirtree --markdown -o tree.md    Export for README
`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const targetPath = path.resolve(args.target);

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: ${targetPath} does not exist`);
    process.exit(1);
  }

  if (!fs.statSync(targetPath).isDirectory()) {
    console.error(`Error: ${targetPath} is not a directory`);
    process.exit(1);
  }

  const scanOptions: ScanOptions = {
    depth: args.depth,
    ignore: args.ignore,
    gitignore: args.gitignore,
    onlyDirs: args.onlyDirs,
    only: args.only,
    showSize: args.showSize,
    showCount: args.showCount,
  };

  const { tree, stats } = scanDirectory(targetPath, scanOptions);

  let output: string;

  if (args.json) {
    const jsonData = toJson(tree, args.showSize, args.showCount);
    if (args.stats) {
      output = JSON.stringify({ tree: jsonData, stats }, null, 2);
    } else {
      output = JSON.stringify(jsonData, null, 2);
    }
  } else {
    const renderOptions: TreeRenderOptions = {
      showSize: args.showSize,
      showCount: args.showCount,
      color: args.color,
      flat: args.flat,
    };

    output = renderTree(tree, renderOptions);

    if (args.stats) {
      output += formatStats(stats);
    }

    if (args.markdown) {
      output = toMarkdown(output);
    }
  }

  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.writeFileSync(outPath, output + "\n", "utf-8");
    console.log(`Tree saved to ${outPath}`);
  } else {
    console.log(output);
  }
}

main();
