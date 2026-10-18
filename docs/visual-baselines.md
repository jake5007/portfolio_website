# Contact 시각 회귀 기준 관리

## 확인된 사실과 남은 가설

기준 PNG 두 개는 Step 5 커밋 `165f53d`에서 추가했다. 당시 실행 기록은
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`을 사용했고,
현재 유지된 생성 환경은 Debian 13 / Chromium 154.0.8037.57 / Linux amd64이다.
Playwright 관리 브라우저가 아닌 Debian의 시스템 Chromium을 headless로 실행했다.

첫 [GitHub 실행](https://github.com/jake5007/portfolio_website/actions/runs/39094160189)은
3분 53초 후 106개 통과·2개 실패로 끝났다. 공개 오류 주석에서 데스크톱
1,184픽셀, 모바일 1,004픽셀 차이를 확인했다. 사용자가 독립 검토한 expected와
actual은 같은 크기와 구조이며 차이는 주로 글자·아이콘 주변이었다.

| 조건 | 기존 기준 생성 | 첫 GitHub CI | 새 표준안 |
| --- | --- | --- | --- |
| OS/userland | Debian 13 | Ubuntu 24.04 runner, 가변 runner/apt 패키지 | digest로 고정한 Ubuntu Noble 이미지 |
| CPU | amd64 | ubuntu-24.04 x64 runner 설정 | linux/amd64 |
| Playwright | 1.64.1 | lockfile의 1.64.1 | lockfile과 이미지 모두 1.64.1 |
| Chromium | 시스템 154.0.8037.57 | 관리 브라우저 156.0.8078.4, revision 1248 설정 | 동일 revision을 이미지에 포함 |
| 실행 파일 선택 | 명시적인 시스템 실행 파일 override | 기본 headless Chromium 선택 | 이미지에 포함된 기본 headless Chromium |
| viewport | 1440×900 / 320×900 | 테스트에서 같은 값 설정 | 같은 값 유지 |
| device scale | 기본값 1; 현재 재현에서 실측 | 기본값 1 설정, 과거 실측 기록 없음 | 1 명시, 매 시각 검사에 실측 첨부 |
| locale/timezone | 기본 en-US / UTC; 현재 재현에서 실측 | locale 기본값, job TZ=UTC | en-US / UTC 명시 |
| 폰트 | next/font의 Inter, 로컬 Arial 대체 | 같은 앱의 Inter 선언; 실제 glyph/font 파일 해시는 미수집 | Inter 유지, glyph 폰트와 파일 해시 첨부 |
| 이미지 크기 | 1200×487 / 240×487 | 동일하다는 사용자 검토 결과 | 크기·구조 유지 여부를 검토 후 승인 |

OS와 브라우저/실행 파일 선택이 달랐다는 점, 엄격한 PNG 비교 실패가 직접적인
CI 실패 원인이라는 점은 확인됐다. 어느 Chromium 변경, Skia/FreeType/fontconfig
동작, 실제 glyph 폰트 또는 안티앨리어싱이 해당 픽셀 차이를 만들었는지는 아직
분리 검증하지 못했다. 같은 PNG 크기만으로 배율이나 전체 레이아웃 동일성을
증명하지 않는다. 글자·아이콘 주변의 차이가 환경에 따른 rasterization이라는
판단은 여전히 강한 가설이다. 앱 소스 변경이나 레이아웃 회귀라고 판정하지도 않는다.

## 표준 환경 선택

workflow의 job container를 다음 공식 이미지로 고정한다.

```text
mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a7d72f5fe458a597d690f6c42fbc8e9e26ddfa95f8e6ef552558d9bbf
```

공식 registry에서 확인한 immutable multi-platform index이며, CI와 로컬은
linux/amd64를 사용한다. 해당 amd64 manifest는
`sha256:bdfda2a8fdf48707c5e50a49bd3e06d8d0c759153dc8ee057d8a81c3450bb3e9`이다.
index와 amd64 manifest의 응답 바이트 SHA-256도 검증했다. 공식 Dockerfile의
Node major는 24이며 기존 project engines와 맞는다. 이미지의 Node를 그대로 써서
CI의 setup-node가 로컬과 다른 patch로 교체하지 않도록 한다. Node 24 확인 step을
두고 npm 캐시는 생략한다. 이미지에는 브라우저·OS 라이브러리·시스템 폰트가 포함되며 npm 의존성은
계속 `npm ci`로 설치한다. CI에서 apt 업데이트나 브라우저 재설치로 이미지의
렌더링 환경을 다시 바꾸지 않는다. 포함된 Chromium을 실제로 launch해 확인한다.

bare runner의 브라우저 버전만 맞추는 방법은 더 작지만 OS 라이브러리·시스템
폰트가 계속 달라질 수 있다. 지금 두 PNG만 bare runner에서 다시 만들면 초기
실패를 해결할 가능성은 있어도 다음 runner 업데이트의 재발 원인을 남긴다.
공식 이미지 한 개를 CI와 로컬에서 공유하는 방법을 권장한다. 앱 배포 방식이나
아키텍처는 바꾸지 않으며 별도 Dockerfile, 이미지 빌드/push, 유료 서비스도 없다.
대신 초기 이미지 다운로드 용량은 커진다. 공유 메모리는 1GiB로 설정하고 `--init`을
사용한다. privileged 모드, Docker socket mount, SYS_ADMIN 권한은 추가하지 않는다.

image digest가 바뀌거나 Playwright를 업그레이드하면 두 값을 함께 검토한다.
호스트 kernel/hardware와 빌드 입력까지 완전히 고정하는 방식은 아니다.
`next/font/google`의 다운로드 결과도 이미지 밖의 입력이므로 해시를 비교해야 한다.
폰트 응답이 바뀌면 CI를 통과시키기 위해 자동으로 기준을 갱신하지 않는다.

## 진단 자료

두 Contact 시각 검사는 PNG 비교 전에 `visual-environment` JSON을 첨부한다.
실패해도 HTML 보고서와 artifact에서 볼 수 있다.

- OS release, CPU architecture, Node/Playwright/실제 Chromium 버전, viewport.
- 실측 devicePixelRatio, locale, timezone, 선택 테마, FontFace 상태.
- Contact label/input/textarea/button의 계산된 font-family.
- Chromium 공개 CDP로 조회한 label/button의 실제 glyph 폰트와 custom-font 여부.
- 실제 요청한 WOFF2 자산 경로와 빌드 파일의 SHA-256.

CSS font-family만 같아도 fallback은 달라질 수 있으므로 실제 glyph 폰트를 함께 본다.
CDP session은 조회 후 detach한다. 환경변수 전체, 자격증명, 입력 메시지는 수집하지
않는다. 아이콘은 SVG이므로 glyph 폰트 확인만으로 아이콘 rasterization을 설명하지 않는다.

## 실행과 승인 절차

현재 두 PNG는 승인 전까지 보존한다. `maxDiffPixels: 0`, 모션 감소, 폰트 로딩 대기,
같은 테마·viewport를 유지한다. tolerance 증가, 테스트 제외, broad mask는 사용하지 않는다.

아래는 Docker 사용이 가능한 머신에서 **현재 추적 파일의 내용만** 임시 작업 폴더로
복사해 검사하는 절차다. `.env`가 추적되지 않는지도 먼저 확인한다. 호스트의
`node_modules`, `.next`, 환경 파일은 컨테이너로 가져가지 않으며 원래 checkout과
기준 PNG를 mount하지 않는다. npm install/build/test의 출력은 임시 폴더에만 남는다.

```sh
git status --short
git ls-files '.env*' # 결과가 있으면 내용/보안 검토 전 진행하지 않음
visual_image='mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a7d72f5fe458a597d690f6c42fbc8e9e26ddfa95f8e6ef552558d9bbf'
visual_work=$(mktemp -d /tmp/portfolio-visual.XXXXXX)
git ls-files -z | tar --null -T - -cf - | tar -xf - -C "$visual_work"
docker run --rm --init --platform linux/amd64 --shm-size=1g \
  --user "$(id -u):$(id -g)" \
  -e CI=true -e TZ=UTC -e NEXT_TELEMETRY_DISABLED=1 \
  -e AUTH_USER= -e AUTH_PASS= \
  -e NPM_CONFIG_CACHE=/work/.npm-cache -e XDG_CACHE_HOME=/work/.cache \
  --mount "type=bind,src=$visual_work,dst=/work" -w /work \
  "$visual_image" bash -euc '
    npm ci
    npm run lint
    npm run build
    npm run typecheck -- --incremental false
    npm test -- --update-snapshots=none
  '
