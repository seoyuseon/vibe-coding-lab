(function(){
  'use strict';

  // 공고 목록은 jobs.js가 만든다.
  var feed = window.jobFeed;

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var homeScreen = document.querySelector('.screen.home');
  var scroller = $('home-scroll');
  var header = $('home-header');
  var filterBar = $('filter-bar');
  var jobList = $('job-list');

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

  /* ============ 추천 사유 (Figma 혼합 Test 5447:15627 · 5447:15693) ============ */
  // 최근 검색: B1 질문형 '{키워드} 찾고 계셨죠?'(키워드만 SemiBold) / 최근 지원: 초안 담백형 문구 그대로
  function reasonEl(r){
    var wrap = el('span', 'jp-reason');
    wrap.appendChild(img('assets/home/card-reason.svg', 14, 14));
    var text = el('span');
    if (r.type === 'search'){
      text.appendChild(el('b', null, r.keyword));
      text.appendChild(document.createTextNode(' 찾고 계셨죠?'));
    } else {
      text.textContent = '최근 지원한 알바와 비슷해요';
    }
    wrap.appendChild(text);
    return wrap;
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
    var head = el('div', 'jp-head');
    var company = el('p', 'jp-company');
    company.appendChild(el('span', null, c.company));
    if (c.ad){
      company.appendChild(img('assets/home/card-dot.svg', 2, 2, 'jp-dot'));
      company.appendChild(el('span', 'jp-ad', '광고'));
    }
    if (c.reason){
      company.classList.add('has-reason');
      company.appendChild(reasonEl(c.reason));
    }
    head.appendChild(company);
    head.appendChild(el('p', 'jp-title', c.title));
    post.appendChild(head);

    var body = el('div', 'jp-body');
    var info = el('div', 'jp-info');
    info.appendChild(infoRow('card-location', [el('span', null, c.location)]));
    // 근무 조건: 근무요일 · 근무시간 (Figma 카드·정책서 기준)
    var schedule = [el('span', null, c.days), img('assets/home/card-dot.svg', 2, 2, 'jp-dot'), el('span', null, c.time)];
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
  var cards = feed ? feed.build() : [];
  cards.forEach(function(c, i){ jobList.appendChild(cardEl(c, i)); });

  /* ============ 스크롤: 헤더 배경 · 필터 바 고정 ============ */
  function onScroll(){
    var y = scroller.scrollTop;
    header.classList.toggle('is-scrolled', y > 0);
    var gap = filterBar.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    filterBar.classList.toggle('is-stuck', y > 0 && gap <= .5);
  }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 공고 카드 → 공고뷰 ============ */
  // 그 밖의 이동 지점(상단 지역·메뉴·검색·퀵메뉴·필터·탭바·스크랩)은 동작하지 않는다.
  homeScreen.addEventListener('click', function(e){
    var t = e.target.closest('[data-home^="card:"]');
    if (!t || e.target.closest('.jp-scrap')) return;
    var index = Number(t.dataset.home.split(':')[1]) - 1;
    if (window.jobDetail && cards[index]) window.jobDetail.open(cards[index]);
  });
})();
