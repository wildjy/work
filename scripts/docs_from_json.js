#!/usr/bin/env node
/**
 * docs_from_json.js — 문서판(docs/PARTIALS.md)의 표를 JSON 에서 찍는다.
 *
 *   npm run docs            # 갈아 끼운다
 *   npm run docs -- --check # 갈아 끼우지 않고 「낡았는가」만 본다(종료코드 1 이면 낡았다)
 *
 * 왜 있나 — 같은 표가 화면(Guide_Partial.html)과 문서(PARTIALS.md) 두 곳에 있었고,
 * 화면만 JSON 으로 돌면서 **손으로 쓴 문서 쪽이 조용히 낡았다**(함정 표가 18 vs 24 로 갈렸다).
 * 이제 둘 다 public/data/guide/*.json 하나를 본다.
 *
 * 어떻게 — 산문은 손으로 쓴 채 두고 **마커 사이만** 바꾼다.
 *   <!-- auto:이름 -->
 *   … 여기만 생성된다 …
 *   <!-- /auto:이름 -->
 *
 * ⚠ 표를 하나 더 만들려면 ① JSON 을 만들고 ② 아래 BLOCKS 에 한 줄 더하고
 *    ③ PARTIALS.md 에 마커를 넣는다. 마크업 쪽은 Guide_Partial.html 이 같은 JSON 을 읽는다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'data', 'guide');
const DOC = path.join(ROOT, 'docs', 'PARTIALS.md');
const checkOnly = process.argv.includes('--check');

const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name + '.json'), 'utf8'));

/* ── HTML → 마크다운 ──────────────────────────────────────────
   JSON 값은 화면용 HTML 이다. 표 안에서 쓰는 것만 옮긴다 —
   <code> → `…` · <strong>/<b> → **…** · <br> → 공백.
   ⚠ 표 칸 안에서는 `|` 가 칸 구분자라 이스케이프한다. */
