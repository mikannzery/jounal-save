import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, statSync } from "node:fs";

const root = fileURLToPath(new URL("..", import.meta.url));
const checkedExtensions = new Set([".css", ".ts", ".tsx"]);
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);
const mojibakePattern = /[縺繧譁隕蜀菫螟譛驕蠕邱]/u;
const checkedFiles = [];
const findings = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(`${directory}/${entry.name}`);
      }
      continue;
    }

    const path = `${directory}/${entry.name}`;
    const extension = entry.name.slice(entry.name.lastIndexOf("."));

    if (!checkedExtensions.has(extension) || !statSync(path).isFile()) {
      continue;
    }

    checkedFiles.push(path);
    const lines = readFileSync(path, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (mojibakePattern.test(line)) {
        findings.push(`${relative(root, path)}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

walk(root);

if (findings.length > 0) {
  console.error("Mojibake-like text was found:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(`mojibake check passed (${checkedFiles.length} files)`);
