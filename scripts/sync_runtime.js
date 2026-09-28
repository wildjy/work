#!/usr/bin/env node
/**
 * sync_runtime.js — 파생 프로젝트와 **공용 런타임 파일**이 벌어졌는지 본다.
 *
 *   npm run sync                       # 설정에 적힌 상대 프로젝트와 비교
 *   npm run sync -- D:/ara-pub         # 상대를 직접 지정
 *   npm run sync -- --check            # 벌어졌으면 종료코드 1 (훅에 걸 때)
 *   npm run sync -- --pull prerender   # 상대 것을 여기로 복사 + prettier
 *   npm run sync -- --push prerender   # 여기 것을 상대로 복사 (상대 서식은 상대가 맡는다)
 *
 * 왜 「복사 자동화」가 아니라 「검사」인가
 *   개선이 **양방향으로** 일어난다. 실제로 26.09.28 에 그랬다 —
 *     · 파생(ara-pub) → base : 하위 폴더 · 루트 상대경로 · sweepOrphans · toOutputLinks
 *     · base → 파생 : <template> 주변 주석 정리(문구가 아니라 위치로 찾는다)
 *   한 방향 자동 복사는 그중 하나를 **조용히 지운다.** 그래서 벌어진 사실만 알리고,
 *   옮기는 것은 --pull/--push 로 **사람이 방향을 정해** 한다.
 *
 * 비교 방법
 *   주석 · 공백 · 따옴표 종류 · 꼬리 쉼표 · prettier 가 붙이는 return( ) 을 지우고 **로직만** 본다.
 *   두 프로젝트의 포매터 설정이 달라(여기는 prettier 탭·단일따옴표) byte 비교는 늘 「다름」이 된다.
 *
 * ⚠ common.js 는 **대상이 아니다.** 두 프로젝트가 서로 다른 구현이다 —
 *   여기는 el.hidden + is-open, ara-pub 은 style.display 기반. 복사하면 UI 계층이 날아간다.
 *   대상을 늘릴 때는 「로직이 같아야 하는 파일인가」를 먼저 따진다.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// 로직이 같아야 하는 파일 — 짧은 이름으로도 고를 수 있다(--pull prerender)
const FILES = [
	{ key: 'prerender', file: 'scripts/prerender.js' },
	{ key: 'dynamicImport', file: 'public/js/dynamicImport.js' },
	{ key: 'listRender', file: 'public/js/listRender.js' },
];

const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const valueOf = (name) => {
	const i = args.indexOf('--' + name);
	return i >= 0 ? args[i + 1] : null;
};

/* ── 상대 프로젝트 찾기 ─────────────────────────────────
   ① 인자로 준 경로  ② package.json 의 pubSync.peers  ③ 없으면 안내만 하고 통과 */
function peers() {
	const direct = args.filter((a) => !a.startsWith('--') && a !== valueOf('pull') && a !== valueOf('push'));
	if (direct.length) return direct;
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
		const list = (pkg.pubSync && pkg.pubSync.peers) || [];
		return list;
	} catch {
		return [];
	}
}

/* ── 로직만 남기는 정규화 ───────────────────────────── */
function logic(src) {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, ' ') // 블록 주석
		.replace(/^[ \t]*\/\/.*$/gm, ' ') // 줄 주석
		.replace(/\s+/g, '') // 공백·줄바꿈
		.replace(/['"]/g, '\u00a7') // 따옴표 종류
		.replace(/,(?=[)\]}])/g, '') // 꼬리 쉼표
		.replace(/return\(/g, 'return') // prettier 가 붙이는 return( )
		.replace(/\)\u00a7\)/g, ')\u00a7'); // 그 닫는 괄호
}

function firstDiff(a, b) {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
	let j = 0;
	while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j += 1;
	return {
		at: i,
		before: a.slice(Math.max(0, i - 60), i),
		mine: a.slice(i, a.length - j).slice(0, 120),
		theirs: b.slice(i, b.length - j).slice(0, 120),
	};
}

