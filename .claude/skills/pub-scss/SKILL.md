---
name: pub-scss
description: >-
  스타일(.scss/.css)을 만들거나 고칠 때. public/scss 의 _variable(색·폰트·브레이크포인트 토큰) · _mixin(배치·글자·숨김·스크롤·아이콘·반응형) · _font(Pretendard 표준 굵기) · _reset 과 진입 파일 common.scss 의 구조, Live Sass Compiler(Watch Sass)로 작업자가 컴파일하고 AI 는 css 를 만들지 않는다는 규칙, 색은 토큰만 쓰고 폰트 굵기는 시안 값 그대로 쓰는 규칙, 공통 UI 스타일 파일(_ui_*.scss)을 어디에 어떻게 두는지, 아이콘을 icon() 목록에 추가하는 방법을 담는다. SCSS·CSS·sass·컴파일·Watch Sass·토큰·색·폰트·굵기·믹스인·아이콘·반응형·브레이크포인트 키워드에서 사용.
---
# 스타일 (SCSS)

## 1. 구조

```
public/scss/
├─ _variable.scss   토큰 — 폰트 · 경로 · 색(gray/blue/green/yellow/red/indigo/teal/orange/pink/brand × 10~1000) · 브레이크포인트
├─ _mixin.scss      믹스인·함수 — 배치 · 글자 · 숨김 · 스크롤 · 도형 · 배경/아이콘 · 반응형
├─ _font.scss       Pretendard @font-face (100~900 표준 굵기 · woff2)
├─ _reset.scss      초기화 + [hidden] · 건너뛰기 링크
├─ _layout.scss     페이지 골격 — .layout(__side·__brand·__body·__main) · .app-header · .section · .grid(--2·--3)
├─ _ui_*.scss       공통 UI (머터리얼) — button · card · table · input(label·helper) · dropdown(menu) · stepper · lnb · tab · accordion · toast · modal · datepicker
└─ common.scss      진입 파일 → public/css/common.css   (@use 'font'; @use 'reset'; …)
public/font/Pretendard/Pretendard-*.woff2
```

- **`_` 로 시작하는 파셜은 단독으로 컴파일되지 않는다.** 진입 파일(`_` 없음)만 css 가 된다.
- 파셜에서 토큰·믹스인은 **모듈 방식**으로 쓴다 — `@use 'variable';` → `variable.$gray-900`, `@use 'mixin';` → `@include mixin.txt-shorten;` (`@import` 금지)
- 페이지는 `<link rel="stylesheet" href="../css/common.css" />` 로 불러온다.

## 2. 컴파일 — 작업자가 Watch Sass 로 한다

| 항목 | 값 (`.vscode/settings.json`) |
| --- | --- |
| 확장 | **Live Sass Compiler** (`glenn2223.live-sass`) — 하단 상태바 「Watch Sass」 |
| 출력 | `public/scss/*.scss` → `public/css/*.css` (`savePath: ~/../css/`) |
| 포맷 · 맵 | `expanded` · source map 없음 |
| autoprefix | `> 1%`, `last 2 versions` |

> 🤖 **AI 작업 규칙 : 프로젝트의 css 는 작업자가 컴파일한다.**
> Claude 는 **`.scss` 만 고치고** `public/css` 에 파일을 만들거나 고치지 않는다. 수정한 `.scss` 목록을 보고에 적는다.
> 문법 확인이 필요하면 **scratchpad 로만** 출력한다 — `npx --yes sass@1 --no-source-map --load-path=public/scss public/scss/common.scss <scratchpad>/common.css`
> (그 결과를 `public/css` 로 복사하지 않는다)

- **`.css` 를 직접 고치지 않는다** — 다음 컴파일에 덮인다. `.scss` 와 컴파일된 `.css` 를 **함께 커밋**한다.
- `public/css` 는 Prettier 대상이 아니다(`.prettierignore`) — 정렬하면 다음 컴파일에 되돌아가 diff 만 생긴다.
- ⚠ **Live Server 와 Live Sass Compiler 는 다른 확장이다.** 서버는 `npm run serve`, 컴파일만 Watch Sass.

## 3. 토큰 규칙

- **공통 UI · 레이아웃은 역할 토큰을 먼저 쓴다** — `$color-primary` · `$color-text` · `$color-text-sub` · `$color-border` · `$color-divider` · `$color-hover` · `$color-surface` · `$color-error` · `$radius-sm/md` · `$elevation-1~24` · `$duration-*` · `$easing-standard`. 주 색을 바꿀 때는 `$color-primary*` 만 고친다.
- **색은 `_variable.scss` 토큰만** — 스타일에 HEX 를 적지 않는다. 시안 색이 토큰에 없으면 **작업 전에 묻는다.**
  토큰으로 바꿀 때는 **단계 수를 시안 그대로 유지**한다(비슷한 두 색을 하나로 합치면 정보 위계가 사라진다).
- **폰트 굵기는 시안 값 그대로** 적는다. `_font.scss` 가 표준 굵기(400 Regular · 500 Medium · 600 SemiBold · 700 Bold …)로 연결한다 — **보정(+200 등)하지 않는다.**
- 기본 글꼴·크기·굵기·자간은 `$font-family-base` · `$font-size-base` · `$font-weight-base`(400) · `$letter-spacing-base`.
- 반응형은 **이하(max-width)** 기준 — 큰 화면을 먼저 쓰고 `@include mixin.small { … }` 로 덮는다.
  `$breakpoint-xsmall 375` · `small 750` · `medium 1000` · `large 1280`.

