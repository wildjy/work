# 폴더 구조 — 슬라이스와 세그먼트 (FSD 모티브)

파셜이 늘어날 때 **어느 폴더에 두나**를 정한 문서. 호출 문법은 `docs/PARTIALS.md`, 설계 판단(언제 파셜로 빼나)은
`.claude/skills/pub-markup` 에 있다. 여기는 **위치**만 다룬다.

> 🖥 **같은 내용의 화면 판** : `public/html/Guide_Structure.html` → 작업 목록(index)의 「폴더 구조 — 어느 폴더에 두나」.
> 표는 `public/data/guide/structure.json` 에 있다 — 고칠 때는 이 문서와 그쪽을 함께 본다.

> 새 아키텍처를 들여오는 문서가 아니다. 이 저장소가 이미 지키고 있는 원칙에 **폴더 이름만 맞추는** 것이다.

---

## 0. 30초 요약

```
public/
├─ html/
│  ├─ Member.html                               ← 페이지
│  └─ include/
│     ├─ ui/       _ui_modal.html …             ← 공통 UI (프레임 · 아무도 참조하지 않는다)
│     ├─ common/   _header.html …               ← 두 곳 이상이 쓰는 서비스 조각
│     └─ member/                                ← 슬라이스 (data/member 와 같은 이름)
│        ├─ section/ _member_list.html …        ← 화면을 이루는 덩어리
│        ├─ body/    _member_invite_body.html   ← 슬롯 본문
│        └─ _member_row.html                    ← 그 밖의 조각
└─ data/
   └─ member/*.json                             ← 그 슬라이스의 데이터
```

1. **`data/<슬라이스>` 와 `include/<슬라이스>` 는 같은 이름**을 쓴다.
2. 슬라이스 안은 **세그먼트**로 나눈다 — `section/`(화면 덩어리) · `body/`(슬롯 본문).
3. 두 슬라이스가 같은 것을 쓰게 되면 **`common/` 으로 올린다**(기존 규칙 그대로).
4. `ui/` 는 아무 슬라이스도 참조하지 않는다. 필요한 마크업은 **슬롯으로 받는다.**

---

## 1. FSD 를 이 저장소에 대응시키면

| FSD 레이어 | 이 저장소 |
| --- | --- |
| `app` | `public/js/*.js` · `scss/common.scss` · `scripts/` · `index.html` |
| `pages` | `public/html/*.html` |
| `widgets` | `include/<슬라이스>/section/` — 화면 한 덩어리 |
| `features` | `include/<슬라이스>/` — 행동 단위(초대 폼 · 필터) |
| `entities` | `include/<슬라이스>/` 의 도메인 조각 + `data/<슬라이스>/*.json` |
| `shared` | `include/ui/_ui_*.html` · `scss/_ui_*.scss` · `data/ui/*.json` |

FSD 의 핵심은 폴더 이름이 아니라 **의존 방향**인데, 이 저장소는 이미 그것을 지키고 있다 —
모달 프레임(shared)이 본문(feature)을 직접 include 하지 않고 **슬롯으로 받는다.**
슬롯이 곧 의존 역전 장치이고, React 의 `children` 과 같은 역할이다.

---

## 2. 세그먼트 두 개

### `section/` — 화면을 이루는 덩어리

한 페이지가 길어지면 구역 단위로 가른다. 페이지에는 include 줄만 남는다.

```html
<main class="layout__main">
	<div class="dynamic-content" data-source="./include/sample/section/_sample_list.html"></div>
	<div class="dynamic-content" data-source="./include/sample/section/_sample_input.html"></div>
</main>
```

- **목록 template 은 컨테이너와 같은 파일에** 둔다(파셜이 목록보다 먼저 주입된다).
- 화면에 보이지 않는 덩어리(토스트 · 모달의 실체)도 여기 둔다 — `_sample_overlay.html`.
- ⚠ **닫음 표시를 `template` 바로 아래 두지 않는다.** 프리렌더가 template 의 닫음 표시로 보고 지운다.
  `</section>` 바로 뒤로 올린다.

### `body/` — 슬롯 본문

