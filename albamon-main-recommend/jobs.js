(function(){
  'use strict';

  /* ============ 데모 사용자 ============ */
  // 최근 '바리스타'를 검색했고, 카페 알바에 지원한 개인 회원으로 본다. 메인 조건은 원본 메인 기본값(서초구 10km · 바리스타 외 2)과 같다.
  var RECENT_SEARCH = '바리스타';

  /* ============ 더미 공고 ============ */
  // 추천 사유는 카드마다 정해 둔다. 첫 화면에 검색·지원이 하나씩 보이고, 사유 없는 카드가 사이사이 섞인다.
  //   r: 'search' 최근 검색한 키워드와 유사한 공고 / 'apply' 최근 지원한 공고와 비슷한 공고 / 없음: 스크랩·클릭·이력서 출처
  //   광고(ad)는 정책상 사유를 붙이지 않는다.
  // b: 기업명, br: 브랜드(공고뷰), t: 제목, loc: 근무지역, d: 근무요일, h: 근무시간, p: [급여 형태, 금액], pr: 근무기간(공고뷰)
  // q: 바로채용, img: 썸네일
  // 1번은 Figma 혼합 Test 카드와 같다.
  var POSTINGS = [
    { job: 'cafe', r: 'search', b: '스타벅스 선릉로', br: '스타벅스', t: '스타벅스 선릉로점 바리스타 모집', loc: '서울 강남구 역삼동', d: '월~금', h: '시간협의', p: ['시급', 11250], pr: '1년이상', img: 'assets/home/card-starbucks.png' },
    { job: 'cafe', r: 'apply', b: '메가MGC커피 서초', br: '메가MGC커피', t: '메가커피 서초점 평일 오픈 파트타이머 구해요', loc: '서울 서초구 서초동', d: '월~금', h: '07:00~12:00', p: ['시급', 10500], pr: '6개월~1년', q: true },
    { job: 'serving', b: '애슐리퀸즈 반포', br: '애슐리퀸즈', t: '애슐리퀸즈 반포점 주말 홀 스태프', loc: '서울 서초구 반포동', d: '토,일', h: '11:00~20:00', p: ['시급', 10800], pr: '3개월~6개월' },
    { job: 'serving', ad: true, b: '아웃백스테이크하우스 양재', br: '아웃백스테이크하우스', t: '아웃백 양재점 홀 서빙 크루 모집', loc: '서울 서초구 양재동', d: '주 3일', h: '17:00~22:00', p: ['시급', 11000], pr: '6개월~1년' },
    { job: 'shopping-bag', b: 'CU 방배', br: 'CU', t: 'CU 방배점 평일 오후 근무자 구해요', loc: '서울 서초구 방배동', d: '월~금', h: '14:00~22:00', p: ['시급', 10320], pr: '6개월~1년' },
    { job: 'cafe', r: 'search', b: '컴포즈커피 잠원', br: '컴포즈커피', t: '컴포즈커피 잠원점 바리스타 알바', loc: '서울 서초구 잠원동', d: '월~금', h: '12:00~18:00', p: ['시급', 10320], pr: '1년이상' },
    { job: 'serving', b: '교촌치킨 양재', br: '교촌치킨', t: '교촌치킨 양재점 홀·포장 아르바이트', loc: '서울 서초구 양재동', d: '주 4일', h: '18:00~23:00', p: ['시급', 10500], pr: '6개월~1년' },
    { job: 'cafe', r: 'apply', b: '투썸플레이스 교대', br: '투썸플레이스', t: '투썸플레이스 교대점 마감 스태프 (초보 가능)', loc: '서울 서초구 서초동', d: '주 3일', h: '17:00~23:00', p: ['시급', 10800], pr: '3개월~6개월' },
    { job: 'shopping-bag', ad: true, b: '올리브영 강남역', br: '올리브영', t: '올리브영 강남역점 매장 스태프 채용', loc: '서울 서초구 서초동', d: '주 4일', h: '시간협의', p: ['시급', 10500], pr: '1년이상' },
    { job: 'serving', b: '새마을식당 방배', br: '새마을식당', t: '새마을식당 방배점 점심 홀서빙', loc: '서울 서초구 방배동', d: '월~금', h: '11:00~15:00', p: ['시급', 10500], pr: '1년이상' },
    { job: 'cafe', r: 'search', b: '에스프레소코아', t: '에스프레소코아 바리스타 모집', loc: '서울 서초구 반포동', d: '주 4일', h: '07:00~14:00', p: ['시급', 10320], pr: '6개월~1년', img: 'assets/home/card-espressocore.jpg' },
    { job: 'shopping-bag', b: '다이소 양재', br: '다이소', t: '다이소 양재점 상품 진열·계산', loc: '서울 서초구 양재동', d: '월~금', h: '10:00~16:00', p: ['시급', 10320], pr: '6개월~1년' },
    { job: 'cafe', r: 'apply', b: '파리바게뜨 잠원', br: '파리바게뜨', t: '파리바게뜨 잠원점 매장 판매·포장 스태프', loc: '서울 서초구 잠원동', d: '주 5일', h: '08:00~14:00', p: ['시급', 10500], pr: '6개월~1년' },
    { job: 'serving', b: '오늘도한식뷔페', t: '한식뷔페 홀서빙 구합니다 (주휴수당 지급)', loc: '서울 서초구 서초동', d: '월~금', h: '10:30~15:30', p: ['시급', 10320], pr: '1년이상' },
    { job: 'shopping-bag', b: '세븐일레븐 반포', br: '세븐일레븐', t: '세븐일레븐 반포점 오전 근무 (초보 가능)', loc: '서울 서초구 반포동', d: '주 5일', h: '07:00~13:00', p: ['시급', 10320], pr: '1년이상', q: true },
    { job: 'cafe', r: 'search', b: '이디야커피 방배', br: '이디야커피', t: '이디야커피 방배점 바리스타 구해요', loc: '서울 서초구 방배동', d: '주 3일', h: '09:00~15:00', p: ['시급', 10320], pr: '6개월~1년' },
    { job: 'serving', b: '맥도날드 서초', br: '맥도날드', t: '맥도날드 서초점 주말 크루 모집', loc: '서울 서초구 서초동', d: '토,일', h: '10:00~18:00', p: ['시급', 10500], pr: '3개월~6개월', q: true },
    { job: 'cafe', r: 'apply', b: '할리스 강남역', br: '할리스', t: '할리스 강남역점 평일 오후 스태프', loc: '서울 강남구 역삼동', d: '월~금', h: '13:00~19:00', p: ['시급', 10500], pr: '6개월~1년' },
    { job: 'serving', ad: true, b: '버거킹 서초', br: '버거킹', t: '버거킹 서초점 홀·주방 크루 채용', loc: '서울 서초구 서초동', d: '주 4일', h: '시간협의', p: ['시급', 10800], pr: '6개월~1년' },
    { job: 'shopping-bag', b: 'GS25 서초', br: 'GS25', t: 'GS25 서초점 주말 야간 근무자', loc: '서울 서초구 서초동', d: '토,일', h: '22:00~08:00', p: ['시급', 11000], pr: '6개월~1년' },
    { job: 'cafe', r: 'search', b: '폴바셋 서초', br: '폴바셋', t: '폴바셋 서초점 바리스타 파트타이머', loc: '서울 서초구 서초동', d: '주 5일', h: '08:00~16:00', p: ['시급', 11000], pr: '1년이상' },
    { job: 'serving', b: '본죽 반포', br: '본죽', t: '본죽 반포점 주방 보조·포장', loc: '서울 서초구 반포동', d: '월~금', h: '10:00~14:00', p: ['시급', 10320], pr: '3개월~6개월' },
    { job: 'cafe', r: 'apply', b: '빽다방 양재', br: '빽다방', t: '빽다방 양재역점 오픈 알바', loc: '서울 서초구 양재동', d: '주 4일', h: '07:00~11:00', p: ['시급', 10320], pr: '6개월~1년' },
    { job: 'shopping-bag', b: '이마트24 잠원', br: '이마트24', t: '이마트24 잠원점 평일 저녁 근무', loc: '서울 서초구 잠원동', d: '월~금', h: '18:00~23:00', p: ['시급', 10320], pr: '6개월~1년' },
    { job: 'shopping-bag', ad: true, b: '무신사 스탠다드 강남', br: '무신사 스탠다드', t: '무신사 스탠다드 강남점 매장 크루', loc: '서울 강남구 역삼동', d: '주 4일', h: '시간협의', p: ['시급', 11000], pr: '6개월~1년' },
    { job: 'serving', b: '고봉민김밥 방배', br: '고봉민김밥', t: '고봉민김밥 방배점 점심 홀·포장', loc: '서울 서초구 방배동', d: '월~금', h: '11:00~15:00', p: ['시급', 10320], pr: '3개월~6개월' },
    { job: 'cafe', r: 'search', b: '블루보틀 역삼', br: '블루보틀', t: '블루보틀 역삼 카페 바리스타 채용', loc: '서울 강남구 역삼동', d: '주 5일', h: '07:30~16:30', p: ['시급', 11500], pr: '1년이상' },
    { job: 'shopping-bag', b: 'ABC마트 강남', br: 'ABC마트', t: 'ABC마트 강남점 주말 판매 스태프', loc: '서울 강남구 역삼동', d: '토,일', h: '12:00~21:00', p: ['시급', 10500], pr: '3개월~6개월' },
    { job: 'cafe', r: 'apply', b: '뚜레쥬르 서초', br: '뚜레쥬르', t: '뚜레쥬르 서초점 매장 판매 스태프', loc: '서울 서초구 서초동', d: '주 3일', h: '14:00~20:00', p: ['시급', 10320], pr: '6개월~1년', q: true },
    { job: 'serving', b: '서브웨이 반포', br: '서브웨이', t: '서브웨이 반포점 샌드위치 아티스트 모집', loc: '서울 서초구 반포동', d: '월~금', h: '11:00~17:00', p: ['시급', 10500], pr: '6개월~1년' }
  ];
  var SHORT = { '1일': 1, '1주일이하': 1, '1주일~1개월': 1 };
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  // 공고 상세(공고뷰)에 쓰는 하는 일별 문구 (원본 메인과 같음)
  var META = {
    cafe: { kind: '바리스타, 카페 음료 제조·판매', welfare: '식사 제공, 음료 제공, 주휴수당, 장기근무 시 인센티브', prefer: '유사업무 경험 우대, 인근 거주 우대, 장기 근무 가능자 우대', duties: ['음료 제조 및 주문 응대', '디저트 진열·포장', '매장 청결 관리 및 마감 정리'], tags: ['#초보가능', '#음료제조', '#매장근무'] },
    serving: { kind: '서빙, 홀 관리, 주문 응대', welfare: '식사 제공, 주휴수당, 연장근로수당', prefer: '유사업무 경험 우대, 친구와 함께 근무 가능, 인근 거주 우대', duties: ['홀 서빙 및 주문 응대', '테이블 세팅·정리', '마감 청소'], tags: ['#식사제공', '#초보가능', '#친구랑근무'] },
    'shopping-bag': { kind: '매장관리, 판매, 계산', welfare: '주휴수당, 직원 할인, 4대보험(주 15시간 이상)', prefer: '유사업무 경험 우대, 인근 거주 우대, 대학 재학생 우대', duties: ['계산 및 고객 응대', '상품 진열·재고 정리', '매장 청소'], tags: ['#매장근무', '#초보가능', '#직원할인'] }
  };

  /* ============ 도우미 ============ */
  function hash(str){
    var h = 2166136261;
    for (var i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // 열 때마다 같은 공고뷰가 나오도록 시드 난수를 쓴다.
  function rng(seed){
    return function(){
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function payText(p){ return p[1].toLocaleString('ko-KR') + '원'; }
  function pad2(n){ return (n < 10 ? '0' : '') + n; }
  function pick(list, rand){ return list[Math.floor(rand() * list.length)]; }

  /* ============ 목록 만들기 ============ */
  function makeCard(post, index){
    return {
      id: post.job + ':' + index,
      job: post.job,
      company: post.b,
      ad: !!post.ad,
      title: post.t,
      location: post.loc,
      period: post.pr,
      time: post.h,
      days: post.d,
      payType: post.p[0],
      pay: payText(post.p),
      quick: !!post.q,
      thumb: post.img || null,
      brand: post.br || null,
      // 광고는 추천 엔진 공고가 아니므로 사유를 붙이지 않는다.
      reason: post.r && !post.ad ? { type: post.r, keyword: post.r === 'search' ? RECENT_SEARCH : null } : null
    };
  }

  // 공고 상세에 필요한 값을 덧붙인다. (등록일·마감·해시태그·신뢰 칩·근무·모집 조건·상세요강)
  function addDetail(c, i, rand){
    var meta = META[c.job] || META.cafe;
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
      employ: '알바',
      welfare: meta.welfare,
      headcount: pick(['1명', '2명', '3명', '5명', '00명(인원미정)'], rand),
      prefer: meta.prefer,
      lines: lines
    };
    return c;
  }

  window.jobFeed = {
    build: function(){
      var rand = rng(hash('main-recommend'));
      return POSTINGS.map(function(post, i){ return addDetail(makeCard(post, i), i, rand); });
    }
  };
})();
