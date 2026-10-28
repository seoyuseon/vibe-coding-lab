(function(){
  'use strict';

  var ob = window.onboarding;
  if (!ob) return;

  /* ============ 데이터 ============ */
  // 2026-10-22 재정리: 남은 시안을 A~D로 다시 부르고, 소거된 시안은 '드랍했던 버전 A/B안'으로 부른다.
  // dropped: 전환 탭에서만 빠지고 링크(?v=drop-a)로는 계속 볼 수 있다.
  var VARIANTS = [
    { id: 'a', label: 'A', name: '코치마크', desc: '조건을 바꾸는 위치를 짚어줘요' },
    { id: 'b', label: 'B', name: '하이라이트', desc: '적용된 조건을 한 번에 반짝이고 토스트로 알려줘요' },
    { id: 'c', label: 'C', name: '스크롤 힌트', desc: '공고 리스트가 아래로 이어진다는 걸 살짝 보여줘요' },
    { id: 'd', label: 'D', name: '팝업', desc: '맞춤 조건을 팝업으로 보여주고 홈으로 안내해요' },
    { id: 'drop-a', label: '드랍 A', short: '드A', name: '조건 착지', desc: '고른 조건이 칩으로 모였다가 제자리에 앉아요', dropped: true },
    { id: 'drop-b', label: '드랍 B', short: '드B', name: '공고 영역 로딩', desc: '공고 영역에서 맞춤 공고를 준비하는 과정을 보여줘요', dropped: true }
  ];
  function variantInfo(id){
    return VARIANTS.filter(function(x){ return x.id === id; })[0];
  }
  var PERIOD_LABEL = { 'within-month': '한 달 이내', 'over-month': '한 달 이상' };

  // Figma 메인 화면(4542:208609) 상단 8개 공고
  var CARDS = [
    { company: '스타벅스 선릉로', title: '스타벅스 선릉로점 바리스타 모집', location: '서울 강남구 역삼동', period: '1년이상', time: '시간협의', pay: '11,250원', thumb: 'assets/home/card-starbucks.png' },
    { company: '브레마리', title: '브레마리에서 함께 할 바리스타를 모집합니다.', location: '서울 서초구 방배동', period: '6개월~1년', time: '시간협의', pay: '12,000원' },
    { company: '㈜이디야', ad: true, title: '[이디야커피] 직영점 정규직 바리스타 채용', location: '서울 전체', period: '1년이상', time: '시간협의', pay: '2,160,000원', monthly: true },
    { company: '㈜마이핏', title: '반포래미안아이파크 카페 토,일 오전 바리스타 모집', location: '서울 서초구 반포동', period: '6개월~1년', time: '시간협의', quick: true, pay: '11,700원' },
    { company: '무너미(munumi)', title: '무너미(munumi)카페 바리스타 주말 바리스타 채용', location: '서울 강북구 수유동', period: '1년이상', time: '16:00~21:00', pay: '10,400원' },
    { company: '에스프레소코아', title: '에스프레소코아 바리스타 모집', location: '서울 용산구 한남동', period: '6개월~1년', time: '07:00~14:00', pay: '10,320원', thumb: 'assets/home/card-espressocore.jpg' },
    { company: '루리커피(ㄹㄹㅋㅍ)', title: '루리커피 바리스타 모집', location: '서울 전체', period: '6개월~1년', time: '10:00~19:00', pay: '11,000원' },
    { company: '아티제', ad: true, title: '[정직원/초보가능] 카페 바리스타 채용', location: '서울 강서구 등촌1동', period: '1년이상', time: '시간협의', pay: '2,365,560원', monthly: true }
  ];

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var phone = document.querySelector('.phone');
  var homeScreen = document.querySelector('.screen.home');
  var scroller = $('home-scroll');
  var header = $('home-header');
  var locBtn = $('home-location');
  var locText = locBtn.querySelector('.home-location-text');
  var locLabel = $('home-location-label');
  var filterBar = $('filter-bar');
  var filterScroll = filterBar.querySelector('.filter-scroll');
  var chipJob = $('chip-job');
  var chipPeriod = $('chip-period');
  var loader = $('rec-loader');
  var jobList = $('job-list');
  var homeToast = $('home-toast');
  var hint = $('scroll-hint');
  var rec = $('rec');
  var coach = $('coach');
  var spot = $('coach-spot');
  var tip = $('coach-tip');
  var spotClone = $('coach-clone');
  var popup = $('popup');
  var flyLayer = $('fly-layer');
  var fab = $('variant-fab');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var variant = pickVariant(params.get('v'));

  // 링크로 지정하면 소거된 시안도 열 수 있고, 지정이 없으면 남아 있는 첫 시안으로 시작한다.
  function pickVariant(v){
    v = (v || '').toLowerCase();
    if (VARIANTS.some(function(x){ return x.id === v; })) return v;
    return VARIANTS.filter(function(x){ return !x.dropped; })[0].id;
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
  function cardEl(c){
    var post = el('article', 'job-post');
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
      el('span', 'jp-pay-type' + (c.monthly ? ' is-monthly' : ''), c.monthly ? '월급' : '시급'),
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
  CARDS.forEach(function(c){ jobList.appendChild(cardEl(c)); });

  /* ============ 온보딩 조건 → 홈 표시 ============ */
  // 지역: STEP 1 첫 선택지 기준 반경 표기 / 하는 일: 첫 선택 + 외 N / 기간: 한 달 이내·이상만 선택 상태
  // 내 근처로 정했다면 위치 이름(동, 기본 위치는 시청역) + 고른 반경
  function nearbyLabel(s){
    return (s.place.label || s.place.dong || s.place.gu || '내 근처') + ' ' + s.radius + 'km';
  }
  function conditions(){
    var s = ob.getState();
    var place = '서초구';
    if (s.selected.length){
      var p = s.selected[0].split('|');
      place = p[1] === '*' ? p[0] : p[1].split(' ').pop();
    }
    var names = s.jobs.map(ob.jobName);
    return {
      location: s.mode === 'nearby' ? nearbyLabel(s) : place + ' 10km',
      period: PERIOD_LABEL[s.period] || null,
      periodText: PERIOD_LABEL[s.period] || '상관 없어요',
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
    if (!nudging && y > 8) hint.classList.remove('is-visible');
    header.classList.toggle('is-scrolled', y > 0);
    var gap = filterBar.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    filterBar.classList.toggle('is-stuck', y > 0 && gap <= .5);
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
    flyLayer.textContent = '';
    homeScreen.style.opacity = '';
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
  function revealCards(delay){
    jobList.classList.remove('is-hidden');
    if (reduceMotion) return;
    Array.prototype.forEach.call(jobList.children, function(card, i){
      track(card.animate(
        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: (delay || 0) + i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
      ));
    });
  }
  function reset(){
    stopAll();
    stopNudge();
    hint.classList.remove('is-visible');
    coach.hidden = true;
    coach.classList.remove('is-entering');
    popup.hidden = true;
    homeToast.classList.remove('is-visible');
    loader.hidden = true;
    loader.classList.remove('is-done');
    loader.querySelectorAll('.setup-chip').forEach(function(r){ r.classList.remove('is-done'); });
    $('setup-title').textContent = '선택한 조건으로 맞춤 공고를 준비하고 있어요';
    jobList.classList.remove('is-hidden');
    [locBtn, chipJob, chipPeriod].forEach(function(n){ n.classList.remove('is-awaiting', 'is-pulsing'); });
    scroller.scrollTop = 0;
    filterScroll.scrollLeft = 0;
    applyFinal(conditions());
    onScroll();
  }
  function enterHome(){
    ob.go('home');
    document.body.classList.remove('is-replaying');
    reset();
  }

  // 필터 바가 헤더 아래 고정되는 스크롤 위치 (Figma '버튼 누르면 스크롤되어 올라가게')
  function stickyTop(){
    return rec.offsetTop + filterBar.offsetTop - header.offsetHeight;
  }

  /* ============ 드랍했던 버전 A안 · 조건 착지 ============ */
  // '공고 보기'를 누르면 고른 조건이 칩 한 줄로 모였다가, 홈이 열리며 각자 제자리(상단 지역·필터 칩)로 날아가 앉는다.
  function relRect(node){
    var base = phone.getBoundingClientRect();
    var r = node.getBoundingClientRect();
    return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
  }
  function ghost(label, icon){
    var g = el('div', 'ghost');
    if (icon) g.appendChild(img(icon, 16, 16));
    g.appendChild(el('span', null, label));
    flyLayer.appendChild(g);
    return g;
  }
  function px(n){ return Math.round(n * 10) / 10 + 'px'; }
  function land(g, target){
    target.classList.remove('is-awaiting');
    pulse(target);
    track(g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
  }

  function playLanding(){
    if (reduceMotion){ enterHome(); return; }
    var c = conditions();
    var cta = $('step3-next');
    var ctaR = relRect(cta);
    var step3El = document.querySelector('.screen.step3');

    // 홈을 STEP 3 위에 투명하게 깔고 착지 위치를 잰다.
    reset();
    locBtn.classList.add('is-awaiting');
    if (c.job) chipJob.classList.add('is-awaiting');
    if (c.period) chipPeriod.classList.add('is-awaiting');
    jobList.classList.add('is-hidden');
    homeScreen.hidden = false;
    homeScreen.style.opacity = '0';

    var items = [{ label: c.location, icon: 'assets/home/header-location-pin.svg', target: relRect(locText), node: locBtn, header: true }];
    if (c.job) items.push({ label: c.job, target: relRect(chipJob), node: chipJob });
    if (c.period) items.push({ label: c.period, target: relRect(chipPeriod), node: chipPeriod });

    // 칩을 선택 상태 모양 그대로 한 줄(넘치면 세로)로 모은다.
    var W = phone.clientWidth;
    var gap = 8;
    items.forEach(function(it){ it.g = ghost(it.label, it.icon); it.w = it.g.offsetWidth; });
    var total = items.reduce(function(sum, it){ return sum + it.w; }, 0) + gap * (items.length - 1);
    var row = total <= W - 32;
    var x = (W - total) / 2;
    var y0 = ctaR.top - 32 - 28 - (row ? 0 : (items.length - 1) * (32 + gap));
    items.forEach(function(it, i){
      it.sx = row ? x : (W - it.w) / 2;
      it.sy = row ? y0 : y0 + i * (32 + gap);
      x += it.w + gap;
    });

    track(cta.animate([{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 180 }));
    track(step3El.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 140, easing: 'ease', fill: 'forwards' }));
    track(homeScreen.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 520, easing: 'ease', fill: 'forwards' }));

    items.forEach(function(it, i){
      var t = it.target;
      var start = { left: px(it.sx), top: px(it.sy), width: px(it.w), height: '32px' };
      var end = it.header
        ? { left: px(t.left), top: px(t.top), width: px(t.width), height: px(t.height), paddingLeft: '0px', paddingRight: '0px', fontSize: '18px', fontWeight: 700, backgroundColor: 'rgba(244,246,247,0)', borderColor: 'rgba(19,22,24,0)', boxShadow: '0 0 0 rgba(0,0,0,0)', opacity: 1, transform: 'none', offset: 1 }
        : { left: px(t.left), top: px(t.top), width: px(t.width), height: px(t.height), boxShadow: '0 0 0 rgba(0,0,0,0)', opacity: 1, transform: 'none', offset: 1 };
      var a = track(it.g.animate([
        Object.assign({}, start, { opacity: 0, transform: 'translateY(10px) scale(.92)', offset: 0 }),
        Object.assign({}, start, { opacity: 1, transform: 'none', offset: .3 }),
        Object.assign({}, start, { opacity: 1, transform: 'none', offset: .48 }),
        end
      ], { duration: 1200, delay: i * 50, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'both' }));
      a.onfinish = function(){ land(it.g, it.node); };
    });

    later(function(){
      ob.go('home');
      document.body.classList.remove('is-replaying');
      homeScreen.style.opacity = '';
      revealCards(0);
    }, 1380);
    later(function(){ flyLayer.textContent = ''; }, 1800);
  }

  /* ============ 드랍했던 버전 B안 · 공고 영역에서 맞춤 공고 준비 ============ */
  function loaderRow(key){ return loader.querySelector('[data-row="' + key + '"]'); }
  function playSetup(){
    var c = conditions();
    if (reduceMotion) return;
    setChip(chipJob, '하는 일', false);
    setChip(chipPeriod, '일하는 기간', false);
    loaderRow('location').querySelector('.loader-value').textContent = c.location;
    loaderRow('job').querySelector('.loader-value').textContent = c.job || '하는 일 전체';
    loaderRow('period').querySelector('.loader-value').textContent = c.periodText;
    loader.hidden = false;
    jobList.classList.add('is-hidden');
    var bar = $('setup-bar');
    track(bar.animate([{ width: '0%' }, { width: '100%' }], { duration: 1500, delay: 200, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' }));

    // 지역 → 하는 일 → 기간 순으로 반영하고, 위쪽 칩도 같은 순간에 선택 상태로 바뀐다.
    later(function(){ loaderRow('location').classList.add('is-done'); pulse(locBtn); }, 550);
    later(function(){
      loaderRow('job').classList.add('is-done');
      if (c.job){ setChip(chipJob, c.job, true); pulse(chipJob); }
    }, 1000);
    later(function(){
      loaderRow('period').classList.add('is-done');
      if (c.period){ setChip(chipPeriod, c.period, true); pulse(chipPeriod); }
    }, 1450);
    later(function(){
      var title = $('setup-title');
      title.textContent = '맞춤 공고를 준비했어요';
      title.classList.remove('is-swapping');
      void title.offsetWidth;
      title.classList.add('is-swapping');
      loader.classList.add('is-done');
    }, 1750);
    later(function(){
      var h = loader.offsetHeight;
      var a = track(loader.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' }));
      a.onfinish = function(){ loader.hidden = true; };
      revealCards(140);
    }, 2350);
  }

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
    coach.hidden = false;
    coach.classList.remove('is-entering');
    void coach.offsetWidth;
    coach.classList.add('is-entering');
    placeCoach(0);
    if (!reduceMotion){
      track(tip.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 120, easing: 'ease-out', fill: 'backwards' }));
    }
  }
  function closeCoach(done){
    if (reduceMotion){ coach.hidden = true; if (done) done(); return; }
    var a = track(coach.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease' }));
    a.onfinish = function(){ coach.hidden = true; if (done) done(); };
  }
  $('coach-skip').addEventListener('click', function(){ closeCoach(); });
  $('coach-next').addEventListener('click', function(){
    if (coachIndex < COACH.length - 1){
      coachIndex++;
      placeCoach(coachIndex);
    } else {
      closeCoach(function(){ animateScroll(stickyTop(), 600); });
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

  /* ============ C · 스크롤 힌트 (토스트 Figma 4598:287703) ============ */
  // 첫 화면은 그대로 두고, 화면이 살짝 올라갔다 돌아오며 아래 안내를 띄운다. 첫 스크롤에 사라진다.
  var nudging = false;
  var nudgeRaf = 0;
  var userScrolled = false;  // 사용자가 직접 스크롤을 시작했는지 (스크롤 위치가 아니라 입력으로 판단)
  function animateScroll(to, dur, done){
    var from = scroller.scrollTop;
    var t0 = performance.now();
    cancelAnimationFrame(nudgeRaf);
    function step(now){
      var p = Math.min(1, (now - t0) / dur);
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scroller.scrollTop = from + (to - from) * e;
      if (p < 1) nudgeRaf = requestAnimationFrame(step);
      else if (done) done();
    }
    nudgeRaf = requestAnimationFrame(step);
  }
  function stopNudge(){
    cancelAnimationFrame(nudgeRaf);
    nudging = false;
  }
  // 사용자가 직접 스크롤을 시작하면 넛지를 멈추고, 안내도 띄우지 않는다.
  ['wheel', 'touchstart', 'pointerdown'].forEach(function(type){
    scroller.addEventListener(type, function(){
      userScrolled = true;
      stopNudge();
    }, { passive: true });
  });
  function playScrollHint(){
    if (reduceMotion){ later(function(){ hint.classList.add('is-visible'); }, 300); return; }
    later(function(){
      if (userScrolled) return;  // 이미 직접 스크롤했다면 넛지도 안내도 생략
      nudging = true;
      animateScroll(120, 520, function(){
        later(function(){
          if (userScrolled) return;
          // 화면이 제자리로 내려오는 동안 안내가 함께 떠오른다.
          hint.classList.add('is-visible');
          animateScroll(0, 560, function(){ nudging = false; });
        }, 160);
      });
    }, 650);
  }
  hint.addEventListener('click', function(){
    hint.classList.remove('is-visible');
    animateScroll(stickyTop(), 600);
  });

/* ============ D · 팝업 (Figma 4598:280965 → 4598:282101) ============ */
  // 홈 위에 맞춤 조건 팝업을 띄운다. 조건 배지는 자동으로 가로 흐르고, 버튼을 누르면 필터 고정 위치까지 스크롤된다.
  var badgeTrack = $('popup-badges');
  var marquee = null;
  function badgeLabels(){
    var s = ob.getState();
    var list = s.mode === 'nearby' ? [nearbyLabel(s)] : s.selected.map(function(k){
      var p = k.split('|');
      return p[1] === '*' ? p[0] + ' 전체' : p[0] + ' ' + p[1];
    });
    if (PERIOD_LABEL[s.period]) list.push(PERIOD_LABEL[s.period]);
    return list.concat(s.jobs.map(ob.jobName));
  }
  function fillBadges(){
    if (marquee){ marquee.cancel(); marquee = null; }
    badgeTrack.textContent = '';
    var labels = badgeLabels();
    labels.forEach(function(t){ badgeTrack.appendChild(el('span', 'popup-badge', t)); });
    return labels;
  }
  function startMarquee(labels){
    var viewport = badgeTrack.parentNode.clientWidth;
    if (reduceMotion || badgeTrack.scrollWidth <= viewport) return;
    // 같은 배지를 한 벌 더 붙여 끊김 없이 이어지게 한다.
    labels.forEach(function(t){ badgeTrack.appendChild(el('span', 'popup-badge', t)); });
    var dist = badgeTrack.children[labels.length].offsetLeft - badgeTrack.children[0].offsetLeft;
    marquee = badgeTrack.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-dist) + 'px)' }], { duration: dist / 32 * 1000, delay: 700, iterations: Infinity });
    track(marquee);
  }
  function openPopup(){
    var labels = fillBadges();
    popup.hidden = false;
    var modal = popup.querySelector('.popup-modal');
    if (!reduceMotion){
      track(popup.querySelector('.popup-dim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease', fill: 'backwards' }));
      track(modal.animate([{ opacity: 0, transform: 'translateY(16px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 80, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    }
    startMarquee(labels);
  }
  function closePopup(done){
    var finish = function(){ popup.hidden = true; if (marquee){ marquee.cancel(); marquee = null; } if (done) done(); };
    if (reduceMotion){ finish(); return; }
    track(popup.querySelector('.popup-dim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease', fill: 'forwards' }));
    var a = track(popup.querySelector('.popup-modal').animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }));
    a.onfinish = finish;
  }
  $('popup-close').addEventListener('click', function(){ closePopup(); });
  $('popup-cta').addEventListener('click', function(){
    closePopup(function(){ animateScroll(stickyTop(), 600); });
  });
  function playPopup(){ later(openPopup, 450); }

  /* ============ 실행 · 다시 보기 ============ */
  function playHome(v){
    enterHome();
    userScrolled = false;
    if (v === 'a') playCoach();
    else if (v === 'b') playHighlight();
    else if (v === 'c') playScrollHint();
    else if (v === 'd') playPopup();
    else if (v === 'drop-b') playSetup();
  }
  // 드랍했던 버전 A안은 STEP 3에서 시작하는 전환이라, 다시 볼 때도 STEP 3부터 재생한다.
  function playFromStep3(){
    stopAll();
    document.body.classList.add('is-replaying');
    ob.go('step3');
    later(playLanding, 650);
  }
  function replay(){
    // 온보딩을 거치지 않고 완료 화면을 열면 기본 조건으로 채운다.
    if (!ob.getState().jobs.length) ob.applyPreset();
    if (variant === 'drop-a') playFromStep3();
    else playHome(variant);
  }
  window.addEventListener('onboarding:complete', function(){
    if (variant === 'drop-a') playLanding();
    else playHome(variant);
  });

  /* ============ 시안 비교 환경 ============ */
  var switchEl = $('variant-switch');
  var optionsEl = $('variant-options');
  VARIANTS.forEach(function(v){
    if (v.dropped && v.id !== variant) return;
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
    fab.textContent = info.short || info.label;
    fab.setAttribute('aria-label', '완료 화면 시안 선택, 현재 ' + info.label);
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
      replay();
      return;
    }
    if (e.target.closest('[data-replay]')){
      setSheet(false);
      replay();
      return;
    }
    // 처음부터: 온보딩 상태를 비우고 로그인 화면으로 돌아간다.
    if (e.target.closest('[data-restart]')){
      setSheet(false);
      stopAll();
      reset();
      document.body.classList.remove('is-replaying');
      ob.go('login');
      try {
        var u = new URL(location.href);
        u.searchParams.delete('done');
        history.replaceState(null, '', u);
      } catch (err) {}
    }
  });
  fab.addEventListener('click', function(){ setSheet(!document.body.classList.contains('variant-open')); });
  $('variant-backdrop').addEventListener('click', function(){ setSheet(false); });
  $('variant-close').addEventListener('click', function(){ setSheet(false); });
  syncVariantUI();

  // ?done → 미리 정한 조건으로 완료 화면을 바로 연다. (예: index.html?done&v=b, 드랍 시안은 ?done&v=drop-a)
  if (params.has('done')) replay();
})();
