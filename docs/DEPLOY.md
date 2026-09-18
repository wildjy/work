# GitHub Pages 배포

작업 목록(`public/index.html`)과 산출물을 **주소로 열어 볼 수 있게** 올리는 방법.
검수자·개발자에게 링크 하나만 주면 되고, 저장소를 내려받지 않아도 화면을 본다.

> 🌐 **주소** : https://wildjy.github.io/work/
> 저장소 : https://github.com/wildjy/work · 배포 브랜치 : `main`

---

## 0. 한 장 요약

| | |
| --- | --- |
| 방식 | **GitHub Actions** — `public/` 을 통째로 올려 **사이트 루트**로 삼는다 |
| 워크플로 | `.github/workflows/pages.yml` |
| 저장소 설정 | `Settings` › `Pages` › **Build and deployment › Source = `GitHub Actions`** |
| 배포 시점 | `main` 에 푸시할 때. `Actions` 탭에서 수동 실행(`workflow_dispatch`)도 된다 |
| 줄바꿈 | `.gitattributes` 가 `public/**` 을 **CRLF 로 체크아웃**시킨다 (§3-③ 참고 — 없으면 CI 가 실패한다) |

---

## 1. 왜 Actions 방식인가

「브랜치에서 배포」(Deploy from a branch)는 **저장소 루트 아니면 `/docs`** 만 고를 수 있다.
이 저장소는 사이트가 `public/` 에 있고 `docs/` 는 마크다운 문서라 **둘 다 맞지 않는다.**

Actions 방식은 올릴 폴더를 한 줄로 정한다 — 폴더를 옮기거나 `gh-pages` 브랜치를 따로 둘 필요가 없다.

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./public # ← 이 한 줄이 public/ 을 사이트 루트로 만든다
```

덤으로 **Jekyll 을 거치지 않는다.** 브랜치 방식은 Jekyll 이 돌면서 `_` 로 시작하는 파일을 전부 빼 버리는데,
이 저장소는 파셜이 전부 `_*.html` 이라 치명적이다(§3-②).

---

## 2. 설정 순서

1. **워크플로 파일**을 둔다 — `.github/workflows/pages.yml` (이미 있다)
2. **저장소 설정** — `Settings` › `Pages` › `Build and deployment` › `Source` 를 **`GitHub Actions`** 로
   ⚠ `Deploy from a branch` 가 아니다. **이 설정만 바꾸고 워크플로가 없으면 아무 일도 일어나지 않는다**(§3-①)
3. `main` 에 **푸시**한다 → `Actions` 탭에서 배포가 돌고, 끝나면 `Settings` › `Pages` 상단에 주소가 뜬다

### 워크플로가 하는 일

| 스텝 | 왜 |
| --- | --- |
| `npm ci` → `npm run prerender` | 러너에서 산출물을 새로 만든다 |
| `git diff --exit-code --ignore-cr-at-eol public/prerender` | **원본만 고치고 프리렌더 없이 푸시**한 것을 잡는다(커밋 훅과 같은 검사) |
| `npm run validate` | 마크업 오류 |
| `upload-pages-artifact` → `deploy-pages` | `public/` 을 올려 배포 |

> 아티팩트는 `npm run prerender` **뒤의** `public/` 이므로, 검사 4줄을 지워도 **배포되는 화면은 항상 최신**이다.
> 그 검사는 「저장소에 커밋된 산출물」이 최신인지 보는 보조 장치다.

---

## 3. 겪은 실패와 원인

### ① Source 만 바꾸고 워크플로가 없었다 — 주소에 `public/` 이 남았다

**증상** — `Settings` › `Pages` › `Source` 를 `GitHub Actions` 로 바꿨는데
`https://wildjy.github.io/work/prerender/Sample.html` 이 **404**, `/work/public/prerender/Sample.html` 은 200.
`/work/` 는 작업 목록이 아니라 **README 를 테마로 그린 페이지**였다.

**원인** — Source 를 바꿔도 **워크플로가 없으면 아무것도 배포되지 않는다.**
이전에 「브랜치에서 배포 + 저장소 루트」로 올라간 **Jekyll 빌드가 그대로 살아 서빙**되고 있었다.
사이트 루트가 저장소 루트이므로 경로에 `public/` 이 남는다.

**확인법** — 응답 헤더·HTML 에 `Jekyll v3.10.0` · `Jekyll SEO tag` 가 보이면 옛 브랜치 빌드다.

```sh
curl -s https://wildjy.github.io/work/ | head -20        # Jekyll 흔적이 있나
curl -s -o /dev/null -w "%{http_code}\n" <주소>          # 경로별 응답
```

### ② Jekyll 이 `_` 로 시작하는 파셜을 내보내지 않는다

**증상** — 산출물(`prerender/`)은 멀쩡한데 **원본 페이지**(`/html/Sample.html`)를 열면
LNB·헤더·구역이 전부 비어 있었다. `_ui_modal.html` · `_sample_list.html` 이 모두 **404**.

