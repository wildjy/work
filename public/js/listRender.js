/**
 * listRender.js — JSON 데이터 + <template> 반복 렌더링 (React 의 map 과 같은 방식)
 *
 * 반복되는 목록 마크업(테이블 행, 설정 목록 등)을 HTML 에 손으로 찍지 않고
 * JSON 을 순회해 <template> 으로 찍어낸다. 빌드 도구 없이 순수 JS 로 동작.
 *
 * ── 사용법 ────────────────────────────────────────────────
 *  <tbody class="dynamic-list"
 *         data-source="../data/파일.json"
 *         data-template="#tpl_row"
 *         data-empty="#tpl_empty"     <!-- 선택: 0건일 때 -->
 *         data-filter="!owner">      <!-- 선택: 값이 거짓인 항목만. "owner"=참인 항목만, "page=1"=값이 일치하는 항목만 -->
 *  </tbody>
 *
 *  <template id="tpl_row">
 *    <tr><td>{{no}}</td><td>{{name}}</td></tr>
 *  </template>
 *
 * ── 치환 규칙 ──────────────────────────────────────────────
 *  {{key}}      값 치환 (HTML 이스케이프)
 *  {{{key}}}    값 치환 (raw HTML — 신뢰할 수 있는 값에만)
 *  {{@index}}   0부터 시작하는 순번
 *  {{@number}}  1부터 시작하는 순번
 *  없는 키는 빈 문자열
 *
 * ── 항목별 다른 템플릿 ──────────────────────────────────────
 *  JSON 항목에 "_tpl": "#tpl_다른것" 을 넣으면 그 항목만 다른 템플릿으로 렌더한다.
 *  (예: 설정 목록에서 한 줄만 입력 UI 인 경우)
 *
 * ── 실행 시점 ──────────────────────────────────────────────
 *  페이지에 .dynamic-content(파셜 include) 가 있으면 dynamicImport.js 의
 *  'dynamic-content-loaded' 이후에, 없으면 DOMContentLoaded 직후에 렌더한다.
 *  렌더가 모두 끝나면 'dynamic-list-loaded' 이벤트를 한 번 발생시키므로,
 *  목록에 의존하는 페이지 스크립트는 이 이벤트 이후에 실행한다.
 */
(function () {
	var escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

	function escapeHtml(v) {
		return String(v).replace(/[&<>"']/g, function (c) {
			return escapeMap[c];
		});
	}

	// {{{key}}} → raw, {{key}} → escaped
	function fillTemplate(html, item, index) {
		var ctx = {};
		for (var k in item) {
			if (Object.prototype.hasOwnProperty.call(item, k)) ctx[k] = item[k];
		}
		ctx['@index'] = index;
		ctx['@number'] = index + 1;

		return html
			.replace(/\{\{\{\s*([\w@.-]+)\s*\}\}\}/g, function (_m, key) {
				return ctx[key] == null ? '' : String(ctx[key]);
			})
			.replace(/\{\{\s*([\w@.-]+)\s*\}\}/g, function (_m, key) {
				return ctx[key] == null ? '' : escapeHtml(ctx[key]);
			});
	}

	// data-filter="key" → 값이 참인 항목만 / "!key" → 값이 거짓인 항목만
	function applyFilter(items, expr) {
		if (!expr) return items;

		// "key=값" : 값이 일치하는 항목만 (하나의 JSON 을 여러 컨테이너가 나눠 쓸 때)
		var eq = expr.indexOf('=');
		if (eq > 0) {
			var k = expr.slice(0, eq).trim();
			var val = expr.slice(eq + 1).trim();
			return items.filter(function (it) {
				return it && String(it[k]) === val;
			});
		}

		var neg = expr.charAt(0) === '!';
		var key = neg ? expr.slice(1) : expr;
		return items.filter(function (it) {
			var v = it && it[key];
			return neg ? !v : !!v;
		});
	}

	function templateHtml(selector) {
		if (!selector) return null;
		var tpl = document.querySelector(selector);
		if (!tpl) {
			console.error('[listRender] template not found:', selector);
			return null;
		}
		// <template> 이면 innerHTML, 아니면 요소 자체의 innerHTML 사용
		return tpl.innerHTML;
	}

	function renderOne(el) {
		var src = el.getAttribute('data-source');
		var defaultTpl = el.getAttribute('data-template');
		var emptyTpl = el.getAttribute('data-empty');
		var filter = el.getAttribute('data-filter');

		if (!src) return Promise.resolve();

		return fetch(src)
			.then(function (res) {
				if (!res.ok) throw new Error('Failed to fetch ' + src);
				return res.json();
			})
			.then(function (data) {
				// 배열이 아니면 { items: [...] } 형태도 허용
				var all = Array.isArray(data) ? data : (data && data.items) || [];
				var items = applyFilter(all, filter);

				// 필터가 전부 걸러내면 화면이 비어 원인을 알기 어렵다 → 콘솔에 남긴다
				if (all.length && !items.length && filter) {
					console.warn(
						'[listRender] data-filter="' +
							filter +
							'" 결과가 0건입니다. ' +
							'listRender.js 가 구버전이면 "key=값" 문법을 모릅니다(강력 새로고침). — ' +
							src,
					);
				}

				if (!items.length) {
					el.innerHTML = templateHtml(emptyTpl) || '';
					return;
				}

				var base = templateHtml(defaultTpl);
				var html = items
					.map(function (item, i) {
						// 항목이 자기 템플릿을 지정하면 그것을 우선 사용
						var raw = item && item._tpl ? templateHtml(item._tpl) : base;
						if (raw == null) return '';
						return fillTemplate(raw, item || {}, i);
					})
					.join('');

				el.innerHTML = html;
			})
			.catch(function (err) {
				console.error('[listRender]', err);
			});
	}

	function renderAll() {
		// 목록이 없어도(= 프리렌더된 산출물) 이벤트는 발생시킨다.
		// 목록에 의존하는 페이지 스크립트가 원본/산출물 어느 쪽에서도 동일하게 동작하도록.
		var list = document.querySelectorAll('.dynamic-list');

		Promise.all(Array.prototype.map.call(list, renderOne)).then(function () {
			document.dispatchEvent(new CustomEvent('dynamic-list-loaded'));
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		// 파셜 include 가 있으면 그 주입이 끝난 뒤에 렌더해야 한다
		if (document.querySelector('.dynamic-content')) {
			document.addEventListener('dynamic-content-loaded', renderAll);
		} else {
			renderAll();
		}
	});
})();
