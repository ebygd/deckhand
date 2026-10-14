#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAILS = ['well', 'timeline', 'none'];
const HELP = `Create a self-contained deck folder.

Usage:
  npm run new -- <target-folder> [--title "Talk title"] [--theme well-log] [--rail timeline|well|none] [--force]

Options:
  --title   Deck title (default: derived from the folder name)
  --theme   Theme folder in themes/ (default: well-log)
  --rail    Progress rail: timeline, well or none (default: timeline)
  --force   Write into a folder that already has files
`;

function parseArgs(argv) {
  const options = { theme: 'well-log', rail: 'timeline', force: false, positional: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--title' || arg === '--theme' || arg === '--rail') options[arg.slice(2)] = argv[++index];
    else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
    else options.positional.push(arg);
  }
  return options;
}

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const titleFromFolder = (folder) => {
  const words = basename(folder).replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Untitled talk';
};

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.positional.length) {
    console.log(HELP);
    process.exit(options.help ? 0 : 1);
  }
  const callerDir = process.env.INIT_CWD || process.cwd();
  const target = resolve(callerDir, options.positional[0]);
  const themeDir = join(ROOT, 'themes', options.theme);
  if (!existsSync(join(themeDir, 'theme.css'))) {
    const themes = readdirSync(join(ROOT, 'themes')).join(', ');
    throw new Error(`Theme "${options.theme}" not found. Available: ${themes}`);
  }
  if (!RAILS.includes(options.rail)) throw new Error(`Rail must be one of: ${RAILS.join(', ')}`);
  if (existsSync(target) && readdirSync(target).length && !options.force) {
    throw new Error(`${target} is not empty. Use --force to write into it anyway.`);
  }

  const title = options.title || titleFromFolder(target);
  mkdirSync(join(target, 'assets'), { recursive: true });
  cpSync(join(ROOT, 'engine'), join(target, 'engine'), { recursive: true });
  cpSync(themeDir, join(target, 'theme'), { recursive: true });

  const fill = (text) => text.replaceAll('{{TITLE}}', escapeHtml(title)).replaceAll('{{RAIL}}', options.rail);
  writeFileSync(join(target, 'index.html'), fill(readFileSync(join(ROOT, 'templates', 'starter', 'index.html'), 'utf8')));
  writeFileSync(join(target, 'script.md'), readFileSync(join(ROOT, 'templates', 'starter', 'script.md'), 'utf8').replaceAll('{{TITLE}}', title));
  if (!existsSync(join(target, '.gitignore'))) writeFileSync(join(target, '.gitignore'), '.verify/\n');

  const shown = relative(callerDir, target) || '.';
  console.log(`Created "${title}" in ${target}
  theme: ${options.theme}   rail: ${options.rail}

Next:
  1. Edit ${join(shown, 'index.html')} (see docs/components.md and docs/slide-patterns.md)
  2. Check it:  npm run verify -- ${shown}
  3. Present:   open ${join(shown, 'index.html')} in Chrome or Edge, press F, then P`);
}

try {
  main();
} catch (error) {
  console.error(`new-deck: ${error.message}`);
  process.exit(1);
}
