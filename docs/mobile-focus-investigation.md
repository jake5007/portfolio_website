# 모바일 resize 포커스 실패 조사

## 기대 동작과 재현

기존 검사 `mobile disclosure supports Space, Escape, destination focus and desktop resize`는
모바일 메뉴를 열어 첫 링크로 포커스를 옮기고, 데스크톱 전환 시 보이는 첫 링크로,
모바일 복귀 시 메뉴 버튼으로 포커스를 이동할 것을 요구한다. 숨겨지는 컨트롤에
포커스를 남기거나 BODY로 잃지 않는 접근성 요구이며 유지했다. 다른 콘텐츠에
있는 포커스를 resize 때문에 가져오면 안 된다.

조사 환경: Debian 13, Node 24.19.0, 시스템 Chromium 154.0.8037.57,
Playwright 1.64.1, DPR 1, en-US, UTC, reduced-motion. 고정된 CI 컨테이너 내부의
실행 결과가 아니며 컨테이너 설정은 변경하지 않았다.

- 진단을 추가한 원래 테스트 40회는 모두 통과했다. 이것만으로 해결을 판단하지 않았다.
- 별도 로컬 probe는 한 페이지에서 메뉴 링크의 포커스를 먼저 확인한 뒤
  320↔1024px, 767↔768px를 번갈아 왕복했다. 60회 상한 안에서 두 번 실패했다
  (각각 36번째, 28번째 왕복의 데스크톱→모바일 전환). 임의 sleep, 재시도,
  synthetic focus 이벤트, 외부 서비스는 사용하지 않았다.
- 실패 시 문서는 계속 focused였지만 activeElement는 BODY였다. 따라서
  `document.hasFocus()`가 false여서 발생한 matcher 실패가 아니었다.
- 두 번째 실패는 최근 500개 이벤트를 유지하는 진단과 실패 trace로 순서를 확인했다.

## 확인된 원인

두 번째 probe의 `performance.now()` 기준 실제 순서:

| 시간(ms) | 관찰 |
| --- | --- |
| 5289.1 | 데스크톱 About 링크 focusin, identity 3 |
| 5338.0 | 767px에서 같은 링크 blur, relatedTarget=null, activeElement=BODY |
| 5338.2 | 같은 링크 focusout, 문서 focused=true |
| 5341.0 | window resize, activeElement=BODY |
| 5341.4 | breakpoint change, activeElement=BODY |
| 15385.5 | assertion 실패 후에도 BODY, 문서 focused=true |

실패 시 모바일 버튼은 동일 identity 2이고 연결 상태를 유지했다. 버튼은
`display:inline-block`, `visibility:visible`, rect `(685,9,54,38)`이었다.
데스크톱 링크 역시 identity 3으로 연결돼 있었지만 숨겨진 조상 때문에 rect는
0×0이고 `checkVisibility()`는 false였다. 메뉴는 닫혀 있었다.

브라우저가 responsive CSS로 숨겨진 링크를 미디어쿼리 통지 전에 blur할 수 있다.
기존 resize 핸들러는 현재 activeElement만 검사하므로 원래 링크를 놓쳤다.
이는 준비된 소스 포커스에서도 발생한 실제 앱 결함이다. 링크/버튼 remount나
CSS transition이 원인이 아니었다. 메뉴의 mount/unmount는 기존 의도된 동작이다.

이전 세션의 모바일→데스크톱 실패에는 실패 시점 이벤트 자료가 없으므로 동일
순서였다고 단정하지 않는다. 수정은 양방향에서 숨겨지는 내비게이션을 처리한다.
React effect 자체의 진입/종료를 프로덕션 코드에 계측하지는 않았다. 관측 가능한
focus 이벤트와 메뉴 DOM/aria-expanded 변경을 기록하여 타이밍 영향을 줄였다.

## 수정

`Navbar`의 포커스 이동 판단을 한 함수로 공유하고, 기존 matchMedia 핸들러에 더해
nav의 native focusout도 처리한다. relatedTarget이 없고 소스가 현재 breakpoint에서
숨겨지는 내비게이션일 때만 보이는 컨트롤로 옮긴다. 닫힌 모바일 메뉴 버튼이
데스크톱 전환에서 숨겨지는 경우도 처리한다. 명시적인 다른 포커스 목적지나
콘텐츠의 포커스를 가로채지 않는다. 타이머, 추가 패키지, 지연 실행은 없으며
두 이벤트 리스너는 effect cleanup에서 제거한다.

기존 테스트의 두 번째 메뉴 열기에는 첫 링크 포커스 확인이 빠져 있었다.
명시적인 observable assertion을 추가했다. 이는 테스트의 전제를 강화하는 수정이며,
확인된 앱 결함의 원인을 이 누락으로 돌리지 않는다. 기존 포커스 요구는 유지했다.

