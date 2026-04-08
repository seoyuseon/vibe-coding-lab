# JAMS 2.0 갭 분석 리포트

> 분석 일자: 2026-03-30
> 대상 파일: `/index.html`
> 기준: JAMS 2.0 디자인 시스템 (Figma fileKey: Dojrcqpr6br5B6BNkj08jR)

---

## 분석 요약

현재 `index.html`은 JAMS 2.0 디자인 시스템의 Foundation 토큰을 체계적으로 참조하지 않고 있다. CSS 변수(:root)로 컬러 토큰을 자체 정의하여 사용 중이나, JAMS 2.0의 공식 시맨틱 토큰 네이밍(`--color-text-primary` 등)과 일치하지 않는다. Typography는 별도의 체계 없이 개별 수치가 하드코딩되어 있으며, Spacing/Radius/Shadow 역시 JAMS 2.0의 토큰 시스템(unit0~unit80)을 사용하지 않고 임의의 값이 혼재되어 있다. 컴포넌트 레벨에서도 Tab, Button, Pagination 등이 JAMS 2.0 컴포넌트 라이브러리의 규격과 다르게 구현되어 있다.

**핵심 수치:**
- 하드코딩된 색상값(CSS 변수 미사용): 6건
- JAMS 2.0 Spacing 토큰 체계 미적용: 전체 spacing 값 중 대부분
- Typography 스타일 토큰 미사용: 전체 텍스트 스타일 하드코딩
- 비체계적 border-radius: 6종 혼재 사용
- 비체계적 box-shadow: 5종 인라인 정의

---

## 🔴 불일치 (수정 필요)

### Color

#### 1. CSS 변수 네이밍 체계 불일치
현재 코드는 `--color-grey-11`, `--color-grey-20` 등 **명도(lightness) 기반 넘버링**을 사용하고 있으나, JAMS 2.0은 **시맨틱 토큰**(`--color-text-primary: #1a1a1e`, `--color-text-secondary` 등)을 사용한다.

| 현재 코드 | JAMS 2.0 기준 |
|-----------|---------------|
| `--color-grey-11: #1A1A1E` | `--color-text-primary: #1A1A1E` (시맨틱 토큰) |
| `--color-grey-13: #222222` | 시맨틱 토큰으로 매핑 필요 |
| `--color-grey-20: #333333` | 시맨틱 토큰으로 매핑 필요 |
| `--color-grey-40: #666666` | `--color-text-secondary` 또는 `--color-text-tertiary` 매핑 필요 |
| `--color-grey-53: #888888` | 시맨틱 토큰으로 매핑 필요 |
| `--color-azure-50: #0057FF` | JAMS 2.0 primary color 토큰 확인 필요 |
| `--color-azure-54: #1B55F6` | JAMS 2.0 primary color 토큰과 값 불일치 가능 |

#### 2. 하드코딩된 색상값 (CSS 변수 미사용)
아래 색상은 CSS 변수로 정의되지 않고 인라인 또는 클래스에 직접 하드코딩되어 있어 토큰화가 필요하다.

| 위치 | 하드코딩 값 | 용도 | 조치 |
|------|------------|------|------|
| `.featured-card-badge.hot` | `background: #FFF0F0` | HOT 배지 배경 | 시맨틱 토큰 정의 필요 |
| `.featured-card-badge.hot` | `color: #FF4D4F` | HOT 배지 텍스트 | 시맨틱 토큰 정의 필요 |
| `.featured-card-badge.new` | `background: #F0F5FF` | NEW 배지 배경 | 시맨틱 토큰 정의 필요 |
| `.featured-card-rank` | `background: rgba(0,0,0,0.6)` | 랭킹 배지 배경 | 시맨틱 토큰 정의 필요 |
| `.featured-card-rank` | `color: #fff` | 랭킹 배지 텍스트 | `--color-white` 변수 사용으로 변경 |
| 여러 box-shadow | `rgba(0,0,0,0.06~0.08~0.1)` | 그림자 색상 | Shadow 토큰 체계로 통합 |
| `.toolbar-search:focus-within` | `rgba(0,87,255,0.1)` | 포커스 링 | focus ring 토큰 정의 필요 |

