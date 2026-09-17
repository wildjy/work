---
name: pub-env
description: >-
  로컬 서버를 띄우거나, 파일 편집이 CRLF·탭 때문에 실패하거나, 프리렌더 산출물의 주석이 사라지거나 남는 이유를 확인할 때, 또는 dynamicImport·listRender·prerender 스크립트 자체를 고칠 때. npm run serve(npx serve public)를 쓰고 Live Server 를 쓰지 않는 이유, public 소스의 CRLF+탭 규칙과 node 치환, 산출물 주석 정리 규칙(@ 표시), 런타임 스크립트와 프리렌더가 같은 규칙을 이중 구현한다는 점을 담는다. 로컬서버·serve·Live Server·CRLF·탭·주석·@·prerender.js·dynamicImport 키워드에서 사용.
---
# 작업 환경 (로컬 서버 · 줄바꿈 · 산출물 주석 · 런타임 스크립트)

## 1. 로컬 서버는 `npm run serve` (Live Server 사용 금지)

```sh
npm run serve      # = node scripts/serve.js  →  http://localhost:3500 (고정)
```

- `http://localhost:3500/` 가 작업 목록(`index.html`), 원본은 `/html/파일명`, 산출물은 `/prerender/파일명`.
- **`fetch` 기반**(파셜·목록)이라 `file://` 로 열면 동작하지 않는다.
- **Live Server(VSCode 확장)로 구동하지 않는다.** 응답 HTML 에 라이브리로드 스크립트를 주입하는데,
  `dynamicImport.js` 가 `fetch` 로 불러오는 **파셜**에는 `</body>` 가 없어 **`</svg>` 앞에 스크립트가 끼어 들어간다.
  → SVG·후속 마크업이 깨지고 WebSocket 스크립트가 반복 실행된다(`dynamicImport.js` 에 제거 방어 코드가 있지만 애초에 쓰지 않는다).
- ⚠ `serve` 는 **cleanUrls 가 기본**이라 `/prerender/a.html` 로 들어가도 주소가 `/prerender/a` 로 바뀐다.
  **현재 파일명으로 무언가를 판정하는 스크립트**(활성 메뉴 등)는 확장자를 떼고 비교한다.
- **포트는 3500 고정이다.** `scripts/serve.js` 가 포트를 먼저 잡아 보고, 이미 쓰이고 있으면 **다른 포트로 뜨지 않고 실패한다** — 조용히 다른 포트로 떠서 안내 주소가 어긋나는 일을 막는다.
  ⚠ `serve` 의 `--no-port-switching` 옵션은 **동작하지 않는다**(14.2.6 은 도움말에만 있고 코드가 읽지 않아 49xxx 로 뜬다). 그래서 스크립트로 막았다.
  실패하면 떠 있는 서버를 먼저 끈다(`netstat -ano | findstr :3500` → `taskkill /PID <pid> /F`).
- 다른 퍼블 저장소와 **포트를 겹치지 않게** 둔다(동시에 띄우면 뒤에 띄운 쪽이 실패한다). 바꾸려면 `scripts/serve.js` 의 `PORT` 를 고치고 이 문서·README 의 주소도 함께 고친다.
- `serve` 는 **버전을 고정**해 받는다(`scripts/serve.js` 의 `SERVE`) — 최신판이 옵션·cleanUrls 동작을 바꿔도 환경이 흔들리지 않는다.

## 2. `public/` 소스는 **CRLF + 탭** · Prettier · ESLint

- `.editorconfig` 와 `.vscode/settings.json`(`files.eol`)이 맞춰 둔다. 프리렌더도 산출물을 CRLF 로 쓴다.
- 문자열 치환(Edit)이 **"String to replace not found"** 로 실패하면 **탭 개수**와 **CRLF** 를 먼저 의심한다.
  - 확인 : `sed -n 'A,Bp' file | cat -A` — `^I`(탭) · `^M$`(CRLF 줄끝)
  - 여러 줄 앵커가 계속 실패하면 **node 로 정규식 치환**(`\r?\n`, `\t+`)한다.

| 도구 | 설정 | 명령 | 맡는 것 |
| --- | --- | --- | --- |
| **Prettier** | `.prettierrc` · `.prettierignore` | `npx prettier --write <파일>` · `npm run format(:check)` | 모양 — 탭 · CRLF · 따옴표 · 120자. JSON 은 공백 |
| **ESLint 9** | `eslint.config.js` (flat) | `npm run lint` · `lint:fix` | 버그 — 미정의 변수 · `==` · 빈 블록. `public/js` · HTML 인라인 script · `scripts` |
| **html-validate** | `.htmlvalidate.json` | `npm run validate` | **산출물**(`public/prerender`) 마크업 — 닫는 태그 · 중복 id · 허용 자식. 원본·파셜은 조각이라 검사하지 않는다 |
| **커밋 훅** | `package.json` 의 `simple-git-hooks` · `lint-staged` · `scripts/precommit.js` | 커밋 시 자동 | ① 스테이징 파일 ESLint·Prettier ② 원본이 있으면 프리렌더 → 산출물 자동 add ③ 산출물 html-validate |

