/* 더미 공고 데이터 (데모 조건: 서초구 외 2 · 바리스타 외 2 · 한 달 이내) */
(function(){
  'use strict';

  // 실시간 추천 알바: 카드 한 장에 공고 3건. 세 번째는 광고(AD) — Figma 카드 구성 그대로.
  // 사용자 결정(2026-11-16): Figma 더미 대신 온보딩 조건에 맞는 공고(서초구 카페·바리스타 단기)로 채운다.
  var REC_CARDS = [
    [
      { company: '브레마리', area: '방배동', title: '브레마리 카페 12월 한 달 바리스타 모집', payType: '시급', pay: '12,000원' },
      { company: '㈜마이핏', area: '반포동', title: '반포 아파트 단지 카페 주말 단기 바리스타', payType: '시급', pay: '11,700원' },
      { company: '㈜카페온', area: '양재동', title: '[카페온] 양재점 2주 단기 바리스타 급구', payType: '시급', pay: '11,500원', ad: true }
    ],
    [
      { company: '에스프레소코아', area: '반포동', title: '에스프레소코아 반포점 3주 단기 바리스타', payType: '시급', pay: '12,000원' },
      { company: '루리커피', area: '서초동', title: '루리커피 서초점 평일 오전 단기 바리스타', payType: '시급', pay: '11,000원' },
      { company: '㈜이디야', area: '방배동', title: '[이디야커피] 연말 시즌 단기 바리스타 채용', payType: '일급', pay: '10만원', ad: true }
    ],
    [
      { company: '무너미(munumi)', area: '잠원동', title: '무너미카페 주말 바리스타 2주 단기', payType: '시급', pay: '10,500원' },
      { company: '블루밍베이커리', area: '반포동', title: '베이커리 카페 크리스마스 시즌 단기 알바', payType: '일급', pay: '9만원' },
      { company: '아티제', area: '서초동', title: '[아티제] 겨울 시즌 베이커리 카페 단기 스태프', payType: '시급', pay: '12,500원', ad: true }
    ]
  ];

  // 적극 채용중 (CarouselFocusSection 5822:16858) — Figma 그대로. 4열 × 3줄, 가로로 넘긴다.
  // logo: 70×28 ci 안에서 Figma가 잡은 이미지 위치(left·top·width·height, px)
  var L20 = { src: 'assets/home/logo-20.png', l: 0, t: 0, w: 70, h: 28 };
  var FOCUS_CARDS = [
    [
      { company: '잡코리아 알바몬', area: '서울 전체', title: '알바몬에서 사무보조 직원을 구합니다!', payType: '시급', pay: '12,000원', albamon: true, hot: true },
      { company: '뚜레쥬르', area: '서초동', title: '뚜레쥬르 함께 할 스텝분들을 모집합니다.', payType: '일급', pay: '148,000원', daypay: true, logo: { src: 'assets/home/logo-22.png', l: .7, t: -1.17, w: 68.95, h: 30.34 } },
      { company: '이마트', area: '서초동', title: '[야간]이마트 편의점에서 주말 근무자 구합니다.', payType: '시급', pay: '12,000원', logo: L20 },
      { company: '뚜레쥬르', area: '서초동', title: '뚜레쥬르 함께 할 스텝분들을 모집합니다.', payType: '월급', pay: '320만원', daypay: true, logo: L20 }
    ],
    [
      { company: '이마트', area: '서초동', title: '[야간]이마트 편의점에서 주말 근무자 구합니다.', payType: '시급', pay: '12,000원', logo: { src: 'assets/home/logo-23.png', l: -3.43, t: 0, w: 71.09, h: 28 } },
      { company: '쿠팡풀필먼트서비스', area: '송파구', title: '기간한정 쿠팡알바 30만원 인센티브 선착순 지급!', payType: '일급', pay: '166,995원', logo: { src: 'assets/home/logo-27s.png', l: 0, t: 0, w: 70, h: 28 } },
      { company: '뚜레쥬르', area: '서초동', title: '뚜레쥬르 함께 할 스텝분들을 모집합니다.', payType: '월급', pay: '320만원', logo: L20 },
      { company: '대한항공', area: '공항동', title: '항공 국제선 예약/발권센터 전문상담 업무 지원 담당', payType: '월급', pay: '320만원', logo: L20 }
    ],
    [
      { company: '대한항공', area: '공항동', title: '항공 국제선 예약/발권센터 전문상담 업무 지원 담당', payType: '월급', pay: '320만원', logo: { src: 'assets/home/logo-26.png', l: -1.29, t: -.28, w: 72.51, h: 28.56 } },
      { company: 'CJ올리브영', area: '서초동', title: '올리브영 역삼점 주말 오픈 MATE 구인 (시간, 주휴 협의 가능)', payType: '시급', pay: '10,200원', logo: { src: 'assets/home/logo-21.png', l: -2.16, t: -.71, w: 74.7, h: 29.42 } },
      { company: '이마트', area: '서초동', title: '[야간]이마트 편의점에서 주말 근무자 구합니다.', payType: '시급', pay: '12,000원', logo: L20 },
      { company: '뚜레쥬르', area: '서초동', title: '뚜레쥬르 함께 할 스텝분들을 모집합니다.', payType: '월급', pay: '320만원', logo: L20 }
    ]
  ];

  // ListBasicSection (5822:16903) — Figma 그대로
  var LIST_CARDS = [
    { company: '대한항공', title: '항공 국제선 예약/발권센터 전문상담 업무 지원 담당', payType: '월급', pay: '320만원', logo: true, tags: ['강서구', '09:00~18:00', '단기알바'] },
    { company: '웨스틴서울파르나스', title: '[시급15,250원] 삼성역 웨스틴서울 파르나스 호텔 연회서빙', payType: '월급', pay: '320만원', tags: ['삼성동', '시간협의', '단기알바', '친구와함께'] },
    { company: '#초보가능 #동반근무 #하루알바', title: '[기간한정!]쿠팡알바 29만원 인센티브 선착순 지급! 셔틀/원하는날/단기/학력 경력무관', payType: '일급', pay: '161,890원', logo: true, tags: ['양재시민의숲', '시간협의', '하루알바', '장년가능', '테마'] }
  ];

  window.JOBS = { rec: REC_CARDS, focus: FOCUS_CARDS, list: LIST_CARDS };
})();
