document.addEventListener('DOMContentLoaded', () => {
	const loadedScripts = new Set();

	// DOMContentLoaded 시점의 페이지 스크립트는 이미 실행됐다.
	// 파셜을 삽입할 때 다시 실행하면 GSAP 초기화와 이벤트가 중복 등록된다.
	document.querySelectorAll('script').forEach((script) => {
		script.dataset.dynDone = '1';
		if (script.src) loadedScripts.add(script.src);
	});

	// 💡 스크립트 실행 함수
	const executeScripts = (container) => {
		const scripts = container.querySelectorAll('script');
		scripts.forEach((oldScript) => {
			// 이미 처리한 스크립트는 건너뜀
			// (executeScripts(document) 가 include 교체마다 전체 문서를 재스캔하므로,
			//  메인 문서의 Live Server 주입 스크립트(WebSocket) 등이 반복 실행되어 소켓이 폭주하는 것을 방지)
			if (oldScript.dataset.dynDone) return;

			const newScript = document.createElement('script');
			newScript.dataset.dynDone = '1';

			if (oldScript.src) {
				if (loadedScripts.has(oldScript.src)) {
					oldScript.remove();
					return;
				}
				newScript.src = oldScript.src;
				loadedScripts.add(oldScript.src);
			} else {
				// inline script (별점형 같은 경우)
				newScript.textContent = oldScript.textContent;
			}

			document.body.appendChild(newScript);
			oldScript.remove();
		});
	};

	// 💡 재귀적으로 dynamic-content 불러오기
	const loadDynamicContent = async (context = document) => {
		const dynamicElements = context.querySelectorAll('.dynamic-content');

		for (const el of dynamicElements) {
			const src = el.getAttribute('data-source');
			if (!src) continue;

			try {
				const res = await fetch(src);
				if (!res.ok) throw new Error(`Failed to fetch ${src}`);
				const raw = await res.text();
				// Live Server가 조각(fragment)의 </svg> 앞에 주입하는 라이브리로드 스크립트 제거
				// (조각엔 </body>/</head>가 없어 </svg>가 주입 앵커가 됨 → SVG 내부에 <script>가 끼어
				//  SVG·후속 마크업 렌더링이 깨지고, WebSocket 스크립트가 반복 실행되는 문제 방지)
				const html = raw.replace(/<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>\s*/gi, '');

				// 파셜에 값 넘기기 : data-source 외의 data-* 를 파셜 안 {{key}} 에 채운다.
				//   <div class="dynamic-content" data-source="…" data-explain="10MB">
				//   ⚠ 넘기지 않은 키는 그대로 둔다(파셜 안 목록 template 의 {{…}} 보호).
				//   ⚠ prerender.js 의 partialVars/fillVars 와 같은 규칙이다 — 한쪽만 고치지 않는다.
				//   ⚠ {{key}} 는 이스케이프, {{{key}}} 는 원문 그대로 — prerender 와 같아야 한다.
				const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
				const esc = (v) => String(v).replace(/[&<>"']/g, (c) => escMap[c]);
				const vars = Object.assign({}, el.dataset);
				delete vars.source;
				//   ⚠ {{key|기본값}} 은 넘기지 않으면 기본값으로 채운다(기본값은 이스케이프하지 않는다).
				//      그래서 vars 가 비어도 치환을 돌린다 — 기본값 없는 {{key}} 는 그대로 남는다.
				const RAW_RE = /\{\{\{\s*([\w@.-]+)\s*(?:\|([^}]*?))?\s*\}\}\}/g;
				const ESC_RE = /\{\{\s*([\w@.-]+)\s*(?:\|([^}]*?))?\s*\}\}/g;
				const filled = html
					.replace(RAW_RE, (m, k, d) => (k in vars ? String(vars[k]) : d !== undefined ? d : m))
					.replace(ESC_RE, (m, k, d) => (k in vars ? esc(vars[k]) : d !== undefined ? d : m));

				const temp = document.createElement('div');
				temp.innerHTML = filled;

				// 내부에 또 dynamic-content가 있다면 재귀로 먼저 처리
				await loadDynamicContent(temp);
				const fragment = document.createDocumentFragment();

				while (temp.firstChild) {
					fragment.appendChild(temp.firstChild);
				}

				// 💡 element를 교체
				el.replaceWith(fragment);

				// 💡 교체된 뒤에 실행해야 함!
				executeScripts(document);
			} catch (err) {
				console.error(err);
			}
		}
	};

	// 최상위 주입이 모두 끝난 뒤 완료 이벤트 발생
	// (fetch 비동기 주입이라 DOMContentLoaded 시점엔 아직 DOM에 없음 → 이 이벤트 이후 접근해야 함)
	loadDynamicContent().then(() => {
		document.dispatchEvent(new CustomEvent('dynamic-content-loaded'));
	});
});
