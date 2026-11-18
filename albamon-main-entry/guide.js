/* 시안 설명 패널 (PC 전용 · guide.css)
   '목적'은 늘 펼쳐 두고, 지금 보는 시안(body[data-ver]) 항목을 펼치고 표시한다. 나머지 시안은 접는다. */
(function(){
  'use strict';

  var panel = document.getElementById('guide');
  if (!panel) return;
  var list = panel.querySelector('.pol-list');
  var sections = Array.prototype.slice.call(panel.querySelectorAll('.pol-sec[data-pol]'));
  var shown = null;

  function sync(){
    var ver = document.body.dataset.ver || 'a';
    if (ver === shown) return;
    shown = ver;
    var target = null;
    sections.forEach(function(s){
      var key = s.dataset.pol;
      if (key === 'overview') return;
      var on = key === ver;
      s.classList.toggle('is-current', on);
      s.open = on;
      if (on) target = s;
    });
    if (target && list.offsetParent) reveal(target);
  }
  // 펼친 항목이 패널 밖에 있을 때만 위로 맞춰 스크롤한다.
  function reveal(target){
    var top = target.offsetTop;
    var bottom = top + target.offsetHeight;
    if (top >= list.scrollTop && bottom <= list.scrollTop + list.clientHeight) return;
    list.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  }

  if (window.MutationObserver){
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-ver'] });
  }
  sync();
})();
