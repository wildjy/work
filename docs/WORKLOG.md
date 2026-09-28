# 신규 생성 항목 기록표

> 신규로 추가한 스타일·마크업·파셜·페이지·JS 를 **작업할 때마다 이 표 맨 아래에 한 줄 추가**한다.
> 「무엇을 · 어디에 · 왜」가 들어가야 하고, **재사용한 기존 항목과 판단 근거**도 함께 적는다.
> 이 파일은 CLAUDE.md 와 달리 **자동으로 읽히지 않는다.** 필요할 때 검색해서 본다.

```sh
grep -n "찾을클래스" docs/WORKLOG.md      # 그 컴포넌트를 언제·왜 만들었는지
tail -20 docs/WORKLOG.md                  # 최근 작업
```

- 한 줄로 부족한 결정(구조 변경·규칙 도입)은 표 아래에 `## §번호. 제목` 절로 풀어 쓰고 표에서 `§번호` 로 가리킨다.
- **반복된 실수**를 발견하면 여기가 아니라 `.claude/skills/pub-new-screen` 의 「반복 실수 표」에 올린다.

---

| 날짜 | 항목 | 위치 | 사유 | 작성자 |
| --- | --- | --- | --- | --- |
| 2026-09-17 | base 환경 구축 — `prerender.js` · `dynamicImport.js` · `listRender.js` · 작업 목록 `index.html` · Claude 스킬 4종/에이전트 3종 | 저장소 전체 | 운영 중인 퍼블 저장소의 작업 환경에서 **서비스 전용 코드·스타일을 걷어낸** 출발점. 스타일(CSS) 환경은 별도로 구축 예정 | |
| 2026-09-17 | `scripts/serve.js` — 로컬 서버 포트 3500 고정 | `package.json` `serve` | `serve` 14.2.6 의 `--no-port-switching` 이 동작하지 않아(코드가 옵션을 읽지 않음) 포트가 쓰이고 있으면 49xxx 로 조용히 떴다. 먼저 포트를 잡아 보고 사용 중이면 실패하도록 감쌌다. ara-pub(3400)과 겹치지 않게 3500 | |
| 2026-09-17 | Prettier 3 · ESLint 9(`@eslint/js` · `eslint-plugin-html` · `globals`) — `.prettierrc` · `.prettierignore` · `eslint.config.js` · `lint`/`format` 스크립트 | 저장소 루트 | 원본 저장소의 `.eslintrc` 는 ESLint 9 가 읽지 않아 동작하지 않았고 `.prettierrc` 는 스페이스·LF 라 CRLF+탭 규칙과 반대였다. flat config 로 새로 쓰고 Prettier 를 탭·CRLF 로 맞췄다. `@eslint/js` 는 recommended 규칙용. 정렬 전후 프리렌더 산출물이 같음을 확인 | |
| 2026-09-17 | 커밋 직전 검사 — `simple-git-hooks` · `lint-staged` · `html-validate` · `scripts/precommit.js` · `.htmlvalidate.json` | 저장소 루트 · `scripts/` | 「원본만 고치고 프리렌더 없이 커밋」을 막는다. 원본이 전부 스테이징돼 있으면 산출물을 자동 add, 아니면 차단(작업 폴더 변경이 산출물에 섞이므로). 프리렌더 경고는 stderr 로 나와 처음엔 놓쳤다 — stdout+stderr 를 본다. html-validate 는 Prettier 표기 충돌 규칙을 끄고 접근성은 warning. 임시 저장소에서 8개 시나리오(정상·부분 스테이징·깨진 태그·경로 오타·원본 삭제·ESLint·중복 id) 확인 | |
| 2026-09-17 | `common.js` 공통 함수 이관 — 레이어·드롭다운(`toggleLayer`·`toggleMenu`·`dropdownSelect`) · `toggleClass`·`accordionToggle`·`tabSelect`·`TabMenu` · `toastShow/Hide` · 스테퍼 · 지우기 버튼 · 전체 선택(`CHECK_GROUPS`) · `lnbActive` · datepicker · `jquery-3.7.1.min.js` · 스킬 `pub-common-ui` | `public/js/` · `.claude/skills/` | 원본 저장소 함수를 코드 그대로 옮겼다. **뺀 것** : 컬러칩(`rgbToHex`·`colorchipSelect`) · 엑셀 첨부(`excelFileSet`) · 대상자 선택(`targetSelectSync` 등) — 특정 화면 전용. **바꾼 것** : `CHECK_GROUPS`·`LNB_ALIAS` 를 비우고 예시만 남김 · `clearSync` 의 디버그 `console.log` 제거와 `.cell_box` 없을 때 오류 방어 · 주석의 원본 화면명을 일반 예시로. 셀렉터는 원본 클래스 체계 그대로라 스타일 환경을 만들며 함께 맞춰야 한다. ESLint 는 `COMMON_FUNCTIONS` 를 HTML 에만 주고(`public/js` 에 주면 no-redeclare), `*.min.js` 를 전역 ignores 로 옮김 | |
| 2026-09-17 | **공통 UI 파셜 · BEM 네이밍** — `include/ui/_ui_dropdown` · `_ui_dropdown_search` · `_ui_dropdown_tpl` · `_ui_input` · `_ui_stepper` · `_ui_lnb` · `data/ui/sample_options.json` · `empty.json` | `public/html/include/ui/` · `public/js/common.js` · `pub-common-ui` | 원본 저장소 클래스(`cell_dropdown1`·`selected_btn`·`dropdown1_list` / `cell_box`·`cell_txt1`·`cell_search1`·`btn_clear`·`cell_helper1` / `num_stepper`·`btn_minus/plus` / `lnb`·`item_name`·`menu_sub`)를 BEM `ui-` 로 바꿔 파셜화하고 `common.js` 셀렉터·상태(`active`→`is-open`/`is-active`, `default`/`selected`→`is-placeholder`/`is-selected`, `active`/`has_value`→`is-filled`/`has-value`, `disabled`→`is-disabled`, `open`→`is-open`)를 맞췄다. 드롭다운 항목은 JSON(`text`·`value`·`state`) + 템플릿 전용 파셜 공유, LNB 메뉴는 중첩 목록이라 파셜 안 마크업. 뺀 변형 : `cell_dropdown2`·`box_dropdown1`·`add_select1`·colorchip·`type2/3`·`length*`. 스테퍼 내부 입력을 `input.ui-stepper__input` 한 겹으로 단순화. 탭·아코디언 기본값·토스트·기간 달력·모달은 아직 옛 이름. jsdom 으로 런타임 주입→클릭 동작 29항목 확인 | |
| 2026-09-17 | **공통 UI 2차 — 탭 · 아코디언 · 토스트 · 모달 · 날짜/기간** — 파셜 `_ui_accordion` · `_ui_toast` · `_ui_modal_confirm` · `_ui_date` · `_ui_period` · 데이터 `sample_accordion.json` · 함수 `setOpen` · `onRender` · `modalOpen/Close` · `tabActivate` · `accordionToggle(새 시그니처)` | `public/html/include/ui/` · `public/js/common.js` · `pub-common-ui` | ① **보이고 숨기기를 상태 클래스 + `hidden` 으로 통일** — 레이어 엔진 `toggleLayerEl` 도 `hidden` 판정으로 바꿔 드롭다운 목록까지 같은 방식(파셜의 `style="display: none"` → `hidden`) ② **`onclick` 대신 위임** — `.ui-tab__btn` · `.ui-accordion__head` · `.ui-lnb__link--toggle` · `[data-toast]` · `[data-modal-open]` · `.ui-modal__close`/`[data-modal-close]` ③ 삭제 : `layerOpen`·`layerClose`·`overLayerOpen`(사용처 없음)·`tabSelect`·`TabMenu` — 탭은 `data-tab` 패널 전환 + 블록 `data-active`(CSS 칸 고르기 `on_*` 대체) ④ 아코디언 상태를 `is-open` 하나로(원본 저장소 `open`/`active`/`fold` 혼용) ⑤ 달력 `.period_select`/`.ps_*`/`.date_select` → `.ui-period`/`__header`/`__date`/`__calendar`/`__footer`/`.ui-calendar`, 열기를 인라인 onclick 에서 `dpInit` 바인딩으로, 닫기에 id 불필요, **지우기 시 범위 초기화 추가** ⑥ 모달 : 블록=딤, `<html>.has-modal`, 딤·ESC 로 닫지 않음(원본 의도 유지). 탭·일반 모달은 파셜 없이 구조 규칙(버튼 2~4개 고정 · 본문이 화면마다 다름). jsdom + jQuery UI 로 60항목 확인 | |
| 2026-09-17 | **SCSS 기본 세트** — `_variable` · `_mixin` · `_font` · `_reset` · 진입 `common.scss` · `public/font/Pretendard/*.woff2`(9) · 스킬 `pub-scss` · Live Sass 설정 | `public/scss/` · `.vscode/settings.json` | 원본 저장소 4개 파일에서 걷어냄. **_variable** : 색 팔레트 전부 유지(값 그대로, 소문자) · 폰트는 Pretendard 만(`$font-family-01`→`$font-family-base`) · 브레이크포인트 두 벌(`$screen-*`/`$breakpoint_*`)을 `$breakpoint-*` 하나로 · `$contents-width` 제거. **_font** : ⚠ **굵기 연결을 표준으로 바로잡음** — 원본은 한 단계씩 밀려(500→Light · 600→Regular) 「시안 +200」 보정 규칙이 필요했다. 이제 시안 값 그대로. woff2 만(13MB→2.4MB), 나눔스퀘어·카페24·아리따·G마켓 제거. **_mixin** : 176 아이콘 → 공통 31개, `$color1/2` 미사용이라 `icon($name, $color)` 로 단순화 + 없는 이름은 컴파일 오류 · 벤더 접두어 믹스인(appearance·rotate·border-radius)·`multi-background`·`border`·`arrow`·`cell`·`tbl`·그림자·`scroll-overlay`·`breakpoint()`·`txt-clear`·`blind2` 제거 · `blind` 를 스크린리더가 읽는 방식으로 교체(원본은 visibility:hidden) · `ellipsisLine`→`line-clamp` · `triangle` 의 `/` 나눗셈을 `math.div` 로 · `scroll-inset` 의 폐지 예정 `if()` 를 `@if` 로. **_reset** : 기본 굵기 400 · `[hidden]{display:none!important}` 추가(공통 UI 가 hidden 으로 여닫음) · 폼 요소 `font: inherit` · 레이어 확인용 `.layerHTML`·버튼 이미지 위치 핵·다크모드 주석 제거. 컴파일은 작업자(Watch Sass) — 문법 확인은 scratchpad 출력으로만 했고 `public/css` 는 만들지 않았다 | |
| 2026-09-17 | **공통 UI 스타일(머터리얼) · Sample 레이아웃** — `_ui_button` · `_ui_card` · `_ui_table` · `_ui_input`(`.ui-label` · `.ui-helper` 포함) · `_ui_dropdown`(`.ui-menu` 포함) · `_ui_stepper` · `_ui_lnb` · `_ui_tab` · `_ui_accordion` · `_ui_toast` · `_ui_modal` · `_ui_datepicker` · `_layout`(`.layout` · `.app-header` · `.section` · `.grid`) · `_variable` 역할 토큰 | `public/scss/` · `include/common/_header.html` · `Sample.html` | 시안이 없어 머터리얼 디자인(outlined 입력 · elevation 그림자 · 4/8px 모서리 · 아래 표시줄 탭 · snackbar · dialog)을 심플하게 적용. 컴포넌트는 팔레트 대신 **역할 토큰**(`$color-primary` = `$blue-700` · `$color-text` · `$color-border` · `$elevation-*` · `$radius-*` …)을 써서 주 색을 한 줄로 바꾼다(`$blue-600` 은 흰 글자 대비가 모자라 700). 새 공통 컴포넌트 : 버튼(`ui-btn` --contained/--outlined/--sm) · 카드(`ui-card`) · 표(`ui-table`) · 라벨(`ui-label`). 헤더 파셜 `.header`/`.title` → `.app-header`/`__title`. 지우기 버튼은 `visibility` 로(폭 유지), `.ui-helper:empty` · `.ui-period__footer:empty` 만 display none. ⚠ jQuery UI 가 인라인 달력에 `style=display:block` 과 `width: 34em` 을 박아 `.ui-datepicker-multi` 는 `display: flex !important` · `width: auto !important`, body 끝 빈 상자 `#ui-datepicker-div` 는 감춤. scratchpad 컴파일 + 헤드리스 크롬으로 기본·드롭다운 열림·날짜·기간 범위·모달·토스트 화면 확인 | |
| 2026-09-17 | **모달 프레임 · 확인창 분리** — 파셜 `include/ui/_ui_modal.html`(프레임) · `_ui_modal_footer.html`(기본 버튼) · `_ui_modal_confirm.html` 개편 · 변형 `ui-modal--confirm` · `--lg` · 요소 `ui-modal__subtext` · 샘플 본문 `include/sample/_modal_sample_body.html` | `public/html/include/ui/` · `public/scss/_ui_modal.scss` · `pub-common-ui` | 폼·목록 모달을 「모달마다 구조 복사」하던 규칙을 프레임 파셜 하나로 바꿨다. 머리(제목+보조 문구) · 본문 · 버튼 3단, 대화상자 `max-height: 90dvh`(90vh 폴백) + 세로 flex 로 **본문만 스크롤**(`min-height: 0` · `scroll-inset`), 머리·버튼 고정. 본문은 `data-body`(파셜 경로), 버튼은 `data-footer`(기본 `_ui_modal_footer` — 파셜 안 include 의 data-source 에 변수를 넣는 방식은 dynamicImport·prerender 모두 동작 확인). 확인창은 같은 요소에 `--confirm` 변형(폭 360 · 구분선·닫기 X 없음). 버튼은 `ui-modal__cancel/__confirm` 전용 스타일을 없애고 `ui-btn` 으로 통일. 딤의 `overflow-y: auto` 제거. 헤드리스 크롬으로 데스크톱·모바일 프레임 스크롤과 확인창 확인 | |
| 2026-09-17 | **알림 모달(버튼 없음) · 딤 클릭 닫기** — 파셜 `include/ui/_ui_modal_alert.html` · `_ui_modal_text.html` · 변형 `ui-modal--alert` · 함수 `modalIsPassive` | `public/html/include/ui/` · `public/js/common.js` · `public/scss/_ui_modal.scss` · `pub-common-ui` | 액션 없는 정보성 모달은 고를 것이 없어 딤으로 닫아도 잃는 것이 없다. 「딤으로 닫지 않는다」 원칙은 유지하고 **`.ui-modal__footer` 안에 버튼이 없는 모달만** 예외로 둬서 별도 속성 없이 마크업 구조로 판정한다. 딤 판정은 click 의 target 이 블록 자신 + **mousedown 도 블록**일 때만 — 대화상자 안에서 드래그해 딤에서 놓으면 click target 이 공통 조상(블록)이 되어 잘못 닫히기 때문. 본문은 `data-text` 한 문단(기본 본문 파셜)이 기본, 많으면 `data-body`. 헤드리스 크롬 확인 : 알림 딤 클릭 닫힘 · 대화상자 안 클릭/드래그 유지 · 확인창·프레임 딤 클릭 유지 · 닫기(X) 동작 | |
| 2026-09-17 | **체크박스 · 라디오 · 토글 · 툴팁** — 파셜 `include/ui/_ui_checkbox.html` · `_ui_radio.html` · `_ui_toggle.html` · `_ui_tooltip.html` · 스타일 `_ui_choice.scss`(`.ui-checkbox` · `.ui-radio` · `.ui-toggle` · `.ui-choice-group`) · `_ui_tooltip.scss`(`.ui-tooltip--top/right/bottom/left`) · 토큰 `$color-tooltip` · 함수 `tooltipSet` · `tooltipCloseAll` | `public/html/include/ui/` · `public/scss/` · `public/js/common.js` · `pub-common-ui` | 머터리얼 selection control(18px 상자 · 20px 원 · 36×14 트랙 + 20px 손잡이 · hover/focus 번짐 원). input 을 보이지 않게 두고 형제 span 을 `:checked`·`:disabled` 로 그려 **상태 클래스·JS 없이** 동작. 처음 상태(checked·disabled)는 문자열 변수로 조건부 속성을 못 넣어 `data-attrs` 를 태그 안에 원문(`{{{attrs|}}}`)으로 넣는다(Prettier·prerender·html-validate 확인). 체크박스 공유 name 은 html-validate `form-dup-name` 이 막아 샘플은 각자 name. 툴팁은 position = 레이어가 뜨는 쪽, 꼬리는 `triangle` 믹스인으로 아이콘을 가리킴 · 위치는 `translate` 속성, 등장 모션은 `transform` 으로 나눠 서로 덮지 않게. 동작은 hover·focus 로 열고 **누르면 고정**(터치 대응) · 바깥 클릭 · ESC · 하나만 열림. prerender 는 `div` include 만 잡아 문장 안 툴팁이 불가 → `.ui-label` 을 flex 로 바꿔 라벨 옆에 둔다. 헤드리스 크롬으로 4방향 위치 · 체크/비활성 모양 · 열기/고정/바깥/ESC 동작 확인 | |
| 2026-09-18 | **슬롯(`data-slot-*`) 정리 · 모달 본문을 슬롯으로** — `prerender.js`(머리말 복원 · `fillSlots` 보완) · `_ui_modal.html` · `_ui_modal_alert.html` · `_ui_modal_text.html` 삭제 · `pub-markup` §2-1 | `scripts/` · `public/html/include/ui/` · `public/html/Sample.html` · `.claude/skills/` · `CLAUDE.md` | 작업 폴더에 들어와 있던 슬롯 기능(문자열 변수로는 못 넘기는 **여러 줄 마크업**을 `data-slot-이름="#template"` 으로 넘긴다)을 확인해 문서화했다. ① `prerender.js` 머리말 35줄과 일반화된 주석이 원본 저장소 판으로 덮여 있어 **스테이징 판을 기준으로 되살리고** 슬롯 설명만 얹었다. ② `fillSlots` 보완 — Prettier 가 `<div>{{{body}}}</div>` 처럼 짧은 줄을 합치면 들여쓰기 보정이 빗나가서 **태그와 같은 줄이면 줄을 갈라** 넣고, 넘기지 않은 `{{{key|}}}` 줄은 지운다(산출물 빈 줄 방지 · 프리렌더 전용). ③ 모달 프레임·알림의 본문을 `data-body`(파셜 경로) 대신 슬롯으로 바꿨다 — 한 번만 쓰는 본문을 파일로 만들지 않아도 되고 공용 본문은 template 안에서 include 하면 되므로 기능이 상위집합이다. 기본 본문 파셜 `_ui_modal_text.html` 은 `{{{body|}}}` + `.ui-modal__text:empty` 로 대체돼 삭제. ⚠ 슬롯 이름이 파셜 안 목록 template 필드명과 겹치면 template 이 덮인다(아코디언 항목의 `{{{body}}}`) — 문서에 경고 추가. 프리렌더 산출물 · 브라우저 런타임 양쪽 확인 | |
| 2026-09-18 | 프리렌더 — **템플릿 라벨 주석 함께 걷기** | `scripts/prerender.js` | 슬롯 template 을 `<!-- 모달 본문(슬롯) -->` 처럼 라벨링했더니 템플릿만 지워지고 주석이 남아 **바로 아래 다른 요소를 가리켰다.** 지금까지는 「목록 템플릿」이라는 고정 문구만 지우고 있었다. 템플릿 **바로 위 주석 한 줄**과 **바로 아래 닫음 표시**를 문구와 무관하게 함께 지운다(`@` 표시는 남긴다 · 주석만 지우고 템플릿 삭제는 기존 규칙이 맡아 「주석 안 template 글자」 보호가 유지된다). 격리 복제본에서 회귀 확인 | |
| 2026-09-18 | 로컬 서버 — **브라우저 캐시 끄기** (`scripts/serve.json` · `serve -c`) | `scripts/` · `pub-env` | 슬롯(`data-slot-*`)을 넣은 직후 화면에 `{{{body}}}` 가 글자로 남는다는 보고. 산출물·런타임 모두 정상이라 원인은 **브라우저가 들고 있던 옛 `dynamicImport.js`**(슬롯 치환이 없던 판). `serve` 14.2.6 은 응답에 `Cache-Control` 을 아예 붙이지 않아 브라우저가 스스로 캐시한다 — 파셜·JSON·js 를 고쳐도 옛 파일이 그려지는 구조였다. 설정 파일로 `Cache-Control: no-store` 를 모든 경로에 주고 `serve.js` 가 `-c` 로 넘기게 했다(헤더 확인 완료). 규칙이 바뀐 직후 「치환이 안 된다」로 보이는 증상의 재발을 막는다 | |
| 2026-09-18 | 슬롯 — **같은 본문 파셜을 한 페이지에 두 번 넣지 않는다** (Sample 알림 슬롯 예시 정리) | `public/html/Sample.html` · `pub-markup` · `pub-common-ui` | 알림 모달의 슬롯에 멤버 초대 모달과 **같은 본문 파셜**을 넣자 `modal_sample_name`·`_email`·`_count` id 가 2개씩 생겼다 — `validate` 가 `no-dup-id` 3건으로 막고, 브라우저에서는 **두 모달의 라벨이 모두 먼저 나온 모달(멤버 초대)의 입력**을 가리켜 「멤버 초대 모달이 오류」로 보였다(개발단의 `getElementById` 도 마찬가지). 슬롯 자체의 문제가 아니라 **id 를 고정으로 가진 파셜의 재사용 문제**다. 재사용하려면 파셜이 id 를 `data-*` 로 받아야 한다. 겸사겸사 알림에 `data-text` 와 `data-slot-body` 를 함께 넘겨 본문이 두 벌 나오던 것도 정리(택일). Sample 예시는 알림답게 문단 세 개를 슬롯으로 넘기는 형태로 바꿨다 | |
| 2026-09-18 | **파셜 사용법 문서** — `docs/PARTIALS.md` | `docs/` · `README.md` 구조 표 | 파셜 규칙이 `CLAUDE.md`(요약) · `pub-markup`(설계 판단) · `pub-common-ui`(파셜별 받는 값) · 두 구현(`dynamicImport.js` · `prerender.js`) 주석에 흩어져 있어, **사람이 한 번에 읽는 한 장**이 없었다. 호출 규칙(div · 빈 컨테이너 · 페이지 기준 경로) · 변수 · 슬롯 · 파셜 안 목록 · 함정표 · 저장소에 있는 파셜 전부의 호출 예 · 증상→원인 표를 모았다. 스킬 문서는 AI 용으로 그대로 두고 이 파일이 작업자용이다 | |
| 2026-09-18 | **파셜 사용법 페이지** — `Guide_Partial.html` · 데이터 `data/guide/partial_rules·traps·symptoms·samples.json` · 스타일 `_guide.scss`(`.guide__code`·`__toc`·`__note`·`__sample`) · 표 변형 `ui-table--wrap` · LNB 「사용법」 메뉴 | `public/html/` · `public/data/guide/` · `public/scss/` · `include/ui/_ui_lnb.html` | `docs/PARTIALS.md` 를 화면으로 옮긴 것. 문서는 저장소를 연 사람만 보지만 **작업 목록(index)에서 열리는 화면**은 검수자·개발자도 본다. 페이지 자체가 규칙의 예시다 — 헤더·LNB 는 파셜, 표 4개와 예시 카드 14개는 JSON + 템플릿(0건 상태 포함), 예시는 `data-filter="group=…"` 로 한 JSON 을 넷으로 나눠 쓴다. ⚠ **JSON 값의 중괄호는 엔티티(`&#123;`)**, 코드 줄바꿈·탭도 엔티티(`&#10;`·`&#9;`) — 앞은 치환이 두 번 돌아 마커가 지워지고, 뒤는 목록 한 행이 여러 줄이면 프리렌더 reindent 가 pre 안을 밀기 때문이다(생성 스크립트로 기계적으로 만들었다). LNB 에 메뉴가 늘어 Sample 도 화면이 달라져 `update_date` 갱신. **컴파일(Watch Sass)은 작업자** | |
| 2026-09-18 | **문서 코드 색칠** — `common.js` §13 `codeHighlight` · 토큰 클래스 `.guide__tok--tag/attr/str/var/cmt` | `public/js/common.js` · `public/scss/_guide.scss` · `eslint.config.js` | 예시 코드가 한 덩어리 회색이라 태그·속성·치환 자리가 눈에 들어오지 않았다. **마크업·JSON 에는 span 을 적지 않는다** — 예시가 JSON 에서 오고(목록 렌더 뒤 다시 돈다) 손으로 span 을 넣으면 고치기 어려워지므로, `.guide__code` 안의 코드를 화면에서만 감싼다(`onRender` 세 시점 · 이미 칠한 블록은 `_codeDone` 으로 건너뜀). 정규식 우선순위는 주석 → 치환 자리 → 문자열 → 태그 이름 → 닫는 꺾쇠 → 속성 이름이고, 문자열 안의 `&#123;&#123; &#125;&#125;` 는 따로 칠한다(`data-source="{{items}}"`). HTML 파서가 아니라 읽기용이다. 사용법 문서가 없는 페이지에서는 아무 일도 하지 않는다 | |
| 2026-09-18 | **사용법 페이지 React 대응** — 구역 「2. React 와 견주기」 · 데이터 `data/guide/partial_react.json`(15행) · 구역마다 「React 라면」 카드(값 넘기기 · 슬롯 · 목록) · 하이라이터가 JSX 도 다룸 | `public/html/Guide_Partial.html` · `public/data/guide/` · `public/js/common.js` · `docs/PARTIALS.md` | 읽는 사람이 대부분 React 를 먼저 배운 개발자·퍼블리셔라 **아는 문법에 견주는 쪽이 빠르다.** props↔`data-*` · children↔슬롯 · map↔JSON+template · Fragment↔`replaceWith` · SSG↔프리렌더로 짝을 지었고, **다른 점**(컴포넌트가 아니라 문자열 치환 · props 는 문자열만 · 값을 안 넘기면 빈칸이 아니라 `{{key}}` 가 남는다 · `key` 대신 id 관리)은 경고 상자로 따로 뽑았다. 하이라이터(§13)는 `//`·`/* */` 주석과 홑따옴표 문자열을 더하고, 문자열을 주석보다 먼저 봐서 `https://` 를 주석으로 삼지 않게 했다. 화살표(`=>`)와 `===` 가 태그·속성으로 칠해지던 것도 lookbehind 로 막았다. 구역 번호가 하나씩 밀려 목차·제목을 함께 고쳤다 | |
| 2026-09-18 | **Sample 구조 분리 — 슬라이스 · `body/` 세그먼트** — 구역 파셜 7개(`_sample_list` · `_sample_button` · `_sample_input` · `_sample_choice` · `_sample_nav` · `_sample_feedback` · `_sample_var`) · 오버레이 `_sample_overlay` · 슬롯 본문 `body/_sample_invite_body` · `_sample_alert_detail_body` · 모달 id `sample_modal` → `sample_invite` | `public/html/Sample.html` · `public/html/include/sample/` | FSD 를 모티브로 한 슬롯 본문 배치 제안을 **Sample 에 먼저 적용해 눈으로 보려는** 시범 이관. ① **슬롯 본문은 `<슬라이스>/body/` 세그먼트**, **구역은 `section/` 세그먼트**로 모으고 **파일명 · template id · 모달 `data-id` 세 이름을 한 규칙**(`sample_invite` / `sample_invite_body` / `_sample_invite_body.html`)으로 묶어 grep 한 번에 잡히게 했다 — 본문 안 입력 id 도 `sample_invite_*` 로 맞췄다. ② 구역 주석으로 갈라 두었던 7개 구역을 각각 파셜로 빼 **페이지를 510줄 → 48줄**(include 8줄)로 줄였다. **목록 template 은 컨테이너와 같은 파일**(`_sample_list`)에, **슬롯 template 은 include 를 적은 파일**(`_sample_overlay`)에 둔다 — 문서에만 있던 두 규칙을 실제로 확인했다(`dynamicImport.js` 는 지금 훑는 조각을 먼저 뒤지고, `prerender.js` 는 파셜을 펴면서 template 을 거둔다). ⚠ **닫음 표시를 template 바로 아래 두면 프리렌더가 template 의 닫음 표시로 보고 지운다** — `<!--// 목록 구역 -->` 을 섹션 닫는 태그 바로 뒤로 올렸다. ③ 알림 본문(문단 3개)은 한 번 파셜로 빼 봤다가 **크기 기준대로 `template` 안으로 되돌렸다** — 짧고 그 화면 전용이면 파일을 만들지 않는다는 예시로 남긴다. 산출물을 이전 커밋과 대조해 **주석과 의도한 id 변경 말고는 마크업이 완전히 같음**을 확인(공백까지 접어 비교) · `validate` error 0 · `lint` 통과 · 헤드리스 크롬으로 파셜 55개 주입 · 목록 12행 · 슬롯 2곳 채움 · 미치환 토큰 0 확인. 화면 · 동작이 같아 index 작업일자는 찍지 않았다 | |
| 2026-09-18 | **파셜 폴더 규칙 문서** — `docs/STRUCTURE.md` (슬라이스 · `section/` · `body/` 세그먼트 · 의존 방향) | `docs/` · `README.md` · `docs/PARTIALS.md` 머리말 | 「파셜을 **어느 폴더에** 두나」가 어디에도 없었다. `pub-markup` 은 「언제 빼나」(설계 판단), `PARTIALS.md` 는 「어떻게 부르나」(호출 문법)까지만 다뤘다. FSD 를 모티브로 삼되 레이어 이름을 들여오지 않고, 이 저장소가 이미 지키는 **의존 방향**(프레임이 본문을 부르지 않고 슬롯으로 받는다 = `children`)에 폴더 이름만 맞췄다. 실체는 **`data/<슬라이스>` 와 `include/<슬라이스>` 의 이름을 맞추는 것** 하나. 세그먼트는 둘뿐이다 — `section/`(화면 덩어리) · `body/`(슬롯 본문). 「언제 빼고 언제 그대로 두나」 표를 넣어 **처음부터 다 파일로 만들지 않게** 했고, 본문 마크업을 JSON 으로 옮기지 말라는 경고(이중 escape)도 함께 적었다. 엔진 2-pass 개선은 「선택」 절로 미뤄 뒀다 | |
| 2026-09-18 | **사용법 페이지 · 문서 슬롯 절 보강** — 구역 6 에 카드 2개(「본문을 어디에 두나」 · 「template 째 파셜로 빼면」) · 데이터 `data/guide/partial_slot.json`(8행) · 템플릿 `tpl_guide_order` · 함정 표 1행 추가 · `docs/PARTIALS.md` §4 · `pub-markup` §2-1 | `public/html/Guide_Partial.html` · `public/data/guide/` · `docs/` · `.claude/skills/` | 슬롯을 **쓸 줄은 알아도 본문을 어디에 둘지**는 적혀 있지 않았다. ① 크기·재사용 기준표(4행)를 넣어 10줄짜리 본문까지 파일로 빼는 것을 막고 ② **검증해 둔 순서 제약표**(4행 · 브라우저/프리렌더 두 칸)를 화면에 올렸다 — `template` 째 파셜로 빼고 사용처보다 뒤에서 include 하면 **브라우저는 조용히 빈 본문**, 프리렌더만 경고를 찍는다. ⚠ `pre` 안의 폴더 트리를 다른 마크업과 같은 깊이로 들여썼더니 **화면에 탭이 그대로 보였다** — `pre` 안은 열 0 에서 시작한다. 화면 · 문서 · 스킬 세 곳을 같은 내용으로 맞췄고 index 의 작업일자는 이미 오늘이라 그대로 | |
| 2026-09-18 | **폴더 구조 페이지** — `Guide_Structure.html`(구역 8 · 표 4개) · 데이터 `data/guide/structure.json`(17행 · group=layer/split/dep/next) · 템플릿 `tpl_structure_row` · LNB 「폴더 구조」 메뉴 | `public/html/` · `public/data/guide/` · `include/ui/_ui_lnb.html` · `public/index.html` · `docs/STRUCTURE.md` · `README.md` · `Guide_Partial.html` | `docs/STRUCTURE.md` 를 화면으로 옮긴 것. 문서는 저장소를 연 사람만 보지만 **작업 목록(index)에서 열리는 화면**은 검수자 · 개발자도 본다 — 「파셜(include) 사용법」과 같은 이유다. 표 4개(FSD 대응 6행 · 가르는 기준 5행 · 의존 방향 4행 · 엔진 손질 2행)가 모두 **두 칸짜리라 템플릿 하나**(`tpl_structure_row`)를 `data-filter="group=…"` 로 나눠 쓴다 — 0건 상태 포함. 스타일은 `_guide.scss` 를 그대로 써서 **새 SCSS 가 없다**(Watch Sass 불필요). 두 페이지를 서로 링크했고(슬롯 절 → 폴더 구조 / 폴더 구조 → 슬롯 절 · 샘플), 문서 `STRUCTURE.md` 머리말에 화면 판 안내를 넣어 `PARTIALS.md` 와 형식을 맞췄다. ⚠ JSON 값 안의 중괄호는 **엔티티**(`&#123;`) — 생성 스크립트에 검사를 걸어 두었다. LNB 에 메뉴가 늘어 Sample · 파셜 사용법도 화면이 달라졌지만 두 항목 다 작업일자가 이미 오늘이라 그대로. 확인 : 프리렌더(파셜 2 / 목록 4 · 17행) · `validate` error 0 · `lint` 통과 · 헤드리스 크롬으로 구역 8 · 표 17행 · 미치환 토큰 0 · LNB `is-active` · 코드 색칠 42토큰 | |
| 2026-09-18 | **GitHub Pages 배포** — `.github/workflows/pages.yml`(`public/` 을 사이트 루트로) · `.gitattributes` 신설 · 문서 `docs/DEPLOY.md` | 저장소 루트 · `docs/` · `README.md` | 검수자 · 개발자가 저장소를 내려받지 않고 주소로 화면을 보게 한다(https://wildjy.github.io/work/). 「브랜치에서 배포」는 **저장소 루트 아니면 `/docs`** 만 고를 수 있어 사이트가 `public/` 에 있는 이 저장소와 맞지 않는다 — Actions 로 `upload-pages-artifact` 의 `path: ./public` 한 줄로 해결. **겪은 실패 세 가지** ① `Settings › Pages › Source` 만 `GitHub Actions` 로 바꾸고 **워크플로가 없어** 옛 브랜치(Jekyll) 빌드가 계속 서빙됐다 — 주소에 `public/` 이 남고 `/work/` 는 README 테마 페이지였다. ② **Jekyll 은 `_` 로 시작하는 파일을 내보내지 않아** 파셜이 전부 404(산출물은 파셜이 펼쳐져 있어 무사했다) — Actions 방식은 Jekyll 을 거치지 않아 저절로 풀린다. ③ **CI 의 프리렌더 최신성 검사가 항상 exit 1** — `core.autocrlf=true` 라 저장소에는 LF 로 저장되는데 `prerender.js` 는 CRLF 를 쓴다. 우분투 러너는 LF 로 체크아웃하므로 산출물의 모든 줄이 달라 보였다. `.gitattributes` 의 `public/** text eol=crlf` 로 러너에서도 CRLF 로 체크아웃시키고(`*.woff2 binary` 로 폰트 보호) 검사에 `--ignore-cr-at-eol` 을 붙였다. ④ Node 20 지원 종료는 경고일 뿐이었고 `checkout`·`setup-node` 를 `@v5` 로 올렸다. 배포 전에 `prerender` → `git diff --exit-code` → `validate` 를 돌려 **원본만 고치고 푸시한 것**을 막는다(아티팩트는 prerender 뒤의 `public/` 이라 검사를 빼도 화면은 최신) | |
| 2026-09-22 | **사용법 페이지 통합 개편** — 구역 12 → **14**(신설 : 「5. 덩어리를 통째로 넣고 뺀다」 · 「8. 어느 것을 고를까」 · 구역 4 를 5부로 확장 · 구역 7 에 템플릿 전용 파셜 · 운영 컴포넌트) · 데이터 `partial_syntax`(11) · `partial_ladder`(12) 신설 · `partial_traps` 19→24 · `partial_symptoms` 7→10 · 데모 파셜 6개 `include/guide/_guide_*` · 빈 파셜 `include/common/_none.html` · `demo_opcomp.json` · 스타일 `_guide.scss`(`__bar`·`__flag`·`__ops`·`__op`) · **문서 생성기 `scripts/docs_from_json.js`**(`npm run docs` · `docs:check`) | `public/html/Guide_Partial.html` · `public/html/include/guide/` · `public/html/include/common/_none.html` · `public/data/guide/` · `public/scss/_guide.scss` · `scripts/` · `docs/PARTIALS.md` · `package.json` · `public/index.html` | 다른 저장소(ara-pub)의 같은 목적 페이지와 **합쳐 한 벌로** 만든 것. 두 저장소의 파셜 엔진을 대조해 보니 `dynamicImport.js` 는 **줄 단위로 완전히 같고**, `prerender.js` 도 공백·Prettier 를 걷어내면 다른 것은 **슬롯 정규식 둘뿐**이었다 — 「저장소마다 다른 문서」가 필요 없다는 것이 개편의 전제다. **가져온 것** ① `{{key}}` ↔ `{{{key}}}` 와 **파셜 변수 ↔ 목록 템플릿** 대조표 둘(`partial_syntax`) — 같은 괄호를 두 구현이 각각 보는 자리라 사고가 가장 잦다. ② **경로 변수 + 빈 파셜**을 한 절로(이 저장소는 「바꾸는 쪽」(`data-footer`)만 썼고 「비우는 쪽」이 없었다). ③ **운영 컴포넌트**(`type`→class · `use` 스위치). ④ **동작 데모** — 같은 파셜을 「값 넘긴 화면 / 안 넘긴 화면」 두 벌로 include 해 나란히 보인다. **신설한 것 — 「8. 어느 것을 고를까」 사다리 한 장.** 양쪽 문서 모두 도구를 나열만 하고 **고르는 법**이 없었다. 문구·모양·속성·길이·덩어리·본문·행·운영·런타임 12갈래를 위에서부터 읽다 걸리는 데서 멈추게 했고, `{{{ }}}` 는 맨 아래(마지막 수단)에 두었다. ⚠ **데모가 스스로 함정을 밟았다** — 같은 데모 파셜을 두 번 include 하자 공통 체크박스의 고정 id 가 겹쳐 `validate` 의 `no-dup-id` 가 걸렸다. 문서가 경고하는 그 항목이라 **파셜이 id 를 `data-chk-id` 로 받게** 고쳤다. ⚠ **JSON 값의 중괄호는 엔티티(`&#123;`)** · 데모에서 「보였다/숨었다」는 `style` 이 아니라 **`hidden` 속성**으로 보인다(이 저장소 규약). `data-flag-attrs=""` 로 **빈 값이 기본값을 이기는 것**까지 한 자리에서 보이게 했다. **문서판 이중화를 끊었다** — 같은 함정 표가 화면과 `docs/PARTIALS.md` 두 곳에 있었고 **이미 18 vs 24 로 갈려 있었다.** 산문은 손으로 쓴 채 두고 `<!-- auto:이름 -->` 마커 사이만 JSON 에서 찍는다(11블록). MD 에만 남아 있던 문구 5곳은 **JSON 쪽으로 되돌린 뒤** 생성으로 넘겼다. `npm run docs -- --check` 는 낡았으면 exit 1 이라 CI·훅에 걸 수 있다. 확인 : 프리렌더(파셜 2→**13** / 목록 11→**16** · 83→**110행**) · `validate` error 0 · `lint` 통과 · 생성기 2회 실행 동일(idempotent) · SCSS 문법은 scratchpad 로만 확인. **컴파일(Watch Sass)은 작업자** |  |

---

## 26.09.28 · 페이지 폴더 구조 — **1단계 : 빌드 도구 선행 수정** (유재영)

`ara-pub` 에서 페이지가 167개까지 자란 뒤에 폴더를 나누느라 경로 **2,000곳 이상**을 고쳤다.
base 프로젝트인 여기는 아직 페이지가 **3개**라 같은 일이 **239곳**으로 끝난다 — 지금 규칙을 정해 둔다.
**이 단계에서는 파일을 하나도 옮기지 않는다.** 도구만 폴더를 받을 수 있게 하고, 산출물이 그대로인지 확인한다.

### 왜 도구가 먼저인가

`prerender.js` 는 파셜·JSON 경로를 **`public/html/` 기준**으로 풀고, 브라우저는 **페이지 자신의 위치** 기준으로 푼다.
페이지가 전부 `public/html` 바로 아래 있으니 두 기준이 같아 지금까지 문제가 없었다. **폴더를 하나라도 만들면 갈라진다** —

- `./include/…` 를 그대로 두면 → **프리렌더는 통과, 브라우저는 404**
- `../include/…` 로 고치면 → **브라우저는 통과, 프리렌더가 `public/include/` 를 찾아 실패**

마크업만 먼저 옮기면 「산출물은 멀쩡한데 서버로 열면 깨지는」 상태가 된다 — 가장 늦게 발견되는 사고다.

### `scripts/prerender.js` — 패치 10건

| 무엇 | 어떻게 |
| --- | --- |
| `SKIP_DIRS` · `toKey` | 페이지가 아닌 폴더(`include` · `_bak`)를 걸러내고, 페이지 이름을 `/` 로 통일한 상대경로로 다룬다 |
| `PUBLIC_DIR` · **`resolveSrc`** | `/html/…` · `/data/…` 를 **사이트 루트(public/) 기준**으로 푼다. `path.resolve` 는 `/` 를 드라이브 루트로 튀기 때문에 반드시 가려야 한다 |
| `pageList()` | 평면 `readdirSync` → **재귀**. 반환값이 `guide/Guide_Partial.html` 꼴이 된다 |
| `build()` 전개 기준 | `SRC_DIR` → **`path.dirname(srcPath)`**(그 페이지가 있는 폴더 = 브라우저와 같은 기준) |
| `build()` 산출물 | `public/prerender` 아래에 **같은 폴더 구조**로 낸다 |
| **`sweepOrphans()`** | 원본 없는 산출물을 지운다(**전체 빌드에서만**). 페이지를 옮기면 옛 자리 산출물이 남아 「옛 화면이 멀쩡히 열리는」 상태가 된다 |
| `affectedPages()`(감시) | `path.dirname(changed) === SRC_DIR` 비교 → 상대경로 + `SKIP_DIRS` 판정 |
| `main()` 인자 | `npm run prerender -- guide/Guide_Partial.html` 도, **이름만** 줘도 폴더를 찾아 준다 |

⚠ **ara-pub 의 파일을 복사하지 않았다.** 두 프로젝트의 `prerender.js` 는 **양방향으로** 갈라져 있다 —
여기가 prettier 서식이고, **`<template>` 주변 주석을 위치로 걷는 정규식은 여기 쪽이 더 낫다**
(ara-pub 은 「목록 템플릿」 문자열로 찾아서, 주석 문구를 바꾸면 산출물에 라벨만 남는 사고가 두 번 났다).
그래서 **패치만 손으로 옮기고** `npm run format` 으로 마감했다(prettier 가 「unchanged」 → 서식이 이미 맞았다).

### `scripts/precommit.js` — 패치 1건 (⚠ 여기서 걸렸다)

고아 산출물 검사가 **평면 `readdirSync`** 였다.

```js
const srcPages = new Set(fs.readdirSync('public/html').filter((f) => f.endsWith('.html')));
```

페이지를 폴더에 두면 **`public/html` 최상위에 `.html` 이 하나도 없어** `srcPages` 가 비고,
산출물 쪽 목록도 폴더 이름만 걸러져 **검사가 조용히 통과**한다. 재귀로 바꿨다.

### 확인 — 다섯 가지

**① 산출물 무변화** — 고치기 전 SHA1 을 떠 두고 다시 돌렸다.

```
이전 3 · 이후 3 · 내용이 달라진 것 0 · 사라진 것 0 · 새로 생긴 것 0
```

**② 하위 폴더가 실제로 되나** — `Guide_Structure.html` 을 `__probe/` 에 두 벌 놓고 빌드했다.

| | 결과 |
| --- | --- |
| 페이지 상대(`../../css/` · `../include/`) | 파셜 2 / 목록 4 · 17행 — 깊이를 되돌리면 **평면 산출물과 완전 일치** |
| 루트 상대(`/css/` · `/html/include/`) | 같음 — **완전 일치** |

**③ 이름만 준 인자** — `prerender -- rooted.html` → `__probe/rooted.html` 을 찾았다.
**④ `sweepOrphans`** — 원본을 지우고 전체 빌드 → 산출물·빈 폴더가 사라졌다.
**⑤ 감시 모드** — 페이지를 고치면 그 페이지만, 파셜(`_header`)을 고치면 **3페이지 전부**,
JSON 을 고치면 그 페이지가 다시 난다. 「전체 재생성」으로 빠지지 않았다.

확인에 쓴 임시 폴더는 원본·산출물 양쪽에서 지웠다(`git status` 에 `scripts/` 만 남는다).

### 이 프로젝트가 ara-pub 보다 유리한 점 둘

- **`scripts/serve.js` 가 이미 `serve public -l 3500`** 이다 — 루트 상대경로의 유일한 전제조건이 이미 충족돼 있다.
  `serve.json` 은 캐시 헤더만 있고 rewrite 가 없다.
- **`precommit.js` 가 안전망이다** — 커밋 직전 프리렌더를 다시 돌려 산출물을 맞추고, **경고 하나에도 커밋을 막는다**
  (`! 파셜 없음` · `! 데이터 없음`). 지금 경고가 **0건**이므로, 2단계에서 경로를 잘못 바꾸면 **커밋 단계에서 잡힌다.**

### 다음

지금 상태로는 **아무것도 깨지지 않는다** — 도구만 폴더를 받을 수 있게 됐고 구조는 그대로다.

| 단계 | 무엇 | 양 |
| --- | --- | --- |
| ~~1~~ | ~~도구(prerender · precommit)~~ | **완료** |
| 2 | `public/` 안의 경로를 루트 상대로 | **158곳** (페이지 74 · 파셜 52 · JSON 27 · index 5) |
| 3 | 페이지 3개를 폴더로 (`guide/` · `sample/`) | 3개 |
| 4 | 문서·스킬 | **81곳** (docs 41 · skills 38 · README·js 2) |

⚠ **2단계에서 놓치기 쉬운 경로 형태** — ara-pub 에서 세 번 되짚은 것들이다.
`data-json` · `data-done-url` · `data-back` · `data-path` · `onclick` 안의 `location.href` ·
`style="…url(…)"` · `srcset` · **`{{key|./include/…}}` 파셜 변수 기본값** · **`./` 없는 페이지 이름** ·
**`public/data/*.json` 안의 경로**(마크업만 훑으면 안 보인다 — ara-pub 에서 이것만 300곳이었다).

⚠ **4단계는 `docs/PARTIALS.md` 를 손으로 고치지 않는다** — `docs_from_json.js` 가
`public/data/guide/*.json` 에서 표를 찍는다. 2단계에서 JSON 을 고치고 `npm run docs` 로 따라오게 한다.
가이드 JSON 은 `./include/` 를 **가르치는 예시**라 정규식 치환으로 끝나지 않고 **설명 문구도** 함께 바꿔야 한다.

---

## 26.09.28 · 페이지 폴더 구조 — **2단계 : `public/` 경로를 루트 상대로** (유재영)

`public/` 안의 자산·파셜·데이터 경로 **145곳**을 루트 상대로 바꿨다. **페이지는 아직 옮기지 않았다**(3단계).

```html
<link rel="stylesheet" href="/css/common.css" />          <!-- ../css 아님 -->
<script src="/js/common.js"></script>
<div class="dynamic-content" data-source="/html/include/ui/_ui_dropdown.html"
     data-items="/data/ui/sample_options.json"></div>
```

### 먼저 **어떤 형태가 있는지** 전수 조사했다

ara-pub 은 `href`·`src`·`data-source` 만 보고 시작해 **세 번 되짚었다.** 여기서는 속성 이름을 먼저 세었다.

| 형태 | 곳 | 비고 |
| --- | --- | --- |
| `data-source="…"` | 111 | 파셜 |
| `href` · `src` | 50 | 자산·링크 |
| **`data-items="…"`** | 7 | 드롭다운·아코디언의 JSON 경로 |
| **`data-extra="…"`** | 3 | 파셜을 **값으로** 넘기는 자리 |
| **파셜 변수 기본값** `{{block\|./include/…}}` | 2 | `_guide_optional_host` · `_ui_modal` |
| `url(…)` in `public/css/common.css` | 9 | **건드리지 않았다** — 아래 |

그래서 치환을 **속성 이름을 가리지 않는 방식**으로 한 번에 돌렸다(`../data/` · `./include/` · `../css|js|images|video|font`).
`./` 없이 적힌 페이지 이름은 **0건**이었다(ara-pub 에는 21곳 있었다).

### ⚠ `public/css/common.css` 의 `url()` 은 건드리지 않았다

`url("../font/Pretendard/…")` 는 **CSS 파일 기준**으로 풀린다 — 페이지 폴더와 무관하다.
루트 상대로 바꿀 이유가 없고, 바꾸면 오히려 손이 더 간다. `public/scss` 도 같다.

### ⚠ 문구를 같이 고쳐야 했다 — 경로만 바꾸면 **가이드가 자기모순**이 된다

가이드 JSON 은 `./include/` 를 **가르치는 예시**다. 경로만 치환하니 이런 문장이 남았다.

```
(전) data-source 는 언제나 「페이지」 기준(./include/…)
(중) data-source 는 언제나 「페이지」 기준(/html/include/…)   ← 앞뒤가 안 맞는다
(후) data-source 는 언제나 **사이트 루트 기준**(/html/include/…). 파셜 안에서도,
     페이지가 어느 폴더에 있어도 같다
```

`partial_rules` · `partial_symptoms` · `partial_traps` 의 **6곳**을 고쳤다. 특히 함정 표의 설명을
「왜 루트 기준인가」로 다시 썼다 — **파셜은 「심어진 페이지」 기준으로 풀리므로, 깊이가 다른 페이지들이**
**같은 파셜을 쓰면 `./` 로는 한 값으로 맞출 수가 없다.** 이게 이 전환의 이유 전부다.

`docs/PARTIALS.md` 는 **손으로 고치지 않았다** — `npm run docs` 가 JSON 에서 11블록을 다시 찍었다(`docs:check` 통과).

### ⚠ 문서의 「틀린 예시」 둘은 그대로 뒀다

- `partial_rules` 의 `./_x.html` — 「이렇게 적으면 404」라는 **반례**다.
- `partial_symptoms` 의 `./prerender/` — index 링크를 설명하는 문장이고, 실제로 그게 맞다.

### 확인

| | 결과 |
| --- | --- |
| 경로 외 내용 대조(git HEAD) | **2/3 동일** · 1건은 **위에서 일부러 고친 가이드 문구** |
| 원본 경로 실재 확인 | **115곳 확인** · 남은 8건은 전부 3단계 몫(페이지 링크·HTML 이스케이프된 예시) |
| 산출물 경로 | 30곳 확인 |
| **프리렌더 경고** | **0건** — `precommit` 이 경고 하나에도 커밋을 막으므로 이게 관문이다 |
| `npm run docs:check` · `eslint .` | 통과 |
| 파셜·목록 수 | 13/16 · 2/4 · 53/7 — 전과 같다 |

### 같이 고친 것

- `public/html/include/ui/_ui_lnb.html` 의 `../index.html` → **`/index.html`**.
  페이지가 폴더로 들어가면 `../index.html` 이 `public/html/index.html` 을 가리켜 깨진다.
- `public/js/listRender.js` 의 사용법 주석(`data-source="../data/…"`) 도 새 표기로.

### 다음 — 3단계

페이지 3개를 폴더로 옮기고 **남은 페이지 링크 8곳**을 한 번에 바꾼다.

```
public/html/guide/Guide_Partial.html   ← Guide_Partial.html
public/html/guide/Guide_Structure.html ← Guide_Structure.html
public/html/sample/Sample.html         ← Sample.html
```

`index.html` 의 `./prerender/…` 링크 4개도 그때 폴더를 붙인다.

---

## 26.09.28 · 페이지 폴더 구조 — **3·4단계 : 페이지 이동 · 문서 정리 (완료)** (유재영)

페이지 3개를 기능별 폴더로 옮기고, 문서·스킬의 경로 표기와 설명을 새 규칙으로 맞췄다.
`include/` 가 이미 `guide/`·`sample/` 로 갈려 있어 **페이지도 같은 이름**을 쓴다.

```
public/html/guide/Guide_Partial.html   ·  guide/Guide_Structure.html  ·  sample/Sample.html
public/prerender/guide/…               ·  prerender/sample/…          ← 같은 구조로 난다
```

### 3단계 — 이동과 페이지 링크

| | |
| --- | --- |
| `git mv` | 3개 |
| 페이지 링크 | **10곳** (페이지·파셜·JSON·index) |
| `index.html` | `./prerender/guide/…` · `./prerender/sample/…` 3개 |

**`sweepOrphans` 가 옛 자리의 산출물 3개를 스스로 지웠다** — 1단계에서 넣어 둔 것이 여기서 값을 했다.
`#guide_slot` 같은 파편(fragment)은 지키며 바꿨다.

### 4단계 — 문서·스킬 **51곳** + 설명문 **3곳**

| 파일 | 경로 |
| --- | --- |
| `.claude/skills/pub-common-ui/SKILL.md` | 23 |
| `docs/PARTIALS.md` | 11 (산문 쪽만 — 자동 블록은 JSON 에서 난다) |
| `.claude/skills/pub-markup/SKILL.md` | 6 |
| `CLAUDE.md` · `docs/STRUCTURE.md` · `pub-list-render` · `pub-scss` | 4 · 3 · 3 · 1 |

### ⚠ 문맥을 가려야 했다 — 「바꾸면 안 되는 `../`」

| 어디 | 무엇 | 왜 그대로 두나 |
| --- | --- | --- |
| `pub-scss/SKILL.md` | `savePath: ~/../css/` | **Live Sass Compiler 설정**이다. 페이지 경로가 아니다 |
| `public/css/common.css` | `url("../font/…")` | **CSS 파일 기준**으로 풀린다. 페이지 폴더와 무관 |
| `partial_rules.json` | `./_x.html` | 「이렇게 적으면 404」라는 **반례** |
| `partial_symptoms.json` · `index.html` | `./prerender/` | index 링크 설명이고, 실제로 그게 맞다 |

그래서 치환을 **속성(`attr="…"`)·백틱(`` `경로` ``)·파셜 변수 기본값** 문맥에만 걸었다.

### ⚠ 낡은 **설명문** 3곳 — 경로만 바꾸면 자기모순이 된다

```
(전) 출력 폴더는 public/html 과 **같은 깊이**라 ../css/·../js/ 경로가 그대로 동작한다
(후) 출력 폴더는 public/html 과 **같은 폴더 구조**로 난다. 경로는 전부 사이트 루트 기준이라
     페이지가 어느 폴더에 있어도 그대로 동작한다

(전) | **경로는 「페이지」 기준이다** | 파셜 안의 data-source 도 페이지 기준으로 쓴다 |
(후) | **경로는 사이트 루트 기준이다** | … 파셜은 「심어진 페이지」 기준으로 풀려서 ./ 로는 한 값으로 맞출 수가 없다 |
```

`pub-list-render` · `pub-markup` · `docs/PARTIALS.md`(목록 경로 설명) 세 곳이다.
2단계에서 가이드 JSON 6곳을 고친 것과 같은 성격 — **이 전환의 이유를 문서가 말할 수 있게** 다시 썼다.

### `CLAUDE.md` 확정판

- 구조 그림 : `html/<폴더>/*.html` · `prerender/<폴더>/*.html`(**같은 폴더 구조**)
- 「경로 기준은 **페이지**다」 → **「경로는 전부 사이트 루트 기준이다」** 로 바꾸고 **왜** 를 적었다
- 함께 적은 것 : 기준은 `public/`(`npm run serve` → :3500) · **`file://` 로 못 연다** ·
  **JSON 안의 경로도 같다** · **`onclick` 안의 `location.href` 도 같다** · **CSS 의 `url()` 은 예외** ·
  새 페이지는 이름에 맞는 폴더에 · `prerender -- <이름>` 이 폴더를 찾아 준다

### 확인

| | 결과 |
| --- | --- |
| 경로 외 내용 대조(git HEAD) | **2/3 동일** · 1건은 **일부러 고친 가이드 문구** |
| 원본 경로 실재 확인 | **122곳** · 문제 1건은 HTML 이스케이프된 예시(가짜) |
| 원본 = 산출물 구조 | `guide/` 2 · `sample/` 1 — **완전 일치** |
| **프리렌더 경고** | **0건** |
| `npm run docs:check` | 통과 (PARTIALS.md 가 JSON 과 맞다) |
| `eslint .` · `prettier --check **/*.md` | 통과 |
| 파셜·목록 수 | 13/16 · 2/4 · 53/7 — 처음과 같다 |

### 네 단계를 합쳐 — ara-pub 과 비교

| | ara-pub | work |
| --- | --- | --- |
| 페이지 | 167 → 12폴더 | 3 → 2폴더 |
| 고친 경로 | **2,000곳 이상** | **206곳**(public 145+10 · 문서 51) |
| 되짚은 횟수 | **3번**(`data-json` · 파셜 변수 기본값 · JSON 300곳) | **0번** — 먼저 형태를 전수 조사했다 |
| 남은 깨진 경로 | `footer.html` 16 · `html_style_change.css` 11 (예전부터) | **0** |

**base 프로젝트가 정리됐으므로, 여기서 파생되는 프로젝트는 처음부터 루트 상대경로로 시작한다.**

### 남은 것

- `docs/WORKLOG.md` 의 옛 기록에 남은 `./include/` 표기는 **고치지 않았다** — 과거 기록이다.
- ara-pub 으로 **역방향 이관 한 건**이 남았다 — 여기 `prerender.js` 의 `<template>` 주변 주석 정리
  정규식(위치 기반)이 ara-pub 의 「목록 템플릿」 문자열 매칭보다 낫다. 거기서 두 번 사고가 났다.

---

## 26.09.28 · 산출물의 페이지 링크를 /prerender/ 로 (ara-pub 에서 이관 · 유재영)

ara-pub 에서 먼저 만든 `toOutputLinks()` 를 그대로 옮겼다.

```
원본    href="/html/guide/Guide_Partial.html"
산출물  href="/prerender/guide/Guide_Partial.html"
```

**왜** — `index.html` 이 `./prerender/…` 만 가리키므로 검수는 **산출물에서 출발**한다.
그런데 페이지끼리의 링크가 `/html/…` 이면 **첫 클릭에 원본으로 빠진다.**
원본도 파셜을 fetch 로 그려 화면이 보이기 때문에 눈에 잘 안 띈다.

⚠ **`data-source` 는 바꾸지 않는다** — `include/` 는 산출물로 복사되지 않으므로 바꾸면 런타임 fetch 가 404 다.
⚠ 원본은 `/html/` 그대로 둔다. 파셜 하나가 여러 깊이에서 include 되면 상대경로를 쓸 수 없어서다.
⚠ `data-back` · `data-btn-href` 같은 **파셜 변수**는 `LINK_ATTRS` 에 없어도 된다 — 결국 `href` 로 들어간다.
⚠ `href` 가 `location.href=…` 에도 걸려 **onclick·인라인 script 안의 이동도 함께** 바뀐다(의도한 부수효과).

확인 : 산출물에 남은 `/html/` **페이지 링크 0** · `data-source` 는 `/html/include/…` 그대로 ·
프리렌더 경고 0 · `docs:check` 통과 · prettier `unchanged`.

⚠ **`lnbActive()` 는 영향 없다** — `lnbFile()` 이 basename 만 비교하므로 `/prerender/` 아래서도 활성이 맞는다.
   `data-path` 는 JS 가 읽지 않는 파셜 변수다.

---

## 26.09.28 · 공용 런타임 동기화 — `npm run sync` 신설 (유재영)

`prerender.js` · `dynamicImport.js` · `listRender.js` 는 파생 프로젝트와 **로직이 같아야 하는 파일**이다.
벌어진 것을 알아채지 못해 한쪽만 고치는 일이 실제로 있었다 — 검사를 스크립트로 만들었다.

```sh
npm run sync                       # 설정(package.json 의 pubSync.peers)의 상대와 비교
npm run sync -- D:/ara-pub         # 상대를 직접 지정
npm run sync -- --check            # 벌어졌으면 종료코드 1 (훅에 걸 때)
npm run sync -- --pull prerender   # 상대 것을 여기로 + prettier
npm run sync -- --push prerender   # 여기 것을 상대로
```

### ⚠ 「자동 복사」로 만들지 않았다

개선이 **양방향으로** 일어난다. 26.09.28 하루에 실제로 둘 다 있었다 —

| 방향 | 무엇 |
| --- | --- |
| 파생(ara-pub) → base | 하위 폴더 · 루트 상대경로 · `sweepOrphans` · `toOutputLinks` |
| base → 파생 | `<template>` 주변 주석 정리(문구가 아니라 **위치**로 찾는다) |

한 방향 자동 복사는 그중 하나를 **조용히 지운다.** 그래서 **벌어진 사실만 알리고**,
옮기는 것은 `--pull`/`--push` 로 사람이 방향을 정해서 한다.

### 비교는 「로직」만 본다

주석 · 공백 · 따옴표 종류 · 꼬리 쉼표 · prettier 가 붙이는 `return ( )` 을 지우고 비교한다.
두 프로젝트의 포매터가 달라(여기는 prettier 탭·단일따옴표) **byte 비교는 늘 「다름」**이 되기 때문이다.
실제로 이 규칙으로 보니 세 파일이 **전부 동일**했다 — byte 로는 3천 자 이상 달랐다.

### ⚠ `common.js` 는 대상이 아니다

두 프로젝트가 **서로 다른 구현**이다 — 여기는 `el.hidden` + `is-open`, ara-pub 은 `style.display` 기반.
로직 줄이 각각 280 / 225종 다르다. **복사하면 UI 계층이 날아간다.** 목록을 늘릴 때는
「로직이 같아야 하는 파일인가」를 먼저 따진다.

### 확인

- 일부러 상대 쪽을 흔든 뒤 : **벌어진 파일 1개**로 잡고 문맥·양쪽 차이를 보여 준다 · `--check` **종료코드 1**
- 되돌린 뒤 : 세 파일 **로직 동일** · `--check` **종료코드 0**
- `--pull dynamicImport` : 복사 + prettier — 내용이 같아 **변화 없음**(무해) 확인
- 상대 경로가 없거나 설정이 없으면 **안내만 하고 종료코드 0** — 빌드를 막지 않는다

⚠ `precommit` 에 걸지 **않았다.** 상대 프로젝트가 작업 중일 수 있고, 경로가 PC 마다 다르다.
걸고 싶으면 `precommit.js` 에 `sync_runtime.js --check` 를 더하면 된다.

⚠ `package.json` 의 `pubSync.peers` 는 **이 PC 기준 절대경로**다(`D:/ara-pub`). 다른 PC 에서는 고쳐야 한다.

---

## 26.09.28 · `npm run sync` — **양쪽에 대칭으로** 두었다 (유재영)

처음엔 base(`D:\work`)에만 두었는데, **ara-pub 에서 작업할 때 실행할 생각을 못 한다**는 문제가 있었다.
방향은 원래 양방향(`--pull`/`--push`)이었지만, **스크립트가 한쪽에만 있으면 한쪽 방향만 굴러간다.**
그래서 `scripts/sync_runtime.js` 를 **두 프로젝트에 같은 내용으로** 두고 각자 `npm run sync` 를 갖게 했다.

```sh
npm run sync                        # 짝과 비교 (양쪽 어디서 실행해도 같은 표)
npm run sync -- --pull prerender    # 짝 → 여기   (짝이 앞섰을 때)
npm run sync -- --push prerender    # 여기 → 짝   (여기가 앞섰을 때)
npm run sync -- --check             # 벌어졌으면 종료코드 1
```

| | |
| --- | --- |
| ara-pub | `pubSync.peers: ["D:/work"]` |
| work | `pubSync.peers: ["D:/ara-pub"]` |

**스크립트 자신도 비교 대상에 넣었다** — 한쪽에서만 고치면 다른 쪽이 낡는다.

### ⚠ 서식은 옮기지 않는다 — 두 프로젝트 prettier 설정이 **정반대**다

| | 들여쓰기 | 줄끝 |
| --- | --- | --- |
| work | **탭** | **CRLF** |
| ara-pub | **스페이스** | **LF** |

그래서 `--pull` 은 **복사만** 하고 포매터를 돌리지 않는다.
ara-pub 에서 `prerender.js` 에 prettier 를 돌리면 **1,826줄**이 움직인다 — 로직 동기화의 대가로는 너무 크다.

대신 받은 뒤 **읽기만 해서 알려 준다** — 「이 프로젝트 서식과 맞지 않습니다(줄끝·들여쓰기가 섞일 수 있습니다)」.
맞추고 싶으면 `--format` 을 붙인다(work 에서는 값이 싸다 — 실제로 CRLF 까지 정리되는 것을 확인했다).

### 확인

- 양쪽에서 `npm run sync` → **네 파일 모두 로직 동일** (`prerender` · `dynamicImport` · `listRender` · `sync_runtime`)
- **ara-pub 쪽을 일부러 고친 뒤** work 에서 실행 → 벌어진 파일을 잡고 **양쪽 차이와 실행할 명령**을 함께 보여 준다
- `--pull dynamicImport` → 반영 확인 · 서식 경고 출력 · `--format` 붙이면 CRLF 까지 정리
- 되돌린 뒤 다시 **모두 동일** · 산출물 영향 없음

### ⚠ 알려진 한계

- **꼬리 주석만 바뀌어도 「다름」으로 나온다.** 줄 전체가 주석인 것만 지우기 때문이다 —
  `https://` 나 정규식 안의 `//` 를 잘못 먹지 않으려는 선택이다. **과하게 알리는 쪽**이 안전하다.
- `pubSync.peers` 는 **이 PC 기준 절대경로**다. 다른 PC 에서는 고치거나 인자로 넘긴다.
- `common.js` 는 대상이 아니다 — 두 프로젝트가 서로 다른 구현이다.

---

## 26.09.28 · 개발 확인용 샘플 — UI 별 파셜 · 페이지 + LNB 하위 메뉴 JSON (유재영)

`Sample.html` 한 장에 묶여 있던 공통 UI 를 **UI 하나에 구역 파셜 하나**로 나누고, UI 마다 확인 페이지를 두었다.
LNB 「개발 확인용」 하위 메뉴가 그 페이지 목록이며, 목록은 **JSON 으로 따로 관리**한다.

| 항목 | 위치 | 사유 |
| --- | --- | --- |
| 구역 파셜 15개 | `include/sample/section/_sample_{list · button · input · dropdown · stepper · date · checkbox · radio · toggle · tooltip · tab · accordion · toast · modal · var}.html` | 묶음 파셜(`_choice` · `_nav` · `_feedback` · `_overlay`)은 **UI 하나만 따로 볼 수 없었다.** 묶음 4개는 지웠다. 기존 `_list` · `_button` · `_var` 는 그대로 재사용 |
| 페이지 틀 | `include/sample/_sample_layout.html` | 페이지 16장이 사이드(LNB) · 헤더를 **복사하지 않게** 틀을 파셜로 두고 본문은 **main 슬롯**(`data-slot-main`)으로 받는다. 지금은 sample 만 쓰므로 슬라이스 폴더에 둔다(가이드가 쓰게 되면 `common/` 으로 올린다) |
| 페이지 15장 | `html/sample/Sample_<UI>.html` | LNB 는 **파일명으로** 현재 메뉴를 가린다(`lnbActive`) — 한 페이지 + `#앵커` 로는 하위 메뉴가 전부 활성이 된다. `Sample.html` 은 전체 모아보기로 남겼다 |
| LNB 하위 목록 JSON | `data/common/lnb_dev.json` (`title` · `href`) + `_ui_lnb.html` 의 `#tpl_lnb_dev` / `#tpl_lnb_dev_none` | 페이지를 늘릴 때 **JSON 한 줄**만 적는다. `ui/` 파셜은 슬라이스를 참조하지 않으므로 `data/sample` 이 아니라 `data/common` 에 둔다. 0건 확인은 `data/ui/empty.json` 으로 바꿔 본다 |
| `.ui-lnb__empty` | `scss/_ui_lnb.scss` | 하위 목록 0건 안내 — 링크와 같은 들여쓰기 · 누를 수 없는 글자 |

### 함께 고친 것

- **LNB 현재 메뉴가 한 번도 강조되지 않던 버그** — `lnbActive` 는 `is-active` 를 **링크**에 붙이는데 스타일은 **항목**(`.ui-lnb__item.is-active > .ui-lnb__link`)에 걸려 있었다. 스타일을 `.ui-lnb__item > .ui-lnb__link.is-active` 로 맞췄다(JS 는 그대로).
- `common.js` — `lnbActive` 를 **`dynamic-list-loaded`** 에도 건다. 하위 메뉴 링크가 목록 렌더 뒤에 생기기 때문이다(원본 화면에서만 필요 · 산출물은 이미 그려져 있다).
- **`prerender.js` — `template` 안의 include 를 펼치지 않는다**(`insideTemplate`).
  페이지의 본문 슬롯 `template` 안에서 include 를 제자리에서 펼치자 **목록 `template` 이 겹쳐 들어가**,
  제거 정규식(최단 일치)이 안쪽 닫는 태그에서 멈췄다 → 바깥 닫는 태그 · 중복 id 가 산출물에 남아 `validate` 47건.
  브라우저(`dynamicImport`)는 원래 `template` 안을 훑지 않으므로 **런타임과 같아진 것**이다. 슬롯 · 목록 template 은 펼치기 전에 거둬 두므로 잃는 것이 없다.
  가이드 두 페이지의 산출물은 LNB 외에 달라진 곳이 없음을 확인했다.
  ara-pub 으로 `npm run sync -- --push prerender` 로 넘겼다 — 그쪽 산출물은 **바뀐 것이 없다**(그쪽엔 template 안 include 가 없다).
  ⚠ 한 번은 ara-pub 쪽을 `--pull` 로 받으면서 이 수정이 **조용히 사라졌다**(validate 48건 재발). **받기 전에 `npm run sync` 로 어느 쪽이 앞섰는지 먼저 본다.**

- **토글 `disabled`·`checked` 가 산출물에서만 빠지던 버그** — `prerender.js` 의 `fillSlots` 가 한 줄짜리 `{{{이름|}}}` 를
  「슬롯을 넘겼나」로만 판정해, 일반 변수인 `data-attrs` 를 넘겨도 줄째 지웠다(`_ui_toggle.html` 의 `{{{attrs|}}}`).
  이제 **슬롯 · 일반 변수 둘 다** 보고 넘겼으면 남긴다. 원본 화면(`dynamicImport`)은 원래 정상이었다.
  산출물 전체에서 달라진 곳은 토글의 두 줄뿐이다.
- 사용법 보강 — `Guide_Partial` · `docs/PARTIALS.md` 에 위 두 규칙(한 줄짜리 `{{{이름|}}}` 줄 삭제 · template 안 include 는 펼치지 않음)을 적었다.
  함정 표(`partial_traps.json`)와 증상 표(`partial_symptoms.json`)에 두 줄씩 — 문서판 표는 `npm run docs` 로 같은 JSON 에서 찍었다.

### 이름 — 하위 메뉴 · 헤더 · 문서 제목 · index 는 영문 태그명

`Sample_<이름>.html` 의 `<이름>` 과 같게 쓴다(List · Button · Input …). 「전체 모아보기」만 한글이다.

### 작업일자

- 신규 15장 : 두 날짜 모두 26.09.28
- `Sample.html` · `Guide_Partial` · `Guide_Structure` : `update_date` 26.09.28 — LNB 하위 메뉴가 바뀌어 **화면이 달라졌다**(가이드 두 장은 설명 문구도 갱신)

---

## 26.09.28 · GitHub Pages 배포본에 base(`/work`) 붙이기 — `scripts/pages_base.js` · `npm run pages` (유재영)

**증상** — https://wildjy.github.io/work/prerender/guide/Guide_Partial.html 에 스타일이 안 먹는다.
**원인** — 경로를 사이트 루트 기준(`/css/common.css`)으로 바꿨는데(위 2단계), 프로젝트 사이트는 **`/work/` 아래**에 올라간다.
브라우저가 `wildjy.github.io/css/common.css` 를 찾아 404 — CSS 뿐 아니라 js · 파셜 · JSON · 이미지 · LNB 링크도 같다.

| 항목 | 위치 | 사유 |
| --- | --- | --- |
| `scripts/pages_base.js` · `npm run pages -- --base /work` | `scripts/` · `package.json` | `public/` 을 `_site/` 로 **복사하며** html · css · json 의 루트 경로 앞에 base 를 붙인다. 원본 · 커밋된 산출물은 그대로 — 산출물에 넣으면 로컬(:3500)이 깨지고 워크플로의 산출물 최신 검사(`git diff`)도 실패한다 |
| 워크플로 | `.github/workflows/pages.yml` | `configure-pages` 의 `base_path` 를 넘겨 돌리고, 아티팩트를 `./public` → **`./_site`** 로. 저장소 이름이 바뀌어도 따라간다 |
| `.gitignore` | 루트 | `/_site` |

- 바꾸는 것은 **`public/` 최상위에 실제로 있는 이름**(`css` · `js` · `html` · `data` · `prerender` · `index.html` …)으로 시작하는 경로뿐 — 따옴표 바로 뒤(속성값 · `location.href='…'`) · `url(…)` · `srcset` · 루트 링크 `href="/"`. 이미 `/work/…` 인 것은 안 걸려 두 번 돌려도 같다.
- **코드 예시(textarea · pre · code 안)는 바꾸지 않는다** — 사용법 문서가 보여 주는 코드가 달라진다.
- JSON 은 **값 전체가 경로인 문자열**만(`"href": "/html/…"`). 문자열 안의 HTML · 코드 예시는 두고 간다 — ⚠ JSON 에 `href=\"/…\"` 처럼 **실제 링크를 HTML 로** 넣으면 배포본에서 깨진다.
- `dynamicImport.js` · `listRender.js` · `common.js` 는 고칠 것이 없다 — 경로를 DOM 속성에서 읽고, `lnbActive` 는 파일명만 비교한다.
- ⚠ **파셜 변수 기본값** `data-source="{{footer|/html/include/ui/_ui_modal_footer.html}}"` 은 따옴표 바로 뒤가 아니라 첫 판에서 빠졌다 — 모달 버튼 파셜이 런타임에 404. `{{key|/…}}` 규칙을 따로 두었다.
- ⚠ `--base` 없이 돌리면 **경로를 안 바꾸고 복사만** 한다(`base 없음` 출력). 로컬 확인 때 이걸로 한 번 헷갈렸다.
- `_site` 를 `eslint.config.js` ignores · `.prettierignore` 에 추가 — 안 넣으면 `npm run lint` 가 복사본의 인라인 script 를 검사해 93건 오류.
- 확인 : 파일 131 · 경로 바꾼 파일 59 · `/work/…` 경로 **643곳 전부 실재** · 이중 치환(`/work/work`) 0 · 남은 루트 경로는 코드 예시(`pre`·`code` · JSON 의 `&quot;` 예시)와 주석뿐.
  GitHub Pages 처럼 `/work/` 만 서빙하는 임시 서버 + 헤드리스 크롬으로 원본(`html/sample/Sample.html` · `html/guide/Guide_Partial.html`) · 산출물 · `index.html` 5장 → 요청 **134건 전부 200**(404 는 크롬 기본 `favicon.ico` 뿐) · 스타일 · 파셜 · JSON 목록 · 0건 상태 · LNB 활성 정상.
  워크플로 순서(prerender → `git diff --exit-code` → validate) 통과 · `lint` 통과.

---

## 26.09.28 · 사용법 페이지 원본 가독성 — 코드 예시를 「적은 그대로」 (1·2단계 · 유재영)

**문제** — `Guide_Partial.html` 의 코드 예시가 전부 엔티티(`&lt;div …&gt;`)이고 `<pre>` 안이라 **열 0** 에서 시작했다.
`partial_samples.json` 은 줄바꿈·탭·따옴표까지 `&#10;` · `&#9;` · `&quot;` 라 사람이 읽을 수 없었다.

| 항목 | 위치 | 사유 |
| --- | --- | --- |
| `textarea.guide__src` (원문 코드 블록) | `Guide_Partial.html` 14곳 | 안쪽을 **이스케이프 없이** 적는다. 둘레 마크업과 같은 깊이로 들여써도 된다 |
| 함수 `codeSource` | `public/js/common.js` §13 · `eslint.config.js` | `textarea.guide__src` → `pre.guide__code > code` 로 바꿔 그린다. **공통 들여쓰기 · 앞뒤 빈 줄을 걷는다.** `codeHighlight` 첫 줄에서 불러 색칠 전에 돈다 |
| 목록 template | `#tpl_guide_sample` | `pre > code {{{code}}}` → `textarea.guide__src {{code}}`. `{{code}}` 의 이스케이프를 textarea 가 다시 푼다 |
| `partial_samples.json` `code` | `public/data/guide/` | 엔티티를 걷어 **평문**(`\n` · `\t`)으로 |
| `docs_from_json.js` `decode()` 삭제 | `scripts/` | 되돌릴 엔티티가 없다. ⚠ 예전 `decode` 는 `&#10;` · `&#9;` 를 몰라 **`docs/PARTIALS.md` 에 12곳이 글자로 찍혀 있었다** — 함께 풀렸다 |
| `restoreRaw` 가 `<` `>` 를 엔티티로 | `scripts/prerender.js` | html-validate `no-raw-characters` 가 textarea 안의 날것 `< >` 를 error 로 잡는다. **산출물만** 바꾼다(원본은 날것 · 화면 글자는 같다). `&` 는 두 번 이스케이프되므로 두지 않는다 |

- ⚠ **목록 template 안에서는 `data-raw` 를 쓰지 않는다** — `protectRaw` 가 template 안쪽을 자리표로 바꿔 두어 **모든 행이 `{{code}}` 글자로** 나온다.
- ⚠ textarea 는 문자 참조를 푼다 — 코드에 `&quot;` 를 글자로 보이려면 `&amp;quot;` 로 적는다(변환 스크립트가 그렇게 막았다). 닫는 textarea 태그는 적을 수 없다.
- ⚠ **페이지 원본 안에서만 안전하다.** 3단계에서 구역을 파셜로 빼면 런타임(`dynamicImport`)이 파셜 안의 `{{ }}` 를 채운다 — `{{pageTitle|페이지 제목}}` 같은 예시가 치환된다. 3단계에서 따로 막아야 한다.
- 그대로 둔 엔티티 : 데모 속성값(`data-msg`) · 문장 속 짧은 `<code>` 4곳 · 설명 문구(`args`) — 실제 HTML 로 해석되는 자리라 엔티티가 맞다.
- 확인 : 고치기 전후 헤드리스 크롬 DOM 에서 **코드 블록 28개의 보이는 글자가 원본 · 산출물 모두 완전 일치** · 색칠 토큰 515 = 515 · 화면 동일 · 프리렌더 경고 0 · `validate` · `lint` · `docs:check` 통과 · 배포본(`pages_base`)에서도 textarea 는 그대로.
  화면이 같아 `index.html` 작업일자는 찍지 않았다.
- ⚠ `prerender.js` 가 바뀌었다 — ara-pub 과 `npm run sync` 로 맞출 것(이 PC 에는 `pubSync.peers` 경로가 없어 확인하지 못했다).

---

## 26.09.28 · 사용법 페이지 구역 분리 (3단계) · 예시 속 `{{ }}` 치환 막기 (유재영)

`Guide_Partial.html` **1,359줄 → 106줄**. 구역 15개를 `include/guide/section/_guide_partial_<키>.html` 로 뺐다
(`toc` · `basic` · `flow` · `call` · `vars` · `optional` · `slot` · `list` · `ladder` · `react` · `new` · `trap` · `symptom` · `sample` · `finish` — 키는 구역 id 에서 `guide_` 를 뗀 것).

| 항목 | 위치 | 사유 |
| --- | --- | --- |
| 구역 파셜 15개 | `include/guide/section/` | 슬라이스 `guide` + 페이지 이름(`_guide_partial_`)을 앞에 붙였다 — 데모 파셜 `_guide_var` 와 헷갈리지 않고, `Guide_Structure` 를 가를 때 `_guide_structure_` 로 나란히 선다 |
| 목록 template 이동 | 각 구역 파셜 끝 | 「컨테이너와 같은 파일」 규칙. **두 구역 이상이 쓰는 `tpl_guide_rule` 만 페이지에 남겼다**(basic · call · slot) |
| **`dynamicImport.js` — `<textarea data-raw>` 보호** | `public/js/` · `pub-env` §4 | 아래 |
| 문장 속 `<code>` 의 중괄호 9곳 → `&#123;` | 구역 파셜 | 아래 |

### 예시 속 `{{ }}` 가 실제 값으로 바뀌는 문제

페이지에 있을 때는 아무도 치환하지 않았는데, **파셜이 되면 두 구현 모두 `{{키|기본값}}` 을 채운다.**

| 자리 | 예 | 브라우저 | 프리렌더 | 막은 방법 |
| --- | --- | --- | --- | --- |
| 코드 예시(textarea) | `{{pageTitle\|페이지 제목}}` 등 6종 21곳 | 바뀐다 | 원래 안전(`protectRaw`) | **`dynamicImport` 에 같은 보호** — 치환 전 자리표 → 치환 뒤 복원. 슬롯으로 넘긴 값도 함께 |
| 문장 속 `<code>` | `{{key\|기본값}}` · `{{{body\|}}}` | 바뀐다 | 바뀐다 | 중괄호를 **엔티티**로(이 페이지와 JSON 이 이미 쓰던 표기) |

- **대조 실험** — 보호가 없는 옛 `dynamicImport.js` 로 열면 `{{extra|…}}` 가 화면에서 **사라지고** `{{pageTitle|페이지 제목}}` 은 「페이지 제목」으로 채워졌다(4곳 → 3곳). 보호가 있으면 전부 남는다.
- ⚠ **기본값 없는 `{{키}}` 는 지금은 안 바뀐다**(넘기지 않은 키는 그대로 남는 규칙). 그래도 구역 include 에 `data-*` 를 넘기기 시작하면 바뀌므로 문장 속 것은 모두 엔티티로 맞췄다.
- ⚠ `dynamicImport.js` 가 바뀌었다 — ara-pub 과 `npm run sync` 로 맞출 것(`prerender.js` 는 1·2단계에서 이미 바뀌었다).

### 확인

분리 전(2단계 직후)과 후를 헤드리스 크롬 DOM 으로 대조 —
원본 · 산출물 모두 **코드 블록 28개 완전 일치 · main 본문 글자 전체(약 2.6만 자) 완전 일치 · 색칠 토큰 515 = 515** ·
예시 기본값 8종의 개수가 원본 · 산출물 같음 · 표 행 153 = 153 · 프리렌더 경고 0 · `validate` · `lint` · `docs:check` 통과. 화면이 같아 index 작업일자는 찍지 않았다.

⚠ **`prerender:watch` 는 스크립트를 고친 뒤 다시 띄운다** — 떠 있던 감시 프로세스가 옛 `restoreRaw` 를 들고 있어,
HTML 을 고칠 때마다 산출물을 옛 규칙(textarea 안 날것 `< >`)으로 덮어 `validate` 가 156건으로 터졌다. 코드 문제로 보이기 쉽다.
