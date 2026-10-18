# Step 5 접근성·모바일 UX 검토

검토 기준: WCAG 2.2 AA의 적용 가능한 항목. 기준 커밋은
`33f4d0a32f2782fc3e51438e6664cb3284149c81`, 브랜치는
`refactor/portfolio-modernization`이다. 수정 전 작업 트리는 깨끗했다.
이번 단계는 커밋·push·배포하지 않는다.

## 재현한 문제와 수정

| 심각도 | 대상 / 재현 | 조치 |
| --- | --- | --- |
| 높음 | 프로젝트 링크가 `display:none`으로 Tab 순서에서 제외되고 hover로만 노출됨 | 링크를 Tab 순서에 유지하고 `focus-within`으로 노출. 터치 장치에서는 상시 노출. 사이트/소스 링크에 프로젝트 이름과 새 탭 안내 추가 |
| 높음 | 테마·모바일 메뉴·맨 위 이동 버튼, 소셜 아이콘 링크에 접근 가능한 이름이 없음 | 명확한 이름, disclosure 상태, 외부 링크의 새 탭 안내 추가 |
| 높음 | 이메일 필드 포커스 outline이 투명하고 shadow도 없음 | 모든 키보드 조작 대상에 테마 본문색의 2px outline과 3px 간격 적용 |
| 높음 | Pastel 제목 1.70:1, Valentine 제목 2.56:1로 큰 글자의 3:1 기준 미달 | 테마 배경·기본 팔레트는 유지하고 읽기용 색만 조정. 폼 경계와 선택된 테마의 작은 글자도 확인 |
| 높음 | 그라데이션 CTA/제목은 axe가 대비를 판정하지 못함. Coffee/Luxury 로고는 반투명 내비게이션 아래 밝은 사진이 있을 때 대비 저하 | 실제 렌더링 픽셀로 그라데이션 대비 검사. 필요한 색상 stop과 CTA 글자색만 보정. 내비게이션 배경은 불투명하게 변경 |
| 중간 | 모바일 메뉴와 테마 선택기에 Escape 처리가 없고, 페이지 내 `next/link` 이동 후 목적지로 포커스가 이동하지 않음 | native 앵커와 포커스 가능한 섹션 사용. 메뉴 열기·닫기·Escape·선택·화면 크기 전환 시 포커스 처리. 테마 선택기는 일반 버튼 disclosure로 구현 |
| 중간 | 320px에서 About 분류 버튼이 넘쳐 문서 폭이 약 329px이 됨 | 분류 버튼 줄바꿈, Hero의 모바일 grid span과 이미지 최대 폭 조정. 전역 `overflow:hidden`으로 숨기지 않음 |
| 중간 | 사진 스크롤 영역을 키보드로 조작할 수 없음 | 이름 있는 focusable region으로 만들고 브라우저 기본 방향키 스크롤 사용 |
| 중간 | 반복 타이핑을 페이지에서 멈출 수 없고 모션 감소 설정도 반영하지 않음 | 정지·재시작 버튼 추가. 모션 감소에서는 정적 이름, 즉시 등장, 즉시 맨 위 이동. 화면 낭독용 제목은 고정하고 타이핑 문자열은 낭독에서 제외 |
| 높음 | 최종 검토에서 `react-type-animation@3.2.0`이 언마운트 후에도 분리된 DOM을 계속 변경함 | 해당 애니메이션만 단일 타이머 구현으로 교체. effect cleanup에서 취소하고, 모션 감소 시에도 동일하게 정리 |
| 개선 | 여러 h1, footer가 heading이며 main 안에 위치, 링크 안의 버튼 | h1 → h2 → h3 계층, 독립 main/nav/footer landmark, skip link, native 링크로 정리. 여러 h1 자체만으로 WCAG 위반이라고 판정하지는 않음 |
| 개선 | 일반적인 이미지 대체 텍스트와 분류 선택 상태 누락 | 이미지 용도·사진 그룹/순서의 대체 텍스트와 버튼 `aria-pressed` 추가. 이메일 autocomplete 및 form 이름 추가 |

