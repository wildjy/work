/**
 * common.js — 공통 UI 동작
 *
 * 원칙
 *  - 공통 UI 의 동작은 **이 파일에만** 둔다. 페이지에 복사본·전용 토글 스크립트를 만들지 않는다.
 *  - 마크업(클래스·data-*)만 맞추면 동작하도록 **이벤트 위임**으로 짠다 — onclick 을 붙이지 않는다.
 *    파셜(dynamicImport)·목록(listRender)으로 나중에 그려진 요소에도 그대로 걸린다.
 *    (예외 : 드롭다운 toggleMenu · dropdownSelect · 스테퍼 stepperChange 는 onclick 호출을 쓴다)
 *  - 최초 동기화가 필요하면 세 시점에 모두 건다 —
 *    'DOMContentLoaded' · 'dynamic-content-loaded'(파셜 주입 끝) · 'dynamic-list-loaded'(목록 렌더 끝)
 *
 * 네이밍 — 공통 UI 는 BEM 에 ui- 접두어를 쓴다.
 *   블록 .ui-dropdown · 요소 .ui-dropdown__btn · 변형 .ui-dropdown--search · 상태 is-open / is-active / has-value
 *   마크업은 파셜 public/html/include/ui/_ui_*.html 이 기준이다. 클래스명을 바꾸면 **파셜·이 파일·pub-common-ui 스킬을 함께** 바꾼다.
 *
 * 보이고 숨기기 — **상태 클래스 + hidden 속성을 함께** 토글한다(setOpen).
 *   CSS 가 없어도 실제로 여닫히고, 스타일은 상태 클래스로 모양·모션을 준다.
 *   ⚠ 처음에 닫혀 있어야 하는 요소(목록·패널·본문·토스트·모달·달력)는 마크업에 hidden 을 적는다.
 *
 * ⚠ 함수를 추가·삭제하면 eslint.config.js 의 COMMON_FUNCTIONS 와 docs/WORKLOG.md 도 맞춘다.
 *
 * 목차
 *  0. 공통 헬퍼               setOpen
 *  1. 레이어 · 드롭다운        toggleLayer · toggleMenu · closeOpenLayers · dropdownSelect
 *  2. 모달                    modalOpen · modalClose        [data-modal-open] · .ui-modal__close · [data-modal-close]
 *  3. 탭                      tabActivate                   .ui-tab__btn
 *  4. 아코디언                accordionToggle               .ui-accordion__head
 *  5. 토스트                  toastShow · toastHide          [data-toast]
 *  6. 토글                    toggleClass
 *  7. 수량 스테퍼              stepperChange (+ 입력 동기화)
 *  8. 입력 지우기 버튼          clearInput (+ 입력 동기화)     .ui-input__clear
 *  9. 전체 선택 체크박스        CHECK_GROUPS
 * 10. LNB                     lnbActive                     .ui-lnb__link--toggle
 * 11. 날짜 · 기간 달력          datePickerInit (jQuery UI)     [data-datepicker-day] · .ui-period[data-datepicker]
 */

/* ── 0. 공통 헬퍼 ─────────────────────────────────────────── */

// 상태 클래스와 hidden 을 함께 맞춘다
function setOpen(el, open, cls) {
	if (!el) return;
	el.hidden = !open;
	el.classList.toggle(cls || 'is-open', !!open);
}

// 세 시점에 모두 건다 (최초 렌더 · 파셜 주입 후 · 목록 렌더 후)
function onRender(fn) {
	['DOMContentLoaded', 'dynamic-content-loaded', 'dynamic-list-loaded'].forEach(function (ev) {
		document.addEventListener(ev, fn);
	});
}

// 블록 안의 요소 중 **같은 블록 소속**만 고른다 (같은 컴포넌트가 중첩된 경우 안쪽 것을 빼기 위해)
function ownEls(block, blockSel, sel) {
	return Array.prototype.filter.call(block.querySelectorAll(sel), function (el) {
		return el.closest(blockSel) === block;
	});
}

/* ── 1. 레이어 · 드롭다운 ─────────────────────────────────── */

// toggleLayer 로 연 레이어(드롭다운·옵션메뉴·달력·알림 등) 목록
// - 새로 열면 나머지는 닫는다 (하나만 열림)
// - 레이어/트리거 바깥을 클릭하면 모두 닫는다
// ※ 모달(.ui-modal)은 대상이 아니다(의도치 않게 닫히면 안 되므로).
var _openLayers = [];
var _skipDocClick = false; // 트리거 클릭이 document 까지 버블링돼 방금 연 레이어를 닫는 것 방지

function _hideLayer(entry) {
	setOpen(entry.el, false);
	if (entry.cls && entry.trigger) entry.trigger.classList.remove(entry.cls);
}

// except 로 넘긴 요소만 남기고 전부 닫는다
function closeOpenLayers(except) {
	_openLayers = _openLayers.filter(function (entry) {
		if (entry.el === except) return true;
		_hideLayer(entry);
		return false;
	});
}

