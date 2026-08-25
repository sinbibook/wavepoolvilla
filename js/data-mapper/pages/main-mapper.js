(function (global) {
  'use strict';

  function MainMapper() {
    BaseDataMapper.call(this);
  }
  MainMapper.prototype = Object.create(BaseDataMapper.prototype);
  MainMapper.prototype.constructor = MainMapper;

  MainMapper.prototype.mapPage = function () {
    this.mapHero();
    this.mapAboutTitle();
    this.mapAbout();
    this.mapGalleryRolling();
    this.mapTypingSection();
    this.mapConFooterInfo();
    this.mapPropertyNames();
    this.updateMetaTags();

    // 슬라이드/텍스트 DOM 주입 완료를 알림 → main.js에서 Swiper·타이핑·롤링 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'main' } }));
  };

  // 한글 받침 판별하여 "을/를" 선택
  MainMapper.prototype.getKoreanObjectParticle = function (word) {
    if (!word || word.length === 0) return '을';
    var lastChar = word.charCodeAt(word.length - 1);
    if (lastChar >= 0xAC00 && lastChar <= 0xD7A3) {
      var code = lastChar - 0xAC00;
      return (code % 28 !== 0) ? '을' : '를';
    }
    return '을';
  };

  // MAPPER: customFields.pages.main.sections[0].hero.images[isSelected]
  // TEXT: property.name (숙소 한글명)
  MainMapper.prototype.mapHero = function () {
    var pages = this.getPages();
    var hero = pages.main && pages.main.sections && pages.main.sections[0] && pages.main.sections[0].hero;
    if (!hero) return;

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-main-hero-slides]');
    var propertyName = this.getPropertyName();
    if (!wrapper) return;

    wrapper.innerHTML = '';

    if (!images.length) {
      // Show placeholder when no images
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

  // MAPPER: customFields.pages.main.sections[0].hero (title, description)
  // Fallback: property.name + 기본값 (ABOUT & VIEW, 쉼이 필요한 날)
  MainMapper.prototype.mapAboutTitle = function () {
    var pages = this.getPages();
    var heroData = pages.main && pages.main.sections && pages.main.sections[0] && pages.main.sections[0].hero;
    var propertyName = this.getPropertyName();
    var particle = this.getKoreanObjectParticle(propertyName);

    // tx1: 섹션 제목 (ABOUT & VIEW 또는 customField hero title)
    var tx1El = document.querySelector('.con6 .conTitle .tx1');
    if (tx1El) {
      if (heroData && heroData.title) {
        tx1El.textContent = heroData.title;
      } else {
        tx1El.textContent = 'ABOUT & VIEW';
      }
    }

    // tx2: 섹션 설명 및 property name
    var tx2El = document.querySelector('.con6 .conTitle .tx2');
    if (tx2El) {
      var description = '';
      var descriptionSpan = '';

      if (heroData && heroData.description) {
        // customField hero description 사용
        description = heroData.description;
        descriptionSpan = propertyName;
      } else {
        // 기본값 사용
        description = '쉼이 필요한 날,';
        descriptionSpan = propertyName + particle + ' 만나다';
      }

      tx2El.innerHTML = description.replace(/\n/g, '<br>') + '<br /><div class="bold spot">' + descriptionSpan + '</div>';
    }
  };

  // MAPPER: customFields.pages.main.sections[0].about[] → 동적 생성
  // about 배열의 개수에 따라 여러 개의 about 아이템 생성
  MainMapper.prototype.mapAbout = function () {
    var pages = this.getPages();
    var about = pages.main && pages.main.sections && pages.main.sections[0] && pages.main.sections[0].about;

    if (!about || !about.length) return;

    var container = document.querySelector('[data-main-about-container]');
    if (!container) return;

    container.innerHTML = '';
    var propertyName = this.getPropertyName();
    var self = this;

    about.forEach(function (item) {
      // 아이템 래퍼
      var itemDiv = document.createElement('div');
      itemDiv.className = 'about-item';

      // 이미지
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      var img = document.createElement('img');
      img.setAttribute('data-aos', 'fade-up');
      var imgUrl = self.getFirstSelectedImage(item.images || []);
      if (imgUrl) {
        img.src = imgUrl;
      } else {
        ImageHelpers.applyPlaceholder(img);
      }
      imgDiv.appendChild(img);
      itemDiv.appendChild(imgDiv);

      // 설명 텍스트
      var txDiv = document.createElement('div');
      txDiv.className = 'txWrap';
      txDiv.setAttribute('data-aos', 'fade-up');
      var t1 = document.createElement('div');
      t1.className = 't1';
      if (item.description) {
        t1.innerHTML = item.description
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
      txDiv.appendChild(t1);
      itemDiv.appendChild(txDiv);

      // 하단 정보 (바 + 숙소명)
      var bottomDiv = document.createElement('div');
      bottomDiv.className = 'bottom';
      bottomDiv.innerHTML = '<span class="bar"></span><span class="t2">' + propertyName + '</span>';
      itemDiv.appendChild(bottomDiv);

      container.appendChild(itemDiv);
    });
  };

  // MAPPER: homepage.customFields.property.images[category=property_exterior]
  MainMapper.prototype.mapGalleryRolling = function () {
    var cf = this.getCustomFields();
    var propImages = (cf.property && cf.property.images) || [];
    var exterior = propImages.filter(function (img) {
      return img.isSelected && img.category === 'property_exterior';
    }).sort(function (a, b) { return a.sortOrder - b.sortOrder; });

    var con7 = document.querySelector('[data-main-gallery]');
    if (!con7) return;

    con7.innerHTML = '';

    if (!exterior.length) {
      // Show placeholder when no images
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'img';
      var img = document.createElement('img');
      ImageHelpers.applyPlaceholder(img);
      placeholderDiv.appendChild(img);
      con7.appendChild(placeholderDiv);
      return;
    }

    exterior.forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'img';
      div.innerHTML = '<img src="' + img.url + '" alt="" />';
      con7.appendChild(div);
    });
  };

  // MAPPER: property.name → typing section (index.html과 동일)
  MainMapper.prototype.mapTypingSection = function () {
    var propertyName = this.getPropertyName();
    var typing1El = document.querySelector('#typing1');
    var typing2El = document.querySelector('#typing2');

    if (typing1El) {
      typing1El.textContent = propertyName + '에서 사랑하는 사람들과 함께';
    }

    if (typing2El) {
      typing2El.textContent = '특별하고 소중한 시간을 보내보세요';
    }
  };

  // MAPPER: customFields.property.name + customFields.property.nameEn → con4 하단 숙소명 영역
  MainMapper.prototype.mapConFooterInfo = function () {
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

  // MAPPER: homepage.customFields.property.name
  MainMapper.prototype.mapPropertyNames = function () {
    var name = this.getPropertyName();
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      el.textContent = name;
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new MainMapper();
    mapper.initialize();
    global.mainMapperInstance = mapper;
  });

  global.MainMapper = MainMapper;
})(window);
