(function (global) {
  'use strict';

  function HeaderFooterMapper() {
    BaseDataMapper.call(this);
  }
  HeaderFooterMapper.prototype = Object.create(BaseDataMapper.prototype);
  HeaderFooterMapper.prototype.constructor = HeaderFooterMapper;

  HeaderFooterMapper.prototype.mapPage = function () {
    this.mapLogo();
    this.mapFavicon();
    this.mapBookingLinks();
    this.mapYbsButton();
    this.mapCustomPages();
    this.mapRoomMenu();
    this.mapFacilityMenu();
    this.mapFooter();
  };

  // MAPPER: homepage.images[0].logo[isSelected].url
  HeaderFooterMapper.prototype.mapLogo = function () {
    var logoUrl = this.getLogo();
    var el = document.querySelector('[data-logo]');
    if (!el) return;

    if (logoUrl) {
      el.src = logoUrl;
    } else {
      ImageHelpers.applyPlaceholder(el);
    }
  };

  // MAPPER: favicon ← homepage.images[0].logo[isSelected].url (로고 데이터 재사용)
  HeaderFooterMapper.prototype.mapFavicon = function () {
    var logoUrl = this.getLogo();
    if (!logoUrl) return;
    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  };

  // MAPPER: property.realtimeBookingId
  HeaderFooterMapper.prototype.mapBookingLinks = function () {
    var bookingUrl = this.getBookingUrl();
    document.querySelectorAll('[data-booking-link]').forEach(function (el) {
      if (bookingUrl && bookingUrl !== '#!') {
        el.href = 'javascript:void(0)';
        el.addEventListener('click', function () {
          window.open(bookingUrl, '_blank');
        });
      }
    });
  };

  // 동적 페이지 메뉴 생성 (enabled 값에 따라)
  HeaderFooterMapper.prototype.mapCustomPages = function () {
    var data = this.data || {};

    // enabled 값 안전하게 접근
    var nearbyEnabled = (data.homepage &&
                         data.homepage.customFields &&
                         data.homepage.customFields.pages &&
                         data.homepage.customFields.pages.nearbyAttractions &&
                         data.homepage.customFields.pages.nearbyAttractions.sections &&
                         data.homepage.customFields.pages.nearbyAttractions.sections[0] &&
                         data.homepage.customFields.pages.nearbyAttractions.sections[0].enabled) !== false;

    var layoutMapEnabled = (data.homepage &&
                            data.homepage.customFields &&
                            data.homepage.customFields.pages &&
                            data.homepage.customFields.pages.layoutMap &&
                            data.homepage.customFields.pages.layoutMap.sections &&
                            data.homepage.customFields.pages.layoutMap.sections[0] &&
                            data.homepage.customFields.pages.layoutMap.sections[0].enabled) !== false;

    // ===== TRAVEL 메뉴 처리 =====
    var travelSubmenu = document.querySelector('[data-travel-submenu]');
    var travelMenu = document.querySelector('[data-travel-menu]');

    if (travelSubmenu) {
      // 기존 링크 제거
      var existingLink = travelSubmenu.querySelector('[data-menu-id="nearby-attractions"]');
      if (existingLink) {
        existingLink.remove();
      }

      if (nearbyEnabled) {
        // enabled=true이면 메뉴 표시 및 링크 추가
        if (travelMenu) travelMenu.style.display = 'block';

        var nearbyLink = document.createElement('a');
        nearbyLink.href = 'nearby-attractions.html';
        nearbyLink.textContent = '주변여행지';
        nearbyLink.setAttribute('data-menu-id', 'nearby-attractions');
        travelSubmenu.appendChild(nearbyLink);
      } else {
        // enabled=false이면 메뉴 숨김
        if (travelMenu) travelMenu.style.display = 'none';
      }
    }

    // ===== ROOMS > 미리보기 처리 =====
    var roomsSubmenu = document.querySelector('[data-rooms-submenu]');

    if (roomsSubmenu) {
      // 기존 링크 제거
      var existingLink = roomsSubmenu.querySelector('[data-menu-id="layout-map"]');
      if (existingLink) {
        existingLink.remove();
      }

      if (layoutMapEnabled) {
        // enabled=true이면 링크 추가
        var layoutLink = document.createElement('a');
        layoutLink.href = 'layout-map.html';
        layoutLink.textContent = '미리보기';
        layoutLink.setAttribute('data-menu-id', 'layout-map');
        // 항상 서브메뉴 최상단에 추가
        // (mapRoomMenu가 data-room-menu-link 앵커를 제거하므로, 재렌더 시에도 순서 유지)
        roomsSubmenu.insertBefore(layoutLink, roomsSubmenu.firstChild);
      }
    }
  };

  // MAPPER: property.ybsId
  HeaderFooterMapper.prototype.mapYbsButton = function () {
    var prop = this.getProperty();
    var ybsId = prop.ybsId;
    var ybs_url = 'https://rev.yapen.co.kr/external?ypIdx=';
    var ybsButtons = document.querySelectorAll('[data-ybs-button]');

    if (!ybsId) {
      // ybsId가 없으면 모든 YBS 버튼 숨김
      ybsButtons.forEach(function (button) {
        button.style.display = 'none';
      });
      return;
    }

    // ybsId가 있으면 버튼 표시 및 클릭 이벤트 설정
    ybsButtons.forEach(function (button) {
      button.style.display = 'block';
      button.setAttribute('data-ybs-id', ybsId);
      var link = button.querySelector('a');
      if (link) {
        link.href = 'javascript:void(0)';
        link.addEventListener('click', function () {
          window.open(ybs_url + ybsId, '_blank');
        });
      }
    });
  };

  // MAPPER: customFields.roomtypes[].name → ROOMS 메뉴 동적 생성 (미리보기 링크 유지)
  // 멱등: 재실행/데이터 갱신 시 항상 최신 데이터로 다시 그림 (이전 생성분 제거 후 재생성)
  HeaderFooterMapper.prototype.mapRoomMenu = function () {
    var submenu = document.querySelector('[data-rooms-submenu]');
    if (!submenu) return;
    var roomtypes = this.getRoomtypes();

    // 이전에 생성한 동적 객실 링크 제거 (멱등 보장)
    submenu.querySelectorAll('[data-room-mapped]').forEach(function (el) { el.remove(); });

    var named = roomtypes.filter(function (rt) { return rt.name && rt.name.trim(); });

    // placeholder(객실 목록): 명명된 객실이 있으면 숨기고, 없으면 노출 (제거하지 않아 재실행 가능)
    var placeholder = submenu.querySelector('[data-room-menu-link]');
    if (placeholder) placeholder.style.display = named.length ? 'none' : '';

    named.forEach(function (rt) {
      var a = document.createElement('a');
      a.href = 'room.html?id=' + rt.id;
      a.textContent = rt.name;
      a.setAttribute('data-room-mapped', '');
      submenu.appendChild(a);
    });
  };

  // MAPPER: property.facilities[].name → SPECIAL 메뉴 동적 생성
  // 멱등: 재실행/데이터 갱신 시 항상 최신 데이터로 다시 그림 (이전 생성분 제거 후 재생성)
  HeaderFooterMapper.prototype.mapFacilityMenu = function () {
    var placeholder = document.querySelector('[data-facility-menu-link]');
    if (!placeholder) return;
    var parent = placeholder.parentNode;
    var facilities = (this.getProperty().facilities || []).filter(function (f) {
      return f.name && String(f.name).trim();
    });

    // 이전에 생성한 동적 시설 링크 제거 (멱등 보장)
    parent.querySelectorAll('[data-facility-mapped]').forEach(function (el) { el.remove(); });

    // placeholder(시설 안내): 시설이 있으면 숨기고, 없으면 노출 (제거하지 않아 재실행 가능)
    placeholder.style.display = facilities.length ? 'none' : '';

    facilities.forEach(function (f) {
      var a = document.createElement('a');
      a.href = 'facility.html?id=' + f.id;
      a.textContent = f.name;
      a.setAttribute('data-facility-mapped', '');
      parent.appendChild(a);
    });
  };

  // 한글 받침 판별하여 "과/와" 선택
  HeaderFooterMapper.prototype.getKoreanParticle = function (word) {
    if (!word || word.length === 0) return '과';
    var lastChar = word.charCodeAt(word.length - 1);
    if (lastChar >= 0xAC00 && lastChar <= 0xD7A3) {
      var code = lastChar - 0xAC00;
      return (code % 28 !== 0) ? '과' : '와';
    }
    return '과';
  };

  // MAPPER: property.name, property.contactPhone, businessInfo
  HeaderFooterMapper.prototype.mapFooter = function () {
    var prop = this.getProperty();

    // Footer 슬로건: "지금 바로 [숙소 한글명]과/와 함께해 보세요."
    var sloganEl = document.querySelector('[data-footer-slogan]');
    if (sloganEl) {
      var propertyName = this.getPropertyName();
      var particle = this.getKoreanParticle(propertyName);
      sloganEl.textContent = '지금 바로 ' + propertyName + particle + ' 함께해 보세요.';
    }

    // 업체 전화번호 (없으면 빈값) — HTML 정적 플레이스홀더 대신 JS
    var phoneEl = document.querySelector('[data-footer-phone]');
    if (phoneEl) {
      phoneEl.textContent = prop.contactPhone
        ? '+ ' + prop.contactPhone : '';
    }

    // 사업자 정보 (없으면 빈값) — HTML 정적 플레이스홀더 대신 JS
    var bizEl = document.querySelector('[data-footer-business-info]');
    if (bizEl) {
      if (prop.businessInfo) {
        var b = prop.businessInfo;
        var name = b.businessName || this.getPropertyName();
        bizEl.textContent =
          '상호 : ' + name +
          ' ｜대표자 : ' + (b.representativeName || '') +
          '｜ 주소 : ' + (b.businessAddress || '') +
          '｜ 사업자번호 : ' + (b.businessNumber || '');
      } else {
        bizEl.textContent = '';
      }
    }

    // 저작권 : 트립일레븐 하드코딩 (footer.html 정적 텍스트, 매핑 안 함)
  };

  document.addEventListener('headerFooterLoaded', function () {
    var mapper = new HeaderFooterMapper();
    mapper.initialize();
    global.headerFooterMapperInstance = mapper;
  });

  global.HeaderFooterMapper = HeaderFooterMapper;
})(window);
