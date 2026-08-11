# 프로젝트: 잡코리아 콘텐츠LAB PC

## 적용 범위

- 이 지침은 `pc_contents/` 프로젝트에만 적용한다.
- 잡코리아 콘텐츠LAB의 PC 화면을 JAMS 2.0 기준으로 유지한다.

## 디자인 시스템

- JAMS 2.0(잡코리아 디자인 시스템)을 사용한다.
- Figma: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0
- fileKey: `Dojrcqpr6br5B6BNkj08jR`
- 가이드: `../design-system/JAMS-2.0-GUIDE.md`
- 공용 역할 문서: `../.claude/agents/`

## 기술 및 화면 기준

- 순수 HTML/CSS로 구현한다.
- 기본 폰트는 Pretendard다.
- PC 레이아웃의 최대 너비는 1200px를 기준으로 한다.

## 작업 흐름

1. 현재 코드와 JAMS 2.0의 차이를 확인한다.
2. CSS 변수와 디자인 토큰을 정리한다.
3. HTML/CSS 컴포넌트를 수정한다.
4. PC 화면을 최종 검수하고 필요한 영역만 다시 수정한다.

## 작업 규칙

- 기존 텍스트와 URL을 요청 없이 변경하지 않는다.
- 스타일은 CSS 변수(토큰)를 통해 관리한다.
- 한 번에 한 영역씩 점진적으로 수정한다.
- 수정 전후를 비교할 수 있도록 기록한다.