// 요소를 직접 받아 여닫는다 (toggleLayer · toggleMenu · 달력 공통 코어)
// ⚠ 열림 판정은 hidden 이다 — 닫힌 채 시작하는 레이어는 마크업에 hidden 을 적는다.
function toggleLayerEl(el, cls, trigger) {
	if (!el) return;

	// 이 클릭이 document 까지 버블링될 때 한 번만 무시한다.
	// (프로그램적으로 호출된 경우를 대비해 다음 태스크에서 스스로 해제)
	_skipDocClick = true;
	setTimeout(function () {
		_skipDocClick = false;
	}, 0);
	var willOpen = el.hidden;

	// 열든 닫든 다른 레이어는 정리한다 (닫는 경우 자기 자신도 포함)
	closeOpenLayers(willOpen ? el : null);

	if (!willOpen) return;

	setOpen(el, true);
	if (cls && trigger) trigger.classList.add(cls);
	_openLayers.push({ el: el, cls: cls, trigger: trigger || null });
}

// id 로 지정한 레이어를 여닫는다
function toggleLayer(id, cls, _this) {
	toggleLayerEl(document.getElementById(id), cls, _this);
}

// 드롭다운·옵션 메뉴 : id 없이 버튼 주변(블록 안)의 목록을 찾아 여닫는다.
// 파셜을 여러 번 include 하거나 목록이 JSON 으로 렌더돼 고유 id 를 줄 수 없는 경우에 쓴다.
//   <div class="ui-dropdown"><button type="button" class="ui-dropdown__btn" onclick="toggleMenu(this)">…</button>
//     <div class="ui-dropdown__list" hidden>…</div></div>
//   <div class="ui-menu"><button type="button" class="ui-menu__btn" onclick="toggleMenu(this)">옵션</button>
//     <div class="ui-menu__list" hidden>…</div></div>
function toggleMenu(_this, selector) {
	// 트리거가 목록과 형제가 아닐 수 있어(검색형은 .ui-input--search 안에 있음)
	// 블록까지 올라가서 찾는다. 블록이 없으면 부모 기준.
	var scope = _this && (_this.closest('.ui-dropdown, .ui-menu') || _this.parentNode);
	// 드롭다운 목록과 옵션 메뉴 둘 다 지원한다. 한 블록 안에는 둘 중 하나만 있다.
	var menu = scope ? scope.querySelector(selector || '.ui-dropdown__list, .ui-menu__list') : null;
	toggleLayerEl(menu, 'is-open', _this);
}

document.addEventListener('click', function (e) {
	if (_skipDocClick) {
		_skipDocClick = false;
		return;
	}
	if (!_openLayers.length) return;

	// 다른 코드가 이미 숨긴 레이어는 목록에서 정리
	_openLayers = _openLayers.filter(function (entry) {
		return !entry.el.hidden;
	});

	var inside = _openLayers.some(function (entry) {
		return entry.el.contains(e.target) || (entry.trigger && entry.trigger.contains(e.target));
	});
	if (!inside) closeOpenLayers(null);
});

// 드롭다운 목록에서 항목 선택 : is-active 이동 → 선택값을 버튼(또는 검색 입력)에 반영 → 닫기
//   <div class="ui-dropdown">
//     <button type="button" class="ui-dropdown__btn is-placeholder" onclick="toggleMenu(this)">선택해주세요.</button>
//     <div class="ui-dropdown__list" hidden>
//       <ul><li><button type="button" class="ui-dropdown__item" onclick="dropdownSelect(this)">항목</button></li></ul>
//     </div>
//   </div>
function dropdownSelect(_this) {
	var list = _this.closest('.ui-dropdown__list');
	if (!list) return;

	// '직접 입력하기'·'추가' 같은 액션 항목은 선택값으로 쓰지 않는다
	var isAction = _this.classList.contains('ui-dropdown__item--action');

	if (!isAction) {
		var items = list.querySelectorAll('.ui-dropdown__item');
		for (var i = 0; i < items.length; i++) items[i].classList.remove('is-active');
		_this.classList.add('is-active');

		var wrap = list.parentNode;
		var btn = wrap && wrap.querySelector('.ui-dropdown__btn');
		if (btn) {
			// 항목의 마크업을 버튼으로 옮긴다.
			// 버튼이 항목과 같은 이름의 래퍼를 갖고 있으면(예: .ui-dropdown__btn > .ui-profile)
			// 그 래퍼 안쪽만 교체해 구조를 유지한다. 통째로 덮으면 래퍼가 사라져 레이아웃이 깨진다.
			var STATE = [
				'ui-dropdown__item',
				'ui-dropdown__item--action',
				'is-active',
				'is-selected',
				'is-placeholder',
				'is-disabled',
			];
			var cls = (_this.className || '').split(/\s+/);
			var target = null;
			for (var c = 0; c < cls.length; c++) {
				if (!cls[c] || STATE.indexOf(cls[c]) >= 0) continue;
				var found = btn.querySelector('.' + cls[c]);
				if (found) {
					target = found;
					break;
				}
			}
			(target || btn).innerHTML = _this.innerHTML;
			btn.classList.remove('is-placeholder'); // 미선택 플레이스홀더 해제
			btn.classList.add('is-selected'); // 값 선택됨

			// 항목이 아이콘 클래스(ic_*)를 갖고 있으면 버튼 아이콘도 함께 바꾼다
			var icon = (_this.className.match(/\bic_[\w-]+/) || [])[0];
			if (icon) {
				btn.className =
					btn.className
						.replace(/\bic_[\w-]+/g, '')
						.replace(/\s+/g, ' ')
						.trim() +
					' ' +
					icon;
			}
		} else {
			// 버튼이 없는 입력형 드롭다운은 입력창에 값을 넣는다.
			// 검색형(.ui-input--search) 과 시간 선택처럼 입력창이 곧 표시부인 경우(직계 input) 만 대상.
			var input =
				(wrap && wrap.querySelector('.ui-input--search input[type="text"]')) ||
				(wrap && wrap.querySelector(':scope > input[type="text"]'));
			if (input) {
				// 항목에 보조 정보가 함께 있으면 .ui-dropdown__label 의 글자만 넣는다
				input.value = (_this.querySelector('.ui-dropdown__label') || _this).textContent.trim();
				if (typeof clearSync === 'function') clearSync(input);
			}
		}
	}

	closeOpenLayers(null); // 열 때와 같은 경로로 닫는다(트리거의 is-open 도 함께 해제)
}

