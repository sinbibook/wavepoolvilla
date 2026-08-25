var indexSwipers = [];

function destroyIndexSwipers() {
  indexSwipers.forEach(function (sw) {
    try {
      if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
    } catch (e) {}
  });
  indexSwipers = [];
}

function initIndexSwipers() {
  // 슬라이드가 아직 주입되지 않았으면 초기화하지 않음
  if (!$('.con0 .swiper-slide').length && !$('.con1 .swiper-slide').length) {
    return;
  }

  // 재렌더링(백오피스 업데이트) 대비 기존 인스턴스 정리
  destroyIndexSwipers();

  // con0 히어로 Swiper
  if ($('.con0 .swiper-slide').length > 1) {
    indexSwipers.push(initSwiper($('.con0'), {
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
  indexSwipers.push(initSwiper($('.con1'), {
    slidesPerView: 3,
    spaceBetween: 40,
    loop: $('.con1 .swiper-slide').length > 3, // 슬라이드 부족 시 loop 비활성 (Swiper Loop 경고 방지)
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

  // con3 Special Preview Swiper
  indexSwipers.push(initSwiper($('.con3'), {
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

  // con4 타이핑 효과는 mapTypingSection()에서 직접 호출됨
}

// 매퍼가 슬라이드를 주입한 뒤 발생시키는 이벤트로 초기화 (데이터 로딩 비동기 대응)
document.addEventListener('template:rendered', function () {
  initIndexSwipers();
});

$(document).ready(function () {
  // 이미 슬라이드가 주입된 경우(이벤트를 놓친 경우) 대비
  initIndexSwipers();
});
