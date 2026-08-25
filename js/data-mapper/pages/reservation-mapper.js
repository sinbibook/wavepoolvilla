(function (global) {
  'use strict';

  function ReservationMapper() {
    BaseDataMapper.call(this);
  }
  ReservationMapper.prototype = Object.create(BaseDataMapper.prototype);
  ReservationMapper.prototype.constructor = ReservationMapper;

  ReservationMapper.prototype.mapPage = function () {
    this.mapHero();
    this.mapContent();
    this.mapRefundTable();
    this.updateMetaTags();

    // 슬라이드 DOM 주입 완료를 알림 → reservation.js에서 Swiper 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'reservation' } }));
  };

  // MAPPER: customFields.pages.reservation.sections[0].hero.title + images[isSelected]
  ReservationMapper.prototype.mapHero = function () {
    var pages = this.getPages();
    var hero = pages.reservation && pages.reservation.sections && pages.reservation.sections[0] && pages.reservation.sections[0].hero;
    if (!hero) return;

    // Hero 제목 매핑 (customFields hero.title 우선)
    var titleEl = document.querySelector('.conReservation .conTitle .tx2 .bold.spot');
    if (titleEl) {
      if (hero.title) {
        titleEl.textContent = hero.title;
      } else {
        titleEl.textContent = '펜션정보';
      }
    }

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-reservation-hero-slides]');
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
      if (img.url) {
        imgDiv.style.backgroundImage = 'url(' + img.url + ')';
        imgDiv.style.backgroundPosition = 'center';
        imgDiv.style.backgroundSize = 'cover';
      } else {
        imgDiv.style.backgroundColor = '#f0f0f0';
        imgDiv.style.backgroundImage = ImageHelpers.EMPTY_IMAGE_SVG;
        imgDiv.style.backgroundRepeat = 'no-repeat';
        imgDiv.style.backgroundPosition = 'center';
        imgDiv.style.backgroundSize = 'cover';
      }
      div.appendChild(imgDiv);
      wrapper.appendChild(div);
    });
  };

  // MAPPER: customFields.pages.reservation.about.description (Priority 1)
  // MAPPER: property.usageGuide
  ReservationMapper.prototype.mapContent = function () {
    var prop = this.getProperty();

    // 이용안내 제목: "이용안내" 하드코딩
    var usageTitleEl = document.querySelector('[data-reservation-usage-title]');
    if (usageTitleEl) {
      usageTitleEl.textContent = '이용안내';
    }

    // 이용안내 내용: property.usageGuide
    var usageEl = document.querySelector('[data-reservation-usage-content]');
    if (usageEl && prop.usageGuide) {
      usageEl.innerHTML = prop.usageGuide
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }
  };

  // MAPPER: property.refundPolicies[] → 표 동적 생성
  ReservationMapper.prototype.mapRefundTable = function () {
    var prop = this.getProperty();
    var policies = prop.refundPolicies || [];
    var container = document.querySelector('[data-reservation-refund-table]');
    if (!container || !policies.length) return;

    var html = '';
    policies.forEach(function (p) {
      var days = p.refundProcessingDays;
      var daysLabel = days === 0 ? '당일' : days + '일전';
      var refundText = p.refundRate === 100 ? '전액 환불' : p.refundRate + '% 환불';
      html += '* 이용일 ' + daysLabel + ' 취소시 ' + refundText + '<br>';
    });
    container.innerHTML = html;
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new ReservationMapper();
    mapper.initialize();
    global.reservationMapperInstance = mapper;
  });

  global.ReservationMapper = ReservationMapper;
})(window);