## 4. 믹스인 요약

| 믹스인·함수 | 쓰임 |
| --- | --- |
| `position($pos, $top, $right, $bottom, $left, $z-index)` | null 은 출력 안 됨. z-index 기준은 파일 주석 |
| `clear` | float 해제 |
| `font-set($size, $weight, $color)` | 글자 세트 |
| `txt-shorten` · `line-clamp($n)` · `txt-anywhere` | 한 줄 말줄임 · 여러 줄 말줄임 · 긴 단어 줄바꿈 |
| `placeholder($color, $size, $weight)` | `::placeholder` |
| **`blind`** | 화면에서 숨기고 **스크린리더는 읽음** — 아이콘 버튼 글자, caption, legend |
| `txt-blind` | 자리 유지 · 글자만 숨김 — 크기가 정해진 배경 아이콘 버튼 |
| `scrollbar($size, $thumb, $track)` · `scroll-inset($시안여백)` · `hide-scroll` | 얇은 스크롤바 · 스크롤바 폭만큼 우측 여백 보정(**padding 뒤에**) · 스크롤바 감춤 |
| `triangle($base, $direction, $color)` | 말풍선 꼬리(::before/::after 안) |
| `background($color, '파일명', $pos, $size)` | 입고 이미지 — **파일명만** 넘긴다 |
| **`icon('이름', $color)`** · `background-data('이름', $color, $bg, $pos, $size)` | 색을 코드에서 바꾸는 SVG 아이콘 |
| `xsmall` · `small` · `medium` · `large` · `print` | 미디어쿼리 |
| `calc-vw($px, $base)` | px → vw |

⚠ 벤더 접두어 믹스인(border-radius · rotate · appearance)은 두지 않는다 — 속성을 그대로 쓴다.
⚠ 컴포넌트 모양(입력칸 · 표 · 그림자)을 믹스인으로 만들지 않는다 — 컴포넌트 스타일 파일에 둔다.

### 아이콘 목록 (31개)

`arr3-down` `arr3-up` `arrow-left-S` `arrow-right-S` `close-S` `close-M` `clear-S` `search1` `check-S` `checkbox-S` `checkbox-S-checked` `checkbox-S-disabled` `radio-M` `radio-M-checked` `radio-M-disabled` `info1` `info1-line` `error` `success` `caution` `plus-S` `minus-S` `more1` `cal` `time` `eye-S-view` `eye-S-close` `link` `copy1` `delete1` `edit`

**추가하는 법** : Figma 에서 SVG 로 내보낸다 → `<` `>` `#` 을 `%3C` `%3E` `%23` 으로, 큰따옴표를 작은따옴표로 바꾼다 →
색 자리(`fill`·`stroke`)를 `'#{data-color($color)}'` 로 바꾼다(고정 색은 그대로) → `icon()` 의 `$iconList` 에 `'이름': "…"` 한 줄.
없는 이름을 부르면 컴파일이 `icon() : 목록에 없는 아이콘` 으로 멈춘다.

## 5. 공통 UI 스타일을 만들 때

- 컴포넌트마다 파셜 **`_ui_이름.scss`**(예 `_ui_dropdown.scss`)를 만들고 `common.scss` 에 `@use 'ui_이름';` 한 줄.
- 셀렉터는 마크업 파셜(`include/ui/_ui_이름.html`)의 **BEM 클래스 그대로** — 블록을 최상위에 두고 요소·변형·상태를 안에 중첩한다.
  ```scss
  @use 'variable';
  @use 'mixin';

  .ui-dropdown {
  	position: relative;
  	&__btn {
  		@include mixin.font-set(1rem, 500, variable.$gray-900);
  		&.is-placeholder { color: variable.$gray-400; }
  		&.is-open { border-color: variable.$gray-900; }
  	}
  	&__list { @include mixin.position(absolute, $top: 100%, $left: 0, $z-index: 10); }
  	&--search { … }
  }
  ```
- **보이고 숨기기는 `hidden` 이 맡는다**(`_reset` 의 `[hidden] { display: none !important }`). 스타일에서 `display: none` 으로 닫힌 상태를 만들지 않는다 — 상태 클래스(`is-open` · `is-show`)로는 **모양·모션만** 준다.
- 상태 클래스는 **블록·요소와 함께** 쓴다(`.ui-tab__btn.is-active`). 단독 `.is-active { }` 를 만들지 않는다.
- **컴포넌트를 페이지 골격 셀렉터 안에 두지 않는다** — 재사용이 막힌다. 페이지 전용 배치만 페이지 스타일에.
- 공통 컴포넌트의 **색·상태는 페이지에서 덮지 않는다.** 크기·여백·배치만 덮고, 덮을 때는 세트로 주는 값(min-height·line-height·padding)을 함께 바꾼다.
- 새 클래스·파일을 만들면 `grep` 으로 충돌 검사 → `docs/WORKLOG.md` 에 한 줄.

## 6. 줄바꿈 · 정렬

- `public/` 소스는 CRLF + 탭(`.editorconfig`). 커밋 시 `*.scss` 는 lint-staged 가 Prettier 로 정렬한다.
