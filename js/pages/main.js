var mainSwipers = [];
var mainCon7Rolled = false;

function initMainPage() {
  // preview 재렌더 등으로 다시 호출될 때 이전 Swiper 인스턴스 정리(중복 방지)
  mainSwipers.forEach(function (sw) {
    if (sw && typeof sw.destroy === 'function') sw.destroy(true, true);
  });
  mainSwipers = [];

  // con0 히어로 Swiper
  if ($('.con0 .swiper-slide').length > 1) {
    mainSwipers.push(initSwiper($('.con0'), {
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

  // con7 이미지 롤링 (복제 누적 방지: 1회만)
  var $con7 = $('.con7');
  if ($con7.length && !mainCon7Rolled) {
    cloneImages($con7);
    startRolling($con7);
    mainCon7Rolled = true;
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
  initMainPage();
});

$(document).ready(function () {
  // 이미 주입된 경우(이벤트를 놓친 경우) 대비 fallback
  if ($('.con0 .swiper-slide').length || $('#typing1').text().trim()) {
    initMainPage();
  }
});