Tab/Shift+Tab과 Enter/Space는 native 동작을 유지한다. 모바일 메뉴는 모달이
아니므로 포커스를 가두지 않는다. Escape는 열린 테마 선택기를 우선 닫으며,
모바일 내비게이션은 포커스가 밖으로 이동해도 Escape로 닫을 수 있다.
불필요한 ARIA menu/tab 패턴과 사용자 정의 방향키 처리는 도입하지 않았다.

## 범위와 파일

- `app/page.tsx`, `components/Footer.tsx`: landmark와 skip link.
- `components/Navbar.tsx`, `NavLink.tsx`, `MenuOverlay.tsx`, `ThemeSelector.tsx`,
  `types/index.ts`: 접근 가능한 이름, disclosure, native 이동과 포커스.
- `components/Hero.tsx`, `TypewriterName.tsx`, `ThemeProvider.tsx`,
  `lib/typewriter.ts`, `hooks/usePrefersReducedMotion.ts`:
  모션 대안·정지 제어·맨 위 이동과 포커스. 서버 스냅샷이 동일한
  `useSyncExternalStore`로 초기 hydration 불일치를 피한다.
- `components/AboutMe.tsx`, `AboutMeTabs.tsx`, `Work.tsx`, `TabBtn.tsx`,
  `Card.tsx`, `Hobbies.tsx`, `CarouselWithDesc.tsx`: 의미 구조·줄바꿈·키보드 접근.
- `components/Contact.tsx`, `InputContainer.tsx`: 접근성 속성과 autocomplete만 수정.
  제출 처리, API/SMTP 구현, 제한값과 기존 보안 테스트는 유지한다.
- `app/globals.css`: 대비 보정, 키보드 focus, reduced-motion, 터치의 프로젝트 링크.
- `package.json`, `package-lock.json`: 테스트용 `@axe-core/playwright@4.14.0`
  추가, 사용하지 않게 된 `react-type-animation` 제거. 다른 패키지 버전은 변경하지 않았다.
- `tests/accessibility.spec.ts`와 두 PNG 기준 이미지: 접근성·픽셀 회귀 검사.
  `tests/motion-cleanup.spec.ts`, `tests/typewriter.spec.ts`: 실제 정리 동작 검사.

`data.ts`, 이미지 파일, 프로젝트 설명·경력·테마 목록은 변경하지 않았다.

## 검증 방법

기존 Playwright 인프라에 접근성 39개와 타이핑 정리 회귀 4개 검사를 추가했다.
기존 65개도 함께 실행한다.

- 키보드 순서, skip link, Enter/Space, Escape, 목적지 포커스, resize와 trap 부재.
- 22개 프로젝트 링크의 Tab 접근, 실제 새 탭 활성화와 `window.opener === null`.
  외부 페이지 요청은 로컬 응답으로 대체한다.
- 320px 터치 에뮬레이션: hover 없는 링크 표시, 44px 이상 프로젝트 링크, 메뉴 tap.
- 폼 label/required/autocomplete, native 이메일 검증, 포커스 표시.
- 사진 영역의 native 방향키 스크롤과 Tab 이탈.
- 모션 감소와 일반 모션, 페이지 내 정지·재시작, hydration/console 오류 감시.
- 실제 React 언마운트 후 DOM 참조를 유지하고 MutationObserver로 변경을 감시한다.
  정지 버튼과 실행 중 모션 감소 전환을 각각 3회 반복하고, 회당 8초의 가상 시간을
  진행한다. 별도 Node 검사에서는 실제 타이머의 등록·취소·콜백을 관측해 첫 tick 전과
  단어 대기 중 취소, 반복 시작·정리, 남은 타이머 0개와 추가 콜백 0회를 확인한다.
- 320/360/390/768/1440px 문서 overflow와 테마 선택기의 경계 확인.
- 7개 테마 × 1440/320px의 WCAG 태그 axe 검사. 열린 테마 선택기도 검사한다.
- 그라데이션은 글자를 제거한 동일 배경을 Chromium으로 렌더링해 전체 픽셀을
  비교한다. CTA 기본/hover 4.5:1, 큰 제목/로고 3:1, focus/필드 경계 3:1,
  placeholder 4.5:1을 검사한다. axe의 `incomplete`도 결과에 첨부한다.
