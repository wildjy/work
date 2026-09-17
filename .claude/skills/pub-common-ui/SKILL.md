---
name: pub-common-ui
description: >-
  공통 UI 컴포넌트를 화면에 넣거나 고칠 때 — 드롭다운·검색 드롭다운·입력+지우기+안내문·수량 스테퍼·LNB·탭·아코디언·토스트·모달(확인창)·날짜 입력·기간 입력(jQuery UI datepicker). 공통 UI 는 BEM(ui- 접두어 · is-/has- 상태) 네이밍이고, 보이고 숨기기는 상태 클래스 + hidden 속성, 동작은 onclick 없이 클래스·data-* 위임(public/js/common.js)이다. 마크업은 public/html/include/ui/_ui_*.html 파셜을 data-* 변수로 include 하고, 탭은 구조 규칙대로 직접 쓰고 모달은 프레임 파셜에 본문 파셜을 넘긴다. 파셜별 받는 값, 함수별 호출법, 새 컴포넌트를 추가할 때 함께 고칠 곳(eslint.config.js COMMON_FUNCTIONS · WORKLOG)을 담는다. ui-dropdown·ui-input·ui-stepper·ui-lnb·ui-tab·ui-accordion·ui-toast·ui-modal·ui-period·ui-calendar·data-modal-open·data-toast·toggleMenu·dropdownSelect·modalOpen·tabActivate·accordionToggle·toastShow·stepperChange·CHECK_GROUPS·lnbActive·datepicker 키워드에서 사용.
---
# 공통 UI (`include/ui/_ui_*.html` + `public/js/common.js`)

> **원칙:** 공통 UI 는 **파셜을 include** 해서 넣고, 동작은 `common.js` **한 곳**이 맡는다.
> 마크업을 복사하거나 페이지에 토글 스크립트를 만들지 않는다. **이벤트 위임**이라 파셜·목록으로 나중에 그려진 요소에도 걸린다.
> 동작 예시 : `public/html/Sample.html` 의 「공통 UI 파셜」 구역 (모든 컴포넌트가 들어 있다).

## 0. 규칙 세 가지

### 네이밍 — BEM + `ui-` 접두어

| 구분 | 형식 | 예 |
| --- | --- | --- |
| 블록 | `ui-이름` | `.ui-dropdown` · `.ui-tab` · `.ui-modal` |
| 요소 | `블록__이름` | `.ui-dropdown__btn` · `.ui-accordion__head` · `.ui-modal__close` |
| 변형(크기·종류) | `블록--이름` / `요소--이름` | `.ui-dropdown--search` · `.ui-toast--error` · `.ui-modal--sm` |
| 상태 | `is-*` · `has-*` | `is-open` · `is-active` · `is-selected` · `is-show` · `is-filled` · `is-error` · `is-disabled` · `has-value` |

- **상태 클래스는 단독으로 스타일을 주지 않는다** — 항상 블록·요소와 함께(`.ui-dropdown__btn.is-open`).
- 새 이름은 `grep -rn "ui-이름" public` 으로 충돌 검사부터.

### 보이고 숨기기 — 상태 클래스 + `hidden` 속성

- JS 는 **상태 클래스와 `hidden` 을 함께** 토글한다(`setOpen`). CSS 가 없어도 실제로 여닫히고, 스타일은 상태 클래스로 모양·모션을 준다.
- **처음에 닫혀 있어야 하는 요소는 마크업에 `hidden` 을 적는다** — 드롭다운 목록 · 탭 비활성 패널 · 아코디언 본문 · 토스트 · 모달 · LNB 하위 목록 · 기간 달력.
  ⚠ 레이어 엔진은 **`hidden` 으로 열림을 판정**한다. `hidden` 없이 시작한 목록은 첫 클릭에 열리지 않는다.
- ⚠ `style="display: none"` · `style.display = …` 로 여닫지 않는다.
- 스타일에서 `[hidden] { display: none !important }` 를 전역으로 두고, 모션이 필요하면 상태 클래스로 준다(닫힐 때는 `hidden` 이 즉시 걸린다는 점을 감안한다).

### 동작 연결 — `onclick` 없이 클래스·`data-*`

