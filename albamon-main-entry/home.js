(function(){
  'use strict';

  /* ============ 메인 (지금 운영 중인 메인 · Figma AMX Draft 유선 'as is' 169:4559) ============ */
  // 데이터는 jobs.js buildMain(). 공고를 누르면 공고뷰, '더보기'는 실시간 추천 피드(tabs.js).
  // 상단 지역·검색·메뉴·퀵메뉴·필터는 동작하지 않는다.
  var data = window.jobFeed ? window.jobFeed.buildMain() : { top: [], focus: [], list: [] };
  var A = 'assets/main/';

  var $ = function(id){ return document.getElementById(id); };
  var homeScreen = document.querySelector('.screen.home');
  var scroller = $('home-scroll');
  var header = $('home-header');
  var topRec = $('top-rec');
  var jobs = [];   // 누를 수 있는 공고 전부 (data-job 번호)

  function el(tag, cls, text){
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function img(src, w, h, cls){
    var node = el('img', cls);
    node.src = src; node.alt = '';
    if (w) node.width = w;
    if (h) node.height = h;
    return node;
  }
  function jobTarget(node, c){
    node.dataset.job = jobs.length;
    jobs.push(c);
    return node;
  }

  /* ---- 상단 실시간 추천 카드 (CardJobItem 3개씩) ---- */
  function topItem(c){
    var item = jobTarget(el('div', 'tc-item'), c);
    var loc = el('div', 'tc-loc');
    var text = el('div', 'tc-loc-text');
    text.appendChild(el('span', 'tc-company', c.company));
    text.appendChild(el('span', 'dot'));
    text.appendChild(el('span', 'tc-area', c.area));
    loc.appendChild(text);
    if (c.ad) loc.appendChild(el('span', 'tag-ad-white', 'AD'));
    item.appendChild(loc);
    item.appendChild(el('p', 'tc-title', c.title));
    var pay = el('p', 'tc-pay');
    pay.appendChild(el('span', 'tc-pay-type', c.payType));
    pay.appendChild(el('span', null, c.pay));
    item.appendChild(pay);
    return item;
  }
  function topCard(page, n){
    var card = el('div', 'top-card');
    card.dataset.page = n;
    page.forEach(function(c){ card.appendChild(topItem(c)); });
    return card;
  }
  // 끝과 처음을 하나씩 더 붙여 이어지게 한다: [5] 1 2 3 4 5 [1]
  var pages = data.top;
  var STEP = 320 + 12;
  if (pages.length){
    topRec.appendChild(topCard(pages[pages.length - 1], pages.length));
    pages.forEach(function(p, i){ topRec.appendChild(topCard(p, i + 1)); });
    topRec.appendChild(topCard(pages[0], 1));
  }
  var topCards = Array.prototype.slice.call(topRec.children);
  function focusTop(){
    var i = Math.round(topRec.scrollLeft / STEP);
    topCards.forEach(function(c, k){ c.classList.toggle('is-focus', k === i); });
    return i;
  }
  var settle = 0;
  topRec.addEventListener('scroll', function(){
    focusTop();
    clearTimeout(settle);
    settle = setTimeout(function(){
      var i = focusTop();
      if (i === 0) topRec.scrollLeft = pages.length * STEP;
      else if (i === topCards.length - 1) topRec.scrollLeft = STEP;
      focusTop();
    }, 160);
  }, { passive: true });
  function resetTop(){ topRec.scrollLeft = STEP; focusTop(); var bs = $('b-scroll'); if (bs) bs.scrollLeft = 0; }
  resetTop();

  /* ---- 적극 채용중 (CardJobLogo) ---- */
  // 로고는 Figma 크롭 그대로 (ci 70×28, 알바몬 로고만 64 칸에 84×15)
  var LOGOS = {
    am: { src: 'logo-am.svg', w: 84, h: 15, css: 'left:0;top:7px;' },
    tous: { src: 'logo-tous.png', css: 'left:1%;top:-4.17%;width:98.5%;height:108.35%;' },
    img79390: { src: 'logo-img79390.png', css: 'left:0;top:0;width:100%;height:100%;object-fit:cover;' },
    emart: { src: 'logo-emart.png', css: 'left:-4.9%;top:0;width:101.56%;height:100%;' },
    img79379: { src: 'logo-img79379.png', css: 'left:0;top:0;width:100%;height:100%;object-fit:cover;' },
    koreanair: { src: 'logo-koreanair.png', css: 'left:-1.84%;top:-1%;width:103.59%;height:101.99%;' },
    oliveyoung: { src: 'logo-oliveyoung.png', css: 'left:-3.09%;top:-2.54%;width:106.72%;height:105.08%;' }
  };
  function focusCard(c){
    var card = jobTarget(el('div', 'fo-card'), c);
    var top = el('div', 'fo-top');
    var lg = LOGOS[c.logoKey];
    var ci = el('div', 'fo-ci' + (c.logoKey === 'am' ? ' is-am' : ''));
    if (lg){
      var logo = img(A + lg.src, lg.w, lg.h);
      logo.style.cssText = lg.css;
      ci.appendChild(logo);
    }
    top.appendChild(ci);
    if (c.hot) top.appendChild(img(A + 'badge-hot.svg', 34, 16));
    card.appendChild(top);

    var body = el('div', 'fo-body');
    var loc = el('div', 'fo-loc');
    loc.appendChild(el('span', 'fo-company', c.company));
    loc.appendChild(el('span', 'dot'));
    loc.appendChild(el('span', 'fo-area', c.area));
    body.appendChild(loc);
    body.appendChild(el('p', 'fo-title', c.title));
    var row = el('div', 'fo-pay-row');
    var pay = el('p', 'fo-pay');
    pay.appendChild(el('span', 'fo-pay-type', c.payType));
    pay.appendChild(el('span', null, c.pay));
    row.appendChild(pay);
    if (c.dayPay){
      var dp = el('span', 'fo-daypay');
      dp.appendChild(img(A + 'daypay.svg', 14, 14));
      dp.appendChild(document.createTextNode('당일'));
      row.appendChild(dp);
    }
    body.appendChild(row);
    card.appendChild(body);
    return card;
  }
  // Figma는 줄마다 4장(가로 순서). 3줄 그리드가 세로로 채워지므로 열 순서로 넣는다.
  var grid = $('focus-grid');
  for (var col = 0; col < 4; col++){
    for (var r = 0; r < 3; r++){
      var f = data.focus[r * 4 + col];
      if (f) grid.appendChild(focusCard(f));
    }
  }

  /* ---- 공고 리스트 (AMBasicJobCard) ---- */
  var LIST_LOGOS = { koreanair: 'logo-koreanair.png', coupang: 'list-logo-coupang.png' };
  function listCard(c){
    var card = jobTarget(el('div', 'li-card'), c);
    var head = el('div', 'li-head');
    var sub = el('p', 'li-sub');
    sub.appendChild(el('span', null, c.sub));
    head.appendChild(sub);
    var row = el('div', 'li-row');
    var text = el('div', 'li-text');
    text.appendChild(el('p', 'li-title', c.title));
    var pay = el('p', 'li-pay');
    pay.appendChild(el('span', 'li-pay-type', c.payType));
    pay.appendChild(el('span', null, c.pay));
    text.appendChild(pay);
    row.appendChild(text);
    if (LIST_LOGOS[c.logoKey]){
      var box = el('div', 'li-logo');
      box.appendChild(img(A + LIST_LOGOS[c.logoKey]));
      row.appendChild(box);
    }
    head.appendChild(row);
    card.appendChild(head);
    var tags = el('div', 'li-tags');
    (c.tags || []).forEach(function(t, i){
      var tag = el('span', 'li-tag');
      if (i === 0) tag.appendChild(img(A + 'list-pin.svg', 16, 16));
      tag.appendChild(document.createTextNode(t));
      tags.appendChild(tag);
    });
    card.appendChild(tags);
    return card;
  }
  var listSec = $('list-sec');
  data.list.forEach(function(c){ listSec.appendChild(listCard(c)); });

  /* ---- 카드 메인(B·C안): 피드 공고 미리보기 (JobPostingCard/General · Figma 177:28214) ---- */
  // 추천 피드 맨 앞 공고를 같은 순서로 2개씩 묶어 가로로 넘긴다(미리보기 → 피드로 이어진다).
  // 추천 사유도 피드와 같은 로직·문구로 붙인다. 묶음 수는 B_PAGES로 정한다(끝없이 이어지지 않는다).
  // 2묶음(공고 4개): 피드도 첫 화면(공고 4개쯤)만 보고 나가는 사람이 많아, 미리보기를 짧게 두고 피드로 넘긴다(PO 논의 · 사용자 2026-11-18, 이전 3묶음).
  // B-2안(?ver=b2)은 같은 카드에서 근무 요일·시간 줄만 뺀 축약 카드다(home.css · Figma 206:45106).
  var B_PAGES = 2;
  var bPages = $('b-pages');
  var bAll = window.jobFeed ? window.jobFeed.buildFeed() : [];
  var bJobs = bAll.slice(0, B_PAGES * 2);
  function bRow(icon, children){
    var r = el('div', 'fc-row');
    r.appendChild(img('assets/feed/' + icon + '.svg', 16, 16));
    children.forEach(function(n){ r.appendChild(n); });
    return r;
  }
  function bCard(c, peek){
    var card = peek ? el('article', 'fcard b-card') : jobTarget(el('article', 'fcard b-card'), c);
    var head = el('div', 'fc-head');
    var top = el('div', 'fc-top' + (c.reason ? ' has-reason' : ''));
    top.appendChild(el('span', 'fc-company', c.company));
    if (c.reason){
      var reason = el('span', 'fc-reason');
      reason.appendChild(img('assets/feed/reason.svg', 14, 14));
      reason.appendChild(el('span', null, window.jobFeed.reasonText(c.reason)));
      top.appendChild(reason);
    }
    head.appendChild(top);
    head.appendChild(el('p', 'fc-title', c.title));
    card.appendChild(head);
    var info = el('div', 'fc-info');
    info.appendChild(bRow('card-location', [el('span', null, c.location)]));
    var when = bRow('card-clock', [el('span', null, c.days), img('assets/feed/card-dot.svg', 2, 2), el('span', null, c.time)]);
    when.classList.add('fc-when');   // B-2안에서 뺀다
    info.appendChild(when);
    info.appendChild(bRow('card-won', [el('span', 'fc-pay-type' + (c.payType !== '시급' ? ' is-monthly' : ''), c.payType), el('span', 'fc-pay', c.pay)]));
    card.appendChild(info);
    var act = el('div', 'fc-actions');
    act.appendChild(img(c.scrapped ? 'assets/feed/scrap-on.svg' : 'assets/feed/scrap-off.svg', 24, 24));
    card.appendChild(act);
    return card;
  }
  for (var p = 0; p < bJobs.length; p += 2){
    var pageEl = el('div', 'b-page');
    bJobs.slice(p, p + 2).forEach(function(c){ pageEl.appendChild(bCard(c)); });
    bPages.appendChild(pageEl);
  }
  // 끝까지 넘긴 사람을 피드로 잇는 '이어서 보기' 카드 (Figma AMX Draft 190:35603 · 사용자 시안 2026-11-18)
  // 묶음과 같은 폭에 피드의 다음 공고 2개(5·6번째)를 흐리게 겹쳐 보여주고, 누르면 피드 5번째 공고부터 이어 본다.
  var bTease = el('div', 'b-tease');
  bTease.setAttribute('role', 'button');
  bTease.tabIndex = 0;
  bTease.id = 'b-tease';
  bTease.setAttribute('aria-label', '이어서 보기');
  var teaseCards = el('div', 'b-tease-cards');
  teaseCards.setAttribute('aria-hidden', 'true');
  bAll.slice(B_PAGES * 2, B_PAGES * 2 + 2).forEach(function(c){ teaseCards.appendChild(bCard(c, true)); });
  bTease.appendChild(teaseCards);
  bTease.appendChild(el('span', 'b-tease-fade'));
  var teaseCta = el('span', 'b-tease-cta');
  teaseCta.appendChild(document.createTextNode('이어서 보기'));
  teaseCta.appendChild(img('assets/main/pointing-down.svg', 20, 20));   // common/pointing-down을 -90° 돌려 오른쪽을 가리킨다(Figma 그대로)
  bTease.appendChild(teaseCta);
  bPages.appendChild(bTease);

  /* ---- 스크롤: 헤더 배경 ---- */
  function onScroll(){ header.classList.toggle('is-scrolled', scroller.scrollTop > 0); }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 누르기 ---- */
  homeScreen.addEventListener('click', function(e){
    if (e.target.closest('#b-tease')){
      if (window.mainTabs) window.mainTabs.openFeed({ from: B_PAGES * 2 });
      return;
    }
    if (e.target.closest('#rec-more, #b-more')){
      if (window.mainTabs) window.mainTabs.openFeed();
      return;
    }
    if (e.target.closest('.fc-actions')) return;
    var t = e.target.closest('[data-job]');
    if (t && window.jobDetail) window.jobDetail.open(jobs[Number(t.dataset.job)]);
  });

  window.homeScroller = scroller;
  window.homeMain = { resetTop: resetTop };
})();
