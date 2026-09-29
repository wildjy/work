#!/usr/bin/env node
/**
 * sync_runtime.js — 짝 프로젝트와 **공용 런타임 파일**이 벌어졌는지 보고, 원하는 방향으로 옮긴다.
 *
 *   npm run sync                          # 설정(package.json 의 pubSync.peers)의 짝과 비교
 *   npm run sync -- D:/ara-pub            # 짝을 직접 지정
 *   npm run sync -- --check               # 벌어졌으면 종료코드 1 (훅에 걸 때)
 *   npm run sync -- --pull prerender      # 짝 → 여기   (짝이 앞섰을 때)
 *   npm run sync -- --push prerender      # 여기 → 짝   (여기가 앞섰을 때)
 *   npm run sync -- --pull prerender --format    # 받은 뒤 이 프로젝트 prettier 까지
 *
 * ⚠ **이 파일은 두 프로젝트에 같은 내용으로 둔다.** 그래서 어느 쪽에서 작업하든 `npm run sync` 로
 *   확인·반영할 수 있다(스크립트 자신도 비교 대상에 들어 있어 벌어지면 알려 준다).
 *
 * 왜 「자동 복사」가 아니라 「검사 + 명시적 반영」인가
 *   개선이 **양방향으로** 일어난다. 26.09.28 하루에 실제로 둘 다 있었다 —
 *     · ara-pub → base : 하위 폴더 · 루트 상대경로 · sweepOrphans · toOutputLinks
 *     · base → ara-pub : <template> 주변 주석 정리(문구가 아니라 위치로 찾는다)
 *   한 방향 자동 복사는 그중 하나를 **조용히 지운다.**
 *
 * 비교 방법 — 주석 · 공백 · 따옴표 종류 · 꼬리 쉼표 · prettier 가 붙이는 return( ) 을 지우고 **로직만** 본다.
 *   두 프로젝트의 포매터 설정이 **정반대**라서다(base: 탭·CRLF / ara-pub: 스페이스·LF).
 *   byte 로는 늘 「다름」이 되지만 로직은 같을 수 있다 — 실제로 그랬다.
 *
 * ⚠ --format 은 **기본이 꺼져 있다.** 켜면 받은 파일이 이 프로젝트 서식으로 통째로 바뀐다
 *   (ara-pub 에서 prerender.js 에 돌리면 1,800여 줄이 움직인다). 서식은 각자 프로젝트가 알아서 갖고,
 *   sync 는 **로직만** 맞추는 도구다.
 *
 * ⚠ common.js 는 **대상이 아니다.** 두 프로젝트가 서로 다른 구현이다 —
 *   base 는 el.hidden + is-open, ara-pub 은 style.display 기반. 복사하면 UI 계층이 날아간다.
 *   대상을 늘릴 때는 「로직이 같아야 하는 파일인가」를 먼저 따진다.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HERE = path.basename(ROOT);

// 로직이 같아야 하는 파일 — 짧은 이름으로도 고를 수 있다(--pull prerender)
const FILES = [
	{ key: 'prerender', file: 'scripts/prerender.js' },
	{ key: 'dynamicImport', file: 'public/js/dynamicImport.js' },
	{ key: 'listRender', file: 'public/js/listRender.js' },
	// 이 도구 자신 — 한쪽에서만 고치면 다른 쪽이 낡는다
	{ key: 'sync', file: 'scripts/sync_runtime.js' },
];

const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const valueOf = (name) => {
	const i = args.indexOf('--' + name);
	return i >= 0 ? args[i + 1] : null;
};

/* ── 짝 프로젝트 찾기 ─────────────────────────────────
   ① 인자로 준 경로  ② package.json 의 pubSync.peers  ③ 없으면 안내만 하고 통과 */
function peers() {
	const taken = [valueOf('pull'), valueOf('push')].filter(Boolean);
	const direct = args.filter((a) => !a.startsWith('--') && !taken.includes(a));
	if (direct.length) return direct;
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
		return (pkg.pubSync && pkg.pubSync.peers) || [];
	} catch {
		return [];
	}
}

