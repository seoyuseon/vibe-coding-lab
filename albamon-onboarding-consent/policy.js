/* 화면별 정책 패널 (PC 전용 · policy.css)
   지금 보는 화면의 항목을 펼치고 나머지는 접는다. OS 권한 팝업이 떠 있으면 그 항목을 연다. */
(function(){
  'use strict';

  var panel = document.getElementById('policy');
  if (!panel) return;
  var list = panel.querySelector('.pol-list');
  var sections = Array.prototype.slice.call(panel.querySelectorAll('.pol-sec[data-pol]'));
  var osEl = document.getElementById('os-perm');
  var shown = null;

  function currentKey(){
    if (osEl && !osEl.hidden && osEl.classList.contains('is-open')) return 'os';
    return window.onboarding ? window.onboarding.current() : 'login';
  }

  function sync(){
    var key = currentKey();
    if (key === shown) return;
    shown = key;
    var target = null;
    sections.forEach(function(s){
      var on = s.dataset.pol === key;
      s.classList.toggle('is-current', on);
      s.open = on;
      if (on) target = s;
    });
    if (target && list.offsetParent) reveal(target);
  }
  // 펼친 항목이 패널 밖으로 나가 있을 때만 위쪽에 맞춰 스크롤한다.
  function reveal(target){
    var top = target.offsetTop;
    var bottom = top + target.offsetHeight;
    var viewTop = list.scrollTop;
    var viewBottom = viewTop + list.clientHeight;
    if (top >= viewTop && bottom <= viewBottom) return;
    list.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  }

  window.addEventListener('onboarding:screen', sync);
  if (osEl && window.MutationObserver){
    new MutationObserver(sync).observe(osEl, { attributes: true, attributeFilter: ['class', 'hidden'] });
  }
  sync();
})();
