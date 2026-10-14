// One-time port tool: converts the Claude Design prototype template (RyGuys App.dc.html)
// into React components under src/surfaces. Mirrors the prototype runtime's semantics
// (support.js) so the output renders identically. The generated files are the source of
// truth from here on; this script is kept for provenance.
import fs from 'node:fs';
import path from 'node:path';
import { parseFragment } from 'parse5';
import prettier from 'prettier';

const SRC = 'tools/source/RyGuys App.dc.html';
const OUT = 'src/surfaces';
const html = fs.readFileSync(SRC, 'utf8');
const a = html.indexOf('<x-dc>') + '<x-dc>'.length;
const b = html.indexOf('<script type="text/x-dc"');
let tpl = html.slice(a, b);

// ---- encode (same as runtime encodeCase) ----
const ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
tpl = tpl.replace(new RegExp('<(x-import|dc-import)(' + ATTRS + ')/>', 'gi'), (_, t, at) => '<' + t + at + '></' + t + '>');
tpl = tpl.replace(/<helmet(\s|>)/gi, '<sc-helmet$1').replace(/<\/helmet\s*>/gi, '</sc-helmet>');
const CAMEL = 'sc-camel-';
tpl = tpl.replace(/(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g, (_, sp, name, eq) => sp + CAMEL + name.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + eq);
const kebabToCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const frag = parseFragment(tpl);

// ---- expression translation (mirrors runtime resolve()) ----
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*/;
function parensWrapWhole(e) { let d = 0; for (let i = 0; i < e.length - 1; i++) { if (e[i] === '(') d++; else if (e[i] === ')') { d--; if (d === 0) return false; } } return true; }
function findEq(e) { let d = 0; for (let i = 0; i < e.length; i++) { const c = e[i]; if (c === '[' || c === '(') d++; else if (c === ']' || c === ')') d--; else if (d === 0 && (c === '=' || c === '!') && e[i + 1] === '=') { if (i > 0 && (e[i - 1] === '=' || e[i - 1] === '!')) continue; if (!e.slice(0, i).trim()) continue; return { index: i, op: e[i + 2] === '=' ? c + '==' : c + '=' }; } } return null; }
function tr(src, scope) {
  const e = String(src).trim();
  if (!e) return 'undefined';
  if (e[0] === '(' && e[e.length - 1] === ')' && parensWrapWhole(e)) return '(' + tr(e.slice(1, -1), scope) + ')';
  const eq = findEq(e);
  if (eq) return '(' + tr(e.slice(0, eq.index), scope) + ' ' + eq.op + ' ' + tr(e.slice(eq.index + eq.op.length), scope) + ')';
  if (e[0] === '!') return '!' + tr(e.slice(1), scope);
  if (['true', 'false', 'null', 'undefined'].includes(e)) return e;
  if (/^-?\d+(\.\d+)?$/.test(e)) return e;
  if (e.length >= 2 && (e[0] === '"' || e[0] === "'") && e[e.length - 1] === e[0]) return JSON.stringify(e.slice(1, -1));
  const head = e.match(IDENT);
  if (!head) throw new Error('bad expr: ' + e);
  let out = scope.includes(head[0]) ? head[0] : 'vm.' + head[0];
  let i = head[0].length;
  while (i < e.length) {
    if (e[i] === '.') { const m = e.slice(i + 1).match(IDENT) || e.slice(i + 1).match(/^\d+/); if (!m) throw new Error('bad path: ' + e); out += /^\d/.test(m[0]) ? '?.[' + m[0] + ']' : '?.' + m[0]; i += 1 + m[0].length; }
    else if (e[i] === '[') { let d = 1, j = i + 1; while (j < e.length && d > 0) { if (e[j] === '[') d++; else if (e[j] === ']') { d--; if (d === 0) break; } j++; } out += '?.[' + tr(e.slice(i + 1, j), scope) + ']'; i = j + 1; }
    else throw new Error('bad path: ' + e);
  }
  return out;
}
// attribute value → { kind: 'static'|'expr', code }
function attrVal(raw, scope) {
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) return { kind: 'expr', code: tr(whole[1], scope) };
  if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    return { kind: 'expr', code: '`' + parts.map((s, i) => i & 1 ? '${' + tr(s, scope) + ' ?? ""}' : s.replace(/[`\\$]/g, c => '\\' + c)).join('') + '`' };
  }
  return { kind: 'static', code: JSON.stringify(raw), raw };
}

// ---- hover (style-*) classes, importantified like the runtime ----
const hoverRules = new Map();
function importantify(css) { return css.split(';').map(d => d.trim()).filter(Boolean).map(d => /!\s*important$/i.test(d) ? d : d + ' !important').join(';'); }
function pseudoClass(pseudo, css) {
  const k = pseudo + '|' + css;
  if (!hoverRules.has(k)) hoverRules.set(k, 'px' + hoverRules.size.toString(36));
  return hoverRules.get(k);
}

const HOST_STYLE_PROPS = new Set(['position', 'left', 'right', 'top', 'bottom', 'inset', 'width', 'height', 'z-index', 'transform']);
function hostPos(css) {
  const keep = [];
  for (const decl of css.split(';')) { const i = decl.indexOf(':'); if (i < 0) continue; if (HOST_STYLE_PROPS.has(decl.slice(0, i).trim())) keep.push(decl.slice(0, i).trim() + ':' + decl.slice(i + 1).trim()); }
  return keep.join(';');
}

const EVENT_MAP = { onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onkeydown: 'onKeyDown', onscroll: 'onScroll' };
const getAttr = (el, n) => { const x = (el.attrs || []).find(t => t.name === n); return x ? x.value : null; };
const isEl = n => n.tagName !== undefined;
const elKids = n => (n.childNodes || []).filter(isEl);

// ---- extraction plan ----
const extracted = []; // { name, dir, node }
const marks = new Map(); // node → { name, dir }
function mark(node, name, dir) { marks.set(node, { name, dir }); }
function findAll(node, pred, acc = []) { for (const c of node.childNodes || []) { if (isEl(c)) { if (pred(c)) acc.push(c); findAll(c, pred, acc); } } return acc; }
const ifOf = flag => findAll(frag, n => n.tagName === 'sc-if' && (getAttr(n, 'value') || '').replace(/[{}\s]/g, '') === flag)[0];
const assertStyle = (n, sub) => { if (!(getAttr(n, 'style') || '').includes(sub)) throw new Error('shell not where expected: ' + sub); return n; };
// shells
const ios = findAll(frag, n => n.tagName === 'x-import' && getAttr(n, 'component-from-global-scope') === 'IOSDevice')[0];
mark(assertStyle(elKids(ios)[0], 'height:100%;background:#000'), 'CustomerApp', 'customer');
mark(assertStyle(elKids(elKids(elKids(ifOf('isPad'))[0])[0])[0], 'height:760px'), 'TechApp', 'tech');
mark(assertStyle(elKids(elKids(elKids(ifOf('isDesk'))[0])[0])[1], 'display:flex;height:800px'), 'ShopApp', 'shop');
mark(assertStyle(elKids(elKids(ifOf('isLobby'))[0])[0], 'width:1360px;height:765px'), 'LobbyBoard', 'lobby');
// screens
const used = new Set(['CustomerApp', 'TechApp', 'ShopApp', 'LobbyBoard']);
(function scan(node, inFor) {
  for (const c of node.childNodes || []) {
    if (!isEl(c)) continue;
    if (c.tagName === 'sc-if' && !inFor) {
      const flag = (getAttr(c, 'value') || '').replace(/[{}\s]/g, '');
      const m = flag.match(/^([ptd])([A-Z][A-Za-z0-9]*)$/);
      if (m) { let name = m[2]; const dir = { p: 'customer', t: 'tech', d: 'shop' }[m[1]]; while (used.has(dir + '/' + name)) name += 'Footer'; used.add(dir + '/' + name); mark(c, name, dir); }
    }
    scan(c, inFor || c.tagName === 'sc-for');
  }
})(frag, false);

// ---- JSX emit ----
const jsxText = s => (/^[^\s{}<>&'"\\][^{}<>&\n\\]*[^\s{}<>&\\]$|^[^\s{}<>&'"\\]$/.test(s) ? s : '{' + JSON.stringify(s) + '}');
const TRANSPARENT = n => n && (n.tagName === 'sc-if' || n.tagName === 'sc-for');
const blockish = n => { if (!n || !isEl(n)) return false; if (n.tagName === 'x-import') return getAttr(n, 'component-from-global-scope') !== 'IOSDevice'; if (n.tagName !== 'div') return false; const st = getAttr(n, 'style') || ''; return !st.includes('{{') && !/display:\s*inline/.test(st); };
// nearest rendered neighbour of a child, looking through sc-if / sc-for boundaries. Returns an element, 'edge' (start/end of a real element) or null (text).
function neighbour(parent, idx, dir) {
  const kids = parent.childNodes || [];
  for (let j = idx + dir; j >= 0 && j < kids.length; j += dir) {
    const k = kids[j];
    if (k.nodeName === '#text') { if (k.value.trim()) return null; continue; }
    if (!isEl(k)) continue;
    if (TRANSPARENT(k)) { const inner = neighbour(k, dir > 0 ? -1 : (k.childNodes || []).length, dir); if (inner === 'edge') continue; return inner; }
    return k;
  }
  if (TRANSPARENT(parent) && parent.parentNode) return neighbour(parent.parentNode, parent.parentNode.childNodes.indexOf(parent), dir);
  return 'edge';
}
function effectiveParent(n) { while (TRANSPARENT(n) && n.parentNode) n = n.parentNode; return n; }
function emitChildren(node, scope, ctx) {
  const kids = node.childNodes || [];
  const ep = effectiveParent(node);
  const parentStyle = isEl(ep) ? (getAttr(ep, 'style') || '') : '';
  const parentIsFlex = /(^|;)\s*display:\s*(flex|inline-flex|grid)/.test(parentStyle) && !parentStyle.includes('{{');
  const out = [];
  kids.forEach((c, idx) => {
    if (c.nodeName === '#text') {
      const txt = c.value;
      if (!txt.includes('{{')) {
        if (!txt.trim()) {
          if (!txt.includes(' ')) return; // runtime drops these
          // whitespace-only: has no effect inside flex/grid parents, or at the edges of a block div
          if (parentIsFlex) return;
          const pv = neighbour(node, idx, -1), nx = neighbour(node, idx, 1);
          const edgeOk = x => x === 'edge' && (ep.tagName === 'div' || !isEl(ep));
          if ((edgeOk(pv) || blockish(pv)) && (edgeOk(nx) || blockish(nx))) return; // between blocks: no rendered effect
          if (edgeOk(pv) || edgeOk(nx)) return; // leading/trailing whitespace of a block collapses away
          out.push('{" "}'); return;
        }
        out.push(jsxText(txt)); return;
      }
      const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
      parts.forEach((p, i) => { if (i & 1) out.push('{T(' + tr(p, scope) + ')}'); else if (p) out.push(jsxText(p)); });
      return;
    }
    if (!isEl(c)) return;
    out.push(emitNode(c, scope, ctx));
  });
  return out.join('\n');
}
function emitNode(el, scope, ctx) {
  const m = marks.get(el);
  if (m && !ctx.root.has(el)) {
    if (scope.length) throw new Error('extraction inside loop: ' + m.name);
    extracted.push({ ...m, node: el });
    ctx.imports.add(m.dir + '/' + m.name);
    if (el.tagName === 'sc-if') return '{' + tr(getAttr(el, 'value').replace(/^\s*\{\{|\}\}\s*$/g, ''), scope) + ' ? <' + m.name + ' vm={vm} /> : null}';
    return '<' + m.name + ' vm={vm} />';
  }
  const tag = el.tagName;
  if (tag === 'sc-helmet') return '';
  if (tag === 'sc-if') {
    const cond = tr(getAttr(el, 'value').replace(/^\s*\{\{|\}\}\s*$/g, ''), scope);
    return '{' + cond + ' ? (<>' + emitChildren(el, scope, ctx) + '</>) : null}';
  }
  if (tag === 'sc-for') {
    const as = getAttr(el, 'as') || 'item';
    if (['vm', 'T', 'L', 'css', 'val', 'React'].includes(as)) throw new Error('loop var clash: ' + as);
    const list = attrVal(getAttr(el, 'list') || '', scope).code;
    const idx = '_i' + (scope.length || '');
    return '{L(' + list + ').map((' + as + ', ' + idx + ') => (<React.Fragment key={' + idx + '}>' + emitChildren(el, scope.concat(as), ctx) + '</React.Fragment>))}';
  }
  if (tag === 'x-import') return emitImport(el, scope, ctx);
  // plain element
  const props = [];
  const classes = [];
  for (const { name, value } of el.attrs || []) {
    let key = name;
    if (key.startsWith(CAMEL)) key = kebabToCamel(key.slice(CAMEL.length));
    if (key.startsWith('hint-')) continue;
    if (key.startsWith('style-')) { classes.push(pseudoClass(key.slice(6), value)); continue; }
    if (key === 'class') { classes.unshift(value); continue; }
    if (key === 'for') key = 'htmlFor';
    else if (key === 'inputmode') key = 'inputMode';
    else if (key.startsWith('on')) key = EVENT_MAP[key] || 'on' + key[2].toUpperCase() + key.slice(3);
    if (key === 'src' && value.startsWith('uploads/')) { props.push('src="/' + value + '"'); continue; }
    const av = attrVal(value, scope);
    if (key === 'style') props.push('style={css(' + av.code + ')}');
    else if (key === 'value' || key === 'checked') props.push(key + '={val(' + av.code + (key === 'checked' ? ', false' : '') + ')}');
    else if (av.kind === 'static' && /^[A-Za-z0-9 _.,:;#%()\/+-]*$/.test(av.raw)) props.push(key + '="' + av.raw + '"');
    else props.push(key + '={' + av.code + '}');
  }
  if (classes.length) props.push('className="' + classes.join(' ') + '"');
  const open = '<' + tag + (props.length ? ' ' + props.join(' ') : '');
  const inner = emitChildren(el, scope, ctx);
  if (!inner.trim() || ['br', 'img', 'input'].includes(tag)) return open + ' />';
  return open + '>' + inner + '</' + tag + '>';
}
function emitImport(el, scope, ctx) {
  const name = getAttr(el, 'component-from-global-scope');
  const styleRaw = getAttr(el, 'style');
  const props = [];
  for (const { name: n0, value } of el.attrs || []) {
    let key = n0;
    if (key.startsWith(CAMEL)) key = kebabToCamel(key.slice(CAMEL.length));
    if (['component-from-global-scope', 'from', 'style'].includes(key) || key.startsWith('hint-')) continue;
    if (key.includes('-') && !(key.startsWith('aria-') || key.startsWith('data-'))) key = kebabToCamel(key);
    const av = attrVal(key === 'model' ? value.replace(/(^|\s)uploads\//g, '$1/uploads/') : value, scope);
    props.push(av.kind === 'static' ? key + '={' + av.code + '}' : key + '={' + av.code + '}');
  }
  const wrapStyle = styleRaw != null && hostPos(styleRaw) ? 'css(' + JSON.stringify(hostPos(styleRaw)) + ')' : '{ display: "contents" }';
  const inner = emitChildren(el, scope, ctx);
  let comp;
  if (name === 'IOSDevice') { ctx.imports.add('@IOSDevice'); comp = '<IOSDevice ' + props.join(' ') + '>' + inner + '</IOSDevice>'; }
  else { ctx.imports.add('@' + name); comp = '<' + name + ' ' + props.join(' ') + ' />'; }
  return '<div className="sc-host-x" style={' + wrapStyle + '}>' + comp + '</div>';
}

async function writeComponent(name, dir, node, isRootFrag) {
  const ctx = { imports: new Set(), root: new Set([node]) };
  let body;
  if (isRootFrag) body = emitChildren(node, [], ctx);
  else if (node.tagName === 'sc-if') body = emitChildren(node, [], ctx);
  else body = emitNode(node, [], ctx);
  const up = dir ? '../' : './';
  const lines = ["import React from 'react';", "import { T, L, css, val } from '" + (dir ? '../../' : '../') + "runtime/tpl.js';"];
  for (const imp of [...ctx.imports].sort()) {
    if (imp === '@IOSDevice') lines.push("import { IOSDevice } from '" + (dir ? '../../' : '../') + "components/IOSFrame.jsx';");
    else if (imp.startsWith('@')) lines.push("import '" + (dir ? '../../' : '../') + "components/" + imp.slice(1) + ".js';");
    else { const [d, n] = imp.split('/'); lines.push('import { ' + n + " } from '" + (d === dir ? './' : up + d + '/') + n + ".jsx';"); }
  }
  const code = lines.join('\n') + '\n\nexport function ' + name + '({ vm }) {\n  return (<>' + body + '</>);\n}\n';
  const file = path.join(OUT, dir || '', name + '.jsx');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let pretty;
  try { pretty = await prettier.format(code, { parser: 'babel', printWidth: 140, singleQuote: true }); }
  catch (e) { fs.writeFileSync(file + '.err', code); throw new Error(name + ': ' + e.message.slice(0, 600)); }
  fs.writeFileSync(file, pretty);
  return ctx;
}

// root (demo) first, then everything it pulled in, breadth-first
await writeComponent('Demo', '', frag, true);
for (let i = 0; i < extracted.length; i++) { const x = extracted[i]; await writeComponent(x.name, x.dir, x.node, false); }
fs.mkdirSync('src/styles', { recursive: true });
fs.writeFileSync('src/styles/hover.css', '/* Hover states from the prototype (style-hover attributes). */\n' + [...hoverRules].map(([k, cls]) => { const [pseudo, ...rest] = k.split('|'); return '.' + cls + ':' + pseudo + '{' + importantify(rest.join('|')) + '}'; }).join('\n') + '\n');
console.log('components:', extracted.length + 1, 'hover rules:', hoverRules.size);
console.log(extracted.map(x => x.dir + '/' + x.name).join(' '));
