# dirtree

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)

> Generate beautiful ASCII directory trees. Like 'tree' but configurable, with filters and markdown export.

## Features

- CLI tool
- TypeScript support

## Tech Stack

**Runtime:**
- TypeScript

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
cd dirtree
npm install
```

Or install globally:

```bash
npm install -g dirtree
```

## Usage

### CLI

```bash
dirtree
```

### Available Scripts

| Script | Command |
|--------|---------|
| `npm run build` | `tsc` |
| `npm run start` | `node dist/index.js` |

## Project Structure

```
├── src
│   ├── filter.ts
│   ├── formatter.ts
│   ├── index.ts
│   ├── scanner.ts
│   └── tree.ts
├── package.json
├── README.md
└── tsconfig.json
```

## License

This project is licensed under the **MIT** license.

## Author

**Zakaria Kone**