/* ── 로직만 남기는 정규화 ───────────────────────────── */
function logic(src) {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, ' ') // 블록 주석
		.replace(/^[ \t]*\/\/.*$/gm, ' ') // 줄 주석
		.replace(/\s+/g, '') // 공백·줄바꿈(탭/스페이스·CRLF/LF 차이를 없앤다)
		.replace(/['"]/g, '\u00a7') // 따옴표 종류
		.replace(/,(?=[)\]}])/g, '') // 꼬리 쉼표
		.replace(/return\(/g, 'return') // prettier 가 긴 return 에 붙이는 괄호
		.replace(/\)\u00a7\)/g, ')\u00a7'); // 그 닫는 괄호
}

function firstDiff(a, b) {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
	let j = 0;
	while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j += 1;
	return {
		before: a.slice(Math.max(0, i - 60), i),
		mine: a.slice(i, a.length - j).slice(0, 120),
		theirs: b.slice(i, b.length - j).slice(0, 120),
	};
}

function hasPrettier() {
	return fs.existsSync(path.join(ROOT, 'node_modules', 'prettier'));
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
	fs.mkdirSync(path.dirname(to), { recursive: true });
	fs.copyFileSync(from, to);
	console.log('\n  ✓ ' + entry.file);
	console.log('      ' + (dir === 'pull' ? '짝 → 여기' : '여기 → 짝') + '  :  ' + from);
	console.log('                      →  ' + to);

	if (dir === 'push') {
		console.log('\n  ⚠ 짝 프로젝트의 **서식은 그쪽 규칙**으로 맞추세요 — 여기와 설정이 다를 수 있습니다.');
		return;
	}
	if (!flag('format')) {
		console.log('\n  서식은 건드리지 않았습니다(로직만 맞추는 것이 이 도구의 일).');
		console.log('  이 프로젝트 서식으로 맞추려면 : npm run sync -- ... --pull ' + entry.key + ' --format');
		console.log('  ⚠ --format 은 파일 전체를 다시 찍습니다 — diff 가 수백~수천 줄이 될 수 있습니다.');
		// 받은 파일이 이 프로젝트 서식과 맞는지 **읽기만** 해서 알려 준다 — 고칠지는 사람이 정한다.
		// (두 프로젝트의 줄끝이 다르면 CRLF/LF 가 섞인 채로 남는다)
		if (hasPrettier()) {
			const chk = spawnSync('npx', ['prettier', '--check', entry.file], { cwd: ROOT, shell: true, encoding: 'utf8' });
			console.log(
				chk.status === 0
					? '  이 프로젝트 서식과 이미 맞습니다. ✓'
					: '  ⚠ 이 프로젝트 서식과 맞지 않습니다 — 줄끝·들여쓰기가 섞여 있을 수 있습니다.',
			);
		}
		return;
	}
	if (!hasPrettier()) {
		console.log('\n  ⚠ prettier 가 설치돼 있지 않아 --format 을 건너뜁니다.');
		return;
	}
	const r = spawnSync('npx', ['prettier', '--write', entry.file], { cwd: ROOT, shell: true, encoding: 'utf8' });
	console.log('\n  prettier ' + (r.status === 0 ? '적용 ✓' : '실패 — 직접 확인하세요'));
}