/* ── 2. 모달 ──────────────────────────────────────────────── */
// 마크업 : 확인창은 파셜 include/ui/_ui_modal_confirm.html, 그 밖의 모달은 같은 구조로 모달마다 파셜을 만든다.
//   <div class="ui-modal ui-modal--sm" id="modal_x" role="dialog" aria-modal="true" aria-labelledby="modal_x_title" hidden>
//     <div class="ui-modal__dialog">
//       <div class="ui-modal__header"><h2 class="ui-modal__title" id="modal_x_title">제목</h2></div>
//       <div class="ui-modal__body">…</div>
//       <div class="ui-modal__footer"><button type="button" data-modal-close>취소</button> …</div>
//       <button type="button" class="ui-modal__close">닫기</button>
//     </div>
//   </div>
//   여는 버튼 : <button type="button" data-modal-open="modal_x">열기</button>
// ⚠ 딤 클릭·ESC 로 닫지 않는다 — 입력 중인 내용을 잃지 않게 하는 의도다.
// ⚠ 모달 위에 모달을 열면 DOM 순서로 쌓인다. 하나라도 열려 있으면 <html> 에 has-modal (스크롤 잠금용 훅).

function modalSyncRoot() {
	document.documentElement.classList.toggle('has-modal', !!document.querySelector('.ui-modal:not([hidden])'));
}

function modalOpen(id) {
	var el = document.getElementById(id);
	if (!el) return;
	closeOpenLayers(null); // 열려 있던 드롭다운은 정리한다
	setOpen(el, true);
	modalSyncRoot();
}

// id 문자열 또는 모달 요소를 받는다
function modalClose(idOrEl) {
	var el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
	if (!el) return;
	setOpen(el, false);
	modalSyncRoot();
}

document.addEventListener('click', function (e) {
	if (!e.target || !e.target.closest) return;
	var opener = e.target.closest('[data-modal-open]');
	if (opener) {
		modalOpen(opener.getAttribute('data-modal-open'));
		return;
	}
	var closer = e.target.closest('.ui-modal__close, [data-modal-close]');
	if (closer) {
		// data-modal-close="id" 로 다른 모달을 지정할 수 있다. 값이 없으면 가장 가까운 모달
		var id = closer.getAttribute('data-modal-close');
		modalClose(id ? id : closer.closest('.ui-modal'));
	}
});

/* ── 3. 탭 ────────────────────────────────────────────────── */
// 마크업(파셜 없음 — 버튼 수·패널 본문이 화면마다 달라 직접 쓴다) :
//   <div class="ui-tab">
//     <div class="ui-tab__list" role="tablist">
//       <button type="button" class="ui-tab__btn is-active" role="tab" data-tab="basic">기본</button>
//       <button type="button" class="ui-tab__btn" role="tab" data-tab="detail">상세</button>
//     </div>
//     <div class="ui-tab__panel" role="tabpanel" data-tab="basic">…</div>
//     <div class="ui-tab__panel" role="tabpanel" data-tab="detail" hidden>…</div>
//   </div>
// - 누른 버튼 is-active · aria-selected, 같은 data-tab 패널만 보인다(나머지 hidden).
// - 블록에 data-active="키" 를 적는다 → 패널 없이 CSS 가 보일 칸을 고르는 화면(요금 비교표 등)도 이것으로 한다.
// - 중첩 탭은 자기 블록 소속만 바꾼다.

function tabActivate(btn) {
	var block = btn && btn.closest('.ui-tab');
	if (!block) return;
	var key = btn.getAttribute('data-tab');
	ownEls(block, '.ui-tab', '.ui-tab__btn').forEach(function (b) {
		var on = b === btn;
		b.classList.toggle('is-active', on);
		b.setAttribute('aria-selected', on ? 'true' : 'false');
	});
	ownEls(block, '.ui-tab', '.ui-tab__panel').forEach(function (p) {
		setOpen(p, p.getAttribute('data-tab') === key, 'is-active');
	});
	block.setAttribute('data-active', key);
}

document.addEventListener('click', function (e) {
	var btn = e.target && e.target.closest && e.target.closest('.ui-tab__btn');
	if (btn) tabActivate(btn);
});

// 최초 : is-active 버튼(없으면 첫 버튼) 기준으로 패널을 맞춘다
onRender(function () {
	Array.prototype.forEach.call(document.querySelectorAll('.ui-tab'), function (block) {
		var btns = ownEls(block, '.ui-tab', '.ui-tab__btn');
		if (!btns.length) return;
		var cur = btns.filter(function (b) {
			return b.classList.contains('is-active');
		})[0];
		tabActivate(cur || btns[0]);
	});
});