모달 프레임에 넘길 본문. **`template` 은 include 를 적은 파일에 남기고 내용만** 여기 둔다.

```html
<template id="sample_invite_body">
	<div class="dynamic-content" data-source="./include/sample/body/_sample_invite_body.html"></div>
</template>
```

`template` 요소째 파셜로 빼면 **include 순서에 묶이고, 어기면 조용히 빈 본문**으로 나간다.
배치별 동작표는 `docs/PARTIALS.md` §4.

---

## 3. 이름 셋을 한 규칙으로 묶는다

`grep -rn sample_invite` 한 번에 전부 잡히게 한다.

```
파일       include/sample/body/_sample_invite_body.html
template   id="sample_invite_body"
모달       data-id="sample_invite"          (여는 버튼 data-modal-open="sample_invite")
본문 안 id  sample_invite_name · _email · _count
```

⚠ 본문 파셜이 **고정 id 를 가지면 한 페이지에 두 번 넣지 못한다**(id 가 겹쳐 라벨과 `getElementById` 가
먼저 나온 것만 가리킨다). 두 번 쓸 본문은 파셜이 id 를 `data-*` 로 받게 만든다 — `id="{{prefix}}_name"`.

---

## 4. 언제 빼고, 언제 그대로 두나

FSD 도 「재사용·경계가 생길 때」 슬라이스를 나눈다. 처음부터 다 파일로 만들면 파일만 늘어난다.

| | 이렇게 |
| --- | --- |
| 구역이 30줄 안쪽이고 페이지가 200줄을 넘지 않는다 | 페이지에 그대로 둔다 |
| 페이지가 길어져 구역을 찾기 어렵다 | `section/` 으로 가른다 |
| 슬롯 본문이 10줄 안팎 · 그 화면 전용 | `template` 안에 직접 |
| 슬롯 본문이 30줄을 넘거나 두 화면이 쓴다 | `body/` 파셜 |
| 두 슬라이스가 같은 것을 쓰게 됐다 | `common/` 으로 올린다 |

---

## 5. 지켜야 할 의존 방향

- `include/ui/` 는 `include/<슬라이스>/` 를 **include 하지 않는다**(프레임은 슬롯으로만 받는다).
- `<슬라이스>/body/` 는 `include/ui/` 를 **써도 된다**(입력 · 드롭다운 파셜 사용).
- **다른 슬라이스의 `body/` 를 가져다 쓰지 않는다** — 두 곳이 쓰면 `common/` 으로 올린다.
- ⚠ **본문 마크업을 JSON 으로 옮기지 않는다.** `<` 와 `{{ }}` 의 이중 escape 지옥이 된다
  (가이드 페이지 데이터에서 겪었다). **JSON 은 반복되는 값, 파셜은 마크업.**

---

## 6. 지금 저장소에 적용된 것

`public/html/Sample.html` 이 이 구조의 실물이다 — 510줄이던 페이지가 include 8줄만 남았다.

```
include/sample/
├─ section/  _sample_list · _button · _input · _choice · _nav · _feedback · _var · _overlay
└─ body/     _sample_invite_body.html
```

점검 상세 알림의 본문(문단 3개)은 **4번 기준에 따라** `_sample_overlay.html` 의 `template` 안에 직접 두었다.

---

## 7. 더 나아가려면 (엔진 손질 · 선택)

지금은 「`template` 요소째 파셜로 빼기」가 순서에 묶인다. 이걸 풀면 `body/` 에 template 파일 자체를 둘 수 있다.

| 고칠 곳 | 방법 |
| --- | --- |
| `scripts/prerender.js` | 전개 전에 include 그래프를 훑어 **모든 파셜의 template 을 먼저 수집**(2-pass) |
| `public/js/dynamicImport.js` | 슬롯을 못 찾으면 비워 두지 말고 **주입이 끝난 뒤 한 번 더** 시도 |

⚠ **두 구현을 반드시 같이 고친다** — 한쪽만 고치면 화면과 산출물이 갈린다.
못 찾았을 때 조용히 비는 동작도 함께 손봐야 한다. 지금 규모에서는 1단계(본문만 분리)로 충분하고,
슬롯 본문이 10개를 넘어가면 그때 검토한다.
