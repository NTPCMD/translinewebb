import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const palette = require('tailwindcss/colors');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const theme = await readFile(path.join(root, 'portal/src/styles/theme.css'), 'utf8');
const tokens = Object.fromEntries([...theme.matchAll(/--([\w-]+):\s*(#[\da-f]{3,8})\s*;/gi)].map((match) => [match[1], match[2]]));

function rgb(hex) {
  if (!hex) return null;
  const value = hex.slice(1);
  const expanded = value.length === 3 ? [...value].map((digit) => digit + digit).join('') : value;
  return expanded.length === 6 ? [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16) / 255) : null;
}

function luminance(hex) {
  return rgb(hex)?.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function resolveColor(value) {
  if (value.includes('/')) return null; // Transparent overlays need their rendered backdrop.
  if (/^\[#[\da-f]{3,6}\]$/i.test(value)) return value.slice(1, -1);
  if (tokens[value]) return tokens[value];
  if (value === 'white' || value === 'black') return palette[value];
  const match = value.match(/^([a-z]+)-(\d+)$/);
  return match ? palette[match[1]]?.[match[2]] ?? null : null;
}

function classColor(classes, kind) {
  const values = [...classes.matchAll(new RegExp(`(?:^|\\s)${kind}-([^\\s]+)`, 'g'))];
  return values.map((match) => resolveColor(match[1])).filter(Boolean).at(-1);
}

function staticAttribute(opening, name) {
  const attribute = opening.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.getText() === name);
  return attribute && ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : null;
}

// This catches obvious source-level contrast and palette regressions, including
// dialog contents rendered outside the main workspace. Dynamic styles and
// translucent overlays still require the browser's visual/accessibility checks.
function inspect(file, code) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];
  const report = (node, message) => issues.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`);

  function walk(node, background = tokens.background) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName.getText(source);
      const classes = staticAttribute(opening, 'className');
      const hasDynamicClasses = classes === null && opening.attributes.properties.some((item) => ts.isJsxAttribute(item) && item.name.getText() === 'className');
      let surface = background;
      if (['Card', 'DialogContent', 'AlertDialogContent', 'SelectContent', 'PopoverContent', 'Input', 'Textarea', 'SelectTrigger'].includes(tag)) surface = tokens.card;
      const variant = staticAttribute(opening, 'variant');
      if ((tag === 'Button' && (!variant || variant === 'default')) || (tag === 'Badge' && !variant)) surface = tokens.primary;
      if (hasDynamicClasses) surface = null;
      if (classes !== null) surface = classColor(classes, 'bg') ?? surface;
      const foreground = classes === null ? null : classColor(classes, 'text');
      if (foreground && surface) {
        const light = luminance(foreground);
        const dark = luminance(surface);
        const contrast = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
        if (contrast < 3) report(opening, `Text/background contrast is only ${contrast.toFixed(2)}:1; use readable surface and foreground tokens.`);
      }
      // Attributes include conditional status-class helpers and need the same palette check.
      ts.forEachChild(opening.attributes, (child) => walk(child, surface));
      if (ts.isJsxElement(node)) node.children.forEach((child) => walk(child, surface));
      return;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || [ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail].includes(node.kind)) {
      for (const match of node.text.matchAll(/(?:^|\s)bg-([^\s]+)/g)) {
        const value = match[1];
        if (value.includes('/')) continue;
        const color = resolveColor(value);
        const channels = rgb(color);
        const darkNeutral = channels && luminance(color) < 0.15 && Math.max(...channels) - Math.min(...channels) < 0.12;
        const deepStatus = /^(?:red|green|blue|amber|yellow|orange|purple|emerald|cyan)-(?:900|950)$/.test(value);
        if (darkNeutral || deepStatus) report(node, `Dark operational surface bg-${value}; use a light surface or pale status treatment.`);
      }
    }
    ts.forEachChild(node, (child) => walk(child, background));
  }

  source.parseDiagnostics.forEach((diagnostic) => issues.push(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`));
  walk(source);
  return issues;
}

// Regression examples assert readable behaviour, without depending on any page's markup.
assert(inspect('white-on-card.tsx', '<Card><p className="text-white">42</p></Card>').some((issue) => issue.includes('contrast')));
assert(inspect('white-in-dialog.tsx', '<DialogContent><Input className="text-white" /></DialogContent>').some((issue) => issue.includes('contrast')));
assert(inspect('dark-panel.tsx', '<div className="bg-gray-900 text-gray-100">Details</div>').some((issue) => issue.includes('Dark operational surface')));
assert.deepEqual(inspect('readable.tsx', '<Card><p className="text-foreground">42</p><Badge className="bg-green-50 text-green-700">Online</Badge><Button className="bg-primary text-white">Save</Button></Card>'), []);

const supplied = process.argv.slice(2);
const files = supplied.length ? supplied : (await readdir(path.join(root, 'portal/src/pages')))
  .filter((file) => file.endsWith('.tsx') && file !== 'LoginPage.tsx')
  .map((file) => `portal/src/pages/${file}`);
const failures = (await Promise.all(files.map(async (file) => inspect(file, await readFile(path.resolve(root, file), 'utf8'))))).flat();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${files.length} operational pages checked for dark surfaces and obvious text-contrast regressions; regression examples passed.`);
}
