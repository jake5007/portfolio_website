# 원본 main 디자인 복원과 Known Issues

승인일: 2026-11-02. 시각·인터랙션 기준은 원격 main
`dfb346635656a58c045e379c6b8b2fdd07ae1e36`, 복원 시작점은 feature 브랜치
`2022639936d64f1f474aba21e3649bbbb94b5afd`다. 디자인 변경은 앞으로 사전 승인이 필요하다.

## 복원 범위와 보존 사항

- Navbar: `bg-base-100/80 backdrop-blur-lg` 복원. 높이·padding·border·sticky 위치를 바꾸지 않는다.
- 원본 DaisyUI/Tailwind 색·그라데이션을 사용한다. Step 5의 readable/CTA 색 보정,
  placeholder 보정과 필드 경계색 override를 제거한다. selector용 클래스 이름은 유지한다.
- Hire Me는 단일 native 링크를 유지하면서 원본 `text-base-content`, gradient,
  hover opacity 0.8 / 200ms를 복원한다. 링크 안에 버튼을 다시 넣지 않는다.
- About/Work 분류 버튼의 원본 hover opacity와 전환을 복원한다. native button,
  aria-pressed, 키보드 조작은 유지한다.
- 테마 선택기는 원본 dropdown의 스타일/전환과 선택 후 열린 상태를 복원한다.
  controlled disclosure, 접근 가능한 이름, Escape·외부 클릭·Tab 이탈·listener cleanup은 유지한다.
  `display:none`인 hidden 속성은 열림 전환을 막으므로 닫힌 패널은 native inert와 aria-hidden,
  visibility/opacity/scale로 처리한다. 실제 transitionrun/transitionend와 200ms 경과를 검사한다.
- 맨 위 이동 버튼은 원래 기본 opacity 0.6 / hover 1이다. 목적지 focus와 reduced-motion 처리를 보존한다.
- 터치 프로젝트 사진의 상시 overlay를 제거한다. 첫 이미지 탭/hover로 기존 링크를 노출하고,
  키보드 focus-within으로도 노출한다. 링크 이름·44px 이상의 타깃·noopener 보호는 유지한다.
- 원형 Hero 이미지는 원래 250px/400px이다. viewport 기반 최대 폭으로 작은 화면 넘침을 막는다.
  올바른 모바일 grid span, min-width 보호는 유지한다.
- About 분류는 원래 내용의 intrinsic 폭으로 배치하되 viewport 안에서만 줄바꿈한다.
  원본처럼 360/390/768/1440px에서는 한 줄, 320px에서는 넘침 없이 줄바꿈한다.
  320px main의 실제 329px overflow를 재도입하지 않는다.
- 세 문구 무한 반복, 단어별 1500/1000/1000ms 대기, 1.1초 커서는 유지한다.
  원래 speed=50의 문자 입력·삭제 간격 `50 + 50 * (Math.random() - 0.5)`를 복원한다.
  DOM을 직접 변경하던 라이브러리로 돌아가지 않고 현재의 단일 타이머와 cleanup을 유지한다.
- Stop animation 버튼은 없는 상태를 유지한다. 모션 감소에서는 초기 CSS부터 정적 이름을
  표시하며 실행 중 환경 설정 변경 시 타이핑을 언마운트하고 타이머를 취소한다.

Next.js 16/React 19, dependency lockfile, SSR 콘텐츠, 테마 초기화·Zustand persistence,
Contact/API/SMTP 보안·시간 제한·socket cleanup, 모바일 메뉴 focusout/resize 수정은 변경하지 않는다.
skip link, focus outline, 앵커 목적지 focus/scroll-margin, 사진 영역의 키보드 스크롤과 의미 구조도 유지한다.

## 승인된 색 대비 예외

원래 색을 복원한다는 사용자 결정은 **WCAG AA 인증이 아니다**. 색상을 다시 임의로 보정하지 않는다.
비준수 항목은 Known Issue로 남기며, 원본의 다른 요소까지 예외 범위를 넓히지 않는다.

