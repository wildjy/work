#!/usr/bin/env node
/**
 * prerender.js — 파셜 include + JSON 목록을 미리 전개해 "완성 HTML" 을 만든다.
 *
 * 브라우저의 「페이지 소스 보기(Ctrl+U)」는 서버 원본 응답만 보여주므로,
 * dynamicImport.js(파셜)·listRender.js(목록)로 그린 마크업은 소스에 나오지 않는다.
 * 개발 인계·산출물 검수용으로 전개된 HTML 이 필요할 때 이 스크립트를 쓴다.
 *
 *   npm run prerender                            # public/html 전체
 *   npm run prerender -- Sample.html             # 특정 파일만
 *   npm run prerender -- --keep-templates        # <template> 정의도 남기기
 *   npm run prerender -- --keep-comments         # 원본 주석 그대로 (정리하지 않는다)
 *   npm run prerender:watch                      # 감시 모드 (저장할 때마다 자동 재생성)
 *
 * ⚠ **주석 정리는 기본으로 켜져 있다**(stripComments 참고) — 모든 prerender 명령이 마찬가지다.
 *   인라인 <script> 안의 주석도 함께 걷는다(stripScriptComments) — 그쪽은 @ 표시한 것만 남는다.
 *   켜고 끄는 곳이 갈리면 「방금 정리한 산출물이 다음 프리렌더에 되살아나는」 일이 생겨서다.
 *
 * 입력  public/html/*.html  (+ public/data/<기능명>/*.json)
 * 출력  public/prerender/*.html
 *   └ public/html 과 같은 깊이라 ../css/ ../js/ ../images/ 경로가 그대로 동작한다.
 *
 * 전개 대상
 *   1) <div class="dynamic-content" data-source="./_파셜.html"></div>   (재귀)
 *   2) <tbody class="dynamic-list" data-source="../data/…/x.json"
 *             data-template="#tpl" data-empty="#tpl_empty"></tbody>
 *
 * ⚠ 목록 컨테이너는 반드시 **비어 있어야** 한다(`<tbody ...></tbody>`).
 *   listRender.js 와 동일한 규칙이며, 이 스크립트도 빈 컨테이너만 인식한다.
 *
 * ⚠ dynamicImport.js 는 fetch 를 쓰므로 data-source 를 항상 「페이지」 기준으로 해석한다.
 *   파셜 안의 include 경로도 파셜 위치가 아니라 페이지 위치 기준이다. 여기서도 동일하게 푼다.
 *
 * 치환 문법은 listRender.js 와 동일 — {{key}} / {{{key}}} / {{@index}} / {{@number}} / 항목의 "_tpl"
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'html');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const OUT_DIR = path.join(ROOT, 'public', 'prerender');

const args = process.argv.slice(2);
const keepTemplates = args.includes('--keep-templates');
// 주석 정리는 **기본으로 켜져 있다.** 원본 주석을 그대로 보려면 --keep-comments.
const cleanComments = !args.includes('--keep-comments');
const watchMode = args.includes('--watch');
const targets = args.filter((a) => !a.startsWith('--'));

// --clean-comments 집계 (남긴 주석 / 지운 주석)
const commentStat = { kept: 0, trimmed: 0, merged: 0, dropped: 0, js: 0 };

// 페이지별 의존 파일(파셜·JSON) — 감시 모드에서 "무엇을 다시 빌드할지" 판단에 쓴다
const depMap = new Map();

/* ── 공통 유틸 ─────────────────────────────────────────── */

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => escapeMap[c]);
const rel = (p) => path.relative(ROOT, p);

