var directionsSwipers = [];

function initDirectionsPage() {
  // preview 재렌더 등으로 다시 호출될 때 이전 Swiper 인스턴스 정리(중복 방지)
  directionsSwipers.forEach(function (sw) {
    if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
  });
  directionsSwipers = [];

  // con0 히어로 (슬라이드 2장 이상일 때만 Swiper)
  if ($('.con0 .swiper-slide').length > 1) {
    directionsSwipers.push(initSwiper($('.con0'), {
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

  // con4 타이핑 효과 (typingEffect는 idempotent - 재호출 안전)
  typingEffect(
    $('#typing1'), $('#typing2'),
    $('#cursor1'), $('#cursor2'),
    $('.typing-container')
  );
}

// 매퍼가 슬라이드/텍스트를 주입한 뒤 발생시키는 이벤트로 초기화 (localhost/preview 공통)
document.addEventListener('template:rendered', function () {
  initDirectionsPage();
});

$(document).ready(function () {
  // 이미 주입된 경우(이벤트를 놓친 경우) 대비 fallback
  if ($('.con0 .swiper-slide').length || $('#typing1').text().trim()) {
    initDirectionsPage();
  }
});