| ID | 적용 범위 | 알려진 영향 |
| --- | --- | --- |
| DR-C01 | Pastel/Valentine의 원래 primary 섹션 제목·선택 테마 글자; Pastel/Autumn/Coffee/Luxury/Valentine Hero와 Pastel/Coffee/Luxury/Valentine 로고 gradient | 원래 색의 큰 글자/gradient 대비가 3:1 등에 미달. 로고 대비 수치는 기본 배경 기준이며 사진 위에서는 달라짐 |
| DR-C02 | Night/Autumn/Forest/Coffee/Luxury/Valentine의 원본 Hire Me 글자와 기본/hover gradient | 일반 텍스트 4.5:1 미달. hover opacity 0.8의 실제 합성 색도 측정 |
| DR-C03 | Pastel/Valentine의 원래 입력 경계, Pastel/Autumn/Valentine의 비어 있는 세 Contact 필드의 원래 #9ca3af placeholder | 경계 3:1 / placeholder 4.5:1 미달. 입력된 텍스트·label·focus outline은 예외 아님 |
| DR-C04 | 원래 반투명 Navbar와 사진/콘텐츠의 조합 | 배경에 따라 대비가 달라짐. 불투명 배경이라고 가정한 검사를 제거하고 실제 사진 위 alpha/blur 합성을 검증. 임의의 새 nav 텍스트 대비 위반을 axe 예외 처리하지 않음 |

기본 배경에서 브라우저가 렌더링한 gradient의 최소 대비(반올림)는 다음과 같다.
폰트 antialiasing 가장자리 대신 실제 gradient 전체 픽셀을 비교한다.

| 테마 | CTA | CTA hover | Hero | 로고 | 필드 경계 | placeholder |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Night | 1.31 | 1.28 | 5.92 | 5.97 | 8.33 | 7.03 |
| Pastel | 10.61 | 6.29 | 1.34 | 1.46 | 1.70 | 2.54 |
| Autumn | 1.91 | 1.54 | 2.12 | 3.54 | 8.62 | 2.25 |
| Forest | 1.49 | 1.45 | 7.10 | 7.10 | 7.10 | 7.31 |
| Coffee | 1.05 | 1.05 | 1.54 | 1.54 | 6.88 | 6.92 |
| Luxury | 1.00 | 1.00 | 1.34 | 1.34 | 19.90 | 7.84 |
| Valentine | 3.54 | 2.55 | 2.08 | 2.19 | 2.57 | 2.15 |

이 수치는 모든 스크롤 상태나 보조 기술을 포함한 준수를 보장하지 않는다.

## 테스트의 예외 처리

`tests/original-contrast-policy.ts`에서 theme/metric 또는 theme/DOM 요소/원본 색을 한정한다.
axe는 color-contrast를 포함한 모든 규칙을 실행하고, 해당 node만 기존 문제로 첨부한다.
같은 위반의 다른 node, 다른 theme, 다른 rule은 실패를 유지한다.
빈 필드의 예외는 원본 foreground/background/placeholder 색과 axe가 보고한 회색이
일치할 때만 인정한다. 값이 있는 필드는 제외하지 않는다.

gradient/경계/placeholder 수동 평가도 4.5/3 기준값을 낮추지 않는다. 알려진 theme/metric이
기준에 미달할 때만 Known Issue annotation을 추가하며, 나머지 assertion은 유지한다.
focus outline은 예외 없이 3:1 이상을 요구한다. 비유한값이나 무효한 측정도 실패시킨다.

별도 디자인 검사에서 원본 theme token의 gradient/글자/경계/placeholder 색을 확인한다.
예외 정책 자체도 실제 axe 결과로 검사해, 새 저대비 요소나 이름 없는 버튼이
제외되지 않고 다른 theme에서는 예외를 쓸 수 없음을 확인한다.

다른 접근성 검사, API/SMTP, focus regression, timer cleanup, strict PNG 검사를
비활성화하지 않는다. retry/skip/PNG 허용값도 늘리지 않는다.

## 시각 기준과 로컬 검증의 한계

기존 Contact PNG는 Step 5에서 변경한 placeholder/경계색을 고정하며, main의 권위 있는
디자인 기준이 아니다. 복원한 Contact를 같은 폰트/브라우저에서 main과 비교한다.
기준 PNG는 별도 승인까지 교체·재생성하지 않는다. 현재 해시를 그대로 유지한다.

- 1440px: `25395657f403bf596ed6137001e5c4582674a27aabbee9dd2f483b5fe4d24d81`
- 320px: `9759a515986bb910c039e77ccdb0f4908f1f323b32934d0ea7ace06a1f18d279`

이번 환경은 Debian/Node 24.19.0/Chromium 154로, 승인된 CI PNG의
Noble/Chromium 156과 다르다. 또한 일반 build는 Google Fonts CONNECT 403으로 실패한다.
앱의 font import, package manifest, lockfile, TLS 검증은 변경하지 않았다.

