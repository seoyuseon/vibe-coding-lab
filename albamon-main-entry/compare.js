(function(){
  'use strict';

  /* ============ 메인 진입점 시안 비교 ============ */
  // asis: 지금 운영 중인 메인·바텀 탭(홈 · 커뮤니티 · 지도 · 채팅 · MY)
  // a   : A안 바텀 탭 — 커뮤니티 자리에 추천 탭을 넣은 떠 있는 유리 탭 바 → 실시간 추천 피드
  // b   : B-1안 추천 카드 — 상단 캐러셀 대신 피드 공고 미리보기(2개씩 2묶음 가로로 넘김, 끝에 '이어서 보기' 카드) + '더 보기' 버튼, 퀵메뉴 카드형.
  //       탭바 모양은 A안과 같지만 추천 탭 없이 커뮤니티를 둔다(입구를 메인으로 모은다). 피드는 밀어 들어온다. (Figma 177:28071)
  // b2  : B-2안 축약 카드 — B-1과 같고 미리보기 카드에서 근무 요일·시간 줄만 뺀다(Figma 206:45106 · 사용자 2026-11-18)
  // c   : C안 추천 탭 + 카드 — B안 메인 + A안 바텀 탭(추천 탭). 처음 B안 초안이 이 조합이었다(사용자 요청 2026-11-18로 C로 올림).
  //       입구가 이미 많아 툴팁은 띄우지 않는다(사용자 결정 2026-11-18).
  // d   : D안 상단 칩 탭 — 헤더 아래 '홈 · 실시간 추천 알바'(위에 붙지 않음), 상단 카드 없는 운영 메인, 바텀 탭은 커뮤니티 유지(toptabs.js · 사용자 시안 Figma 170:18843)
  // dplus: D+안 — D안 칩 줄에 바로가기 '최근 본 ↗ · 스크랩 ↗'까지(사용자 시안 그대로). 실험 지표를 나눠 보려고 D와 따로 둔다(PO 논의 · 사용자 2026-11-18).
  // 링크로 고를 수 있다: ?ver=asis | a | b | b2 | c | d | dplus (지정이 없으면 a. 예전 링크 ?ver=tab은 a, ?ver=b1은 b로 연다)
  // 시안을 늘릴 때는 VERSIONS와 index.html의 data-ver-pick 버튼(PC 막대·모바일 시트)을 함께 추가한다.
  //   tabbar: 그 시안의 탭바 모양(asis | float) → body[data-tabbar]
  //   feed  : 피드를 여는 방식(tab = 바텀 추천 탭 | push = 밀어 들어오는 화면 | top = 메인 상단 추천 탭) → body[data-feed]
  //           바텀 탭의 2번째는 tab이면 추천, 나머지는 커뮤니티.
  //   main  : 메인 모양(asis = 운영 메인 | card = 피드 미리보기 + 더 보기 버튼) → body[data-main]
  //   tip   : 추천 탭 툴팁을 띄울지(추천 탭이 있는 시안만 의미가 있다) → body[data-tip] (tabs.js)
  //   그 밖의 화면 차이는 body[data-ver]로 나눈다.
  var VERSIONS = {
    asis: { label: '현재', short: '현재', main: 'asis', tabbar: 'asis', feed: 'push', tip: false },
    a: { label: 'A · 바텀 탭', short: 'A', main: 'asis', tabbar: 'float', feed: 'tab', tip: true },
    b: { label: 'B-1 · 추천 카드', short: 'B-1', main: 'card', tabbar: 'float', feed: 'push', tip: false },
    b2: { label: 'B-2 · 축약 카드', short: 'B-2', main: 'card', tabbar: 'float', feed: 'push', tip: false },
    c: { label: 'C · 탭 + 카드', short: 'C', main: 'card', tabbar: 'float', feed: 'tab', tip: false },
    d: { label: 'D · 상단 탭', short: 'D', main: 'asis', tabbar: 'float', feed: 'top', tip: false },
    dplus: { label: 'D+ · 상단 탭 + 바로가기', short: 'D+', main: 'asis', tabbar: 'float', feed: 'top', tip: false }
  };
  var ALIAS = { tab: 'a', b1: 'b' };
  var DEFAULT = 'a';
  var $ = function(id){ return document.getElementById(id); };
  var body = document.body;
  var fab = $('cmp-fab');

  var asked = new URLSearchParams(location.search).get('ver');
  asked = ALIAS[asked] || asked;
  var ver = VERSIONS[asked] ? asked : DEFAULT;
  function apply(){
    body.dataset.ver = ver;
    body.dataset.main = VERSIONS[ver].main;
    body.dataset.tip = VERSIONS[ver].tip ? 'on' : 'off';
    body.dataset.tabbar = VERSIONS[ver].tabbar;
    body.dataset.feed = VERSIONS[ver].feed;
  }
  apply();

  function sync(){
    document.querySelectorAll('[data-ver-pick]').forEach(function(b){
      b.setAttribute('aria-selected', b.dataset.verPick === ver ? 'true' : 'false');
    });
    fab.textContent = VERSIONS[ver].short;
    fab.setAttribute('aria-label', '메인 진입점 시안 선택, 지금 ' + VERSIONS[ver].label);
  }
  function remember(){
    try {
      var u = new URL(location.href);
      u.searchParams.set('ver', ver);
      history.replaceState(history.state, '', u);
    } catch (e) {}
  }
  function setSheet(open){
    body.classList.toggle('cmp-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // 시안을 바꾸면 공고뷰를 닫고 메인 맨 위에서 다시 본다.
  document.addEventListener('click', function(e){
    var pick = e.target.closest('[data-ver-pick]');
    if (!pick) return;
    setSheet(false);
    if (pick.dataset.verPick === ver) return;
    ver = pick.dataset.verPick;
    apply();
    sync();
    remember();
    if (window.jobDetail) window.jobDetail.close();
    if (window.mainTabs) window.mainTabs.reset();
  });
  fab.addEventListener('click', function(){ setSheet(!body.classList.contains('cmp-open')); });
  $('cmp-backdrop').addEventListener('click', function(){ setSheet(false); });
  $('cmp-close').addEventListener('click', function(){ setSheet(false); });
  sync();
})();
