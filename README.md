# pub-base

정적 퍼블리싱 작업 환경 — **파셜 include · JSON 목록 렌더 · 프리렌더 · 작업 목록 · Claude Code 작업 규칙**.
빌드 도구 없이 순수 HTML/JS 로 동작하고, 산출물(`public/prerender/`)을 개발단에 넘긴다.

> 스타일은 SCSS 기본 세트(토큰 · 믹스인 · Pretendard · 초기화)만 들어 있다. 컴포넌트 스타일은 프로젝트에서 만든다.

---

## 1. 설치

| 도구 | 버전 | 비고 |
| --- | --- | --- |
| Node.js | 20 이상 (LTS 권장) | `node -v` |
| Git | — | |
| VSCode | — | 추천 확장은 열 때 안내된다(`.vscode/extensions.json`) |
| Bun | — | **Figma MCP 를 쓸 때만** (`.mcp.json` 이 `bunx` 로 실행) |

```sh
git clone <저장소 주소>
cd <폴더>
```

```sh
npm install     # prettier · eslint · html-validate · 커밋 훅 설치(prepare → simple-git-hooks)
```

> Windows 에서 npm 스크립트가 막히면 PowerShell 에서 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`.

## 2. 실행

```sh
npm run serve             # http://localhost:3500  (index = 작업 목록 · 포트 고정)
npm run prerender         # public/html → public/prerender
npm run prerender:watch   # 저장할 때마다 자동 재생성
npm run prerender:keep    # 주석 정리 없이
npm run lint              # ESLint — JS · HTML 인라인 script
npm run lint:fix          # 자동 수정 가능한 것만
npm run format            # Prettier — 전체 정렬
npm run format:check      # 정렬 안 된 파일만 확인
npm run validate          # html-validate — 산출물 마크업 검사(.htmlvalidate.json)
```

⚠ **VSCode Live Server 로 열지 않는다** — 파셜에 스크립트가 주입돼 마크업이 깨진다.

## 3. 구조

```
public/
├─ index.html                  작업 목록 — 링크는 ./prerender/
├─ html/*.html                 페이지 원본
├─ html/include/<폴더>/_*.html  파셜
├─ data/<기능>/*.json          목록 데이터
├─ prerender/                  산출물 (커밋한다)
├─ scss/                       _variable · _mixin · _font · _reset · common.scss
├─ css/                        Watch Sass 컴파일 산출물 (커밋한다)
├─ font/Pretendard/            woff2
└─ js/  dynamicImport.js · listRender.js · common.js · jquery-3.7.1.min.js
scripts/prerender.js
docs/PARTIALS.md               파셜(include) 사용법 · 주의점 · 예시 모음
docs/WORKLOG.md                신규 생성 항목 기록
CLAUDE.md · .claude/           Claude Code 규칙 · 스킬 · 에이전트
```

동작 예시 : `public/html/Sample.html` → http://localhost:3500/prerender/Sample
사용법 화면 : `public/html/Guide_Partial.html` → http://localhost:3500/prerender/Guide_Partial

## 4. 작업 순서

1. `public/html/`·`include/`·`data/` 수정
2. `npm run prerender`
3. `public/index.html` 에 `viewlist(…)` 등록·작업일자 갱신
4. 신규 항목은 `docs/WORKLOG.md` 에 한 줄
5. 커밋 — **커밋 직전 검사가 자동으로 돈다**(아래)

### 커밋 직전 검사 (simple-git-hooks → lint-staged → scripts/precommit.js)

| 순서 | 하는 일 | 막히는 경우 |
| --- | --- | --- |
| 1 | 커밋할 `.js` · `public/**/*.html` 에 ESLint --fix · Prettier, `.json` 에 Prettier | ESLint 오류 · Prettier 가 읽지 못하는 깨진 마크업 |
| 2 | 원본(`public/html` · `public/data`)이 커밋에 있으면 프리렌더 → **바뀐 산출물을 자동으로 커밋에 추가** | 커밋에 안 넣은 원본 변경이 있음 · 파셜/데이터/템플릿 경로 오류 · 원본 없는 산출물 |
| 3 | 커밋에 들어가는 산출물을 html-validate 로 검사 | 닫는 태그 누락 · 중복 id · 허용되지 않는 자식 요소 등 **error** (접근성 권고는 warning 으로 표시만) |

- 훅은 `npm install` 때 설치된다. 수동 설치 : `npx simple-git-hooks`
- 급할 때만 건너뛴다 : `git commit --no-verify`

## 5. 새 프로젝트로 시작할 때 바꿀 곳

- [ ] `package.json` — `name` · `description` · 포트는 `scripts/serve.js` 의 `PORT`(다른 저장소와 겹치지 않게)
- [ ] `README.md` · `CLAUDE.md` 제목
- [ ] `public/index.html` — `<title>` · `HIGHLIGHT_FROM`
- [ ] `public/html/Sample.html` · `include/common/_header.html` · `data/common/sample_list*.json` 과 index 의 샘플 줄 삭제
- [ ] `docs/WORKLOG.md` — 첫 줄 작성자
- [ ] `public/scss/_variable.scss` 의 색 토큰을 새 시안 팔레트로 교체(이름 체계는 유지)
- [ ] VSCode 에서 **Watch Sass** 를 켜 `public/css/common.css` 생성 후 커밋
- [ ] `git init` 후 첫 커밋 (복제해 왔다면 `.git` 을 지우고 새로 시작)

## 6. Claude Code

| 파일 | 역할 |
| --- | --- |
| `CLAUDE.md` | 매 작업 필수 규칙 · 체크리스트 (자동으로 읽힌다) |
| `.claude/skills/pub-new-screen` | 새 화면 시작 — 기존 자산 검색 · 반복 실수 표 · Figma 판독 함정 |
| `.claude/skills/pub-common-ui` | 공통 UI 함수 사용법 — 레이어 · 드롭다운 · 탭 · 스테퍼 · 지우기 버튼 · 전체 선택 · LNB · 날짜 달력 |
| `.claude/skills/pub-list-render` | JSON 목록 · 0건 상태 · 프리렌더 · index 작업일자 |
| `.claude/skills/pub-markup` | 파셜 · 파셜 변수 · `{{ }}` 마커 · 운영 컴포넌트 · 상태별 페이지 |
| `.claude/skills/pub-env` | 로컬 서버 · CRLF/탭 · 산출물 주석(`@`) · 런타임/프리렌더 이중 구현 |
| `.claude/agents/pub-scan` | 전수조사 (읽기 전용) |
| `.claude/agents/pub-verify` | 마무리 점검 (읽기 전용) |
| `.claude/agents/pub-figma` | Figma 대량 실측 (읽기 전용) |
| `.mcp.json` | TalkToFigma MCP |

**Figma 연동** : Bun 설치 → Figma 데스크톱에 **Cursor Talk To Figma** 플러그인 → 소켓 서버 `bunx cursor-talk-to-figma-socket` 실행 → 플러그인의 채널 ID 로 `join_channel`.