| 마크업 | 동작 |
| --- | --- |
| `.ui-tab__btn` | 탭 전환 |
| `.ui-accordion__head` | 아코디언 여닫기 |
| `.ui-lnb__link--toggle` | LNB 하위 메뉴 여닫기 |
| `.ui-input__clear` | 입력 지우기 |
| `[data-toast="아이디"]` | 토스트 띄우기 |
| `[data-modal-open="아이디"]` | 모달 열기 |
| `.ui-modal__close` · `[data-modal-close]` | 가장 가까운 모달 닫기 (`data-modal-close="아이디"` 면 그 모달) |
| `input[data-datepicker-day]` · `.ui-period[data-datepicker]` | 날짜 · 기간 달력 |

- **예외(아직 `onclick` 호출)** : 드롭다운 `toggleMenu(this)` · `dropdownSelect(this)`, 스테퍼 `stepperChange(this, ±1)` — 파셜 안에 이미 들어 있으니 쓰는 쪽은 신경 쓰지 않는다.
- JS 가 붙이는 상태(`is-open` · `is-selected` · `is-filled` · `has-value` · `is-show` · 스테퍼 버튼 `is-disabled` · LNB `is-active`)는 **마크업에 직접 쓰지 않는다.** 처음 상태를 정하는 것(`is-active` 탭 · `is-open` 아코디언 항목 · 드롭다운 `is-placeholder`)만 적는다.

## 불러오기

```html
<script src="../js/dynamicImport.js"></script>
<script src="../js/listRender.js"></script>
<script src="../js/common.js"></script>

<!-- 날짜 · 기간 입력을 쓰는 페이지만 -->
<script src="../js/jquery-3.7.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js"></script>
```

---

## 1. 파셜 목록 — `public/html/include/ui/`

| 파셜 | 받는 값 (`data-*`, **굵게** = 필수) | 비고 |
| --- | --- | --- |
| `_ui_dropdown.html` | **`items`**(JSON 경로) · `placeholder` · `modifier` | 항목 JSON `text`·`value`·`state` |
| `_ui_dropdown_search.html` | **`items`** · `placeholder` · `name` | |
| `_ui_dropdown_tpl.html` | — | 위 둘이 안에서 include 한다. **직접 쓰지 않는다** |
| `_ui_input.html` | **`id`** · `name` · `type` · `placeholder` · `value` · `modifier` · `helper` · `helper-type` | |
| `_ui_stepper.html` | **`id`** · `name` · `value`(0) · `min`(0) · `max` | |
| `_ui_lnb.html` | — | 메뉴는 **파셜 안에서** 고친다 |
| `_ui_accordion.html` | **`items`** · `mode`(`single` \| `multiple`) | 항목 JSON `title`·`body`(HTML)·`state` |
| `_ui_toast.html` | **`id`** · `text` · `type`(`success` \| `error`) | 페이지 끝에 둔다 |
| `_ui_modal.html` | **`id`** · **`title`** · **`body`**(본문 파셜 경로) · `subtext` · `footer`(버튼 파셜 경로) · `cancel`(취소) · `confirm`(확인) · `modifier`(`ui-modal--md`) | 공통 모달 프레임 |
| `_ui_modal_footer.html` | `cancel` · `confirm` | 프레임의 기본 버튼. **직접 쓰지 않는다** |
| `_ui_modal_alert.html` | **`id`** · **`title`** · `subtext` · `text` · `body`(본문 파셜 경로) · `modifier`(`ui-modal--sm`) | 정보성 알림 — 버튼 없음 · **딤 클릭으로 닫힘** |
| `_ui_modal_text.html` | `text` | 알림의 기본 본문(한 문단). **직접 쓰지 않는다** |
| `_ui_modal_confirm.html` | **`id`** · **`title`** · `text` · `confirm`(확인) · `cancel`(취소) · `modifier`(추가 변형) | 확인창 전용(`ui-modal--confirm`) |
| `_ui_date.html` | **`id`** · `name` · `placeholder` · `value` | jQuery UI 필요 |
| `_ui_period.html` | **`id`** · `name` · `placeholder` | jQuery UI 필요 · 달력 id = `아이디_period` |

