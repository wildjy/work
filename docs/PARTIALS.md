# 파셜(include) 사용법

`public/html/include/` 의 파셜을 **어떻게 부르고 · 무엇을 넘기고 · 어디서 깨지는지**를 한 장에 모았다.
규칙의 근거는 두 파일이다 — 브라우저 `public/js/dynamicImport.js` · 산출물 `scripts/prerender.js`.

> 🖥 **같은 내용의 화면 판** : `public/html/Guide_Partial.html` → 작업 목록(index)의 「파셜(include) 사용법」.
> 표·예시는 `public/data/guide/*.json` 에 있다 — 고칠 때는 이 문서와 그쪽을 함께 본다.

> 관련 문서 : 목록(JSON) 렌더는 `.claude/skills/pub-list-render`, 공통 UI 파셜의 **동작**(열기·닫기·함수)은 `.claude/skills/pub-common-ui`,
> 설계 판단(언제 파셜로 빼나 · 운영 컴포넌트 · 상태별 페이지)은 `.claude/skills/pub-markup`,
> **어느 폴더에 두나**(슬라이스 · `section/` · `body/`)는 `docs/STRUCTURE.md`.

---

## 0. 30초 요약

```html
<!-- 부르는 쪽 : 페이지(public/html/*.html) 또는 다른 파셜 -->
<div class="dynamic-content" data-source="./include/common/_header.html" data-page-title="회원 관리"></div>

<!-- 받는 쪽 : public/html/include/common/_header.html -->
<header class="app-header">
	<h1 class="app-header__title">{{pageTitle|페이지 제목}}</h1>
</header>
```

<!-- auto:summary -->

|  | 규칙 |
| --- | --- |
| 컨테이너 | **`div` 태그 · `class="dynamic-content"` · 내용은 비운다** — 다른 태그로는 전개되지 않는다 |
| 경로 | `data-source` 는 **언제나 「페이지」 기준**(`./include/…`). 파셜 안에서도 같다 |
| 값 | `data-page-title="…"` → 파셜 안 `{{pageTitle}}` · 기본값은 `{{pageTitle\|페이지 제목}}` — **React 의 props 자리** |
| 마크업 덩어리 | `data-slot-body="#tpl_id"` → 파셜 안 `{{{body}}}` — **React 의 children 자리**(같은 파일의 template 요소를 가리킨다) |
| 결과 | include 한 `div` 는 **사라지고**(`replaceWith`) 파셜 내용이 그 자리에 들어간다 — React 의 Fragment 처럼 래퍼가 남지 않는다 |
| 마무리 | 고쳤으면 **`npm run prerender`** → `public/index.html` 작업일자 → `docs/WORKLOG.md` |

<!-- /auto:summary -->

### React 로 보면

<!-- auto:react -->

| 하려는 일 | 이 저장소 | React |
| --- | --- | --- |
| 조각 재사용 | `<div class="dynamic-content" data-source="…/_header.html"></div>` | `import Header` 뒤 `<Header />` |
| 값 넘기기 | `data-page-title="회원 관리"` (문자열만) | props — `<Header pageTitle="회원 관리" />` |
| 값 받기 | `{{pageTitle}}` | `{pageTitle}` |
| 기본값 | `{{pageTitle\|페이지 제목}}` | 매개변수 기본값 — `function Header({ pageTitle = "페이지 제목" })` |
| 원문(HTML) 넣기 | `{{{body}}}` | `dangerouslySetInnerHTML={{ __html: body }}` |
| 마크업 덩어리 넘기기 | 슬롯 — `data-slot-body="#tpl_id"` + template 요소 | `children` — `<Modal>{본문}</Modal>` |
| 반복 렌더 | JSON + template + `data-template` | `items.map((it) => <Row key={it.id} {...it} />)` |
| 걸러내기 | `data-filter="group=input"` | `items.filter((it) => it.group === "input")` |
| 0건 상태 | `data-empty="#tpl_none"` | `items.length ? … : <Empty />` |
| 감싸는 요소 | `replaceWith` 라 래퍼가 남지 않는다 | `<></>` (Fragment) |
| 조건부 노출 | 마크업에 두고 `<!--@ 조건 -->` 로 개발단에 넘긴다 | `{cond && <A />}` |
| 상태 전환 | 상태 클래스 + `hidden` (동작은 `common.js` 위임) | `useState` → 조건부 class · 조건부 렌더 |
| 미리 그려 두기 | `npm run prerender` → `public/prerender/*.html` | SSG — `next build` 가 만드는 정적 HTML |
| 주입이 끝나는 시점 | `dynamic-content-loaded` 이벤트 뒤에 DOM 에 있다 | 마운트 뒤(`useEffect`)와 같은 자리 |
| 이름 규칙 | BEM — `ui-블록__요소--변형` · 상태 `is-*` | CSS Module · styled-components 대신 전역 CSS |

<!-- /auto:react -->

