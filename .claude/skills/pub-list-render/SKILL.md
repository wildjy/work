---
name: pub-list-render
description: >-
  목록·테이블·카드처럼 같은 구조가 반복되는 마크업을 만들 때, 그리고 HTML·파셜·JSON 수정 후 프리렌더로 마무리할 때. 행을 하드코딩하지 않고 public/data 의 JSON + template 요소 + listRender.js 로 렌더한다. data-source/data-template/data-empty/data-filter 문법, 0건 상태를 함께 만드는 규칙, npm run prerender 가 왜 필수인지, 그리고 프리렌더 다음에 index.html 의 작업일자(create_date/update_date)를 어떤 기준으로 갱신하는지를 담는다. 목록·테이블·JSON·프리렌더·prerender·index.html·작업일자·작업목록 키워드에서 사용.
---
# 반복 목록 · 프리렌더 · 작업일자

## 1. 반복 목록은 JSON + `<template>` 으로 렌더링한다 (하드코딩 금지)

> **원칙:** 테이블 행·목록 항목처럼 **같은 구조가 반복되는 마크업은 HTML 에 직접 찍지 않는다.**
> `public/data/<기능명>/*.json` 에 데이터를 두고 `<template>` 을 React 의 `map` 처럼 순회해 렌더한다.
> 러너는 `public/js/listRender.js` (빌드 도구 없이 순수 JS). 동작 예시는 `public/html/Sample.html`.

### 적용 기준 — 무엇을 JSON 으로 뺄지

| 판단 | 대상 | 예 |
| --- | --- | --- |
| **JSON 으로 뺀다** | 같은 구조가 **5행 이상** 반복 | 테이블 행, 카드/게시글 목록, 검색 결과 |
| **JSON 으로 뺀다** | 행 수가 **데이터에 따라 변하는** 목록 (개수 무관) | 회원 목록, 댓글, 알림 |
| **마크업 유지** | 항목이 **2~4개로 고정**이고 서로 구조가 다름 | 설정 항목, 폼 필드 묶음, 탭·버튼 그룹 |
| **JSON 으로 뺀다** | 한 건뿐이어도 **운영하며 갈아 끼울 것** | 상단 배너, 이벤트 팝업, 공지 — `pub-markup` §3 |

- 판단이 애매하면 **JSON 쪽**으로 간다. 나중에 행이 늘 때 다시 전환하는 비용이 더 크다.
- **JSON 에는 화면에 보이는 원문을 넣는다.** 마크업에서 옮길 때 `&amp;` 같은 **엔티티는 디코딩**해서 저장한다(`R&amp;D` → `R&D`).
  `{{key}}` 가 출력 시 한 번 이스케이프하므로, 이스케이프된 채로 담으면 `R&amp;amp;D` 가 된다. (raw 로 넣는 `{{{key}}}` 필드는 예외)
- **값은 한 줄로 담는다.** 연속 공백은 렌더에 영향이 없으니 공백 1개로 줄인다. 단 **태그 사이 공백(`> <`)은 없애지 않는다.**
- 반대로, 억지로 JSON 화하면 **템플릿이 항목 수보다 많아지는** 역전이 생긴다 — 구조가 서로 다른 2~3줄이면 마크업으로 둔다.

### 사용법

```html
<!-- 1) head : dynamicImport.js 다음에 로드 -->
<script src="../js/dynamicImport.js"></script>
<script src="../js/listRender.js"></script>

<!-- 2) 컨테이너 : 비워두고 data-* 로 선언 -->
<tbody class="dynamic-list"
  data-source="../data/member/list.json"
  data-template="#tpl_member_row"
  data-empty="#tpl_member_row_none"
  data-filter="!owner"></tbody>

<!-- 3) body 끝 : 템플릿 정의 -->
<!-- 목록 템플릿 (listRender.js 가 JSON 을 순회해 렌더) -->
<template id="tpl_member_row">
  <tr>
    <td>{{@number}}</td>
    <td>{{name}}</td>
  </tr>
</template>
<!--// 목록 템플릿 -->
```

