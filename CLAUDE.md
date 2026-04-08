# 프로젝트: 잡코리아 콘텐츠LAB

## 디자인 시스템
- **JAMS 2.0** (잡코리아 디자인 시스템)
- Figma: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0
- fileKey: `Dojrcqpr6br5B6BNkj08jR`
- 가이드 문서: `design-system/JAMS-2.0-GUIDE.md`

## 기술 스택
- 순수 HTML/CSS (프레임워크 없음)
- 폰트: Pretendard
- 레이아웃: max-width 1200px

## 멀티 에이전트 워크플로우

JAMS 2.0 디자인 시스템에 맞게 코드를 수정하는 팀 구성:

### 실행 순서

```
1️⃣ 디자인 시스템 분석가  →  갭 분석 리포트 작성
       ↓
2️⃣ 토큰 전문가          →  CSS 변수(토큰) 정리·수정
       ↓
3️⃣ 컴포넌트 개발자       →  HTML/CSS 컴포넌트 수정
       ↓
4️⃣ QA 리뷰어            →  최종 검수 리포트 작성
       ↓
   (수정 필요시 → 3️⃣로 회귀)
```

### 에이전트 호출 방법

각 에이전트는 `.claude/agents/` 폴더에 정의되어 있습니다:

| 에이전트 | 파일 | 역할 |
|----------|------|------|
| 디자인 시스템 분석가 | `design-system-analyst.md` | 현재 코드 vs JAMS 2.0 갭 분석 |
| 토큰 전문가 | `token-specialist.md` | 디자인 토큰(CSS 변수) 정리 |
| 컴포넌트 개발자 | `component-developer.md` | 실제 HTML/CSS 수정 |
| QA 리뷰어 | `qa-reviewer.md` | 최종 품질 검수 |

### 사용 예시

```
"분석가 실행해줘"     → design-system-analyst 에이전트 실행
"토큰 정리해줘"       → token-specialist 에이전트 실행
"컴포넌트 수정해줘"   → component-developer 에이전트 실행
"QA 검수해줘"        → qa-reviewer 에이전트 실행
"전체 파이프라인 실행" → 1→2→3→4 순서대로 전체 실행
```

## Figma MCP 활용

에이전트들은 Figma MCP 도구를 사용하여 디자인 시스템을 직접 조회합니다:
- `get_design_context`: 컴포넌트 코드·스크린샷 조회
- `get_screenshot`: 특정 노드 스크린샷
- `get_metadata`: 노드 구조 탐색

## 규칙
- 수정 시 기존 콘텐츠(텍스트, URL)는 변경하지 않는다
- CSS 변수(토큰)를 통해 스타일을 관리한다
- 한 번에 한 영역씩 점진적으로 수정한다
- 수정 전후를 비교할 수 있도록 기록한다
