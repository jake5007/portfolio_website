# GitHub Actions CI

## 실행 범위와 순서

`.github/workflows/ci.yml`은 `main` 대상 pull request와
`refactor/portfolio-modernization` push에서 실행한다. 배포나 PR 생성은 하지 않는다.
PR에서는 GitHub의 기본 merge ref를 검사하며, push에서는 해당 커밋을 검사한다.

Ubuntu 24.04 GitHub-hosted runner의 단일 job에서 digest로 고정한 공식 Playwright
Noble container를 사용한다. 이미지/기준 생성 절차는
[Contact 시각 회귀 기준 관리](visual-baselines.md)를 따른다.

1. 소스 checkout, 고정 이미지에 포함된 Node.js 24 LTS 확인.
2. `npm ci`: 기존 lockfile로 설치. manifest/lockfile 불일치는 실패한다.
3. `npm run lint`.
4. `npm run build`: 프로덕션 빌드를 한 번만 생성한다.
5. `npm run typecheck -- --incremental false`.
6. 이미지에 포함된 Chromium을 launch하고 OS·architecture·실제 브라우저 버전을 기록한다.
7. `npm test`: 전체 테스트 실행 및 보고서 생성.

Next.js 빌드가 `.next/types`와 `next-env.d.ts`를 생성하므로 독립 TypeScript 검사는
빌드 다음에 실행한다. 검사와 빌드를 동시에 실행하지 않는다. 타입 검사를 끄거나
빌드 검사를 우회하지 않는다. 기존 package script와 패키지 버전은 유지한다.
Node 24는 현재 `engines.node: >=24 <25`와 일치하며 공식 지원 종료는
2028-04-30이다. 새 major 채택은 별도 호환성 검토 대상이다.

렌더링 환경과 로컬/CI Node 버전 일치를 우선해 이미지의 Node를 그대로 사용하며
setup-node의 런타임 교체·npm 캐시는 제거했다. `npm ci`는 매번 수행하며
`node_modules`, `.next`, 브라우저와 테스트 결과도 캐시하지 않는다.
Chromium·시스템 라이브러리·폰트는 고정 이미지의
것을 사용하고 재설치하지 않는다. 동일 PR 또는 동일 브랜치의 오래된 run은 취소한다.
해당 기능 브랜치에 열린 PR이 있으면 push와 PR 두 이벤트가 각각 실행될 수 있다.

## 테스트 격리와 종료

- 기존 108개 검사: 접근성 39, API 40, Contact Form 16, 로컬 SMTP 9,
  애니메이션 정리 4. 테스트 본문과 시각 회귀 기준 이미지는 변경하지 않는다.
- 단일 worker, 순차 실행, retry 0회. CI에서 `test.only`는 실패 처리한다.
- CI 일반 테스트 제한 30초, expect 10초, 전체 테스트 제한 10분.
  26초 SMTP 진행 검사의 명시적인 35초 제한 등 개별 제한은 그대로 유지한다.
  job 전체는 설치·빌드를 포함해 20분으로 제한한다.
- 기존 webServer가 `127.0.0.1:3105`에서 production server를 시작한다.
  이전 서버를 재사용하지 않으며 CI 시작 제한은 60초이다. 종료 시 SIGTERM과
  5초 grace period를 사용하고, 종료하지 않으면 Playwright가 강제 종료한다.
- 브라우저의 정상 Contact 요청은 fixture로 응답하고 차단 fallback을 유지한다.
  실제 HTTP API 검사는 잘못된 입력만 보낸다. 외부 프로젝트 탐색도 로컬 fixture로
  대체한다. API unit test는 가짜 transport, SMTP test는 인증·외부 중계 기능이 없는
  임시 `127.0.0.1` SMTP sink를 사용한다. 테스트용 소켓·타이머는 fixture가 정리한다.
- CI job과 테스트 webServer의 `AUTH_USER`, `AUTH_PASS`를 빈 값으로 명시한다.
  운영 SMTP 설정은 필요하지 않으며, 실제 메일을 보내지 않는다.
- 페이지 검증은 외부 API에 의존하지 않는다. 다만 이미지·의존성 다운로드와 빌드의
  `next/font/google`은 네트워크가 필요하다. 런타임에서는 빌드에 포함된 폰트를 쓴다.

## 보안 경계

