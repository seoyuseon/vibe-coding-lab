(function(){
  'use strict';

  /* ============ 메인 ↔ 실시간 추천 피드 ============ */
  // 바텀 탭(tab): 추천 탭 → 피드, 홈 탭 → 메인. 보고 있는 탭을 다시 누르면 맨 위로. 지도·채팅·MY는 동작하지 않는다.
  //   화면은 visibility로 바꿔 각 화면의 스크롤 위치를 그대로 둔다.
  // 메인 '더보기'·카드 메인 '더 보기'·'이어 보기' (body[data-feed]):
  //   push(현재·B안) → 피드가 오른쪽에서 밀려 들어온다(뒤로 가기·밀어서 뒤로 가기로 닫는다).
  //   tab(A안·C안) → 추천 탭으로 간다.
  //   top(D안) → 메인 상단 '추천' 탭으로 바꾸고 맨 위로 올린다(toptabs.js).
  var $ = function(id){ return document.getElementById(id); };
  var body = document.body;
  var screens = { home: document.querySelector('.screen.home'), feed: $('feed') };
  var bar = $('tabfloat');
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('.tf-tab'));
  var detail = $('detail');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 'home';
  var pushed = false;

  /* ---- 추천 탭 툴팁 (A안만 · C안은 입구가 많아 뺐다) ---- */
  // 툴팁을 켠 시안(body[data-tip="on"])의 메인에서 보이고, 닫기·추천 탭에 들어가면 사라진다. 시안을 다시 고르면 다시 보인다(데모).
  // 말풍선은 추천 탭 가운데에 두되 폰 안(좌우 16)으로 붙이고, 꼬리 끝이 탭 가운데를 가리키게 한다.
  var tip = $('tf-tip');
  var tipArrow = $('tf-tip-arrow');
  var tipClosed = false;
  var tipTimer = 0;
  function placeTip(){
    var rec = bar.querySelector('.tf-rec');
    if (!rec || !rec.offsetWidth) return;
    var phoneW = bar.offsetParent ? bar.offsetParent.clientWidth : 390;
    var center = bar.offsetLeft + rec.offsetLeft + rec.offsetWidth / 2;
    var w = tip.offsetWidth;
    var left = Math.min(Math.max(center - w / 2, 16), phoneW - 16 - w);
    tip.style.left = Math.round(left) + 'px';
    tipArrow.style.marginLeft = Math.round(center - left - 7) + 'px';
    tip.style.transformOrigin = Math.round(center - left) + 'px 100%';
  }
  function syncTip(){
    var on = body.dataset.tip === 'on' && body.dataset.feed === 'tab' && current === 'home' && !pushed && !tipClosed;
    var shown = body.classList.contains('show-tip');
    if (on){
      clearTimeout(tipTimer);
      tip.classList.remove('is-leaving');
      body.classList.add('show-tip');
      placeTip();
    } else if (shown && !tip.classList.contains('is-leaving')){
      tip.classList.add('is-leaving');
      tipTimer = setTimeout(function(){
        body.classList.remove('show-tip');
        tip.classList.remove('is-leaving');
      }, 200);
    }
  }
  $('tf-tip-close').addEventListener('click', function(){ tipClosed = true; syncTip(); });
  window.addEventListener('resize', placeTip);

  function scrollerOf(name){
    return name === 'feed' ? window.recFeed && window.recFeed.scroller : window.homeScroller;
  }
  function toTop(name, smooth){
    var sc = scrollerOf(name);
    if (!sc) return;
    if (smooth && !reduceMotion) sc.scrollTo({ top: 0, behavior: 'smooth' });
    else sc.scrollTop = 0;
  }
  function paint(){
    // 시안마다 보이는 탭이 달라(A·C: 추천 / B: 커뮤니티) 보이는 탭 순서로 알약 자리를 정한다.
    var visible = tabs.filter(function(t){ return getComputedStyle(t).display !== 'none'; });
    tabs.forEach(function(t){
      if (t.dataset.tab === current) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    bar.style.setProperty('--tf-i', Math.max(0, visible.findIndex(function(t){ return t.dataset.tab === current; })));
    Object.keys(screens).forEach(function(k){
      var off = k !== current;
      screens[k].classList.toggle('is-off', off);
      if ('inert' in screens[k]) screens[k].inert = off && !(k === 'feed' && pushed);
    });
    screens.feed.classList.toggle('is-pushed', pushed);
    body.dataset.screen = pushed ? 'feed' : current;
    syncTip();
  }
  function show(name){
    if (!screens[name]) return;
    if (name === current){ toTop(name, true); return; }
    if (name === 'feed') tipClosed = true;
    current = name;
    paint();
  }

  /* ---- 현재(asis): 피드 밀어 넣기 ---- */
  function push(){
    if (pushed) return;
    toTop('feed');
    pushed = true;
    paint();
    if (window.mainNav) window.mainNav.push('feed');
  }
  function pop(via){
    if (!pushed) return;
    pushed = false;
    paint();
    if (via !== 'swipe' && window.mainNav) window.mainNav.pop('feed');
  }
  $('feed-back').addEventListener('click', function(){ pop('back'); });
  window.addEventListener('main:back', function(e){
    if (e.detail.kind === 'feed') pop('swipe');
  });

  // opts.from: 피드를 n번째 공고(0부터)가 위에 오게 연다 (B·C안 '이어 보기').
  function openFeed(opts){
    if (body.dataset.feed === 'top'){
      if (window.topTabs) window.topTabs.select('rec', { toTop: true });
      return;
    }
    if (body.dataset.feed === 'tab') show('feed');
    else push();
    if (opts && opts.from != null) scrollFeedTo(opts.from);
  }
  function scrollFeedTo(n){
    var sc = scrollerOf('feed');
    var card = sc && sc.querySelector('[data-feed="card:' + n + '"]');
    if (!card) return;
    sc.scrollTop += card.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8;
  }

  // 시안을 바꾸면 메인 맨 위에서 다시 본다.
  function reset(){
    if (pushed){
      screens.feed.classList.add('no-anim');
      pop();
      void screens.feed.offsetWidth;
      screens.feed.classList.remove('no-anim');
    }
    current = 'home';
    tipClosed = false;
    if (window.topTabs) window.topTabs.reset();
    paint();
    toTop('home');
    toTop('feed');
    if (window.homeMain) window.homeMain.resetTop();
  }

  bar.addEventListener('click', function(e){
    var t = e.target.closest('.tf-tab');
    if (t) show(t.dataset.tab);
  });

  // 공고뷰가 열려 있으면 모바일 시안 전환 버튼을 숨긴다 (compare.css).
  if (window.MutationObserver){
    new MutationObserver(function(){
      body.classList.toggle('is-detail', detail.classList.contains('is-open'));
    }).observe(detail, { attributes: true, attributeFilter: ['class'] });
  }

  // compare.js가 시안(data-feed·data-tip)을 정한 뒤에도 탭·툴팁을 맞춘다.
  if (window.MutationObserver){
    new MutationObserver(paint).observe(body, { attributes: true, attributeFilter: ['data-feed', 'data-tip'] });
  }
  paint();
  window.mainTabs = { show: show, reset: reset, openFeed: openFeed };
})();
