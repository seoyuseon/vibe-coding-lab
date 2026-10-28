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
  var KEY_DOCK = 'obut:mod-dock';   // PC에서 왼쪽 메뉴를 접어 두면 'off'
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
      if (noteEl && !session) noteEl.open = permission !== 'prompt';
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
  var liveEl = $('mod-live');
  var setupEl = $('mod-setup');
  var toggleEl = $('mod-setup-toggle');
  var noteEl = $('mod-perm-note');
  var startBtn = $('mod-start');
  var task2Btn = $('mod-task2');
  var endBtn = $('mod-end');
  var group = 'a';
  var order = 'list-first';
  var groupTouched = false;
  var orderTouched = false;
  var setupOpen = false;   // 세션 중 '다른 참가자로 새로 시작'을 펼쳤는지

  // 노션 UT 계획서 배정표와 같다: 홀수 = 지역 선택하기 위 · A 코치마크, 짝수 = 내 근처 선택하기 위 · B 하이라이트
  function defaultGroup(n){ return n % 2 === 1 ? 'a' : 'b'; }
  function defaultOrder(n){ return n % 2 === 1 ? 'list-first' : 'nearby-first'; }
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
    renderStart();
  }
  // 시작 버튼에 번호와 연습 여부를 함께 보여준다(연습 체크를 잘못 켜도 바로 보이게).
  function renderStart(){
    startBtn.textContent = 'P' + participant() + (testCheck.checked ? ' 연습' : '') + ' 세션 시작';
  }

  function minutes(ms){
    var m = Math.floor(ms / 60000);
    return m < 1 ? '1분 미만' : m + '분';
  }
  var shownSid;
  function renderStatus(){
    if (!mod || mod.hidden) return;
    // 세션이 시작·종료되면 준비 칸을 다음 참가자 번호로 다시 채운다(PC에 붙여 둔 메뉴는 닫히지 않으므로).
    var sid = session ? session.sid : null;
    if (sid !== shownSid){
      if (shownSid !== undefined) resetSetup();
      shownSid = sid;
    }
    currentEl.innerHTML = '';
    var line = document.createElement('p');
    if (session){
      line.innerHTML = '<b>진행 중</b> P' + session.participant + ' · ' + GROUP_NAME[session.group] + ' · ' + (ORDER_NAME[session.order] || ORDER_NAME['list-first']) + (session.test ? ' · 연습' : '') +
        '<br><span>' + (session.task2 ? 'T2 진행 중 (다른 지역 방식)' : 'T1 진행 중') + ' · ' + minutes(Date.now() - session.startedAt) + ' 경과 · 기록 ' + (session.seq || 0) + '건</span>';
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
    renderMode();
  }
  // 세션이 없으면 다음 참가자 준비, 세션 중이면 지금 할 일(T1 → T2 시작, T2 → 세션 종료)을 크게 보여준다.
  function renderMode(){
    var t2 = !!(session && session.task2);
    liveEl.hidden = !session;
    liveEl.classList.toggle('is-t2', t2);
    task2Btn.className = t2 ? 'mod-secondary' : 'mod-primary';
    task2Btn.textContent = t2 ? 'STEP 0으로 다시 보내기' : 'T2 시작 · 같은 세션에서 STEP 0으로';
    endBtn.className = t2 ? 'mod-primary' : 'mod-secondary';
    toggleEl.hidden = !session;
    toggleEl.setAttribute('aria-expanded', setupOpen ? 'true' : 'false');
    setupEl.hidden = !!session && !setupOpen;
    noteEl.hidden = !!session;
    $('mod-preview').hidden = !!session;
  }

  // 진행 중인 세션은 위 상자에 보여주고, 입력칸은 다음 참가자 번호로 채워 둔다.
  function resetSetup(){
    var next = load(KEY_NEXT);
    groupTouched = false;
    orderTouched = false;
    testCheck.checked = false;
    setNumber(next && next.participant ? next.participant : 1);
    setupOpen = false;
    // 위치 권한이 '묻기'가 아니면 초기화 방법을 펼쳐 둔다.
    noteEl.open = !session && permission !== 'prompt';
  }
  function openPanel(){
    if (!mod) return;
    if (canDock()) save(KEY_DOCK, null);
    resetSetup();
    mod.hidden = false;
    syncDock();
    renderStatus();
    flush();
  }
  // PC에 붙여 둔 메뉴는 버튼(세션 시작·T2 등)을 눌러도 닫지 않는다.
  function closePanel(){ if (mod && !docked()) mod.hidden = true; }

  /* ---- PC: 메뉴를 화면 왼쪽에 붙여 둔다. 터치 기기·좁은 화면은 지금처럼 길게 눌러 연다. ---- */
  var dockMq = window.matchMedia ? window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)') : null;
  var dockTab = $('mod-dock-tab');
  function canDock(){ return !!(mod && dockMq && dockMq.matches); }
  function docked(){ return canDock() && load(KEY_DOCK) !== 'off'; }
  function syncDock(){
    var on = docked() && !mod.hidden;
    mod.classList.toggle('is-docked', on);
    document.body.classList.toggle('mod-docked', on);
    mod.querySelector('.mod-panel').setAttribute('aria-modal', on ? 'false' : 'true');
    if (dockTab) dockTab.hidden = !canDock() || on;
  }
  // × 를 누르면 접고, 왼쪽 위 '진행자 메뉴' 버튼으로 다시 편다.
  function collapseDock(){
    save(KEY_DOCK, 'off');
    mod.hidden = true;
    syncDock();
  }

  if (mod){
    mod.addEventListener('click', function(e){
      if (e.target.closest('[data-mod-close]')){ if (docked()) collapseDock(); else closePanel(); }
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
      renderStart();
    });
    testCheck.addEventListener('change', renderStart);
    toggleEl.addEventListener('click', function(){
      setupOpen = !setupOpen;
      renderMode();
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
    // 기기 초기화: 리허설 뒤 실제 UT 전에 쓴다. 진행 중인 세션을 기록 없이 버리고, 참가자 번호를 1부터 다시 시작한다.
    $('mod-reset').addEventListener('click', function(){
      var msg = session
        ? '진행 중인 P' + session.participant + (session.test ? '(연습)' : '') + ' 세션을 기록 없이 지우고, 참가자 번호를 1부터 다시 시작할까요?'
        : '참가자 번호를 1부터 다시 시작할까요?';
      if (!window.confirm(msg)) return;
      var sid = session && session.sid;
      if (sid){
        queue = queue.filter(function(it){ return it.id !== sid && !(it.data && it.data.sid === sid); });
        save(KEY_QUEUE, queue);
      }
      session = null;
      save(KEY_SESSION, null);
      save(KEY_NEXT, null);
      try { localStorage.removeItem('obut:flow'); } catch (e) {}
      if (window.onboarding) window.onboarding.restart();
      openPanel();
    });
    $('mod-end').addEventListener('click', function(){
      if (!session) return;
      // T2 전에는 세션 종료가 보조 버튼이라 한 번 더 묻는다.
      if (!session.task2 && !window.confirm('아직 T2 전이에요. P' + session.participant + ' 세션을 종료할까요?')) return;
      endSession('manual');
      setupOpen = false;
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
    if (e.altKey && e.code === 'KeyM'){
      e.preventDefault();
      if (docked() && !mod.hidden) collapseDock();
      else openPanel();
    }
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

  if (dockTab) dockTab.addEventListener('click', openPanel);
  if (dockMq){
    var onDockChange = function(){
      if (docked()) openPanel();
      else { if (mod.classList.contains('is-docked')) mod.hidden = true; syncDock(); }
    };
    if (dockMq.addEventListener) dockMq.addEventListener('change', onDockChange);
    else if (dockMq.addListener) dockMq.addListener(onDockChange);
  }
  if (docked() || new URLSearchParams(location.search).has('mod')) setTimeout(openPanel, 0);
  else if (mod) syncDock();
  if (queue.length) scheduleFlush(500);
})();
