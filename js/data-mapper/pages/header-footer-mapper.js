(function (global) {
  'use strict';

  // 상담하기 — 뒤에 property.tripPropertyId 가 붙는다
  var CONSULT_BASE_URL = 'https://www.bookingplay.co.kr/api/cti_eicn/kakao_happy_talk?tid=';

  // 파트너 타입 — 원천은 백오피스 DB `public.contract_info.partner_type` 이고
  // BFF 가 코드 문자열을 그대로 내려준다. **분기는 템플릿이 한다**(PC/모바일은 템플릿만 안다).
  //
  //   distributor_a  총판A     PC 상담하기 / 모바일 상담하기 + 예약하기
  //   distributor_b  총판B     PC 없음     / 모바일 예약하기
  //   sales_agency   판매대행  PC 없음     / 모바일 예약하기
  //
  // ⚠️ 예약하기는 **파트너 타입과 무관**하다 — 세 타입 모두 모바일에서만 뜬다.
  //    그건 기존 `.ft_btn_reserve.for_m` 의 미디어쿼리가 이미 하고 있어 손대지 않는다.
  //    타입으로 갈리는 것은 상담하기 하나뿐이다.
  var CONSULT_PARTNER_TYPES = ['distributor_a'];

  // ⚠️ base-mapper 에 `cleanText` 가 없는 템플릿이 있어 의존하지 않는다.
  function consultText(v) {
    return v === undefined || v === null ? '' : String(v).trim();
  }



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
    this.mapConsult();
    this.mapSocialLinks();
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

  // 상담 URL 에 쓸 tripPropertyId. 없거나 형식이 아니면 빈 문자열.
  HeaderFooterMapper.prototype.getConsultId = function () {
    var raw = consultText(this.getProperty().tripPropertyId);
    // ⚠️ URL 쿼리에 그대로 붙는 값이라 토큰 형태만 통과시킨다. 플레이스홀더
    //    문자열(`숙소 ID` 같은 한글·공백)이 들어와도 링크가 깨지지 않는다.
    return /^[A-Za-z0-9_-]+$/.test(raw) ? raw : '';
  };

  // 상담하기 노출 대상인가 — 파트너 타입 + tripPropertyId 둘 다 있어야 한다.
  HeaderFooterMapper.prototype.isConsultVisible = function () {
    var partnerType = consultText(this.getProperty().partnerType);
    return Boolean(this.getConsultId()) && CONSULT_PARTNER_TYPES.indexOf(partnerType) !== -1;
  };

  // MAPPER: property.tripPropertyId + partnerType → [data-consult-button] (우측 하단 상담하기)
  //
  // 총판A 만 노출하고, `tripPropertyId` 가 비면 타입과 무관하게 숨긴다.
  // 값이 없으면 `[data-consult-wrap]` 째 숨긴다 — 버튼만 숨기면 빈 박스가 남는다.
  HeaderFooterMapper.prototype.mapConsult = function () {
    var tripPropertyId = this.getConsultId();
    var visible = this.isConsultVisible();

    // 상담하기가 빠지면 예약하기 아래가 비어 버린다.
    // CSS 가 위치를 되돌릴 수 있도록 상태를 루트에 찍는다.
    document.documentElement.setAttribute('data-consult', visible ? 'on' : 'off');

    document.querySelectorAll('[data-consult-button]').forEach(function (el) {
      var host = el.closest('[data-consult-wrap]') || el;
      if (!visible) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = CONSULT_BASE_URL + tripPropertyId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // 소셜 링크 플랫폼 — [data-homepage-socialLinks-{platform}] 와 1:1.
  // 헤더 네이버 버튼은 blog 칸을 쓴다(어드민에서 네이버 플레이스 주소를 blog 에 입력).
  var SOCIAL_PLATFORMS = ['facebook', 'instagram', 'blog', 'youtube'];

  // MAPPER: homepage.socialLinks.{platform} → [data-homepage-socialLinks-{platform}] (href, 없으면 숨김)
  //
  // 마크업 기본 상태가 숨김이라(깜빡임 방지) 값이 있을 때만 노출한다. 값이 null·빈 문자열·공백·키 없음이면 숨긴다.
  // 링크를 감싼 래퍼([data-social-wrap] — 헤더 .right 의 .btnSocial, 메뉴 패널의 .menuSocial)는
  // 보이는 링크가 하나도 없으면 래퍼째 숨겨 빈 칸·gap 이 남지 않게 한다.
  // 마크업이 없는 플랫폼(facebook / youtube)은 매칭 요소가 0개라 아무 일도 하지 않는다.
  // 헤더에 버튼이 하나라도 보이면 루트에 data-social="on" 을 찍는다 — 레이아웃 보정 CSS 의 기준
  // (:has 대신 — 일부 브라우저에서 스타일 미반영).
  HeaderFooterMapper.prototype.mapSocialLinks = function () {
    var socialLinks = this.getHomepage().socialLinks || {};
    var anyOn = false;
    SOCIAL_PLATFORMS.forEach(function (platform) {
      var url = consultText(socialLinks[platform]);
      document.querySelectorAll('[data-homepage-socialLinks-' + platform + ']').forEach(function (el) {
        if (!url) {
          el.style.display = 'none';
          el.setAttribute('href', '#!');
          el.removeAttribute('target');
          el.removeAttribute('rel');
          return;
        }
        el.setAttribute('href', url);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.style.display = '';
        anyOn = true;
      });
    });
    document.querySelectorAll('[data-social-wrap]').forEach(function (wrap) {
      var shown = Array.prototype.some.call(wrap.querySelectorAll('a'), function (a) {
        return a.style.display !== 'none';
      });
      wrap.style.display = shown ? '' : 'none';
    });
    document.documentElement.setAttribute('data-social', anyOn ? 'on' : 'off');
  };

  // MAPPER: customFields.roomtypes[].name → ROOMS 메뉴 동적 생성 (미리보기 링크 유지)
  // 멱등: 재실행/데이터 갱신 시 항상 최신 데이터로 다시 그림 (이전 생성분 제거 후 재생성)
  HeaderFooterMapper.prototype.mapRoomMenu = function () {
    var submenu = document.querySelector('[data-rooms-submenu]');
    if (!submenu) return;
    var self = this;
    var roomtypes = this.getRoomtypes();
    var roomItems = this.getRoomMenuItems(roomtypes, function (rt) { return (rt && rt.name) || ''; });

    submenu.querySelectorAll('[data-room-mapped]').forEach(function (el) { el.remove(); });

    var placeholder = submenu.querySelector('[data-room-menu-link]');
    if (placeholder) placeholder.style.display = roomItems.length ? 'none' : '';

    roomItems.forEach(function (item) {
      var name = self.getRoomMenuLabel(item);
      if (!String(name).trim()) return;
      var a = document.createElement('a');
      a.href = self.getRoomMenuLink(item, 'id');
      a.textContent = name;
      a.setAttribute('data-room-mapped', '');
      submenu.appendChild(a);
    });
  };

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
  // MAPPER: property.tripProviderName → [data-copyright]
  // 공급사명이 있으면 data-copyright 의 템플릿 문자열에서 {provider} 를 치환한다.
  // 값이 없으면(백오피스 미입력 → "") HTML 의 기존 트립일레븐 문구를 그대로 둔다.
  HeaderFooterMapper.prototype.mapCopyright = function () {
    var provider = String(this.getProperty().tripProviderName || '').trim();
    if (!provider) return;
    document.querySelectorAll('[data-copyright]').forEach(function (el) {
      var tpl = el.getAttribute('data-copyright') || '';
      el.textContent = tpl.replace(/\{provider\}/g, provider);
    });
  };

  HeaderFooterMapper.prototype.mapFooter = function () {
    this.mapCopyright();
    var prop = this.getProperty();

    // Footer 슬로건: "지금 바로 [숙소 한글명]과/와 함께해 보세요."
    var sloganEl = document.querySelector('[data-footer-slogan]');
    if (sloganEl) {
      var propertyName = this.getPropertyName();
      var particle = this.getKoreanParticle(propertyName);
      sloganEl.textContent = '지금 바로 ' + propertyName + particle + ' 함께해 보세요.';
    }

    // 업체 전화번호 (배열이면 전부 한 줄씩 노출)
    var phones = this.toPhoneList(prop.contactPhone);
    var phoneEl = document.querySelector('[data-footer-phone]');
    if (phoneEl) {
      phoneEl.textContent = '';
      phones.forEach(function (p) {
        var item = document.createElement('span');
        item.className = 'phoneItem';
        item.textContent = '+ ' + p;
        phoneEl.appendChild(item);
      });
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