- **정렬은 고친 파일만** 돌린다. 전체 `format` 은 작업자가 요청할 때만 — diff 가 커져 검토가 어렵다.
- Prettier 는 `public/prerender` · `*.md` · `.claude` 를 **건드리지 않는다**(산출물 · 손으로 맞춘 표).
- Prettier 가 HTML 속성을 **여러 줄로 나눠도** 프리렌더는 그대로 읽는다. 목록 컨테이너는 `></tbody>` 로 **비어 있는 채** 남는다. `{{ }}` · `{{{link}}}` · `{{key|기본값}}` 도 보존된다(확인함).
- ⚠ **`common.js` 에 공통 함수를 추가하면 `eslint.config.js` 의 `COMMON_FUNCTIONS` 에 이름을 적는다** — 안 적으면 HTML 인라인 script 에서 부를 때 `no-undef` 로 잡힌다.
- **html-validate 에서 끈 규칙** : `doctype-style`·`void-style`(Prettier 표기와 충돌) · `no-inline-style`(퍼블 관행). 접근성(`wcag/*`·`unique-landmark`)·`prefer-tbody`·`no-implicit-button-type` 은 **warning** — 커밋을 막지 않는다.
- **커밋 훅이 막는 것** : 스테이징 안 된 원본 변경(산출물에 섞이므로) · 프리렌더 경고(`! 파셜 없음` 등 — **stderr** 로 나온다) · 원본 없는 산출물 · html-validate error. ⚠ **AI 는 `--no-verify` 를 쓰지 않는다.**
- `public/js` 는 모듈이 아니라 **최상위 선언이 전역**이라 `no-unused-vars` 를 `vars: local` 로 둔다(onclick 이 부르는 함수를 「안 쓰인다」로 보지 않는다).

```sh
node -e "const fs=require('fs');const f='public/html/X.html';let s=fs.readFileSync(f,'utf8');s=s.replace(/찾을\r?\n\t+패턴/,'바꿀');fs.writeFileSync(f,s)"
```

## 3. 산출물 주석 정리 — `@` 표시

`npm run prerender` 는 **전개가 끝난 뒤** 주석을 정리한다(원본은 건드리지 않는다). 끄려면 `npm run prerender:keep`.

| | HTML 주석 | 인라인 script 주석 |
| --- | --- | --- |
| **남는다** | `<!--@ … -->` · 닫음 표시 `<!--// … -->` · 주석 처리한 마크업 · **50자 이하 한 줄 구역 표시** | **`//@ …` · `/*@ … */` 만** |
| **지워진다** | 날짜 메모 `<!-- 26.01.09 : … -->` · `⚠` 로 시작 · 긴 설명·여러 줄 | 그 밖의 **줄 전체 주석** (꼬리 주석은 안 건드린다) |
| **줄어든다** | `<!-- 구역 — 설명 -->` → `<!-- 구역 -->` (괄호 밖 「 — 」 앞까지) | — |

- **`@` 는 산출물에서 떨어진다** — 개발자가 보는 모양은 평범한 주석이다.
- 이웃한 두 주석이 같은 구역을 가리키면(파셜 include 주석 + 파셜 머리 주석) **짧은 쪽만** 남는다.
- **닫음 표시는 여는 주석과 같은 기준으로 판정한다** — 여는 쪽이 지워지면 닫는 쪽도 지워진다.

> 🤖 **AI 작업 규칙:** 개발단이 알아야 하는 조건·연동 지침(「~일 때만 노출」·「확인 후 OO 로 이동」)에는 **반드시 `@`** 를 붙인다.
> 글자 수로는 설명과 구분되지 않아, 표시가 없으면 **길어서 지워진다.**

## 4. 런타임 스크립트와 프리렌더는 **같은 규칙을 두 번 구현**한다

| 기능 | 런타임(브라우저) | 프리렌더(Node) |
| --- | --- | --- |
| 파셜 include · `data-*` → `{{key}}` · `{{key\|기본값}}` | `public/js/dynamicImport.js` | `scripts/prerender.js` `expandPartials`·`partialVars`·`fillVars` |
| 목록 렌더 · `_tpl` · `data-filter` | `public/js/listRender.js` | `scripts/prerender.js` `expandLists`·`applyFilter`·`fillTemplate` |

> ⚠ **한쪽만 고치면 `npm run serve` 로 본 화면과 index(산출물)로 본 화면이 달라진다.** 두 파일을 함께 고치고 `Sample.html` 로 양쪽을 확인한다.

### 알려진 차이 (고치지 않았으면 피한다)

- **`data-*` 키 대문자** — 브라우저는 속성명을 소문자로 내려 `dataset` 키가 달라진다(프리렌더는 원문 그대로). **케밥으로 적는다.**
- **목록 컨테이너가 비어 있지 않으면** — 런타임은 `innerHTML` 로 덮어 렌더하지만 프리렌더는 **빈 컨테이너만** 인식한다.
- **주석 처리한 include·목록** — 프리렌더는 주석 안을 전개하지 않는다(런타임도 주석 안 요소를 보지 못한다).

### 이벤트 순서

```
DOMContentLoaded
 └ dynamicImport : 파셜 fetch → 재귀 전개 → replaceWith → 'dynamic-content-loaded'
    └ listRender : JSON fetch → template 채움 → 'dynamic-list-loaded'
```

- 파셜 안 `<script>` 는 삽입 후 한 번 실행된다. 이미 로드된 `src` 는 다시 불리지 않는다.
- 페이지 스크립트가 파셜 요소를 찾으려면 `dynamic-content-loaded`, 목록 행을 찾으려면 `dynamic-list-loaded` 에 건다.