> ⚠ **필수 값을 빼면 `{{id}}` · `{{items}}` 가 산출물에 글자 그대로 남는다.**
> ⚠ `data-*` 는 **케밥**으로 적는다(`data-helper-type` → `{{helperType}}`). 대문자를 쓰면 브라우저만 치환에 실패한다.
> ⚠ 파셜 변수는 문자열뿐이다. **여러 줄 데이터는 JSON 경로**로 넘긴다.
> ⚠ **`id` 를 받는 파셜은 한 페이지에서 id 를 겹치지 않게** 넘긴다(모달·토스트·달력이 id 로 찾는다).

---

## 2. 드롭다운 · 검색 드롭다운

```html
<div class="dynamic-content" data-source="./include/ui/_ui_dropdown.html"
     data-items="../data/member/sort_options.json" data-placeholder="정렬을 선택해주세요."></div>
```

```json
[
  { "text": "최신순", "value": "latest", "state": "" },
  { "text": "이름순", "value": "name", "state": "is-active" },
  { "text": "직접 입력하기", "value": "", "state": "ui-dropdown__item--action" }
]
```

- 항목 필드는 **`text` · `value` · `state` 모두** 적는다(없는 키는 경고 없이 빈 문자열). `state` : `is-active`(미리 선택) · `ui-dropdown__item--action`(선택값으로 쓰지 않는 액션).
- 0건이면 `.ui-dropdown__empty` 가 자동으로 그려진다. 한 페이지에 여러 번 include 해도 된다.

| 함수 | 쓰임 |
| --- | --- |
| `toggleMenu(this, selector?)` | 가장 가까운 `.ui-dropdown` / `.ui-menu` 안의 `.ui-dropdown__list` / `.ui-menu__list` 를 여닫는다. 트리거 `is-open`. 하나만 열리고 **바깥을 누르면 닫힌다** |
| `dropdownSelect(this)` | 항목 `is-active` → 버튼 문구 교체 · `is-placeholder` 해제 · `is-selected` → 닫기. 버튼이 없으면 `.ui-input--search input` 에 값 |
| `toggleLayer(id, cls?, this)` | id 로 지정한 레이어(알림 패널 등)를 같은 방식으로 여닫는다 — 대상에 `hidden` 필수 |
| `closeOpenLayers(except?)` | 열린 목록·달력을 코드로 모두 닫는다 |

- **옵션 메뉴**(행의 「더보기」)는 파셜이 없다 — `.ui-menu > button.ui-menu__btn[onclick="toggleMenu(this)"] + .ui-menu__list[hidden]`.

## 3. 입력 · 지우기 · 안내문

```html
<div class="dynamic-content" data-source="./include/ui/_ui_input.html" data-id="join_birth"
     data-modifier="is-error" data-helper="생년월일 8자리를 입력해주세요." data-helper-type="ui-helper--error"></div>
```

- `modifier` → `.ui-input` 에 붙일 변형·조건 상태(`ui-input--sm` · `is-error` · `is-disabled`), `helper-type` → `ui-helper--error` / `--success` / `--info`.
- `.ui-helper` 는 늘 마크업에 있고 문구가 없으면 비어 있다 → 스타일에서 `.ui-helper:empty { display: none }`.
- 값이 있으면 `.ui-input` 에 `is-filled`, 지우기 버튼이 있으면 `has-value`. `disabled`·`readonly` 면 같은 `.ui-field` 의 `.ui-helper` 를 숨긴다.

## 4. 수량 스테퍼

```html
<div class="dynamic-content" data-source="./include/ui/_ui_stepper.html" data-id="draw_count" data-value="1" data-min="1" data-max="9999"></div>
```

- 경계에 닿으면 `.ui-stepper__btn--minus` / `--plus` 에 `is-disabled` 가 자동으로 붙는다. 직접 타이핑은 숫자만 남기고 범위로 자르며, 비운 채 포커스를 잃으면 최소값.

## 5. LNB

```html
<div class="dynamic-content" data-source="./include/ui/_ui_lnb.html"></div>
```

