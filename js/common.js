(function () {
  'use strict';

  // Swiper 초기화 헬퍼 - 즉시 노출 (pages/[page].js의 ready()에서 사용)
  window.initSwiper = function (container, options) {
    if (container && container.length) {
      return new Swiper(container.find('.swiper')[0], options);
    }
  };

  // Room Preview Swiper 옵션 (index / room / layout-map 공통)
  // ⚠️ PC 는 slidesPerView 3 유지 — 정사각형 카드라 2로 하면 카드(700px)가 왼쪽 영역보다 커져 위가 잘린다.
  //    객실이 3개 이하면 Swiper 가 loop 를 끄고 잠가 탭·화살표·자동재생이 멈추므로,
  //    원본 세트를 복제해 loop 최소 개수(4)를 채우고 탭/번호는 원본 개수 기준으로만 표시한다.
  window.roomPreviewSwiperOptions = function ($con) {
    var $wrapper = $con.find('.swiper-wrapper');
    $wrapper.children('.is-loop-clone').remove();
    var $origin = $wrapper.children('.swiper-slide');
    var count = $origin.length;
    var titles = $origin.map(function () { return $(this).data('title') || ''; }).get();
    if (count > 1) {
      while ($wrapper.children('.swiper-slide').length < 4) {
        $origin.clone().addClass('is-loop-clone').appendTo($wrapper);
      }
    }

    function syncBullets(swiper) {
      if (!count || !swiper.pagination || !swiper.pagination.bullets) return;
      var activeClass = swiper.params.pagination.bulletActiveClass;
      var active = swiper.realIndex % count;
      swiper.pagination.bullets.forEach(function (bullet, i) {
        bullet.classList.toggle(activeClass, i === active);
      });
    }

    return {
      slidesPerView: 3,
      spaceBetween: 40,
      loop: count > 1,
      speed: 1000,
      allowTouchMove: true,
      waitForTransition: false,
      autoplay: { delay: 3000, disableOnInteraction: false },
      pagination: {
        el: $con.find('.swiper-pagination')[0],
        clickable: true,
        renderBullet: function (index, className) {
          // 복제 슬라이드 몫의 탭은 숨김
          if (index >= count) return '<span class="' + className + '" style="display:none"></span>';
          return '<span class="' + className + '">' + titles[index] + '</span>';
        },
      },
      navigation: {
        nextEl: $con.find('.swiper-button-next')[0],
        prevEl: $con.find('.swiper-button-prev')[0],
      },
      on: {
        init: function () {
          $con.find('.total').text(count);
          $con.find('.number').text(count ? (this.realIndex % count) + 1 : '');
          syncBullets(this);
        },
        slideChange: function () {
          $con.find('.number').text((this.realIndex % count) + 1);
        },
        paginationUpdate: function () {
          syncBullets(this);
        },
      },
      breakpoints: {
        0:    { slidesPerView: 1, spaceBetween: 20 },
        768:  { slidesPerView: 2, spaceBetween: 30 },
        1440: { slidesPerView: 3, spaceBetween: 40 },
      },
    };
  };

  function initCommon() {
    // AOS
    // ⚠️ 404.html 은 aos.js 를 싣지 않는다(오류 페이지라 등장 애니메이션이 불필요).
    //    존재 검사 없이 호출하면 ReferenceError 로 이 아래 전체가 중단된다.
    //    layout-map / nearby-attractions 가 비노출이면 404 로 리다이렉트되므로
    //    그 두 페이지에서도 같은 에러가 났다.
    if (window.AOS) AOS.init({ once: true, duration: 2000 });

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
