(function(){
  'use strict';

  /* ============ 설정 ============ */
  // contents-home UT 설문과 같은 Firebase 프로젝트를 쓰고, 컬렉션만 따로 둔다.
  var FIREBASE = {
    apiKey: 'AIzaSyDBPFN-uV1ccbnSmhQxXn1W64ASdB6wlTo',
    authDomain: 'contents-home-ut.firebaseapp.com',
    projectId: 'contents-home-ut',
    storageBucket: 'contents-home-ut.firebasestorage.app',
    messagingSenderId: '778181019936',
    appId: '1:778181019936:web:c8565520b267fc70942f45'
  };
  var COL_SESSIONS = 'onboarding_ut_sessions';
  var COL_EVENTS = 'onboarding_ut_events';
  var KEY_SESSION = 'obut:session';
  var KEY_QUEUE = 'obut:queue';
  var KEY_NEXT = 'obut:next';
  var LONG_PRESS_MS = 1500;
  var GROUP_NAME = { a: 'A 코치마크', b: 'B 하이라이트' };
  // STEP 0 버튼 순서: list-first = Figma 그대로(지역 선택하기 위), nearby-first = 내 근처 선택하기 위
  var ORDER_NAME = { 'list-first': '지역 선택하기 먼저', 'nearby-first': '내 근처 선택하기 먼저' };

  /* ============ 저장소 ============ */
  function load(key){
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function save(key, value){
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }
  function pad(n, len){ n = String(n); while (n.length < len) n = '0' + n; return n; }
  function stamp(ms){
    var d = new Date(ms);
    return d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + '-' + pad(d.getHours(), 2) + pad(d.getMinutes(), 2) + pad(d.getSeconds(), 2);
  }
  // Firestore는 undefined 값을 받지 않는다.
  function clean(v){ return v == null ? {} : JSON.parse(JSON.stringify(v)); }

  /* ============ Firebase ============ */
  var db = null;
  try {
    if (window.firebase){
      firebase.initializeApp(FIREBASE);
      db = firebase.firestore();
    }
  } catch (e) { db = null; }

  // 기록은 localStorage 대기열에 먼저 쌓고 묶어서 보낸다. 새로고침·오프라인에도 잃지 않는다.
  var queue = load(KEY_QUEUE) || [];
  var sent = 0;
  var lastError = '';
  var flushing = false;
  var flushTimer = null;

  function enqueue(item){
    queue.push(item);
    save(KEY_QUEUE, queue);
    scheduleFlush(1200);
    renderStatus();
  }
  function scheduleFlush(ms){
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, ms);
  }
  function flush(){
    if (flushing || !db || !queue.length) return;
    flushing = true;
    var items = queue.slice(0, 400);
    var batch = db.batch();
    items.forEach(function(it){
      var ref = db.collection(it.col).doc(it.id);
      if (it.merge) batch.set(ref, it.data, { merge: true });
      else batch.set(ref, it.data);
    });
    var timeout = new Promise(function(_, reject){ setTimeout(function(){ reject(new Error('timeout')); }, 15000); });
    Promise.race([batch.commit(), timeout]).then(function(){
      // 문서 ID가 고정이라 시간 초과 뒤 늦게 성공해도 다시 보내면 덮어쓸 뿐이다.
      queue = queue.slice(items.length);
      save(KEY_QUEUE, queue);
      sent += items.length;
      lastError = '';
      flushing = false;
      renderStatus();
      if (queue.length) scheduleFlush(200);
    }).catch(function(err){
      lastError = (err && (err.code || err.message)) || 'error';
      flushing = false;
      renderStatus();
      scheduleFlush(5000);
    });
  }
  window.addEventListener('online', function(){ scheduleFlush(100); });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) flush(); });

  /* ============ 세션 · 이벤트 ============ */
  var session = load(KEY_SESSION);
  var screen = 'login';
  var screenAt = Date.now();
  var permission = 'unknown';

  function isStandalone(){
    return !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  }

  function log(type, data){
    if (!session) return;
    var now = Date.now();
    session.seq = (session.seq || 0) + 1;
    save(KEY_SESSION, session);
    enqueue({
      col: COL_EVENTS,
      id: session.sid + '_' + pad(session.seq, 5),
      data: {
        sid: session.sid,
        participant: session.participant,
        group: session.group,
        order: session.order,
        test: session.test,
        seq: session.seq,
        type: type,
        screen: screen,
        t: now - session.startedAt,
        at: now,
        data: clean(data)
      }
    });
  }

  function startSession(participant, group, order, test){
    if (session) endSession('restart');
    var now = Date.now();
    session = {
      sid: 'P' + pad(participant, 2) + '-' + stamp(now),
      participant: participant,
      group: group,
      order: order,
      test: !!test,
      startedAt: now,
      seq: 0
    };
    save(KEY_SESSION, session);
    // 연습(리허설) 세션은 다음 참가자 번호를 올리지 않는다.
    if (!test) save(KEY_NEXT, { participant: participant + 1 });
    enqueue({
      col: COL_SESSIONS,
      id: session.sid,
      merge: true,
      data: {
        sid: session.sid,
        participant: participant,
        group: group,
        order: order,
        test: !!test,
        status: 'active',
        startedAt: now,
        ua: navigator.userAgent,
        standalone: isStandalone(),
        viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 },
        page: location.origin + location.pathname
      }
    });
    screen = 'login';
    screenAt = now;
    log('session_start', { permission: permission, standalone: isStandalone(), order: order });
  }

  function endSession(reason){
    if (!session) return;
    log('session_end', { reason: reason, screen: screen });
    enqueue({ col: COL_SESSIONS, id: session.sid, merge: true, data: { status: 'ended', endedAt: Date.now(), endReason: reason } });
    session = null;
    save(KEY_SESSION, null);
    flush();
  }

  // app.js가 화면을 바꿀 때마다 부른다. 직전 화면에 머문 시간을 함께 남긴다.
  function onScreen(name, from){
    var now = Date.now();
    if (name !== screen || from){
      log('screen', { name: name, from: from || screen, prevMs: now - screenAt });
    }
    screen = name;
    screenAt = now;
  }

  if (session) log('page_load', { resumed: true, standalone: isStandalone() });
  document.addEventListener('visibilitychange', function(){
    log(document.hidden ? 'app_hidden' : 'app_visible', {});
  });
  window.addEventListener('error', function(e){
    log('js_error', { message: String(e.message || '').slice(0, 200), src: String(e.filename || '').split('/').pop(), line: e.lineno });
  });

  /* ============ 위치 권한 상태 (진행자 확인용) ============ */
  var PERMISSION_LABEL = { prompt: '묻기', granted: '허용됨', denied: '거부됨', unknown: '확인 불가' };
  try {
    navigator.permissions.query({ name: 'geolocation' }).then(function(st){
      permission = st.state;
      renderStatus();
      st.onchange = function(){
        permission = st.state;
        log('permission_change', { state: st.state });
        renderStatus();
      };
    }).catch(function(){});
  } catch (e) {}

  /* ============ 진행자 메뉴 ============ */
  var $ = function(id){ return document.getElementById(id); };
  var mod = $('mod');
  var numInput = $('mod-participant');
  var groupSeg = $('mod-group');
  var orderSeg = $('mod-order');
  var testCheck = $('mod-test');
  var statusEl = $('mod-status');
  var currentEl = $('mod-current');
  var group = 'a';
  var order = 'list-first';
  var groupTouched = false;
  var orderTouched = false;

  // 노션 UT 계획서 배정표와 같다: P1 지역·A, P2 근처·B, P3 근처·A, P4 지역·B, P5 지역·A, P6 근처·B
  function defaultGroup(n){ return n % 2 === 1 ? 'a' : 'b'; }
  // 순서는 2명 단위로 뒤집어(지역·근처·근처·지역…) 6명이면 3:3이 되고, 완료 화면 그룹과도 겹치지 않는다.
  function defaultOrder(n){ return ['list-first', 'nearby-first', 'nearby-first', 'list-first'][(n - 1) % 4]; }
  function participant(){
    var n = parseInt(numInput.value, 10);
    return isNaN(n) || n < 1 ? 1 : Math.min(n, 99);
  }
  function setGroup(g){
    group = g;
    groupSeg.querySelectorAll('[data-group]').forEach(function(b){
      b.setAttribute('aria-checked', b.dataset.group === g ? 'true' : 'false');
    });
  }
  function setOrder(o){
    order = o;
    orderSeg.querySelectorAll('[data-order]').forEach(function(b){
      b.setAttribute('aria-checked', b.dataset.order === o ? 'true' : 'false');
    });
  }
  function setNumber(n){
    numInput.value = n;
    if (!groupTouched) setGroup(defaultGroup(n));
    if (!orderTouched) setOrder(defaultOrder(n));
  }

  function minutes(ms){
    var m = Math.floor(ms / 60000);
    return m < 1 ? '1분 미만' : m + '분';
  }
  function renderStatus(){
    if (!mod || mod.hidden) return;
    currentEl.innerHTML = '';
    var line = document.createElement('p');
    if (session){
      line.innerHTML = '<b>진행 중</b> P' + session.participant + ' · ' + GROUP_NAME[session.group] + ' · ' + (ORDER_NAME[session.order] || ORDER_NAME['list-first']) + (session.test ? ' · 연습' : '') +
        '<br><span>' + minutes(Date.now() - session.startedAt) + ' 경과 · 기록 ' + (session.seq || 0) + '건' + (session.task2 ? ' · 다른 지역 방식 체험 중' : '') + '</span>';
      currentEl.className = 'mod-current is-active';
    } else {
      line.innerHTML = '<b>진행 중인 세션 없음</b><br><span>세션을 시작해야 기록돼요</span>';
      currentEl.className = 'mod-current';
    }
    currentEl.appendChild(line);

    var rows = [];
    rows.push(['저장', !db ? 'Firebase 연결 안 됨 (기기에만 보관)' : (queue.length ? '전송 대기 ' + queue.length + '건' : '모두 전송됨') + (sent ? ' · 이번에 ' + sent + '건 전송' : '')]);
    if (lastError) rows.push(['오류', lastError]);
    rows.push(['위치 권한', PERMISSION_LABEL[permission] || permission]);
    rows.push(['실행 방식', isStandalone() ? '홈 화면 앱' : '브라우저 (홈 화면에 추가 권장)']);
    statusEl.innerHTML = '';
    rows.forEach(function(r){
      var p = document.createElement('p');
      var k = document.createElement('span');
      k.textContent = r[0];
      var v = document.createElement('b');
      v.textContent = r[1];
      if (r[0] === '오류' || (r[0] === '위치 권한' && permission !== 'prompt')) v.className = 'is-warn';
      p.appendChild(k);
      p.appendChild(v);
      statusEl.appendChild(p);
    });
    $('mod-end').disabled = !session;
    $('mod-task2').disabled = !session;
    $('mod-preview').disabled = !!session;
  }

  function openPanel(){
    if (!mod) return;
    // 진행 중인 세션은 위 상자에 보여주고, 입력칸은 다음 참가자 번호로 채워 둔다.
    var next = load(KEY_NEXT);
    groupTouched = false;
    orderTouched = false;
    setNumber(next && next.participant ? next.participant : 1);
    testCheck.checked = false;
    mod.hidden = false;
    renderStatus();
    flush();
  }
  function closePanel(){ if (mod) mod.hidden = true; }

  if (mod){
    mod.addEventListener('click', function(e){
      if (e.target.closest('[data-mod-close]')) closePanel();
      var step = e.target.closest('[data-num]');
      if (step) setNumber(Math.max(1, Math.min(99, participant() + Number(step.dataset.num))));
      var g = e.target.closest('[data-group]');
      if (g){ groupTouched = true; setGroup(g.dataset.group); }
      var o = e.target.closest('[data-order]');
      if (o){ orderTouched = true; setOrder(o.dataset.order); }
    });
    numInput.addEventListener('input', function(){
      if (!groupTouched) setGroup(defaultGroup(participant()));
      if (!orderTouched) setOrder(defaultOrder(participant()));
    });
    // 화면을 먼저 처음으로 되돌려(이전 세션에 기록) 두고 새 세션을 연다.
    $('mod-start').addEventListener('click', function(){
      var n = participant();
      var g = group;
      var o = order;
      var test = testCheck.checked;
      if (session && !window.confirm('진행 중인 P' + session.participant + ' 세션을 끝내고 P' + n + ' 세션을 처음부터 시작할까요?')) return;
      closePanel();
      if (window.onboarding) window.onboarding.restart();
      startSession(n, g, o, test);
    });
    // T2: 같은 세션에서 STEP 0으로 돌려보내 다른 지역 방식을 체험하게 한다.
    $('mod-task2').addEventListener('click', function(){
      if (!session) return;
      closePanel();
      session.task2 = true;
      save(KEY_SESSION, session);
      log('task2_start', { from: screen });
      if (window.onboarding && window.onboarding.jumpToIntro) window.onboarding.jumpToIntro();
    });
    $('mod-end').addEventListener('click', function(){
      endSession('manual');
      renderStatus();
    });
    $('mod-preview').addEventListener('click', function(){
      closePanel();
      if (window.onboarding && window.onboarding.previewHome) window.onboarding.previewHome(group);
    });
    setInterval(renderStatus, 5000);
  }

  // 화면 왼쪽 위를 1.5초 길게 누르면 열린다. 일반 탭은 막지 않는다. (PC: Option/Alt + M)
  var pressTimer = 0;
  var pressStart = null;
  function cancelPress(){ clearTimeout(pressTimer); pressStart = null; }
  document.addEventListener('pointerdown', function(e){
    if (!mod || !mod.hidden) return;
    var phone = document.querySelector('.phone');
    if (!phone) return;
    var r = phone.getBoundingClientRect();
    var top = parseFloat(getComputedStyle(phone).paddingTop) || 0;
    var x = e.clientX - r.left;
    var y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > 72 || y > 72 + top) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(function(){ pressStart = null; openPanel(); }, LONG_PRESS_MS);
  }, true);
  document.addEventListener('pointermove', function(e){
    if (pressStart && Math.abs(e.clientX - pressStart.x) + Math.abs(e.clientY - pressStart.y) > 14) cancelPress();
  }, true);
  document.addEventListener('pointerup', cancelPress, true);
  document.addEventListener('pointercancel', cancelPress, true);
  document.addEventListener('keydown', function(e){
    if (e.altKey && e.code === 'KeyM'){ e.preventDefault(); openPanel(); }
  });

  /* ============ 공개 API ============ */
  window.ut = {
    log: log,
    screen: onScreen,
    session: function(){ return session; },
    // 세션이 없으면(디자인 확인용) 링크의 ?v=a|b, 없으면 A
    group: function(){
      if (session) return session.group;
      var v = (new URLSearchParams(location.search).get('v') || '').toLowerCase();
      return v === 'b' ? 'b' : 'a';
    },
    // STEP 0 버튼 순서. 세션이 없으면 링크의 ?order=nearby, 없으면 Figma 기본 순서
    order: function(){
      if (session) return session.order || 'list-first';
      var v = (new URLSearchParams(location.search).get('order') || '').toLowerCase();
      return v === 'nearby' || v === 'nearby-first' ? 'nearby-first' : 'list-first';
    },
    permission: function(){ return permission; },
    openPanel: openPanel
  };

  if (new URLSearchParams(location.search).has('mod')) setTimeout(openPanel, 0);
  if (queue.length) scheduleFlush(500);
})();