/* ── 4. 아코디언 ──────────────────────────────────────────── */
// 마크업 : 파셜 include/ui/_ui_accordion.html (항목은 JSON)
//   <div class="ui-accordion" data-accordion="single">      ← multiple 이면 여러 개를 함께 연다
//     <ul><li class="ui-accordion__item is-open">
//       <button type="button" class="ui-accordion__head">제목</button>
//       <div class="ui-accordion__body">본문</div>
//     </li></ul>
//   </div>
// - 열림은 항목의 is-open 하나로 표시한다(본문 hidden · 머리 aria-expanded 는 JS 가 맞춘다).
// - ⚠ 머리(button) 안에 다른 버튼을 넣지 않는다. 항목 옆 도구는 머리 밖 형제로 둔다.

function accordionSync(item, open) {
	item.classList.toggle('is-open', !!open);
	var head = item.querySelector(':scope > .ui-accordion__head');
	var body = item.querySelector(':scope > .ui-accordion__body');
	if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
	if (body) body.hidden = !open;
}

// 머리·항목 어느 쪽을 넘겨도 된다. open 을 주면 그 상태로 맞춘다
function accordionToggle(el, open) {
	var item = el && el.closest('.ui-accordion__item');
	if (!item) return;
	var willOpen = typeof open === 'boolean' ? open : !item.classList.contains('is-open');
	var block = item.closest('.ui-accordion');
	if (willOpen && block && block.getAttribute('data-accordion') !== 'multiple') {
		ownEls(block, '.ui-accordion', '.ui-accordion__item').forEach(function (other) {
			if (other !== item) accordionSync(other, false);
		});
	}
	accordionSync(item, willOpen);
}

document.addEventListener('click', function (e) {
	var head = e.target && e.target.closest && e.target.closest('.ui-accordion__head');
	if (head) accordionToggle(head);
});

onRender(function () {
	Array.prototype.forEach.call(document.querySelectorAll('.ui-accordion__item'), function (item) {
		accordionSync(item, item.classList.contains('is-open'));
	});
});

/* ── 5. 토스트 ────────────────────────────────────────────── */
// 마크업 : 파셜 include/ui/_ui_toast.html — 페이지 끝에 둔다
//   <div class="ui-toast ui-toast--success" id="toast_saved" role="status" aria-live="polite" hidden>…</div>
//   띄우는 버튼 : <button type="button" data-toast="toast_saved">저장</button>  · 코드 : toastShow('toast_saved')
// - 보이는 동안 is-show. duration(기본 2500ms) 뒤 저절로 숨는다.

function toastShow(id, duration) {
	var el = document.getElementById(id);
	if (!el) return;
	setOpen(el, true, 'is-show');
	clearTimeout(el._toastTimer);
	el._toastTimer = setTimeout(function () {
		setOpen(el, false, 'is-show');
	}, duration || 2500);
}

function toastHide(id) {
	var el = document.getElementById(id);
	if (!el) return;
	clearTimeout(el._toastTimer);
	setOpen(el, false, 'is-show');
}

document.addEventListener('click', function (e) {
	var btn = e.target && e.target.closest && e.target.closest('[data-toast]');
	if (btn) toastShow(btn.getAttribute('data-toast'));
});

/* ── 6. 토글 ──────────────────────────────────────────────── */

function toggleClass(id, cls, _this) {
	var el = document.querySelectorAll(id);
	if (!el || el.length === 0) return;
	// 추가/제거 방향을 루프 전에 한 번만 결정 (루프 중 _this 상태 변경으로 인한 불일치 방지)
	var isActive = _this.classList.contains(cls);
	_this.classList.toggle(cls, !isActive);
	el.forEach(function (e) {
		e.classList.toggle(cls, !isActive);
	});
}

/* ── 7. 수량 스테퍼 ───────────────────────────────────────── */
// 수량 조절 스테퍼 (.ui-stepper : － / 입력 / ＋) — 파셜 include/ui/_ui_stepper.html
// 버튼 주변에서 input 을 찾아 값을 증감한다.
// 범위는 블록의 data-min / data-max 로 준다 (기본 min 0 · max 없음 — 빈 값도 없음).
//   <div class="ui-stepper" data-min="0" data-max="9999">
// 값이 경계에 닿으면 해당 버튼에 is-disabled 가 붙는다 — 마크업에 직접 쓰지 않는다.
// 직접 타이핑해도 동기화되고, 파셜·목록으로 나중에 그려진 스테퍼에도 적용된다.
var STEPPER = '.ui-stepper';