> ⚠ **컴포넌트가 아니라 문자열 치환이다.** 상태도 생명주기도 없고 props 로는 **문자열만** 넘어간다 —
> 객체·함수·JSX 는 못 넘긴다(목록은 JSON 경로로, 마크업 덩어리는 슬롯으로).
> 값을 안 넘기면 빈칸이 되는 것이 아니라 `{{key}}` 가 **화면에 그대로 남는다.**
> `key` 는 없다 — 대신 같은 파셜을 한 화면에 두 번 넣을 때 **id 가 겹치지 않도록** 파셜이 `data-id` 를 받는다.

---

## 1. 어떻게 도는가 — 같은 규칙, 두 벌의 구현

| | 브라우저(실시간) | 산출물(개발 인계) |
| --- | --- | --- |
| 구현 | `public/js/dynamicImport.js` | `scripts/prerender.js` |
| 방식 | `fetch` 로 파셜을 가져와 치환 후 `replaceWith` (중첩은 재귀) | 같은 규칙을 Node 로 문자열 전개 → `public/prerender/*.html` |
| 변수 | `RAW_RE` / `ESC_RE` 블록 | `partialVars()` / `fillVars()` |
| 슬롯 | `data-slot-*` 처리 블록 | `resolveSlots()` / `fillSlots()` |

```
DOMContentLoaded
  → 파셜 주입(재귀)                    dynamicImport.js
  → 'dynamic-content-loaded' 발생
  → JSON 목록 렌더                     listRender.js  (파셜이 있으면 이 이벤트를 기다린다)
  → 'dynamic-list-loaded' 발생
```

- **파셜이 먼저, 목록이 나중이다.** 그래서 파셜 안에 목록 컨테이너를 넣어도 된다(§5).
- 파셜이 들어온 뒤에 잡아야 하는 스크립트는 `dynamic-content-loaded` 에 건다.
  `common.js` 의 공통 UI 는 **`document` 위임**이라 나중에 주입된 파셜에서도 그냥 동작한다 — 페이지에 따로 스크립트를 두지 않는다.
- ⚠ **두 구현 중 한쪽만 고치지 않는다.** 규칙이 갈리면 「화면은 되는데 산출물이 다르다(또는 그 반대)」가 된다.

---

## 2. 부르는 쪽 규칙

```html
<div class="dynamic-content" data-source="./include/ui/_ui_toast.html" data-id="save_toast" data-text="저장되었습니다."></div>
```

<!-- auto:call -->

| 규칙 | 이유 · 어기면 |
| --- | --- |
| **태그는 `div`** | 프리렌더가 `div` 만 잡는다(`PARTIAL_RE`). `span`·`li`·`td` 자리에는 파셜을 못 넣는다 — 문장 한가운데 툴팁을 넣지 못하는 이유다(`.ui-label` 을 flex 로 두고 옆에 둔다) |
| **컨테이너는 비운다** | `<div …></div>`. 안에 내용을 적으면 전개 대상이 아니다. 슬롯도 내용을 넣지 않고 template 요소를 가리킨다 |
| **경로는 페이지 기준** | `fetch` 가 문서 기준이라 파셜 안에서도 `./include/…` 로 적는다. 파셜 위치 기준(`./_x.html`)으로 적으면 404 |
| **class 를 더 줘도 사라진다** | `replaceWith` 라 래퍼가 남지 않는다. 위치 보정은 **형제 셀렉터**나 파셜이 받는 `data-modifier` 로 한다 |
| **주석 처리하면 전개되지 않는다** | 런타임·프리렌더 모두 주석 안은 건너뛴다. 잠깐 끄고 싶을 때 안전하게 쓸 수 있다 |
| **순환 include 를 만들지 않는다** | 프리렌더는 경고하고 건너뛰지만 **브라우저에는 방어가 없다** — 요청이 멈추지 않는다 |

<!-- /auto:call -->

---

## 3. 값 넘기기 — `data-*` → `{{key}}`

```html
<div class="dynamic-content" data-source="./include/ui/_ui_input.html"
     data-id="join_email" data-placeholder="이메일을 입력해주세요."></div>
```

| | |
| --- | --- |
| 키 이름 | `data-page-title` → `{{pageTitle}}` (dataset 규칙 · 케밥 → 카멜) |
| 이스케이프 | `{{key}}` 는 HTML 이스케이프 · `{{{key}}}` 는 원문 그대로(태그를 넘길 때) |
| 기본값 | `{{key|기본값}}` — 넘기지 않으면 기본값이 들어간다. **기본값은 이스케이프하지 않는다** |
| 값이 없어도 되는 자리 | `{{name|}}` 처럼 **빈 기본값**을 준다 |

> ⚠ **기본값이 없는 키를 넘기지 않으면 `{{key}}` 가 화면에 글자로 남는다.**
> (파셜 안 목록 템플릿의 중괄호를 먼저 먹지 않으려는 설계다) 여러 화면이 쓰는 파셜은 **필수 값 외에는 전부 기본값을 준다.**
>
> ⚠ **`data-*` 키에 대문자를 쓰지 않는다.** `data-makeNew` 는 브라우저에서 `dataset.makenew` 가 돼 **브라우저만 치환에 실패한다**(프리렌더는 성공) — 기본값이 있으면 조용히 갈려 화면과 산출물이 달라진다.

