var facilitySwipers = [];

function initFacilitySwipers() {
  // preview 재렌더 등으로 다시 호출될 때 이전 Swiper 인스턴스 정리(중복 방지)
  facilitySwipers.forEach(function (sw) {
    if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
  });
  facilitySwipers = [];

  // con0 히어로 Swiper
  if ($('.con0 .swiper-slide').length > 1) {
    facilitySwipers.push(initSwiper($('.con0'), {
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

  // con3 Special Preview Swiper
  facilitySwipers.push(initSwiper($('.con3'), {
    slidesPerView: 1,
    spaceBetween: 40,
    pagination: {
      el: $('.con3 .swiper-pagination')[0],
      clickable: true,
      renderBullet: function (index, className) {
        return '<span class="' + className + '">' + ($('.con3 .swiper-slide').eq(index).data('title') || '') + '</span>';
      },
    },
  }));
}

// 매퍼가 슬라이드를 주입한 뒤 발생시키는 이벤트로 초기화 (localhost/preview 공통)
document.addEventListener('template:rendered', function () {
  initFacilitySwipers();
});

$(document).ready(function () {
  // 이미 슬라이드가 주입된 경우(이벤트를 놓친 경우) 대비 fallback
  if ($('.con0 .swiper-slide').length || $('.con3 .swiper-slide').length) {
    initFacilitySwipers();
  }
});
