(function(){
  'use strict';

  /* ============ 화면 밀어서 뒤로 가기 ============ */
  // iOS는 밀어서 뒤로 갈 때 '앞 기록'의 화면 스냅샷을 보여준다. 그래서 뒤로 갈 수 있는 곳(공고뷰)에서만 기록을 쌓는다.
  // Safari 브라우저로 열었을 때만 맨 아래에 막이 기록을 하나 두어 프로토타입을 벗어나지 않게 한다.
  var standalone = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  var navStack = [];
  var navIgnore = 0;
  function navPush(kind){
    try { history.pushState({ main: kind }, ''); navStack.push(kind); } catch (e) {}
  }
  // 화면 안 버튼으로 닫았을 때 그 기록(과 그 위)을 지운다.
  function navPop(kind){
    var i = navStack.lastIndexOf(kind);
    if (i < 0) return;
    var n = navStack.length - i;
    navStack.length = i;
    navIgnore++;
    try { history.go(-n); } catch (e) { navIgnore--; }
  }
  try {
    if (standalone) history.replaceState({ main: 'base' }, '');
    else {
      history.replaceState({ main: 'guard' }, '');
      history.pushState({ main: 'base' }, '');
    }
    window.addEventListener('popstate', function(){
      if (navIgnore > 0){ navIgnore--; return; }
      var kind = navStack.pop();
      // 맨 아래(막이 기록)까지 왔다면 다시 막는다.
      if (!kind){
        if (!standalone) history.pushState({ main: 'base' }, '');
        return;
      }
      window.dispatchEvent(new CustomEvent('main:back', { detail: { kind: kind } }));
    });
  } catch (e) {}

  /* ============ 모바일 viewport ============ */
  var root = document.documentElement;
  function fitViewport(){
    var vv = window.visualViewport;
    root.style.setProperty('--app-h', ((vv && vv.height) || window.innerHeight) + 'px');
    root.style.setProperty('--app-top', ((vv && vv.offsetTop) || 0) + 'px');
  }
  fitViewport();
  window.addEventListener('resize', fitViewport);
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', fitViewport);
    window.visualViewport.addEventListener('scroll', fitViewport);
  }

  /* ============ detail.js와 공유 ============ */
  window.mainNav = { push: navPush, pop: navPop };
})();
