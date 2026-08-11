# 프로젝트: 잡코리아 콘텐츠LAB

## 적용 범위

- 이 지침은 `contents-home/` 프로젝트에만 적용한다.
- 다른 프로젝트의 디자인 시스템과 구현 규칙에 이 지침을 적용하지 않는다.

## 디자인 시스템

- JAMS 2.0(잡코리아 디자인 시스템)을 사용한다.
- Figma: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0
- fileKey: `Dojrcqpr6br5B6BNkj08jR`
- 가이드 문서: `../design-system/JAMS-2.0-GUIDE.md`

## 기술 스택

- 순수 HTML/CSS(프레임워크 없음)
- 폰트: Pretendard
- 레이아웃: max-width 1200px

## 작업 흐름

JAMS 2.0에 맞춰 수정할 때 아래 순서로 진행한다.

1. 디자인 시스템 분석: 현재 코드와 JAMS 2.0의 차이 확인
2. 토큰 정리: CSS 변수 정리 및 수정
3. 컴포넌트 수정: 실제 HTML/CSS 반영
4. QA: 최종 품질 검수 후 필요하면 컴포넌트 수정으로 돌아간다.

관련 역할 문서는 `../.claude/agents/`에 있다.

- `design-system-analyst.md`: 갭 분석
- `token-specialist.md`: 디자인 토큰 정리
- `component-developer.md`: HTML/CSS 컴포넌트 수정
- `qa-reviewer.md`: 최종 품질 검수

## Figma 활용

- 컴포넌트 코드와 화면은 `get_design_context`로 확인한다.
- 특정 노드는 `get_screenshot`으로 시각 검수한다.
- 노드 구조는 `get_metadata`로 탐색한다.

## 작업 규칙

- 기존 콘텐츠의 텍스트와 URL을 임의로 변경하지 않는다.
- 스타일은 CSS 변수(토큰)를 통해 관리한다.
- 한 번에 한 영역씩 점진적으로 수정한다.
- 수정 전후를 비교할 수 있도록 기록한다.