/* ── 사용법 — 벌어진 파일이 있을 때 끝에 붙여 바로 골라 쓰게 한다 ── */
function usage() {
	const keys = FILES.map((f) => f.key).join(' · ');
	const rows = [
		['npm run sync', '짝과 비교 (파일은 건드리지 않는다)'],
		['npm run sync -- --pull <키>', '짝 → 여기   (짝이 앞섰을 때)'],
		['npm run sync -- --push <키>', '여기 → 짝   (여기가 앞섰을 때)'],
		['npm run sync -- --pull <키> --format', '받은 뒤 이 프로젝트 prettier 까지 (파일 전체가 다시 찍힌다)'],
		['npm run sync -- --check', '벌어졌으면 종료코드 1 (훅에 걸 때)'],
		['npm run sync -- <경로> ...', '짝을 직접 지정 (다른 PC · 짝이 여러 개일 때)'],
	];
	console.log('  ── 사용할 수 있는 명령 ─────────────────────────────');
	// 한글은 터미널에서 두 칸이라 padEnd 로는 줄이 어긋난다 — 보이는 폭으로 맞춘다
	const wide = (cp) =>
		(cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3000 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7af);
	const width = (s) => [...s].reduce((n, c) => n + (wide(c.codePointAt(0)) ? 2 : 1), 0);
	rows.forEach(([cmd, desc]) => console.log('    ' + cmd + ' '.repeat(Math.max(1, 40 - width(cmd))) + desc));
	console.log('\n    <키> : ' + keys);
	console.log('    받거나 보낸 뒤에는 npm run sync 로 다시 비교하고, 산출물은 npm run prerender 로 새로 만든다.\n');
}

/* ── 실행 ───────────────────────────────────────────── */
const list = peers();
if (!list.length) {
	console.log('\n  짝 프로젝트가 지정되지 않았습니다 — 비교를 건너뜁니다.');
	console.log('    npm run sync -- <경로>');
	console.log('    또는 package.json 에 "pubSync": { "peers": ["../다른프로젝트"] }\n');
	process.exit(0);
}

const pull = valueOf('pull');
const push = valueOf('push');
if (pull || push) {
	const key = pull || push;
	const entry = FILES.find((f) => f.key === key || f.file === key || f.file.endsWith('/' + key));
	if (!entry) {
		console.error('  ✗ 대상을 모르겠습니다: ' + key);
		console.error('    고를 수 있는 것 : ' + FILES.map((f) => f.key).join(' · '));
		process.exit(1);
	}
	if (list.length > 1) {
		console.error('  ✗ 짝이 여러 개입니다 — 복사할 때는 하나만 지정하세요: ' + list.join(' , '));
		process.exit(1);
	}
	copy(entry, path.resolve(list[0]), pull ? 'pull' : 'push');
	process.exit(0);
}

let drift = 0;
for (const peer of list) {
	const abs = path.resolve(peer);
	console.log('\n  여기: ' + HERE + '   ↔   짝: ' + abs);
	if (!fs.existsSync(abs)) {
		console.log('    ⚠ 경로가 없습니다 — 건너뜁니다.');
		continue;
	}
	for (const entry of FILES) {
		const here = path.join(ROOT, entry.file);
		const there = path.join(abs, entry.file);
		if (!fs.existsSync(here) || !fs.existsSync(there)) {
			const which = fs.existsSync(here) ? '짝에 없습니다' : '여기에 없습니다';
			console.log('    ? ' + entry.file.padEnd(28) + which);
			drift += 1;
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
		console.log('    ✗ ' + entry.file.padEnd(28) + '로직 다름  (여기 ' + a.length + ' / 짝 ' + b.length + ')');
		console.log('        문맥 …' + d.before);
		console.log('        여기 : ' + (d.mine || '(없음)'));
		console.log('        짝   : ' + (d.theirs || '(없음)'));
		console.log('        짝이 맞다면 : npm run sync -- ' + peer + ' --pull ' + entry.key);
		console.log('        여기가 맞다면 : npm run sync -- ' + peer + ' --push ' + entry.key);
	}
}

if (drift) {
	console.log('\n  벌어진 파일 ' + drift + '개 — 어느 쪽이 맞는지 보고 --pull / --push 로 옮기세요.');
	console.log('  ⚠ 자동으로 덮지 않습니다. 개선이 양방향으로 일어나기 때문입니다(머리 주석 참고).\n');
	usage();
	if (flag('check')) process.exit(1);
} else {
	console.log('\n  모두 동일합니다. ✓\n');
}