- `.ui-lnb > .ui-lnb__menu > ul.ui-lnb__group > li.ui-lnb__item > a.ui-lnb__link[href]` · 하위 메뉴 `button.ui-lnb__link--toggle` + `.ui-lnb__sub[hidden]`.
- 메뉴는 **파셜 안 마크업**(listRender 는 중첩 목록을 못 그린다). `lnbActive()` 가 파일명 대조로 `is-active`, 하위가 활성이면 상위 `is-open` + 하위 목록 표시.
- 자기 메뉴가 없는 상세·빈 화면은 `common.js` 의 `LNB_ALIAS` 에 `변형: '대표'`.

## 6. 탭 — 파셜 없음, 구조대로 직접 쓴다

버튼이 보통 2~4개 고정이고 패널은 페이지 본문이라 파셜로 감쌀 수 없다. **같은 탭 묶음이 두 곳 이상 반복되면 그 묶음을 파셜로** 뺀다.

```html
<div class="ui-tab">
	<div class="ui-tab__list" role="tablist">
		<button type="button" class="ui-tab__btn is-active" role="tab" data-tab="basic">기본 정보</button>
		<button type="button" class="ui-tab__btn" role="tab" data-tab="detail">상세 정보</button>
	</div>
	<div class="ui-tab__panel" role="tabpanel" data-tab="basic">…</div>
	<div class="ui-tab__panel" role="tabpanel" data-tab="detail" hidden>…</div>
</div>
```

- 누른 버튼 `is-active` · `aria-selected`, 같은 `data-tab` 패널만 보인다. 블록에 **`data-active="키"`** 가 붙는다.
- **패널 없이 CSS 가 보일 칸을 고르는 화면**(요금 비교표 등)은 패널을 두지 않고 `.ui-tab[data-active="pro"] …` 로 스타일을 준다.
- 중첩 탭은 자기 블록 소속만 바뀐다. 코드에서는 `tabActivate(버튼)`.
- ⚠ 링크로 페이지를 옮기는 「탭 모양 메뉴」·스텝 표시·필터 pill 은 탭이 아니다 — 이 컴포넌트를 쓰지 않는다.

## 7. 아코디언

```html
<div class="dynamic-content" data-source="./include/ui/_ui_accordion.html" data-items="../data/support/faq.json" data-mode="single"></div>
```

```json
[{ "title": "질문", "body": "답변 <b>HTML</b>", "state": "is-open" }]
```

- `single`(기본) 은 하나를 열면 나머지가 닫힌다. `multiple` 은 각자.
- 열림은 항목의 **`is-open` 하나로** 표시한다(본문 `hidden` · 머리 `aria-expanded` 는 JS 가 맞춘다). 옛 저장소의 `open`/`active`/`fold` 혼용을 쓰지 않는다.
- `body` 는 **raw HTML** 로 들어간다(`{{{body}}}`) — 신뢰할 수 있는 문구만 넣는다.
- ⚠ 머리(`button`) 안에 다른 버튼을 넣지 않는다. 항목 옆 도구는 머리 밖 형제로 둔다.
- 코드에서는 `accordionToggle(머리나 항목, open?)`.

## 8. 토스트

```html
<!-- 페이지 끝 -->
<div class="dynamic-content" data-source="./include/ui/_ui_toast.html" data-id="toast_saved" data-text="저장되었습니다."></div>
<!-- 띄우기 -->
<button type="button" data-toast="toast_saved">저장</button>
```

- 보이는 동안 `is-show`, 2.5초 뒤 저절로 숨는다. 코드에서는 `toastShow(id, ms?)` · `toastHide(id)` — 모달 확인 뒤 띄우는 흐름은 개발 연동 코드가 부른다.
- ⚠ 원본에 `is-show` 를 박아 「보이는 상태 예시」로 두지 않는다.

## 9. 모달

세 가지뿐이다 — **공통 프레임**(`_ui_modal`) · **알림**(`_ui_modal_alert`) · **확인창**(`_ui_modal_confirm`). 모달 마크업을 손으로 짜지 않는다.

```
.ui-modal(딤 · id) > .ui-modal__dialog
  ├─ __header   __title + __subtext      고정
  ├─ __body     본문                     넘치면 여기만 스크롤
  ├─ __footer   버튼                     고정
  └─ __close    닫기(X)                  확인창에는 없다 · 알림에는 __footer 가 없다
```

