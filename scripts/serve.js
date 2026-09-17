#!/usr/bin/env node
/**
 * serve.js — 로컬 서버를 **고정 포트**로 띄운다.
 *
 *   npm run serve                 # http://localhost:3500
 *
 * ⚠ serve 의 `--no-port-switching` 은 믿지 않는다.
 *    14.2.6 은 도움말에만 있고 코드가 읽지 않는다 — 포트가 쓰이고 있으면 **조용히 빈 포트(49xxx)로 뜬다.**
 *    그래서 여기서 먼저 포트를 잡아 보고, 이미 쓰이고 있으면 띄우지 않고 실패한다.
 *
 * 포트를 바꾸려면 아래 PORT 한 줄을 고친다(README · pub-env 스킬의 주소도 함께).
 * serve 는 버전을 고정해 받는다 — 최신판이 cleanUrls 등 동작을 바꿔도 환경이 흔들리지 않는다.
 */
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3500;
const SERVE = 'serve@14.2.6';
const ROOT = path.resolve(__dirname, '..');

function portFree(port) {
	return new Promise((resolve) => {
		const probe = net.createServer();
		probe.once('error', () => resolve(false));
		probe.once('listening', () => probe.close(() => resolve(true)));
		// serve 는 모든 인터페이스(::)에 붙으므로 같은 조건으로 확인한다
		probe.listen(port);
	});
}

(async () => {
	if (!(await portFree(PORT))) {
		console.error('\n  ✗ 포트 ' + PORT + ' 이(가) 이미 사용 중입니다. 다른 포트로 띄우지 않습니다.');
		console.error('    이미 떠 있는 서버라면 그대로 쓰세요 → http://localhost:' + PORT);
		console.error('    끄려면 : netstat -ano | findstr :' + PORT + '   →   taskkill /PID <pid> /F\n');
		process.exit(1);
	}

	const child = spawn('npx', ['--yes', SERVE, 'public', '-l', String(PORT)], {
		cwd: ROOT,
		stdio: 'inherit',
		shell: process.platform === 'win32', // Windows 에서 npx.cmd 를 찾기 위해
	});
	child.on('exit', (code) => process.exit(code == null ? 1 : code));
})();
