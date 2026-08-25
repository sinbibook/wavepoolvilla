(function (global) {
  'use strict';

  function FacilityMapper() {
    BaseDataMapper.call(this);
  }
  FacilityMapper.prototype = Object.create(BaseDataMapper.prototype);
  FacilityMapper.prototype.constructor = FacilityMapper;

  FacilityMapper.prototype.mapPage = function () {
    this.mapHero();
    this.mapFacilityInfo();
    this.mapFacilityImages();
    this.mapSpecialPreview();
    this.updateMetaTags();

    // 슬라이드 DOM 주입 완료를 알림 → facility.js에서 Swiper 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'facility' } }));
  };

  // URL param ?id= 로 시설 선택, 없으면 첫 번째 시설
  FacilityMapper.prototype.getCurrentFacility = function () {
    var facilities = this.getProperty().facilities || [];
    var id = new URLSearchParams(window.location.search).get('id');
    if (id) return facilities.find(function (f) { return f.id === id; }) || facilities[0];
    return facilities[0];
  };

  // MAPPER: property.facilities[current].images[isSelected][0].url → con0 히어로
  FacilityMapper.prototype.mapHero = function () {
    var f = this.getCurrentFacility();
    if (!f) return;

    var wrapper = document.querySelector('[data-facility-hero-slides]');
    if (!wrapper) return;

    var images = this.getSelectedImages(f.images || []);
    wrapper.innerHTML = '';

    if (!images.length) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var img = document.createElement('img');
      ImageHelpers.applyPlaceholder(img);
      img.alt = f.name || 'Facility';
      var titleDiv = document.createElement('div');
      titleDiv.className = 'tx1';
      titleDiv.textContent = f.name || '';
      placeholderDiv.appendChild(img);
      placeholderDiv.appendChild(titleDiv);
      wrapper.appendChild(placeholderDiv);
      return;
    }

    images.slice(0, 3).forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'swiper-slide';

      var imgEl = document.createElement('img');
      if (img.url) {
        imgEl.src = img.url;
      } else {
        ImageHelpers.applyPlaceholder(imgEl);
      }
      imgEl.alt = '';

      var titleDiv = document.createElement('div');
      titleDiv.className = 'tx1';
      titleDiv.textContent = f.name || '';

      div.appendChild(imgEl);
      div.appendChild(titleDiv);
      wrapper.appendChild(div);
    });
  };

  // MAPPER: customFields.pages.facility[현재 id].sections[0].hero.title
  FacilityMapper.prototype.getFacilityHeroTitle = function (f) {
    if (!f) return '';
    var facPages = this.getPages().facility;
    if (!Array.isArray(facPages)) return '';
    var entry = facPages.find(function (p) { return p.id === f.id; });
    var hero = entry && entry.sections && entry.sections[0] && entry.sections[0].hero;
    return (hero && hero.title) ? hero.title : '';
  };

  // MAPPER: property.facilities[current].name → con11 타이틀
  // MAPPER: customFields hero.title 우선 → 없으면 property.facilities[current].usageGuide → con11 설명 텍스트
  FacilityMapper.prototype.mapFacilityInfo = function () {
    var f = this.getCurrentFacility();
    if (!f) return;

    var nameEl = document.querySelector('[data-facility-name]');
    if (nameEl) nameEl.textContent = f.name || '';

    // hero title(customFields) 우선 → 입력 안 했으면 property usageGuide fallback (빈 값도 항상 반영)
    var heroTitle = this.getFacilityHeroTitle(f);
    var usageText = (heroTitle && heroTitle.trim()) ? heroTitle : (f.usageGuide || '');
    var usageEl = document.querySelector('[data-facility-usage]');
    if (usageEl) {
      usageEl.innerHTML = usageText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }
  };

  // MAPPER: property.facilities[current].images[isSelected][0~2] → con12 이미지 3장
  FacilityMapper.prototype.mapFacilityImages = function () {
    var f = this.getCurrentFacility();
    if (!f) return;

    var images = this.getSelectedImages(f.images || []);
    var selectors = [
      '[data-facility-image-0]',
      '[data-facility-image-1]',
      '[data-facility-image-2]',
    ];

    selectors.forEach(function (selector, i) {
      var el = document.querySelector(selector);
      if (el) {
        if (images[i] && images[i].url) {
          el.src = images[i].url;
          el.classList.remove('empty-image-placeholder');
        } else {
          ImageHelpers.applyPlaceholder(el);
        }
      }
    });

    // MAPPER: property.name → con12 content text
    var propertyName = this.getPropertyName();
    document.querySelectorAll('[data-facility-content-text]').forEach(function (el) {
      el.textContent = propertyName;
    });
  };

  // MAPPER: property.facilities[].images[isSelected][0] + name → con3 슬라이더
  FacilityMapper.prototype.mapSpecialPreview = function () {
    var facilities = this.getProperty().facilities || [];
    var wrapper = document.querySelector('[data-facility-preview-slides]');
    if (!wrapper) return;

    wrapper.innerHTML = '';

    // facilities가 없으면 placeholder 표시
    if (!facilities.length) {
      for (var i = 0; i < 6; i++) {
        var div = document.createElement('div');
        div.className = 'swiper-slide';
        div.setAttribute('data-title', '');

        var a = document.createElement('a');
        a.href = '#';

        var imgWrap = document.createElement('div');
        imgWrap.className = 'img';
        imgWrap.style.display = 'flex';
        imgWrap.style.alignItems = 'center';
        imgWrap.style.justifyContent = 'center';
        imgWrap.style.backgroundColor = '#f0f0f0';
        imgWrap.style.backgroundImage = ImageHelpers.EMPTY_IMAGE_SVG;
        imgWrap.style.backgroundRepeat = 'no-repeat';
        imgWrap.style.backgroundPosition = 'center';
        imgWrap.style.backgroundSize = 'cover';

        var noImageText = document.createElement('div');
        noImageText.textContent = 'No Image';
        noImageText.style.fontSize = '24px';
        noImageText.style.color = '#999';
        noImageText.style.fontFamily = 'sans-serif';
        noImageText.style.pointerEvents = 'none';
        imgWrap.appendChild(noImageText);

        var more = document.createElement('div');
        more.className = 'more';

        a.appendChild(imgWrap);
        a.appendChild(more);
        div.appendChild(a);
        wrapper.appendChild(div);
      }
      return;
    }

    var self = this;
    facilities.forEach(function (f) {
      var imgUrl = self.getFirstSelectedImage(f.images || []);
      var div = document.createElement('div');
      div.className = 'swiper-slide';
      div.setAttribute('data-title', f.name || '');

      var a = document.createElement('a');
      a.href = 'facility.html?id=' + f.id;

      var imgWrap = document.createElement('div');
      imgWrap.className = 'img';
      imgWrap.style.display = 'flex';
      imgWrap.style.alignItems = 'center';
      imgWrap.style.justifyContent = 'center';

      if (imgUrl) {
        imgWrap.style.backgroundImage = 'url(' + imgUrl + ')';
        imgWrap.style.backgroundPosition = 'center';
        imgWrap.style.backgroundSize = 'cover';
      } else {
        imgWrap.style.backgroundColor = '#f0f0f0';
        imgWrap.style.backgroundImage = ImageHelpers.EMPTY_IMAGE_SVG;
        imgWrap.style.backgroundRepeat = 'no-repeat';
        imgWrap.style.backgroundPosition = 'center';
        imgWrap.style.backgroundSize = 'cover';

        var noImageText = document.createElement('div');
        noImageText.textContent = 'No Image';
        noImageText.style.fontSize = '24px';
        noImageText.style.color = '#999';
        noImageText.style.fontFamily = 'sans-serif';
        noImageText.style.pointerEvents = 'none';
        imgWrap.appendChild(noImageText);
      }

      var more = document.createElement('div');
      more.className = 'more';

      a.appendChild(imgWrap);
      a.appendChild(more);
      div.appendChild(a);
      wrapper.appendChild(div);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new FacilityMapper();
    mapper.initialize();
    global.facilityMapperInstance = mapper;
  });

  global.FacilityMapper = FacilityMapper;
})(window);