#### 3. 의미 불분명한 컬러 토큰
| 현재 변수 | 문제점 |
|-----------|--------|
| `--color-azure-72: #AFB5BE` | azure 계열이 아닌 grey 톤 - 명명 오류 |
| `--color-grey-78: #C2C6CD` | 실제 grey 78% 명도와 불일치 |
| `--color-grey-85: #D5D8DC` | 실제 grey 85% 명도와 불일치 |

---

### Typography

#### 1. Typography 토큰 체계 미적용
JAMS 2.0은 `Typography/H5 18 bold`, `Typography/B4 14 regular` 등 **명명된 타이포 스타일 토큰**을 정의하고 있다(font-family: `font-family-typeface-basic` = Pretendard). 현재 코드는 이러한 토큰을 사용하지 않고 모든 font-size, font-weight, line-height를 개별 하드코딩하고 있다.

#### 2. 사용 중인 font-size 목록과 JAMS 2.0 대응

| 현재 사용 font-size | 사용 위치 | JAMS 2.0 추정 토큰 | 상태 |
|---------------------|-----------|-------------------|------|
| `11px` | badge, copyright | 체계 외 값 가능 | 확인 필요 |
| `12px` | meta, toolbar-count, footer-notice | B5/Caption급 | 확인 필요 |
| `13px` | sidebar-links, toolbar-sort-btn, suggest-tag, footer-contact | 체계 외 값 가능 (비표준 크기) | 확인 필요 |
| `14px` | search-region, btn-outline, footer-nav, article-desc | `B4 14 regular` (확인됨) | line-height 검증 필요 |
| `15px` | search-input, featured-card-title, tab | 체계 외 값 가능 (비표준 크기) | 확인 필요 |
| `16px` | sidebar-title | B2/B3급 | 확인 필요 |
| `17px` | article-title | 체계 외 값 가능 (비표준 크기) | 확인 필요 |
| `18px` | header-nav a | `H5 18 bold` (확인됨) | 일치 가능 |
| `20px` | featured-section-title | H4급 | 확인 필요 |

#### 3. font-weight 사용 현황

| 현재 사용 font-weight | 사용 위치 |
|----------------------|-----------|
| `500` | toolbar-sort-btn, page-num |
| `600` | search-region span, featured-card-badge, tab, article-category-badge |
| `700` (bold) | header-nav, sidebar-title, featured-card-title, article-title, page-num.active 등 |
| `800` (extrabold) | featured-section-title |

JAMS 2.0에서 확인된 font-weight: `400` (regular), `700` (bold). `500`, `600`, `800`의 사용이 JAMS 2.0 체계에 포함되는지 확인 필요.

#### 4. line-height 불일치 가능

| 현재 line-height | JAMS 2.0 참조값 |
|-----------------|----------------|
| `65px` (header-nav) | 비표준 - 레이아웃 용도로 사용 중 |
| `22px` (featured-card-title) | 15px 텍스트에 22px → 1.47 비율 |
| `24px` (article-title) | `H5 18 bold`의 line-height=24 → 17px에 적용은 불일치 |
| `21px` (article-desc) | 14px 텍스트에 21px → 1.5 비율 |
| `18px` (toolbar-count, article-meta) | 12px 텍스트에 18px → 1.5 비율 |
| `17px` (footer-ad-text) | 14px 텍스트에 17px → 1.21 비율 (좁음) |

---

### Spacing

#### 1. JAMS 2.0 Spacing 토큰 체계
JAMS 2.0은 `Spacing/unit` 기반 토큰을 정의하고 있다 (Collection: "Unit"):

| 토큰 | 추정 값 |
|------|--------|
| `unit0` | 0px |
| `unit1` | 4px |
| `unit2` | 8px |
| `unit4` | 16px |
| `unit6` | 24px |
| `unit8` | 32px |
| `unit10` | 40px |
| `unit16` | 64px |
| `unit24` | 96px |
| `unit32` | 128px |
| `unit36` | 144px |
| `unit40` | 160px |
| `unit64` | 256px |
| `unit80` | 320px |

