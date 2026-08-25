(function (global) {
  'use strict';

  var ROOM_COUNT_LABELS = {
    bedroom: '침대룸',
    bathroom: '화장실',
    livingRoom: '거실',
    ondol: '온돌룸',
    kitchen: '주방'
  };

  // roomStructures[0] + "/ " + totalRoomCount 값≥1 항목 한글 나열 (room-mapper와 동일)
  function buildRoomStructure(room) {
    if (!room) return '';
    var structures = room.roomStructures || [];
    var base = structures.length ? structures[0] : '';
    var counts = room.totalRoomCount || {};
    var labels = [];
    Object.keys(ROOM_COUNT_LABELS).forEach(function (key) {
      if (counts[key] >= 1) labels.push(ROOM_COUNT_LABELS[key]);
    });
    if (base && labels.length) return base + '/ ' + labels.join(' ');
    return base || labels.join(' ');
  }

  function LayoutMapMapper() {
    BaseDataMapper.call(this);
  }
  LayoutMapMapper.prototype = Object.create(BaseDataMapper.prototype);
  LayoutMapMapper.prototype.constructor = LayoutMapMapper;

  LayoutMapMapper.prototype.mapPage = function () {
    // enabled=false이면 404로 리다이렉트
    var pages = this.getPages();
    if (!pages.layoutMap ||
        !pages.layoutMap.sections ||
        !pages.layoutMap.sections[0] ||
        pages.layoutMap.sections[0].enabled === false) {
      window.location.href = '404.html';
      return;
    }

    this.mapPropertyName();
    this.mapHero();
    this.mapLayoutContent();
    this.mapRoomPreview();
    this.updateMetaTags();

    // 슬라이드 DOM 주입 완료를 알림 → layout-map.js에서 Swiper 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'layoutMap' } }));
  };

  // MAPPER: property.name → 숙소명
  LayoutMapMapper.prototype.mapPropertyName = function () {
    var propertyName = this.getPropertyName();
    var propertyNameEl = document.querySelector('[data-property-name]');
    if (propertyNameEl) {
      propertyNameEl.textContent = propertyName;
    }
  };

  // MAPPER: customFields.pages.layoutMap.sections[0].hero.images[isSelected]
  LayoutMapMapper.prototype.mapHero = function () {
    var pages = this.getPages();
    var hero = pages.layoutMap && pages.layoutMap.sections && pages.layoutMap.sections[0] && pages.layoutMap.sections[0].hero;
    if (!hero) return;

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-layout-map-hero-slides]');

    if (wrapper) {
      wrapper.innerHTML = '';
      if (images.length) {
        images.forEach(function (img) {
          var div = document.createElement('div');
          div.className = 'swiper-slide';
          div.innerHTML = '<img src="' + img.url + '" alt="" /><div class="tx1">배치도</div>';
          wrapper.appendChild(div);
        });
      } else {
        // Placeholder when no images
        var placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'swiper-slide';
        var img = document.createElement('img');
        ImageHelpers.applyPlaceholder(img);
        img.alt = 'Layout Map Hero';
        var titleDiv = document.createElement('div');
        titleDiv.className = 'tx1';
        titleDiv.textContent = '배치도';
        placeholderDiv.appendChild(img);
        placeholderDiv.appendChild(titleDiv);
        wrapper.appendChild(placeholderDiv);
      }
    }

    // 또는 단일 이미지 요소
    var heroImg = document.querySelector('[data-layout-map-hero-image]');
    if (heroImg) {
      if (images.length) {
        heroImg.style.backgroundImage = 'url(' + images[0].url + ')';
        heroImg.style.backgroundPosition = 'center';
        heroImg.style.backgroundSize = 'cover';
        heroImg.style.backgroundRepeat = 'no-repeat';
      } else {
        // background-image placeholder
        heroImg.style.backgroundColor = '#f0f0f0';
        heroImg.style.backgroundImage = ImageHelpers.EMPTY_IMAGE_SVG;
        heroImg.style.backgroundRepeat = 'no-repeat';
        heroImg.style.backgroundPosition = 'center';
        heroImg.style.backgroundSize = 'cover';
      }
    }

    // hero.title → tx1 (값 우선, 없으면 fallback 'ROOM PREVIEW') — HTML 정적 텍스트 대신 JS fallback
    var heroTitleEl = document.querySelector('[data-layout-map-hero-title]');
    if (heroTitleEl) {
      heroTitleEl.textContent = (hero.title && hero.title.trim()) ? hero.title : 'ROOM PREVIEW';
    }

    // hero.description → tx2 (값 우선, 없으면 fallback '객실 배치도') — HTML 정적 텍스트 대신 JS fallback
    var heroDescEl = document.querySelector('[data-layout-map-hero-description]');
    if (heroDescEl) {
      if (hero.description && hero.description.trim()) {
        heroDescEl.innerHTML = hero.description
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      } else {
        heroDescEl.textContent = '객실 배치도';
      }
    }
  };

  // MAPPER: customFields.pages.layoutMap.sections[0].about (이미지 + 설명)
  LayoutMapMapper.prototype.mapLayoutContent = function () {
    var pages = this.getPages();
    var about = pages.layoutMap && pages.layoutMap.sections && pages.layoutMap.sections[0] && pages.layoutMap.sections[0].about;
    if (!about) return;

    // 제목
    var titleEl = document.querySelector('[data-layout-map-about-title]');
    if (titleEl && about.title) titleEl.textContent = about.title;

    // 설명
    var descEl = document.querySelector('[data-layout-map-about-description]');
    if (descEl && about.description) {
      descEl.innerHTML = about.description
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    // 이미지들 (각 이미지마다 설명)
    if (about.images && about.images.length) {
      about.images.forEach(function (image, index) {
        var imgEl = document.querySelector('[data-layout-map-image-' + index + ']');
        if (imgEl) {
          if (image.url) {
            imgEl.src = image.url;
          } else {
            ImageHelpers.applyPlaceholder(imgEl);
          }
        }
      });
    } else {
      // Placeholder when no images
      for (var i = 0; i < 2; i++) {
        var imgEl = document.querySelector('[data-layout-map-image-' + i + ']');
        if (imgEl) {
          ImageHelpers.applyPlaceholder(imgEl);
        }
      }
    }
  };

  // MAPPER: customFields.roomtypes[] (+ rooms[] id매칭) → [data-index-room-slides]
  LayoutMapMapper.prototype.mapRoomPreview = function () {
    var roomtypes = this.getRoomtypes();
    var rooms = (this.data && this.data.rooms) || [];
    var wrapper = document.querySelector('[data-index-room-slides]');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    var self = this;
    roomtypes.forEach(function (rt) {
      if (!rt.name || !rt.name.trim()) return;
      var thumbUrl = self.getFirstSelectedImage(
        (rt.images || []).filter(function (img) {
          return img.category === 'roomtype_thumbnail';
        })
      );
      var matched = rooms.filter(function (r) {
        return r.id === rt.id;
      })[0];

      var div = document.createElement('div');
      div.className = 'swiper-slide';
      div.setAttribute('data-title', rt.name || '');

      var img = document.createElement('img');
      if (thumbUrl) {
        img.src = thumbUrl;
      } else {
        ImageHelpers.applyPlaceholder(img);
      }
      img.alt = rt.name || '';

      var a = document.createElement('a');
      a.href = 'room.html?id=' + rt.id;
      a.className = 'tx';
      a.innerHTML =
        '<div class="tx1">' + (rt.name || '') + '</div>' +
        '<div class="tx2">' + buildRoomStructure(matched) + '</div>' +
        '<div class="more"></div>';

      div.appendChild(img);
      div.appendChild(a);
      wrapper.appendChild(div);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new LayoutMapMapper();
    mapper.initialize();
    global.layoutMapMapperInstance = mapper;
  });

  global.LayoutMapMapper = LayoutMapMapper;
})(window);
