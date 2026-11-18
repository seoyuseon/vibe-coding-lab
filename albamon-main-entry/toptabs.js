(function(){
  'use strict';

  /* ============ D안 상단 칩 탭: 홈 · 실시간 추천 알바 (toptabs.css) ============ */
  // 사용자 시안 Figma 'D안 - Top 버전'(170:18843). 메인과 실시간 추천 피드를 메인 스크롤 안에서 칩 탭으로 바꾼다.
  // 최근 본·스크랩은 다른 화면으로 가는 바로가기(↗)라 여기서 다루지 않는다(동작 없음).
  // 탭 줄은 위에 붙지 않고 내용과 함께 스크롤된다(운영 메인은 헤더와 공통 필터가 위에 붙어서 탭까지 붙일 수 없다 — 사용자 2026-11-18).
  // 스크롤 위치: 탭 줄이 보이면 그 자리를 그대로 두고 새 탭을 처음부터, 탭 줄이 가려져 있으면 그 탭이 보던 곳(최소 탭 줄 바로 아래)으로.
  // 추천 패널 내용은 피드 화면(feed.js)을 복제한다.
  var $ = function(id){ return document.getElementById(id); };
  var body = document.body;
  var scroller = $('home-scroll');
  var bar = $('d-tabs');
  if (!scroller || !bar) return;
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('[data-dtab]'));
  var panels = { home: document.querySelector('.dp-home'), rec: $('dp-rec') };
  var ORDER = ['home', 'rec'];
  var current = 'home';
  var saved = { home: 0, rec: 0 };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 추천 패널: 피드의 필터 칩·카드·새로고침을 그대로 복제 ---- */
  var cards = window.jobFeed ? window.jobFeed.buildFeed() : [];
  var feedFilter = document.querySelector('#feed .feed-filter');
  var feedList = $('feed-list');
  var feedRefresh = document.querySelector('#feed .feed-refresh');
  if (feedFilter) panels.rec.appendChild(feedFilter.cloneNode(true));
  if (feedList){
    var list = feedList.cloneNode(true);
    list.removeAttribute('id');
    panels.rec.appendChild(list);
  }
  if (feedRefresh){
    var refresh = feedRefresh.cloneNode(true);
    refresh.classList.add('d-refresh');
    document.querySelector('.screen.home').appendChild(refresh);
  }
  panels.rec.addEventListener('click', function(e){
    if (e.target.closest('.fc-actions')) return;
    var t = e.target.closest('[data-feed^="card:"]');
    if (!t) return;
    var c = cards[Number(t.dataset.feed.split(':')[1])];
    if (c && window.jobDetail) window.jobDetail.open(c);
  });

  /* ---- 탭 ---- */
  function paint(){
    body.dataset.top = current;
    tabs.forEach(function(t){ t.setAttribute('aria-selected', t.dataset.dtab === current ? 'true' : 'false'); });
  }
  function slideIn(name, dir){
    if (reduceMotion) return;
    var p = panels[name];
    p.classList.remove('is-in-r', 'is-in-l');
    void p.offsetWidth;
    p.classList.add('is-in-' + dir);
  }
  Object.keys(panels).forEach(function(k){
    panels[k].addEventListener('animationend', function(){ panels[k].classList.remove('is-in-r', 'is-in-l'); });
  });

  function select(name, opts){
    opts = opts || {};
    if (!panels[name]) return;
    if (name === current){
      if (opts.toTop) scroller.scrollTop = 0;
      return;
    }
    var from = current;
    var y = scroller.scrollTop;
    var tabH = bar.offsetHeight;   // 헤더가 위에 붙어 있어, 이만큼 내리면 탭 줄이 헤더 밑으로 가려진다
    saved[from] = y;
    current = name;
    paint();
    if (opts.toTop) scroller.scrollTop = 0;
    else if (y < tabH) scroller.scrollTop = y;
    else scroller.scrollTop = Math.max(saved[name] || 0, tabH);
    slideIn(name, ORDER.indexOf(name) > ORDER.indexOf(from) ? 'r' : 'l');
  }
  bar.addEventListener('click', function(e){
    var t = e.target.closest('[data-dtab]');
    if (t) select(t.dataset.dtab);
  });

  function reset(){
    current = 'home';
    saved = { home: 0, rec: 0 };
    bar.scrollLeft = 0;
    paint();
  }

  paint();
  window.topTabs = { select: select, reset: reset };
})();