> 참고: 변수값은 FLOAT 타입이며 "unit1=4px 기반 4의 배수" 체계로 추정. 실제 값은 Figma 변수 패널에서 최종 확인 필요.

#### 2. 현재 코드에서 JAMS 2.0 체계에 맞지 않는 spacing 값

| 현재 값 | 사용 위치 | 가장 가까운 JAMS 토큰 | 상태 |
|--------|-----------|---------------------|------|
| `11px` | header-top padding, search-input padding | 해당 없음 | 비표준 |
| `13px` | btn-outline padding | 해당 없음 | 비표준 |
| `14px` | toolbar-search padding, sidebar-title margin-bottom | 해당 없음 | 비표준 |
| `15px` | search-input padding, footer-notice-link padding-right | 해당 없음 | 비표준 |
| `19px` | sidebar-section padding | 해당 없음 | 비표준 |
| `20px` | search-region padding, sidebar padding-top, article-item padding, footer-ads/nav padding | unit5 (20px) 존재 여부 확인 필요 |
| `21px` | footer-notice padding | 해당 없음 | 비표준 |
| `23px` | footer-copyright padding | 해당 없음 | 비표준 |
| `30px` | main-wrapper gap, footer-copyright padding | 해당 없음 | 비표준 |
| `33px` | footer-nav gap | 해당 없음 | 비표준 |
| `34px` | main-wrapper padding-top | 해당 없음 | 비표준 |
| `36px` | ad-sidebar margin-top | unit36 (144px)? 값 불일치 | 비표준 |
| `92px` | main-wrapper padding-bottom | 해당 없음 | 비표준 |

#### 3. JAMS 2.0 체계에 부합할 가능성이 있는 spacing 값

| 현재 값 | 사용 위치 | JAMS 토큰 |
|--------|-----------|----------|
| `0px` | 여러 곳 | `unit0` |
| `2px` | suggest-tags margin-top, toolbar-sort padding | `unit0.5`? 확인 필요 |
| `3px` | views gap | 비표준 |
| `4px` | search-region gap, btn-outline gap, toolbar-sort gap, pagination gap | `unit1` |
| `6px` | featured-card-meta gap, article-desc margin-top, suggest-tags gap | 확인 필요 |
| `8px` | sidebar-links gap, featured-card-badge margin-bottom, featured-section-title gap, article-meta gap, social-icons gap, tabs gap | `unit2` |
| `10px` | sidebar-links padding-left, featured-card-title margin-bottom, tab padding, footer-ads gap, footer-contact gap | 확인 필요 |
| `12px` | header-right gap, article-meta margin-top, featured-card-rank position | 확인 필요 |
| `16px` | sidebar-section padding, featured-section-header margin-bottom, featured-cards gap, featured-card-body padding, article-list gap, toolbar padding | `unit4` |
| `24px` | article-item gap | `unit6` |
| `32px` | header-nav gap, featured-section margin-bottom | `unit8` |
| `40px` | pagination padding-top | `unit10` |

---

### Radius

#### 1. 현재 사용 중인 border-radius 값

| 현재 값 | 사용 위치 | JAMS 2.0 대응 |
|--------|-----------|--------------|
| `4px` | featured-card-badge, article-category-badge | 확인 필요 |
| `6px` | toolbar-sort-btn | 확인 필요 |
| `8px` | featured-card-rank, toolbar-sort | 확인 필요 |
| `10px` | btn-outline, page-num, page-next | 확인 필요 |
| `12px` | toolbar-search, article-thumb | 확인 필요 |
| `16px` | featured-card, article-item | 확인 필요 |
| `50%` (원형) | badge-new, dot-sep | 확인 필요 |
| `999px` (pill) | search-bar | 확인 필요 |

JAMS 2.0의 Radius 토큰 체계가 Figma에 정의되어 있으나, 구체적인 토큰명과 값은 Radius 전용 페이지에서 확인 필요. 현재 코드에서는 **6종의 서로 다른 px 기반 radius**가 비체계적으로 사용되고 있어 토큰 통합이 필요하다.

---

### Shadow

#### 1. 현재 사용 중인 box-shadow 값