- 대화상자 **최대 높이 90dvh**(모르는 브라우저는 90vh). 머리·버튼은 늘 보이고 본문만 스크롤된다.
- 크기 변형 `ui-modal--sm`(360) · `--md`(560 · 기본) · `--lg`(800) → `data-modifier`.

### 공통 프레임 — 본문은 파셜로 넘긴다

```html
<button type="button" class="ui-btn ui-btn--contained" data-modal-open="modal_member_invite">멤버 초대</button>

<div class="dynamic-content" data-source="./include/ui/_ui_modal.html"
     data-id="modal_member_invite" data-title="멤버 초대" data-subtext="초대할 멤버의 정보를 입력해주세요."
     data-body="./include/member/_modal_invite_body.html" data-confirm="초대하기"></div>
```

- **본문**은 `include/<폴더>/_modal_이름_body.html` 로 만들어 `data-body` 에 넘긴다(경로는 페이지 기준). 본문 안에서 입력·스테퍼 파셜을 include 해도 된다. 문단은 `p.ui-modal__text`.
- **버튼**은 기본이 「취소(outlined · 닫기) + 확인(contained)」 — 문구만 `data-cancel` · `data-confirm`. 확인은 닫지 않는다(개발 연동이 처리 후 닫는다).
  구성이 다르면(버튼 1개 · 3개 · 삭제 버튼 추가) **버튼 파셜을 만들어 `data-footer` 로** 넘긴다 — 버튼은 `ui-btn` 을 쓴다.
- `subtext` 를 넘기지 않으면 보조 문구 줄이 사라진다(`:empty`).
- ⚠ 본문 안 드롭다운·달력 레이어는 본문 스크롤 영역에 잘린다 — 모달 본문에는 되도록 넣지 않는다.

### 알림 — 버튼 없는 정보성 모달

```html
<button type="button" data-modal-open="modal_notice">점검 안내</button>

<div class="dynamic-content" data-source="./include/ui/_ui_modal_alert.html"
     data-id="modal_notice" data-title="점검 안내" data-subtext="2026.09.20 02:00 ~ 06:00"
     data-text="서비스 점검 시간에는 로그인과 결제를 이용할 수 없습니다."></div>
```

- 본문은 `data-text` 한 문단이 기본이다. 내용이 많으면 본문 파셜을 만들어 `data-body` 로 넘긴다(그때 `text` 는 쓰지 않는다).
- 고를 것이 없으니 **딤을 누르면 닫힌다**. 닫기(X)도 있다.

### 확인창 — 전용

```html
<button type="button" data-modal-open="modal_delete">삭제</button>

<div class="dynamic-content" data-source="./include/ui/_ui_modal_confirm.html"
     data-id="modal_delete" data-title="이벤트를 삭제하시겠습니까?" data-text="삭제한 이벤트는 복구할 수 없습니다." data-confirm="삭제"></div>
```

- 폭 360 · 구분선 없음 · **닫기(X) 없음**(취소·확인 중 하나를 고르게 한다). 두 버튼 모두 누르면 닫힌다.

### 공통 규칙

- 블록(`.ui-modal`)이 곧 **딤**이고 id 도 여기. 변형은 블록에(`ui-modal--sm` · `--md` · `--lg` · `--alert` · `--confirm`).
- 열면 `is-open` + `<html>` 에 **`has-modal`**(스크롤 잠금용 훅). 코드에서는 `modalOpen(id)` · `modalClose(id 또는 요소)`.
- **딤 클릭·ESC 로 닫지 않는다** — 입력 중인 내용을 잃지 않게 하는 의도다.
  **예외 : 버튼 영역(`.ui-modal__footer` 안 버튼)이 없는 모달은 딤을 누르면 닫힌다**(`modalIsPassive`). 판정은 마크업으로만 한다 — 알림에 버튼을 넣으면 딤으로 닫히지 않는다.
  누른 곳과 뗀 곳이 **둘 다 딤**일 때만 닫는다(대화상자 안에서 글자를 드래그하다 딤에서 놓아도 닫히지 않는다).
