#!/usr/bin/env node
/**
 * 스토리가 전부 그려지는지 한 번에 확인한다 — 떠 있는 Storybook(npm run storybook)의 스토리 목록을 받아
 * 설치된 Chrome 을 헤드리스로 열어 DOM 을 읽는다(새 의존성 없음).
 *
 *   node scripts/storybook-smoke.mjs                 # 전부
 *   node scripts/storybook-smoke.mjs pages-notice    # id 가 이 글자로 시작하는 스토리만 (여러 개 가능)
 *
 * 실패: 오류 화면(sb-show-errordisplay)이 떴거나, 그린 게 아무것도 없음. 결과는 실패 목록과 이유.
 * 환경 변수: STORYBOOK_URL(기본 http://localhost:6006) · CHROME(크롬 실행 파일) · SMOKE_CONCURRENCY(기본 4)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 4);
const CHROME =
  process.env.CHROME ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find((p) => fs.existsSync(p));

if (!CHROME) {
  console.error('Chrome 을 못 찾았어요. CHROME=<실행 파일 경로> 로 알려 주세요.');
  process.exit(2);
}

const prefixes = process.argv.slice(2);
const index = await fetch(`${BASE}/index.json`).then((r) => r.json());
const stories = Object.values(index.entries).filter(
  (e) => e.type === 'story' && (prefixes.length === 0 || prefixes.some((p) => e.id.startsWith(p))),
);

function dumpDom(id, profile) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--window-size=390,844',
      `--user-data-dir=${profile}`,
      '--virtual-time-budget=20000',
      '--dump-dom',
      `${BASE}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`,
    ];
    const child = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    const timer = setTimeout(() => child.kill(), 90_000);
    child.on('close', () => {
      clearTimeout(timer);
      resolve(out);
    });
  });
}

function judge(html) {
  const body = /<body[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
  if (body.includes('sb-show-errordisplay')) {
    const msg = /<pre id="error-message"[^>]*>([\s\S]*?)<\/pre>/.exec(html)?.[1] ?? '';
    return `오류 화면: ${msg.replace(/<[^>]+>/g, '').trim().slice(0, 300)}`;
  }
  if (!body.includes('sb-show-main')) return `그리기가 끝나지 않음 (body: ${body || '없음'})`;
  const root = /<div id="storybook-root"[^>]*>([\s\S]*?)<\/div>\s*<div id="storybook-docs"/.exec(html)?.[1] ?? '';
  if (!root.trim()) return '그린 게 없음';
  return null;
}

const failures = [];
let done = 0;
const queue = [...stories];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async (_, worker) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), `sb-smoke-${worker}-`));
    for (let s = queue.shift(); s; s = queue.shift()) {
      const problem = judge(await dumpDom(s.id, profile));
      done += 1;
      if (problem) {
        failures.push({ id: s.id, problem });
        // 끝까지 못 가도(서버가 죽는 등) 실패한 것은 남게 바로 찍는다
        process.stdout.write(`\n✗ ${s.id}\n    ${problem}\n`);
      }
      process.stdout.write(`\r${done}/${stories.length} (실패 ${failures.length})`);
    }
    fs.rmSync(profile, { recursive: true, force: true });
  }),
);

console.log('');
if (failures.length) console.log('\n실패 목록:');
for (const f of failures) console.log(`✗ ${f.id}`);
console.log(failures.length ? `${failures.length}개 실패 / ${stories.length}개` : `${stories.length}개 모두 그려짐`);
process.exit(failures.length ? 1 : 0);
