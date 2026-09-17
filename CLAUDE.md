# 퍼블리싱 base 프로젝트 지침

이 저장소에서 작업할 때는 아래를 **항상 준수**한다.
상세 규칙은 **스킬**에, 과거 작업 이력은 **`docs/WORKLOG.md`** 에 있다. 필요할 때 꺼내 쓴다.

> 🎨 **스타일은 `public/scss/*.scss` 만 고친다** — `public/css/*.css` 는 작업자가 VSCode **Watch Sass**(Live Sass Compiler)로 만드는 산출물이다. AI 는 css 를 만들거나 고치지 않는다. → `pub-scss`

---

## ⚡ 매 작업 필수 4가지

| # | 규칙 |
| --- | --- |
| 0 | **스타일은 `.scss` 만 수정** — `.css` 직접 수정 금지. 컴파일은 **작업자가 Watch Sass** 로 한다(AI 는 프로젝트 css 를 만들지 않는다 · 문법 확인은 scratchpad 출력만). 색은 **`_variable` 토큰만**, 폰트 굵기는 **시안 값 그대로**. |
| 1 | **로컬 서버는 `npm run serve`(**http://localhost:3500 고정** · `scripts/serve.js`)** — VSCode Live Server 금지(파셜에 라이브리로드 스크립트가 주입돼 마크업이 깨진다). |
| 2 | **HTML·파셜·JSON 을 수정했으면 `npm run prerender`** 로 산출물을 갱신하고 원본과 **함께 커밋**한다. |
| 3 | **프리렌더 다음에 `public/index.html` 의 작업일자를 갱신**한다 — 신규 페이지는 등록하고 **`create_date`·`update_date` 를 둘 다 오늘로**, 화면이 달라진 기존 페이지는 `update_date` 만. **시키지 않아도 매 작업 끝에 한다.** |

```sh
npm run prerender                   # public/html 전체 → public/prerender/ (기본. 이걸 쓴다)
npm run prerender -- Sample.html    # 특정 파일만 (페이지 간 링크가 404 나므로 확인용으로만)
npm run prerender:watch             # 저장할 때마다 자동 재생성
npm run lint                        # ESLint (JS · HTML 인라인 script)
npx prettier --write <고친 파일>    # 정렬 — 고친 파일만
npm run validate                    # 산출물 마크업 검사 (html-validate)
```

> 🔒 **커밋 직전 검사가 걸려 있다**(simple-git-hooks → lint-staged → `scripts/precommit.js`).
> ESLint·Prettier 를 돌리고, 원본이 커밋에 있으면 **프리렌더를 돌려 산출물을 자동으로 커밋에 넣는다.**
> 스테이징 안 된 원본 변경 · 파셜 경로 오류 · 원본 없는 산출물 · 마크업 오류(html-validate error)면 **커밋이 막힌다.**
> ⚠ AI 는 **`--no-verify` 로 건너뛰지 않는다.** 막히면 원인을 고치고, 규칙이 틀렸다고 판단되면 작업자에게 묻는다.

> **프리렌더가 왜 필수인가** — `public/index.html` 의 페이지 링크가 **전부 `./prerender/*.html`** 을 가리킨다.
> 원본만 고치고 프리렌더를 돌리지 않으면 **index 에서 열어본 화면에 변경이 반영되지 않는다.**
> 산출물은 `.gitignore` 대상이 **아니다.**

> **index 갱신이 왜 필수인가** — `index.html` 이 **작업 목록(무엇을 언제 만들고 고쳤나)** 그 자체다.
> ```js
> viewlist('제목', 'create_date', './prerender/파일.html', '비고', 'update_date', '작성자');
> ```
> - 강조(분홍)는 **`update_date >= HIGHLIGHT_FROM`** 하나로만 켜진다. 검수 차수가 바뀌면 `HIGHLIGHT_FROM` 한 줄만 고친다.
> - **신규 페이지** — `create_date` · `update_date` **둘 다 만든 날**. ⚠ `update_date` 를 비우면 강조되지 않아 묻힌다.
> - **기존 페이지 수정** — `create_date` 는 그대로, `update_date` = 고친 날.
> - ⚠ **`update_date` 는 「화면·동작이 달라진」 페이지에만 적는다.** 파셜·JSON 으로 옮긴 **구조 정리는 렌더 결과가 같으므로 적지 않는다.**
> - 파셜을 고쳤으면 **그 파셜을 include 한 페이지**(`grep -rl "_파셜명" public/html/*.html`)가 대상이다.

> 🗒 **산출물은 주석이 정리된 채로 나간다.** 프리렌더는 **퍼블 작업 메모를 걷어내고** 마크업을 읽는 데 쓰이는 것만 남긴다
> (`npm run prerender:keep` 로 끌 수 있다). 인라인 `<script>` 안도 함께 걷는다.
> **개발자가 꼭 봐야 하는 주석에는 `@` 를 붙인다** — 그것만 살아남는다. 산출물에서 `@` 는 떨어진다.
> ```html
> <!--@ 새 알림 있는 경우 new 추가 -->   →   <!-- 새 알림 있는 경우 new 추가 -->
> //@ 여기는 개발단이 붙인다             →   // 여기는 개발단이 붙인다
> ```
> 남는 것 : `@` 표시 · 닫음 표시(`<!--// … -->`) · 주석 처리한 마크업 · 50자 이하 한 줄 구역 표시
> 지워지는 것 : 날짜 메모(`<!-- 26.01.09 : … -->`) · `⚠` 로 시작하는 메모 · 긴 설명

> 📄 **`public/` 소스는 CRLF + 탭**이다(`.editorconfig`). 문자열 치환이 "String to replace not found" 로 실패하면
> **탭 개수와 CRLF 를 먼저 의심**하고, 여러 줄 앵커가 계속 실패하면 **node 로 치환**한다.

---

## 📁 구조

```
public/
├─ index.html                  작업 목록 (링크는 전부 ./prerender/)
├─ html/*.html                 페이지 원본 (루트에만 페이지)
├─ html/include/<폴더>/_*.html  파셜 — 서비스·기능별 폴더, 두 곳 이상이 쓰면 common/
├─ html/include/ui/_ui_*.html   공통 UI 컴포넌트 파셜 (드롭다운 · 입력 · 스테퍼 · LNB · 아코디언 · 토스트 · 확인창 · 날짜 · 기간)
├─ data/<기능>/*.json          목록 데이터
├─ prerender/*.html            산출물 (scripts/prerender.js 가 만든다 — 손으로 고치지 않는다)
├─ scss/                      _variable(토큰) · _mixin · _font(Pretendard) · _reset · common.scss(진입 → css/common.css)
├─ css/                       컴파일 산출물 (Watch Sass — 직접 고치지 않는다)
├─ font/Pretendard/           웹폰트 woff2
└─ js/
   ├─ dynamicImport.js         파셜 include   → 'dynamic-content-loaded'
   ├─ listRender.js            JSON 목록 렌더 → 'dynamic-list-loaded'
   ├─ common.js                공통 UI 동작 (pub-common-ui)
   └─ jquery-3.7.1.min.js      날짜 달력용 (jQuery UI 는 CDN)
```

```html
<div class="dynamic-content" data-source="./include/common/_header.html" data-page-title="제목"></div>
<tbody class="dynamic-list" data-source="../data/common/rows.json" data-template="#tpl_row" data-empty="#tpl_row_none"></tbody>
```

> ⚠ **경로 기준은 「페이지」다.** 파셜 안에서 다른 파셜을 include 할 때도 `./include/<폴더>/_x.html` 로 적는다.
> ⚠ **`dynamicImport.js` 와 `prerender.js` 는 같은 치환 규칙을 각각 구현한다 — 한쪽만 고치지 않는다.**
> 📄 동작 예시는 `public/html/Sample.html` — 실제 화면을 만들기 시작하면 샘플과 index 의 그 줄을 지운다.

---

## 📚 작업별 스킬 — 코드를 쓰기 **전에** 연다

| 하려는 일 | 스킬 |
| --- | --- |
| **새 화면·새 컴포넌트를 시작한다** · Figma 시안을 읽는다 · 새 클래스명을 정한다 | **`pub-new-screen`** |
| **공통 UI** — 드롭다운 · 입력 · 스테퍼 · LNB · 탭 · 아코디언 · 토스트 · 모달 · **날짜 · 기간 달력** · 전체 선택 · 공통 UI 네이밍 | **`pub-common-ui`** |
| 목록 · 테이블 · 카드처럼 **반복되는 행**을 만든다 · 프리렌더 · **index 작업일자 갱신** | **`pub-list-render`** |
| 같은 마크업이 두 곳 이상 생겼다 · 상태가 여러 개인 화면 · 새 페이지 · 운영 컴포넌트(배너·팝업) | **`pub-markup`** |
| 로컬 서버 · 줄바꿈/탭 · 산출물 주석 규칙 · 환경 문제 | **`pub-env`** |
| **SCSS 를 고친다** · 색 토큰 · 폰트 굵기 · 믹스인 · 아이콘 · 반응형 · 컴파일 · 공통 UI 스타일 파일 | **`pub-scss`** |

> 🤖 **판단이 서지 않으면 `pub-new-screen` 부터 연다.**

## 🤝 조사·검증은 에이전트에 맡긴다

| 상황 | 에이전트 |
| --- | --- |
| 여러 파일을 다 열어봐야 아는 조사 — 중복 마크업, 미연결 트리거, 클래스 사용처, 하드코딩 목록 | **`pub-scan`** |
| Figma 시안 실측 — **아트보드 여러 개**를 훑을 때만 | **`pub-figma`** |
| 작업 마무리 점검 — 태그 균형, 깨진 링크, index 누락, 스크립트 미로드 | **`pub-verify`** |

> 🤖 **위 성격의 요청은 표현과 무관하게 해당 에이전트에 위임한다.**
> 「전수검사해줘」·「이 클래스 어디서 써?」·「지워도 되나?」 → `pub-scan`
> 「아트보드 몇 개야?」·「화면 전체 규격 뽑아줘」·「상태별로 대조해줘」 → `pub-figma`
> 「커밋 전에 점검」·「빠진 거 없나?」·「링크 안 깨졌나?」 → `pub-verify`
>
> ⚠ **한두 번 호출로 끝나는 일은 직접 한다.** 판단 기준은 **양**이다 — 여러 파일·여러 노드면 위임, 한 곳이면 직접.
>
> ⚠⚠ **Figma 실측은 「먼저 직접」이 기본이다.** `get_node_info(노드id)` 는 자식 전부(색·폰트·좌표·radius·fills)를 한 번에 준다 —
> **모달·카드·위젯·행 하나는 1~2회로 끝난다.** 응답이 커서 잘리면 파일로 저장되니 `node -e` 로 파싱한다.
> 위임은 ① 아트보드 **여러 개** ② **상태 여러 벌** 대조 ③ **확대 렌더 판정 반복** — 이 셋뿐이다.
>
> ⚠⚠ **위임하기 전에 「무엇을 조사할지」부터 직접 확정한다.** 「선택 레이어」·「이거」라는 말이 나오면 **`get_selection` 을 직접 먼저** 부른다.
> 위임 프롬프트에 **폴백 대상을 적지 않는다** — 에이전트가 찾은 정답을 덮어써 오답을 정답처럼 만든다.

## 📒 과거 작업 이력 — `docs/WORKLOG.md`

신규로 만든 클래스·컴포넌트·페이지가 **왜 그렇게 됐는지**를 여기 남긴다. 자동으로 읽히지 않으니 검색한다.
**신규 항목을 만들었으면 이 파일 맨 아래에 한 줄 추가한다**(날짜 · 항목 · 위치 · 사유 · 작성자).

---

# 규칙 요약 — 자세한 건 각 스킬

1. **로컬 서버는 `npm run serve`.** Live Server 금지. → `pub-env`
2. **기존 작업물을 먼저 찾는다.** 클래스명 검색보다 **같은 UI 를 쓰는 화면**을 먼저 연다. 파셜은 **상태 예시**(`active`/`disabled`/`error`)인 경우가 많아 기준 마크업이 아니다. → `pub-new-screen`
3. **반복 목록은 JSON + `template` 요소.** 5행 이상이거나 행 수가 데이터에 따라 변하면 하드코딩하지 않는다. **0건 상태(`data-empty`)를 같은 커밋에서 함께** 만든다. → `pub-list-render`
4. **「~일 때만 노출」은 CSS 로 숨기지 않는다.** 마크업에 두고 조건은 `@` 주석으로 넘긴다(개발단 조건부 렌더링). 「같은 자리의 상태 전환」만 상태 클래스로.
5. **개발단에서 값이 채워지는 자리는 `{{ }}` 로 감싸 표시한다.** 사용량·금액·개수·조건부 문구. ⚠ **마커 안에 영문 한 단어만 넣지 않는다** — 파셜 변수·listRender 키로 잡혀 치환되거나 **지워진다**. → `pub-markup`
6. **공통 UI 는 `include/ui/_ui_*.html` 파셜을 `data-*` 로 include 한다.** 마크업을 복사하지 않는다. 네이밍은 **BEM + `ui-` 접두어**(`ui-블록__요소--변형`), 상태는 **`is-*` · `has-*`** — JS 가 붙이는 상태는 마크업에 쓰지 않는다. **보이고 숨기기는 상태 클래스 + `hidden`** 이고(닫힌 채 시작하는 요소에 `hidden` 을 적는다 · `style.display` 금지), **동작은 `onclick` 없이 클래스·`data-*`**(`data-modal-open` · `data-toast` …)로 `common.js` 가 처리한다 — 페이지에 전용 토글 스크립트를 남기지 않는다. 탭과 확인창이 아닌 모달은 파셜 없이 구조 규칙대로 쓴다. 날짜는 달력을 손으로 짜지 않고 `data-datepicker-day` / `data-datepicker` 표시만 넣는다. 함수를 추가하면 `eslint.config.js` 의 `COMMON_FUNCTIONS` 도 맞춘다. → `pub-common-ui`
7. **같은 마크업이 두 곳 이상이면 파셜로 뺀다.** 차이(id·문구)는 먼저 통일하거나 `data-*` 로 넘긴다. → `pub-markup`
8. **운영하며 갈아 끼울 컴포넌트는 틀(파셜)과 내용(JSON)을 가른다.** `type` → class, 노출은 `use`(`data-filter="use"`). → `pub-markup`
9. **상태가 여러 개인 화면은 전환 페이지 + 상태별 페이지를 함께** 만들고 index 에 등록한다. → `pub-markup`
10. **새 클래스명·파셜명은 `grep` 으로 충돌 검사부터.** → `pub-new-screen`
11. **설명 주석에 태그를 그대로 쓰지 않는다**(`template 요소`처럼 풀어 쓴다) — 프리렌더가 실제 태그로 오인한다.
12. **작업의 마지막은 프리렌더 → `index.html` 작업일자 갱신 → `WORKLOG.md` 기록** 순이다. 셋 다 **요청이 없어도** 한다. → `pub-list-render`

---

## 체크리스트 (작업/커밋 전)

- [ ] `.css` 를 직접 고치지 않고 `.scss` 를 고쳤다. 작업자가 Watch Sass 로 컴파일한 `.css` 와 **함께 커밋**한다.
- [ ] 색은 `_variable` 토큰만 썼다(HEX 직접 금지 · 토큰에 없으면 물었다). 폰트 굵기는 시안 값 그대로다.
- [ ] 닫힌 상태를 CSS `display: none` 으로 만들지 않았다(`hidden` 이 맡는다). 상태 클래스는 블록·요소와 함께 썼다.

- [ ] HTML·파셜·JSON 을 고쳤으면 **`npm run prerender`(전체)** 를 돌리고 산출물을 함께 커밋한다.
- [ ] **`public/index.html` 작업일자를 갱신했다** — 신규는 두 날짜 **둘 다** · 화면이 달라진 기존 페이지는 `update_date`. 구조 정리만 한 페이지에는 찍지 않았다.
- [ ] 신규 항목 생성 **전에** 기존 자산을 검색했고, 파셜의 **상태 예시**를 그대로 복사하지 않았다.
- [ ] 새 이름을 **grep 으로 충돌 검사**했다.
- [ ] 반복 목록을 하드코딩하지 않았고 **0건 상태**를 함께 만들었다.
- [ ] 페이지 전용 UI 스크립트를 새로 만들지 않았다(`common.js`).
- [ ] 「~일 때만 노출」을 `display: none` 분기로 만들지 않았다.
- [ ] 개발단이 채울 값을 **`{{ }}` 로 표시**했고, 마커 안이 **영문 한 단어만은 아니다**.
- [ ] 같은 마크업을 두 페이지에 복사하지 않았다(파셜로 분리).
- [ ] 신규 생성 항목을 **`docs/WORKLOG.md`** 에 기록하고 작업 보고에도 안내했다.
- [ ] 설명 주석에 **태그를 그대로 쓰지 않았다.** 산출물의 주석 균형을 확인했다.
- [ ] **개발자가 봐야 하는 주석에 `@` 를 붙였다.** 표시가 없으면 산출물에서 걷힌다.
- [ ] HTML·파셜을 고쳤으면 **`npm run validate`** 에 error 가 없다(커밋 훅도 검사한다).
- [ ] JS·인라인 script 를 고쳤으면 **`npm run lint`** 가 통과한다. 고친 파일은 **`npx prettier --write <파일>`** 로 정렬했다(전체 `format` 은 작업자가 요청할 때만).