/* ── 복사 ───────────────────────────────────────────── */
function copy(entry, peer, dir) {
	const here = path.join(ROOT, entry.file);
	const there = path.join(peer, entry.file);
	const [from, to] = dir === 'pull' ? [there, here] : [here, there];
	if (!fs.existsSync(from)) {
		console.error('  ✗ 원본이 없습니다: ' + from);
		process.exit(1);
	}
	fs.copyFileSync(from, to);
	console.log('  ✓ ' + (dir === 'pull' ? '← ' : '→ ') + entry.file + '  (' + from + ' → ' + to + ')');
	// 받는 쪽 서식은 받는 쪽이 맡는다. 여기로 가져왔으면 prettier 를 돌린다.
	if (dir === 'pull') {
		const r = spawnSync('npx', ['prettier', '--write', entry.file], { cwd: ROOT, shell: true, encoding: 'utf8' });
		console.log('    prettier ' + (r.status === 0 ? 'OK' : '실패 — 직접 확인하세요'));
	} else {
		console.log('    ⚠ 상대 프로젝트의 서식은 그쪽 규칙으로 맞추세요(여기 prettier 설정이 다를 수 있습니다).');
	}
}

/* ── 실행 ───────────────────────────────────────────── */
const list = peers();
if (!list.length) {
	console.log('\n  상대 프로젝트가 지정되지 않았습니다 — 비교를 건너뜁니다.');
	console.log('    npm run sync -- <경로>          예) npm run sync -- D:/ara-pub');
	console.log('    또는 package.json 에 "pubSync": { "peers": ["D:/ara-pub"] }\n');
	process.exit(0);
}

const pull = valueOf('pull');
const push = valueOf('push');
if (pull || push) {
	const key = pull || push;
	const entry = FILES.find((f) => f.key === key || f.file === key || f.file.endsWith('/' + key));
	if (!entry) {
		console.error('  ✗ 대상을 모르겠습니다: ' + key + '\n    고를 수 있는 것 : ' + FILES.map((f) => f.key).join(' · '));
		process.exit(1);
	}
	if (list.length > 1) {
		console.error('  ✗ 상대가 여러 개입니다 — 복사할 때는 하나만 지정하세요: ' + list.join(' , '));
		process.exit(1);
	}
	copy(entry, path.resolve(list[0]), pull ? 'pull' : 'push');
	process.exit(0);
}

let drift = 0;
for (const peer of list) {
	const abs = path.resolve(peer);
	console.log('\n  ' + path.basename(ROOT) + '  ↔  ' + abs);
	if (!fs.existsSync(abs)) {
		console.log('    ⚠ 경로가 없습니다 — 건너뜁니다.');
		continue;
	}
	for (const entry of FILES) {
		const here = path.join(ROOT, entry.file);
		const there = path.join(abs, entry.file);
		if (!fs.existsSync(here) || !fs.existsSync(there)) {
			console.log('    ? ' + entry.file.padEnd(28) + '한쪽에 없습니다');
			continue;
		}
		const a = logic(fs.readFileSync(here, 'utf8'));
		const b = logic(fs.readFileSync(there, 'utf8'));
		if (a === b) {
			console.log('    ✓ ' + entry.file.padEnd(28) + '로직 동일');
			continue;
		}
		drift += 1;
		const d = firstDiff(a, b);
		console.log('    ✗ ' + entry.file.padEnd(28) + '로직 다름  (여기 ' + a.length + ' / 상대 ' + b.length + ')');
		console.log('        문맥 …' + d.before);
		console.log('        여기 : ' + (d.mine || '(없음)'));
		console.log('        상대 : ' + (d.theirs || '(없음)'));
		console.log('        옮기려면 : npm run sync -- ' + peer + ' --pull ' + entry.key + '   (또는 --push)');
	}
}

if (drift) {
	console.log('\n  벌어진 파일 ' + drift + '개 — 어느 쪽이 맞는지 보고 --pull / --push 로 옮기세요.');
	console.log('  ⚠ 자동으로 덮지 않습니다. 개선이 양방향으로 일어나기 때문입니다(머리 주석 참고).\n');
	if (flag('check')) process.exit(1);
} else {
	console.log('\n  모두 동일합니다. ✓\n');
}