- 모달 위에 모달을 열면 **DOM 순서**로 쌓인다(뒤에 있는 것이 위).
- 단계 전환(다음 모달로)은 `data-modal-close` + `data-modal-open` 을 한 버튼에 같이 쓰지 말고 개발 연동 코드에서 `modalClose` → `modalOpen` 순서로 부른다(위임 핸들러는 열기를 먼저 본다).

## 10. 날짜 · 기간 — jQuery UI datepicker

**달력 마크업을 손으로 짜지 않는다.** 파셜만 넣으면 `datePickerInit()` 이 살린다(jQuery · jQuery UI 가 없으면 콘솔 경고 후 건너뛴다).

```html
<div class="dynamic-content" data-source="./include/ui/_ui_date.html" data-id="open_date"></div>
<div class="dynamic-content" data-source="./include/ui/_ui_period.html" data-id="query_period"></div>
```

| | 날짜 하나 | 기간 |
| --- | --- | --- |
| 달력 | 입력 뒤에 `.ui-calendar[hidden]` 을 **JS 가 만든다**(id `아이디_cal`) | 파셜 안 `.ui-period[hidden]`(id `아이디_period`) — `.ui-period__calendar` 는 비워 둔다 |
| 열기 | 입력 클릭 | 입력 클릭 |
| 고르기 | 날짜 클릭 → 입력 `2026.09.17` · 닫힘 | 시작일 → 종료일 → 입력 `2026. 9. 1. ~ 2026. 9. 17.` · 머리 날짜칸 두 개 · 닫힘 |
| 지우기 | 입력만 비움 | 입력 · 머리 날짜칸 · 칠한 범위 초기화 |

- 한 달 · 월요일 시작 · 한글 요일/월 · 앞뒤 달 흐리게. 범위 칸에는 `dp_in` · `dp_start` · `dp_end` 가 붙는다(스타일 훅).
- 기간의 **옵션**(종료일 없음 · 시간 포함 등)은 `.ui-period__footer` 자리에 화면마다 넣는다.
- 모양은 스타일의 `.ui-datepicker` 가 맞춘다 — **jQuery UI 테마 CSS 는 불러오지 않는다.**
- ⚠ jQuery UI 기본 팝업(입력에 바로 `.datepicker()`)은 쓰지 않는다 — `<body>` 좌표에 못박혀 스크롤 영역에서 자리를 잃는다.
- ⚠ 달력 안 클릭이 「바깥 클릭」으로 판정돼 닫히는 문제는 `dpKeepOpen` 이 막는다. 우회하지 않는다.

## 11. 그 밖의 공통 동작

| 함수 | 쓰임 |
| --- | --- |
| `toggleClass(selector, cls, this)` | 트리거와 `selector` 요소들에 같은 방향으로 `cls` 토글 |
| `CHECK_GROUPS` | 「[헤더 체크박스] + [행 체크박스]」 그룹. 새 목록이면 `common.js` 표에 `{ root, all, item }` 한 줄 추가. `disabled` 행은 건드리지 않는다 |

---

## 새 공통 컴포넌트를 추가할 때

1. **같은 것이 이미 있는지** 위 표에서 찾는다 — `data-*` 하나나 `modifier` 로 해결되면 새로 만들지 않는다.
2. 이름은 §0 규칙(`ui-블록__요소--변형` · `is-*`)으로 정하고 `grep` 충돌 검사.
3. 마크업은 `include/ui/_ui_이름.html` — 머리 주석에 **받는 `data-*` 와 필수 여부**. 반복 항목은 JSON + 템플릿(템플릿 필드 이름이 파셜 변수와 겹치지 않게). 닫힌 채 시작하는 요소에 `hidden`.
4. 동작은 `common.js` 에 **위임 + `setOpen`** 으로. 초기화가 필요하면 `onRender(fn)`(세 시점)에 건다.
5. HTML 에서 부르는 함수면 **`eslint.config.js` 의 `COMMON_FUNCTIONS`** 에 추가.
6. `Sample.html` 에 예시 → 프리렌더 → 동작 확인 → 이 문서 표 갱신 → **`docs/WORKLOG.md`** 한 줄.
