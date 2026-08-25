var reservationSwipers = [];

function initReservationSwipers() {
  // preview 재렌더 등으로 다시 호출될 때 이전 Swiper 인스턴스 정리(중복 방지)
  reservationSwipers.forEach(function (sw) {
    if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
  });
  reservationSwipers = [];

  // con0 히어로 (슬라이드 2장 이상일 때만 Swiper)
  if ($('.con0 .swiper-slide').length > 1) {
    reservationSwipers.push(initSwiper($('.con0'), {
      slidesPerView: 1,
      effect: 'fade',
      autoplay: { delay: 2500, disableOnInteraction: false },
      loop: true,
    }));
  }
}

// 매퍼가 슬라이드를 주입한 뒤 발생시키는 이벤트로 초기화 (localhost/preview 공통)
document.addEventListener('template:rendered', function () {
  initReservationSwipers();
});

$(document).ready(function () {
  // 이미 슬라이드가 주입된 경우(이벤트를 놓친 경우) 대비 fallback
  if ($('.con0 .swiper-slide').length) {
    initReservationSwipers();
  }

  // 아코디언 (이벤트 위임 - 1회만 바인딩)
  $(document).on('click', '.accordionHeader', function () {
    var target = $(this).data('target');
    var $content = $('#' + target);
    var $accordion = $(this).closest('.accordion');

    if ($content.hasClass('active')) {
      $content.removeClass('active');
      $accordion.removeClass('open');
    } else {
      $content.addClass('active');
      $accordion.addClass('open');
    }
  });
});