### 이스케이프와 원문 — 어느 쪽을 쓰나

<!-- auto:syntax_escape -->

| 무엇이 | `{{key}}` — 이스케이프 | `{{{key}}}` — 원문 |
| --- | --- | --- |
| 값에 태그가 들어 있으면 | `& < > " '` 가 엔티티로 바뀌어 **글자로 보인다** | **마크업으로 살아난다** |
| 속성값 자리 `href="…"` · `style="…"` | **안전하다** — `"` 가 `&quot;` 로 나가고 브라우저가 되돌려 읽는다 | **따옴표가 깨진다.** 값에 `"` 가 하나라도 있으면 속성이 거기서 끊긴다 — 대신 **속성 묶음 전체**를 받는다 |
| 언제 쓰나 | **기본.** 개발단에서 사용자 입력이 들어올 자리는 반드시 이쪽 | 신뢰할 수 있는 값 · **개수가 변하는 조각** · 속성 묶음(`{{{attrs\|}}}`) |
| 두 패스의 순서 | **두 번째**로 돈다 | **먼저** 돈다 — 그래서 원문으로 꽂은 값 안에 중괄호가 있으면 **두 번째 패스가 그것을 다시 훑는다** |

<!-- /auto:syntax_escape -->

### 같은 괄호, 다른 규칙 — 파셜 변수와 목록 템플릿

파셜 안에 목록 `template` 이 들어 있으면 **같은 `{{ }}` 를 두 구현이 각각 본다.** 규칙이 갈리는 자리가 사고가 나는 자리다.

<!-- auto:syntax_scope -->

| 무엇이 | 파셜 변수 — `data-*` | 목록 템플릿 — JSON |
| --- | --- | --- |
| 값은 어디서 오나 | 부르는 쪽의 `data-*` 속성 | JSON 배열의 항목 하나 |
| 안 넘긴 키 | **중괄호가 그대로 남는다** — 화면에 `{{explain}}` 이 찍힌다 | **빈 문자열로 사라진다** — 경고가 없다 |
| 왜 다른가 | 파셜 안에 목록 template 이 들어 있을 때 그쪽 키를 **먼저 먹지 않으려고** | 값이 없는 칸은 비우는 것이 맞아서 → **JSON 이 모든 필드를 갖는다** |
| 기본값 `{{key\|기본}}` | **된다.** 기본값은 **이스케이프하지 않는다**(파셜에 직접 쓴 HTML 이라) | **안 된다.** 정규식이 `\|` 를 몰라 **매치 자체가 안 돼** 중괄호가 글자로 남는다 |
| 순번 | 없다 | `{{@index}}` 0부터 · `{{@number}}` 1부터 |
| 마크업 덩어리 | `data-slot-*` → `{{{이름}}}` 로 받는다 | 없다 — 행 구조가 다르면 항목의 `_tpl` 로 **템플릿째** 바꾼다 |
| 구현 | `prerender.js` 의 `fillVars()` · `dynamicImport.js` 의 같은 블록 | `listRender.js` 의 `fillTemplate()` · `prerender.js` 의 같은 함수 |

<!-- /auto:syntax_scope -->

> ⚠ **파셜 안 목록 `template` 에는 `|` 를 쓰지 않는다.** 「안 넘긴 키를 그대로 둔다」는 보호는 **기본값이 없을 때만** 든다 —
> `{{name|이름없음}}` 은 파셜 변수 패스가 **먼저 채워버려** listRender 가 볼 것이 남지 않는다.

### 조건부 속성은 `{{{attrs|}}}` 로 받는다

문자열 변수로는 `checked` 같은 속성을 조건부로 넣을 수 없다. 파셜이 **원문 자리**를 열어 둔다.

```html
<!-- 파셜(_ui_checkbox.html) -->
<input type="checkbox" id="{{id}}" name="{{name|}}" value="{{value|}}" {{{attrs|}}} />

<!-- 부르는 쪽 -->
<div class="dynamic-content" data-source="./include/ui/_ui_checkbox.html"
     data-id="agree_sms" data-label="문자 수신" data-attrs="checked disabled"></div>
```

### 중첩 include 의 `data-source` 에도 변수를 쓸 수 있다

모달 프레임이 **버튼 영역 파셜을 갈아 끼우는** 방식이다(런타임·프리렌더 양쪽 동작 확인됨).

```html
<!-- 파셜(_ui_modal.html) 안 -->
<div class="dynamic-content" data-source="{{footer|./include/ui/_ui_modal_footer.html}}"
     data-cancel="{{cancel|취소}}" data-confirm="{{confirm|확인}}"></div>
```

---

