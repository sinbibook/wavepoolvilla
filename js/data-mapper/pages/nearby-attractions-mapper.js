(function (global) {
  'use strict';

  function NearbyAttractionsMapper() {
    BaseDataMapper.call(this);
  }
  NearbyAttractionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  NearbyAttractionsMapper.prototype.constructor = NearbyAttractionsMapper;

  NearbyAttractionsMapper.prototype.mapPage = function () {
    // enabled=false이면 404로 리다이렉트
    var pages = this.getPages();
    if (!pages.nearbyAttractions ||
        !pages.nearbyAttractions.sections ||
        !pages.nearbyAttractions.sections[0] ||
        pages.nearbyAttractions.sections[0].enabled === false) {
      window.location.href = '404.html';
      return;
    }

    this.mapHero();
    this.mapHeroTitle();
    this.mapAttractionCards();
    this.updateMetaTags();
  };

  NearbyAttractionsMapper.prototype.mapHero = function () {
    var pages = this.getPages();
    var page = pages.nearbyAttractions;
    if (!page || !page.sections || !page.sections[0]) return;

    var hero = page.sections[0].hero;
    if (!hero) return;

    var wrapper = document.querySelector('[data-nearby-attractions-hero-slides]');
    if (!wrapper) return;

    var images = this.getSelectedImages(hero.images || []);
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

  // MAPPER: customFields.pages.nearbyAttractions.sections[0].hero (title, description)
  // Fallback: "TRAVL" + "여행하기 좋은도시"
  NearbyAttractionsMapper.prototype.mapHeroTitle = function () {
    var pages = this.getPages();
    var page = pages.nearbyAttractions;
    if (!page || !page.sections || !page.sections[0]) return;

    var hero = page.sections[0].hero;
    if (!hero) return;

    // Hero 제목: hero.title 우선, "TRAVL" fallback
    var titleEl = document.querySelector('[data-nearby-attractions-hero-title]');
    if (titleEl) {
      if (hero.title && hero.title.trim()) {
        titleEl.textContent = hero.title;
      } else {
        titleEl.textContent = 'TRAVL';
      }
    }

    // Hero 설명: hero.description 우선, "여행하기 좋은도시" fallback
    var descEl = document.querySelector('[data-nearby-attractions-hero-description]');
    if (descEl) {
      if (hero.description && hero.description.trim()) {
        descEl.innerHTML = hero.description
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      } else {
        descEl.textContent = '여행하기 좋은도시';
      }
    }
  };

  NearbyAttractionsMapper.prototype.mapAttractionCards = function () {
    var pages = this.getPages();
    var page = pages.nearbyAttractions;
    if (!page || !page.sections || !page.sections[0]) return;

    var about = page.sections[0].about;
    if (!about || !about.length) return;

    var itemWrap = document.querySelector('[data-nearby-attractions-items]');
    if (!itemWrap) return;

    itemWrap.innerHTML = '';
    about.forEach(function (item, itemIndex) {
      var div = document.createElement('div');
      div.className = 'item';
      div.setAttribute('data-aos', 'fade-up');

      // Get first selected image (또는 첫 번째 이미지)
      var images = item.images || [];
      if (!images.length) return; // 이미지가 없으면 스킵

      var selectedImage = images.find(function (img) { return img && img.isSelected; }) || images[0];
      var selectedImageIndex = images.findIndex(function (img) { return img && img.isSelected; });
      if (selectedImageIndex === -1) selectedImageIndex = 0;

      // Create img element with placeholder handling
      var img = document.createElement('img');
      if (selectedImage && selectedImage.url) {
        img.src = selectedImage.url;
        img.alt = item.title || '';
      } else {
        ImageHelpers.applyPlaceholder(img);
        img.alt = item.title || '';
      }

      div.appendChild(img);

      // tx1: title + bar + distance (image description)
      var tx1 = document.createElement('div');
      tx1.className = 'tx1';

      var titleSpan = document.createElement('span');
      titleSpan.className = 'bold';
      titleSpan.textContent = item.title || '';

      tx1.appendChild(titleSpan);

      // distance info가 있으면 bar + distance 추가
      var distanceInfo = selectedImage?.description || '';

      if (distanceInfo && distanceInfo.trim()) {
        var barSpan = document.createElement('span');
        barSpan.className = 'bar';
        barSpan.textContent = '｜';
        tx1.appendChild(barSpan);

        var distanceSpan = document.createElement('span');
        distanceSpan.textContent = distanceInfo;
        tx1.appendChild(distanceSpan);
      }

      // tx2: item description
      var tx2 = document.createElement('div');
      tx2.className = 'tx2';
      tx2.innerHTML = String(item.description || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

      div.appendChild(tx1);
      div.appendChild(tx2);
      itemWrap.appendChild(div);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new NearbyAttractionsMapper();
    mapper.initialize();
    global.nearbyAttractionsMapperInstance = mapper;
  });

  global.NearbyAttractionsMapper = NearbyAttractionsMapper;
})(window);