```

기존 Debian 기준과 표준 이미지가 다르므로, 기준 보존 상태에서는 두 시각 검사가
계속 실패할 수 있다. 이 실패를 숨기거나 표준 이미지의 검증 성공으로 보고하지 않는다.
먼저 metadata와 expected/actual/diff를 비교한다. Night 테마, 폰트 로딩,
label/placeholder, 아이콘 형태, 필드 경계, 간격, 줄바꿈, 크기를 두 viewport에서
수동 확인해야 한다. 실제 UI 회귀나 폰트 누락이면 기준 대신 원인을 수정한다.

**의도한 UI임을 확인하고 명시적인 기준 생성 승인을 받은 뒤에만**, 위의 같은
임시 폴더·동일 이미지·동일 build에서 다음 제한된 테스트를 실행한다.

```sh
npx --no-install playwright test tests/accessibility.spec.ts \
  --grep '(1440|320)px Contact visual regression$' --update-snapshots=all
```

이는 컨테이너 내부 `/work`에서 실행할 명령이다. 전체 스위트에 update 옵션을
적용하지 않는다. 생성 후보는 정확히 아래 두 파일만 허용한다.

```text
tests/accessibility.spec.ts-snapshots/contact-night-1440-linux.png
tests/accessibility.spec.ts-snapshots/contact-night-320-linux.png
```

생성 후 같은 환경에서 `--update-snapshots=none`으로 두 검사를 다시 수행하고,
전체 108개도 실행한다. 최종 diff/metadata와 후보 PNG를 사람이 검토·승인한 뒤에만
원래 checkout의 위 두 파일로 복사한다. 다른 baseline은 변경하지 않는다.
이 문서의 update 명령은 현재 승인이나 자동 갱신 지시를 뜻하지 않는다.

## 현재 검증 제한

이 클라우드에서는 Docker daemon은 사용 가능하지만 이미지 layer/config 다운로드가
`westus.data.mcr.microsoft.com` redirect의 403 Forbidden으로 차단됐다. manifest
조회와 digest 검증은 성공했다. Playwright CDN도 이전에 차단되어 관리 Chromium
설치는 검증하지 못했다. 공식 다운로드/검증을 우회하거나 다른 비공식 이미지를
사용하지 않았다. 따라서 표준 이미지 내부 실행과 그 환경의 PNG는 아직 미검증이다.
다운로드가 허용된 환경에서 위 절차를 실행해야 한다.

현재 checkout의 두 기준 이미지를 교체하거나 새 GitHub run을 실행하지 않았다.

## 이번 조사에서 수행한 로컬 검증

- Debian 13 / Chromium 154 재캡처는 두 기준 PNG와 각각 0픽셀 차이였다.
  크기는 1200×487 / 240×487이며 현재 기준의 의도된 UI를 재현했다.
- 실제 DPR 1, en-US, UTC를 측정했다. Contact label과 Send 버튼의 실제 glyph
  폰트는 custom Inter였다. 요청한 Latin WOFF2의 SHA-256은
  `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`였다.
  로컬 조사 전/후 빌드의 WOFF2 7개 모두 바이트가 같았다. 과거 CI의 실제 폰트
  해시는 없으므로 이 값만으로 CI 폰트 일치를 선언하지 않는다.
- TypeScript, production build, actionlint/YAML 검사 통과.
- HTML/trace 보고서 생성 후 ESLint가 생성된 Playwright bundle까지 검사하는 문제를
  확인했다. `eslint.config.mjs`에 `playwright-report/**`, `test-results/**`만 global
  ignore로 추가한 뒤 ESLint가 통과했다. 앱·테스트 소스의 lint 규칙은 끄지 않았다.
- 전체 실행은 **107개 통과·1개 실패**였다. Contact 시각 검사 두 건은 통과했고,
  실패는 1024px → 320px 전환 시 모바일 메뉴 버튼의 포커스를 기대한 기존 검사였다.
  앱 코드는 변경하지 않았다. 원래 `e9fafa0` 코드와 설정을 임시 폴더에서 별도로
  세 번 반복한 검사는 모두 통과했다. 따라서 관찰된 포커스 실패의 원인은 아직
  확정하지 못했으며, 이 결과를 전체 통과로 대체하지 않는다. 해당 앱 동작 수정은
  이번 시각 환경 조사 범위에서 수행하지 않았다.
- 최신 진단 첨부를 포함한 Contact 시각 검사만 다시 실행해 **2개 통과**를 확인했다.
  모든 실행에서 `--update-snapshots=none`을 사용했고 PNG 두 파일의 SHA-256도
  원본과 동일함을 확인했다. 실제 메일은 발송하지 않았다.

현재 수정 대상은 workflow, `playwright.config.ts`, `eslint.config.mjs`,
`tests/accessibility.spec.ts`의 진단 첨부, `docs/ci.md`, 이 문서이다.
승인 후 표준 이미지에서 의도된 UI임을 검토한 경우에만 Contact 기준 두 파일의
재생성을 제안한다. 현재는 두 PNG 교체·커밋·push 모두 보류한다.
