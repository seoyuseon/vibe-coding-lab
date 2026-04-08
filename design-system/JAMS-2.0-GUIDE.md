# JAMS 2.0 디자인 시스템 가이드

> Figma 원본: https://www.figma.com/design/Dojrcqpr6br5B6BNkj08jR/JAMS-2.0?node-id=172-17732
> fileKey: Dojrcqpr6br5B6BNkj08jR

## 디자인 시스템 구조

### Foundation
| 항목 | 설명 |
|------|------|
| Typography | 폰트 패밀리, 사이즈, 웨이트, 라인하이트 |
| Spacing | 여백 시스템 (4px 기반 예상) |
| Radius | 모서리 둥글기 체계 |
| Shadow | 그림자 레벨 정의 |
| Breakpoint & Grid | 반응형 기준점, 그리드 시스템 |
| Separator (Line) | 구분선 스타일 |

### Navigation
| 컴포넌트 | 설명 |
|----------|------|
| Mobile GNB | 모바일 글로벌 네비게이션 |
| PC GNB | PC 글로벌 네비게이션 |
| Header | 헤더 컴포넌트 |
| M | 모바일 레이아웃 |
| Tab | 탭 네비게이션 |

### Components
| 카테고리 | 컴포넌트 목록 |
|----------|---------------|
| Graphic | Logo, Icon, Emoji, SNS icon, Profile |
| Button | Button, ButtonIcononly, ButtonIconEmoji, ButtonEmoji, ButtonIcon, ButtonScrap, ButtonContext, ButtonFilterIcon, ButtonFilterItem, ButtonFilterSelect, ButtonPaginationArrow, ButtonPaginationCounter, ButtonPaginationCounterWhite, ButtonText, ButtonCounter, ButtonSearch, ButtonFloating, ButtonProduct, ButtonTop, ButtonClose, ListButton |
| Controls | Checkbox, Check, Radio, Switch, Slider |
| Indicator | Stepper, Pagination, Scrollbar |
| Input | TextField, TextField License, Textarea, Selectbox, SearchAll |
| Tooltip | Tooltip, TooltipBox, TooltipButton, TooltipShare |
| Toast | Toast, Toast Popup, Snackbar |
| Label | Tag, TagPosting, TagSubway, ChipFilterList, ChipFilterDiscovery, ChipFilterDiscoveryEmoji, ChipFilterOnboarding, ChipFilterRecommend, ChipInput |
| Filter | Filter |
| Bottom Sheet | Bottom Sheet |
| Contents | Title PC, Title Mobile |
| CardJob | CardJob, CardJobSection |

## Figma 노드 참조 (에이전트용)

에이전트가 특정 컴포넌트를 Figma에서 조회할 때 사용:

```
fileKey: Dojrcqpr6br5B6BNkj08jR
Index 페이지 nodeId: 172:17732
Developer Index: 6244:4858
Designer Index: 6244:4577
Foundation 섹션: 660:93013 (dev), 4369:84495 (design)
Navigation 섹션: 660:93034 (dev), 4369:84503 (design)
Components 섹션: 660:93022 (dev), 4369:84510 (design)
```

## 현재 index.html 디자인 토큰 현황

현재 코드에 정의된 CSS 변수들:
- 컬러: grey 계열 (11~97), azure, blue, red
- 폰트: Pretendard
- 레이아웃: max-width 1200px
- border-radius: 다양 (4px, 8px, 10px, 12px, 16px, 999px)
- shadow: 인라인 정의 (체계 없음)

### 점검 필요 사항
1. 컬러 토큰이 JAMS 2.0과 일치하는지 확인
2. Typography 체계 (font-size, font-weight, line-height) 정리
3. Spacing 체계 적용
4. Radius 값 체계화
5. Shadow 값 체계화
6. 컴포넌트별 JAMS 2.0 규격 대조
