(function (global) {
  'use strict';

  function BaseDataMapper() {
    this.data = null;
    this.isDataLoaded = false;
  }

  BaseDataMapper.prototype.initialize = function () {
    var self = this;
    var url = 'standard-template-data.json?t=' + Date.now();
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load standard-template-data.json');
        return res.json();
      })
      .then(function (json) {
        // 프리뷰: admin 데이터가 이미 도착했다면 standard 데이터로 덮어쓰지 않음
        // (덮어쓰면 메뉴/매핑이 잘못된 객실명 등으로 고착될 수 있음)
        if (window.previewHandler && window.previewHandler.adminDataReceived) return;
        self.data = json;
        self.isDataLoaded = true;
        self.mapPage();
        if (window.__tplReveal) window.__tplReveal(); // 매핑 완료 → 화면 노출(페이드인)
      })
      .catch(function (err) {
        console.error('[BaseDataMapper] initialize error:', err);
        if (window.__tplReveal) window.__tplReveal(); // 실패해도 화면은 노출
      });
  };

  BaseDataMapper.prototype.mapPage = function () {};

  BaseDataMapper.prototype.updateData = function (newData) {
    this.data = newData;
    this.isDataLoaded = true;
    this.mapPage();
    if (window.__tplReveal) window.__tplReveal(); // 매핑 완료 → 화면 노출(페이드인)
  };

  // ── 데이터 접근 헬퍼 ──────────────────────────────────────
  BaseDataMapper.prototype.getProperty = function () {
    return (this.data && this.data.property) || {};
  };

  BaseDataMapper.prototype.getHomepage = function () {
    return (this.data && this.data.homepage) || {};
  };

  BaseDataMapper.prototype.getCustomFields = function () {
    return this.getHomepage().customFields || {};
  };

  // customFields.roomtypes (localhost / preview 경로 모두 대응)
  BaseDataMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  BaseDataMapper.prototype.getPages = function () {
    // localhost 경로: this.data.homepage.customFields.pages
    var pagesFromHomepage = this.getCustomFields().pages;
    if (pagesFromHomepage && Object.keys(pagesFromHomepage).length > 0) {
      return pagesFromHomepage;
    }

    // preview 경로: this.data.customFields.pages
    if (this.data && this.data.customFields && this.data.customFields.pages) {
      return this.data.customFields.pages;
    }

    return {};
  };

  // customFields.property.name 우선, 없으면 property.name
  BaseDataMapper.prototype.getPropertyName = function () {
    var cf = this.getCustomFields();
    if (cf.property && cf.property.name) return cf.property.name;
    return this.getProperty().name || '';
  };

  // customFields.property.nameEn 우선, 없으면 property.nameEn
  BaseDataMapper.prototype.getPropertyNameEn = function () {
    var cf = this.getCustomFields();
    if (cf.property && cf.property.nameEn) return cf.property.nameEn;
    return this.getProperty().nameEn || '';
  };

  // homepage.images[0].logo 중 isSelected인 URL
  BaseDataMapper.prototype.getLogo = function () {
    var hp = this.getHomepage();
    var images = hp.images;
    if (!images || !images[0] || !images[0].logo) return '';
    var logos = images[0].logo;
    var selected = logos.find(function (l) { return l.isSelected; });
    return selected ? selected.url : (logos[0] ? logos[0].url : '');
  };

  // property.realtimeBookingId
  // realtimeBookingId 는 "실시간예약링크" 같은 플레이스홀더/설명 문구가 그대로 들어올 수 있다.
  // 그걸 href 로 쓰면 상대경로로 해석돼 404 페이지로 이동하므로,
  // 실제 URL 로 보일 때만 링크로 취급하고 그 외에는 '#!'(비활성) 로 처리한다.
  BaseDataMapper.prototype.getBookingUrl = function () {
    var raw = this.getProperty().realtimeBookingId;
    if (typeof raw !== 'string') return '#!';

    var v = raw.trim();
    if (!v || v === '#!') return '#!';

    if (/^https?:\/\//i.test(v)) return v;      // http(s)://...
    if (/^\/\//.test(v)) return 'https:' + v;   // //도메인/...

    // 프로토콜 없이 도메인만 들어온 경우(booking.example.com/abc)는 https 를 붙여준다
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([\/?#]|$)/i.test(v)) return 'https://' + v;

    return '#!';
  };

  // ── 이미지 헬퍼 ──────────────────────────────────────────
  // isSelected=true인 이미지를 sortOrder 순으로 반환
  BaseDataMapper.prototype.getSelectedImages = function (images) {
    if (!images || !images.length) return [];
    return images
      .filter(function (img) { return img.isSelected; })
      .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  };

  // 첫 번째 isSelected 이미지의 URL
  BaseDataMapper.prototype.getFirstSelectedImage = function (images) {
    var list = this.getSelectedImages(images);
    return list.length ? list[0].url : '';
  };

    // 데이터 변환 (스네이크 케이스 → 카멜 케이스)
  BaseDataMapper.prototype.convertToCamelCase = function (obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.convertToCamelCase(obj[key]);
        return result;
      }, {});
    }
    return obj;
  };

// ── DOM 유틸 ────────────────────────────────────────────
  BaseDataMapper.prototype.setTextIfExist = function (selector, value) {
    var el = document.querySelector(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  BaseDataMapper.prototype.setAttrIfExist = function (selector, attr, value) {
    var el = document.querySelector(selector);
    if (el && value) el.setAttribute(attr, value);
  };

  BaseDataMapper.prototype.setAllAttr = function (selector, attr, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) el.setAttribute(attr, value);
    });
  };

  // ── SEO 메타태그 업데이트 ──────────────────────────────────────
  BaseDataMapper.prototype.updateMetaTags = function (pageSEO) {
    var hp = this.getHomepage();
    var globalSEO = (hp && hp.seo) || {};
    var finalSEO = Object.assign({}, globalSEO, pageSEO || {});

    if (Object.keys(finalSEO).length > 0) {
      this.updateSEOInfo(finalSEO);
    }
  };

  BaseDataMapper.prototype.updateSEOInfo = function (seo) {
    if (!seo) return;

    // name 기반 meta 태그를 upsert (값 없으면 태그 생성 안 함 → 빈 태그 방지)
    function upsertMetaByName(name, content) {
      if (!content) return;
      var meta = document.head.querySelector('meta[name="' + name + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    }

    if (seo.title) {
      var titleEl = document.querySelector('title') || document.querySelector('title[data-page-title]');
      if (titleEl) titleEl.textContent = seo.title;
    }

    upsertMetaByName('description', seo.description);
    upsertMetaByName('keywords', seo.keywords);
    upsertMetaByName('naver-site-verification', seo.naverSiteVerification);
    upsertMetaByName('google-site-verification', seo.googleSiteVerification);
  };

  global.BaseDataMapper = BaseDataMapper;
})(window);