`permissions: contents: read`만 부여하며 `pull_request_target`, write token,
배포 자격증명, 환경 secret 참조를 사용하지 않는다. checkout의
`persist-credentials: false`로 저장된 Git 인증을 이후 스크립트에 남기지 않는다.
PR 제목·본문·브랜치명 등 외부 입력을 shell 명령에 삽입하지 않는다.
fork PR 코드와 npm lifecycle script도 실행되므로, 승인된 GitHub 호스팅 runner에서
실행하며 민감한 self-hosted runner로 옮기지 않는다. 공개 fork의 최초 run은
저장소의 GitHub Actions 승인 정책에 따라 관리자의 승인이 필요할 수 있다.

공식 Actions는 태그 대신 전체 commit SHA로 고정했다. 다음 값은 구현 시점의
공식 저장소 tag와 `action.yml`의 Node 24 runtime을 확인한 값이다.

| Action | 검토한 태그 | SHA |
| --- | --- | --- |
| actions/checkout | v6 | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| actions/upload-artifact | v7 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

고정 SHA도 보안 공지와 릴리스를 확인해 주기적으로 갱신해야 한다.
이미지와 Actions 갱신 시 검증 단계를 생략하지 않는다.

## 실패 해석과 artifact

실패한 명령은 job을 실패시킨다. `continue-on-error`, 자동 snapshot 갱신,
검사 제외나 반복 retry로 실패를 감추지 않는다. 테스트 실패 시에도 후속 artifact
업로드와 Summary를 실행한다. 테스트 전에 실패하면 이후 검사는 skipped로 표시되고,
Summary에 보고서가 생성되지 않았음을 명시한다. 취소·runner 종료·job 제한 시간
초과에서는 보고서 생성이나 업로드가 보장되지 않는다.

GitHub의 Actions → 해당 run → Summary에서 단계별 결과와 테스트 수를 확인한다.
Artifacts의 `playwright-results-<run attempt>` ZIP을 내려받으면 다음을 볼 수 있다.

- `playwright-report/`: HTML 보고서. 압축을 풀고
  `npx --no-install playwright show-report <playwright-report 경로>`로 연다.
- `test-results/results.json`: passed/failed/skipped/flaky 수와 상세 결과.
- 실패 테스트의 스크린샷·기준 이미지 차이·trace ZIP과 첨부 자료.
  `npx --no-install playwright show-trace <trace.zip 경로>`로 분석한다.
  성공한 테스트의 trace는 보관하지 않는다.

두 결과 디렉터리만 업로드하고 보관 기간은 7일이다. `.env`, 소스 checkout 전체,
빌드 결과, npm 캐시는 업로드하지 않으며 숨김 파일도 포함하지 않는다.
현재 fixture는 합성 연락처 데이터만 사용한다. 향후 실제 개인정보나 인증값을
테스트 데이터에 추가하면 trace·스크린샷도 별도 민감정보 검토가 필요하다.

| 실패 단계 | 먼저 확인할 사항 |
| --- | --- |
| npm ci | manifest/lockfile 일치, Node 24, npm registry 접근, 설치 로그 |
| ESLint / TypeScript | 표시된 파일·행의 실제 오류. 규칙이나 검사 비활성화 금지 |
| Build | 소스 오류와 Google Fonts 다운로드 실패를 구분. 네트워크 실패를 폰트 mock으로 숨기지 않음 |
| Container / Chromium 검증 | Microsoft registry/이미지 CDN 접근, lockfile과 이미지의 Playwright 버전 일치, bundled browser launch 로그 |
| Playwright | 첫 실패의 HTML/trace, 콘솔·네트워크, 로컬 SMTP 타임아웃과 정리 결과 |
| Screenshot | browser/OS/font 버전과 실제 PNG diff. 기준 이미지를 자동 갱신하거나 허용치를 넓히지 않음 |

## 로컬 재현과 검증 범위