| 문법 | 설명 |
| --- | --- |
| `{{key}}` | 값 치환 (HTML 이스케이프) |
| `{{{key}}}` | 값 치환 (raw HTML — 신뢰할 수 있는 값에만) |
| `{{@index}}` / `{{@number}}` | 0부터 / 1부터 시작하는 순번 |
| 없는 키 | **빈 문자열** (경고 없음) |
| JSON 항목의 `"_tpl": "#다른템플릿"` | **그 항목만** 다른 템플릿으로 렌더 |
| `data-filter="key"` | 값이 **참인 항목만** |
| `data-filter="!key"` | 값이 **거짓인 항목만** |
| `data-filter="key=값"` | 값이 **일치하는 항목만** — 하나의 JSON 을 여러 컨테이너가 나눠 쓸 때 |

> ⚠ JSON 최상위는 **배열**(`[ … ]`) 또는 `{ "items": [ … ] }` 다. 객체 하나(`{ … }`)는 0건으로 렌더된다 — 한 건이어도 `[{ … }]`.

### ⚠ 목록이 있으면 **0건 상태도 함께 만든다**

> **원칙:** 데이터로 그리는 목록은 **데이터가 없을 때의 화면이 반드시 존재한다.**
> `data-empty` 를 같이 넣는 것을 기본으로 한다. 나중에 붙이면 반드시 빠뜨린다.

| 확인 | 내용 |
| --- | --- |
| **템플릿** | `#tpl_…_none` 을 목록 템플릿 **바로 옆에** 둔다 |
| **데이터** | 확인용 빈 JSON(`[]`)을 같이 만든다 — 예) `list.json` / `list_empty.json` |
| **스타일** | 빈 행에도 공통 행 규칙(구분선·hover·컬럼 폭)이 그대로 걸린다. 해제해야 한다 |
| **문구** | 시안에 없으면 **작업자에게 확인**한다. 임의로 정했으면 주석에 남긴다 |
| **화면** | 「데이터 유무」만 다르면 `data-empty` 로 끝낸다. **페이지를 늘리지 않는다** |

**테이블은 헤더를 남긴다.** 본문만 한 칸으로 합친다 — `<td colspan="N" class="tbl_empty">…</td>`

> 🤖 **AI 작업 규칙:** 목록·테이블을 새로 만들면 **같은 커밋에서 0건 상태까지 만든다.**

### 주의

- **실행 시점** — 페이지에 `.dynamic-content`(파셜) 가 있으면 `dynamic-content-loaded` 이후, 없으면 `DOMContentLoaded` 직후에 렌더한다.
  렌더가 끝나면 **`dynamic-list-loaded`** 가 한 번 발생한다. **목록에 의존하는 스크립트는 이 이벤트에 연결**한다.
- **`fetch` 기반**이라 `file://` 로 열면 동작하지 않는다. `npm run serve` 로 확인한다.
- **템플릿 안에서는 파셜 include 가 동작하지 않는다**(프리렌더에서는 전개돼 런타임과 결과가 어긋난다).
  템플릿을 여러 페이지에서 공유하려면 **`<template>` 자체를 파셜 파일로** 만들어 include 한다.
- **데이터 JSON 은 기능 단위 폴더로 관리한다.** `public/data/<기능명>/<화면>_<용도>.json`
  - 폴더명은 HTML 파일의 기능 접두어를 그대로 쓰고, 파일명에 기능명을 반복하지 않는다.
  - `public/data/` 루트에 파일을 바로 두지 않는다. **여러 기능이 함께 쓰는 것은 `public/data/common/`**.
- 템플릿을 감싸는 주석은 **`<!-- 목록 템플릿 (…) -->` + `<!--// 목록 템플릿 -->` 짝**으로 쓴다 — 프리렌더가 템플릿과 함께 지운다.

---

## 2. 프리렌더 — 「페이지 소스 보기」에도 나오는 완성 HTML

브라우저의 **소스 보기(`Ctrl+U`)는 서버 원본 응답만** 보여준다. 파셜·목록은 JS 가 그리므로 소스에 나오지 않는다.
그래서 **`index.html` 의 페이지 링크는 원본(`public/html/`)이 아니라 산출물(`public/prerender/`)을 가리킨다.**
→ 프리렌더는 선택이 아니라 **HTML·파셜·JSON 을 고칠 때마다 거치는 마무리 단계**다.

