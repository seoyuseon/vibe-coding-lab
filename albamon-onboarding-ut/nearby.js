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
  var SHEET_LEVEL = 4;
  var GEO_OPTIONS = { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 };

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var consentEl = $('consent');
  var agreeBtn = $('consent-agree');
  var mapSheetEl = $('mapsheet');
  var addrEl = $('addrsheet');
  var addrInput = $('addr-input');
  var addrWrap = $('addr-input-wrap');
  var addrClear = $('addr-clear');
  var addrTip = $('addr-tip');
  var addrResults = $('addr-results');
  var radiusTab = $('radius-tab');
  var fieldText = $('addr-field-text');

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

  /* ============ 오버레이 (바텀시트) ============ */
  function showOverlay(node){
    node.hidden = false;
    void node.offsetWidth;
    node.classList.add('is-open');
  }
  function hideOverlay(node){
    node.classList.remove('is-open');
    setTimeout(function(){ if (!node.classList.contains('is-open')) node.hidden = true; }, 260);
  }
  function hideAllOverlays(){
    [consentEl, mapSheetEl, addrEl].forEach(function(n){ n.classList.remove('is-open'); n.hidden = true; });
    addrInput.blur();
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

  /* ============ 위치 동의 (4610:325447) ============ */
  // context: 'intro'(STEP 0 내 근처 선택하기) | 'locate'(지도 시트의 현재 위치 버튼)
  var consentContext = 'intro';
  var consentBusy = false;
  function openConsent(context){
    consentContext = context;
    consentBusy = false;
    agreeBtn.classList.remove('is-loading');
    showOverlay(consentEl);
    ut.log('consent_open', { context: context });
  }
  window.addEventListener('onboarding:nearby', function(){ openConsent('intro'); });

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
      if (pos) moveSheetTo(pos.lat, pos.lng, 'gps');
    });
  });
  function finishConsent(){
    consentBusy = false;
    agreeBtn.classList.remove('is-loading');
    hideOverlay(consentEl);
  }
  // 다음에 → 동의 없이 지도 시트에서 직접 위치를 정한다. (Figma 연결: 위치 동의 '다음에' → 알바 탐색위치)
  $('consent-later').addEventListener('click', function(){
    if (consentBusy) return;
    ut.log('consent_later', { context: consentContext });
    hideOverlay(consentEl);
    if (consentContext === 'intro'){
      enterNearby();
      openMapSheet('consent_later');
    }
  });
  consentEl.querySelector('[data-dismiss]').addEventListener('click', function(){
    if (consentBusy) return;
    ut.log('consent_dismiss', { context: consentContext });
    hideOverlay(consentEl);
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

  /* ============ STEP 1-2 · 내 근처 (4610:342023) ============ */
  function enterNearby(){
    state().mode = 'nearby';
    ob.go('nearby');
  }

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
    var s = state();
    $('nearby-address-text').textContent = s.place.address || '현재 위치';
    renderRadius();
    loadKakao().then(function(){
      ensurePreview();
      fitPreview(false);
    }).catch(function(){});
  }

  // 미리보기 지도: 직접 움직이지 않고, 누르면 '알바 탐색위치' 시트가 열린다. (Figma 연결: img_map → 지도 위치 변경)
  var preview = null;
  function ensurePreview(){
    if (preview) return preview;
    var K = kakao.maps;
    var s = state();
    var center = new K.LatLng(s.place.lat, s.place.lng);
    var map = new K.Map($('preview-map'), { center: center, level: 5, draggable: false, scrollwheel: false, disableDoubleClick: true, disableDoubleClickZoom: true, keyboardShortcuts: false });
    map.setZoomable(false);
    map.setDraggable(false);
    // 반경 원 (Figma Group 1948757614: #FF6D12 채움 10% · 1px 선)
    var circle = new K.Circle({ center: center, radius: s.radius * 1000, strokeWeight: 1, strokeColor: '#FF6D12', strokeOpacity: 1, strokeStyle: 'solid', fillColor: '#FF6D12', fillOpacity: 0.1 });
    circle.setMap(map);
    preview = { map: map, circle: circle };
    return preview;
  }
  // 반경 원이 지도 카드 안에 들어오는 가장 가까운 축척으로 맞춘다.
  function fitPreview(animate){
    if (!preview) return;
    var K = kakao.maps;
    var s = state();
    var center = new K.LatLng(s.place.lat, s.place.lng);
    var map = preview.map;
    map.relayout();
    preview.circle.setPosition(center);
    preview.circle.setRadius(s.radius * 1000);
    var before = map.getLevel();
    map.setBounds(preview.circle.getBounds(), 20, 20, 20, 20);
    var target = map.getLevel();
    map.setCenter(center);
    if (animate && before !== target){
      map.setLevel(before);
      map.setCenter(center);
      map.setLevel(target, { animate: { duration: 260 } });
    }
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
    fitPreview(true);
  });
  $('map-hit').addEventListener('click', function(){ openMapSheet('map'); });
  $('nearby-address').addEventListener('click', function(){ openMapSheet('title'); });
  $('nearby-next').addEventListener('click', function(){
    var s = state();
    s.mode = 'nearby';
    ut.log('region_done', { mode: 'nearby', address: s.place.address, placeSource: s.place.source, radius: s.radius, remote: s.remote });
    ob.go('step2');
  });

  /* ============ 알바 탐색위치 시트 (4638:342798) ============ */
  var sheetMap = null;
  var draft = null;           // 시트에서 고르는 중인 위치 (확인을 눌러야 반영)
  var geoToken = 0;
  var dragCount = 0;
  var lastDragLog = 0;

  function ensureSheetMap(){
    if (sheetMap) return sheetMap;
    var K = kakao.maps;
    sheetMap = new K.Map($('sheet-map'), { center: new K.LatLng(draft.lat, draft.lng), level: SHEET_LEVEL });
    K.event.addListener(sheetMap, 'dragend', function(){
      dragCount++;
      var now = Date.now();
      if (now - lastDragLog > 600){
        lastDragLog = now;
        ut.log('map_drag', { count: dragCount });
      }
    });
    K.event.addListener(sheetMap, 'zoom_changed', function(){
      if (!mapSheetEl.hidden) ut.log('map_zoom', { level: sheetMap.getLevel() });
    });
    K.event.addListener(sheetMap, 'idle', onSheetIdle);
    return sheetMap;
  }
  // 지도가 멈추면 가운데 좌표의 주소를 검색창에 보여준다.
  function onSheetIdle(){
    if (!draft || mapSheetEl.hidden) return;
    var c = sheetMap.getCenter();
    var lat = c.getLat();
    var lng = c.getLng();
    // 프로그램으로 옮긴 중심은 좌표 변환 오차가 있어 6m 안쪽은 같은 위치로 본다.
    if (Math.abs(lat - draft.lat) < 6e-5 && Math.abs(lng - draft.lng) < 6e-5) return;
    draft = { lat: lat, lng: lng, source: 'map', address: '', jibun: '', dong: '', gu: '' };
    var token = ++geoToken;
    addressAt(lat, lng).then(function(a){
      if (token !== geoToken || !a) return;
      Object.assign(draft, a);
      fieldText.textContent = a.address;
    });
  }
  function moveSheetTo(lat, lng, source, info){
    draft = Object.assign({ lat: lat, lng: lng, source: source, address: '', jibun: '', dong: '', gu: '' }, info || {});
    var token = ++geoToken;
    if (info && info.address) fieldText.textContent = info.address;
    else {
      addressAt(lat, lng).then(function(a){
        if (token !== geoToken || !a) return;
        Object.assign(draft, a);
        fieldText.textContent = a.address;
      });
    }
    if (sheetMap) sheetMap.setCenter(new kakao.maps.LatLng(lat, lng));
  }

  function openMapSheet(via){
    var s = state();
    draft = Object.assign({}, s.place);
    dragCount = 0;
    fieldText.textContent = draft.address || '';
    showOverlay(mapSheetEl);
    ut.log('mapsheet_open', { via: via });
    loadKakao().then(function(){
      var m = ensureSheetMap();
      m.relayout();
      m.setLevel(SHEET_LEVEL);
      m.setCenter(new kakao.maps.LatLng(draft.lat, draft.lng));
      // 시트가 올라오는 동안 크기가 바뀌므로 한 번 더 맞춘다.
      setTimeout(function(){ m.relayout(); m.setCenter(new kakao.maps.LatLng(draft.lat, draft.lng)); }, 280);
    }).catch(function(){});
  }
  function closeMapSheet(via){
    ut.log('mapsheet_close', { via: via, drags: dragCount });
    draft = null;
    hideOverlay(mapSheetEl);
  }
  $('mapsheet-confirm').addEventListener('click', function(){
    var s = state();
    var prev = s.place;
    var next = draft || prev;
    s.place = Object.assign({}, next, { address: next.address || prev.address });
    ut.log('mapsheet_confirm', { address: s.place.address, source: s.place.source, moved: Math.round(distance(prev, s.place)), drags: dragCount });
    draft = null;
    hideOverlay(mapSheetEl);
    s.mode = 'nearby';
    renderNearby();
  });
  mapSheetEl.querySelector('[data-close]').addEventListener('click', function(){ closeMapSheet('close'); });
  mapSheetEl.querySelector('[data-dismiss]').addEventListener('click', function(){ closeMapSheet('dim'); });

  // 현재 위치 버튼: 서비스 안 동의가 없으면 동의부터 받는다.
  $('locate-btn').addEventListener('click', function(){
    var s = state();
    ut.log('locate_tap', { consent: s.consent, geo: s.geo });
    if (!s.consent){ openConsent('locate'); return; }
    requestGeo('locate').then(function(pos){
      if (pos && !mapSheetEl.hidden) moveSheetTo(pos.lat, pos.lng, 'gps');
    });
  });

  function distance(a, b){
    var R = 6371000;
    var toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad;
    var dLng = (b.lng - a.lng) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ============ 주소검색 (4638:343037 / 4638:343173) ============ */
  var searchTimer = null;
  var searchLogTimer = null;
  var searchToken = 0;
  var lastQuery = '';
  var lastCount = 0;

  $('addr-field').addEventListener('click', function(){
    addrInput.value = '';
    syncAddrInput();
    showAddrTip();
    showOverlay(addrEl);
    addrInput.focus();
    ut.log('addr_open', {});
  });
  function closeAddr(via){
    ut.log('addr_close', { via: via, q: lastQuery, count: lastCount });
    addrInput.blur();
    hideOverlay(addrEl);
  }
  addrEl.querySelector('[data-close]').addEventListener('click', function(){ closeAddr('close'); });
  addrEl.querySelector('[data-dismiss]').addEventListener('click', function(){ closeAddr('dim'); });

  function syncAddrInput(){
    var has = addrInput.value !== '';
    addrClear.hidden = !has;
    $('addr-search-icon').hidden = has;
    addrWrap.classList.toggle('is-typing', has);
  }
  function showAddrTip(){
    addrTip.hidden = false;
    addrResults.hidden = true;
    addrResults.textContent = '';
  }
  addrInput.addEventListener('input', function(){
    syncAddrInput();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(search, 250);
  });
  addrInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); clearTimeout(searchTimer); search(); addrInput.blur(); }
  });
  addrClear.addEventListener('click', function(){
    addrInput.value = '';
    syncAddrInput();
    showAddrTip();
    addrInput.focus();
  });

  // 주소(도로명·지번) 검색과 장소(건물명) 검색을 함께 돌려 합친다.
  function search(){
    var q = addrInput.value.trim();
    var token = ++searchToken;
    if (!q){ showAddrTip(); return; }
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
    }).catch(function(){ if (token === searchToken) showAddrTip(); });
  }
  function searchAddress(q){
    return new Promise(function(resolve){
      geocoder.addressSearch(q, function(result, status){
        if (status !== kakao.maps.services.Status.OK){ resolve([]); return; }
        resolve(result.map(function(r){
          var road = r.road_address;
          var addr = r.address;
          var dong = addr ? addr.region_3depth_name : (road ? road.region_3depth_name : '');
          var extra = [road && road.region_3depth_name, road && road.building_name].filter(Boolean).join(', ');
          return {
            road: shortAddr(road ? road.address_name : ''),
            roadLabel: road ? shortAddr(road.address_name) + (extra ? ' (' + extra + ')' : '') : '',
            jibun: shortAddr(addr ? addr.address_name : r.address_name),
            lat: Number(r.y), lng: Number(r.x),
            dong: dong,
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
          var dong = parts.length > 2 ? parts[2] : '';
          return {
            road: shortAddr(p.road_address_name),
            roadLabel: p.road_address_name ? shortAddr(p.road_address_name) + ' (' + [dong, p.place_name].filter(Boolean).join(', ') + ')' : '',
            jibun: shortAddr(p.address_name),
            lat: Number(p.y), lng: Number(p.x),
            dong: dong,
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
  function addrLine(tag, text){
    var line = el('span', 'addr-line');
    line.appendChild(el('span', 'addr-tag', tag));
    line.appendChild(el('span', 'addr-text', text));
    return line;
  }
  function renderResults(items){
    addrResults.textContent = '';
    if (!items.length){ showAddrTip(); return; }
    addrTip.hidden = true;
    addrResults.hidden = false;
    items.forEach(function(it, i){
      var btn = el('button', 'addr-item');
      btn.type = 'button';
      if (it.roadLabel) btn.appendChild(addrLine('도로명', it.roadLabel));
      if (it.jibun) btn.appendChild(addrLine('지번', it.jibun));
      btn.addEventListener('click', function(){
        ut.log('addr_pick', { q: addrInput.value.trim(), index: i, road: it.road, jibun: it.jibun });
        addrInput.blur();
        hideOverlay(addrEl);
        moveSheetTo(it.lat, it.lng, 'search', { address: it.road || it.jibun, jibun: it.jibun, dong: it.dong, gu: it.gu });
      });
      addrResults.appendChild(btn);
    });
    addrResults.scrollTop = 0;
  }

  /* ============ 화면 밀어서 뒤로 가기 ============ */
  // 맨 위에 열린 바텀시트를 닫는다. (위치 권한 응답을 기다리는 중에는 그대로 둔다)
  window.addEventListener('onboarding:back', function(e){
    if (!addrEl.hidden){ e.detail.action = 'addr-close'; e.preventDefault(); closeAddr('swipe'); return; }
    if (!consentEl.hidden){
      e.preventDefault();
      if (consentBusy){ e.detail.action = 'consent-busy'; return; }
      e.detail.action = 'consent-close';
      ut.log('consent_dismiss', { context: consentContext, via: 'swipe' });
      hideOverlay(consentEl);
      return;
    }
    if (!mapSheetEl.hidden){ e.detail.action = 'mapsheet-close'; e.preventDefault(); closeMapSheet('swipe'); }
  });

  /* ============ 화면 연결 ============ */
  window.addEventListener('onboarding:screen', function(e){
    var name = e.detail.name;
    if (name === 'nearby') renderNearby();
    if (name === 'login'){
      hideAllOverlays();
      draft = null;
      consentBusy = false;
      agreeBtn.classList.remove('is-loading');
    }
  });
})();
