(function(){
  'use strict';

  /* ============ 더미 공고 ============ */
  // 온보딩에서 고른 하는 일·기간·지역·재택에 맞춰 완료 화면 공고 목록을 만든다. (내부 UT용 더미 데이터)
  // b: 회사·브랜드, br: 지점명 붙이기, t: 제목({점} 지점명 · {구} 구 이름), p: [급여 형태, 금액], h: 근무시간, d: 근무요일, pr: 기간
  // q: 바로채용, ad: 광고, img: 썸네일
  // 근무지가 고정된 장소(전시장·테마파크 등)는 고른 지역과 어긋나 보이므로 회사 이름에 장소를 넣지 않는다.
  var POSTINGS = {
    cafe: [
      { b: '스타벅스', br: true, t: '스타벅스 {점} 바리스타 모집', p: ['시급', 11250], h: '시간협의', d: '요일협의', pr: '1년이상', img: 'assets/home/card-starbucks.png' },
      { b: '메가MGC커피', br: true, t: '메가커피 {점} 평일 오픈 파트타이머 구해요', p: ['시급', 10500], h: '07:00~12:00', d: '월~금', pr: '6개월~1년', q: true },
      { b: '㈜이디야', ad: true, t: '[이디야커피] 직영점 정규직 바리스타 채용', p: ['월급', 2160000], h: '시간협의', d: '주 5일', pr: '1년이상' },
      { b: '투썸플레이스', br: true, t: '투썸플레이스 {점} 마감 스태프 (초보 가능)', p: ['시급', 10800], h: '17:00~23:00', d: '주 3일', pr: '3개월~6개월' },
      { b: '컴포즈커피', br: true, t: '컴포즈커피 {점} 바리스타 알바', p: ['시급', 10320], h: '12:00~18:00', d: '월~금', pr: '1년이상' },
      { b: '파리바게뜨', br: true, t: '파리바게뜨 {점} 매장 판매·포장 스태프', p: ['시급', 10500], h: '08:00~14:00', d: '주 5일', pr: '6개월~1년' },
      { b: '에스프레소코아', t: '에스프레소코아 바리스타 모집', p: ['시급', 10320], h: '07:00~14:00', d: '주 4일', pr: '6개월~1년', img: 'assets/home/card-espressocore.jpg' },
      { b: '배스킨라빈스', br: true, t: '배스킨라빈스 {점} 저녁 파트너 모집', p: ['시급', 10320], h: '18:00~22:00', d: '주 3일', pr: '3개월~6개월' }
    ],
    serving: [
      { b: '아웃백스테이크하우스', br: true, ad: true, t: '아웃백 {점} 홀 서빙 크루 모집', p: ['시급', 11000], h: '17:00~22:00', d: '주 3일', pr: '6개월~1년' },
      { b: '애슐리퀸즈', br: true, t: '애슐리퀸즈 {점} 주말 홀 스태프', p: ['시급', 10800], h: '11:00~20:00', d: '토,일', pr: '3개월~6개월' },
      { b: '교촌치킨', br: true, t: '교촌치킨 {점} 홀·포장 아르바이트', p: ['시급', 10500], h: '18:00~23:00', d: '주 4일', pr: '6개월~1년' },
      { b: '새마을식당', br: true, t: '새마을식당 {점} 점심 홀서빙', p: ['시급', 10500], h: '11:00~15:00', d: '월~금', pr: '1년이상' },
      { b: ['오늘도한식뷔페', '풍년한식뷔페', '엄마손한식뷔페'], t: '한식뷔페 홀서빙 구합니다 (주휴수당 지급)', p: ['시급', 10320], h: '10:30~15:30', d: '월~금', pr: '1년이상' },
      { b: '한신포차', br: true, q: true, t: '한신포차 {점} 주말 대타 서빙 (식사 제공)', p: ['시급', 12000], h: '19:00~02:00', d: '금,토', pr: '1주일이하' },
      { b: ['㈜연회플러스', '㈜그랜드연회'], t: '호텔 연회장 하루 서빙 (당일 지급)', p: ['일급', 120000], h: '10:00~19:00', d: '토', pr: '1일' },
      { b: '애슐리퀸즈', br: true, t: '애슐리퀸즈 {점} 연말 단기 홀서빙', p: ['시급', 11000], h: '17:00~22:00', d: '주 4일', pr: '1주일~1개월' }
    ],
    cooking: [
      { b: '맥도날드', br: true, ad: true, t: '맥도날드 {점} 크루 모집 (주방·카운터)', p: ['시급', 10500], h: '시간협의', d: '요일협의', pr: '6개월~1년' },
      { b: '롯데리아', br: true, t: '롯데리아 {점} 주방 크루', p: ['시급', 10320], h: '10:00~16:00', d: '주 5일', pr: '3개월~6개월' },
      { b: '본죽&비빔밥', br: true, t: '본죽 {점} 주방보조 (경력 무관)', p: ['시급', 10500], h: '09:00~15:00', d: '월~금', pr: '1년이상' },
      { b: '김밥천국', br: true, q: true, t: '김밥천국 {점} 아침 김밥 말이·주방보조', p: ['시급', 10320], h: '06:00~11:00', d: '월~토', pr: '1년이상' },
      { b: '써브웨이', br: true, t: '써브웨이 {점} 샌드위치 아티스트', p: ['시급', 10320], h: '11:00~17:00', d: '주 4일', pr: '6개월~1년' },
      { b: ['온기도시락', '바른도시락', '든든도시락'], t: '도시락 조리·포장 스태프 (오전)', p: ['시급', 11000], h: '07:00~13:00', d: '월~금', pr: '3개월~6개월' }
    ],
    'shopping-bag': [
      { b: 'CU', br: true, t: 'CU {점} 평일 오후 근무자 구해요', p: ['시급', 10320], h: '14:00~22:00', d: '월~금', pr: '6개월~1년' },
      { b: 'GS25', br: true, q: true, t: 'GS25 {점} 주말 야간 알바', p: ['시급', 11500], h: '22:00~08:00', d: '토,일', pr: '3개월~6개월' },
      { b: '올리브영', br: true, ad: true, t: '올리브영 {점} 매장 스태프 채용', p: ['시급', 10500], h: '시간협의', d: '주 4일', pr: '1년이상' },
      { b: '다이소', br: true, t: '다이소 {점} 상품 진열·계산', p: ['시급', 10320], h: '10:00~16:00', d: '월~금', pr: '6개월~1년' },
      { b: '세븐일레븐', br: true, t: '세븐일레븐 {점} 오전 근무 (초보 가능)', p: ['시급', 10320], h: '07:00~13:00', d: '주 5일', pr: '1년이상' },
      { b: '무신사 스탠다드', br: true, t: '무신사 스탠다드 {점} 매장 판매', p: ['시급', 11000], h: '12:00~21:00', d: '주 3일', pr: '3개월~6개월' },
      { b: 'GS25', br: true, t: 'GS25 {점} 단기 대타 근무자 (1주일)', p: ['시급', 10500], h: '18:00~23:00', d: '요일협의', pr: '1주일이하' },
      { b: '다이소', br: true, q: true, t: '다이소 {점} 하루 재고조사 (당일 지급)', p: ['일급', 110000], h: '20:00~05:00', d: '일', pr: '1일' },
      { b: '올리브영', br: true, t: '올리브영 {점} 올영세일 단기 스태프', p: ['시급', 11000], h: '11:00~20:00', d: '주 5일', pr: '1주일~1개월' }
    ],
    'delivery-box': [
      { b: '쿠팡', ad: true, q: true, t: '[쿠팡] {구} 물류센터 상품 분류·포장 (일급)', p: ['일급', 120000], h: '09:00~18:00', d: '요일협의', pr: '1일' },
      { b: ['CJ대한통운', '한진택배', '로젠택배'], t: '{구} 서브터미널 상하차', p: ['일급', 140000], h: '20:00~04:00', d: '주 3일', pr: '1주일~1개월' },
      { b: ['롯데글로벌로지스', 'CJ대한통운'], t: '{구} 택배 터미널 간선 하차 (당일)', p: ['일급', 130000], h: '19:00~03:00', d: '요일협의', pr: '1일' },
      { b: ['컬리', 'SSG닷컴', '오아시스마켓'], t: '컬리 새벽배송 상품 검수·포장', p: ['시급', 12500], h: '22:00~06:00', d: '주 4일', pr: '1개월~3개월' },
      { b: '한진택배', br: true, t: '한진택배 {점} 대리점 오전 택배 분류', p: ['시급', 11000], h: '06:00~10:00', d: '월~토', pr: '6개월~1년' },
      { b: '배민 B마트', br: true, t: 'B마트 {점} 상품 피킹·패킹', p: ['시급', 11500], h: '16:00~22:00', d: '주 3일', pr: '3개월~6개월' },
      { b: '쿠팡', t: '[쿠팡] {구} 캠프 배송 보조 (주말 단기)', p: ['일급', 125000], h: '08:00~17:00', d: '토,일', pr: '1주일이하' }
    ],
    factory: [
      { b: ['CJ제일제당 협력사', '풀무원 협력사', '대상 협력사'], ad: true, t: '식품 공장 포장·검수 (주 5일)', p: ['시급', 11000], h: '08:30~17:30', d: '월~금', pr: '1개월~3개월' },
      { b: ['SPC삼립 협력사', '뚜레쥬르 협력사'], t: '제빵 공장 포장 라인 단기 근무', p: ['일급', 110000], h: '08:00~17:00', d: '요일협의', pr: '1주일~1개월' },
      { b: ['㈜한빛전자', '㈜대성정밀', '㈜미래테크'], t: '전자부품 조립·검수 (초보 가능)', p: ['시급', 10500], h: '09:00~18:00', d: '월~금', pr: '6개월~1년' },
      { b: ['오뚜기 협력사', '농심 협력사', '동원F&B 협력사'], q: true, t: '식품 생산직 하루 알바 (당일 지급)', p: ['일급', 105000], h: '08:00~17:00', d: '요일협의', pr: '1일' },
      { b: ['㈜세움패키징', '㈜한결패키지', '㈜뷰티팩'], t: '화장품 포장·라벨 작업', p: ['시급', 10320], h: '09:00~18:00', d: '월~금', pr: '3개월~6개월' },
      { b: ['아모레퍼시픽 협력사', 'LG생활건강 협력사'], t: '화장품 기획세트 조립 (단기)', p: ['시급', 11000], h: '09:00~18:00', d: '월~금', pr: '1주일이하' }
    ],
    security: [
      { b: ['에스원', 'KT텔레캅', 'ADT캡스'], t: '{구} 오피스 빌딩 보안요원', p: ['월급', 2350000], h: '07:00~19:00', d: '격일', pr: '6개월~1년' },
      { b: ['㈜한결빌딩관리', '㈜세방빌딩관리', '㈜두레빌딩관리'], t: '오피스 빌딩 미화원 (오전)', p: ['시급', 10500], h: '06:00~10:00', d: '월~금', pr: '1년이상' },
      { b: ['㈜클린위크', '㈜행사클린'], ad: true, t: '전시장 행사 청소 스태프 (주말 단기)', p: ['일급', 100000], h: '09:00~18:00', d: '토,일', pr: '1주일이하' },
      { b: ['KT텔레캅 협력사', '㈜우리경비'], t: '아파트 야간 경비원', p: ['월급', 2200000], h: '18:00~07:00', d: '격일', pr: '1년이상' },
      { b: ['깨끗한하루', '㈜청소의신', '홈스토리생활'], q: true, t: '오피스텔 입주 청소 (일당)', p: ['일급', 120000], h: '09:00~17:00', d: '요일협의', pr: '1일' },
      { b: 'CGV', br: true, t: 'CGV {점} 극장 미화 단기 스태프', p: ['시급', 10320], h: '시간협의', d: '주 3일', pr: '1주일~1개월' }
    ],
    promotion: [
      { b: '이마트', br: true, ad: true, t: '이마트 {점} 주말 시식 행사 스태프', p: ['일급', 110000], h: '10:00~19:00', d: '토,일', pr: '1주일이하' },
      { b: '롯데백화점', br: true, q: true, t: '롯데백화점 {점} 팝업스토어 판매 (3일)', p: ['일급', 120000], h: '10:30~20:00', d: '요일협의', pr: '1주일이하' },
      { b: ['㈜엑스포서비스', '㈜이벤트앤'], t: '박람회 등록 데스크·관람객 모객', p: ['일급', 130000], h: '08:30~18:00', d: '요일협의', pr: '1일' },
      { b: '올리브영', br: true, t: '올리브영 {점} 신제품 체험 행사 진행', p: ['시급', 12000], h: '12:00~20:00', d: '주 5일', pr: '1주일~1개월' },
      { b: ['㈜이벤트플러스', '㈜홍보나라'], t: '아파트 단지 전단지 배포 (오전)', p: ['시급', 11000], h: '09:00~13:00', d: '요일협의', pr: '1일' },
      { b: '현대백화점', br: true, t: '현대백화점 {점} 브랜드 런칭 행사 스태프', p: ['일급', 140000], h: '09:00~19:00', d: '요일협의', pr: '1일' }
    ],
    info: [
      { b: '롯데백화점', br: true, t: '롯데백화점 {점} 안내데스크 단기 근무', p: ['시급', 11000], h: '10:30~20:00', d: '주 5일', pr: '1주일~1개월' },
      { b: '신세계백화점', br: true, t: '신세계백화점 {점} 사은행사 안내', p: ['일급', 115000], h: '10:00~19:00', d: '토,일', pr: '1주일이하' },
      { b: ['㈜엑스포서비스', '㈜컨벤션원'], ad: true, t: '전시회 안내·운영 스태프', p: ['일급', 120000], h: '09:00~18:00', d: '요일협의', pr: '1주일이하' },
      { b: ['㈜전시운영파트너스', '㈜모터쇼스태프'], t: '모터쇼 관람객 안내 (단기)', p: ['일급', 125000], h: '09:00~19:00', d: '주 5일', pr: '1주일~1개월' },
      { b: ['㈜뮤지엄서비스', '㈜아트가이드'], t: '특별전 관람 안내·검표', p: ['시급', 11000], h: '10:00~18:00', d: '주 4일', pr: '1주일~1개월' },
      { b: ['㈜마이스스태프', '㈜행사365'], q: true, t: '박람회 출입 안내 데스크 (당일)', p: ['일급', 110000], h: '09:00~18:00', d: '요일협의', pr: '1일' },
      { b: ['㈜아트앤뮤지엄', '㈜디자인스페이스'], t: '디자인 전시 도슨트 보조', p: ['시급', 12000], h: '13:00~20:00', d: '주 3일', pr: '1주일이하' }
    ],
    'staff-badge': [
      { b: '롯데시네마', br: true, ad: true, t: '롯데시네마 {점} 영화관 크루', p: ['시급', 10500], h: '시간협의', d: '주 4일', pr: '6개월~1년' },
      { b: 'CGV', br: true, t: 'CGV {점} 매점·검표 미소지기', p: ['시급', 10320], h: '시간협의', d: '주 3일', pr: '3개월~6개월' },
      { b: '메가박스', br: true, t: '메가박스 {점} 영화관 스태프', p: ['시급', 10320], h: '17:00~23:00', d: '주 3일', pr: '6개월~1년' },
      { b: ['라온웨딩홀', '더베뉴웨딩홀', '루체웨딩홀'], t: '웨딩홀 리셉션·하객 안내 (주말)', p: ['일급', 100000], h: '10:00~18:00', d: '토,일', pr: '6개월~1년' },
      { b: ['㈜스타트이벤트', '㈜이벤트앤'], t: '기업 행사 진행 고정 스태프', p: ['시급', 12000], h: '시간협의', d: '요일협의', pr: '3개월~6개월' },
      { b: ['㈜호텔앤연회', '㈜그랜드연회'], t: '호텔 연회장 안내·서빙', p: ['시급', 12500], h: '17:00~23:00', d: '금,토,일', pr: '1개월~3개월' }
    ],
    office: [
      { b: ['㈜한빛물류', '㈜동방로지스'], t: '물류회사 배차·전산 사무보조', p: ['시급', 11000], h: '09:00~18:00', d: '월~금', pr: '3개월~6개월' },
      { b: ['㈜스마트렌탈', '㈜케어렌탈'], t: '렌탈 계약서 검수·전산 입력', p: ['월급', 2200000], h: '09:00~18:00', d: '월~금', pr: '1년이상' },
      { b: ['㈜온담세무회계', '하나세무회계', '㈜정음세무법인'], t: '세무사무소 사무보조 (엑셀 가능자)', p: ['시급', 11000], h: '10:00~17:00', d: '월~금', pr: '6개월~1년' },
      { b: ['㈜메디스탭', '㈜헬스케어파트너스'], ad: true, t: '대학병원 원무과 사무보조', p: ['시급', 11500], h: '09:00~18:00', d: '월~금', pr: '3개월~6개월' },
      { b: ['㈜브릿지랩', '㈜넥스트웨이브', '㈜플립컴퍼니'], t: '스타트업 문서 작성·자료 정리', p: ['시급', 12000], h: '13:00~18:00', d: '주 3일', pr: '3개월~6개월' },
      { b: ['㈜대한물산', '㈜세진산업', '㈜우리유통'], t: '사무실 전화응대·데이터 입력', p: ['시급', 10500], h: '09:00~18:00', d: '월~금', pr: '1년이상' },
      { b: ['법무법인 한빛', '법무법인 서정', '㈜정원특허사무소'], t: '서류 정리·스캔 보조', p: ['시급', 11000], h: '10:00~16:00', d: '월~금', pr: '6개월~1년' }
    ],
    education: [
      { b: '해커스어학원', br: true, t: '해커스어학원 {점} 상담 데스크', p: ['시급', 10800], h: '14:00~22:00', d: '주 3일', pr: '6개월~1년' },
      { b: ['대교 눈높이', '구몬학습', '재능교육'], t: '{구} 학습지 채점·관리 보조', p: ['시급', 10800], h: '15:00~19:00', d: '월~금', pr: '6개월~1년' },
      { b: '해커스어학원', br: true, ad: true, t: '해커스어학원 {점} 강의 조교', p: ['시급', 11000], h: '시간협의', d: '주 3일', pr: '3개월~6개월' },
      { b: ['정상수학학원', '깊은생각수학', '시매쓰'], t: '초·중등 수학 채점·질의응답 조교', p: ['시급', 12000], h: '16:00~22:00', d: '주 4일', pr: '6개월~1년' },
      { b: ['웅진씽크빅', '윤선생 영어교실', '튼튼영어'], t: '방과후 학습 지도 보조 선생님', p: ['시급', 11500], h: '14:00~18:00', d: '월~금', pr: '1년이상' },
      { b: ['리틀영어어학원', '청담어학원', '아발론랩'], q: true, t: '영어학원 데스크·셔틀 동승', p: ['시급', 10500], h: '14:00~20:00', d: '월~금', pr: '6개월~1년' }
    ],
    'customer-service': [
      { b: ['㈜하이마트서비스', '㈜홈케어서비스'], t: '가전 A/S 접수 상담 (주 4일)', p: ['시급', 11500], h: '09:00~18:00', d: '주 4일', pr: '6개월~1년' },
      { b: ['KT CS', 'KT IS'], ad: true, t: '통신사 고객센터 인바운드 상담 (교육 후 근무)', p: ['월급', 2300000], h: '09:00~18:00', d: '월~금', pr: '1년이상' },
      { b: '쿠팡 CS', t: '쿠팡 고객센터 채팅 상담원', p: ['시급', 11500], h: '시간협의', d: '주 4일', pr: '6개월~1년' },
      { b: ['LG유플러스 고객센터', 'SK브로드밴드 고객센터'], t: '인터넷·TV 주간 상담원', p: ['월급', 2250000], h: '09:00~18:00', d: '월~금', pr: '1년이상' },
      { b: ['㈜씨앤케어', '㈜한국코퍼레이션', '㈜유베이스'], t: '카드사 해피콜 (단순 안내)', p: ['시급', 11000], h: '10:00~16:00', d: '월~금', pr: '3개월~6개월' },
      { b: ['배달의민족 고객센터', '요기요 고객센터'], t: '라이더 상담 채팅 (야간)', p: ['시급', 13000], h: '22:00~07:00', d: '주 3일', pr: '6개월~1년' }
    ]
  };
  // 재택 포함을 골랐을 때 끼워 넣는 공고
  var REMOTE = [
    { b: '㈜씨앤케어', t: '[재택] 쇼핑몰 채팅 상담', p: ['시급', 11000], h: '시간협의', d: '주 3일', pr: '3개월~6개월' },
    { b: '㈜데이터온', t: '[재택] 상품 정보 데이터 입력 (초보 가능)', p: ['시급', 10500], h: '시간협의', d: '요일협의', pr: '1개월~3개월' },
    { b: '㈜브릿지랩', t: '[재택] 영상 자막 검수', p: ['건별', 15000], h: '시간협의', d: '요일협의', pr: '1주일~1개월' }
  ];
  var SHORT = { '1일': 1, '1주일이하': 1, '1주일~1개월': 1 };
  var TARGET = 20;

  // 공고 상세(공고뷰)에 쓰는 하는 일별 문구
  var META = {
    cafe: { kind: '바리스타, 카페 음료 제조·판매', welfare: '식사 제공, 음료 제공, 주휴수당, 장기근무 시 인센티브', prefer: '유사업무 경험 우대, 인근 거주 우대, 장기 근무 가능자 우대', duties: ['음료 제조 및 주문 응대', '디저트 진열·포장', '매장 청결 관리 및 마감 정리'], tags: ['#초보가능', '#음료제조', '#매장근무'] },
    serving: { kind: '서빙, 홀 관리, 주문 응대', welfare: '식사 제공, 주휴수당, 연장근로수당', prefer: '유사업무 경험 우대, 친구와 함께 근무 가능, 인근 거주 우대', duties: ['홀 서빙 및 주문 응대', '테이블 세팅·정리', '마감 청소'], tags: ['#식사제공', '#초보가능', '#친구랑근무'] },
    cooking: { kind: '주방보조, 조리, 설거지', welfare: '식사 제공, 주휴수당, 위생복 지급', prefer: '조리 경험 우대, 장기 근무 가능자 우대', duties: ['식재료 손질 및 조리 보조', '설거지 및 주방 정리', '주방 위생 관리'], tags: ['#주방보조', '#식사제공', '#초보가능'] },
    'shopping-bag': { kind: '매장관리, 판매, 계산', welfare: '주휴수당, 직원 할인, 4대보험(주 15시간 이상)', prefer: '유사업무 경험 우대, 인근 거주 우대, 대학 재학생 우대', duties: ['계산 및 고객 응대', '상품 진열·재고 정리', '매장 청소'], tags: ['#매장근무', '#초보가능', '#직원할인'] },
    'delivery-box': { kind: '입출고·창고관리, 물류 피킹·포장, 상하차', welfare: '고용보험, 산재보험, 야간근로수당, 통근버스 운행, 주차 가능', prefer: '운전 가능, 유사업무 경험 우대, 친구와 함께 근무 가능', duties: ['상품 분류 및 포장', '입출고 검수', '상하차 보조'], tags: ['#초보가능', '#동반근무', '#당일지급'] },
    factory: { kind: '생산, 포장, 검수', welfare: '중식 제공, 통근버스 운행, 연장근로수당, 고용보험', prefer: '유사업무 경험 우대, 장기 근무 가능자 우대', duties: ['제품 포장 및 라벨 작업', '생산 라인 보조', '완제품 검수'], tags: ['#초보가능', '#단순작업', '#통근버스'] },
    security: { kind: '경비, 보안, 청소·미화', welfare: '4대보험, 휴게시간 보장, 근무복 지급', prefer: '유사업무 경험 우대, 인근 거주 우대', duties: ['출입 관리 및 순찰', '시설 점검', '공용 공간 청소·미화'], tags: ['#경력무관', '#근무복지급', '#인근거주'] },
    promotion: { kind: '행사보조, 판촉, 시식', welfare: '당일 지급, 식대 지원, 교통비 지원', prefer: '유사업무 경험 우대, 밝은 성격 우대, 친구와 함께 근무 가능', duties: ['행사 부스 운영 및 고객 응대', '시식·샘플 배포', '행사 준비 및 정리'], tags: ['#단기알바', '#당일지급', '#친구랑근무'] },
    info: { kind: '전시·컨벤션 안내, 안내데스크', welfare: '식대 지원, 교통비 지원, 유니폼 지급', prefer: '외국어 가능자 우대, 유사업무 경험 우대', duties: ['관람객 안내 및 동선 관리', '등록 데스크 운영', '행사장 정리'], tags: ['#전시알바', '#유니폼지급', '#단기알바'] },
    'staff-badge': { kind: '행사 진행, 안내, 리셉션', welfare: '식사 제공, 주휴수당, 유니폼 지급', prefer: '유사업무 경험 우대, 주말 근무 가능자 우대', duties: ['고객 안내 및 응대', '행사 진행 보조', '매표·검표'], tags: ['#주말알바', '#유니폼지급', '#초보가능'] },
    office: { kind: '사무보조, 문서작성, 데이터 입력', welfare: '4대보험, 중식 제공, 주휴수당', prefer: '엑셀 가능자 우대, 유사업무 경험 우대, 대학 재학생 우대', duties: ['문서 작성 및 자료 정리', '전화 응대', '데이터 입력'], tags: ['#사무보조', '#엑셀', '#주5일'] },
    education: { kind: '학원 조교, 채점, 학습 지도', welfare: '주휴수당, 교재 제공, 장기근무 시 시급 인상', prefer: '관련 전공 우대, 대학 재학생 우대, 유사업무 경험 우대', duties: ['채점 및 오답 관리', '학생 질의응답', '수업 준비 보조'], tags: ['#학원알바', '#대학생', '#조교'] },
    'customer-service': { kind: '고객상담, 인바운드, 채팅상담', welfare: '4대보험, 교육비 지급, 인센티브, 주휴수당', prefer: '상담 경험 우대, 타자 능숙자 우대', duties: ['고객 문의 응대(전화·채팅)', '상담 내용 기록', '간단한 안내 업무'], tags: ['#상담', '#교육제공', '#인센티브'] },
    remote: { kind: '재택근무, 데이터 입력, 상담', welfare: '재택근무, 업무 장비 대여, 주휴수당', prefer: 'PC 사용 능숙자 우대, 유사업무 경험 우대', duties: ['온라인 업무 처리', '결과 보고 및 검수', '담당자와 메신저 소통'], tags: ['#재택근무', '#부업', '#시간자유'] }
  };
  var LOGOS = { '쿠팡': 'assets/detail/logo-coupang.png' };
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  /* ============ 도우미 ============ */
  function hash(str){
    var h = 2166136261;
    for (var i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // 같은 조건이면 늘 같은 목록이 나오도록 시드 난수를 쓴다.
  function rng(seed){
    return function(){
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rand){
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--){
      var j = Math.floor(rand() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  // 서초동 → 서초, 태평로1가 → 태평로, 명동 → 명동
  function branchBase(dong){
    var b = String(dong || '').replace(/\d*가$/, '').replace(/\d*(동|읍|면|리)$/, '');
    return b.length >= 2 ? b : dong;
  }
  // 서울 강남구 테헤란로 212 → 테헤란로, 선릉로93길 → 선릉로 (골목 이름은 지점명으로 어색해서 큰길로 줄인다)
  function roadName(road){
    var parts = String(road || '').split(' ');
    for (var i = 0; i < parts.length; i++){
      var m = parts[i].match(/^(.+?(대로|로))(\d+(번)?길)?$/);
      if (m) return m[1];
      if (/길$/.test(parts[i])) return '';
    }
    return '';
  }
  // 서초구 → 서초, 성남시 분당구 → 분당, 중구 → 중구
  function guBase(gu){
    var last = String(gu || '').split(' ').pop();
    var b = last.replace(/(구|시|군)$/, '');
    return b.length >= 2 ? b : last;
  }

  /* ============ 근무지 동 뽑기 ============ */
  // 내 근처는 반경 안, 지역 선택은 고른 구 안에서 좌표를 뽑아 실제 동 이름을 받아온다.
  var cache = {};
  function regionKey(s){
    if (s.mode === 'nearby') return 'n|' + s.place.lat.toFixed(4) + ',' + s.place.lng.toFixed(4) + '|' + s.radius;
    return 'l|' + s.selected.slice(0, 3).join(',');
  }
  function fallbackPlaces(s){
    if (s.mode === 'nearby'){
      var sido = s.place.sido || String(s.place.address || '').split(' ')[0] || '서울';
      return [{ sido: sido, gu: s.place.gu || '', dong: s.place.dong || '' }];
    }
    var keys = s.selected.length ? s.selected : ['서울|서초구'];
    return keys.slice(0, 3).map(function(k){
      var p = k.split('|');
      return { sido: p[0], gu: p[1] === '*' ? '' : p[1], dong: '' };
    });
  }
  function geo(){ return window.kakaoGeo; }

  function interleave(list){
    var groups = {};
    var order = [];
    list.forEach(function(r){
      if (!groups[r.gu]){ groups[r.gu] = []; order.push(r.gu); }
      groups[r.gu].push(r);
    });
    var out = [];
    for (var i = 0; out.length < list.length; i++){
      order.forEach(function(g){ if (groups[g][i]) out.push(groups[g][i]); });
    }
    return out;
  }

  function centersFor(s){
    if (s.mode === 'nearby'){
      return Promise.resolve([{ lat: s.place.lat, lng: s.place.lng, r: s.radius * 1000 * .85, gu: null, n: 9 }]);
    }
    var keys = (s.selected.length ? s.selected : ['서울|서초구']).slice(0, 3);
    var per = keys.length === 1 ? 20 : 14;
    return Promise.all(keys.map(function(k){
      var p = k.split('|');
      var all = p[1] === '*';
      var query = all ? p[0] : p[0] + ' ' + p[1];
      return geo().search(query).then(function(c){
        return c ? { lat: c.lat, lng: c.lng, r: all ? 9000 : 3000, gu: all ? null : p[1], sido: p[0], n: per } : null;
      });
    })).then(function(list){ return list.filter(Boolean); });
  }

  function samplePlaces(s){
    var key = regionKey(s);
    if (cache[key]) return Promise.resolve(cache[key]);
    if (!geo()) return Promise.resolve(fallbackPlaces(s));
    var rand = rng(hash(key));
    return geo().ready().then(function(){ return centersFor(s); }).then(function(centers){
      var jobs = [];
      centers.forEach(function(c){
        for (var i = 0; i < c.n; i++){
          var ang = rand() * Math.PI * 2;
          var dist = Math.sqrt(rand()) * c.r;
          var lat = c.lat + (dist * Math.cos(ang)) / 111320;
          var lng = c.lng + (dist * Math.sin(ang)) / (111320 * Math.cos(c.lat * Math.PI / 180));
          jobs.push(geo().region(lat, lng).then(function(c0){ return function(r){ return r && (!c0.gu || r.gu === c0.gu) ? r : null; }; }(c)));
        }
      });
      // 내 근처는 고른 위치의 동을 맨 앞에 둔다.
      if (s.mode === 'nearby') jobs.unshift(geo().region(s.place.lat, s.place.lng));
      return Promise.all(jobs);
    }).then(function(found){
      var seen = {};
      var out = found.filter(function(r){
        if (!r || !r.dong) return false;
        // 같은 동이라도 도로가 다르면 다른 지점으로 쓴다(반경이 좁을 때 지점명이 겹치지 않게).
        r.roadName = roadName(r.road);
        var k = r.gu + '|' + r.dong + '|' + r.roadName;
        if (seen[k]) return false;
        seen[k] = true;
        return true;
      });
      if (!out.length) out = fallbackPlaces(s);
      // 지역 선택은 고른 구를 번갈아 쓴다(첫 공고는 첫 번째로 고른 구).
      if (s.mode !== 'nearby') out = interleave(out);
      cache[key] = out;
      return out;
    }).catch(function(){ return fallbackPlaces(s); });
  }

  /* ============ 목록 만들기 ============ */
  function condKey(s){
    return [regionKey(s), s.jobs.join(','), s.period, s.remote ? 'r' : ''].join('#');
  }
  function fits(post, period){
    if (period === 'within-month') return !!SHORT[post.pr];
    if (period === 'over-month') return !SHORT[post.pr];
    return true;
  }
  function payText(p){ return p[1].toLocaleString('ko-KR') + '원'; }

  function makeCard(post, job, place, index, n){
    var name = Array.isArray(post.b) ? post.b[n % post.b.length] : post.b;
    // 같은 프랜차이즈를 다시 쓸 때는 도로명으로 지점명을 붙인다(스타벅스 역삼점 → 스타벅스 테헤란로점).
    var base = n % 2 === 1 && place.roadName ? place.roadName : branchBase(place.dong || guBase(place.gu));
    var branchName = base + '점';
    var gu = guBase(place.gu || '');
    var title = post.t.replace('{점}', branchName).replace('{구}', gu || base);
    var location = post.remote ? '재택근무' : [place.sido, place.gu, place.dong].filter(Boolean).join(' ');
    return {
      id: job + ':' + index,
      job: job,
      company: post.br ? name + ' ' + base : name,
      ad: !!post.ad,
      title: title,
      location: location,
      period: post.pr,
      time: post.h,
      days: post.d,
      payType: post.p[0],
      pay: payText(post.p),
      quick: !!post.q,
      thumb: post.img || null,
      remote: !!post.remote,
      brand: post.br ? name : null,
      logo: LOGOS[name] || null,
      address: post.remote ? '재택근무' : (place.road || location)
    };
  }

  function pad2(n){ return (n < 10 ? '0' : '') + n; }
  function pick(list, rand){ return list[Math.floor(rand() * list.length)]; }

  // 공고 상세에 필요한 값을 덧붙인다. (등록일·마감·해시태그·신뢰 칩·근무·모집 조건·상세요강)
  function addDetail(c, i, rand){
    var meta = META[c.remote ? 'remote' : c.job] || META.cafe;
    var now = new Date();
    var posted = new Date(now.getTime() - Math.floor(rand() * 72 + i) * 3600000 - Math.floor(rand() * 60) * 60000);
    var always = rand() < .3;
    var due = new Date(now.getTime() + Math.floor(5 + rand() * 16) * 86400000);
    var dueShort = pad2(due.getMonth() + 1) + '/' + pad2(due.getDate()) + '(' + WEEK[due.getDay()] + ')';

    var tags = meta.tags.slice(0, 2);
    if (c.period === '1일') tags.push('#하루알바');
    else if (SHORT[c.period]) tags.push('#단기알바');
    else if (/토|일/.test(c.days)) tags.push('#주말알바');
    else tags.push(meta.tags[2]);

    var chips = [];
    if (c.quick) chips.push('quick');
    if (rand() < .6) chips.push('cert');
    chips.push('contract');
    if (c.payType === '월급' || !SHORT[c.period] && rand() < .7) chips.push('insurance');
    if (rand() < .4) chips.push('edu');

    var employ = /정규직/.test(c.title) ? '정규직' : (c.payType === '월급' && c.job === 'security' ? '계약직' : '알바');
    var lines = ['[모집 업무]'].concat(meta.duties.map(function(d){ return '· ' + d; }), [
      '',
      '[근무 조건]',
      '· 근무요일: ' + c.days,
      '· 근무시간: ' + c.time,
      '· 급여: ' + c.payType + ' ' + c.pay + (c.payType === '시급' ? ' (주휴수당 별도)' : ''),
      '',
      '[지원 방법]',
      '· 알바몬 온라인 지원',
      '· 서류 합격자에 한해 개별 연락드립니다.'
    ]);

    c.detail = {
      posted: posted.getFullYear() + '.' + pad2(posted.getMonth() + 1) + '.' + pad2(posted.getDate()) + ' ' + pad2(posted.getHours()) + ':' + pad2(posted.getMinutes()),
      deadline: always ? '상시모집' : '~' + dueShort,
      closing: always ? '상시모집' : due.getFullYear() + '.' + pad2(due.getMonth() + 1) + '.' + pad2(due.getDate()) + '(' + WEEK[due.getDay()] + ')',
      tags: tags.join(' '),
      chips: chips,
      grayChips: ['설립' + Math.floor(3 + rand() * 22) + '년차'].concat(rand() < .5 ? ['급여명세서'] : []),
      kind: meta.kind,
      employ: employ,
      welfare: meta.welfare,
      headcount: pick(['1명', '2명', '3명', '5명', '00명(인원미정)'], rand),
      prefer: meta.prefer,
      lines: lines
    };
    return c;
  }

  // 고른 하는 일을 번갈아 섞어 위쪽에 모두 보이게 하고, 기간에 맞는 공고를 먼저 쓴다.
  function build(s, places){
    places = places && places.length ? places : fallbackPlaces(s);
    var rand = rng(hash(condKey(s)));
    var jobs = s.jobs.length ? s.jobs : ['cafe'];
    var queues = jobs.map(function(job){
      var pool = POSTINGS[job] || [];
      var match = shuffle(pool.filter(function(p){ return fits(p, s.period); }), rand);
      // 지점이 있는 프랜차이즈는 다른 동 지점으로 한 번 더 쓸 수 있다.
      // 프랜차이즈(다른 동 지점)와 회사명이 여러 개인 공고는 다시 쓸 수 있다.
      var reusable = match.filter(function(p){ return p.br || Array.isArray(p.b); });
      var again = shuffle(reusable, rand);
      var again2 = shuffle(reusable, rand);
      var again3 = shuffle(reusable, rand);
      // 그래도 모자라면 기간이 다른 공고를 고른 기간에 맞춰 보충한다(월급 공고는 단기와 어울리지 않아 뺀다).
      var extra = [];
      if (s.period === 'within-month' || s.period === 'over-month'){
        var fit = s.period === 'within-month' ? ['1주일~1개월', '1주일이하'] : ['3개월~6개월', '6개월~1년'];
        extra = shuffle(pool.filter(function(p){ return !fits(p, s.period) && p.p[0] !== '월급'; }), rand).map(function(p){
          return Object.assign({}, p, { pr: fit[Math.floor(rand() * fit.length)] });
        });
      }
      return { job: job, list: match.concat(again, again2, again3, extra, shuffle(extra.filter(function(p){ return p.br || Array.isArray(p.b); }), rand)) };
    });
    var picked = [];
    var uses = [];
    var guard = 0;
    while (picked.length < TARGET * 3 && guard++ < 200){
      var any = false;
      queues.forEach(function(q){
        if (picked.length >= TARGET || !q.list.length) return;
        var post = q.list.shift();
        var n = 0;
        uses.forEach(function(u){ if (u === post) n++; });
        uses.push(post);
        picked.push({ post: post, job: q.job, n: n });
        any = true;
      });
      if (!any) break;
    }
    if (s.remote){
      var remote = shuffle(REMOTE, rand).slice(0, 2);
      [2, 7].forEach(function(pos, i){
        if (!remote[i]) return;
        picked.splice(Math.min(pos, picked.length), 0, { post: Object.assign({ remote: true }, remote[i]), job: 'remote' });
      });
    }
    // 근무지는 뽑아 둔 동을 차례로 쓴다. 동이 모자라 같은 지점·같은 제목이 겹치면 뺀다.
    var placeIndex = 0;
    var seen = {};
    return picked.map(function(it, i){
      var place = places[placeIndex % places.length];
      if (!it.post.remote) placeIndex++;
      return makeCard(it.post, it.job, place, i, it.n || 0);
    }).filter(function(c){
      var k = c.company + '|' + c.title;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).slice(0, TARGET + (s.remote ? 2 : 0)).map(function(c, i){ return addDetail(c, i, rand); });
  }

  window.jobFeed = {
    // 지역이 정해지면 미리 동 이름을 받아 둔다. 완료 화면에서 기다리지 않게 하기 위해서다.
    prepare: function(s){ return samplePlaces(s); },
    build: function(s){
      var key = regionKey(s);
      return build(s, cache[key] || fallbackPlaces(s));
    }
  };
})();