- Contact의 1440/320px 스크린샷은 `toHaveScreenshot`, `maxDiffPixels:0`으로
  실제 PNG 기준과 비교한다. 최초 생성 후 일반 실행에서 다시 검증한다.

```sh
npm ci
npm run build
npm run typecheck -- --incremental false
npm run lint
# Chromium 설치가 필요하면 npx playwright install chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

PNG 기준은 Linux의 현재 Chromium·폰트 환경 기준이다. 브라우저/OS/폰트가
다르면 별도 검토 후 기준 이미지 갱신이 필요할 수 있다. 통과를 위해 자동으로
이미지를 갱신하거나 차이 허용치를 넓히면 안 된다.

### 최종 실행 결과

- Node 24.19.0, Chromium 154.0.8037.57, Linux 환경.
- TypeScript, ESLint, production build 모두 통과.
- 정리 결함 수정 전 총 104개가 통과했지만, 화면 상태만 검사하는 테스트는
  타이핑의 백그라운드 작업을 검출하지 못했다. 이 결과를 기준 이력으로 보존한다.
- 정리 결함 수정 후 총 **108개 통과**: 접근성 39, 기존 API 40, Contact Form 16,
  SMTP 9, DOM 언마운트 회귀 2, 실제 타이머 정리 회귀 2.
  실패·skip·flaky 모두 0, 전체 실행 약 144초. 스냅샷 갱신 옵션 없이 통과했다.
- 7개 테마 × 2개 viewport의 axe 검사와 열린 테마 선택기 검사: 위반 0건.
  `incomplete`는 `color-contrast`만 남았으며 그라데이션 픽셀 검사로 별도 평가했다.
- 320/360/390/768/1440px의 문서 가로 넘침 0. 터치 프로젝트 링크는 44px 이상.
- Contact API·SMTP·제출 처리와 기존 65개 테스트 원본이 기준 커밋과 동일함을 확인.
  운영 자격증명을 사용하거나 실제 이메일을 발송하지 않았다.

다음 값은 실제 렌더링한 그라데이션 전체 픽셀 중 최소 대비이며 반올림했다.
CTA의 일반/hover 값은 같고, 큰 제목과 로고에는 3:1, CTA에는 4.5:1을 적용했다.

| 테마 | CTA 일반/hover | Hero 제목 | 로고 |
| --- | ---: | ---: | ---: |
| Night | 6.97 | 5.92 | 5.97 |
| Autumn | 4.89 | 3.98 | 4.00 |
| Forest | 8.04 | 7.10 | 7.10 |
| Pastel | 12.31 | 3.47 | 3.75 |
| Coffee | 4.74 | 3.12 | 3.52 |
| Luxury | 4.58 | 3.59 | 3.75 |
| Valentine | 6.91 | 3.81 | 3.81 |

검사한 테마 중 포커스 대비 최소 7.11:1, 포커스 상태 필드 경계 최소 6.11:1,
placeholder 최소 5.82:1이었다. 특히 daisyUI의 focus 테두리색이 보정색을
덮어쓰는 문제도 수정 후 재검증했다.

## 시각 비교

수정 전·후 같은 테마와 viewport(1440×900, 320×900), 모션 감소 설정으로
7개 테마의 전체 화면과 Contact 영역을 캡처했다. 로컬 증거는
`/tmp/portfolio-step5/before`, `/tmp/portfolio-step5/after`에 저장한다.
320px 수정 전 전체 캡처의 329px 폭은 재현한 문서 넘침 때문이다. 그러므로
크기가 다른 전체 PNG를 단순 픽셀 비교한 수치를 회귀 판단에 사용하지 않는다.
동일 크기의 Contact 영역은 픽셀 비교와 변화 영역 확인을 수행했다.

의도된 차이는 대비가 보강된 글자/placeholder/필드 경계, 스크롤 중 내비게이션
불투명화, hover 밑줄, 키보드 outline, 터치 프로젝트 링크 노출, 좁은 화면의
줄바꿈·이미지 축소, 모션 감소 시 정적 이름과 일반 모션의 정지 버튼이다.
타이핑 프레임과 지연 이미지 로딩은 수정 전부터 시간에 따라 달라지므로 전체
화면의 완전한 픽셀 동일성을 주장하지 않는다. Contact 크기(데스크톱 1200×487,
320px 화면 240×487의 PNG 캡처)는 모든 테마에서 유지됐다. 영역별 실제 픽셀
차이는 placeholder와 Pastel/Valentine 필드 경계 보정 등 의도된 차이에 해당하며,
스크린샷 반올림에 따른 작은 차이도 시각적으로 검토했다. 기능과 크기는 기존
테스트로, 새 기준 이미지의 안정성은 일반 실행의 엄격한 PNG 비교로 확인했다.

### 타이핑 정리 결함 수정

설치된 라이브러리의 무한 비동기 루프는 DOM 참조를 보유하고 timeout과
requestAnimationFrame으로 다음 프레임을 예약하지만, effect cleanup에서는
취소하지 않는다. 정지·재시작 두 번 후 제거된 DOM 두 곳에서 각각 49회·19회의
추가 변경을 재현했다. 새 브라우저 회귀 검사도 교체 전 production 빌드에서
정지와 모션 감소 모두 8초 동안 63회의 추가 변경을 검출하며 실패했다.
화면에서 요소가 사라지는 기존 검사만으로는 이 결함을 검출할 수 없었다.

공개 취소 API가 없는 라이브러리 대신 `startTypewriter`가 타이머 하나를 소유하고,
React effect가 반환된 cleanup을 호출한다. cleanup은 타이머 취소와 활성 상태
해제를 수행하며 여러 번 호출해도 안전하다. DOM 직접 변경이나 비동기 무한 루프는
사용하지 않는다. 첫 서버/클라이언트 렌더의 텍스트는 동일하게 비어 있고,
화면 낭독용 제목·모션 감소용 정적 이름·정지 제어는 유지한다. 커서도 같은 모양과
1.1초 주기를 유지한다. 세 문구와 단어별 대기 시간은 그대로이며, 문자 입력·삭제
간격은 기존 라이브러리의 무작위 변동 대신 일정한 50ms로 단순화했다.

수정 후 두 브라우저 회귀 검사는 각각 3회의 정지·재시작 또는 모션 감소 전환에서
분리된 노드의 추가 변경 0회를 확인했다. 실제 Node 타이머 검사도 두 중단 시점에서
각각 3회 반복한 결과 남은 타이머 0개, 중단 후 추가 콜백 0회였다.
기본 테마와 저장된 7개 테마의 추가 Chromium 확인에서 세 문구의 반복과 커서,
모션 감소 전환을 확인했고 hydration/콘솔 오류는 0건이었다. 초기 HTML에는
포트폴리오 내용이 유지되며, JavaScript 비활성·모션 감소·320px에서도 내용과
정적 이름을 확인했다. 이 추가 확인은 전체 108개 자동 테스트 수와 구분한다.

이번 수정 직전·직후 정지 상태의 Hero를 7개 테마 × 1440/320px로 비교한
14쌍은 크기와 픽셀이 모두 동일했다. 타이핑 중에는 프레임 시점과 입력 간격이
달라 완전한 픽셀 동일성을 주장하지 않는다. 증거는
`/tmp/step5-motion-fix`에 보관하며 저장소에는 생성된 테스트 산출물을 추가하지 않는다.

## 남은 한계와 권고

- 자동 검사와 Chromium 키보드 검증만으로 WCAG 준수를 인증하지 않는다.
  실제 iOS/Android, Safari/Firefox, NVDA/VoiceOver 등 보조 기술 검증이 남는다.
- 사진별 상세한 시각 묘사는 별도 수동 콘텐츠 검토를 권장한다. 현재 대체 텍스트는
  사진 그룹과 순서를 제공하며 촬영 장소나 인물 정보를 추측하지 않는다.
- 색상/픽셀 검사는 현재 테마와 검증한 상태 기준이며 모든 가능한 렌더링 환경을
  보장하지 않는다. OS forced-colors와 높은 확대율에 대한 별도 수동 점검도 권장한다.
- 기존 Contact의 전역 rate limiting 부재, SMTP 수락/최종 배달의 불확실성과
  중복 가능성은 Step 4 문서대로 남아 있다. 이번 단계에서 변경하지 않았다.
- 실제 이메일 발송·배포·외부 서비스 방문 없이 테스트한다.
