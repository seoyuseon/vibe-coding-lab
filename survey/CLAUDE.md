# 프로젝트: 잡코리아 설문조사

## 적용 범위

- 이 지침은 `survey/` 프로젝트에만 적용한다.
- 설문조사 화면을 JAMS 2.0 기준으로 유지한다.

## 디자인 시스템과 기획

- JAMS 2.0(잡코리아 디자인 시스템)을 사용한다.
- Figma: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0
- fileKey: `Dojrcqpr6br5B6BNkj08jR`
- 가이드: `../design-system/JAMS-2.0-GUIDE.md`
- 기획 문서: `PRD-survey-redesign.md`
- 공용 역할 문서: `../.claude/agents/`

## 기술 및 화면 기준

- 순수 HTML/CSS/JavaScript로 구현한다.
- 기본 폰트는 Pretendard다.
- 모바일 설문 흐름, 입력 상태, 제출 전후 상태를 함께 검수한다.

## 작업 흐름

1. PRD와 현재 코드, JAMS 2.0의 차이를 확인한다.
2. CSS 변수와 디자인 토큰을 정리한다.
3. 설문 UI와 상호작용을 수정한다.
4. 모바일 레이아웃과 전체 응답 흐름을 검수한다.

## 작업 규칙

- 설문 문항, 선택지, URL, 제출 동작을 요청 없이 변경하지 않는다.
- 스타일은 CSS 변수(토큰)를 통해 관리한다.
- 한 번에 한 영역씩 점진적으로 수정한다.
- 수정 전후를 비교할 수 있도록 기록한다.
