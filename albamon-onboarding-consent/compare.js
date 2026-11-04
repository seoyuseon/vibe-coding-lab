(function(){
  'use strict';

  /* ============ 위치 동의 플로우 수정 전/후 비교 ============ */
  // 수정 전: STEP 0 '내 근처 선택하기' → 위치 동의 시트 → OS 권한
  // 수정 후: STEP 0 하단 문구로 위치기반서비스 이용약관 동의를 대신하고 → OS 권한 (Figma TO-BE 4963:111964)
  // 링크로 고를 수 있다: ?ver=before | ?ver=after (지정이 없으면 수정 후)
  var VERSIONS = { before: '전', after: '후' };
  var $ = function(id){ return document.getElementById(id); };
  var body = document.body;
  var fab = $('cmp-fab');

  var ver = new URLSearchParams(location.search).get('ver') === 'before' ? 'before' : 'after';
  body.dataset.ver = ver;

  function sync(){
    document.querySelectorAll('[data-ver-pick]').forEach(function(b){
      b.setAttribute('aria-selected', b.dataset.verPick === ver ? 'true' : 'false');
    });
    fab.textContent = VERSIONS[ver];
    fab.setAttribute('aria-label', '위치 동의 플로우 버전 선택, 현재 수정 ' + VERSIONS[ver]);
  }
  function remember(){
    try {
      var u = new URL(location.href);
      u.searchParams.set('ver', ver);
      history.replaceState(history.state, '', u);
    } catch (e) {}
  }
  function setSheet(open){
    body.classList.toggle('cmp-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // 버전을 바꾸면 STEP 0부터 다시 본다. 로그인 화면에서는 그대로 머문다.
  document.addEventListener('click', function(e){
    var pick = e.target.closest('[data-ver-pick]');
    if (pick){
      setSheet(false);
      ver = pick.dataset.verPick;
      body.dataset.ver = ver;
      sync();
      remember();
      var ob = window.onboarding;
      if (ob && ob.current() !== 'login') ob.restart('intro');
      return;
    }
    if (e.target.closest('[data-restart]')){
      setSheet(false);
      if (window.onboarding) window.onboarding.restart();
    }
  });
  fab.addEventListener('click', function(){ setSheet(!body.classList.contains('cmp-open')); });
  $('cmp-backdrop').addEventListener('click', function(){ setSheet(false); });
  $('cmp-close').addEventListener('click', function(){ setSheet(false); });
  sync();
})();
