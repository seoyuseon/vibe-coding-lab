(function(){
  'use strict';

  var ob = window.onboarding;
  if (!ob) return;
  var ut = window.ut || { log: function(){}, group: function(){ return 'a'; } };

  /* ============ 데이터 ============ */
  // 완료 화면은 진행자 메뉴에서 정한 그룹으로 보여준다. A 코치마크 / B 하이라이트
  var PERIOD_LABEL = { 'within-month': '한 달 이내', 'over-month': '한 달 이상' };

  // 공고 목록은 jobs.js가 온보딩 조건에 맞춰 만든다.
  var feed = window.jobFeed;

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var homeScreen = document.querySelector('.screen.home');
  var scroller = $('home-scroll');
  var header = $('home-header');
  var locBtn = $('home-location');
  var locLabel = $('home-location-label');
  var filterBar = $('filter-bar');
  var filterScroll = filterBar.querySelector('.filter-scroll');
  var chipJob = $('chip-job');
  var chipPeriod = $('chip-period');
  var jobList = $('job-list');
  var homeToast = $('home-toast');
  var rec = $('rec');
  var coach = $('coach');
  var spot = $('coach-spot');
  var tip = $('coach-tip');
  var spotClone = $('coach-clone');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ============ 공고 카드 ============ */
  function quickBadge(){
    var wrap = el('span', 'jp-quick');
    var emoji = el('span', 'emoji-quickstart');
    ['quickstart-1', 'quickstart-2', 'quickstart-3', 'quickstart-4'].forEach(function(name, i){
      var outer = el('div', 'eq-' + (i + 1));
      var inner = el('div');
      inner.appendChild(img('assets/home/' + name + '.svg'));
      outer.appendChild(inner);
      emoji.appendChild(outer);
    });
    wrap.appendChild(emoji);
    wrap.appendChild(document.createTextNode('바로채용'));
    return wrap;
  }
  function infoRow(icon, children){
    var row = el('div', 'jp-row');
    row.appendChild(img('assets/home/' + icon + '.svg', 16, 16));
    children.forEach(function(c){ row.appendChild(c); });
    return row;
  }
  function cardEl(c, i){
    var post = el('article', 'job-post');
    post.dataset.home = 'card:' + (i + 1);
    post.dataset.job = c.job;
    post.dataset.title = c.title;
    var head = el('div', 'jp-head');
    var company = el('p', 'jp-company');
    company.appendChild(el('span', null, c.company));
    if (c.ad){
      company.appendChild(img('assets/home/card-dot.svg', 2, 2, 'jp-dot'));
      company.appendChild(el('span', 'jp-ad', '광고'));
    }
    head.appendChild(company);
    head.appendChild(el('p', 'jp-title', c.title));
    post.appendChild(head);

    var body = el('div', 'jp-body');
    var info = el('div', 'jp-info');
    info.appendChild(infoRow('card-location', [el('span', null, c.location)]));
    var schedule = [el('span', null, c.period), img('assets/home/card-dot.svg', 2, 2, 'jp-dot'), el('span', null, c.time)];
    if (c.quick) schedule.push(quickBadge());
    info.appendChild(infoRow('card-clock', schedule));
    info.appendChild(infoRow('card-won', [
      el('span', 'jp-pay-type' + (c.payType !== '시급' ? ' is-monthly' : ''), c.payType),
      el('span', 'jp-pay', c.pay)
    ]));
    body.appendChild(info);
    if (c.thumb) body.appendChild(img(c.thumb, 64, 64, 'jp-thumb'));
    post.appendChild(body);

    var scrap = el('span', 'jp-scrap');
    scrap.appendChild(img('assets/home/card-scrap.svg', 24, 24));
    post.appendChild(scrap);
    return post;
  }
  var cards = [];
  function fillCards(){
    cards = feed ? feed.build(ob.getState()) : [];
    jobList.textContent = '';
    cards.forEach(function(c, i){ jobList.appendChild(cardEl(c, i)); });
  }
  function withTimeout(promise, ms){
    return Promise.race([promise, new Promise(function(resolve){ setTimeout(resolve, ms); })]);
  }
  // 지역이 정해지면(STEP 2 진입) 근무지 동 이름을 미리 받아 둔다.
  function prepareFeed(){
    return feed ? withTimeout(feed.prepare(ob.getState()), 1500) : Promise.resolve();
  }

  /* ============ 온보딩 조건 → 홈 표시 ============ */
  // 지역: 지역 선택은 첫 선택지 기준 `○○구 10km`, 내 근처는 위치의 동 이름 + 고른 반경
  // 하는 일: 첫 선택 + 외 N / 기간: 한 달 이내·이상만 선택 상태
  function conditions(){
    var s = ob.getState();
    var location;
    if (s.mode === 'nearby'){
      location = (s.place.label || s.place.dong || s.place.gu || '내 근처') + ' ' + s.radius + 'km';
    } else {
      var place = '서초구';
      if (s.selected.length){
        var p = s.selected[0].split('|');
        place = p[1] === '*' ? p[0] : p[1].split(' ').pop();
      }
      location = place + ' 10km';
    }
    var names = s.jobs.map(ob.jobName);
    return {
      location: location,
      period: PERIOD_LABEL[s.period] || null,
      job: names.length ? names[0] + (names.length > 1 ? ' 외 ' + (names.length - 1) : '') : null
    };
  }
  function setChip(chip, label, on){
    chip.querySelector('.chip-label').textContent = label;
    chip.classList.toggle('is-selected', !!on);
  }
  function applyFinal(c){
    locLabel.textContent = c.location;
    setChip(chipJob, c.job || '하는 일', !!c.job);
    setChip(chipPeriod, c.period || '일하는 기간', !!c.period);
  }

  /* ============ 스크롤: 헤더 배경 · 필터 바 고정 ============ */
  function onScroll(){
    var y = scroller.scrollTop;
    header.classList.toggle('is-scrolled', y > 0);
    var gap = filterBar.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    var stuck = y > 0 && gap <= .5;
    filterBar.classList.toggle('is-stuck', stuck);
    trackScroll(y, stuck);
  }
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
    cancelAnimationFrame(scrollRaf);
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
  function reset(){
    stopAll();
    coach.hidden = true;
    coach.classList.remove('is-entering');
    homeToast.classList.remove('is-visible');
    [locBtn, chipJob, chipPeriod].forEach(function(n){ n.classList.remove('is-pulsing'); });
    scroller.scrollTop = 0;
    filterScroll.scrollLeft = 0;
    applyFinal(conditions());
    onScroll();
  }

  // 필터 바가 헤더 아래 고정되는 스크롤 위치 (Figma '버튼 누르면 스크롤되어 올라가게')
  function stickyTop(){
    return rec.offsetTop + filterBar.offsetTop - header.offsetHeight;
  }
  var scrollRaf = 0;
  function animateScroll(to, dur){
    var from = scroller.scrollTop;
    var t0 = performance.now();
    cancelAnimationFrame(scrollRaf);
    function step(now){
      var p = Math.min(1, (now - t0) / dur);
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = from + (to - from) * e;
      if (p < 1) scrollRaf = requestAnimationFrame(step);
    }
    scrollRaf = requestAnimationFrame(step);
  }
  ['touchstart', 'wheel'].forEach(function(type){
    scroller.addEventListener(type, function(){ cancelAnimationFrame(scrollRaf); }, { passive: true });
  });

  /* ============ 홈 행동 기록 ============ */
  // 완료 화면에 들어온 뒤 첫 행동까지의 시간, 무엇을 눌렀는지, 공고 목록까지 내려봤는지를 남긴다.
  var enteredAt = 0;
  var logging = false;     // 미리보기(세션 밖)와 구분
  var firstAction = false;
  var firstScroll = false;
  var reachedList = false;
  var maxScroll = 0;
  function since(){ return Date.now() - enteredAt; }
  function markFirst(kind, target){
    if (firstAction || !logging) return;
    firstAction = true;
    ut.log('home_first_action', { kind: kind, target: target, ms: since() });
  }
  function trackScroll(y, stuck){
    if (!logging || !enteredAt) return;
    if (y > maxScroll) maxScroll = y;
    if (!firstScroll && y > 24 && !autoScrolling()){
      firstScroll = true;
      ut.log('home_scroll_first', { ms: since() });
      markFirst('scroll', 'scroll');
    }
    if (!reachedList && stuck){
      reachedList = true;
      ut.log('home_reach_list', { ms: since(), auto: autoScrolling() });
    }
  }
  var autoUntil = 0;
  function autoScrolling(){ return Date.now() < autoUntil; }
  // 공고 카드 → 공고뷰 / 카드 안 스크랩 → 기록만 / 홈 탭 → 기록만
  // 그 밖의 이동 지점(상단 지역·메뉴·검색·퀵메뉴·필터·탭바) → 과제 종료 팝업
  homeScreen.addEventListener('click', function(e){
    var t = e.target.closest('[data-home]');
    if (!t || coach.contains(t)) return;
    var target = t.dataset.home;
    var info = { target: target, ms: since() };
    if (t.dataset.job){ info.job = t.dataset.job; info.title = t.dataset.title; }
    if (e.target.closest('.jp-scrap')){
      info.target = 'scrap:' + target.split(':')[1];
      if (logging) ut.log('home_tap', info);
      return;
    }
    if (logging){
      ut.log('home_tap', info);
      markFirst('tap', target);
    }
    if (target.indexOf('card:') === 0){
      var index = Number(target.split(':')[1]) - 1;
      if (window.jobDetail && cards[index]) window.jobDetail.open(cards[index], index);
      return;
    }
    if (target === 'tab:홈') return;
    if (window.taskEnd) window.taskEnd.show('home:' + target);
  });
  ob.homeElapsed = function(){ return enteredAt ? Date.now() - enteredAt : null; };

  /* ============ A · 코치마크 (Figma 4598:284332 · 4598:287708) ============ */
  // 1) 상단 지역 → 2) 필터 바. 마지막 '홈에서 알바찾기'를 누르면 필터가 고정되는 위치까지 스크롤된다.
  var COACH = [
    {
      text: '선택한 지역은 여기서 바꿀 수 있어요.',
      next: '다음',
      skip: true,
      // 흰 하이라이트(10·8px 여백, r14) + 지역 버튼 사본
      rect: function(base){
        var r = locBtn.getBoundingClientRect();
        return { left: r.left - base.left - 10, top: r.top - base.top - 2, width: r.width + 20, height: r.height + 4, radius: 14, solid: true };
      },
      pointX: function(rect){ return rect.left + rect.width / 2; }
    },
    {
      text: '다른 조건은 여기서 바꿀 수 있어요.',
      next: '홈에서 알바찾기',
      skip: false,
      // 필터 바 아래 16px까지 (x10, w365, h64, r16)
      rect: function(base){
        var r = filterBar.getBoundingClientRect();
        return { left: 10, top: r.top - base.top, width: base.width - 25, height: 64, radius: 16, solid: false };
      },
      pointX: function(rect, base){
        var b = filterBar.querySelector('.filter-btn').getBoundingClientRect();
        return b.left - base.left + b.width / 2;
      }
    }
  ];
  var coachIndex = 0;
  var coachAt = 0;
  function placeCoach(i){
    var step = COACH[i];
    var base = homeScreen.getBoundingClientRect();
    var r = step.rect(base);
    spot.style.left = r.left + 'px';
    spot.style.top = r.top + 'px';
    spot.style.width = r.width + 'px';
    spot.style.height = r.height + 'px';
    spot.style.borderRadius = r.radius + 'px';
    spot.classList.toggle('is-solid', r.solid);

    // 1단계: 하이라이트 안의 지역 버튼은 흰 배경 위에 사본으로 그린다.
    spotClone.textContent = '';
    if (r.solid){
      var copy = locBtn.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(function(n){ n.removeAttribute('id'); });
      copy.classList.remove('is-pulsing');
      spotClone.appendChild(copy);
      spotClone.style.left = (r.left + 10) + 'px';
      spotClone.style.top = (r.top + 2) + 'px';
    }
    spotClone.hidden = !r.solid;

    $('coach-text').textContent = step.text;
    $('coach-step').textContent = (i + 1) + '/' + COACH.length;
    $('coach-next').textContent = step.next;
    $('coach-skip').hidden = !step.skip;

    // 말풍선 화살표(54px)의 가운데가 대상의 기준점을 가리키도록 맞춘다.
    var tw = tip.offsetWidth;
    var px = step.pointX(r, base);
    var left = Math.max(8, Math.min(px - 27, base.width - 8 - tw));
    tip.style.left = left + 'px';
    tip.style.top = (r.top + r.height + 8) + 'px';
    tip.style.setProperty('--arrow-x', (px - left - 27) + 'px');
    if (i > 0){
      tip.classList.remove('is-swapping');
      void tip.offsetWidth;
      tip.classList.add('is-swapping');
    }
  }
  function openCoach(){
    coachIndex = 0;
    coachAt = Date.now();
    coach.hidden = false;
    coach.classList.remove('is-entering');
    void coach.offsetWidth;
    coach.classList.add('is-entering');
    placeCoach(0);
    if (!reduceMotion){
      track(tip.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 120, easing: 'ease-out', fill: 'backwards' }));
    }
    if (logging) ut.log('coach_open', { ms: since() });
  }
  function closeCoach(done){
    if (reduceMotion){ coach.hidden = true; if (done) done(); return; }
    var a = track(coach.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease' }));
    a.onfinish = function(){ coach.hidden = true; if (done) done(); };
  }
  $('coach-skip').addEventListener('click', function(){
    if (coach.hidden) return;
    if (logging){
      ut.log('coach_skip', { step: coachIndex + 1, ms: Date.now() - coachAt });
      markFirst('coach', 'skip');
    }
    closeCoach();
  });
  $('coach-next').addEventListener('click', function(){
    if (coach.hidden) return;
    if (logging) markFirst('coach', 'next');
    if (coachIndex < COACH.length - 1){
      if (logging) ut.log('coach_next', { step: coachIndex + 1, ms: Date.now() - coachAt });
      coachIndex++;
      placeCoach(coachIndex);
    } else {
      if (logging) ut.log('coach_done', { ms: Date.now() - coachAt });
      closeCoach(function(){
        autoUntil = Date.now() + 800;
        animateScroll(stickyTop(), 600);
      });
    }
  });
  function playCoach(){ later(openCoach, 450); }

  /* ============ B · 하이라이트 (토스트 Figma 4598:286585) ============ */
  // 반영된 조건(상단 지역·칩)을 동시에 세 번 반짝이고, 하단 토스트로 알린다.
  function playHighlight(){
    later(function(){
      [locBtn, chipJob, chipPeriod].forEach(function(n){
        if (n === locBtn || n.classList.contains('is-selected')) pulse(n, 3, 800);
      });
    }, 350);
    later(function(){ homeToast.classList.add('is-visible'); }, 650);
    later(function(){ homeToast.classList.remove('is-visible'); }, 3500);
  }

  /* ============ 실행 ============ */
  function playHome(group, record){
    ob.go('home');
    fillCards();
    reset();
    logging = !!record;
    enteredAt = Date.now();
    firstAction = firstScroll = reachedList = false;
    maxScroll = 0;
    if (logging) ut.log('home_enter', { group: group, location: locLabel.textContent, cards: cards.length, cardJobs: cards.map(function(c){ return c.job; }) });
    if (group === 'b') playHighlight();
    else playCoach();
  }
  window.addEventListener('onboarding:complete', function(){
    var group = ut.group();
    prepareFeed().then(function(){ playHome(group, true); });
  });
  window.addEventListener('onboarding:screen', function(e){
    if (e.detail.name === 'step2' && feed) feed.prepare(ob.getState());
    if (e.detail.name === 'home') return;
    if (e.detail.from === 'home' && logging) ut.log('home_leave', { ms: since(), maxScroll: Math.round(maxScroll) });
    logging = false;
    stopAll();
    coach.hidden = true;
    homeToast.classList.remove('is-visible');
  });

  // 앱이 다시 열렸을 때(app.js) 완료 화면을 연출 없이 되살린다. '처음 ~' 기록은 다시 남기지 않는다.
  ob.restoreHome = function(){
    prepareFeed().then(function(){
      ob.go('home');
      fillCards();
      reset();
      logging = true;
      enteredAt = Date.now();
      firstAction = firstScroll = reachedList = true;
      maxScroll = 0;
      ut.log('home_restore', { cards: cards.length });
    });
  };

  // 진행자 메뉴 '완료 화면 미리보기' · 링크 ?done&v=a|b → 기본 조건으로 바로 연다. (기록하지 않음)
  ob.previewHome = function(group){
    if (!ob.getState().jobs.length) ob.applyPreset();
    // 미리보기는 미리 받아 둔 근무지가 없으므로 조금 더 기다린다.
    var wait = feed ? withTimeout(feed.prepare(ob.getState()), 3000) : Promise.resolve();
    wait.then(function(){ playHome(group || ut.group(), false); });
  };
  if (new URLSearchParams(location.search).has('done')) ob.previewHome();
})();