```sh
npm run prerender                     # public/html 전체
npm run prerender -- Sample.html      # 특정 파일만
npm run prerender -- --keep-templates # <template> 정의도 남기기
npm run prerender:keep                # 원본 주석 그대로
npm run prerender:watch               # 감시 모드
```

- 출력 폴더는 `public/html` 과 **같은 깊이**라 `../css/`·`../js/`·`../images/` 경로가 그대로 동작한다.
- 산출물에서는 `dynamic-list` 클래스와 `data-source/template/empty/filter` 속성이 제거돼 **재렌더되지 않는다.**
- 산출물은 **git 에 포함된다.** 원본 `.html`·`.json` 과 **함께 커밋**한다.
- **특정 파일만** 프리렌더하면 페이지 간 링크가 404 날 수 있다. 링크까지 확인하려면 전체를 돌린다.
- **프리렌더를 통과시키려면** ① 목록 컨테이너를 **완전히 비워** 두고 ② `data-template` 은 `#id` 이며 대상이 진짜 `<template id="…">` 이고
  ③ 여는 태그 속성값에 `>` 가 없어야 한다. 하나라도 어기면 **`npm run serve` 화면에는 나오는데 산출물에는 안 나온다.**

> 🤖 **AI 작업 규칙:** HTML·파셜·JSON 을 수정했으면 **마무리로 `npm run prerender`(전체)를 직접 실행**하고
> 출력의 「파셜 N / 목록 N · N행」 과 경고(`! 파셜 없음` 등)를 확인한 뒤 보고한다.

---

## 3. index.html 작업일자 갱신 — 프리렌더 **다음** 마지막 단계

`public/index.html` 은 **작업 목록표**다. 검수자는 여기 날짜만 보고 이번 작업 범위를 판단한다.
**프리렌더를 돌렸으면 이어서 index 의 날짜까지 맞춘다. 요청이 없어도 매 작업 끝에 한다.**

```js
viewlist('제목', 'create_date', './prerender/파일.html', '비고', 'update_date', '작성자');
//         ↑ 만든 날 (고정)                                          ↑ 고친 날
```

| 상황 | create_date | update_date |
| --- | --- | --- |
| **새 페이지를 만들었다** | 만든 날 | **만든 날**(비우면 강조되지 않아 묻힌다) |
| **기존 페이지의 화면이 달라졌다** | 그대로 | 고친 날 |
| **구조만 정리했다** | 그대로 | **손대지 않는다** |

- 강조는 `update_date >= HIGHLIGHT_FROM` 하나로만 켜진다. 검수 차수가 바뀌면 `index.html` 의 `HIGHLIGHT_FROM` 만 고친다.
- 제목 묶음은 `viewtitle('구역명')`, 폐기·보류 화면은 `viewlistDisable(…)`.

**대상을 고르는 기준은 하나 — 「퍼블 결과물(화면·동작)이 달라졌는가」.**

- ✅ 적는다 : 마크업 추가·삭제·재작성, 레이어/배너 신규, 동작이 실제로 고쳐진 것
- ❌ 적지 않는다 : 인라인 스크립트를 공통 함수로 걷어냄 · 같은 마크업을 파셜로 이관 · 하드코딩 목록을 JSON 으로 이관
  → 렌더 결과가 동일하다. 여기에 날짜를 찍으면 목록이 전부 강조돼 「이번에 뭘 했는지」가 묻힌다.

> ⚠ **파셜을 고쳤으면 원본 HTML 이 안 바뀐 페이지도 대상**이다(산출물은 바뀐다).
> `grep -rl "_파셜명" public/html/*.html`

```sh
git status --porcelain public/html public/prerender   # 바뀐 파일 목록
git diff -U0 public/prerender/파일.html                # 내용이 진짜 달라졌나
```

> 🤖 **AI 작업 규칙:** 프리렌더까지 하고 index 를 안 고치면 **작업이 끝난 게 아니다.**
> 애매하면 **diff 를 열어보고 판단**하고, 판단 근거를 작업 보고에 한 줄로 남긴다.
