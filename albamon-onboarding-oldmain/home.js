(function(){
  'use strict';

  var J = window.JOBS;

  /* ============ 시안 ============ */
  // 사용자 결정(2026-11-16): 앞단 온보딩 없이 구 메인 완료 화면만 만든다.
  // A 코치마크는 2/2 대상을 둘 다 만들어 비교한다(A-1 필터 칩 = Figma, A-2 실시간 추천 알바 = 초안 문구).
  // B 하이라이트는 Figma 토스트에 예전 프로토타입의 반짝임을 더하고, 대상은 지역·필터 칩이다.
  var VARIANTS = [
    { id: 'a1', label: 'A-1', name: '코치마크 · 필터', desc: '지역 → 필터 칩 순서로 짚어줘요 (Figma)' },
    { id: 'a2', label: 'A-2', name: '코치마크 · 추천', desc: '지역 → 실시간 추천 알바 순서로 짚어줘요' },
    { id: 'b', label: 'B', name: '하이라이트', desc: '지역·필터 칩을 반짝이고 토스트로 알려줘요' }
  ];
  function variantInfo(id){
    return VARIANTS.filter(function(x){ return x.id === id; })[0];
  }

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var homeScreen = document.querySelector('.screen.home');
  var scroller = $('home-scroll');
  var header = $('home-header');
  var locBtn = $('home-location');
  var recTrack = $('rec-track');
  var recMore = $('rec-more');
  var filterScroll = $('filter-scroll');
  var chipJob = $('chip-job');
  var chipPeriod = $('chip-period');
  var focusScroll = document.querySelector('.focus-scroll');
  var toast = $('home-toast');
  var coach = $('coach');
  var spot = $('coach-spot');
  var spotClone = $('coach-clone');
  var tip = $('coach-tip');
  var fab = $('variant-fab');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var variant = pickVariant(params.get('v'));
  function pickVariant(v){
    v = (v || '').toLowerCase();
    if (v === 'a') v = 'a1';
    return VARIANTS.some(function(x){ return x.id === v; }) ? v : VARIANTS[0].id;
  }

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
  function payEl(type, amount, cls){
    var p = el('p', 'pay' + (cls ? ' ' + cls : ''));
    p.appendChild(el('span', 'pay-type', type));
    p.appendChild(el('span', 'pay-amount', amount));
    return p;
  }

  /* ============ 실시간 추천 알바 (CardJobItem × 3) ============ */
  function recItem(j){
    var item = el('div', 'rec-item');
    var loc = el('div', 'rec-loc');
    var main = el('div', 'rec-loc-main');
    main.appendChild(el('span', 'rec-company', j.company));
    main.appendChild(el('span', 'dot'));
    main.appendChild(el('span', 'rec-area', j.area));
    loc.appendChild(main);
    if (j.ad) loc.appendChild(el('span', 'tag-ad', 'AD'));
    item.appendChild(loc);
    item.appendChild(el('p', 'rec-title', j.title));
    item.appendChild(payEl(j.payType, j.pay));
    return item;
  }
  J.rec.forEach(function(card){
    var c = el('article', 'rec-card');
    card.forEach(function(j){ c.appendChild(recItem(j)); });
    recTrack.appendChild(c);
  });
  // Figma처럼 두 번째 카드가 가운데 오고 양옆 카드가 살짝 보이게 시작한다.
  function centerRec(i){
    var card = recTrack.children[i];
    if (!card) return;
    recTrack.scrollLeft = card.offsetLeft - (recTrack.clientWidth - card.offsetWidth) / 2;
  }

  /* ============ 적극 채용중 (CardJobLogo) ============ */
  function focusCard(j){
    var c = el('article', 'focus-card');
    var head = el('div', 'focus-head');
    var ci = el('div', 'focus-ci' + (j.albamon ? ' is-albamon' : ''));
    var logo;
    if (j.albamon){
      logo = img('assets/home/logo-albamon.svg', 84, 15);
      logo.style.left = '0px';
      logo.style.top = '7px';
    } else {
      logo = img(j.logo.src);
      logo.style.cssText = 'left:' + j.logo.l + 'px;top:' + j.logo.t + 'px;width:' + j.logo.w + 'px;height:' + j.logo.h + 'px';
    }
    ci.appendChild(logo);
    head.appendChild(ci);
    if (j.hot) head.appendChild(img('assets/home/badge-hot.svg', 34, 16));
    c.appendChild(head);

    var body = el('div', 'focus-body');
    var loc = el('p', 'focus-loc');
    loc.appendChild(el('span', 'focus-company', j.company));
    loc.appendChild(el('span', 'dot'));
    loc.appendChild(el('span', 'focus-area', j.area));
    body.appendChild(loc);
    body.appendChild(el('p', 'focus-title', j.title));
    var payRow = el('div', 'focus-pay');
    payRow.appendChild(payEl(j.payType, j.pay));
    if (j.daypay){
      var dp = el('span', 'daypay');
      dp.appendChild(img('assets/home/daypay.svg', 14, 14));
      dp.appendChild(document.createTextNode('당일'));
      payRow.appendChild(dp);
    }
    body.appendChild(payRow);
    c.appendChild(body);
    return c;
  }
  var focusGrid = $('focus-grid');
  J.focus.forEach(function(row){
    var r = el('div', 'focus-row');
    row.forEach(function(j){ r.appendChild(focusCard(j)); });
    focusGrid.appendChild(r);
  });

  /* ============ 공고 리스트 (AMBasicJobCard) ============ */
  function listCard(j){
    var c = el('article', 'list-card');
    var top = el('div', 'list-top');
    top.appendChild(el('p', 'list-company', j.company));
    var main = el('div', 'list-main');
    var info = el('div', 'list-info');
    info.appendChild(el('p', 'list-title', j.title));
    info.appendChild(payEl(j.payType, j.pay, 'list-pay'));
    main.appendChild(info);
    if (j.logo){
      var lg = el('div', 'list-logo');
      lg.appendChild(img('assets/home/logo-27.png'));
      main.appendChild(lg);
    }
    top.appendChild(main);
    c.appendChild(top);
    var tags = el('div', 'list-tags');
    j.tags.forEach(function(t, i){
      var tg = el('span', 'list-tag');
      if (i === 0) tg.appendChild(img('assets/home/list-chip-back.svg', 16, 16));
      tg.appendChild(document.createTextNode(t));
      tags.appendChild(tg);
    });
    c.appendChild(tags);
    return c;
  }
  var listSec = $('list-sec');
  J.list.forEach(function(j){ listSec.appendChild(listCard(j)); });

  /* ============ 스크롤: 헤더 배경 ============ */
  function onScroll(){ header.classList.toggle('is-scrolled', scroller.scrollTop > 0); }
  scroller.addEventListener('scroll', onScroll, { passive: true });

  /* ============ 연출 공통 ============ */
  var timers = [];
  var anims = [];
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function track(a){ anims.push(a); return a; }
  function stopAll(){
    timers.forEach(clearTimeout);
    timers = [];
    anims.forEach(function(a){ try { a.cancel(); } catch (e) {} });
    anims = [];
  }
  function pulse(node, count, dur){
    count = count || 1;
    dur = dur || 900;
    node.style.setProperty('--pulse-count', count);
    node.style.setProperty('--pulse-dur', dur + 'ms');
    node.classList.remove('is-pulsing');
    void node.offsetWidth;
    node.classList.add('is-pulsing');
    later(function(){ node.classList.remove('is-pulsing'); }, count * dur + 50);
  }

  /* ============ A · 코치마크 ============ */
  // 1/2 상단 지역 (Figma 5822:13819 · 흰 하이라이트 x6 y51 w159 h42 r14)
  var STEP_LOCATION = {
    text: '선택한 지역은 여기서 바꿀 수 있어요.',
    next: '다음',
    skip: true,
    rect: function(base){
      var r = locBtn.getBoundingClientRect();
      return { left: r.left - base.left - 10, top: r.top - base.top - 2, width: r.width + 20, height: r.height + 4, radius: 14, solid: true };
    },
    clone: locBtn,
    pointX: function(rect){ return rect.left + rect.width / 2; }
  };
  // A-1 · 2/2 필터 칩 (Figma 5822:16456 · 흰 박스 x12 w365 h64 r16, 말풍선 5822:16446)
  var STEP_FILTER = {
    text: '다른 조건은 여기서 바꿀 수 있어요.',
    next: '확인',
    skip: false,
    rect: function(base){
      var r = filterScroll.getBoundingClientRect();
      return { left: 12, top: r.top - base.top - 4, width: base.width - 25, height: 64, radius: 16, solid: true };
    },
    clone: filterScroll,
    pointX: function(rect, base){
      var b = filterScroll.querySelector('.filter-btn').getBoundingClientRect();
      return b.left - base.left + b.width / 2;
    }
  };
  // A-2 · 2/2 실시간 추천 알바 (Figma에 없는 안 · 문구는 초안, 사용자 확인 2026-11-16)
  // 카드 캐러셀과 '더보기' 버튼을 함께 감싼다. 배경까지 그대로 보이도록 투명 하이라이트.
  var STEP_REC = {
    text: '선택한 조건으로 추천 알바를 골랐어요.',
    next: '확인',
    skip: false,
    rect: function(base){
      var t = recTrack.getBoundingClientRect();
      var m = recMore.getBoundingClientRect();
      return { left: 8, top: t.top - base.top - 8, width: base.width - 16, height: m.bottom - t.top + 16, radius: 24, solid: false };
    },
    pointX: function(rect){ return rect.left + rect.width / 2; }
  };
  var COACH = { a1: [STEP_LOCATION, STEP_FILTER], a2: [STEP_LOCATION, STEP_REC] };
  var steps = COACH.a1;
  var coachIndex = 0;

  function placeCoach(i, animate){
    var step = steps[i];
    var base = homeScreen.getBoundingClientRect();
    var r = step.rect(base);
    spot.style.left = r.left + 'px';
    spot.style.top = r.top + 'px';
    spot.style.width = r.width + 'px';
    spot.style.height = r.height + 'px';
    spot.style.borderRadius = r.radius + 'px';
    spot.classList.toggle('is-solid', r.solid);

    // 흰 하이라이트 위의 대상은 사본으로 그려, 딤 위에서도 원래 모습 그대로 보이게 한다.
    spotClone.textContent = '';
    spotClone.classList.remove('is-swapping');
    if (step.clone){
      var src = step.clone;
      var sr = src.getBoundingClientRect();
      var copy = src.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.remove('is-pulsing');
      copy.querySelectorAll('[id]').forEach(function(n){ n.removeAttribute('id'); });
      copy.querySelectorAll('.is-pulsing').forEach(function(n){ n.classList.remove('is-pulsing'); });
      copy.style.width = sr.width + 'px';
      spotClone.appendChild(copy);
      copy.scrollLeft = src.scrollLeft;
      spotClone.style.left = (sr.left - base.left - r.left) + 'px';
      spotClone.style.top = (sr.top - base.top - r.top) + 'px';
      if (animate && !reduceMotion){
        void spotClone.offsetWidth;
        spotClone.classList.add('is-swapping');
      }
    }

    $('coach-text').textContent = step.text;
    $('coach-step').textContent = (i + 1) + '/' + steps.length;
    $('coach-next').textContent = step.next;
    $('coach-skip').hidden = !step.skip;

    // 말풍선 화살표(54px)의 가운데가 대상의 기준점을 가리키도록 맞춘다.
    var tw = tip.offsetWidth;
    var px = step.pointX(r, base);
    var left = Math.max(8, Math.min(px - 27, base.width - 8 - tw));
    tip.style.left = left + 'px';
    tip.style.top = (r.top + r.height + 8) + 'px';
    tip.style.setProperty('--arrow-x', (px - left - 27) + 'px');
    if (animate){
      tip.classList.remove('is-swapping');
      void tip.offsetWidth;
      tip.classList.add('is-swapping');
    }
  }
  // 코치마크가 떠 있는 동안 모바일 시안 버튼(좌하단)이 말풍선을 가리지 않게 숨긴다.
  function setCoachOpen(open){
    coach.hidden = !open;
    document.body.classList.toggle('coach-open', open);
  }
  function openCoach(){
    coachIndex = 0;
    setCoachOpen(true);
    coach.classList.remove('is-entering');
    void coach.offsetWidth;
    coach.classList.add('is-entering');
    placeCoach(0, false);
    if (!reduceMotion){
      track(tip.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 120, easing: 'ease-out', fill: 'backwards' }));
    }
  }
  function closeCoach(){
    if (reduceMotion){ setCoachOpen(false); return; }
    var a = track(coach.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease' }));
    a.onfinish = function(){ setCoachOpen(false); };
  }
  $('coach-skip').addEventListener('click', closeCoach);
  // 마지막 '확인'은 닫기만 한다(구 메인은 피드로 내려보내지 않는다).
  $('coach-next').addEventListener('click', function(){
    if (coachIndex < steps.length - 1){
      coachIndex++;
      placeCoach(coachIndex, true);
    } else {
      closeCoach();
    }
  });
  window.addEventListener('resize', function(){
    if (!coach.hidden) placeCoach(coachIndex, false);
  });

  /* ============ B · 하이라이트 (토스트 Figma 5822:19147) ============ */
  // 반영된 조건(상단 지역·선택된 필터 칩)을 동시에 세 번 반짝이고, 하단 토스트로 알린다.
  function playHighlight(){
    later(function(){
      [locBtn, chipJob, chipPeriod].forEach(function(n){ pulse(n, 3, 800); });
    }, 350);
    later(function(){ toast.classList.add('is-visible'); }, 650);
    later(function(){ toast.classList.remove('is-visible'); }, 3500);
  }

  /* ============ 실행 · 다시 보기 ============ */
  function reset(){
    stopAll();
    setCoachOpen(false);
    coach.classList.remove('is-entering');
    toast.classList.remove('is-visible');
    [locBtn, chipJob, chipPeriod].forEach(function(n){ n.classList.remove('is-pulsing'); });
    scroller.scrollTop = 0;
    filterScroll.scrollLeft = 0;
    focusScroll.scrollLeft = 0;
    centerRec(1);
    onScroll();
  }
  function play(){
    reset();
    if (variant === 'b'){
      playHighlight();
    } else {
      steps = COACH[variant];
      later(openCoach, 450);
    }
  }

  /* ============ 시안 비교 환경 ============ */
  var switchEl = $('variant-switch');
  var optionsEl = $('variant-options');
  VARIANTS.forEach(function(v){
    var tab = el('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.dataset.variant = v.id;
    tab.title = v.desc;
    tab.appendChild(el('b', null, v.label));
    tab.appendChild(document.createTextNode(v.name));
    switchEl.appendChild(tab);

    var opt = el('button');
    opt.type = 'button';
    opt.setAttribute('role', 'tab');
    opt.dataset.variant = v.id;
    opt.appendChild(el('strong', null, v.label + ' · ' + v.name));
    opt.appendChild(el('span', null, v.desc));
    optionsEl.appendChild(opt);
  });
  function syncVariantUI(){
    document.querySelectorAll('[data-variant]').forEach(function(b){
      b.setAttribute('aria-selected', b.dataset.variant === variant ? 'true' : 'false');
    });
    var info = variantInfo(variant);
    fab.textContent = info.label;
    fab.setAttribute('aria-label', '완료 화면 시안 선택, 현재 ' + info.label + ' ' + info.name);
  }
  function rememberVariant(){
    try {
      var u = new URL(location.href);
      u.searchParams.set('v', variant);
      history.replaceState(null, '', u);
    } catch (e) {}
  }
  function setSheet(open){
    document.body.classList.toggle('variant-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', function(e){
    var pick = e.target.closest('[data-variant]');
    if (pick){
      variant = pick.dataset.variant;
      syncVariantUI();
      rememberVariant();
      setSheet(false);
      play();
      return;
    }
    if (e.target.closest('[data-replay]')){
      setSheet(false);
      play();
    }
  });
  fab.addEventListener('click', function(){ setSheet(!document.body.classList.contains('variant-open')); });
  $('variant-backdrop').addEventListener('click', function(){ setSheet(false); });
  $('variant-close').addEventListener('click', function(){ setSheet(false); });

  /* ============ 모바일 viewport ============ */
  var root = document.documentElement;
  function fitViewport(){
    var vv = window.visualViewport;
    root.style.setProperty('--app-h', ((vv && vv.height) || window.innerHeight) + 'px');
    root.style.setProperty('--app-top', ((vv && vv.offsetTop) || 0) + 'px');
  }
  fitViewport();
  window.addEventListener('resize', fitViewport);
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', fitViewport);
    window.visualViewport.addEventListener('scroll', fitViewport);
  }

  syncVariantUI();
  // 웹폰트(CDN)가 느리면 load 이벤트가 한참 늦어지므로, 폰트를 기다리되 0.8초가 지나면 그냥 시작한다.
  // 폰트·이미지가 늦게 들어와 자리가 바뀌면 열려 있는 코치마크 위치를 다시 맞춘다.
  var started = false;
  function start(){
    if (started) return;
    started = true;
    play();
  }
  function replace(){
    if (started && !coach.hidden) placeCoach(coachIndex, false);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  setTimeout(start, 800);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', replace);
  window.addEventListener('load', replace);
})();
