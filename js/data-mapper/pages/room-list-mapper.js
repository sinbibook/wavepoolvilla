(function (global) {
  'use strict';

  function RoomListMapper() {
    BaseDataMapper.call(this);
  }
  RoomListMapper.prototype = Object.create(BaseDataMapper.prototype);
  RoomListMapper.prototype.constructor = RoomListMapper;

  RoomListMapper.prototype.mapPage = function () {
    this.mapHero();
    this.mapRoomGrid();
    this.mapPropertyName();
    this.updateMetaTags();

    // 슬라이드 DOM 주입 완료를 알림 → room-list.js에서 Swiper 초기화 (localhost/preview 공통)
    document.dispatchEvent(new CustomEvent('template:rendered', { detail: { page: 'roomList' } }));
  };

  // MAPPER: homepage.customFields.property.name → [data-property-name]
  RoomListMapper.prototype.mapPropertyName = function () {
    var name = this.getPropertyName();
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      el.textContent = name;
    });
  };

  // MAPPER: customFields.pages.roomList.sections[0].hero.images[isSelected]
  RoomListMapper.prototype.mapHero = function () {
    var pages = this.getPages();
    var hero = pages.roomList && pages.roomList.sections && pages.roomList.sections[0] && pages.roomList.sections[0].hero;
    if (!hero) return;

    var images = this.getSelectedImages(hero.images || []);
    var wrapper = document.querySelector('[data-room-list-hero-slides]');
    if (!wrapper) return;

    wrapper.innerHTML = '';

    if (!images.length) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var img = document.createElement('img');
      ImageHelpers.applyPlaceholder(img);
      img.alt = 'ROOMS';
      var tx1 = document.createElement('div');
      tx1.className = 'tx1';
      tx1.textContent = 'ROOMS';
      placeholderDiv.appendChild(img);
      placeholderDiv.appendChild(tx1);
      wrapper.appendChild(placeholderDiv);
      return;
    }

    images.forEach(function (img) {
      var div = document.createElement('div');
      div.className = 'swiper-slide';
      var imgEl = document.createElement('img');
      imgEl.src = img.url || '';
      imgEl.alt = '';
      if (!img.url) {
        ImageHelpers.applyPlaceholder(imgEl);
      }
      var tx1 = document.createElement('div');
      tx1.className = 'tx1';
      tx1.textContent = 'ROOMS';
      div.appendChild(imgEl);
      div.appendChild(tx1);
      wrapper.appendChild(div);
    });
  };

  // MAPPER: rooms[] → roomGrid 동적 생성
  RoomListMapper.prototype.mapRoomGrid = function () {
    var rooms = (this.data && this.data.rooms) || [];
    var grid = document.querySelector('[data-room-list-grid]');
    if (!grid) return;

    grid.innerHTML = '';
    rooms.forEach(function (room) {
      var thumbUrl = this.getFirstSelectedImage(
        room.images && room.images[0] && room.images[0].thumbnail || []
      );
      var card = document.createElement('div');
      card.className = 'roomCard';
      card.setAttribute('data-aos', 'fade-up');

      // 이미지 생성
      var imgEl = document.createElement('img');
      if (thumbUrl) {
        imgEl.src = thumbUrl;
      } else {
        ImageHelpers.applyPlaceholder(imgEl);
      }
      imgEl.alt = room.name || '';

      var imgOb = document.createElement('div');
      imgOb.className = 'imgOb';
      imgOb.appendChild(imgEl);

      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = room.name || '';

      var desc = document.createElement('div');
      desc.className = 'desc';
      desc.innerHTML = String(room.description || room.roomInfo || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

      var more = document.createElement('div');
      more.className = 'more';
      more.textContent = 'VIEW MORE';

      var info = document.createElement('div');
      info.className = 'info';
      info.appendChild(name);
      info.appendChild(desc);
      info.appendChild(more);

      var link = document.createElement('a');
      link.href = 'room.html?id=' + room.id;
      link.appendChild(imgOb);
      link.appendChild(info);

      card.appendChild(link);
      grid.appendChild(card);
    }, this);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.parent !== window) return;
    var mapper = new RoomListMapper();
    mapper.initialize();
    global.roomListMapperInstance = mapper;
  });

  global.RoomListMapper = RoomListMapper;
})(window);