**원인** — Jekyll 은 `_` 로 시작하는 파일을 빌드 결과에 넣지 않는다. 이 저장소의 파셜은 전부 `_*.html` 이다.
산출물은 파셜이 이미 펼쳐져 있어 `fetch` 를 하지 않으므로 영향이 없었다.

**해결** — Actions 방식은 Jekyll 을 거치지 않아 저절로 풀린다.
브랜치 방식을 유지해야 한다면 **저장소 루트에 빈 파일 `.nojekyll`** 이 필요하다.

### ③ CI 의 프리렌더 최신성 검사가 항상 실패했다 — 줄바꿈

**증상** — `deploy` 잡이 `Process completed with exit code 1` 로 실패.

**원인** — 줄바꿈이 어긋난다.

| | 줄바꿈 |
| --- | --- |
| 저장소에 저장된 형태 | **LF** (`core.autocrlf=true` 라 커밋할 때 변환된다) |
| Windows 작업 트리 | CRLF |
| **우분투 러너 체크아웃** | **LF** ← 여기가 어긋난다 |
| `prerender.js` 가 쓰는 형태 | **CRLF** (`reindent` · `fillSlots` 등에 박혀 있다) |

러너는 LF 원본을 읽어 **CRLF 가 섞인 산출물**을 만든다 → 커밋된 LF 산출물과 **모든 줄이 달라 보인다** →
`git diff --exit-code` 가 exit 1. 「산출물이 오래됐다」가 아니라 **줄바꿈만 다른 것**이었다.

**해결** — `.gitattributes` 로 리눅스에서도 CRLF 로 체크아웃시킨다.

```gitattributes
* text=auto
public/** text eol=crlf   # 리눅스 러너에서도 CRLF
*.woff2 binary            # 폰트는 변환하지 않는다
```

안전망으로 검사에 `--ignore-cr-at-eol` 도 붙였다. 확인은 `git check-attr text eol -- <파일>`.

### ④ Node 20 지원 종료 경고

`actions/checkout@v4` · `actions/setup-node@v4` 가 Node 20 을 쓴다는 **경고**(실패 원인 아님).
둘 다 **`@v5`** 로 올렸다.

---

## 4. 주소

`public/` 이 사이트 루트다 — `public/` 아래 경로를 그대로 붙인다.

| 화면 | 주소 |
| --- | --- |
| 작업 목록 (첫 화면) | `https://wildjy.github.io/work/` |
| 공통 UI 샘플 | `https://wildjy.github.io/work/prerender/Sample.html` |
| 파셜(include) 사용법 | `https://wildjy.github.io/work/prerender/Guide_Partial.html` |
| 폴더 구조 | `https://wildjy.github.io/work/prerender/Guide_Structure.html` |

> ⚠ **로컬과 다른 점** — `npm run serve` 는 확장자를 떼도 열리지만(`/prerender/Sample` → 301),
> **GitHub Pages 는 `.html` 을 붙여야 한다.** `index.html` 의 링크는 전부 확장자가 붙어 있어
> 목록에서 눌러 들어가는 경로는 그대로 동작한다.

---

## 5. 함정

| 함정 | 무슨 일이 나나 | 어떻게 |
| --- | --- | --- |
| **비공개 저장소** | Pages 에 유료 플랜(Pro/Team 이상)이 필요하다 | 공개로 두거나 플랜을 올린다 |
| **대소문자** | 리눅스는 구분한다 — `sample.html` 로 적으면 404 | 파일명 그대로 적는다(`Sample.html`) |
| **`public/css/common.css` 미커밋** | Pages 는 Sass 를 컴파일하지 않아 **스타일이 통째로 빠진다** | Watch Sass 산출물을 **커밋한다**(`.gitignore` 대상 아님) |
| **`public/prerender/` 미커밋** | 작업 목록의 링크가 전부 404 | 원본과 **함께 커밋**한다 |
| **절대경로(`/…`)** | 사이트가 `/work/` 하위라 전부 깨진다 | `./` · `../` 만 쓴다 |
| **워크플로 트리거 브랜치** | `yu` 에서 작업하면 배포가 안 돈다 | `branches: [main]` 을 고치거나 `main` 에 머지한다 |

---

## 6. 배포가 이상할 때 확인 순서

```sh
# 1. 저장소에 워크플로가 있나
git ls-tree -r --name-only origin/main | grep .github

# 2. 경로별 응답 — 200 인 경로가 어디까지인지 본다
curl -s -o /dev/null -w "%{http_code}\n" https://wildjy.github.io/work/prerender/Sample.html

# 3. 옛 Jekyll 빌드가 살아 있나
curl -s https://wildjy.github.io/work/ | grep -i jekyll

# 4. CI 가드가 로컬에서는 통과하나
npm run prerender && git diff --exit-code --ignore-cr-at-eol public/prerender && npm run validate
```

그래도 같은 스텝에서 막히면 워크플로의 **검사 4줄(`setup-node` ~ `validate`)을 통째로 빼면** 된다.
배포되는 화면은 그대로 최신이다.
