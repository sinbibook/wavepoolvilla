(function () {
  'use strict';

  // Swiper 초기화 헬퍼 - 즉시 노출 (pages/[page].js의 ready()에서 사용)
  window.initSwiper = function (container, options) {
    if (container && container.length) {
      return new Swiper(container.find('.swiper')[0], options);
    }
  };

  function initCommon() {
    // AOS
    AOS.init({ once: true, duration: 2000 });

    // 모바일 헤더 메뉴
    $(document).on('click', '.header .btnMenu', function () {
      $('.header').toggleClass('active');
    });
    $(document).on('click', '.header .btnClose', function () {
      $('.header').toggleClass('active');
    });
    $(document).on('click', '.header .depth1 > span', function () {
      $(this).parent().toggleClass('on');
    });

    // 푸터 IntersectionObserver
    var $footer = $('#footer');
    if ($footer.length) {
      var footerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            $footer.addClass('footer-visible');
          } else {
            $footer.removeClass('footer-visible');
          }
        });
      }, { threshold: 0.1 });
      footerObserver.observe($footer[0]);
    }
  }

  // 타이핑 효과
  // preview에서는 renderTemplate()이 여러 번 호출되어 같은 요소에 typingEffect가
  // 중복 실행될 수 있다. 이전 실행의 타이머/옵저버를 정리하지 않으면 타이핑 루프가
  // 동시에 여러 개 돌면서 글자가 겹쳐 나온다(예: '당신' → '당당신신').
  // 따라서 새로 시작하기 전에 직전 실행을 반드시 취소한다.
  window.typingEffect = function ($element1, $element2, cursor1, cursor2, container) {
    // 직전 실행 정리: 진행 중이던 setTimeout 루프와 IntersectionObserver를 취소
    if (window._typingEffectState) {
      if (window._typingEffectState.timer1) clearTimeout(window._typingEffectState.timer1);
      if (window._typingEffectState.timer2) clearTimeout(window._typingEffectState.timer2);
      if (window._typingEffectState.observer) window._typingEffectState.observer.disconnect();
    }
    var state = window._typingEffectState = { timer1: null, timer2: null, observer: null };

    var text1 = $element1.text().trim();
    var text2 = $element2.text().trim();
    var speed = 100;
    var index1 = 0;
    var index2 = 0;

    $element1.text('');
    $element2.text('');

    function typeFirstLine() {
      if (index1 < text1.length) {
        $element1.append(text1.charAt(index1++));
        state.timer1 = setTimeout(typeFirstLine, speed);
      } else {
        cursor1.hide();
        cursor2.show();
        typeSecondLine();
      }
    }

    function typeSecondLine() {
      if (index2 < text2.length) {
        $element2.append(text2.charAt(index2++));
        state.timer2 = setTimeout(typeSecondLine, speed);
      }
    }

    var typingObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          container.css('visibility', 'visible');
          cursor1.show();
          typeFirstLine();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    state.observer = typingObserver;

    if ($element1.length) {
      typingObserver.observe($element1[0]);
    }
  };

  // 이미지 롤링
  window.cloneImages = function ($container) {
    $container.find('.img').each(function () {
      $container.append($(this).clone());
    });
  };

  window.startRolling = function ($container) {
    if ($container.length) {
      var position = 0;
      var speed = 1;

      function roll() {
        position -= speed;
        if (Math.abs(position) >= $container[0].scrollWidth / 2) {
          position = 0;
        }
        $container.css('transform', 'translateX(' + position + 'px)');
        requestAnimationFrame(roll);
      }
      roll();
    }
  };

  // headerFooterLoaded 이벤트 시 공통 초기화
  document.addEventListener('headerFooterLoaded', function () {
    initCommon();
  });

  // header/footer-loader 없이 직접 열 경우 폴백
  $(document).ready(function () {
    if (!document.querySelector('.header')) return;
    initCommon();
  });
})();
