# Contact 시각 회귀 기준 관리

## 승인된 기준과 출처

사용자는 [후보 생성 run 39253480264](https://github.com/jake5007/portfolio_website/actions/runs/39253480264)의
두 PNG를 내려받아 시각 검토하고 다음 SHA-256을 승인했다.

| 저장 파일 | 크기 | 승인된 SHA-256 |
| --- | --- | --- |
| `tests/accessibility.spec.ts-snapshots/contact-night-1440-linux.png` | 1200×487 | `25395657f403bf596ed6137001e5c4582674a27aabbee9dd2f483b5fe4d24d81` |
| `tests/accessibility.spec.ts-snapshots/contact-night-320-linux.png` | 240×487 | `9759a515986bb910c039e77ccdb0f4908f1f323b32934d0ea7ace06a1f18d279` |

[승인 artifact](https://github.com/jake5007/portfolio_website/actions/runs/39253480264/artifacts/12187155544):
`contact-baseline-review-39253480264`. 후보는 archive 안의
`baseline-review/candidates/`에 있다. 같은 이름의 `before/`나 `diff/` 파일과 혼동하지 않는다.

승인된 저장소/생성 workflow 커밋은 `47a0f5acd7acc898af006fcd98f51c35d4e598d2`다.
생성 job의 앱 checkout은 `cf99a83ae8f76ae1541fde1e3195f097556461a5`였다.
그 사이 변경은 후보 생성 workflow와 문서였으며 앱·테스트·의존성은 같았다.

**반영 상태:** GitHub 다운로드 제한 때문에 사용자가 승인 artifact ZIP을 직접 첨부했다.
`baseline-review/candidates/`의 정확히 두 PNG만 읽고 두 SHA-256을 모두 검증한 뒤
원래 경로에 바이트 그대로 반영했다. 다른 archive 파일은 추출·반영하지 않았다.
로컬 Debian/Chromium 154로 이미지를 재생성하지 않았다. 반영 커밋의 일반 CI 결과는
별도 실행 기록에서 확인하며, 로컬 정적 검사 통과를 GitHub CI 통과로 대체하지 않는다.

후보 생성 run은 생성 2개, 엄격 Contact 비교 2개, 전체 109개를 모두 통과했고
fail/skip/flaky는 0이었다. 원본 PNG 보존 audit와 생성/재검증/전체 실행 간의 폰트
일치 검사도 통과했다. 일회성 실행 workflow와 중복 템플릿은 정리하고 기존
`.github/workflows/ci.yml`은 그대로 유지한다. 이 문서가 이후 유지보수 절차다.

## 표준 렌더링 환경

일반 CI와 기준 생성은 다음 공식 이미지를 공유한다.

```text
mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a7d72f5fe458a597d690f6c42fbc8e9e26ddfa95f8e6ef552558d9bbf
```

- 플랫폼: linux/amd64, Ubuntu 24.04.5 LTS Noble.
- 이미지의 Node v24.21.0, Playwright 1.64.1, Chromium 156.0.8078.4 / revision 1248.
- 이미지 Node를 유지한다. setup-node, apt 업데이트, browser 재설치, 시스템 Chromium
  executable override로 렌더링 환경을 바꾸지 않는다.
- viewport: 1440×900 / 320×900, deviceScaleFactor 1, en-US, UTC.
- Night 테마, reduced motion, `document.fonts.ready`, 기존 screenshot animation 비활성화.
- 실제 glyph 폰트: custom Inter-Regular. 승인 실행의 Latin WOFF2 SHA-256:
  `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`.

Docker digest는 OS 라이브러리와 시스템 폰트를 고정한다. `next/font/google` 다운로드는
별도 입력이므로 실제 glyph 폰트와 WOFF2 해시도 비교한다. CSS font-family 이름이나
PNG 크기가 같다는 이유만으로 렌더링 일치를 판단하지 않는다.

## 이후 후보 생성 절차

일반 CI는 `--update-snapshots` 없이 엄격 비교만 실행한다. 기준 생성은 UI 변경 또는
검증된 환경 변경에 대한 별도 승인 후, 동일 이미지의 격리된 작업 공간에서만 수행한다.
로컬 Debian 13 / Chromium 154에서 새 기준을 생성하지 않는다.

1. 대상 소스 SHA와 현재 image digest, Playwright lockfile 버전을 기록한다.
2. 추적 파일만 별도 임시 폴더로 복사한다. 기존 checkout, `.env`, node_modules,
   `.next`, 프로덕션 SMTP 자격증명은 가져가지 않는다.
3. 기존 두 PNG를 `before/`에 보존한다. Playwright의 public `snapshotPathTemplate`로
   후보 디렉터리를 분리하여 원본 기준을 덮어쓰지 않는다.
4. 같은 build에서 후보 생성 → 후보를 기준으로 Contact 엄격 비교 → 전체 suite를
   실행한다. 타입·lint·빌드와 모든 접근성 검사를 유지한다.
5. 원본/후보/diff, 크기·SHA-256, font/browser 진단, JSON/HTML 보고서를 별도 보관한다.
6. 원본 보존과 변경 파일 범위를 확인하고 사람이 검토한 정확히 두 PNG만 승인 후 반영한다.

컨테이너 내부에서 `npm ci`, `npm run lint`, `npm run build`,
`npm run typecheck -- --incremental false`를 먼저 실행한다. SMTP 환경값은 비운다.
`AUTH_USER=`, `AUTH_PASS=`, `CI=true`, `TZ=UTC`를 사용한다.

격리된 작업 공간에 다음 `baseline-review/candidate.config.ts`를 만들 수 있다.
파일 자체는 저장소에 추가하지 않는다.

```ts
import base from '../playwright.config';
import { resolve } from 'node:path';
const root = process.cwd();
export default {
  ...base,
  testDir: resolve(root, 'tests'),
  snapshotPathTemplate: resolve(root, 'baseline-review/candidates/{arg}-{platform}{ext}'),
  reporter: [
    ['line'], ['github'],
    ['html', { open: 'never', outputFolder: resolve(root, 'playwright-report') }],
    ['json', { outputFile: resolve(root, 'test-results/results.json') }],
  ],
  webServer: { ...base.webServer, cwd: root },
};
```

정확한 생성·검증 명령:

```sh
# 생성: Contact 두 검사만, 후보 경로로 제한
npx --no-install playwright test --config baseline-review/candidate.config.ts \
  tests/accessibility.spec.ts --grep '(1440|320)px Contact visual regression$' \
  --update-snapshots=all --output=test-results/generation

# 후보 재검증: 기존 maxDiffPixels: 0 유지
npx --no-install playwright test --config baseline-review/candidate.config.ts \
  tests/accessibility.spec.ts --grep '(1440|320)px Contact visual regression$' \
  --update-snapshots=none --output=test-results/contact-verification

# 전체 suite: 기준을 갱신하지 않음
npm test -- --config baseline-review/candidate.config.ts \
  --update-snapshots=none --output=test-results/full-verification
```

다음 phase가 JSON/HTML 보고서를 덮어쓰기 전에 phase별로 복사해 보관한다.
현재 suite는 109개다. 생성/Contact 재검증은 각각 2개, 전체는 109개가 통과하고
fail/skip/flaky는 0이어야 한다. 단순히 프로세스 exit 0만 확인하지 않는다.

컨테이너가 checkout 경로의 소유권을 거부하면, Git 명령 전에 해당 job에서만
`git config --global --add safe.directory "$GITHUB_WORKSPACE"`로 정확한 checkout
경로 하나를 등록한다. wildcard 신뢰나 자격증명 변경은 사용하지 않는다.

원격 생성이 다시 필요하면 별도로 승인한 임시 workflow를 기능 브랜치에서 사용한다.
저장소·브랜치·이벤트·소스 SHA와 최초 실행 조건을 제한하고 `contents: read`,
`persist-credentials: false`를 유지한다. artifact만 업로드하고 자동 PNG commit,
PR 생성, 배포는 하지 않는다. 검토·반영 후 임시 workflow를 제거한다.

## 시각 검토와 CI 실패 판단

두 viewport에서 나란히 비교하고 원본 배율로 확대하여 가시성, 색상, 필드·버튼 경계,
간격, 정렬, 줄바꿈, 아이콘, 폰트 종류·크기·굵기를 확인한다. glyph/아이콘 가장자리의
rasterization 차이와 실제 UI 변경을 구분한다. raw RGBA diff 수는 Playwright의
비교 알고리즘/threshold와 다를 수 있으므로 진단으로만 사용한다.

각 Contact 검사의 `visual-environment` 첨부에는 OS/Node/브라우저/Playwright,
DPR/locale/timezone/theme, FontFace 상태, CDP의 실제 glyph 폰트, WOFF2 해시가 있다.
이 값을 생성·재검증·일반 CI 사이에 비교한다. 폰트 누락이나 UI 회귀이면 기준을
교체하지 말고 원인을 수정한다. 허용치 증가, broad mask, skip, 재시도로 숨기지 않는다.

최초 기준은 Debian/Chromium 154에서 생성되어 Noble/Chromium 156 CI와 달랐다.
이번 승인으로 두 후보를 반영하되, 특정 Skia/FreeType 변경이 픽셀 차이를 만들었다고
분리 검증한 것은 아니다. 일반 CI가 통과하기 전에는 전체 CI 완료로 보고하지 않는다.

CI와 환경이 다른 로컬에서는 TypeScript·ESLint·production build·YAML/actionlint를
검증한다. 새 기준의 로컬 screenshot 실패를 CI 회귀로 해석하거나 로컬 이미지로
자동 갱신하지 않는다. 실제 일반 CI의 전체 결과와 artifact/Summary를 별도로 확인한다.