비교·기능 검증에 한해 npm integrity가 검증된 `@fontsource-variable/inter@5.2.8`의
실제 WOFF2 7개를 checkout 밖에 받아 Next의 테스트용 font-response 환경 변수로 사용했다.
main/복원 전/복원 후는 같은 Inter v20 바이트를 사용하고, CDP로 실제 custom Inter 렌더링을 확인한다.
이는 production font 변경이나 새 앱 의존성이 아니다. 승인 PNG의 Google font asset과
해시가 같다고 주장하지 않는다. 일반 네트워크 build 성공 및 CI 실행 성공과도 구분한다.

기준 후보를 만들 때는 별도 승인 후 기존 pinned CI image와 실제 production font를 사용해
main/복원 후/기대 이미지의 차이를 검토한다. 이 로컬 비교 이미지를 CI 기준으로 복사하면 안 된다.

## 로컬 검증 결과

- ESLint, 독립 TypeScript 검사 통과. 일반 production build는 Google Fonts 네트워크 차단으로
  실패했다. 같은 최종 소스의 통제된 Inter 비교 build는 컴파일·Next 타입 검사·정적 생성에 성공했다.
- 최종 Playwright 전체 115개 실행: **113 통과, Contact strict PNG 2 실패, skip/flaky 0**,
  약 7.2분. 실패를 expected-failure로 바꾸거나 테스트를 건너뛰지 않았다.
- 7개 테마 × 320/768/1440px의 새 디자인 검사에서 원본 token 색/gradient, 원형 이미지 크기,
  viewport 넘침 방지, 테마 패널, 실제 사진 위 Navbar의 alpha와 blur 합성을 검증했다.
  현재 glass 캡처와 blur 없는/불투명 대조를 실제 픽셀로 비교한다. 기준 PNG 교체와 다른 검사다.
- 실제 axe 결과에 의도적으로 추가한 새 대비 위반과 이름 없는 버튼이 계속 실패 대상으로
  남는 정책 검사가 통과했다. 다른 theme에서 원본 색 예외가 적용되지 않는 것도 확인했다.
- 320/360/390/640/768/1024/1440px 문서 가로 넘침 0. 원래 한 줄이 들어가는 폭에서는
  분류 버튼의 원본 위치를 유지하고, 320px에서만 줄바꿈한다. 640px 이상 탭 hover opacity 0.8 확인.
- main/복원 전/복원 후의 7개 테마 × 3개 폭, 63개 구성을 동일한 폰트와 브라우저로 비교했다.
  Contact는 1440/768px의 14쌍이 픽셀까지 동일하다. 320px의 잔여 37–41개 border 모서리 픽셀은
  원본 DOM에 동일한 About overflow 수정만 적용한 대조 7건에서 모두 0이 됐다.
  따라서 원본의 가로 넘침을 재도입해 그 픽셀까지 맞추지 않는다.
- 첫 화면과 사진 위 Navbar는 원본/복원 후 21쌍 모두 픽셀 일치. 열림 전환을 끝까지 재생한
  테마 패널은 14/21 일치하며 768px 7건에는 SVG 가장자리의 소량 차이가 남는다.
  원본/복원 후 SVG path·stroke·색·16px 크기·좌표는 같음을 별도로 확인했다.
  정확한 합성/래스터화 원인은 확정하지 않았고 이를 맞추려고 아이콘 디자인이나 허용치를 바꾸지 않았다.
- 메뉴 열림 후 이름 스캔이 한 차례 실패했으나 이후 스냅샷에는 모든 이름이 정상 노출됐다.
  기존 검사는 클릭 완료만 기다렸으므로 expanded/aria-hidden/inert와 모든 이름·가시성이
  준비됐는지 먼저 확인하도록 강화했다. 별도 20/20 및 최종 전체 검사 통과, 실패 기록은 보존한다.
  처음 실패의 내부 스케줄링 시점을 확정한 것은 아니며 button-name 규칙을 예외 처리하지 않았다.
- SSR 홈페이지 HTTP 200과 실제 포트폴리오 콘텐츠, invalid API 400 응답 확인.
  기존 API·Contact Form·로컬 SMTP·focus·무한 타이핑·reduced-motion·timer cleanup 검사도 통과했다.
  실제 이메일이나 production 자격증명은 사용하지 않았다.
- 기준 PNG, dependencies/lockfile, API 보안 코드와 CI workflow는 그대로다. Commit/Push/PR 변경/
  main 병합/배포는 하지 않았다. GitHub-hosted CI는 실행하지 않았다.

남은 단계는 환경의 실제 Google Fonts 접근 복구와 별도 승인에 따른 CI 환경의 Contact 기준 검토다.
Safari/Firefox, 실제 iOS/Android 및 스크린리더 전체 검증은 이번 Chromium 결과에 포함되지 않는다.
