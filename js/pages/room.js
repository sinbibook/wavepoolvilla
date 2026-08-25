var roomSwipers = [];

function initRoomSwipers() {
  // preview 재렌더 등으로 다시 호출될 때 이전 Swiper 인스턴스 정리(중복 방지)
  roomSwipers.forEach(function (sw) {
    if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
  });
  roomSwipers = [];

  // con0 히어로 Swiper
  if ($('.con0 .swiper-slide').length > 1) {
    roomSwipers.push(initSwiper($('.con0'), {
      slidesPerView: 1,
      effect: 'fade',
      autoplay: { delay: 2500, disableOnInteraction: false },
      loop: true,
      navigation: {
        nextEl: $('.con0 .swiper-button-next')[0],
        prevEl: $('.con0 .swiper-button-prev')[0],
      },
    }));
  }

  // con1 Room Preview Swiper
  roomSwipers.push(initSwiper($('.con1'), {
    slidesPerView: 3,
    spaceBetween: 40,
    loop: true,
    speed: 1000,
    allowTouchMove: true,
    waitForTransition: false,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: {
      el: $('.con1 .swiper-pagination')[0],
      clickable: true,
      renderBullet: function (index, className) {
        return '<span class="' + className + '">' + ($('.con1 .swiper-slide').eq(index).data('title') || '') + '</span>';
      },
    },
    navigation: {
      nextEl: $('.con1 .swiper-button-next')[0],
      prevEl: $('.con1 .swiper-button-prev')[0],
    },
    on: {
      init: function () {
        $('.con1 .total').text($('.con1 .swiper-slide').length);
      },
      slideChange: function () {
        $('.con1 .number').text(this.realIndex + 1);
      },
    },
    breakpoints: {
      0:    { slidesPerView: 1, spaceBetween: 20 },
      768:  { slidesPerView: 2, spaceBetween: 30 },
      1440: { slidesPerView: 3, spaceBetween: 40 },
    },
  }));
}

// 매퍼가 슬라이드를 주입한 뒤 발생시키는 이벤트로 초기화 (localhost/preview 공통)
document.addEventListener('template:rendered', function () {
  initRoomSwipers();
});

$(document).ready(function () {
  // 이미 슬라이드가 주입된 경우(이벤트를 놓친 경우) 대비 fallback
  if ($('.con0 .swiper-slide').length || $('.con1 .swiper-slide').length) {
    initRoomSwipers();
  }
});