function stepperNum(v) {
	var n = parseInt(String(v == null ? '' : v).replace(/[^0-9]/g, ''), 10);
	return isNaN(n) ? null : n;
}
function stepperRange(wrap) {
	var min = stepperNum(wrap.getAttribute('data-min'));
	var max = stepperNum(wrap.getAttribute('data-max'));
	return { min: min === null ? 0 : min, max: max };
}
function stepperSync(wrap) {
	if (!wrap) return;
	var input = wrap.querySelector('input');
	if (!input) return;
	var v = stepperNum(input.value) || 0;
	var r = stepperRange(wrap);
	var minus = wrap.querySelector('.ui-stepper__btn--minus');
	var plus = wrap.querySelector('.ui-stepper__btn--plus');
	if (minus) minus.classList.toggle('is-disabled', v <= r.min);
	if (plus) plus.classList.toggle('is-disabled', r.max !== null && v >= r.max);
}
function stepperChange(_this, delta, min, max) {
	var wrap = _this.closest(STEPPER) || _this.parentNode;
	if (!wrap) return;
	var input = wrap.querySelector('input');
	if (!input) return;
	var r = stepperRange(wrap);
	// 인자로 준 값이 있으면 그쪽이 이긴다(기존 호출부 호환)
	if (typeof min !== 'number') min = r.min;
	if (typeof max !== 'number') max = r.max;
	var v = (stepperNum(input.value) || 0) + (delta || 0);
	if (v < min) v = min;
	if (max !== null && typeof max === 'number' && v > max) v = max;
	input.value = v.toLocaleString();
	stepperSync(wrap);
}

// 직접 타이핑 : 숫자만 남기고 범위 안으로 맞춘다.
//  · 숫자가 아닌 문자는 지운다(한글·영문·기호·마이너스 전부)
//  · data-max 를 넘겨 입력하면 max 로 잘린다
//  · 지우는 중에는 빈 값을 허용한다 — 여기서 0 을 강제로 넣으면 지울 수가 없다.
//    빈 채로 포커스를 잃으면 아래 blur 에서 min 으로 되돌린다.
// ⚠ 자릿수 구분자(1,000)를 다시 넣으면 캐럿 위치가 어긋나므로 끝으로 보낸다.
function stepperClean(input, wrap) {
	var raw = String(input.value || '');
	var digits = raw.replace(/[^0-9]/g, '');
	var out;
	if (digits === '') {
		out = '';
	} else {
		var r = stepperRange(wrap);
		var n = parseInt(digits, 10);
		if (r.max !== null && n > r.max) n = r.max;
		if (n < r.min) n = r.min;
		out = n.toLocaleString();
	}
	if (out === raw) return;
	input.value = out;
	try {
		input.setSelectionRange(out.length, out.length);
	} catch (err) {
		/* number 타입 등 */
	}
}

// 직접 타이핑 / 최초 렌더 · 파셜 주입 후 동기화
document.addEventListener('input', function (e) {
	var wrap = e.target && e.target.closest && e.target.closest(STEPPER);
	if (!wrap) return;
	stepperClean(e.target, wrap);
	stepperSync(wrap);
});
// 비운 채로 빠져나가면 최소값으로 되돌린다 (blur 는 버블링하지 않아 캡처로 듣는다)
document.addEventListener(
	'blur',
	function (e) {
		var wrap = e.target && e.target.closest && e.target.closest(STEPPER);
		if (!wrap) return;
		if (String(e.target.value || '').trim() !== '') return;
		e.target.value = stepperRange(wrap).min.toLocaleString();
		stepperSync(wrap);
	},
	true,
);
onRender(function () {
	Array.prototype.forEach.call(document.querySelectorAll(STEPPER), stepperSync);
});

/* ── 8. 입력 지우기 버튼 ──────────────────────────────────── */
// 입력 지우기 버튼 (.ui-input · .ui-input--search 공통) — 파셜 include/ui/_ui_input.html
// 마크업에 <button type="button" class="ui-input__clear">지우기</button> 만 넣어두면 동작한다(onclick 을 붙이지 않는다).
//  - 입력값이 있으면 .ui-input 에 is-filled(테두리 진하게) 와 has-value(지우기 노출)가 붙는다
//  - 지우기를 누르면 입력을 비우고 포커스를 돌려준다
// 이벤트 위임이라 파셜·JSON 으로 나중에 그려진 입력에도 그대로 적용된다.
var CLEAR_CELL = '.ui-input';
var CLEAR_INPUT = '.ui-input input';

function clearSync(input) {
	var cellParent = input.closest('.ui-field');
	var cell = input.closest(CLEAR_CELL);
	if (!cell) return;
	var has = String(input.value || '').trim() !== '' && !input.disabled && !input.readOnly;
	var hasDisabled = input.disabled || input.readOnly;
	// 값이 있으면 테두리를 진하게 — 지우기 버튼 유무와 무관한 공통 상태다
	cell.classList.toggle('is-filled', has);
	// 입력할 수 없는 칸에는 오류·성공 안내를 보이지 않는다
	if (hasDisabled && cellParent) {
		cellParent.querySelectorAll('.ui-helper').forEach(function (el) {
			el.hidden = true;
		});
	}
	// 지우기 버튼이 있는 셀만 노출 상태를 관리한다
	if (cell.querySelector('.ui-input__clear')) cell.classList.toggle('has-value', has);
}

function clearInput(_this) {
	var cell = _this.closest(CLEAR_CELL);
	var input = cell && cell.querySelector('input');
	if (!input) return;
	input.value = '';
	clearSync(input);
	// 검색 필터·기간 달력처럼 input 을 듣고 있는 로직이 반응하도록 이벤트를 흘려준다
	input.dispatchEvent(new Event('input', { bubbles: true }));
	input.focus();
}

document.addEventListener('input', function (e) {
	if (e.target && e.target.matches && e.target.matches(CLEAR_INPUT)) clearSync(e.target);
});
document.addEventListener('click', function (e) {
	var btn = e.target && e.target.closest && e.target.closest('.ui-input__clear');
	if (btn) clearInput(btn);
});