| 현재 값 | 사용 위치 | 문제점 |
|--------|-----------|--------|
| `2px 2px 10px rgba(0,0,0,0.08)` | .header | 토큰 미사용, 인라인 정의 |
| `0 12px 24px rgba(0,0,0,0.08)` | .featured-card:hover | 토큰 미사용, 인라인 정의 |
| `0 1px 3px rgba(0,0,0,0.08)` | .toolbar-sort-btn.active | 토큰 미사용, 인라인 정의 |
| `0 0 0 3px rgba(0,87,255,0.1)` | .toolbar-search:focus-within | 포커스 링 - 토큰 미사용 |
| `0 4px 16px rgba(0,0,0,0.06)` | .article-item:hover | 토큰 미사용, 인라인 정의 |

JAMS 2.0은 `shadow` 컴포넌트 세트(JAMS Core 라이브러리)를 별도로 정의하고 있다. 현재 코드의 5개 shadow 값은 모두 인라인으로 정의되어 있으며, JAMS 2.0의 Shadow 레벨 체계(예: shadow-sm, shadow-md, shadow-lg 등)로 통합해야 한다.

---

### Components

#### 1. Tab 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| 구현 방식 | `div.tab` 커스텀 구현 | JAMS Core `Tab` 컴포넌트 존재 |
| 활성 표시 | `border-bottom: 2px solid` + 색상 변경 | JAMS Tab 컴포넌트 규격 확인 필요 |
| 폰트 | 15px / 600 weight | JAMS Tab 규격 확인 필요 |
| 간격 | `gap: 8px` | JAMS Tab 규격 확인 필요 |
| 컨테이너 | `border-bottom: 2px solid var(--color-grey-91)` | JAMS Tab 구분선 규격 확인 필요 |

#### 2. Button 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| `.btn-outline` | height 42px, radius 10px, border 1px solid, 14px font | JAMS Button 컴포넌트 규격과 대조 필요 |
| `.toolbar-sort-btn` | 13px font, radius 6px, 커스텀 active 스타일 | JAMS ButtonFilterItem 또는 유사 컴포넌트 사용 권장 |

#### 3. Pagination 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| 구현 방식 | 커스텀 `.page-num` + `.page-next` | JAMS `ButtonPaginationCounter` + `ButtonPaginationArrow` 존재 |
| 크기 | 36x36px | JAMS 규격 확인 필요 |
| 활성 스타일 | `background: var(--color-grey-13)`, `color: white` | JAMS 규격 확인 필요 |
| Radius | 10px | JAMS 규격 확인 필요 |

#### 4. Card 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| `.featured-card` | 커스텀 카드 (radius 16px, border 1px) | JAMS `CardJob` 컴포넌트 대조 필요 |
| `.article-item` | 커스텀 리스트 카드 (radius 16px, border 1px) | JAMS `CardJobSection` 또는 리스트형 카드 대조 필요 |

#### 5. Tag/Badge 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| `.featured-card-badge` | 커스텀 (11px, 600 weight, radius 4px) | JAMS `Tag` 컴포넌트 규격 대조 필요 |
| `.article-category-badge` | 커스텀 (11px, 600 weight, radius 4px) | JAMS `Tag` 또는 `TagPosting` 컴포넌트 대조 필요 |

#### 6. SearchBar 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| `.search-bar` | 커스텀 (440px, 46px, radius 999px) | JAMS `SearchAll` 컴포넌트 규격 대조 필요 |
| `.toolbar-search` | 커스텀 (260px, 40px, radius 12px) | JAMS `TextField` 또는 `SearchAll` 대조 필요 |

#### 7. Header/GNB 컴포넌트
| 항목 | 현재 코드 | JAMS 2.0 기준 |
|------|----------|--------------|
| `.header` | 커스텀 sticky header | JAMS `PC GNB` + `Header` 컴포넌트 존재 |
| `.header-nav` | 커스텀 네비게이션 (18px bold, gap 32px) | JAMS Navigation 컴포넌트 규격 대조 필요 |

---

## 🟡 검토 필요