## 회귀 검사와 진단

추가 검사 `navigation preserves focus across repeated breakpoint changes without stealing content focus`:

- 같은 문서에서 40회 왕복하며 각 전환 전후의 실제 포커스를 확인한다.
- 일반 viewport와 정확한 CSS 경계를 모두 검사한다.
- 닫힌 메뉴 버튼의 데스크톱 전환과 Contact 이메일 입력에 있는 포커스 보존도 검사한다.
- 반복은 브라우저 이벤트 순서를 검사하는 시나리오이며 실패 시 재시도하지 않는다.

```sh
CI=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  npm test -- --grep 'mobile disclosure supports|navigation preserves focus across repeated' \
  --repeat-each=10 --update-snapshots=none
```

실행 환경에 맞는 승인된 Chromium 경로를 사용한다. 표준 컨테이너에서는 시스템
실행 경로 override 없이 이미지에 포함된 Playwright 브라우저를 사용한다.

`navigation-focus-chronology` JSON 첨부에는 다음이 포함된다.

- active/target/related element의 안정적인 ID, 연결 상태, 영역
- focus/blur/focusin/focusout, 실제 window focus/blur, resize, matchMedia 변경
- 메뉴 mount/unmount 및 aria-expanded 변경
- 문서 focus 상태, viewport와 breakpoint, performance 시간 및 timeOrigin
- 시작/종료 시 대상의 computed display/visibility, rect, checkVisibility
- 기존 실패 테스트의 critical action/assertion 시작·종료 wall-clock 시각

이벤트는 최근 500개만 메모리에 보관한다. 이벤트마다 layout 측정이나 console 출력,
polling을 하지 않는다. 진단은 두 대상 테스트에만 설치하고 종료 시 제거한다.
원래 assertion 오류는 다시 throw하며 실패를 통과로 바꾸지 않는다. 실패 시 기존
`retain-on-failure` trace와 screenshot이 함께 남는다. 생성 산출물은 커밋하지 않는다.

원래 probe의 실패 trace와 JSON은 조사 세션의 `/tmp/focus-investigation`에 보관했다.
임시 파일은 영구 보존되지 않으므로 핵심 실패 증거를 위에 기록했다.

## 수정 후 검증 결과

- 대상 두 검사 각각 10회, 총 **20/20 통과**, 재시도·skip 0 (99.4초).
  회귀 검사 내부의 40회 왕복을 10번 실행해 400회 왕복을 검사했다.
- 수정 후에도 `relatedTarget=null`인 native blur가 최근 이벤트 기록에 10건
  남았다(데스크톱→모바일 7건, 모바일→데스크톱 3건). 같은 실패 조건이
  발생했지만 focusout 핸들러가 포커스를 복구했다.
  대표 기록: 5358.0ms desktop blur → 5358.1ms focusout → 5358.2ms toggle
  focusin → 5359.8ms resize → 5360.2ms breakpoint change. 문서는 계속 focused였다.
- 프로덕션 build, TypeScript, ESLint 통과. 새 진단의 NodeList 순회는 기존 ES5
  target과 맞게 Array.from을 사용했으며 tsconfig나 검사 강도를 바꾸지 않았다.

- 최종 전체 Playwright **109/109 통과**, 실패·flaky·skip 0 (약 2.4분).
  기존 108개와 새 회귀 검사 1개를 모두 실행했다. Contact 1440px/320px의
  strict(maxDiffPixels=0) 시각 검사도 통과했다. 기준 PNG의 SHA-256은 시작과 같다.
- 모든 접근성 검사의 browser console/pageerror 확인이 통과했다. 기존 Contact/API/
  로컬 SMTP 검사도 통과했으며 실제 이메일은 보내지 않았다.
- pinned container, workflow, Playwright config, 기존 CI 문서는 이번 조사에서
  변경하지 않았다. GitHub-hosted/container 검증은 이번 결과에 포함되지 않는다.
- 시작 HEAD `e9fafa0c12a537c0e442eef6ca0bb140381a2dfd`를 유지했다.
  이번 수정은 Navbar, 접근성 spec, 새 진단 helper, 이 문서 4개이다. 기존 CI 변경을
  포함해 작업 트리는 수정 6개·신규 3개이며 staging/commit/push는 하지 않았다.

남은 한계: 유한한 Chromium 반복 검사가 모든 브라우저/이벤트 순서를 보장하지는
않는다. 이전 세션의 개별 실패에는 원시 포커스 기록이 없으므로 그 실행의 원인을
소급해 확정할 수 없다. 다만 실제 CSS blur 선행 순서를 양방향에서 확인했고, 새
핸들러가 복구하는 기록을 확보했다. Contact 기준 교체와 CI 컨테이너 검증은 별도
승인 범위이며 이번 작업으로 해결됐다고 주장하지 않는다.