onRender(function () {
	Array.prototype.forEach.call(document.querySelectorAll(CLEAR_INPUT), clearSync);
});

/* ── 9. 전체 선택 체크박스 ────────────────────────────────── */
// 마크업이 「그룹 안에 [헤더 체크박스] + [행 체크박스]」이기만 하면 동작한다.
// 페이지에 전용 스크립트를 두지 않는다. 새 목록을 만들면 아래 표에 한 줄 추가한다.
// ⚠ disabled 행은 건드리지 않는다 — 「이미 확정된 선택」이라 해제할 수 없다.
// ⚠ 행 체크가 바뀌면 헤더도 되돌려 맞춘다 — 전부 체크됐을 때만 헤더가 체크된다.
//    (부분 선택 표시는 시안에 없어 만들지 않는다 — indeterminate 미사용)
var CHECK_GROUPS = [
	// root : 그룹 컨테이너 / all : 헤더(전체 선택) 체크박스 / item : 행 체크박스
	// { root: '.select_table', all: 'thead input[type="checkbox"]', item: 'tbody input[type="checkbox"]' },
];

// 헤더 → 행 : 전부 맞춘다 (disabled 는 유지)
function checkGroupApply(root, g, on) {
	var items = root.querySelectorAll(g.item);
	Array.prototype.forEach.call(items, function (el) {
		if (el.disabled) return;
		el.checked = on;
	});
}

// 행 → 헤더 : 전부 체크됐는지로 되돌려 맞춘다
function checkGroupSync(root, g) {
	var all = root.querySelector(g.all);
	if (!all) return;
	var items = root.querySelectorAll(g.item);
	var on = 0;
	Array.prototype.forEach.call(items, function (el) {
		if (el.checked) on++;
	});
	all.checked = items.length > 0 && on === items.length;
}

// 화면 안의 모든 그룹 헤더 상태를 맞춘다 (최초 렌더용)
function checkGroupSyncAll() {
	CHECK_GROUPS.forEach(function (g) {
		var roots = document.querySelectorAll(g.root);
		Array.prototype.forEach.call(roots, function (root) {
			checkGroupSync(root, g);
		});
	});
}

document.addEventListener('change', function (e) {
	var cb = e.target;
	if (!cb || cb.type !== 'checkbox' || !cb.closest) return;
	for (var i = 0; i < CHECK_GROUPS.length; i++) {
		var g = CHECK_GROUPS[i];
		var root = cb.closest(g.root);
		if (!root) continue;
		if (cb === root.querySelector(g.all)) checkGroupApply(root, g, cb.checked);
		else if (cb.matches(g.item)) checkGroupSync(root, g);
		else continue;
		return;
	}
});

// 최초 렌더 / 목록 렌더 후 : 헤더 체크 상태를 행에 맞춘다
['DOMContentLoaded', 'dynamic-list-loaded'].forEach(function (ev) {
	document.addEventListener(ev, checkGroupSyncAll);
});

/* ── 10. LNB ──────────────────────────────────────────────── */
// 마크업 : 파셜 include/ui/_ui_lnb.html
//   .ui-lnb .ui-lnb__item > a.ui-lnb__link[href]
//   하위 메뉴 : .ui-lnb__item > button.ui-lnb__link--toggle + .ui-lnb__sub[hidden]
// - 현재 파일명과 링크 href 를 대조해 is-active, 하위 메뉴가 활성이면 상위 항목 is-open.
//
// ⚠ 페이지마다 「메뉴명 문자열」로 토글하는 스크립트를 붙이지 않는다 —
//    메뉴명이 바뀌면 여러 곳이 조용히 깨지고, 새 페이지를 만들 때마다 빠뜨린다.
// ⚠ 확장자를 떼고 비교한다 — `npx serve` 는 cleanUrls 가 기본이라
//    /prerender/faq.html 로 들어가도 주소가 /prerender/faq 로 바뀐다.
//    (파일을 직접 열면 .html 이 남는다 → 양쪽 다 떼야 어느 환경에서도 맞는다)
// 상세·빈 화면처럼 자기 메뉴가 없는 변형 페이지는 아래 표로 대표 페이지에 연결한다.
var LNB_ALIAS = {
	// 변형 페이지: '대표 페이지'
	// notice_view: 'notice',
};

// 경로에서 확장자 없는 파일명만 뽑는다 (쿼리·해시·index 처리 포함)
function lnbFile(p) {
	var name = (p || '').split('?')[0].split('#')[0].split('/').pop();
	return name.replace(/\.html?$/i, '');
}

