(function(){
  'use strict';

  var nav = window.mainNav || { push: function(){}, pop: function(){} };

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var detail = $('detail');
  var scroller = $('detail-scroll');

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
  // 정책 패널(policy.js)이 열림 상태를 보고 공고뷰 항목을 펼친다. '지원하기'는 동작하지 않는다.
  function open(card){
    render(card);
    detail.hidden = false;
    scroller.scrollTop = 0;
    void detail.offsetWidth;
    detail.classList.add('is-open');
    nav.push('detail');
  }
  function close(via){
    if (detail.hidden) return;
    if (via !== 'swipe') nav.pop('detail');
    detail.classList.remove('is-open');
    setTimeout(function(){ if (!detail.classList.contains('is-open')) detail.hidden = true; }, 320);
  }
  $('detail-back').addEventListener('click', function(){ close('back'); });

  // 화면 밀어서 뒤로 가기: 공고뷰를 닫는다.
  window.addEventListener('main:back', function(e){
    if (e.detail.kind === 'detail') close('swipe');
  });

  window.jobDetail = { open: open, close: close, isOpen: function(){ return !detail.hidden; } };
})();
