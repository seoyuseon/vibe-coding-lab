(function(){
  'use strict';

  /* ============ 실시간 추천 피드 (Figma 5828:213493) ============ */
  // 카드 맨 앞 6개는 Figma 카드 그대로, 그 뒤는 메인 공고(광고 제외)다. 데이터는 jobs.js.
  // 추천 사유 문구: 최근 검색 '{키워드} 검색 연관' / 최근 지원 '최근 지원한 알바와 비슷' (Figma 문구)
  // 카드를 누르면 공고뷰가 열린다. 필터 칩·스크랩·더보기·새로고침은 동작하지 않는다.
  var $ = function(id){ return document.getElementById(id); };
  var feedScreen = $('feed');
  var list = $('feed-list');
  var cards = window.jobFeed ? window.jobFeed.buildFeed() : [];

  function el(tag, cls, text){
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function img(src, w, h, cls){
    var node = el('img', cls);
    node.src = src; node.alt = '';
    node.width = w; node.height = h;
    return node;
  }
  function row(icon, children){
    var r = el('div', 'fc-row');
    r.appendChild(img('assets/feed/' + icon + '.svg', 16, 16));
    children.forEach(function(c){ r.appendChild(c); });
    return r;
  }
  var reasonText = window.jobFeed.reasonText;

  function cardEl(c, i){
    var card = el('article', 'fcard');
    card.dataset.feed = 'card:' + i;

    var head = el('div', 'fc-head');
    var top = el('div', 'fc-top' + (c.reason ? ' has-reason' : ''));
    top.appendChild(el('span', 'fc-company', c.company));
    if (c.reason){
      var reason = el('span', 'fc-reason');
      reason.appendChild(img('assets/feed/reason.svg', 14, 14));
      reason.appendChild(el('span', null, reasonText(c.reason)));
      top.appendChild(reason);
    }
    head.appendChild(top);
    head.appendChild(el('p', 'fc-title', c.title));
    card.appendChild(head);

    var info = el('div', 'fc-info');
    // 근무지역은 시/군/구 + 동 (Figma '강남구 논현동')
    info.appendChild(row('card-location', [el('span', null, c.location.replace(/^서울\s/, ''))]));
    info.appendChild(row('card-clock', [el('span', null, c.days), img('assets/feed/card-dot.svg', 2, 2), el('span', null, c.time)]));
    info.appendChild(row('card-won', [
      el('span', 'fc-pay-type' + (c.payType !== '시급' ? ' is-monthly' : ''), c.payType),
      el('span', 'fc-pay', c.pay)
    ]));
    card.appendChild(info);

    var actions = el('div', 'fc-actions');
    if (c.more) actions.appendChild(img('assets/feed/meatball.svg', 24, 24));
    actions.appendChild(img(c.scrapped ? 'assets/feed/scrap-on.svg' : 'assets/feed/scrap-off.svg', 24, 24));
    card.appendChild(actions);
    return card;
  }

  cards.forEach(function(c, i){ list.appendChild(cardEl(c, i)); });

  feedScreen.addEventListener('click', function(e){
    var t = e.target.closest('[data-feed^="card:"]');
    if (!t || e.target.closest('.fc-actions')) return;
    var c = cards[Number(t.dataset.feed.split(':')[1])];
    if (c && window.jobDetail) window.jobDetail.open(c);
  });

  window.recFeed = { scroller: $('feed-scroll') };
})();
