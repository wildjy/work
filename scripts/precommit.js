#!/usr/bin/env node
/**
 * precommit.js — 커밋 직전 검사 (simple-git-hooks 의 pre-commit 이 lint-staged 다음에 부른다)
 *
 *   1) 프리렌더 동기화 — 원본(public/html · public/data)이 커밋에 들어 있으면 프리렌더를 돌려
 *      산출물(public/prerender)이 원본과 맞는지 본다.
 *        · 원본이 전부 스테이징돼 있으면 → 바뀐 산출물을 **자동으로 커밋에 넣는다**
 *        · 스테이징 안 된 원본 변경이 있으면 → **커밋을 막는다**
 *          (산출물은 작업 폴더 원본으로 만들어지므로, 커밋에 안 들어가는 변경까지 산출물에 섞인다)
 *      원본이 사라졌는데 남은 산출물도 막는다.
 *   2) 마크업 검증 — 커밋에 들어가는 산출물을 html-validate 로 검사한다(설정 : .htmlvalidate.json).
 *      error 는 커밋을 막고 warning 은 보여주기만 한다.
 *
 * 건너뛰기(급할 때만) : git commit --no-verify
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = /^public\/(html|data)\//;
const OUT_DIR = 'public/prerender';

const git = (args) => execSync('git ' + args, { cwd: ROOT, encoding: 'utf8' });
const lines = (s) => s.split(/\r?\n/).filter(Boolean);

function fail(title, list, hint) {
	console.error('\n  ✗ ' + title);
	list.forEach((f) => console.error('      ' + f));
	console.error('\n    ' + hint.join('\n    ') + '\n');
	process.exit(1);
}

const staged = lines(git('diff --cached --name-only --diff-filter=ACMRD'));
const stagedSrc = staged.filter((f) => SRC.test(f) || f === 'scripts/prerender.js');

/* ── 1) 프리렌더 동기화 ─────────────────────────────── */

if (stagedSrc.length) {
	// 스테이징 안 된 원본 변경(수정 · 새 파일)
	const unstagedSrc = lines(git('status --porcelain --untracked-files=all -- public/html public/data'))
		.filter((l) => l[1] !== ' ' || l.startsWith('??'))
		.map((l) => l.slice(3));

	if (unstagedSrc.length) {
		fail('커밋에 넣지 않은 원본 변경이 있어 산출물을 맞출 수 없습니다.', unstagedSrc, [
			'프리렌더는 작업 폴더의 원본으로 만들어져, 커밋에 안 들어가는 변경까지 산출물에 섞입니다.',
			'→ 함께 커밋하려면 git add, 아니면 git stash --keep-index 로 잠시 치운 뒤 다시 커밋하세요.',
		]);
	}

	const r = spawnSync(process.execPath, ['scripts/prerender.js'], { cwd: ROOT, encoding: 'utf8' });
	if (r.status !== 0) {
		process.stderr.write(r.stdout + r.stderr);
		fail('프리렌더가 실패했습니다.', [], ['위 출력을 확인하세요.']);
	}
	// ⚠ prerender.js 의 경고(! 파셜 없음 · ! 데이터 없음 · ! 템플릿 없음 · ! 받지 않는 값 · ! 필수 값 빠짐)는 console.warn — stderr 로 나온다
	const warns = lines(r.stdout + '\n' + r.stderr).filter((l) => l.trim().startsWith('!'));
	if (warns.length) {
		fail('프리렌더 경고가 있습니다(파셜·데이터·템플릿 경로 · 파셜 받는 값).', warns, [
			'경로 · data-* 이름을 고친 뒤 다시 커밋하세요.',
			'일부러 안 넘기는 자리는 파셜에 적는다 : <!-- ⚠ 받는 값 검사 제외 : 키 — 이유 -->',
		]);
	}

	// 원본이 사라졌는데 남은 산출물
	// ⚠ **하위 폴더까지 훑는다.** 페이지를 기능별 폴더에 두므로 평면 readdirSync 로는
	//    public/html 최상위에 .html 이 하나도 없어 검사가 조용히 통과해 버린다.
	//    (prerender.js 의 sweepOrphans 가 이미 지우지만, 여기서도 한 번 더 막는다)
	const SKIP_DIRS = new Set(['include', '_bak']);
	const walkHtml = (dir, base, out) => {
		if (!fs.existsSync(dir)) return out;
		for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
			const key = base ? base + '/' + e.name : e.name;
			if (e.isDirectory()) {
				if (!SKIP_DIRS.has(e.name)) walkHtml(path.join(dir, e.name), key, out);
				continue;
			}
			if (e.name.endsWith('.html')) out.push(key);
		}
		return out;
	};
	const srcPages = new Set(walkHtml(path.join(ROOT, 'public/html'), '', []));
	const orphans = walkHtml(path.join(ROOT, OUT_DIR), '', [])
		.filter((f) => !srcPages.has(f))
		.map((f) => OUT_DIR + '/' + f);
	if (orphans.length) {
		fail('원본이 없는 산출물이 남아 있습니다.', orphans, ['→ git rm 으로 지운 뒤 다시 커밋하세요.']);
	}

	const changedOut = lines(git('status --porcelain --untracked-files=all -- ' + OUT_DIR))
		.filter((l) => l[1] !== ' ' || l.startsWith('??'))
		.map((l) => l.slice(3));
	if (changedOut.length) {
		git('add -- ' + OUT_DIR);
		console.log('  ✓ 산출물을 원본에 맞춰 커밋에 함께 넣었습니다 (' + changedOut.length + '개)');
		changedOut.forEach((f) => console.log('      ' + f));
	}
}

/* ── 2) 마크업 검증 ─────────────────────────────────── */

const outFiles = lines(git('diff --cached --name-only --diff-filter=ACMR -- ' + OUT_DIR)).filter((f) =>
	f.endsWith('.html'),
);

if (outFiles.length) {
	const bin = path.join(ROOT, 'node_modules', 'html-validate', 'bin', 'html-validate.mjs');
	const v = spawnSync(process.execPath, [bin, ...outFiles], { cwd: ROOT, stdio: 'inherit' });
	if (v.status !== 0) {
		fail(
			'산출물 마크업에 오류가 있습니다(위 목록).',
			[],
			[
				'원본(public/html · include)을 고친 뒤 다시 커밋하세요 — 산출물을 직접 고치지 않습니다.',
				'규칙 조정은 .htmlvalidate.json',
			],
		);
	}
}