## 4. 마크업 덩어리 넘기기 — 슬롯(`data-slot-*`)

문구가 아니라 **여러 줄 마크업**이면 변수가 아니라 슬롯으로 넘긴다(React 의 children).

```html
<!-- 부르는 쪽 : 컨테이너는 비우고, 내용은 같은 파일의 template 에 적는다 -->
<div class="dynamic-content" data-source="./include/ui/_ui_modal.html"
     data-id="modal_invite" data-title="멤버 초대" data-slot-body="#modal_invite_body" data-confirm="초대하기"></div>

<template id="modal_invite_body">
	<div class="grid">…</div>
</template>

<!-- 받는 쪽(_ui_modal.html) -->
<div class="ui-modal__body">{{{body}}}</div>
```

| | |
| --- | --- |
| 키 이름 | `data-slot-body` → 파셜 안 `{{{body}}}` (케밥 → 카멜) |
| 값 | **template 요소의 아이디 선택자**(`#아이디`) — 마크업을 속성에 직접 적지 않는다 |
| template 위치 | include 를 적은 **같은 파일**(페이지든 파셜이든). 산출물에서는 template 정의가 걷힌다 |
| 없어도 되는 슬롯 | 파셜에 `{{{body|}}}` — 넘기지 않으면 프리렌더가 **그 줄을 지운다** |

- **슬롯 안에서 파셜을 include 할 수 있다.** 여러 화면이 함께 쓰는 본문은 이렇게 넘긴다.
  ```html
  <template id="modal_invite_body">
  	<div class="dynamic-content" data-source="./include/member/_modal_invite_body.html"></div>
  </template>
  ```
- ⚠ **슬롯 이름을 파셜 안 목록 템플릿의 필드명과 겹치지 않게** 짓는다. 겹치면 목록 필드 자리까지 슬롯 내용으로 덮인다
  (아코디언 파셜은 항목 필드로 `{{{body}}}` 를 쓴다 → 그 파셜에 `data-slot-body` 를 넘기면 안 된다).
- ⚠ **`{{body}}` 처럼 두 겹으로 적으면 태그가 글자로 보인다.** 슬롯은 항상 세 겹.

### 본문을 어디에 두나

본문은 `template` 안에 **직접** 적어도 되고, 파셜로 빼고 `template` 이 그 파셜만 부르게 해도 된다.
기준은 **길이와 재사용**이다 — 처음부터 다 파일로 만들면 파일만 늘어난다.

<!-- auto:slot_place -->

| 본문이 이렇다면 | 이렇게 |
| --- | --- |
| 10줄 안팎 · 그 화면 전용 | 부르는 파일의 `template` 안에 **직접 적는다** — 파일을 따로 만들 이유가 없다 |
| 입력 · 표가 들어가 30줄을 넘는다 | `<슬라이스>/body/` 파셜로 빼고 `template` 은 그 파셜만 부른다 |
| 두 화면 이상이 같은 본문을 쓴다 | `<슬라이스>/body/` 파셜 — **두 곳이 되는 순간** 옮긴다. 다만 id 를 고정으로 가진 본문은 **한 페이지에 두 번 넣지 않는다**(id 가 겹친다) |
| 개발 인계에서 따로 떼어 봐야 한다 | `<슬라이스>/body/` 파셜 — 파일 하나가 화면 하나의 본문이 된다 |

<!-- /auto:slot_place -->

파셜로 뺄 때는 **슬라이스 폴더 아래 `body/` 세그먼트**에 모으고, 이름 셋을 한 규칙으로 묶는다
(`grep` 한 번에 다 잡힌다). 폴더 규칙 전체는 **`docs/STRUCTURE.md`**.

```
파일       include/sample/body/_sample_invite_body.html
template   id="sample_invite_body"
모달       data-id="sample_invite"
```

### ⚠ `template` 째 파셜로 빼면 순서에 묶인다

위는 **본문 마크업만** 파셜로 뺀 형태다. `template` 요소째 빼는 것도 되지만,
파셜은 **적힌 순서대로** 전개되므로 뒤에 둔 파셜의 `template` 은 슬롯을 채울 때 아직 없다.

<!-- auto:slot_order -->

| 배치 | 브라우저 | 프리렌더 |
| --- | --- | --- |
| `template` 이 include 보다 **뒤** (같은 파일) | ✅ | ✅ |
| `template` 이 include 보다 **앞** (같은 파일) | ✅ | ✅ |
| **template 째** 파셜로 빼고 사용처보다 **앞**에서 include | ✅ | ✅ |
| **template 째** 파셜로 빼고 사용처보다 **뒤**에서 include | ❌ 본문이 **빈 채로** 렌더 (콘솔 경고만) | ❌ `! 슬롯 template 없음` 경고 |

<!-- /auto:slot_order -->

못 찾으면 **조용히 빈 본문**으로 나간다(프리렌더만 경고를 찍는다).
그래서 `template` 은 **include 를 적은 파일에** 두고 내용만 파셜로 뺀다.
굳이 한곳에 모아 두려면 **모든 사용처보다 앞에서** include 한다.