// 하위 메뉴를 가진 항목을 여닫는다
function lnbSetOpen(item, open) {
	item.classList.toggle('is-open', !!open);
	var sub = item.querySelector(':scope > .ui-lnb__sub');
	if (sub) sub.hidden = !open;
	var toggle = item.querySelector(':scope > .ui-lnb__link--toggle');
	if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function lnbActive() {
	// 마크업의 is-open 과 하위 목록 hidden 을 먼저 맞춘다
	Array.prototype.forEach.call(document.querySelectorAll('.ui-lnb .ui-lnb__item'), function (item) {
		if (item.querySelector(':scope > .ui-lnb__sub')) lnbSetOpen(item, item.classList.contains('is-open'));
	});

	var items = document.querySelectorAll('.ui-lnb .ui-lnb__link[href]');
	if (!items.length) return;
	var here = lnbFile(location.pathname);
	here = LNB_ALIAS[here] || here;
	for (var i = 0; i < items.length; i++) {
		var target = lnbFile(items[i].getAttribute('href'));
		items[i].classList.toggle('is-active', !!target && target === here);
	}
	// 하위 메뉴가 활성이면 상위 항목을 펼친다
	var sub = document.querySelector('.ui-lnb .ui-lnb__sub .ui-lnb__link.is-active');
	if (sub) {
		var parent = sub.closest('.ui-lnb__sub').closest('.ui-lnb__item');
		if (parent) lnbSetOpen(parent, true);
	}
}
document.addEventListener('dynamic-content-loaded', lnbActive);
document.addEventListener('DOMContentLoaded', lnbActive);

document.addEventListener('click', function (e) {
	var toggle = e.target && e.target.closest && e.target.closest('.ui-lnb__link--toggle');
	if (!toggle) return;
	var item = toggle.closest('.ui-lnb__item');
	if (item) lnbSetOpen(item, !item.classList.contains('is-open'));
});

/* ── 11. 날짜 · 기간 달력 — jQuery UI datepicker ──────────────
   달력은 **jQuery UI 가 그리고** 모양만 스타일(.ui-datepicker)로 시안에 맞춘다.
   ⚠ 이 페이지에는 jQuery 와 jQuery UI 가 있어야 한다. 없으면 콘솔 경고만 남기고 건너뛴다.
   ⚠ jQuery UI 테마 CSS 는 부러 불러오지 않는다 — 전부 덮어야 해서 오히려 방해가 된다.
   ⚠⚠ jQuery UI 기본 팝업(입력에 바로 .datepicker())을 쓰면 안 된다.
       그건 달력을 <body> 에 붙이고 **열 때 계산한 문서 좌표로 못박는다.**
       그래서 입력이 스크롤 영역 안에서 움직이면 달력만 제자리에 남아 자리를 잃는다.
       .ui-field 안에 넣고 **static 위치**(offset 을 주지 않은 absolute)로 두면 입력과 함께 움직인다.
   ⚠ 여닫기는 공통 toggleLayerEl 에 맡긴다 — 바깥을 누르면 닫히는 동작이 딸려 온다. */

var DP_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']; // 일요일부터 적는다. firstDay 가 돌린다
var DP_MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// 2026. 9. 10. — 시안 표기
function dpText(d) {
	return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.';
}

// 같은 날인가 (시각은 보지 않는다)
function dpSame(a, b) {
	return (
		!!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
	);
}

/* 달력 안을 누른 클릭 한 번을 「바깥 클릭」으로 보지 않게 한다.

   ⚠⚠ 이게 없으면 **달 이동(‹ ›)이나 날짜 클릭에 달력이 저절로 닫힌다.**
       jQuery UI 는 누른 즉시 인라인 달력을 통째로 다시 그린다. 그래서 클릭이 document 까지
       버블링될 때쯤엔 방금 누른 요소가 **DOM 에서 떨어져 나가 있고**,
       바깥 클릭 판정(entry.el.contains(e.target), 위 document 리스너)이 false 가 된다.

   ⚠ 이벤트 경로는 **보낼 때 정해지므로** 중간에 노드가 빠져도 이 리스너는 그대로 불린다.
      그 점을 이용해 달력 상자에서 표시만 해 둔다. 닫는 건 각자의 onSelect 가 명시적으로 한다. */
function dpKeepOpen(el) {
	el.addEventListener('click', function () {
		_skipDocClick = true;
	});
}

/* ── 기간 : 파셜 include/ui/_ui_period.html
     <div class="ui-field ui-field--period">
       <div class="ui-input ui-input--date"><input type="text" …><button type="button" class="ui-input__clear">지우기</button></div>
       <div class="ui-period" id="…_period" data-datepicker hidden>
         <div class="ui-period__header"><input class="ui-period__date" readonly> ~ <input class="ui-period__date" readonly></div>
         <div class="ui-period__calendar"></div>     ← 비워 둔다. jQuery UI 가 채운다
         <div class="ui-period__footer"></div>       ← 옵션(종료일·시간 포함 등)은 화면에 따라
       </div>
     </div>
   - 입력을 누르면 열린다. 첫 클릭 = 시작일, 둘째 클릭 = 종료일 → 닫힌다. 시작보다 앞을 고르면 다시 시작일.
   - 입력을 지우기로 비우면 고른 범위도 초기화된다. */

// 고른 기간을 위쪽 날짜칸 두 개와 바깥 입력칸에 적는다
function dpFill(root, st) {
	var dates = root.querySelectorAll('.ui-period__header .ui-period__date');
	if (dates[0]) dates[0].value = st.from ? dpText(st.from) : '';
	if (dates[1]) dates[1].value = st.to ? dpText(st.to) : '';

	var cell = root.parentNode ? root.parentNode.querySelector('.ui-input input') : null;
	if (!cell) return;
	cell.value = st.from ? dpText(st.from) + (st.to ? ' ~ ' + dpText(st.to) : '') : '';
	if (typeof clearSync === 'function') clearSync(cell);
}

function dpInit(root) {
	if (root._dp) return;
	var box = root.querySelector('.ui-period__calendar');
	if (!box) return;

	var st = { from: null, to: null };
	root._dp = st;

	$(box).datepicker({
		numberOfMonths: 2,
		firstDay: 1, // 월요일 시작
		showOtherMonths: true, // 앞뒤 달 날짜를 흐리게 보여준다
		selectOtherMonths: false,
		dayNamesMin: DP_DAY_NAMES,
		monthNames: DP_MONTH_NAMES,
		showMonthAfterYear: true, // 「2026년 9월」 — 「년」은 스타일의 ::after 가 붙인다
		yearSuffix: '',

		// 고른 범위를 칠한다. 돌려주는 클래스는 날짜 칸(td)에 붙는다
		beforeShowDay: function (d) {
			if (!st.from) return [true, ''];
			var isFrom = dpSame(d, st.from);
			var isTo = dpSame(d, st.to);
			var inRange = st.to && d > st.from && d < st.to;
			var cls = '';
			if (isFrom || isTo || inRange) cls += ' dp_in';
			if (isFrom) cls += ' dp_start';
			if (isTo || (!st.to && isFrom)) cls += ' dp_end';
			return [true, cls];
		},

		onSelect: function (text, inst) {
			var d = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
			if (!st.from || st.to || d < st.from) {
				st.from = d;
				st.to = null;
			} else {
				st.to = d;
			}
			dpFill(root, st);

			// ⚠ 종료일까지 고르면 닫는다. toggleLayerEl 로 닫아야 _openLayers 상태가 남지 않는다.
			if (st.to && !root.hidden) toggleLayerEl(root, null, null);
			// 칠은 다시 그릴 때 beforeShowDay 가 다시 불리며 잡힌다 — 여기서 refresh 하지 않는다.
		},
	});

	var input = root.parentNode ? root.parentNode.querySelector('.ui-input input') : null;
	if (input) {
		input.addEventListener('click', function () {
			toggleLayerEl(root, null, input);
		});
		// 지우기로 비우면 범위도 초기화한다(clearInput 이 input 이벤트를 흘려준다)
		input.addEventListener('input', function () {
			if (input.value !== '' || (!st.from && !st.to)) return;
			st.from = null;
			st.to = null;
			dpFill(root, st);
			$(box).datepicker('refresh');
		});
	}

	dpKeepOpen(root);
	dpFill(root, st);
}

/* ── 날짜 하나 : 파셜 include/ui/_ui_date.html
     <div class="ui-field">
       <div class="ui-input ui-input--date">
         <input type="text" id="startDate" placeholder="날짜를 선택해주세요." data-datepicker-day>
         <button type="button" class="ui-input__clear">지우기</button>
       </div>
     </div>
   달력 상자는 이 함수가 만들어 **.ui-input 바로 뒤(같은 .ui-field 안)** 에 끼운다.
     <div class="ui-calendar" id="startDate_cal" hidden>…</div>
   ⚠ 표기는 「2020.03.02」다(dateFormat 'yy.mm.dd').
   ⚠ 한 달만 띄우므로 .ui-datepicker-multi 가 붙지 않는다(DOM 이 다르다 — 스타일을 따로 맞춘다). */
function dpDayInit(input) {
	if (input._dpDay) return;
	var cell = input.closest('.ui-input');
	var box = cell ? cell.parentNode : null;
	if (!cell || !box) return;
	input._dpDay = true;

	var wrap = document.createElement('div');
	wrap.className = 'ui-calendar';
	wrap.id = (input.id || 'datepicker') + '_cal';
	wrap.hidden = true;
	box.insertBefore(wrap, cell.nextSibling);

	input.addEventListener('click', function () {
		toggleLayerEl(wrap, null, input);
	});

	dpKeepOpen(wrap);

	$(wrap).datepicker({
		numberOfMonths: 1,
		firstDay: 1, // 월요일 시작
		showOtherMonths: true,
		selectOtherMonths: false,
		dateFormat: 'yy.mm.dd',
		dayNamesMin: DP_DAY_NAMES,
		monthNames: DP_MONTH_NAMES,
		showMonthAfterYear: true,
		yearSuffix: '',
		onSelect: function (text) {
			input.value = text;
			// 지우기 버튼·테두리 상태를 공통 규칙에 맞춘다
			if (typeof clearSync === 'function') clearSync(input);
			// 고르면 닫는다. toggleLayerEl 로 닫아야 _openLayers 상태가 남지 않는다
			if (!wrap.hidden) toggleLayerEl(wrap, null, input);
		},
	});
}

function datePickerInit() {
	var range = document.querySelectorAll('.ui-period[data-datepicker]');
	var days = document.querySelectorAll('input[data-datepicker-day]');
	if (!range.length && !days.length) return;
	// jQuery UI 가 없는 페이지에서 여기서 멈추지 않게 한다
	if (typeof window.jQuery === 'undefined' || !window.jQuery.fn || !window.jQuery.fn.datepicker) {
		console.warn('[datepicker] jQuery UI 가 없어 건너뛴다 — 페이지에 jquery-ui 를 불러야 한다.');
		return;
	}
	for (var i = 0; i < range.length; i++) dpInit(range[i]);
	for (var j = 0; j < days.length; j++) dpDayInit(days[j]);
}
document.addEventListener('dynamic-content-loaded', datePickerInit);
document.addEventListener('DOMContentLoaded', datePickerInit);
