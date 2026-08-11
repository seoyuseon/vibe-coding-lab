# 프로젝트: JAMS 프로토타입

## 적용 범위

- 이 지침은 `jams-prototype/` 프로젝트에만 적용한다.
- 잡코리아 화면과 재사용 컴포넌트를 JAMS 기준으로 유지한다.

## 디자인 시스템

- 현재 저장소의 기준 문서는 JAMS 2.0이다.
- Figma: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0
- fileKey: `Dojrcqpr6br5B6BNkj08jR`
- 가이드: `../design-system/JAMS-2.0-GUIDE.md`
- 공용 역할 문서: `../.claude/agents/`
- 디자인 시스템 버전을 변경할 때는 기존 토큰과 컴포넌트의 마이그레이션 범위를 먼저 확인한다.

## 기술 스택

- React, Vite, Tailwind CSS를 사용한다.
- `jams.preset.cjs`와 `tailwind.config.js`의 기존 토큰 연결을 우선 사용한다.
- 공통 컴포넌트는 `src/components/`, 화면은 `src/pages/`에서 관리한다.
- 기본 폰트는 Pretendard다.

## 작업 흐름

1. 현재 컴포넌트와 JAMS 기준의 차이를 확인한다.
2. 공통 토큰과 프리셋을 먼저 정리한다.
3. 재사용 컴포넌트를 수정한 뒤 화면에 반영한다.
4. PC와 모바일 화면, 기존 컴포넌트 사용처를 함께 검수한다.

## 작업 규칙

- 기존 텍스트, 데이터, URL을 요청 없이 변경하지 않는다.
- 임의 값보다 기존 Tailwind/JAMS 토큰을 우선한다.
- 공통 컴포넌트 변경 시 모든 사용처의 회귀 가능성을 확인한다.
- 수정 전후를 비교할 수 있도록 기록한다.