> 드롭다운의 `_ui_dropdown_tpl.html` 은 `template` 을 파셜로 뺀 형태지만 사정이 다르다 —
> 그건 **목록 template** 이라 파셜 주입이 전부 끝난 뒤에야 쓰인다.


---

## 5. 파셜 안에서 목록(JSON) 쓰기

파셜이 목록보다 **먼저** 주입되므로, 파셜 안에 목록 컨테이너와 템플릿을 함께 둘 수 있다.
드롭다운이 그 예다 — JSON 경로만 화면이 넘긴다.

```html
<!-- 부르는 쪽 -->
<div class="dynamic-content" data-source="./include/ui/_ui_dropdown.html"
     data-items="../data/ui/sample_options.json" data-placeholder="정렬을 선택해주세요."></div>

<!-- 받는 쪽(_ui_dropdown.html) -->
<ul class="dynamic-list" data-source="{{items}}" data-template="#tpl_ui_dropdown_item" data-empty="#tpl_ui_dropdown_empty"></ul>
<div class="dynamic-content" data-source="./include/ui/_ui_dropdown_tpl.html"></div>
```

- **목록 경로(`data-items`)는 `../data/…`** — 목록 렌더도 페이지 기준이다.
- 템플릿만 담은 파셜(`_ui_dropdown_tpl.html`)을 따로 두면 **여러 파셜이 템플릿을 함께 쓴다**(드롭다운 · 검색 드롭다운).
- ⚠ 파셜 안 목록 템플릿의 `{{name}}` 은 **파셜 변수와 같은 괄호**다. 파셜에 같은 이름을 넘기면 **파셜 변수가 먼저 먹는다** — 이름을 갈라 쓴다.

---

## 6. 파셜을 새로 만들 때

1. **폴더** — 한 기능만 쓰면 `include/<기능>/`, **두 곳 이상이 쓰게 되면 `common/`** 으로 옮긴다(옮길 때 `data-source` 를 전부 고친다).
   공통 UI 컴포넌트는 `include/ui/_ui_*.html`.
2. **파일명은 저장소 안에서 고유하게.** `_` 로 시작한다(프리렌더가 페이지로 오인하지 않는다).
3. **머리 주석에 「받는 값」을 적는다.** 이 저장소의 모든 파셜이 같은 형식이다.
   ```html
   <!-- 공통 입력 — 받는 값 : data-id(필수) · data-placeholder · data-value · data-modifier -->
   ```
4. **재사용할 파셜은 `id` 를 `data-*` 로 받는다** — `id="{{id}}"` · `id="{{id}}_title"`. 고정 id 를 박으면 한 페이지에 두 번 못 넣는다.
5. **활성 상태를 파셜에 박지 않는다.** 현재 메뉴·현재 탭은 `common.js`(`lnbActive`) 나 페이지의 `dynamic-content-loaded` 에서 붙인다.
6. **새 이름은 `grep` 으로 충돌 검사**하고, 만들었으면 `docs/WORKLOG.md` 에 한 줄 남긴다.
7. `npm run prerender` 로 **파셜 개수가 늘었는지** 확인한다 — 페이지마다 `✓ 파일명 (파셜 n / 목록 n · n행)` 이 찍힌다.

---

## 6-1. 어느 것을 고를까 — 위에서부터 걸리는 데서 멈춘다

앞의 절들은 도구를 하나씩 설명했다. 실제로 막히는 자리는 「무엇을 쓸까」다 — **아래로 갈수록 자유롭고 그만큼 위험하다.**

<!-- auto:ladder -->

| 무엇이 다른가 | 쓰는 것 | 어디에 적혀 있나 |
| --- | --- | --- |
| **문구 한 줄** | `{{key\|기본값}}` 으로 받는다 | 값 넘기기 |
| **모양만 (색 · 크기 · 정렬)** | class 이름을 값으로 받는다 — `class="ui-btn {{tone\|}}"` | class · 속성 · style |
| **속성이 있다 / 없다** | `{{{attrs\|}}}` 한 자리에 `"checked disabled"` 를 통째로 | class · 속성 · style |
| **길이 · 표시 여부** | `style="width: {{width\|10}}%"` | class · 속성 · style |
| **덩어리가 통째로 있다 / 없다** | **경로 변수 + 빈 파셜** — `data-source="{{block\|./include/common/_none.html}}"` | 경로 변수 |
| **껍데기는 같고 **본문**이 다르다** | **슬롯** — `data-slot-body` → `{{{body}}}` | 슬롯 |
| **행이 반복된다** | **JSON + template** — `data-source` · `data-template` | 목록 |
| **같은 데이터를 화면마다 **잘라** 쓴다** | `data-filter="group=summary"` | 목록 |
| **그 행만 **구조**가 다르다** | 항목에 `"_tpl": "#다른템플릿"` | 목록 |
| **운영하며 계속 갈아 끼운다** | **틀은 파셜 · 내용은 JSON** — `type` → class · `use` 로 켜고 끈다 | 운영 컴포넌트 |
| ****런타임에** 갈린다 (로그인 · 권한 · 기간)** | **마크업에 두고 `<!--@ … -->` 주석으로** 개발단에 넘긴다 | 개발단 주석 |
| **위 어느 것도 아니다** | `{{{key}}}` **원문 치환 — 마지막 수단** | 값 넘기기 |

