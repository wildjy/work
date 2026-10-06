#!/usr/bin/env node
/**
 * pages_base.js — GitHub Pages 배포본에만 경로 접두어(base)를 붙인다.
 *
 *   node scripts/pages_base.js --base /work            # public → _site 로 복사하며 치환
 *   node scripts/pages_base.js --base /work --out dist # 출력 폴더 지정
 *
 * 왜 필요한가 : 저장소의 경로는 전부 「사이트 루트」 기준(/css/ · /js/ · /html/include/…)이다.
 * 로컬(pnpm run serve)은 public/ 을 / 로 주지만, GitHub Pages 프로젝트 사이트는 /<저장소명>/ 아래에 올라간다.
 * 그대로 올리면 /css/common.css 가 wildjy.github.io/css/… 를 찾아 스타일·스크립트·파셜이 전부 404 가 된다.
 *
 * ⚠ 원본(public/)과 커밋된 산출물(public/prerender)은 **건드리지 않는다** — 복사본(_site)만 바꾼다.
 *    산출물에 base 를 넣으면 로컬 화면이 깨지고, 배포 워크플로의 「산출물 최신 검사」(git diff)도 실패한다.
 * ⚠ 바꾸는 것은 **public/ 최상위에 실제로 있는 이름**으로 시작하는 경로뿐이다(/css · /js · /html · /data …).
 *    이미 base 가 붙은 경로(/work/…)·바깥 주소(//cdn…)·그 밖의 문자열은 그대로 둔다 — 두 번 돌려도 같다.
 * ⚠ 코드 예시(textarea · pre · code 안)는 바꾸지 않는다 — 사용법 문서가 보여 주는 코드가 달라진다.
 * ⚠ JSON 은 **값 전체가 경로인 문자열**만 바꾼다("img": "/images/…"). 문자열 안의 HTML·코드 예시는 두고 간다.
 * ⚠ js 는 경로를 DOM 속성에서 읽는다(dynamicImport · listRender 의 data-source) — 스크립트는 고칠 것이 없다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public');

const args = process.argv.slice(2);
const opt = (name, def) => {
	const i = args.indexOf(name);
	return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

// "/work/" · "work" · "/work" 어느 모양으로 받아도 "/work" 로 맞춘다. 비어 있으면 할 일이 없다.
const base = ('/' + String(opt('--base', process.env.PAGES_BASE || '')).replace(/^\/+|\/+$/g, '')).replace(/^\/$/, '');
const OUT = path.resolve(ROOT, opt('--out', '_site'));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// public/ 최상위 이름 — 이것으로 시작하는 경로만 사이트 루트 경로로 본다
const TOP = fs.readdirSync(SRC).map(escapeRe).join('|');
const SEG = '(?:' + TOP + ')(?=[/"\'?#)\\s]|$)';

// 따옴표 바로 뒤의 루트 경로 — 속성값(href="/css/…")과 스크립트 문자열(location.href='/html/…')을 함께 잡는다
const QUOTED_RE = new RegExp('(["\'])/(' + SEG + ')', 'g');
// 루트 링크 하나만("/")
const ROOT_LINK_RE = /(\bhref\s*=\s*)(["'])\/\2/g;
// 파셜 변수 기본값 — data-source="{{footer|/html/include/ui/_ui_modal_footer.html}}"
//   ⚠ 따옴표 바로 뒤가 아니라 QUOTED_RE 에 안 걸린다. 런타임이 이 값을 그대로 fetch 해서 빠뜨리면 404 다.
const VAR_DEFAULT_RE = new RegExp('(\\{\\{\\{?\\s*[\\w@.-]+\\s*\\|\\s*)/(' + SEG + ')', 'g');
// 인라인 style · css 의 url(/…)
const URL_RE = new RegExp('(url\\(\\s*["\']?)/(' + SEG + ')', 'g');
// srcset 의 두 번째 이후 후보("a.png 1x, /b.png 2x")
const SRCSET_RE = /(\bsrcset\s*=\s*)(["'])([^"']*)\2/g;
const SRCSET_ITEM_RE = new RegExp('(,\\s*)/(' + SEG + ')', 'g');
// JSON : 값 전체가 경로인 문자열
const JSON_RE = new RegExp('([:\\[,]\\s*)"/(' + SEG + ')', 'g');

// 바꾸면 안 되는 블록 — 코드 예시
const PROTECT_RE = /<(textarea|pre|code)\b[\s\S]*?<\/\1>/gi;

function rewriteHtml(src) {
	const kept = [];
	// 자리표는 제어문자로 감싼다 — HTML 에 들어갈 수 없는 글자라 본문과 겹치지 않는다(prerender.js protectRaw 와 같은 방식)
	let out = src.replace(PROTECT_RE, (m) => '\u0001P' + (kept.push(m) - 1) + '\u0001');
	out = out
		.replace(SRCSET_RE, (m, attr, q, val) => attr + q + val.replace(SRCSET_ITEM_RE, '$1' + base + '/$2') + q)
		.replace(QUOTED_RE, '$1' + base + '/$2')
		.replace(VAR_DEFAULT_RE, '$1' + base + '/$2')
		.replace(URL_RE, '$1' + base + '/$2')
		.replace(ROOT_LINK_RE, '$1$2' + base + '/$2');
	// eslint-disable-next-line no-control-regex -- 의도한 자리표다
	return out.replace(/\u0001P(\d+)\u0001/g, (m, i) => kept[Number(i)]);
}

const rewriteCss = (src) => src.replace(URL_RE, '$1' + base + '/$2');
const rewriteJson = (src) => src.replace(JSON_RE, '$1"' + base + '/$2');

const RULES = { '.html': rewriteHtml, '.css': rewriteCss, '.json': rewriteJson };

const stat = { copied: 0, changed: 0 };

function walk(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const e of fs.readdirSync(from, { withFileTypes: true })) {
		const a = path.join(from, e.name);
		const b = path.join(to, e.name);
		if (e.isDirectory()) {
			walk(a, b);
			continue;
		}
		const rule = base && RULES[path.extname(e.name).toLowerCase()];
		if (rule) {
			const src = fs.readFileSync(a, 'utf8');
			const out = rule(src);
			fs.writeFileSync(b, out, 'utf8');
			if (out !== src) stat.changed += 1;
		} else {
			fs.copyFileSync(a, b);
		}
		stat.copied += 1;
	}
}

// 출력 폴더는 매번 새로 만든다 — 지난 배포의 파일이 남지 않게
// ⚠ 지우기 전에 public 과 겹치는지 본다 — public 안쪽이거나, public 을 품은 폴더(저장소 루트 등)면 멈춘다
const inside = (parent, child) => !path.relative(parent, child).startsWith('..');
if (inside(SRC, OUT) || inside(OUT, SRC)) {
	console.error('출력 폴더가 public 과 겹칩니다:', OUT);
	process.exit(1);
}
fs.rmSync(OUT, { recursive: true, force: true });
walk(SRC, OUT);

console.log(
	'pages → ' +
		path.relative(ROOT, OUT) +
		'  (base ' +
		(base || '없음') +
		' · 파일 ' +
		stat.copied +
		' · 경로 바꾼 파일 ' +
		stat.changed +
		')',
);