### Figma 변수 실제 값 확인 필요
- JAMS 2.0의 Spacing `unit` 변수들의 **실제 px 값**을 Figma 변수 패널에서 직접 확인 필요 (API에서 FLOAT 타입으로 확인되나 구체 값 미노출)
- Typography 토큰의 전체 목록 확인 필요 (현재 `H5 18 bold`, `B4 14 regular`만 확인됨)
- Radius 토큰의 전체 목록과 값 확인 필요
- Shadow 토큰의 레벨별 값 확인 필요

### 13px, 15px, 17px 폰트 사이즈
- JAMS 2.0 Typography 체계에 `13px`, `15px`, `17px`가 포함되는지 확인 필요
- 포함되지 않는다면 가장 가까운 토큰으로 마이그레이션 필요

### 컬러 토큰 매핑 테이블
- 현재 `--color-grey-XX` 시리즈(약 20개)를 JAMS 2.0의 시맨틱 토큰으로 매핑하는 테이블 작성 필요
- Azure/Blue/Red 계열 컬러의 JAMS 2.0 공식 값 확인 필요

### font-weight 600, 800 사용 적합성
- JAMS 2.0에서 `semi-bold(600)`, `extra-bold(800)` 사용 여부 확인 필요
- 확인된 weight는 `400(regular)`, `700(bold)`만 존재

### max-width 1200px 레이아웃
- JAMS 2.0 Breakpoint & Grid 체계에서 정의된 max-width 기준과 일치하는지 확인 필요

---

## 🟢 일치

### Font Family
- 현재 코드: `'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`
- JAMS 2.0: `font-family-typeface-basic` = Pretendard
- **일치** (폰트 패밀리는 동일)

### 기본 텍스트 색상
- 현재 코드: `body { color: var(--color-grey-20) }` = `#333333`
- JAMS 2.0: `--color-text-primary: #1A1A1E`
- 값은 다르나 패턴은 유사. 시맨틱 토큰 변경 시 값도 함께 조정 필요.

### CSS 변수 사용 패턴
- 대부분의 색상을 CSS 변수로 관리하고 있어 토큰 전환 시 마이그레이션이 용이함
- `:root`에 정의 후 참조하는 구조가 토큰 시스템 도입에 적합

### 4px 기반 Spacing 부분 일치
- `4px`, `8px`, `16px`, `24px`, `32px`, `40px` 등 4의 배수 값이 일부 사용되고 있어 JAMS 2.0 spacing 체계와 부분적으로 일치

---

## 다음 단계 권장사항

### 즉시 조치 (토큰 전문가 전달 사항)

1. **JAMS 2.0 토큰 실제 값 확보**
   - Figma 변수 패널에서 Typography 전체 스타일 토큰 목록과 값 추출
   - Spacing unit0~unit80의 실제 px 값 추출
   - Radius 토큰 목록과 값 추출
   - Shadow 레벨별 정의 추출
   - Color 시맨틱 토큰 전체 목록 추출

2. **CSS 변수 네이밍 리팩토링**
   - 현재 `--color-grey-XX` 체계 → JAMS 2.0 시맨틱 토큰 네이밍으로 전환
   - 매핑 테이블 작성: `--color-grey-11` → `--color-text-primary` 등

3. **하드코딩 색상 토큰화**
   - `#FFF0F0`, `#FF4D4F`, `#F0F5FF`, `rgba(...)` 등 6건의 하드코딩 색상을 CSS 변수로 정의

4. **Typography 토큰 시스템 적용**
   - JAMS 2.0의 H1~H6, B1~B5 등 타이포 스타일 토큰을 CSS 클래스 또는 변수로 정의
   - 비표준 font-size(13px, 15px, 17px)를 가장 가까운 토큰으로 조정

5. **Spacing 토큰 적용**
   - 비표준 spacing 값(11px, 13px, 14px, 15px, 19px, 21px, 23px, 33px, 34px, 92px)을 가장 가까운 JAMS unit 토큰으로 조정

6. **Shadow 토큰 체계화**
   - 5개의 인라인 shadow 정의를 JAMS 2.0의 Shadow 레벨 토큰으로 교체

7. **컴포넌트 규격 대조**
   - Tab, Button, Pagination, Card, Tag, SearchBar, Header 등 주요 컴포넌트의 JAMS 2.0 규격과 상세 대조 후 규격에 맞게 조정
