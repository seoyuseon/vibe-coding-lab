(function(){
  'use strict';

  var ob = window.onboarding;
  if (!ob) return;
  var ut = window.ut || { log: function(){}, screen: function(){} };

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var detail = $('detail');
  var scroller = $('detail-scroll');
  var taskEnd = $('task-end');

  // 신뢰 칩 (Figma ChipFilterRecommend 앞쪽 다섯 개)
  var CHIPS = {
    quick: { label: '빠른채용', icon: 'assets/detail/chip-quick.svg', w: 16, h: 16 },
    cert: { label: '기업인증', icon: 'assets/detail/chip-cert.svg', w: 16, h: 16 },
    contract: { label: '근로계약서약속', icon: 'assets/detail/chip-contract.svg', w: 16, h: 16 },
    insurance: { label: '4대보험', icon: 'assets/detail/chip-insurance.svg', w: 11.7596, h: 12.7343, cls: 'ic-insurance' },
    edu: { label: '성희롱예방교육수료', icon: 'assets/detail/chip-edu.svg', w: 16, h: 16 }
  };

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
  function row(label, value){
    var r = el('div', 'dt-row');
    r.appendChild(el('dt', null, label));
    var dd = el('dd');
    if (typeof value === 'string') dd.textContent = value;
    else dd.appendChild(value);
    r.appendChild(dd);
    return r;
  }

  /* ============ 그리기 ============ */
  function render(c){
    var d = c.detail || {};
    $('dt-posted').textContent = d.posted || '';
    $('dt-title').textContent = c.title;
    $('dt-deadline').textContent = d.deadline || '';
    var logo = $('dt-logo');
    logo.hidden = !c.logo;
    if (c.logo) logo.querySelector('img').src = c.logo;
    $('dt-tags').textContent = d.tags || '';

    var chips = $('dt-chips');
    chips.textContent = '';
    (d.chips || []).forEach(function(key){
      var info = CHIPS[key];
      var chip = el('span', 'dt-chip is-' + key);
      var icon = el('span', 'dt-chip-icon');
      icon.appendChild(img(info.icon, info.w, info.h, info.cls));
      chip.appendChild(icon);
      chip.appendChild(document.createTextNode(info.label));
      chips.appendChild(chip);
    });
    (d.grayChips || []).forEach(function(label){ chips.appendChild(el('span', 'dt-chip is-gray', label)); });
    chips.scrollLeft = 0;

    // 근무조건
    var cond = $('dt-cond');
    cond.textContent = '';
    var pay = el('div', 'dt-pay');
    var payLine = el('div', 'dt-pay-line');
    payLine.appendChild(el('span', 'dt-pay-type', c.payType));
    payLine.appendChild(el('span', 'dt-pay-amount', c.pay));
    pay.appendChild(payLine);
    pay.appendChild(el('p', 'dt-pay-note', '2026년 최저시급 10,320원'));
    cond.appendChild(row('급여', pay));
    cond.appendChild(row('근무기간', c.period === '1일' ? '하루(1일)' : c.period));
    var days = el('span', null, c.days);
    if (c.days === '요일협의'){
      days.appendChild(document.createTextNode(' '));
      days.appendChild(el('span', 'dt-soft', '(원하는 날 출근 가능)'));
    }
    cond.appendChild(row('근무요일', days));
    cond.appendChild(row('근무시간', c.time));
    cond.appendChild(row('업직종', d.kind || ''));
    if (c.brand) cond.appendChild(row('브랜드', c.brand));
    cond.appendChild(row('고용형태', d.employ || '알바'));
    cond.appendChild(row('복리후생', d.welfare || ''));

    // 모집조건
    var recruit = $('dt-recruit');
    recruit.textContent = '';
    recruit.appendChild(row('모집마감', d.closing || '상시모집'));
    recruit.appendChild(row('모집인원', d.headcount || '00명(인원미정)'));
    recruit.appendChild(row('학력', '학력무관'));
    recruit.appendChild(row('우대사항', d.prefer || ''));

    // 근무지역
    $('dt-address').textContent = c.address || c.location;
    $('dt-map').hidden = !!c.remote;

    // 상세요강
    var desc = $('dt-desc');
    desc.textContent = '';
    (d.lines || []).forEach(function(line){
      desc.appendChild(el('p', /^\[/.test(line) ? 'is-head' : null, line));
    });
  }

  /* ============ 열기 · 닫기 ============ */
  var current = null;
  var openedAt = 0;
  var maxScroll = 0;
  function open(card, index){
    current = card;
    render(card);
    detail.hidden = false;
    scroller.scrollTop = 0;
    maxScroll = 0;
    void detail.offsetWidth;
    detail.classList.add('is-open');
    openedAt = Date.now();
    ut.screen('detail', 'home');
    ut.log('detail_open', { index: index + 1, job: card.job, title: card.title, company: card.company });
  }
  function close(via){
    if (detail.hidden) return;
    var depth = scroller.scrollHeight - scroller.clientHeight;
    ut.log('detail_close', { via: via, ms: Date.now() - openedAt, scrollPct: depth > 0 ? Math.round(maxScroll / depth * 100) : 100, title: current && current.title });
    ut.screen('home', 'detail');
    detail.classList.remove('is-open');
    setTimeout(function(){ if (!detail.classList.contains('is-open')) detail.hidden = true; }, 320);
  }
  function hideNow(){
    detail.classList.remove('is-open');
    detail.hidden = true;
    taskEnd.hidden = true;
  }
  scroller.addEventListener('scroll', function(){ if (scroller.scrollTop > maxScroll) maxScroll = scroller.scrollTop; }, { passive: true });
  $('detail-back').addEventListener('click', function(){ close('back'); });
  detail.addEventListener('click', function(e){
    var t = e.target.closest('[data-detail]');
    if (t) ut.log('detail_tap', { target: t.dataset.detail, title: current && current.title });
  });
  $('detail-apply').addEventListener('click', function(){
    ut.log('apply_tap', { title: current && current.title, job: current && current.job, ms: Date.now() - openedAt });
    showTaskEnd('apply', { title: current && current.title });
  });

  /* ============ 과제 종료 팝업 ============ */
  // 공고뷰의 '지원하기' 또는 홈에서 공고가 아닌 곳(탭바·검색·퀵메뉴·지역·필터 등)을 누르면 띄운다.
  function showTaskEnd(trigger, extra){
    var info = Object.assign({ trigger: trigger, homeMs: ob.homeElapsed ? ob.homeElapsed() : null }, extra || {});
    ut.log('task_end', info);
    taskEnd.hidden = false;
    var modal = taskEnd.querySelector('.task-end-modal');
    try {
      modal.animate([{ opacity: 0, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } catch (e) {}
  }
  $('task-end-ok').addEventListener('click', function(){
    ut.log('task_end_close', {});
    taskEnd.hidden = true;
  });

  // 화면 밀어서 뒤로 가기: 과제 종료 팝업이 떠 있으면 그대로 두고, 공고뷰면 닫는다.
  window.addEventListener('onboarding:back', function(e){
    if (!taskEnd.hidden){ e.detail.action = 'task-end-open'; e.preventDefault(); return; }
    if (!detail.hidden){ e.detail.action = 'detail-close'; e.preventDefault(); close('swipe'); }
  });

  // 화면이 바뀌면(홈 다시 열기·처음부터 등) 바로 닫는다.
  window.addEventListener('onboarding:screen', hideNow);

  window.jobDetail = { open: open, close: close, isOpen: function(){ return !detail.hidden; } };
  window.taskEnd = { show: showTaskEnd };
})();
