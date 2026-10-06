#!/usr/bin/env node
/**
 * verify_prerender.js — 파셜 · 공통 UI 를 고친 뒤 「산출물 마크업 · 화면이 그대로인가」를 확인한다 (26.09.30)
 *
 *   pnpm run verify -- snap <이름>               # 지금 산출물(public/prerender)을 .verify/<이름>/ 에 보관
 *   pnpm run verify -- cmp <이름>                # 보관본과 지금 산출물을 대조
 *   pnpm run verify -- shots <이름> [폴더…]      # 산출물 화면 캡처 → .verify/shots-<이름>/  (기본 : 전 폴더)
 *   pnpm run verify -- shots-cmp <이름A> <이름B>  # 두 캡처 묶음을 픽셀(파일) 단위로 비교
 *
 * 순서 : 고치기 전 snap + shots a → 고치기 → pnpm run prerender → cmp → shots b → shots-cmp a b
 *        캡처가 다른 페이지가 cmp 에서 「같음」이면 매번 달라지는 페이지(애니메이션 · 여는 레이어)다 — 한 번 더 찍어 가려낸다.
 *
 * cmp 가 무시하는 것 — 공백 · 주석 · template 정의 · 빈 속성(id · name · value · class · placeholder = "") ·
 *   class 끝 공백 · 속성 순서 · 빈 태그의 닫는 빗금(/>) · 닫는 태그 안 공백(prettier 가 인라인 요소를 끊은 자리). 화면에 영향이 없는 차이다.
 *   그 밖의 차이가 하나라도 있으면 그 파일과 첫 차이 지점을 찍는다(종료코드 1).
 * ⚠ 캡처는 산출물을 찍는다 — 캡처가 도는 동안 프리렌더를 돌리지 않는다.
 * ⚠ Chrome 이 필요하다(CHROME 환경변수 또는 기본 설치 경로). 서버는 serve.js 와 같은 버전 · 설정으로 임시 포트에 띄웠다 끈다.
 * 결과물 .verify/ 는 .gitignore 대상이다. (ara-pub 의 verify_partialize.js 를 범용으로 옮긴 것)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'prerender');
const BOX = path.join(ROOT, '.verify');
const SERVE = 'serve@14.2.6';
// ⚠ 홀로 선 `--` 는 걷어낸다 — pnpm 은 `pnpm run verify -- snap a` 의 `--` 를 **스크립트에 그대로 넘긴다**(npm 은 뗀다).
//    걷어내지 않으면 cmd 자리에 '--' 가 들어가 「모르는 명령」으로 끝난다.
const [cmd, ...rest] = process.argv.slice(2).filter((a) => a !== '--');

function walk(d, base = d, acc = []) {
	for (const f of fs.readdirSync(d)) {
		const p = path.join(d, f);
		if (fs.statSync(p).isDirectory()) walk(p, base, acc);
		else if (f.endsWith('.html')) acc.push(path.relative(base, p));
	}
	return acc;
}

function copyDir(a, b) {
	fs.rmSync(b, { recursive: true, force: true });
	for (const f of walk(a)) {
		fs.mkdirSync(path.dirname(path.join(b, f)), { recursive: true });
		fs.copyFileSync(path.join(a, f), path.join(b, f));
	}
}

// 여는 태그의 속성을 정렬하고 화면에 영향 없는 빈 속성을 뺀다
const sortAttrs = (s) =>
	s.replace(/<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/g, (m, tag, attrs) => {
		const list = (attrs.match(/[\w-]+(?:="[^"]*")?/g) || [])
			.filter((a) => !/^(id|name|value|class|placeholder)=""$/.test(a))
			.map((a) => a.replace(/^class="([^"]*?)\s+"$/, 'class="$1"'));
		return '<' + tag + (list.length ? ' ' + list.sort().join(' ') : '') + '>';
	});

const norm = (s) =>
	sortAttrs(
		s
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<template[\s\S]*?<\/template>/g, '')
			.replace(/\s*\/>/g, '>')
			.replace(/<\/([a-zA-Z][\w-]*)\s+>/g, '</$1>')
			.replace(/\s+/g, ' ')
			.replace(/>\s+/g, '>')
			.replace(/\s+</g, '<'),
	);

function cmpSnap(name) {
	const snap = path.join(BOX, name);
	if (!fs.existsSync(snap)) throw new Error('보관본이 없다 : ' + name + ' (먼저 snap)');
	const files = walk(OUT);
	let raw = 0;
	let normSame = 0;
	const diff = [];
	for (const f of files) {
		const o = path.join(snap, f);
		if (!fs.existsSync(o)) {
			diff.push(f + ' (새 파일)');
			continue;
		}
		const A = fs.readFileSync(o, 'utf8');
		const B = fs.readFileSync(path.join(OUT, f), 'utf8');
		if (A === B) {
			raw++;
			continue;
		}
		const a = norm(A);
		const b = norm(B);
		if (a === b) {
			normSame++;
			continue;
		}
		let i = 0;
		while (a[i] === b[i]) i++;
		diff.push(
			f + '\n    전 : ' + a.slice(Math.max(0, i - 90), i + 130) + '\n    후 : ' + b.slice(Math.max(0, i - 90), i + 130),
		);
	}
	for (const f of walk(snap)) if (!fs.existsSync(path.join(OUT, f))) diff.push(f + ' (사라진 파일)');
	console.log(
		'산출물 ' +
			files.length +
			' · 글자까지 같음 ' +
			raw +
			' · 공백 · 빈 속성 · 속성 순서만 다름 ' +
			normSame +
			' · 다름 ' +
			diff.length,
	);
	diff.forEach((d) => console.log('다름 ' + d));
	if (diff.length) process.exitCode = 1;
}

function chrome() {
	const list = [
		process.env.CHROME,
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/usr/bin/google-chrome',
	].filter(Boolean);
	const c = list.find((p) => fs.existsSync(p));
	if (!c) throw new Error('Chrome 을 찾지 못했다 — CHROME 환경변수로 경로를 준다');
	return c;
}

const waitServer = (port) =>
	new Promise((resolve, reject) => {
		let n = 0;
		const tick = () =>
			http
				.get('http://localhost:' + port + '/', () => resolve())
				.on('error', () => (++n > 40 ? reject(new Error('서버가 뜨지 않는다')) : setTimeout(tick, 500)));
		tick();
	});

async function shots(name, folders) {
	const dir = path.join(BOX, 'shots-' + name);
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
	const port = 3700 + Math.floor(Math.random() * 200);
	const conf = path.join(ROOT, 'scripts', 'serve.json');
	// ⚠ 여기만 npx 를 쓴다 — 설치하지 않은 패키지를 한 번 받아 쓰는 자리라, **노드에 딸려 온다**는 점이 중요하다.
	//    (pnpm dlx 로 바꾸면 pnpm 이 PATH 에 없는 환경에서 로컬 서버가 아예 안 뜬다)
	const server = spawn('npx', ['--yes', SERVE, 'public', '-l', String(port), '-c', conf], {
		cwd: ROOT,
		shell: true,
		stdio: 'ignore',
	});
	try {
		await waitServer(port);
		const pages = walk(OUT).filter((f) => !folders.length || folders.includes(f.split(path.sep)[0]));
		const c = chrome();
		for (const f of pages) {
			const url = 'http://localhost:' + port + '/prerender/' + f.split(path.sep).join('/');
			const png = path.join(
				dir,
				f
					.split(path.sep)
					.join('__')
					.replace(/\.html$/, '.png'),
			);
			spawnSync(
				c,
				[
					'--headless=new',
					'--disable-gpu',
					'--hide-scrollbars',
					'--window-size=1400,2600',
					'--virtual-time-budget=5000',
					'--screenshot=' + png,
					url,
				],
				{ stdio: 'ignore' },
			);
		}
		console.log('캡처 ' + fs.readdirSync(dir).length + '장 → ' + path.relative(ROOT, dir));
	} finally {
		if (process.platform === 'win32')
			spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
		else server.kill();
	}
}

function shotsCmp(a, b) {
	const A = path.join(BOX, 'shots-' + a);
	const B = path.join(BOX, 'shots-' + b);
	const same = [];
	const diff = [];
	const missing = [];
	for (const f of fs.readdirSync(A)) {
		if (!fs.existsSync(path.join(B, f))) {
			missing.push(f);
			continue;
		}
		(fs.readFileSync(path.join(A, f)).equals(fs.readFileSync(path.join(B, f))) ? same : diff).push(f);
	}
	console.log('같음 ' + same.length + ' · 다름 ' + diff.length + ' · 한쪽에만 ' + missing.length);
	diff.forEach((f) => console.log('  다름 ' + f));
	missing.forEach((f) => console.log('  없음 ' + f));
}

(async () => {
	if (cmd === 'snap' && rest[0]) {
		copyDir(OUT, path.join(BOX, rest[0]));
		console.log('보관 ' + walk(OUT).length + '개 → .verify/' + rest[0]);
	} else if (cmd === 'cmp' && rest[0]) cmpSnap(rest[0]);
	else if (cmd === 'shots' && rest[0]) await shots(rest[0], rest.slice(1));
	else if (cmd === 'shots-cmp' && rest[1]) shotsCmp(rest[0], rest[1]);
	else console.log('사용법은 머리 주석 — snap <이름> · cmp <이름> · shots <이름> [폴더…] · shots-cmp <A> <B>');
})().catch((e) => {
	console.error(e.message);
	process.exitCode = 1;
});