<!-- /auto:ladder -->

> **판단이 안 서면 아래쪽이 아니라 위쪽을 고른다.** 위쪽은 할 수 있는 일이 적은 만큼 **틀리게 쓸 방법도 적다.**

---

## 7. 주의점 — 여기서 실수한다

<!-- auto:traps -->

| 함정 | 무슨 일이 나나 | 어떻게 |
| --- | --- | --- |
| **`div` 가 아닌 태그로 include** | 프리렌더가 전개하지 않아 **산출물에만 빈 자리**가 생긴다 | `div` 로 두고 레이아웃으로 위치를 맞춘다 |
| **컨테이너에 내용을 적음** | 전개되지 않는다 | 비운다. 마크업은 슬롯으로 넘긴다 |
| **래퍼 클래스가 사라진다** | include 한 `div` 에 준 class 가 없다 | 형제 셀렉터 · `data-modifier` |
| **넘기지 않은 키** | `{{key}}` 가 **글자로 보인다** — React 처럼 값이 없다고 빈칸이 되지 않는다 | 파셜에 기본값을 준다(React 의 기본 props 와 같은 자리) |
| **`data-*` 에 대문자** | 브라우저만 치환 실패 → **화면과 산출물이 다르다** | 케밥으로 적는다 (`data-make-new`) |
| **고정 `id` 파셜을 두 번 include** | id 중복 → 라벨·`getElementById` 가 **먼저 것만** 가리킨다 | id 를 `data-*` 로 받는다. `npm run validate` 의 `no-dup-id` 가 막아 준다 |
| **같은 본문 파셜을 슬롯 두 곳에** | 위와 같은 id 중복 | 본문 파셜도 id 를 받게 하거나 따로 만든다 |
| **슬롯 이름 ↔ 목록 필드명 충돌** | 목록 템플릿 자리가 슬롯 내용으로 덮인다 | 이름을 갈라 쓴다 (아코디언은 항목 필드로 `{{{body}}}` 를 쓴다) |
| **`data-text` 와 `data-slot-body` 를 함께** | 본문이 두 벌 나온다 | 택일한다 |
| **목록 템플릿 안의 include** | **브라우저에서는 전개되지 않고**(목록은 파셜 주입이 끝난 뒤 문자열로 찍힌다) 프리렌더는 펴 버려 **화면과 산출물이 갈린다** | 반복 행 안에는 include 를 두지 않는다 — **템플릿 자체를 파셜로** 만든다. **슬롯 template 은 다르다** — 실제 마크업이 되므로 동작한다 |
| **JSON 값 안의 `{{ }}`** | 치환이 두 번 돌아 **마커가 지워진다** | 중괄호를 엔티티(`&#123;`)로 적는다 — 이 페이지의 표가 그렇게 만들어졌다 |
| **파셜 안 경로를 파셜 기준으로** | 404 — 화면이 비어 있다 | 페이지 기준 `./include/…` |
| **빈 파셜에 짧은 주석 한 줄** | 「구역 표시」로 판정돼 산출물에 주석만 남는다 | 넣지 않는다 |
| **설명 주석에 태그를 그대로** | 프리렌더가 실제 태그로 오인한다 | 「template 요소」처럼 풀어 쓴다 |
| **개발단이 봐야 할 주석** | 산출물에서 걷힌다 | `<!--@ … -->` 로 표시한다 |
| **jQuery 가 필요한 파셜** | 날짜·기간 파셜은 jQuery UI 로 달력을 그린다 | 그 페이지에 `jquery` · `jquery-ui` 를 넣는다 |
| **브라우저 캐시** | 규칙을 고쳤는데 옛 `dynamicImport.js` 가 돌아 `{{{body}}}` 가 글자로 보인다 | `npm run serve`(no-store)로 띄우고 강력 새로고침 |
| **Live Server 로 열기** | 파셜 조각에 라이브리로드 스크립트가 주입돼 마크업이 깨진다 | `npm run serve` (http://localhost:3500) (http://localhost:3500) |
| **`template` 요소째 파셜로 빼서 사용처보다 **뒤**에서 include** | 슬롯을 채울 때 `template` 이 아직 없어 **본문이 빈 채로** 나간다 — 프리렌더만 경고를 찍는다 | `template` 은 **include 를 적은 파일에** 두고, 내용만 `<슬라이스>/body/` 파셜로 뺀다 |
| **`data-*` 를 **작은따옴표**로** | **브라우저는 읽고 프리렌더는 못 읽는다** — `partialVars()` 의 정규식이 큰따옴표만 본다. 값이 조용히 기본값으로 떨어진다 | 큰따옴표로 적는다. `npx prettier --write` 가 자동으로 맞춘다 |
| ****빈 값**을 넘김 — `data-tone=""`** | 「넘긴 것」이라 **기본값을 이긴다**. 안 넘긴 것과 결과가 다르다 | 기본값을 쓰려면 **속성을 아예 적지 않는다** |
| **참 · 거짓을 문자열로 — `data-checked="false"`** | 치환은 **글자 바꿔치기**라 참/거짓을 모른다. `<input false>` 가 되고 class 자리면 `class="ui-tag false"` 가 된다 | **끄는 방법은 「안 넘기는 것」 하나뿐이다** |
| **기본값 안에 `}`** | 정규식이 `[^}]*?` 라 **거기서 끊긴다** — 기본값이 잘린 채 나온다 | 중괄호가 필요한 값은 기본값에 두지 않고 **넘겨서** 채운다 |
| **파셜을 **「상태 예시」**인 채로 복사** | 파셜은 `is-active` · `is-error` 같은 상태를 보여주려 만들어 둔 것이 많다 — 복사하면 **그 상태가 따라온다** | 기준 마크업은 **실제 화면**에서 가져온다 |

<!-- /auto:traps -->

---

## 8. 예시 모음 — 지금 저장소에 있는 파셜

동작하는 전체 예시는 `public/html/Sample.html`(산출물 `public/prerender/Sample.html`).

<!-- auto:samples -->

### 공통 — `include/common/`

**헤더** — data-page-title

```html
<div class="dynamic-content" data-source="./include/common/_header.html" data-page-title="회원 관리"></div>
```

**LNB** — 받는 값 없음 — 메뉴는 파셜에서 고치고, 현재 메뉴 표시는 common.js 가 붙인다

```html
<div class="dynamic-content" data-source="./include/ui/_ui_lnb.html"></div>
```

### 입력 — `include/ui/`

**입력** — data-id(필수) · data-name · data-type · data-placeholder · data-value · data-modifier · data-helper · data-helper-type

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_input.html"&#10;&#9;data-id="join_birth"&#10;&#9;data-value="1999"&#10;&#9;data-modifier="is-error"&#10;&#9;data-helper="생년월일 8자리를 입력해주세요."&#10;&#9;data-helper-type="ui-helper--error"&#10;></div>
```

**드롭다운** — data-items(JSON 경로 · 필수) · data-placeholder · data-modifier

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_dropdown.html"&#10;&#9;data-items="../data/ui/sample_options.json"&#10;&#9;data-placeholder="정렬을 선택해주세요."&#10;></div>
```

**검색 드롭다운** — data-items(필수) · data-placeholder · data-name

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_dropdown_search.html"&#10;&#9;data-items="../data/ui/sample_options.json"&#10;&#9;data-placeholder="회사명을 검색해주세요."&#10;></div>
```

**수량 스테퍼** — data-id(필수) · data-name · data-value · data-min · data-max

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_stepper.html"&#10;&#9;data-id="order_count"&#10;&#9;data-value="1"&#10;&#9;data-min="1"&#10;&#9;data-max="3"&#10;></div>
```

**날짜 · 기간** — data-id(필수) · data-name · data-placeholder · data-value — 이 페이지에 jQuery · jQuery UI 가 있어야 한다

```html
<div class="dynamic-content" data-source="./include/ui/_ui_date.html" data-id="open_date"></div>&#10;<div class="dynamic-content" data-source="./include/ui/_ui_period.html" data-id="search_period"></div>
```

### 선택 · 안내 — `include/ui/`

**체크박스 · 라디오 · 토글** — data-id(필수) · data-label(필수) · data-name · data-value · data-attrs(checked · disabled) · data-modifier

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_checkbox.html"&#10;&#9;data-id="agree_sms"&#10;&#9;data-name="agree_sms"&#10;&#9;data-value="Y"&#10;&#9;data-label="문자 수신"&#10;&#9;data-attrs="checked"&#10;></div>&#10;<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_radio.html"&#10;&#9;data-id="open_all"&#10;&#9;data-name="open_range"&#10;&#9;data-value="all"&#10;&#9;data-label="전체 공개"&#10;></div>&#10;<div class="dynamic-content" data-source="./include/ui/_ui_toggle.html" data-id="use_push" data-label="알림 받기"></div>
```

**툴팁** — data-id(필수) · data-text(필수) · data-position(top · right · bottom · left) · data-label

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_tooltip.html"&#10;&#9;data-id="tip_email"&#10;&#9;data-position="right"&#10;&#9;data-text="가입 후에는 바꿀 수 없습니다."&#10;></div>
```

**아코디언** — data-items(JSON 경로 · 필수) · data-mode(single 하나만 열림 · multiple 여러 개)

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_accordion.html"&#10;&#9;data-items="../data/ui/sample_accordion.json"&#10;></div>
```

### 알림 · 모달 — `include/ui/` (페이지 끝에 둔다)

**토스트** — data-id(필수) · data-text · data-type(success · error) — 띄우기는 data-toast="아이디" 버튼

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_toast.html"&#10;&#9;data-id="save_toast"&#10;&#9;data-text="저장되었습니다."&#10;></div>
```

**확인창** — data-id(필수) · data-title(필수) · data-text · data-cancel · data-confirm · data-modifier

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_modal_confirm.html"&#10;&#9;data-id="del_confirm"&#10;&#9;data-title="이벤트를 삭제하시겠습니까?"&#10;&#9;data-text="삭제한 이벤트는 복구할 수 없습니다."&#10;&#9;data-confirm="삭제"&#10;></div>
```

**모달 프레임 (본문은 슬롯)** — data-id(필수) · data-title(필수) · data-slot-body(필수) · data-subtext · data-footer · data-cancel · data-confirm · data-modifier

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_modal.html"&#10;&#9;data-id="modal_invite"&#10;&#9;data-title="멤버 초대"&#10;&#9;data-subtext="초대할 멤버의 정보를 입력해주세요."&#10;&#9;data-slot-body="#modal_invite_body"&#10;&#9;data-confirm="초대하기"&#10;></div>&#10;<template id="modal_invite_body">&#10;&#9;<div class="dynamic-content" data-source="./include/member/_modal_invite_body.html"></div>&#10;</template>
```

**알림 모달 (버튼 없음)** — data-id(필수) · data-title(필수) · data-subtext · data-text · data-slot-body · data-modifier — data-text 와 슬롯은 택일

```html
<div&#10;&#9;class="dynamic-content"&#10;&#9;data-source="./include/ui/_ui_modal_alert.html"&#10;&#9;data-id="notice_alert"&#10;&#9;data-title="점검 안내"&#10;&#9;data-subtext="2026.09.20 02:00 ~ 06:00"&#10;&#9;data-text="점검 시간에는 로그인과 결제를 이용할 수 없습니다."&#10;></div>
```

<!-- /auto:samples -->
---

## 9. 증상 → 원인

<!-- auto:symptoms -->

| 화면에서 본 것 | 먼저 볼 것 |
| --- | --- |
| `{{key}}` 가 글자로 보인다 | 키를 안 넘겼다 / 파셜에 기본값이 없다 / `data-*` 에 대문자를 썼다 / 브라우저가 옛 JS 를 캐시했다 |
| `{{{body}}}` 가 글자로 보인다 | 슬롯을 안 넘겼다 / template 아이디가 다르다 / 옛 `dynamicImport.js`(강력 새로고침) |
| 파셜 자리가 통째로 비어 있다 | 경로가 파셜 기준이다(페이지 기준으로 적는다) / 파일명 오타 — 콘솔과 프리렌더 경고(`! 파셜 없음`)를 본다 |
| 화면은 되는데 **산출물만** 다르다 | include 태그가 `div` 가 아니다 / 컨테이너에 내용을 적었다 / 두 구현 중 한쪽만 고쳤다 |
| index 에서 열면 옛 화면이다 | `npm run prerender` 를 돌리지 않았다 (index 링크는 전부 `./prerender/`) |
| 라벨을 눌렀는데 다른 입력이 반응한다 | 고정 id 파셜을 두 번 넣었다 → `npm run validate` 의 `no-dup-id` |
| 마크업이 깨져 보인다 | Live Server 로 열었다 → `npm run serve` (http://localhost:3500) |
| class 가 하나 모자라거나 `false` 가 붙어 있다 | 빈 값을 넘겨 기본값이 밀렸다 / 참·거짓을 문자열로 넘겼다 — 끄려면 **안 넘긴다** |
| 기본값이 **잘린 채** 나온다 | 기본값 안에 `}` 를 썼다 — 정규식이 거기서 끊는다 |
| **산출물에서만** 값이 기본값이다 | `data-*` 를 작은따옴표로 적었다 / `data-*` 에 대문자를 썼다(이쪽은 반대로 브라우저만 실패) |

<!-- /auto:symptoms -->

---

## 10. 파셜을 고친 뒤

- [ ] `npm run prerender` — **전체**를 돌린다(특정 파일만 돌리면 페이지 간 링크가 404).
- [ ] `public/index.html` — 그 파셜을 include 한 페이지(`grep -rl "_파셜명" public/html/*.html`)의 `update_date` 갱신.
      ⚠ **화면·동작이 달라진 페이지에만.** 구조만 옮긴 정리는 찍지 않는다.
- [ ] 신규 파셜이면 `docs/WORKLOG.md` 에 한 줄(날짜 · 항목 · 위치 · 사유 · 작성자).
- [ ] `npm run validate` 에 error 가 없다 · 고친 파일은 `npx prettier --write <파일>`.
- [ ] 커밋에 **원본과 산출물을 함께** 넣는다(커밋 직전 검사가 확인한다).