function getAttr(tagStr, name) {
	const m = tagStr.match(new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"', 'i'));
	return m ? m[1] : null;
}

// 매치 위치가 속한 줄의 들여쓰기
function indentAt(src, index) {
	const lineStart = src.lastIndexOf('\n', index - 1) + 1;
	const m = src.slice(lineStart, index).match(/^[ \t]*/);
	return m ? m[0] : '';
}

// 여러 줄 블록을 주어진 들여쓰기로 다시 정렬
function reindent(block, indent) {
	const lines = block.replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n');
	const base = lines.filter((l) => l.trim()).reduce((min, l) => Math.min(min, l.match(/^[ \t]*/)[0].length), Infinity);
	const strip = base === Infinity ? 0 : base;
	return lines.map((l) => (l.trim() ? indent + l.slice(strip) : '')).join('\r\n');
}

/* ── 1) 파셜 include 전개 ──────────────────────────────── */

// 빈 <div …></div> 를 먼저 잡고, dynamic-content 인지는 콜백에서 가린다.
// ⚠ 따옴표 안의 > 를 건너뛴다 — data-* 로 넘기는 값에 <br /> 같은 마크업이 들어가면
//    단순한 [^>]* 로는 태그가 거기서 끊겨 include 가 통째로 인식되지 않는다.
const PARTIAL_RE = /<div\b(?:[^>"']|"[^"]*"|'[^']*')*>\s*<\/div>/gi;
const IS_PARTIAL = /\bclass\s*=\s*"[^"]*\bdynamic-content\b[^"]*"/i;

// 주석(<!-- -->) 안인지 판정.
// dynamicImport.js 는 주석 안의 요소를 보지 못하므로 프리렌더도 전개하면 안 된다.
// (전개하면 파셜 안의 주석이 바깥 주석을 조기 종료시켜 마크업이 새어 나온다)
function insideComment(src, offset) {
	const before = src.slice(0, offset);
	return before.lastIndexOf('<!--') > before.lastIndexOf('-->');
}

// 개발 인계용 주석 정리 (--clean-comments).
//
// 마크업을 읽는 데 쓰이는 주석은 남기고, **퍼블 작업 메모만** 걷어낸다.
//
//   남긴다 ┬ @ 로 표시한 것          <!--@ 새 알림 있는 경우 new 추가 -->
//          ├ 닫음 표시               <!--// layer form -->
//          ├ 죽은 마크업(태그가 들어 있다)  <!--<a class="btn_view">숨기기</a>-->
//          └ 짧은 구역 표시(한 줄·LABEL_MAX 자 이하)  <!-- layer: 비밀번호 변경 -->
//
//   지운다 ┬ 날짜 메모(변경이력)      <!-- 26.01.09 : 추가 -->
//          ├ ⚠ 로 시작하는 퍼블 내부 메모
//          └ 긴 설명·파셜 머리 주석(여러 줄이거나 LABEL_MAX 자 초과)
//
// ⚠ **길어서 지워지는 개발단 지침은 @ 를 붙인다.** 그게 @ 의 용도다.
//    「확인 결과에 따라 완료 화면 / 거절 화면으로 이동한다(개발 연동)」처럼
//    글자 수로는 설명과 구분되지 않는 것들이 있다. 문구만 보고 자동 판정할 수 없다 —
//    「추가」가 변경이력(26.04.13 : 버튼 추가)과 지침(새 알림 있는 경우 new 추가) 양쪽에 쓰인다.
//
// 내보낼 때 @ 는 떼므로 개발자가 보는 주석 모양은 지금과 같다(일반 모드에서도 뗀다).
//
// ⚠ 반드시 **파셜·목록 전개가 끝난 뒤에** 부른다.
//    insideComment() 가 「주석 처리해 둔 include·목록은 전개하지 않는다」를 판단하는 근거가
//    주석 그 자체다. 먼저 지우면 주석 안에 넣어 둔 마크업이 되살아난다.
//
// ⚠ 원본(public/html)은 건드리지 않는다 — 산출물만 정리된다. 되돌리려면 다시 프리렌더한다.
const LABEL_MAX = 50; // 「구역 표시」로 볼 한 줄 주석의 최대 길이(<!-- --> 안쪽 기준)
const KEEP_MARK = /^<!--\s*@/;
const KEEP_CLOSE_INNER = /^\/\/\s*/; // 닫음 표시의 //
const HAS_TAG = /<\/?[a-z][a-z0-9]*[\s>/]/i;
const DATE_MEMO = /^\d\d\.\d\d\.\d\d\s*:/;

// 「구역 표시」만 뽑아낸다 — 설명이 붙어 있으면 잘라 버린다.
//   사용현황 위젯 — 무료는 위 배너, 유료는 …        →   사용현황 위젯
//   사용현황 위젯 (26.09.11 분리)                   →   그대로 (괄호는 남긴다)
//   여러 줄 주석                                   →   첫 줄만
function labelOf(inner) {
	let s = inner.split(/\r?\n/)[0].trim();
	// ⚠ 괄호 **밖**의 「 — 」에서만 자른다.
	//    안에서 자르면 「layer: 생년월일 (다른 화면 — 에서 옮겨왔다」 처럼 괄호가 안 닫힌다.
	let depth = 0;
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		if (ch === '(' || ch === '「') {
			depth++;
			continue;
		}
		if (ch === ')' || ch === '」') {
			depth--;
			continue;
		}
		const spaced = /\s/.test(s[i - 1] || '') && /\s/.test(s[i + 1] || '');
		if (depth === 0 && (ch === '—' || ch === '–') && spaced) {
			return s.slice(0, i).trim();
		}
	}
	return s;
}

// 남길 주석을 돌려준다. 지울 것은 null.
function reduceComment(comment) {
	// 표시한 것은 손대지 않는다. @ 는 뒤쪽 공통 패스가 뗀다(일반 모드와 같은 자리).
	if (KEEP_MARK.test(comment)) {
		return comment;
	}

	let inner = comment.replace(/^<!--\s*/, '').replace(/\s*-->$/, '');
	if (HAS_TAG.test(inner)) {
		return comment;
	} // 죽은 마크업은 통째로 남긴다

	// ⚠ 닫음 표시는 **여는 주석과 짝**이다. // 를 떼고 같은 기준으로 판정한다.
	//    무조건 남기면 여는 쪽이 지워질 때 닫는 쪽만 외톨이로 남는다
	//    (<!-- 26.01.09 : 헤더 위치 변경 --> 은 지워지는데 <!--// 26.01.09 : … --> 만 남던 문제).
	const isClose = KEEP_CLOSE_INNER.test(inner);
	inner = inner.replace(KEEP_CLOSE_INNER, '');

	const label = labelOf(inner);
	if (!label) {
		return null;
	}
	if (DATE_MEMO.test(label)) {
		return null;
	} // 날짜 메모
	if (label.startsWith('⚠')) {
		return null;
	} // 퍼블 내부 메모
	if (label.length > LABEL_MAX) {
		return null;
	} // 라벨로 보기엔 길다 = 설명

	if (label === inner) {
		return comment;
	} // 자를 것이 없었다 — 원문 그대로
	return isClose ? '<!--// ' + label + ' -->' : '<!-- ' + label + ' -->';
}

// 이웃한 두 주석이 같은 구역을 가리키면 **짧은 쪽만** 남긴다.
//   <!-- 사용현황 위젯 -->
//   <!-- 사용현황 위젯 (26.09.11 헤더에서 분리) -->   ← 이 줄이 사라진다
// include 지점 주석과 파셜 머리 주석이 나란히 오면서 생긴다(산출물에서만 붙는다).
// ⚠ 닫음 표시와 죽은 마크업은 건드리지 않는다 — 짝·내용이 깨진다.
// ⚠ 「주석 두 개」를 한 정규식으로 잡으면 안 된다.
//    전역 치환이 쌍을 통째로 먹어 버려서, 붙지 않은 쌍을 만나면 그 뒤 주석이 다음 쌍의 앞자리로
//    밀린다. **주석 위치를 먼저 모은 뒤** 이웃끼리 본다.
const ONE_COMMENT_RE = /([ \t]*)<!--([\s\S]*?)-->([ \t]*\r?\n)?/g;
function dedupeAdjacentLabels(html) {
	const list = [];
	let m;
	ONE_COMMENT_RE.lastIndex = 0;
	while ((m = ONE_COMMENT_RE.exec(html)) !== null) {
		list.push({ start: m.index, end: ONE_COMMENT_RE.lastIndex, body: m[2].trim() });
	}
	// 닫음 표시와 죽은 마크업은 건드리지 않는다 — 짝·내용이 깨진다
	const plain = (s) => !!s && !s.startsWith('//') && !/[<>]/.test(s);

	const kill = [];
	let prev = null;
	list.forEach((c) => {
		// end === start 면 사이에 아무것도 없다(들여쓰기·줄바꿈은 이미 매치에 들어 있다)
		if (prev && prev.end === c.start && plain(prev.body) && plain(c.body)) {
			const longer = c.body.length >= prev.body.length ? c : prev;
			const shorter = longer === c ? prev : c;
			if (longer.body.startsWith(shorter.body)) {
				kill.push(longer);
				commentStat.merged++;
				prev = shorter;
				return;
			}
		}
		prev = c;
	});
	if (!kill.length) {
		return html;
	}

	// 뒤에서부터 지워야 앞 구간의 위치가 밀리지 않는다
	kill.sort((x, y) => y.start - x.start);
	kill.forEach((k) => {
		html = html.slice(0, k.start) + html.slice(k.end);
	});
	return html;
}

/* 인라인 <script> 안의 주석 정리.

   남기는 것은 **@ 로 표시한 것뿐**이다.
     //@ 여기는 개발단이 붙인다   →   // 여기는 개발단이 붙인다

   ⚠ HTML 쪽(reduceComment)과 규칙이 다르다. 거기서는 짧은 구역 표시를 남기는데 여기서는 남기지 않는다 —
      마크업 주석은 개발자가 **그 마크업을 그대로 옮겨 쓰며** 읽지만,
      스크립트 주석은 퍼블이 제 구현을 설명한 것이라 개발자가 제 코드로 다시 쓴다.

   ⚠⚠ **줄 전체가 주석인 줄만 건드린다.** 코드 뒤에 붙은 꼬리 주석은 손대지 않는다 —
       문자열 안의 // (URL 등)·정규식 리터럴과 기계적으로 구분할 수 없다.

   ⚠ 여러 줄 템플릿 리터럴(백틱) 안은 건너뛴다. 그 안의 「// 로 시작하는 줄」은 주석이 아니라
      문자열이다. 백틱을 세어 홀수면 안에 있다고 본다.

   ⚠ src 가 있는 <script> 는 대상이 아니다(내용이 없다). */
const SCRIPT_RE = /(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/g;
const JS_KEEP = /^\/[/*]\s*@/;

function stripScriptComments(html) {
	return html.replace(SCRIPT_RE, (whole, open, body, close) => {
		const lines = body.split('\n');
		const out = [];
		let inTemplate = false; // 여러 줄 템플릿 리터럴 안인가
		let dropping = false; // 버리는 중인 여러 줄 블록 주석 안인가
		let keeping = false; // 남기는 중인 여러 줄 블록 주석 안인가

		for (const raw of lines) {
			const line = raw.replace(/\r$/, '');
			const t = line.trim();

			// 여러 줄 블록 주석이 이어지는 중
			if (dropping || keeping) {
				if (keeping) {
					out.push(raw);
				}
				if (t.includes('*/')) {
					dropping = false;
					keeping = false;
				}
				continue;
			}

			if (!inTemplate) {
				if (t.startsWith('//')) {
					if (JS_KEEP.test(t)) {
						commentStat.kept++;
						out.push(raw);
					} else {
						commentStat.js++;
					}
					continue;
				}
				if (t.startsWith('/*')) {
					const keep = JS_KEEP.test(t);
					const closed = t.includes('*/');
					if (keep) {
						out.push(raw);
						if (!closed) {
							keeping = true;
						}
					} else {
						commentStat.js++;
						if (!closed) {
							dropping = true;
						}
					}
					continue;
				}
			}

			out.push(raw);

			// 백틱 개수로 템플릿 안팎을 갱신한다 (\` 로 escape 한 것은 세지 않는다)
			const ticks = (line.match(/(^|[^\\])`/g) || []).length;
			if (ticks % 2 === 1) {
				inTemplate = !inTemplate;
			}
		}

		return open + out.join('\n') + close;
	});
}

function stripComments(html) {
	return html.replace(/([ \t]*)<!--[\s\S]*?-->([ \t]*\r?\n)?/g, (m, indent, tail, offset, whole) => {
		const comment = m.slice(indent.length, m.length - (tail ? tail.length : 0));
		const kept = reduceComment(comment);
		if (kept !== null) {
			if (kept === comment) {
				commentStat.kept++;
			} else {
				commentStat.trimmed++;
			}
			return indent + kept + (tail || '');
		}
		commentStat.dropped++;
		const lineStart = whole.lastIndexOf('\n', offset - 1) + 1;
		const aloneOnLine = whole.slice(lineStart, offset).trim() === '';
		// 줄에 이 주석뿐이었으면 줄째로 지운다(빈 줄을 남기지 않는다)
		if (aloneOnLine && tail) {
			return '';
		}
		// ⚠ 그 밖에는 들여쓰기(또는 사이 공백)를 돌려준다.
		//    한 줄에 주석이 둘 이상이면 앞 주석이 줄의 들여쓰기를 먹어 뒷 내용이 열 0 으로 밀린다.
		return indent;
	});
}

// 파셜에 값을 넘긴다 : <div class="dynamic-content" data-source="…" data-explain="…">
//   → 파셜 안의 {{explain}} 자리에 들어간다. data-max-size 는 {{maxSize}}(dataset 규칙).
// ⚠ 넘기지 않은 키는 그대로 둔다 — 파셜 안에 목록 template 이 들어 있을 때
//    그쪽 {{key}} / {{@number}} 를 먼저 먹어버리지 않게 하기 위해서다.
// ⚠ 속성값은 원문(&quot; 등)이라 먼저 실제 문자로 되돌린다.
//    브라우저의 el.dataset 은 이미 디코딩된 값을 주므로, 안 하면 프리렌더만 &amp;quot; 로 두 번 이스케이프된다.
const decodeMap = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodeEntities = (v) =>
	String(v).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
		if (e[0] === '#') {
			const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : m;
		}
		const k = e.toLowerCase();
		return k in decodeMap ? decodeMap[k] : m;
	});

function partialVars(tagStr) {
	const vars = {};
	tagStr.replace(/\bdata-([\w-]+)\s*=\s*"([^"]*)"/gi, (m, k, v) => {
		if (k.toLowerCase() !== 'source') {
			vars[k.replace(/-([a-z])/g, (_x, c) => c.toUpperCase())] = decodeEntities(v);
		}
		return m;
	});
	return vars;
}

// {{key}} · {{{key}}}      — 넘기지 않으면 그대로 남는다(파셜 안 목록 template 의 중괄호 보호).
// {{key|기본값}}           — 넘기지 않으면 기본값으로 채운다.
//   파셜을 include 하는 페이지가 많을 때 「전부 값을 넘겨야 하는」 제약을 없앤다.
//   ⚠ 기본값은 파셜 작성자가 HTML 자리에 직접 쓴 문자열이라 이스케이프하지 않는다.
//      넘긴 값만 중괄호 개수를 따른다 — {{key}} 는 이스케이프, {{{key}}} 는 원문.
//   ⚠ dynamicImport.js 의 같은 블록과 규칙이 같아야 한다 — 한쪽만 고치지 않는다.
const VAR_RAW_RE = /\{\{\{\s*([\w@.-]+)\s*(?:\|([^}]*?))?\s*\}\}\}/g;
const VAR_ESC_RE = /\{\{\s*([\w@.-]+)\s*(?:\|([^}]*?))?\s*\}\}/g;

function fillVars(str, vars) {
	return str
		.replace(VAR_RAW_RE, (m, k, d) => (k in vars ? String(vars[k]) : d !== undefined ? d : m))
		.replace(VAR_ESC_RE, (m, k, d) => (k in vars ? escapeHtml(vars[k]) : d !== undefined ? d : m));
}

function expandPartials(html, baseDir, stack, ctx) {
	return html.replace(PARTIAL_RE, (tag, offset, whole) => {
		if (!IS_PARTIAL.test(tag)) return tag;
		const src = getAttr(tag, 'data-source');
		if (!src) return tag;
		if (insideComment(whole, offset)) return tag; // 주석 처리된 include 는 그대로 둔다

		const file = path.resolve(baseDir, src);
		ctx.deps.add(file);

		if (stack.includes(file)) {
			console.warn('  ! 순환 include 무시:', rel(file));
			return tag;
		}
		if (!fs.existsSync(file)) {
			console.warn('  ! 파셜 없음:', rel(file));
			return tag;
		}

		let content = fs.readFileSync(file, 'utf8');
		const vars = partialVars(tag);
		// ⚠ vars 가 비어도 부른다 — {{key|기본값}} 을 채워야 하기 때문이다.
		//    기본값이 없는 {{key}} 는 여전히 그대로 남으므로 목록 template 은 안전하다.
		content = fillVars(content, vars);
		// dynamicImport.js 는 fetch 를 문서(페이지) 기준으로 해석하므로,
		// 파셜 안의 data-source 도 파셜 위치가 아니라 페이지 기준으로 푼다.
		content = expandPartials(content, baseDir, stack.concat(file), ctx);

		ctx.partials += 1;
		return reindent(content, indentAt(whole, offset)).trimStart();
	});
}

/* ── 2) <template> 수집 ────────────────────────────────── */

const TEMPLATE_RE = /<template\b[^>]*\bid\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/template>/gi;

function collectTemplates(html) {
	const map = {};
	let m;
	TEMPLATE_RE.lastIndex = 0;
	while ((m = TEMPLATE_RE.exec(html)) !== null) {
		// 앞뒤 빈 줄만 제거(들여쓰기는 reindent 가 다시 맞춘다)
		map['#' + m[1]] = m[2].replace(/^\r?\n/, '').replace(/\s+$/, '');
	}
	return map;
}

/* ── 3) 목록 렌더 ──────────────────────────────────────── */

// data-filter="key" → 참인 항목만 / "!key" → 거짓인 항목만 / "key=값" → 값이 일치하는 항목만
function applyFilter(items, expr) {
	if (!expr) return items;

	// "key=값" : 값이 일치하는 항목만 (하나의 JSON 을 여러 컨테이너가 나눠 쓸 때)
	const eq = expr.indexOf('=');
	if (eq > 0) {
		const k = expr.slice(0, eq).trim();
		const val = expr.slice(eq + 1).trim();
		return items.filter((it) => it && String(it[k]) === val);
	}

	const neg = expr.charAt(0) === '!';
	const key = neg ? expr.slice(1) : expr;
	return items.filter((it) => {
		const v = it && it[key];
		return neg ? !v : !!v;
	});
}

function fillTemplate(tpl, item, index) {
	const ctx = Object.assign({}, item, { '@index': index, '@number': index + 1 });
	return tpl
		.replace(/\{\{\{\s*([\w@.-]+)\s*\}\}\}/g, (_m, k) => (ctx[k] == null ? '' : String(ctx[k])))
		.replace(/\{\{\s*([\w@.-]+)\s*\}\}/g, (_m, k) => (ctx[k] == null ? '' : escapeHtml(ctx[k])));
}

// 열린 태그에서 dynamic-list 마커(class/data-*) 제거 → 산출물에서 재렌더되지 않게
function cleanContainerTag(attrs) {
	return attrs
		.replace(/\s*\bdata-(source|template|empty|filter)\s*=\s*"[^"]*"/gi, '')
		.replace(/(\bclass\s*=\s*")([^"]*)"/i, (_m, head, cls) => {
			const kept = cls
				.split(/\s+/)
				.filter((c) => c && c !== 'dynamic-list')
				.join(' ');
			return kept ? head + kept + '"' : '';
		})
		.replace(/\s+/g, ' ')
		.replace(/\s+$/, '');
}

const LIST_RE = /<([a-zA-Z][\w-]*)\b([^>]*\bclass\s*=\s*"[^"]*\bdynamic-list\b[^"]*"[^>]*)>\s*<\/\1>/g;

function expandLists(html, baseDir, templates, ctx) {
	return html.replace(LIST_RE, (whole, tag, attrs, offset, full) => {
		if (insideComment(full, offset)) return whole; // 주석 처리된 목록은 그대로 둔다
		const src = getAttr(attrs, 'data-source');
		const tplSel = getAttr(attrs, 'data-template');
		const emptySel = getAttr(attrs, 'data-empty');
		const filter = getAttr(attrs, 'data-filter');
		const indent = indentAt(full, offset);
		const openTag = '<' + tag + cleanContainerTag(attrs) + '>';
		const closeTag = '</' + tag + '>';

		if (!src) return whole;

		const file = path.resolve(baseDir, src);
		ctx.deps.add(file);

		if (!fs.existsSync(file)) {
			console.warn('  ! 데이터 없음:', rel(file));
			return whole;
		}

		let data;
		try {
			data = JSON.parse(fs.readFileSync(file, 'utf8'));
		} catch (e) {
			console.warn('  ! JSON 파싱 실패:', rel(file), '-', e.message);
			return whole;
		}

		const items = applyFilter(Array.isArray(data) ? data : (data && data.items) || [], filter);
		let body;

		if (!items.length) {
			body = emptySel && templates[emptySel] ? templates[emptySel] : '';
		} else {
			body = items
				.map((item, i) => {
					const sel = (item && item._tpl) || tplSel;
					const tpl = templates[sel];
					if (tpl == null) {
						console.warn('  ! 템플릿 없음:', sel);
						return '';
					}
					return fillTemplate(tpl, item || {}, i);
				})
				.join('\n');
		}

		ctx.lists += 1;
		ctx.rows += items.length;

		if (!body.trim()) return openTag + closeTag;
		return openTag + '\r\n' + reindent(body, indent + '  ') + '\r\n' + indent + closeTag;
	});
}

/* ── 빌드 ──────────────────────────────────────────────── */

function build(fileName, quiet) {
	const srcPath = path.join(SRC_DIR, fileName);

	// 원본이 사라졌으면 산출물도 정리
	if (!fs.existsSync(srcPath)) {
		depMap.delete(fileName);
		const outPath = path.join(OUT_DIR, fileName);
		if (fs.existsSync(outPath)) {
			fs.unlinkSync(outPath);
			console.log('  - ' + fileName + ' (원본이 사라져 산출물 삭제)');
		}
		return;
	}

	let html = fs.readFileSync(srcPath, 'utf8');
	const ctx = { partials: 0, lists: 0, rows: 0, deps: new Set() };

	html = expandPartials(html, SRC_DIR, [srcPath], ctx);

	const templates = collectTemplates(html);
	html = expandLists(html, SRC_DIR, templates, ctx);

	if (!keepTemplates) {
		// 템플릿 정의와 그 주변 주석 제거
		html = html
			.replace(/[ \t]*<!--\s*목록 템플릿[\s\S]*?-->\r?\n?/g, '')
			.replace(/[ \t]*<!--\/\/\s*목록 템플릿\s*-->\r?\n?/g, '')
			// ⚠ 주석 안의 template 글자에는 걸리지 않게 한다.
			//    파셜 설명 주석에 template 태그를 예시로 적어 두면, 그 지점부터 실제 닫는 태그까지
			//    통째로 지워져 주석의 닫는 표시가 사라지고 이후 문서 전체가 주석으로 먹힌다.
			.replace(/[ \t]*<template\b[\s\S]*?<\/template>\r?\n?/gi, (m, offset, whole) =>
				insideComment(whole, offset) ? m : '',
			);
		// 템플릿 제거로 생긴 3줄 이상 빈 줄 정리
		html = html.replace(/(\r?\n){3,}/g, '\r\n\r\n');
	}

	// ⚠ 주석 정리는 전개가 모두 끝난 뒤다(stripComments 머리 주석 참고)
	if (cleanComments) {
		html = stripComments(html);
		html = dedupeAdjacentLabels(html);
		html = stripScriptComments(html);
		html = html.replace(/(\r?\n){3,}/g, '\r\n\r\n');
	}

	// 남김 표시(@)는 **원본에서만 쓰는 약속**이다 — 산출물에는 어느 모드에서도 남기지 않는다.
	// (--clean-comments 에서는 위에서 이미 떨어졌고, 일반 모드에서는 여기서 떨어진다)
	html = html.replace(/<!--(\s*)@/g, '<!--$1');
	// 스크립트 주석의 표시도 같이 뗀다 — 줄 전체가 주석인 줄만 본다(꼬리 주석은 안 건드린다)
	html = html.replace(/^([ \t]*\/[/*])@[ ]?/gm, '$1 ');

	fs.mkdirSync(OUT_DIR, { recursive: true });
	fs.writeFileSync(path.join(OUT_DIR, fileName), html, 'utf8');
	depMap.set(fileName, ctx.deps);

	if (!quiet) {
		console.log('  ✓ ' + fileName + '  (파셜 ' + ctx.partials + ' / 목록 ' + ctx.lists + ' · ' + ctx.rows + '행)');
	}
}

function pageList() {
	return fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
}

function buildAll(quiet) {
	const files = pageList();
	files.forEach((f) => build(f, quiet));
	return files.length;
}

/* ── 감시 모드 ─────────────────────────────────────────── */

function startWatch() {
	const pending = new Set();
	let timer = null;

	// 변경된 파일 하나가 영향을 주는 페이지들
	function affectedPages(changed) {
		const out = new Set();
		const name = path.basename(changed);

		// 페이지 자신 (파셜은 '_' 로 시작하므로 제외됨)
		if (path.dirname(changed) === SRC_DIR && name.endsWith('.html') && !name.startsWith('_')) {
			out.add(name);
		}
		// 이 파일에 의존(파셜·JSON)하는 페이지들
		depMap.forEach((deps, page) => {
			if (deps.has(changed)) out.add(page);
		});
		return out;
	}

	// 이번 재생성분만 세도록 되돌린다 — 감시 모드는 계속 돌아서 누적하면 숫자가 의미를 잃는다
	function resetCommentStat() {
		commentStat.kept = 0;
		commentStat.trimmed = 0;
		commentStat.merged = 0;
		commentStat.dropped = 0;
		commentStat.js = 0;
	}
	function commentNote() {
		if (!cleanComments) {
			return '';
		}
		return (
			'   (주석 남김 ' +
			commentStat.kept +
			' / 줄임 ' +
			commentStat.trimmed +
			' / 합침 ' +
			commentStat.merged +
			' / 지움 ' +
			commentStat.dropped +
			' · script ' +
			commentStat.js +
			')'
		);
	}

	function flush() {
		timer = null;
		const changed = Array.from(pending);
		pending.clear();
		resetCommentStat();

		const pages = new Set();
		let unknown = false;

		changed.forEach((f) => {
			const pgs = affectedPages(f);
			// 의존 관계를 아직 모르는 새 파일 → 전체 재생성으로 안전하게 처리
			if (!pgs.size) unknown = true;
			pgs.forEach((p) => pages.add(p));
		});

		const stamp = new Date().toTimeString().slice(0, 8);

		if (unknown) {
			const n = buildAll(true);
			console.log('[' + stamp + '] 전체 재생성 (' + n + '개)' + commentNote());
			return;
		}
		if (!pages.size) return;

		pages.forEach((p) => build(p, true));
		console.log('[' + stamp + '] ' + Array.from(pages).join(', ') + commentNote());
	}

	function onChange(dir) {
		return (event, filename) => {
			if (!filename) return;
			const full = path.resolve(dir, filename);
			if (!/\.(html|json)$/i.test(full)) return;
			pending.add(full);
			if (timer) clearTimeout(timer);
			timer = setTimeout(flush, 150); // 저장 시 중복 이벤트 합치기
		};
	}

	const watched = [];
	[SRC_DIR, DATA_DIR].forEach((dir) => {
		if (!fs.existsSync(dir)) return;
		fs.watch(dir, { recursive: true }, onChange(dir));
		watched.push(rel(dir));
	});

	console.log('감시 중: ' + watched.join(' , ') + (cleanComments ? '   [주석 정리 켜짐]' : '') + '   (Ctrl+C 로 종료)');
}

/* ── 실행 ──────────────────────────────────────────────── */

function main() {
	if (!fs.existsSync(SRC_DIR)) {
		console.error('입력 폴더 없음:', SRC_DIR);
		process.exit(1);
	}

	// 감시 모드는 의존 관계를 알아야 하므로 항상 전체가 대상
	if (watchMode && targets.length) {
		console.warn('  ! 감시 모드는 전체를 대상으로 합니다. 지정한 파일 인자는 무시합니다.');
	}

	let files = watchMode || !targets.length ? pageList() : targets;
	files = files.filter((f) => {
		if (fs.existsSync(path.join(SRC_DIR, f))) return true;
		console.warn('  ! 파일 없음:', f);
		return false;
	});

	console.log('prerender → ' + rel(OUT_DIR) + ' (' + files.length + '개)');
	files.forEach((f) => build(f, watchMode));

	if (!watchMode) {
		if (cleanComments) {
			console.log(
				'주석 정리 — 남김 ' +
					commentStat.kept +
					' / 줄임 ' +
					commentStat.trimmed +
					' / 합침 ' +
					commentStat.merged +
					' / 지움 ' +
					commentStat.dropped +
					'   ·  script 주석 지움 ' +
					commentStat.js +
					'   (남기려면 원본 주석을 <!--@ … --> 로 표시한다)',
			);
		}
		console.log('완료.');
		return;
	}
	startWatch();
}

main();