정식 시각 회귀 재현은 [동일 digest 이미지 실행 절차](visual-baselines.md#실행과-승인-절차)를
사용한다. 아래는 Node 24와 관리 Chromium을 별도로 설치하는 일반 로컬 검사이며,
OS/시스템 폰트가 다르면 CI와 동일한 시각 검사 환경이 아니다.

```sh
npm ci
npm run lint
npm run build
npm run typecheck -- --incremental false
npx --no-install playwright install --with-deps chromium
CI=true AUTH_USER='' AUTH_PASS='' npm test
```

이미 설치된 Chromium을 사용하는 로컬 대체 검증도 가능하다.
이 경우 GitHub의 Playwright 관리 브라우저와 동일한 실행 환경을 검증한 것은 아니다.

```sh
CI=true AUTH_USER='' AUTH_PASS='' \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Step 6 로컬 검증은 Debian 13, Node 24.19.0, npm 11.9.0,
Chromium 154.0.8037.57에서 수행했다.

| 항목 | 결과 |
| --- | --- |
| 기존 lockfile의 npm ci | 통과, manifest/lockfile 변경 없음 |
| workflow YAML / actionlint 1.7.12 | 통과. 도구는 공식 릴리스 SHA-256 확인 후 사용 |
| Summary 스크립트 | 성공 / 테스트 실패 / 선행 단계 실패의 세 경우를 별도 임시 데이터로 확인 |
| ESLint / standalone TypeScript | 통과 |
| Production build | 통과 |
| CI=true 전체 Playwright | 108개 통과, 실패·skip·flaky 0 |
| HTML / JSON 보고서 | 생성 확인, Git 제외 확인 |
| 테스트 종료 | runner 정상 종료, webServer의 3105 포트 해제 확인 |

이 실행은 기존 테스트 108개를 CI reporter·timeout·forbidOnly 설정과 시스템
Chromium override로 검증한 결과이다. 실제 이메일은 보내지 않았으며,
테스트 본문·기준 PNG·앱 소스·의존성 버전은 바꾸지 않았다.
`npm ci`는 기존 `glob@10.5.0`, `eslint@9.39.5`의 deprecation 경고를 출력했다.
이번 단계에서 의존성 업그레이드는 수행하지 않았으며, 이 경고를 security audit
통과나 취약점 부재로 해석해서는 안 된다.

이 표는 첫 push 이전의 로컬 검증 이력이다. 이후 실제 GitHub 실행 결과는 아래와
같으며, 이력의 로컬 통과를 GitHub CI 통과로 해석하지 않는다.

### 브라우저와 시각 회귀의 남은 검증

첫 [GitHub 실행](https://github.com/jake5007/portfolio_website/actions/runs/39094160189)은
3분 53초 후 실패했다. 106개 통과·2개 Contact PNG 비교 실패였으며 artifact
`playwright-results-1`(19.5MB) 생성과 공개 오류 주석을 확인했다. Actions API는
Forbidden이고 상세 로그는 로그인이 필요해 사용자 정의 Summary 전체는 검증하지
못했다. 사용자가 별도로 검토한 이미지의 크기·구조는 일치하고 글자·아이콘 주변의
차이가 주로 관찰됐다. 확정 사실/가설과 새 환경 표준안은
[시각 회귀 문서](visual-baselines.md)에 구분해 기록했다.

현재 변경은 표준 환경을 준비하는 단계다. 기준 PNG는 아직 보존하며 고정 이미지의
실행과 기준 교체는 별도로 검증·승인해야 한다. 관리 브라우저 CDN과 Docker 이미지
다운로드가 이 클라우드에서 403으로 차단됐으며 검증을 끄거나 우회하지 않았다.

## upstream 진단

Step 6 시작 시 로컬 HEAD와 GitHub의 기능 브랜치는 모두
`165f53d60892dfc106c5470dfadff94e40ba3a04`였다. working tree도 clean이었다.

`branch.refactor/portfolio-modernization.remote=origin`,
`merge=refs/heads/refactor/portfolio-modernization`은 올바르다. 다만 이 클라우드는
`remote.origin.fetch=+refs/heads/main:refs/remotes/origin/main`으로 제한되어 있어
`refs/remotes/origin/refactor/portfolio-modernization`이 없다. upstream 설정 오류나
push 실패가 아닌, 로컬 원격 추적 참조 누락이다. Git 설정·ref는 변경하지 않았다.

필요할 때 실행할 최소 복구 명령은 다음과 같다. 현재 브랜치와 작업 파일,
`main` 또는 Git 설정을 바꾸지 않고 해당 원격 추적 참조만 만든다.

```sh
git fetch origin refs/heads/refactor/portfolio-modernization:refs/remotes/origin/refactor/portfolio-modernization
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
```

현재 fetch 설정은 그대로이므로 이후에도 기본 fetch만으로 이 참조를 갱신하지 않는다.
지속적으로 추적 범위를 늘리는 Git 설정 변경은 별도 선택이며 CI 실행에는 필요 없다.

## 공식 참고 자료

- [Node.js 릴리스 지원 일정](https://github.com/nodejs/Release/blob/main/schedule.json)
- [Playwright GitHub Actions 가이드](https://playwright.dev/docs/ci-intro)
- [Playwright 시각 비교와 환경 차이](https://playwright.dev/docs/test-snapshots)
- [GitHub Actions 보안 지침](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [공식 artifact action](https://github.com/actions/upload-artifact)