function md(html) {
	return String(html)
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<\/?(strong|b)>/gi, '**')
		.replace(/<code>([\s\S]*?)<\/code>/gi, (_m, t) => '`' + t.replace(/\*\*/g, '') + '`')
		.replace(/<[^>]+>/g, '')
		.replace(/&#123;/g, '{')
		.replace(/&#125;/g, '}')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\|/g, '\\|')
		.replace(/\s+/g, ' ')
		.trim();
}

/** 표 한 장을 만든다. head 는 머리줄, cols 는 JSON 키 목록. */
function table(head, rows, cols) {
	const out = ['| ' + head.join(' | ') + ' |', '| ' + head.map(() => '---').join(' | ') + ' |'];
	rows.forEach((r) => out.push('| ' + cols.map((c) => md(r[c])).join(' | ') + ' |'));
	return out.join('\n');
}

/** 첫 칸만 굵게 — 문서 표는 「무엇에 대한 줄인가」가 먼저 읽혀야 한다. */
function tableTerm(head, rows, cols) {
	const out = ['| ' + head.join(' | ') + ' |', '| ' + head.map(() => '---').join(' | ') + ' |'];
	rows.forEach((r) => {
		const cells = cols.map((c, i) => (i === 0 ? '**' + md(r[c]) + '**' : md(r[c])));
		out.push('| ' + cells.join(' | ') + ' |');
	});
	return out.join('\n');
}

const only = (rows, group) => rows.filter((r) => r.group === group);

/* ── 마커 이름 → 만드는 법 ────────────────────────────────── */
const BLOCKS = {
	summary: () => table(['', '규칙'], only(read('partial_rules'), 'summary'), ['term', 'desc']),
	react: () => table(['하려는 일', '이 저장소', 'React'], read('partial_react'), ['concept', 'pub', 'react']),
	call: () => tableTerm(['규칙', '이유 · 어기면'], only(read('partial_rules'), 'call'), ['term', 'desc']),
	syntax_escape: () =>
		table(['무엇이', '`{{key}}` — 이스케이프', '`{{{key}}}` — 원문'], only(read('partial_syntax'), 'escape'), [
			'axis',
			'left',
			'right',
		]),
	syntax_scope: () =>
		table(['무엇이', '파셜 변수 — `data-*`', '목록 템플릿 — JSON'], only(read('partial_syntax'), 'scope'), [
			'axis',
			'left',
			'right',
		]),
	slot_place: () => table(['본문이 이렇다면', '이렇게'], only(read('partial_slot'), 'place'), ['term', 'desc']),
	slot_order: () =>
		table(['배치', '브라우저', '프리렌더'], only(read('partial_slot'), 'order'), ['term', 'runtime', 'prerender']),
	// ⚠ 「어디에」는 절 번호가 아니라 **주제 이름**이다 — 번호는 화면과 문서가 서로 다르다.
	ladder: () =>
		tableTerm(['무엇이 다른가', '쓰는 것', '어디에 적혀 있나'], read('partial_ladder'), ['diff', 'tool', 'where']),
	traps: () => tableTerm(['함정', '무슨 일이 나나', '어떻게'], read('partial_traps'), ['trap', 'what', 'how']),
	symptoms: () => table(['화면에서 본 것', '먼저 볼 것'], read('partial_symptoms'), ['symptom', 'cause']),
	samples: () => samples(),
};

/* 예시 모음만 표가 아니라 묶음별 목록이다 — 이름 · 받는 값 · 코드 */
const SAMPLE_GROUPS = [
	['common', '공통 — `include/common/`'],
	['input', '입력 — `include/ui/`'],
	['choice', '선택 · 안내 — `include/ui/`'],
	['modal', '알림 · 모달 — `include/ui/` (페이지 끝에 둔다)'],
];
function samples() {
	const rows = read('partial_samples');
	const out = [];
	SAMPLE_GROUPS.forEach(([g, title]) => {
		const list = only(rows, g);
		if (!list.length) return;
		out.push('### ' + title, '');
		list.forEach((r) => {
			out.push('**' + md(r.name) + '** — ' + md(r.args), '', '```html', decode(r.code), '```', '');
		});
	});
	return out.join('\n').trimEnd();
}
/* 코드 블록은 마크다운이 아니라 원문이다 — 엔티티만 되돌린다 */
function decode(code) {
	return String(code)
		.replace(/&#123;/g, '{')
		.replace(/&#125;/g, '}')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&');
}

/* ── 마커 사이를 갈아 끼운다 ───────────────────────────────── */
function main() {
	if (!fs.existsSync(DOC)) {
		console.error('문서가 없다 :', DOC);
		process.exit(1);
	}
	const src = fs.readFileSync(DOC, 'utf8');
	const eol = src.includes('\r\n') ? '\r\n' : '\n';
	let out = src;
	const done = [];
	const missing = [];

	Object.keys(BLOCKS).forEach((name) => {
		const re = new RegExp('(<!-- auto:' + name + ' -->)[\\s\\S]*?(<!-- /auto:' + name + ' -->)', 'g');
		if (!re.test(out)) {
			missing.push(name);
			return;
		}
		re.lastIndex = 0;
		const body = BLOCKS[name]().split('\n').join(eol);
		out = out.replace(re, (_m, a, b) => a + eol + eol + body + eol + eol + b);
		done.push(name);
	});

	if (missing.length) {
		console.warn('  ! 마커가 없어 건너뛴 블록 :', missing.join(' · '));
		console.warn('    PARTIALS.md 에 <!-- auto:이름 --> … <!-- /auto:이름 --> 를 넣는다.');
	}

	if (checkOnly) {
		if (out === src) {
			console.log('문서가 JSON 과 같다 (' + done.length + '블록).');
			return;
		}
		console.error('문서가 낡았다 — `npm run docs` 를 돌린다. (' + done.length + '블록 검사)');
		process.exit(1);
	}

	if (out === src) {
		console.log('바뀐 것 없음 (' + done.length + '블록).');
		return;
	}
	fs.writeFileSync(DOC, out);
	console.log('docs/PARTIALS.md 갱신 — ' + done.length + '블록 : ' + done.join(' · '));
}

main();
