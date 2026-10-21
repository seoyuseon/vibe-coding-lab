(function(){
  'use strict';

  /* ============ 데이터 ============ */
  // 1depth 순서는 Figma 노출 순서(서울~대구)를 따르고, 시안에서 숨김 처리된 나머지 시·도를 뒤에 둔다.
  var REGIONS = [
    ['서울', ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구']],
    ['경기', ['가평군','고양시 덕양구','고양시 일산동구','고양시 일산서구','과천시','광명시','광주시','구리시','군포시','김포시','남양주시','동두천시','부천시 소사구','부천시 오정구','부천시 원미구','성남시 분당구','성남시 수정구','성남시 중원구','수원시 권선구','수원시 영통구','수원시 장안구','수원시 팔달구','시흥시','안산시 단원구','안산시 상록구','안성시','안양시 동안구','안양시 만안구','양주시','양평군','여주시','연천군','오산시','용인시 기흥구','용인시 수지구','용인시 처인구','의왕시','의정부시','이천시','파주시','평택시','포천시','하남시','화성시']],
    ['인천', ['강화군','검단구','계양구','남동구','미추홀구','부평구','서구','연수구','영종구','옹진군','제물포구']],
    ['강원', ['강릉시','고성군','동해시','삼척시','속초시','양구군','양양군','영월군','원주시','인제군','정선군','철원군','춘천시','태백시','평창군','홍천군','화천군','횡성군']],
    ['대전', ['대덕구','동구','서구','유성구','중구']],
    ['세종', []],
    ['충남', ['계룡시','공주시','금산군','논산시','당진시','보령시','부여군','서산시','서천군','아산시','예산군','천안시 동남구','천안시 서북구','청양군','태안군','홍성군']],
    ['충북', ['괴산군','단양군','보은군','영동군','옥천군','음성군','제천시','증평군','진천군','청주시 상당구','청주시 서원구','청주시 청원구','청주시 흥덕구','충주시']],
    ['부산', ['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구']],
    ['울산', ['남구','동구','북구','울주군','중구']],
    ['경남', ['거제시','거창군','고성군','김해시','남해군','밀양시','사천시','산청군','양산시','의령군','진주시','창녕군','창원시 마산합포구','창원시 마산회원구','창원시 성산구','창원시 의창구','창원시 진해구','통영시','하동군','함안군','함양군','합천군']],
    ['경북', ['경산시','경주시','고령군','구미시','김천시','문경시','봉화군','상주시','성주군','안동시','영덕군','영양군','영주시','영천시','예천군','울릉군','울진군','의성군','청도군','청송군','칠곡군','포항시 남구','포항시 북구']],
    ['대구', ['군위군','남구','달서구','달성군','동구','북구','서구','수성구','중구']],
    ['광주', ['광산구','남구','동구','북구','서구']],
    ['전북', ['고창군','군산시','김제시','남원시','무주군','부안군','순창군','완주군','익산시','임실군','장수군','전주시 덕진구','전주시 완산구','정읍시','진안군']],
    ['전남', ['강진군','고흥군','곡성군','광양시','구례군','나주시','담양군','목포시','무안군','보성군','순천시','신안군','여수시','영광군','영암군','완도군','장성군','장흥군','진도군','함평군','해남군','화순군']],
    ['제주', ['서귀포시','제주시']]
  ];
  var ALL = '*';
  var MAX_REGIONS = 10;

  // STEP 2에서 '한 달 이내'면 단기 업직종(4488:78079), 그 외는 장기 업직종(4488:78228)
  var JOBS = {
    short: [
      ['promotion', '행사·판촉', '이벤트·스텝·전단지배포'],
      ['info', '전시·안내', '컨벤션·세미나·안내데스크'],
      ['delivery-box', '물류·배송', '입출고·창고관리·상하차'],
      ['shopping-bag', '매장·판매', '매장관리·유통점·마트'],
      ['serving', '음식점·서빙', '서빙·레스토랑'],
      ['factory', '제조·생산', '포장·품질검사·조립'],
      ['security', '청소·경비', '미화·보안·경비·경호']
    ],
    long: [
      ['shopping-bag', '매장·판매', '매장관리·백화점·쇼핑몰'],
      ['serving', '음식점·서빙', '일반음식점'],
      ['staff-badge', '행사·안내', '이벤트·스텝·안내데스크'],
      ['cafe', '카페·디저트', '커피전문점·베이커리·떡'],
      ['cooking', '주방·조리', '주방보조·설거지·조리사'],
      ['office', '사무직', '사무보조·문서작성'],
      ['factory', '제조·생산', '포장·품질검사·조립'],
      ['delivery-box', '물류·배송', '입출고·창고관리·택배'],
      ['education', '교육·학원', '입시·학원·보조교사'],
      ['customer-service', '고객상담', '인/아웃바운드·텔레마케팅']
    ]
  };

  /* ============ 상태 ============ */
  function initialState(){
    return {
      region: '서울',
      selected: [],          // 'region|district' (district '*' = 전체), 선택 순서 유지
      remote: false,
      tooltip: false,
      query: '',
      period: null,
      periodConfirmed: false, // STEP 3까지 진행한 뒤 돌아오면 '다음' 버튼 노출
      jobsFor: null,
      jobs: []
    };
  }
  var state = initialState();

  /* ============ DOM ============ */
  var $ = function(id){ return document.getElementById(id); };
  var phone = document.querySelector('.phone');
  var screens = document.querySelectorAll('.screen');
  var step1 = document.querySelector('.step1');
  var depth1 = $('depth1');
  var depth2 = $('depth2');
  var regionCols = $('region-cols');
  var results = $('search-results');
  var input = $('region-search');
  var clearBtn = $('search-clear');
  var remoteCheck = $('remote-check');
  var remoteInfo = $('remote-info');
  var tooltip = $('remote-tooltip');
  var step1Bar = $('step1-bar');
  var sheet = $('select-sheet');
  var chipRow = $('chip-row');
  var countEl = $('select-count');
  var toast = $('toast');
  var periodList = $('period-list');
  var step2Next = $('step2-next');
  var jobGrid = $('job-grid');
  var step3Next = $('step3-next');

  function el(tag, cls, text){
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function img(src, w, h, cls){
    var node = el('img', cls);
    node.src = src; node.width = w; node.height = h; node.alt = '';
    return node;
  }

  /* ============ 화면 전환 ============ */
  function go(name){
    if (name === 'step3') prepareJobs();
    if (name === 'login') state = initialState();

    screens.forEach(function(s){ s.hidden = s.dataset.screen !== name; });
    phone.dataset.screen = name;
    hideTooltip();
    hideToast();

    if (name === 'login') resetStep1View();
    if (name === 'step1') renderStep1();
    if (name === 'step2') renderPeriod();
    if (name === 'step3'){
      state.periodConfirmed = true;
      renderJobs();
    }
    var scroller = document.querySelector('.screen[data-screen="' + name + '"] .content-scroll, .screen[data-screen="' + name + '"] .login-scroll');
    if (scroller && name !== 'step1') scroller.scrollTop = 0;
  }

  document.addEventListener('click', function(e){
    var target = e.target.closest('[data-go]');
    if (target && !target.disabled) go(target.dataset.go);
  });

  /* ============ STEP 1 · 지역 선택 ============ */
  function key(region, district){ return region + '|' + district; }
  function isSelected(region, district){ return state.selected.indexOf(key(region, district)) > -1; }
  function regionCount(region){
    return state.selected.filter(function(k){ return k.split('|')[0] === region; }).length;
  }
  function districtsOf(region){
    for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i][0] === region) return REGIONS[i][1];
    return [];
  }
  function chipLabel(k){
    var parts = k.split('|');
    return parts[1] === ALL ? parts[0] + ' 전체' : parts[1];
  }

  // '전체'와 개별 시·군·구는 함께 담지 않는다.
  function toggle(region, district){
    var k = key(region, district);
    var idx = state.selected.indexOf(k);
    if (idx > -1){
      state.selected.splice(idx, 1);
      renderStep1();
      return;
    }
    var next = state.selected.filter(function(s){
      var p = s.split('|');
      if (p[0] !== region) return true;
      return district === ALL ? false : p[1] !== ALL;
    });
    if (next.length + 1 > MAX_REGIONS){
      showToast();
      return;
    }
    next.push(k);
    state.selected = next;
    renderStep1();
    chipRow.scrollLeft = chipRow.scrollWidth;
  }

  function checkIcons(){
    var frag = document.createDocumentFragment();
    frag.appendChild(img('assets/icon-line-check-off.svg', 20, 20, 'check check-off'));
    frag.appendChild(img('assets/icon-line-check-on.svg', 20, 20, 'check check-on'));
    return frag;
  }

  function renderDepth1(){
    depth1.textContent = '';
    REGIONS.forEach(function(r){
      var name = r[0];
      var btn = el('button', 'filter-item region-item' + (name === state.region ? ' is-current' : ''));
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', name === state.region ? 'true' : 'false');
      btn.appendChild(el('span', null, name));
      var n = regionCount(name);
      if (n) btn.appendChild(el('span', 'region-count', String(n)));
      btn.addEventListener('click', function(){
        if (state.region === name) return;
        state.region = name;
        renderDepth1();
        renderDepth2();
        depth2.scrollTop = 0;
      });
      depth1.appendChild(btn);
    });
  }

  function districtButton(region, district, labelNodes){
    var on = isSelected(region, district);
    var btn = el('button', 'filter-item' + (on ? ' is-on' : ''));
    btn.type = 'button';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.appendChild(checkIcons());
    btn.appendChild(labelNodes);
    btn.addEventListener('click', function(){ toggle(region, district); });
    return btn;
  }

  function renderDepth2(){
    var top = depth2.scrollTop;
    depth2.textContent = '';
    var region = state.region;
    depth2.appendChild(districtButton(region, ALL, el('span', null, region + ' 전체')));
    districtsOf(region).forEach(function(d){
      depth2.appendChild(districtButton(region, d, el('span', null, d)));
    });
    depth2.scrollTop = top;
  }

  function highlight(label, q){
    var wrap = el('span');
    var i = label.indexOf(q);
    if (i < 0){ wrap.textContent = label; return wrap; }
    if (i > 0) wrap.appendChild(document.createTextNode(label.slice(0, i)));
    wrap.appendChild(el('span', 'hl', label.slice(i, i + q.length)));
    if (i + q.length < label.length) wrap.appendChild(document.createTextNode(label.slice(i + q.length)));
    return wrap;
  }

  function renderSearch(){
    var q = state.query.trim();
    var top = results.scrollTop;
    results.textContent = '';
    if (!q) return;
    REGIONS.forEach(function(r){
      var region = r[0];
      var entries = [[ALL, region + ' 전체']].concat(r[1].map(function(d){ return [d, region + ' ' + d]; }));
      entries.forEach(function(entry){
        if (entry[1].indexOf(q) < 0) return;
        results.appendChild(districtButton(region, entry[0], highlight(entry[1], q)));
      });
    });
    results.scrollTop = top;
  }

  function renderSheet(){
    var n = state.selected.length;
    step1Bar.hidden = n > 0;
    sheet.hidden = n === 0;
    countEl.textContent = n;
    var left = chipRow.scrollLeft;
    chipRow.textContent = '';
    state.selected.forEach(function(k){
      var chip = el('button', 'chip');
      chip.type = 'button';
      chip.setAttribute('aria-label', chipLabel(k) + ' 선택 해제');
      chip.appendChild(el('span', null, chipLabel(k)));
      chip.appendChild(img('assets/icon-chip-close.svg', 14, 14));
      chip.addEventListener('click', function(){
        var p = k.split('|');
        toggle(p[0], p[1]);
      });
      chipRow.appendChild(chip);
    });
    chipRow.scrollLeft = left;
  }

  function renderStep1(){
    var searching = state.query.trim() !== '';
    step1.classList.toggle('is-searching', searching);
    regionCols.hidden = searching;
    results.hidden = !searching;
    clearBtn.hidden = state.query === '';
    remoteCheck.setAttribute('aria-checked', state.remote ? 'true' : 'false');
    renderDepth1();
    renderDepth2();
    renderSearch();
    renderSheet();
  }

  function resetStep1View(){
    input.value = '';
    depth1.scrollTop = 0;
    depth2.scrollTop = 0;
    results.scrollTop = 0;
    step1.classList.remove('is-keyboard');
  }

  // 검색
  input.addEventListener('input', function(){
    var wasSearching = state.query.trim() !== '';
    state.query = input.value;
    if (wasSearching !== (state.query.trim() !== '')) results.scrollTop = 0;
    renderStep1();
  });
  input.addEventListener('focus', function(){ step1.classList.add('is-keyboard'); hideTooltip(); });
  input.addEventListener('blur', function(){ step1.classList.remove('is-keyboard'); });
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') input.blur(); });
  $('search-field').addEventListener('click', function(e){
    if (!e.target.closest('#search-clear')) input.focus();
  });
  clearBtn.addEventListener('click', function(){
    input.value = '';
    state.query = '';
    results.scrollTop = 0;
    renderStep1();
    input.focus();
  });

  // PC 키보드 목업: 탭해도 입력 포커스를 유지하고 '완료'에서만 닫는다.
  document.querySelector('.keyboard').addEventListener('mousedown', function(e){ e.preventDefault(); });
  $('keyboard-done').addEventListener('click', function(){ input.blur(); });

  // 재택 근무
  remoteCheck.addEventListener('click', function(){
    state.remote = !state.remote;
    remoteCheck.setAttribute('aria-checked', state.remote ? 'true' : 'false');
  });
  function showTooltip(){
    state.tooltip = true;
    tooltip.hidden = false;
    remoteInfo.setAttribute('aria-expanded', 'true');
  }
  function hideTooltip(){
    state.tooltip = false;
    tooltip.hidden = true;
    remoteInfo.setAttribute('aria-expanded', 'false');
  }
  remoteInfo.addEventListener('click', function(){ state.tooltip ? hideTooltip() : showTooltip(); });
  $('tooltip-close').addEventListener('click', hideTooltip);

  // 초기화
  $('select-reset').addEventListener('click', function(){
    state.selected = [];
    renderStep1();
  });

  // 토스트
  var toastTimer = null;
  function showToast(){
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 2000);
  }
  function hideToast(){
    clearTimeout(toastTimer);
    toast.classList.remove('is-visible');
  }

  /* ============ STEP 2 · 근무기간 ============ */
  function renderPeriod(){
    periodList.querySelectorAll('[data-period]').forEach(function(btn){
      btn.setAttribute('aria-pressed', btn.dataset.period === state.period ? 'true' : 'false');
    });
    step2Next.hidden = !(state.periodConfirmed && state.period);
  }
  periodList.addEventListener('click', function(e){
    var btn = e.target.closest('[data-period]');
    if (!btn) return;
    state.period = btn.dataset.period;
    // 처음 선택할 때는 바로 STEP 3으로, STEP 3에서 돌아온 뒤에는 선택만 바꾸고 '다음'으로 이동
    if (state.periodConfirmed) renderPeriod();
    else go('step3');
  });

  /* ============ STEP 3 · 업직종 ============ */
  function prepareJobs(){
    var type = state.period === 'within-month' ? 'short' : 'long';
    if (state.jobsFor !== type){
      state.jobsFor = type;
      state.jobs = [];
    }
  }

  function renderJobs(){
    jobGrid.textContent = '';
    JOBS[state.jobsFor].forEach(function(job){
      var id = job[0];
      var on = state.jobs.indexOf(id) > -1;
      var card = el('button', 'job-card');
      card.type = 'button';
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
      var head = el('span', 'job-card-head');
      head.appendChild(img('assets/job-' + id + '.svg', 20, 20, 'job-icon job-icon-off'));
      head.appendChild(img('assets/job-' + id + '-on.svg', 20, 20, 'job-icon job-icon-on'));
      head.appendChild(el('span', 'job-name', job[1]));
      card.appendChild(head);
      card.appendChild(el('span', 'job-desc', job[2]));
      card.addEventListener('click', function(){
        var i = state.jobs.indexOf(id);
        if (i > -1) state.jobs.splice(i, 1);
        else state.jobs.push(id);
        card.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
        step3Next.disabled = state.jobs.length === 0;
      });
      jobGrid.appendChild(card);
    });
    step3Next.disabled = state.jobs.length === 0;
  }

  // 온보딩 완료 화면은 시안에 없어 처음(로그인)으로 돌아가 다시 체험할 수 있게 한다.
  step3Next.addEventListener('click', function(){
    if (!step3Next.disabled) go('login');
  });

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

  renderStep1();
})();
