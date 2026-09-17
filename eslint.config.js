/**
 * ESLint 9 (flat config)
 *
 *   npm run lint        # 검사
 *   npm run lint:fix    # 자동 수정 가능한 것만 고친다
 *
 * ⚠ 코드 모양(들여쓰기·따옴표·줄바꿈)은 Prettier 담당이다. 여기에는 「버그가 될 것」만 둔다.
 *
 * 대상
 *  - public/js/**           브라우저 · 일반 script (모듈 아님 — 최상위 함수가 곧 전역)
 *  - public/html/**         HTML 안 인라인 script (eslint-plugin-html)
 *  - scripts/**, 설정 파일   Node (CommonJS)
 */
const js = require('@eslint/js');
const globals = require('globals');
const html = require('eslint-plugin-html');

/* common.js 의 공개 함수 — HTML 인라인 script 가 부를 때 no-undef 로 잡히지 않게 한다.
   ⚠ common.js 에 함수를 추가·삭제하면 여기도 맞춘다.
   ⚠ public/js 에는 넣지 않는다 — 자기 파일에서 선언하는 이름이라 no-redeclare(builtinGlobals)에 걸린다. */
const COMMON_FUNCTIONS = Object.fromEntries(
	[
		'modalOpen',
		'modalClose',
		'toggleLayer',
		'toggleMenu',
		'closeOpenLayers',
		'dropdownSelect',
		'tabActivate',
		'accordionToggle',
		'toggleClass',
		'toastShow',
		'toastHide',
		'stepperChange',
		'clearInput',
		'checkGroupSyncAll',
		'lnbActive',
		'datePickerInit',
	].map((name) => [name, 'readonly']),
);

const BROWSER = {
	...globals.browser,
	$: 'readonly',
	jQuery: 'readonly',
};

module.exports = [
	{
		// 외부 라이브러리(*.min.js)는 전역에서 뺀다 — 설정 묶음 안의 ignores 는 그 묶음에만 걸려 recommended 가 그대로 검사한다
		ignores: ['node_modules/**', 'public/prerender/**', '**/*.min.js'],
	},

	js.configs.recommended,

	// 전체 공통 규칙
	{
		rules: {
			// == null 로 null·undefined 를 함께 거르는 관용구는 허용한다
			eqeqeq: ['error', 'smart'],
			'no-var': 'off',
			'no-empty': ['error', { allowEmptyCatch: true }],
		},
	},

	// 브라우저 JS — 모듈이 아니라 최상위 선언이 전역으로 공유된다
	{
		files: ['public/js/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: BROWSER,
		},
		rules: {
			// 최상위 함수는 HTML 의 onclick 이 부르므로 「안 쓰인다」로 보지 않는다
			'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
		},
	},

	// HTML 인라인 script
	{
		files: ['public/**/*.html'],
		plugins: { html },
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: { ...BROWSER, ...COMMON_FUNCTIONS },
		},
		rules: {
			// 페이지 script 의 최상위 함수도 onclick 이 부른다
			'no-unused-vars': ['warn', { vars: 'local', args: 'none' }],
		},
	},

	// Node — 빌드·서버 스크립트와 설정 파일
	{
		files: ['scripts/**/*.js', '*.config.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: globals.node,
		},
		rules: {
			'no-unused-vars': ['warn', { args: 'none' }],
		},
	},
];
