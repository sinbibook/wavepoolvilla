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

  function IndexMapper() {
    BaseDataMapper.call(this);
  }
  IndexMapper.prototype = Object.create(BaseDataMapper.prototype);
  IndexMapper.prototype.constructor = IndexMapper;

  IndexMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapRoomPreview();
    this.mapSpecialPreview();
    this.mapTypingSection();
    this.mapConFooterInfo();
    this.mapDirectionsImages();
    this.mapDirectionsPreview();
    this.mapPropertyNames();
    this.updateMetaTags();

    // 슬라이드 DOM 주입 완료를 알림 → index.js에서 Swiper 초기화
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'index' } }));
  };

  // MAPPER: customFields.pages.index.sections[0].hero.images[isSelected]
  // TEXT: property.name
  IndexMapper.prototype.mapHeroSlides = function () {
    var pages = this.getPages();
    var hero = pages.index && pages.index.sections && pages.index.sections[0] && pages.index.sections[0].hero;
    if (!hero) return;

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-index-hero-slides]');
    var propertyName = this.getPropertyName();
    if (!wrapper) return;

    wrapper.innerHTML = '';

    if (!images.length) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var img = document.createElement('img');
      ImageHelpers.applyPlaceholder(img);
      img.alt = propertyName || 'Hero Image';
      var titleDiv = document.createElement('div');
      titleDiv.className = 'tx1';
      titleDiv.textContent = propertyName || '';
      placeholderDiv.appendChild(img);
      placeholderDiv.appendChild(titleDiv);
      wrapper.appendChild(placeholderDiv);
      return;
    }

    images.forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'swiper-slide';
      div.innerHTML = '<img src="' + img.url + '" alt="" /><div class="tx1">' + propertyName + '</div>';
      wrapper.appendChild(div);
    });
  };

  // MAPPER: customFields.roomtypes[] (+ rooms[] id매칭) → [data-index-room-slides]
  IndexMapper.prototype.mapRoomPreview = function () {
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

  // MAPPER: property.facilities[].images[isSelected][0].url + name
  IndexMapper.prototype.mapSpecialPreview = function () {
    var facilities = this.getProperty().facilities || [];
    var wrapper = document.querySelector('[data-index-facility-slides]');
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
        imgWrap.style.backgroundColor = '#f0f0f0';
        imgWrap.style.display = 'flex';
        imgWrap.style.alignItems = 'center';
        imgWrap.style.justifyContent = 'center';
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

    facilities.forEach(function (f) {
      var imgUrl = this.getFirstSelectedImage(f.images || []);
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
    }, this);
  };

  // MAPPER: property.name → typing1 (타이핑 섹션)
  // MAPPER: customFields.pages.index.sections[0].closing.title + description
  // Fallback: propertyName + hardcoding
  IndexMapper.prototype.mapTypingSection = function () {
    var pages = this.getPages();
    var closing = pages.index && pages.index.sections && pages.index.sections[0] && pages.index.sections[0].closing;
    var propertyName = this.getPropertyName();
    var typing1El = document.querySelector('#typing1');
    var typing2El = document.querySelector('#typing2');

    // 이전 타이핑 중복 방지: 요소를 완전히 비우기
    if (typing1El) typing1El.innerHTML = '';
    if (typing2El) typing2El.innerHTML = '';

    // typing1: closing.title 또는 propertyName + '에서 사랑하는 사람들과 함께'
    if (typing1El) {
      if (closing && closing.title) {
        typing1El.textContent = closing.title;
      } else {
        typing1El.textContent = propertyName + '에서 사랑하는 사람들과 함께';
      }
    }

    // typing2: closing.description 또는 '특별하고 소중한 시간을 보내보세요'
    if (typing2El) {
      if (closing && closing.description) {
        typing2El.textContent = closing.description;
      } else {
        typing2El.textContent = '특별하고 소중한 시간을 보내보세요';
      }
    }

    // 타이핑 효과 실행
    if (window.typingEffect) {
      window.typingEffect(
        jQuery('#typing1'),
        jQuery('#typing2'),
        jQuery('#cursor1'),
        jQuery('#cursor2'),
        jQuery('.typing-container')
      );
    }
  };

  // MAPPER: customFields.pages.index.sections[0].signature.images[isSelected] → con5 이미지
  IndexMapper.prototype.mapDirectionsImages = function () {
    var pages = this.getPages();
    var signature = pages.index && pages.index.sections && pages.index.sections[0] && pages.index.sections[0].signature;
    if (!signature) return;

    var selectedImages = this.getSelectedImages(signature.images || []);
    var imgWrap = document.querySelector('.con5 .imgWrap');
    if (!imgWrap) return;

    imgWrap.innerHTML = '';

    // selectedImages가 없으면 2개의 placeholder 생성
    if (!selectedImages || !selectedImages.length) {
      for (var i = 0; i < 2; i++) {
        var img = document.createElement('img');
        ImageHelpers.applyPlaceholder(img);
        img.alt = '';
        img.setAttribute('data-aos', 'fade-up');
        imgWrap.appendChild(img);
      }
      return;
    }

    // selectedImages가 있으면 이미지 생성 (최대 2개)
    selectedImages.slice(0, 2).forEach(function (imgData, index) {
      var img = document.createElement('img');
      if (imgData && imgData.url) {
        img.src = imgData.url;
      } else {
        ImageHelpers.applyPlaceholder(img);
      }
      img.alt = '';
      img.setAttribute('data-aos', 'fade-up');
      imgWrap.appendChild(img);
    });
  };

  // MAPPER: property.address → con5 주소 텍스트
  IndexMapper.prototype.mapDirectionsPreview = function () {
    var address = this.getProperty().address || '';
    var el = document.querySelector('[data-directions-address]');
    if (el) el.textContent = address;
  };

  // MAPPER: customFields.property.name + customFields.property.nameEn → con4 하단 숙소명 영역
  IndexMapper.prototype.mapConFooterInfo = function () {
    var nameKr = this.getPropertyName();
    var nameEn = this.getPropertyNameEn();

    // t1: 숙소 한글명
    var t1El = document.querySelector('.con4 .t0 .t1');
    if (t1El) {
      t1El.textContent = nameKr;
    }

    // t2: "Welcome To [숙소 영문명]"
    var t2El = document.querySelector('.con4 .t0 .t2');
    if (t2El) {
      t2El.textContent = 'Welcome To ' + nameEn;
    }
  };

  // MAPPER: homepage.customFields.property.name → 숙소명 표기 요소들
  IndexMapper.prototype.mapPropertyNames = function () {
    var name = this.getPropertyName();
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      el.textContent = name;
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new IndexMapper();
    mapper.initialize();
    global.indexMapperInstance = mapper;
  });

  global.IndexMapper = IndexMapper;
})(window);
