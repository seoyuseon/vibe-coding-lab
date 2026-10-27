(function(){
  'use strict';

  var ob = window.onboarding;
  if (!ob) return;
  var ut = window.ut || { log: function(){}, permission: function(){ return 'unknown'; } };

  /* ============ 설정 ============ */
  // 카카오 개발자 앱 '온보딩 UT' JavaScript 키 (등록 도메인: seoyuseon.github.io, localhost:8765)
  var KAKAO_KEY = '2dd8c24df45513d343071421d2d00b15';
  // 반경/안내문구 (Figma 4638:343506 · 343509 · 343512 · 343515)
  var RADIUS = {
    1: { icon: 'walk', strong: '걸어서 15분' },
    3: { icon: 'run', strong: '뛰어서 30분' },
    7: { icon: 'bike', strong: '자전거 20분' },
    10: { icon: 'bike', strong: '자전거 30분' }
  };
  var GEO_OPTIONS = { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 };

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var consentEl = $('consent');
  var agreeBtn = $('consent-agree');
  var screenEl = document.querySelector('.screen.nearby');
  var input = $('nb-search-input');
  var clearBtn = $('nb-search-clear');
  var emptyEl = $('nb-empty');
  var resultsEl = $('nb-results');
  var nextBtn = $('nearby-next');
  var radiusTab = $('radius-tab');

  function el(tag, cls, text){
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function state(){ return ob.getState(); }

  /* ============ 카카오맵 SDK ============ */
  // file://에서는 카카오맵이 열리지 않으므로 안내 문구만 보여준다.
  var kakaoReady = null;
  function loadKakao(){
    if (kakaoReady) return kakaoReady;
    kakaoReady = new Promise(function(resolve, reject){
      if (!/^https?:$/.test(location.protocol)){ reject(new Error('file-protocol')); return; }
      var s = document.createElement('script');
      s.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + KAKAO_KEY + '&libraries=services&autoload=false';
      s.onload = function(){
        try { window.kakao.maps.load(function(){ resolve(window.kakao); }); }
        catch (e) { reject(e); }
      };
      s.onerror = function(){ reject(new Error('sdk-load')); };
      document.head.appendChild(s);
    });
    kakaoReady.catch(function(err){
      document.body.classList.add('no-map');
      ut.log('map_sdk_error', { reason: err && err.message });
    });
    return kakaoReady;
  }
  loadKakao();

  // 카카오 도로명 주소는 '서울특별시'처럼 시·도를 길게 돌려주므로 시안 표기('서울')로 줄인다.
  var SIDO = {
    '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천', '광주광역시': '광주',
    '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기', '강원도': '강원',
    '강원특별자치도': '강원', '충청북도': '충북', '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북',
    '전라남도': '전남', '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주'
  };
  function shortAddr(a){
    if (!a) return a || '';
    var i = a.indexOf(' ');
    var head = i < 0 ? a : a.slice(0, i);
    return SIDO[head] ? SIDO[head] + (i < 0 ? '' : a.slice(i)) : a;
  }

  var geocoder = null;
  var places = null;
  function services(){
    if (!geocoder){
      geocoder = new kakao.maps.services.Geocoder();
      places = new kakao.maps.services.Places();
    }
  }

  // 좌표 → 주소 (도로명 우선, 없으면 지번)
  function addressAt(lat, lng){
    return loadKakao().then(function(){
      services();
      return new Promise(function(resolve){
        geocoder.coord2Address(lng, lat, function(result, status){
          if (status !== kakao.maps.services.Status.OK || !result.length){ resolve(null); return; }
          var road = result[0].road_address;
          var addr = result[0].address;
          resolve({
            address: shortAddr(road ? road.address_name : (addr ? addr.address_name : '')),
            sido: addr ? shortAddr(addr.region_1depth_name) : '',
            jibun: shortAddr(addr ? addr.address_name : ''),
            dong: addr ? addr.region_3depth_name : (road ? road.region_3depth_name : ''),
            gu: addr ? addr.region_2depth_name : (road ? road.region_2depth_name : '')
          });
        });
      });
    }).catch(function(){ return null; });
  }
  // jobs.js(더미 공고 근무지)에서 쓰는 주소 도우미
  window.kakaoGeo = {
    ready: loadKakao,
    // 좌표 → 시·도(짧은 이름)·구·동
    region: function(lat, lng){
      return loadKakao().then(function(){
        services();
        return new Promise(function(resolve){
          geocoder.coord2Address(lng, lat, function(result, status){
            var ok = status === kakao.maps.services.Status.OK && result.length;
            var addr = ok ? result[0].address : null;
            var road = ok ? result[0].road_address : null;
            resolve(addr ? { sido: shortAddr(addr.region_1depth_name), gu: addr.region_2depth_name, dong: addr.region_3depth_name, road: road ? shortAddr(road.address_name) : '', lat: lat, lng: lng } : null);
          });
        });
      }).catch(function(){ return null; });
    },
    // 지역 이름 → 중심 좌표
    search: function(query){
      return loadKakao().then(function(){
        services();
        return new Promise(function(resolve){
          geocoder.addressSearch(query, function(result, status){
            resolve(status === kakao.maps.services.Status.OK && result.length ? { lat: Number(result[0].y), lng: Number(result[0].x) } : null);
          });
        });
      }).catch(function(){ return null; });
    }
  };

  function withTimeout(promise, ms){
    return Promise.race([promise, new Promise(function(resolve){ setTimeout(function(){ resolve(null); }, ms); })]);
  }

  /* ============ 오버레이 (위치 동의 바텀시트) ============ */
  function showOverlay(node){
    node.hidden = false;
    void node.offsetWidth;
    node.classList.add('is-open');
  }
  function hideOverlay(node){
    node.classList.remove('is-open');
    setTimeout(function(){ if (!node.classList.contains('is-open')) node.hidden = true; }, 260);
  }

  /* ============ 브라우저 위치 권한 ============ */
  function requestGeo(context){
    var t0 = Date.now();
    var before = ut.permission();
    ut.log('geo_request', { context: context, permission: before });
    return new Promise(function(resolve){
      var done = false;
      function finish(result, pos, err){
        if (done) return;
        done = true;
        state().geo = result;
        ut.log('geo_result', {
          context: context,
          result: result,
          ms: Date.now() - t0,
          permissionBefore: before,
          code: err ? err.code : null,
          accuracy: pos ? Math.round(pos.coords.accuracy) : null
        });
        resolve(pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null);
      }
      if (!navigator.geolocation){ finish('unsupported'); return; }
      try {
        navigator.geolocation.getCurrentPosition(
          function(pos){ finish('granted', pos); },
          function(err){ finish(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable', null, err); },
          GEO_OPTIONS
        );
      } catch (e) { finish('unavailable'); }
      // 권한 창을 닫지 않고 앱을 벗어나는 경우 등 응답이 오지 않을 때를 대비한다.
      setTimeout(function(){ finish('no_response'); }, 90000);
    });
  }

  /* ============ 위치 동의 (4722:376496) ============ */
  // context: 'intro'(STEP 0 내 근처 선택하기) | 'locate'(지도의 현재 위치 버튼)
  var consentContext = 'intro';
  var consentBusy = false;
  function openConsent(context){
    consentContext = context;
    consentBusy = false;
    agreeBtn.classList.remove('is-loading');
    showOverlay(consentEl);
    if (ob.navPush) ob.navPush('consent');
    ut.log('consent_open', { context: context });
  }
  window.addEventListener('onboarding:nearby', function(){ openConsent('intro'); });

  // 동의할게요 → 브라우저 권한 → 허용이면 현재 위치, 거부·실패면 기본 위치(시청역)
  agreeBtn.addEventListener('click', function(){
    if (consentBusy) return;
    consentBusy = true;
    agreeBtn.classList.add('is-loading');
    state().consent = true;
    ut.log('consent_agree', { context: consentContext });
    var context = consentContext;
    requestGeo(context).then(function(pos){
      if (context === 'intro'){
        var next = pos ? { lat: pos.lat, lng: pos.lng, source: 'gps' } : ob.defaultPlace();
        return resolvePlace(next).then(function(place){
          state().place = place;
          finishConsent();
          enterNearby();
        });
      }
      finishConsent();
      if (pos) moveTo(pos.lat, pos.lng, 'gps');
    });
  });
  function finishConsent(){
    consentBusy = false;
    agreeBtn.classList.remove('is-loading');
    closeConsent();
  }
  // 버튼으로 닫을 때는 쌓아 둔 뒤로 가기 기록도 함께 지운다.
  function closeConsent(){
    hideOverlay(consentEl);
    if (ob.navPop) ob.navPop('consent');
  }
  // 다음에 → 동의 없이 기본 위치(시청역)로 지도 화면을 연다. (Figma: 위치 미동의 → 기본 위치 → 시청)
  $('consent-later').addEventListener('click', function(){
    if (consentBusy) return;
    ut.log('consent_later', { context: consentContext });
    closeConsent();
    if (consentContext === 'intro'){
      state().place = ob.defaultPlace();
      enterNearby();
    }
  });
  consentEl.querySelector('[data-dismiss]').addEventListener('click', function(){
    if (consentBusy) return;
    ut.log('consent_dismiss', { context: consentContext });
    closeConsent();
  });
  $('consent-terms').addEventListener('click', function(){
    ut.log('consent_terms', { context: consentContext });
  });

  // 좌표에 주소를 붙인다. 주소 조회가 늦으면 좌표만으로 진행한다.
  function resolvePlace(place){
    if (place.address) return Promise.resolve(place);
    return withTimeout(addressAt(place.lat, place.lng), 3000).then(function(a){
      return Object.assign({}, place, a || { address: '현재 위치', jibun: '', dong: '', gu: '' });
    });
  }

  /* ============ STEP 1-2 · 지도 상태 ============ */
  function enterNearby(){
    state().mode = 'nearby';
    ob.go('nearby');
  }
  // 검색창에는 지금 위치의 이름을 보여준다. (기본 위치는 '시청역', 검색으로 고른 곳은 짧은 도로명)
  function placeText(p){ return p.display || p.address || '현재 위치'; }
  function renderRadius(){
    var r = state().radius;
    radiusTab.querySelectorAll('[data-radius]').forEach(function(b){
      b.setAttribute('aria-selected', Number(b.dataset.radius) === r ? 'true' : 'false');
    });
    var info = RADIUS[r];
    $('radius-label').querySelector('.radius-icon').dataset.icon = info.icon;
    $('radius-strong').textContent = info.strong;
  }
  function renderNearby(){
    setSearching(false, true);
    input.value = placeText(state().place);
    syncClear();
    renderRadius();
    loadKakao().then(function(){
      ensureMap();
      fitMap(false);
    }).catch(function(){});
  }

  var map = null;
  var circle = null;
  var geoToken = 0;
  var dragCount = 0;
  var lastDragLog = 0;
  var lastDragEnd = 0;   // 손으로 끌어서 옮긴 뒤에만 탐색 위치를 바꾼다(축척 맞춤·검색 이동은 제외)
  function ensureMap(){
    if (map) return map;
    var K = kakao.maps;
    var s = state();
    var center = new K.LatLng(s.place.lat, s.place.lng);
    map = new K.Map($('nearby-map'), { center: center, level: 5 });
    // 반경 원 (#FF6D12 채움 10% · 1px 선). 지도를 움직이는 동안 가운데를 따라온다.
    circle = new K.Circle({ center: center, radius: s.radius * 1000, strokeWeight: 1, strokeColor: '#FF6D12', strokeOpacity: 1, strokeStyle: 'solid', fillColor: '#FF6D12', fillOpacity: 0.1 });
    circle.setMap(map);
    K.event.addListener(map, 'center_changed', function(){ circle.setPosition(map.getCenter()); });
    K.event.addListener(map, 'dragend', function(){
      lastDragEnd = Date.now();
      // 관성으로 조금 더 미끄러진 뒤의 가운데까지 반영한다.
      setTimeout(onIdle, 450);
      dragCount++;
      var now = Date.now();
      if (now - lastDragLog > 600){
        lastDragLog = now;
        ut.log('map_drag', { count: dragCount });
      }
    });
    K.event.addListener(map, 'zoom_changed', function(){
      if (!zooming) ut.log('map_zoom', { level: map.getLevel() });
    });
    K.event.addListener(map, 'idle', onIdle);
    return map;
  }
  // 반경 원이 지도 카드 안에 들어오는 가장 가까운 축척으로 맞춘다.
  var zooming = false;
  function fitMap(animate){
    if (!map) return;
    var K = kakao.maps;
    var s = state();
    var center = new K.LatLng(s.place.lat, s.place.lng);
    zooming = true;
    map.relayout();
    circle.setRadius(s.radius * 1000);
    circle.setPosition(center);
    var before = map.getLevel();
    map.setBounds(circle.getBounds(), 20, 20, 20, 20);
    var target = map.getLevel();
    map.setCenter(center);
    if (animate && before !== target){
      map.setLevel(before);
      map.setCenter(center);
      map.setLevel(target, { animate: { duration: 260 } });
    }
    setTimeout(function(){ zooming = false; }, 320);
  }
  // 지도가 멈추면 가운데 좌표를 탐색 위치로 삼고 검색창의 주소를 바꾼다.
  function onIdle(){
    if (!map || searching || Date.now() - lastDragEnd > 2500) return;
    var c = map.getCenter();
    var lat = c.getLat();
    var lng = c.getLng();
    var s = state();
    if (Math.abs(lat - s.place.lat) < 1e-6 && Math.abs(lng - s.place.lng) < 1e-6) return;
    s.place = { lat: lat, lng: lng, source: 'map', address: '', jibun: '', dong: '', gu: '' };
    var token = ++geoToken;
    addressAt(lat, lng).then(function(a){
      if (token !== geoToken || !a) return;
      Object.assign(state().place, a);
      if (!searching) input.value = placeText(state().place);
    });
  }
  function moveTo(lat, lng, source, info){
    var s = state();
    s.place = Object.assign({ lat: lat, lng: lng, source: source, address: '', jibun: '', dong: '', gu: '' }, info || {});
    var token = ++geoToken;
    input.value = placeText(s.place);
    if (!info || !info.address){
      addressAt(lat, lng).then(function(a){
        if (token !== geoToken || !a) return;
        Object.assign(state().place, a);
        if (!searching) input.value = placeText(state().place);
      });
    }
    if (map) map.setCenter(new kakao.maps.LatLng(lat, lng));
  }

  radiusTab.addEventListener('click', function(e){
    var b = e.target.closest('[data-radius]');
    if (!b) return;
    var r = Number(b.dataset.radius);
    var s = state();
    if (r === s.radius) return;
    ut.log('radius_change', { km: r, from: s.radius });
    s.radius = r;
    renderRadius();
    fitMap(true);
  });
  // 현재 위치 버튼: 서비스 안 동의가 없으면 동의부터 받는다.
  $('locate-btn').addEventListener('click', function(){
    var s = state();
    ut.log('locate_tap', { consent: s.consent, geo: s.geo });
    if (!s.consent){ openConsent('locate'); return; }
    requestGeo('locate').then(function(pos){ if (pos) moveTo(pos.lat, pos.lng, 'gps'); });
  });
  nextBtn.addEventListener('click', function(){
    if (searching) return;
    var s = state();
    s.mode = 'nearby';
    ut.log('region_done', { mode: 'nearby', address: s.place.address, placeSource: s.place.source, radius: s.radius, remote: s.remote, drags: dragCount });
    ob.go('step2');
  });

  /* ============ STEP 1-2 · 검색 상태 (4739:101834 / 4739:102125) ============ */
  // 검색창을 누르면 같은 화면에서 타이틀이 펼쳐지고 지도 자리에 검색 결과가 나온다.
  var searching = false;
  var searchTimer = null;
  var searchLogTimer = null;
  var searchToken = 0;
  var lastQuery = '';
  var lastCount = 0;
  function setSearching(on, instant){
    searching = on;
    if (instant) screenEl.classList.add('no-anim');
    screenEl.classList.toggle('is-searching', on);
    $('nb-search-view').setAttribute('aria-hidden', on ? 'false' : 'true');
    nextBtn.disabled = on;
    if (instant){ void screenEl.offsetWidth; screenEl.classList.remove('no-anim'); }
  }
  function syncClear(){ clearBtn.hidden = !searching || input.value === ''; }
  // iOS는 키보드를 띄울 때 화면을 밀어 올리기도 해서, 닫을 때 원래 위치로 되돌린다.
  function resetScroll(){
    setTimeout(function(){ try { window.scrollTo(0, 0); } catch (e) {} }, 60);
  }
  function showEmpty(){
    emptyEl.hidden = false;
    resultsEl.hidden = true;
    resultsEl.textContent = '';
  }
  input.addEventListener('focus', function(){
    if (searching) return;
    if (ob.navPush) ob.navPush('search');
    setSearching(true);
    input.value = '';
    lastQuery = '';
    lastCount = 0;
    showEmpty();
    syncClear();
    ut.log('search_open', {});
  });
  // 검색어 없이 키보드를 닫으면 지도 상태로 돌아간다.
  input.addEventListener('blur', function(){
    setTimeout(function(){
      if (searching && input.value.trim() === '' && document.activeElement !== input) closeSearch('blur');
    }, 120);
  });
  function closeSearch(via){
    if (!searching) return;
    ut.log('search_close', { via: via, q: lastQuery, count: lastCount });
    if (via !== 'swipe' && ob.navPop) ob.navPop('search');
    input.blur();
    setSearching(false);
    resetScroll();
    input.value = placeText(state().place);
    syncClear();
    if (map) setTimeout(function(){ map.relayout(); }, 340);
  }
  input.addEventListener('input', function(){
    syncClear();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(search, 250);
  });
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); clearTimeout(searchTimer); search(); input.blur(); }
  });
  $('nb-search-field').addEventListener('click', function(e){
    if (!e.target.closest('#nb-search-clear')) input.focus();
  });
  clearBtn.addEventListener('mousedown', function(e){ e.preventDefault(); });
  clearBtn.addEventListener('click', function(){
    input.value = '';
    syncClear();
    showEmpty();
    input.focus();
  });

  // 주소(도로명·지번) 검색과 장소(건물명) 검색을 함께 돌려 합친다.
  function search(){
    var q = input.value.trim();
    var token = ++searchToken;
    if (!q){ showEmpty(); return; }
    loadKakao().then(function(){
      services();
      return Promise.all([searchAddress(q), searchPlaces(q)]);
    }).then(function(res){
      if (token !== searchToken) return;
      var items = mergeResults(res[0], res[1]);
      renderResults(items);
      lastQuery = q;
      lastCount = items.length;
      clearTimeout(searchLogTimer);
      searchLogTimer = setTimeout(function(){ ut.log('addr_search', { q: q, count: items.length }); }, 1000);
    }).catch(function(){ if (token === searchToken) showEmpty(); });
  }
  // 서울 서초구 서초대로 301 → 서초대로 301 (시·도와 시·군·구를 뺀 짧은 도로명)
  function roadOnly(full, r1, r2){
    var out = String(full || '');
    [r1, r2].forEach(function(r){ if (r && out.indexOf(r + ' ') === 0) out = out.slice(r.length + 1); });
    return out;
  }
  function searchAddress(q){
    return new Promise(function(resolve){
      geocoder.addressSearch(q, function(result, status){
        if (status !== kakao.maps.services.Status.OK){ resolve([]); return; }
        resolve(result.map(function(r){
          var road = r.road_address;
          var addr = r.address;
          var full = road ? shortAddr(road.address_name) : '';
          return {
            road: full,
            short: road ? roadOnly(road.address_name, road.region_1depth_name, road.region_2depth_name) : '',
            jibun: shortAddr(addr ? addr.address_name : r.address_name),
            lat: Number(r.y), lng: Number(r.x),
            dong: addr ? addr.region_3depth_name : (road ? road.region_3depth_name : ''),
            gu: addr ? addr.region_2depth_name : (road ? road.region_2depth_name : '')
          };
        }));
      }, { size: 10 });
    });
  }
  function searchPlaces(q){
    return new Promise(function(resolve){
      places.keywordSearch(q, function(result, status){
        if (status !== kakao.maps.services.Status.OK){ resolve([]); return; }
        resolve(result.map(function(p){
          var parts = (p.address_name || '').split(' ');
          var roadParts = (p.road_address_name || '').split(' ');
          return {
            road: shortAddr(p.road_address_name),
            short: roadParts.length > 2 ? roadParts.slice(2).join(' ') : p.road_address_name || '',
            jibun: shortAddr(p.address_name),
            name: p.place_name,
            lat: Number(p.y), lng: Number(p.x),
            dong: parts.length > 2 ? parts[2] : '',
            gu: parts.length > 1 ? parts[1] : ''
          };
        }));
      }, { size: 10 });
    });
  }
  function mergeResults(a, b){
    var seen = {};
    return a.concat(b).filter(function(it){
      var k = it.road + '|' + it.jibun;
      if (seen[k]) return false;
      seen[k] = true;
      return it.road || it.jibun;
    }).slice(0, 15);
  }
  function resultLine(tag, text){
    var line = el('span', 'nb-result-line');
    line.appendChild(el('span', 'nb-badge', tag));
    line.appendChild(el('span', 'nb-result-text', text));
    return line;
  }
  function renderResults(items){
    resultsEl.textContent = '';
    if (!items.length){ showEmpty(); return; }
    emptyEl.hidden = true;
    resultsEl.hidden = false;
    items.forEach(function(it, i){
      var btn = el('button', 'nb-result');
      btn.type = 'button';
      if (it.road) btn.appendChild(resultLine('도로명', it.road));
      if (it.jibun) btn.appendChild(resultLine('지번', it.jibun));
      // 누르는 순간 키보드가 먼저 닫혀 목록이 밀리지 않게 한다.
      btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
      btn.addEventListener('click', function(){ pick(it, i); });
      resultsEl.appendChild(btn);
    });
    $('nb-search-view').scrollTop = 0;
  }
  // 결과를 고르면 지도 상태로 돌아가 그 위치로 옮긴다. (Figma: 검색결과 반영)
  function pick(it, i){
    ut.log('addr_pick', { q: input.value.trim(), index: i, road: it.road, jibun: it.jibun });
    ut.log('search_close', { via: 'pick', q: lastQuery, count: lastCount });
    if (ob.navPop) ob.navPop('search');
    input.blur();
    setSearching(false);
    resetScroll();
    var info = { address: it.road || it.jibun, display: it.short || it.road || it.jibun, jibun: it.jibun, dong: it.dong, gu: it.gu };
    moveTo(it.lat, it.lng, 'search', info);
    syncClear();
    setTimeout(function(){ if (map){ map.relayout(); fitMap(false); } }, 340);
  }

  /* ============ 화면 밀어서 뒤로 가기 ============ */
  // app.js가 쌓아 둔 기록 종류(kind)를 알려 준다. 검색 상태면 지도 상태로, 동의 시트면 닫는다.
  window.addEventListener('onboarding:back', function(e){
    var kind = e.detail.kind;
    if (kind === 'search'){
      e.detail.action = 'search-close';
      closeSearch('swipe');
    } else if (kind === 'consent'){
      if (consentBusy){
        // 위치 권한 응답을 기다리는 중에는 시트를 그대로 두고 기록을 다시 쌓는다.
        e.detail.action = 'consent-busy';
        if (ob.navPush) ob.navPush('consent');
        return;
      }
      e.detail.action = 'consent-close';
      ut.log('consent_dismiss', { context: consentContext, via: 'swipe' });
      hideOverlay(consentEl);
    }
  });

  /* ============ 화면 연결 ============ */
  window.addEventListener('onboarding:screen', function(e){
    var name = e.detail.name;
    if (name === 'nearby') renderNearby();
    else if (searching){ searching = false; screenEl.classList.remove('is-searching'); }
    if (name === 'login' || name === 'intro'){
      consentEl.classList.remove('is-open');
      consentEl.hidden = true;
      consentBusy = false;
      agreeBtn.classList.remove('is-loading');
    }
  });
})();
