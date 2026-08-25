(function (global) {
  'use strict';

  function DirectionsMapper() {
    BaseDataMapper.call(this);
  }
  DirectionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  DirectionsMapper.prototype.constructor = DirectionsMapper;

  // Kakao Map 설정 상수
  DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL = 5;
  DirectionsMapper.SDK_WAIT_INTERVAL = 100; // ms

  DirectionsMapper.prototype.mapPage = function () {
    this.mapHero();
    this.mapAddress();
    this.mapNotice();
    this.mapTypingSection();
    this.mapConFooterInfo();
    this.mapDaumMap();
    this.mapPropertyNames();
    this.updateMetaTags();

    // 슬라이드/텍스트 DOM 주입 완료를 알림 → directions.js에서 Swiper·타이핑 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'directions' } }));
  };

  // MAPPER: customFields.pages.directions.sections[0].hero.images[isSelected]
  DirectionsMapper.prototype.mapHero = function () {
    var data = this.data || {};
    var hero = data.homepage &&
               data.homepage.customFields &&
               data.homepage.customFields.pages &&
               data.homepage.customFields.pages.directions &&
               data.homepage.customFields.pages.directions.sections &&
               data.homepage.customFields.pages.directions.sections[0] &&
               data.homepage.customFields.pages.directions.sections[0].hero;
    if (!hero) return;

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-directions-hero-slides]');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (!images.length) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      imgDiv.style.backgroundColor = '#f0f0f0';
      imgDiv.style.backgroundImage = ImageHelpers.EMPTY_IMAGE_SVG;
      imgDiv.style.backgroundRepeat = 'no-repeat';
      imgDiv.style.backgroundPosition = 'center';
      imgDiv.style.backgroundSize = 'cover';
      placeholderDiv.appendChild(imgDiv);
      wrapper.appendChild(placeholderDiv);
      return;
    }

    images.forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'swiper-slide';
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      imgDiv.style.backgroundImage = 'url(' + img.url + ')';
      imgDiv.style.backgroundPosition = 'center';
      imgDiv.style.backgroundSize = 'cover';
      div.appendChild(imgDiv);
      wrapper.appendChild(div);
    });
  };

  // MAPPER: property.latitude, property.longitude → 카카오 지도
  DirectionsMapper.prototype.mapDaumMap = function () {
    var property = this.getProperty();
    if (!property.latitude || !property.longitude) return;

    var container = document.getElementById('kakao-map');
    if (!container) return;

    // 지도 생성 함수
    var createMap = function () {
      try {
        var options = {
          center: new kakao.maps.LatLng(property.latitude, property.longitude),
          level: DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL,
          scrollwheel: false,
          draggable: false
        };

        var map = new kakao.maps.Map(container, options);

        // 마커 표시
        var markerPosition = new kakao.maps.LatLng(property.latitude, property.longitude);
        var marker = new kakao.maps.Marker({
          position: markerPosition
        });
        marker.setMap(map);
      } catch (error) {
        console.error('Failed to create Kakao Map:', error);
      }
    };

    // SDK 로드 확인 및 재시도
    var checkSdkAndLoad = function (retryCount) {
      retryCount = retryCount || 0;
      var MAX_RETRIES = 20; // 20 * 100ms = 2초

      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(createMap);
      } else if (retryCount < MAX_RETRIES) {
        setTimeout(function () {
          checkSdkAndLoad(retryCount + 1);
        }, DirectionsMapper.SDK_WAIT_INTERVAL);
      } else {
        console.error('Failed to load Kakao Map SDK after multiple retries.');
      }
    };

    checkSdkAndLoad();
  };

  // MAPPER: property.address → con14 주소 텍스트
  DirectionsMapper.prototype.mapAddress = function () {
    var address = this.getProperty().address || '';
    var el = document.querySelector('[data-directions-address]');
    if (el) el.textContent = address;
  };

  // MAPPER: customFields.pages.directions.sections[0].notice.title + description
  DirectionsMapper.prototype.mapNotice = function () {
    var data = this.data || {};
    var notice = data.homepage &&
                 data.homepage.customFields &&
                 data.homepage.customFields.pages &&
                 data.homepage.customFields.pages.directions &&
                 data.homepage.customFields.pages.directions.sections &&
                 data.homepage.customFields.pages.directions.sections[0] &&
                 data.homepage.customFields.pages.directions.sections[0].notice;
    var noticeEl = document.querySelector('.notice');

    if (!notice || !notice.title) {
      // notice 데이터가 없으면 섹션 숨김
      if (noticeEl) noticeEl.style.display = 'none';
      return;
    }

    // notice가 있으면 섹션 표시
    if (noticeEl) noticeEl.style.display = 'block';

    // 이용안내 제목
    var titleEl = document.querySelector('[data-directions-notice-title]');
    if (titleEl && notice.title) {
      titleEl.textContent = notice.title;
    }

    // 이용안내 설명
    var descEl = document.querySelector('[data-directions-notice-description]');
    if (descEl && notice.description) {
      descEl.innerHTML = notice.description.replace(/\n/g, '<br>');
    }
  };

  // MAPPER: customFields.property.name + customFields.property.nameEn → con4 하단 숙소명 영역
  DirectionsMapper.prototype.mapConFooterInfo = function () {
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

  // TODO: 타이핑 텍스트 JSON 경로 추후 결정
  DirectionsMapper.prototype.mapTypingSection = function () {
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

  // MAPPER: homepage.customFields.property.name
  DirectionsMapper.prototype.mapPropertyNames = function () {
    var name = this.getPropertyName();
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      el.textContent = name;
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new DirectionsMapper();
    mapper.initialize();
    global.directionsMapperInstance = mapper;
  });

  global.DirectionsMapper = DirectionsMapper;
})(window);
