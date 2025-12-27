(function ($) {
  'use strict';

  /*
  |--------------------------------------------------------------------------
  | Template Name: Dewco
  | Author: Laralink
  | Version: 1.0.0
  |--------------------------------------------------------------------------
  |--------------------------------------------------------------------------
  | TABLE OF CONTENTS:
  |--------------------------------------------------------------------------
  |
  | 1. Preloader
  | 2. Mobile Menu
  | 3. Sticky Header
  | 4. Dynamic Background
  | 5. Swiper Initialize
  | 6. Modal Video
  | 7. Parallax
  | 8. Scroll Up
  | 9. Portfolio Section
  | 10. Circle Button Animation
  | 11. Dynamic contact form
  | 12. particles
  | 13. Random Portfolio
  | 14. Cursor Animation
  |
  */

  /*--------------------------------------------------------------
    Scripts initialization
  --------------------------------------------------------------*/
  $.exists = function (selector) {
    return $(selector).length > 0;
  };

  const dewcoState = (window.__dewcoState = window.__dewcoState || {});
  const dewcoPages = new Set([
    'index',
    'about',
    'contact',
    'portfolio',
    'portfolio-details',
    'stories',
    'story-details',
  ]);

  function initializeDewco(options = {}) {
    const config = Object.assign({ runPreloader: false }, options);
    sanitizeNavLinks();
    mainNav();
    stickyHeader();
    dynamicBackground();
    randomPortfolio();
    swiperInit();
    modalVideo();
    parallaxEffect();
    scrollUp();
    portfolioSection();
    circleButtonAnimation();
    contactForm();
    cursorInit();
    particles();
    if ($.exists('.wow')) {
      new WOW().init();
    }
    if (config.runPreloader) {
      preloader();
    }
  }

  $(window).on('load', function () {
    preloader();
  });

  $(function () {
    initializeDewco({ runPreloader: false });
  });

  $(window).on('scroll', function () {
    parallaxEffect();
  });

  /*--------------------------------------------------------------
    1. Preloader
  --------------------------------------------------------------*/
  function preloader() {
    const width = 100;
    const time = 1000;
    const percentageSelect = $('#cs_preloader_precent');
    const start = 0;
    const end = 100;
    const durataion = time + 0;
    $('.cs_preloader_hold_progress_bar').remove();

    $('.cs_preloader_loadbar').animate(
      {
        width: width + '%',
      },
      time,
    );

    animateValue(percentageSelect, start, end, durataion);
    function animateValue(id, start, end, duration) {
      let range = end - start;
      let current = start;
      let increment = end > start ? 1 : -1;
      let stepTime = Math.abs(Math.floor(duration / range));
      let obj = $(id);

      let timer = setInterval(function () {
        current += increment;
        $(obj).text(current);
        if (current == end) {
          clearInterval(timer);
        }
      }, stepTime);
    }

    setTimeout(function () {
      $('.cs_preloader_loadbar').append(
        '<span class="cs_preloader_hold_progress_bar"></span>',
      );
      gsap.to($('.cs_preloader_hold_progress_bar'), {
        duration: 0.3,
        force3D: true,
        width: '100%',
        delay: 0,
        ease: Power2.easeOut,
        onComplete: function () {
          $('body').waitForImages({
            finished: function () {
              gsap.to($('.cs_preloader_wrap'), {
                duration: 1,
                force3D: true,
                yPercent: -101,
                delay: 0.6,
                ease: Power2.easeInOut,
              });
              gsap.set($('.cs_preloader_wrap'), {
                visibility: 'hidden',
                delay: 1.7,
                opacity: 0,
              });
            },
            waitForAll: true,
          });
        },
      });
    }, time);
  }

  /*--------------------------------------------------------------
    2. Mobile Menu
  --------------------------------------------------------------*/
  function mainNav() {
    $('.cs_nav').each(function () {
      const $nav = $(this);
      $nav.find('.cs_menu_toggle').remove();
      $nav.append('<span class="cs_menu_toggle"><span></span></span>');
    });
    $('.menu-item-has-children').each(function () {
      const $item = $(this);
      $item.find('> .cs_munu_dropdown_toggle').remove();
      $item.append('<span class="cs_munu_dropdown_toggle"><span></span></span>');
    });
    $('.cs_menu_toggle')
      .off('click.csNavToggle')
      .on('click.csNavToggle', function () {
        $(this)
          .toggleClass('cs_toggle_active')
          .siblings('.cs_nav_list')
          .toggleClass('cs_active');
      });
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_side_header')
      .addClass('cs_has_main_nav');
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_toolbox')
      .addClass('cs_has_main_nav');
    $('.cs_munu_dropdown_toggle')
      .off('click.csNavDropdown')
      .on('click.csNavDropdown', function () {
        $(this).toggleClass('active').siblings('ul').slideToggle();
        $(this).parent().toggleClass('active');
      });

    // Mega Menu
    // $('.cs_mega_wrapper>li>a').removeAttr('href');

    // Side Nav
    $('.cs_icon_btn')
      .off('click.csSideNav')
      .on('click.csSideNav', function () {
        $('.cs_side_header').addClass('active');
      });
    $('.cs_close, .cs_side_header_overlay')
      .off('click.csSideNav')
      .on('click.csSideNav', function () {
        $('.cs_side_header').removeClass('active');
      });
    //  Menu Text Split
    $('.cs_animo_links > li > a').each(function () {
      if ($(this).find('.cs_animo_text').length) {
        return;
      }
      let xxx = $(this).html().split('').join('</span><span>');
      $(this).html(`<span class="cs_animo_text"><span>${xxx}</span></span>`);
    });
  }

  /*--------------------------------------------------------------
    3. Sticky Header
  --------------------------------------------------------------*/
  function stickyHeader() {
    var $window = $(window);
    var lastScrollTop = 0;
    var $header = $('.cs_sticky_header');
    if (!$header.length) {
      $window.off('scroll.csStickyHeader');
      return;
    }
    var headerHeight = $header.outerHeight() + 30;

    $window.off('scroll.csStickyHeader').on('scroll.csStickyHeader', function () {
      var windowTop = $window.scrollTop();

      if (windowTop >= headerHeight) {
        $header.addClass('cs_gescout_sticky');
      } else {
        $header.removeClass('cs_gescout_sticky');
        $header.removeClass('cs_gescout_show');
      }

      if ($header.hasClass('cs_gescout_sticky')) {
        if (windowTop < lastScrollTop) {
          $header.addClass('cs_gescout_show');
        } else {
          $header.removeClass('cs_gescout_show');
        }
      }

      lastScrollTop = windowTop;
    });
  }

  /*--------------------------------------------------------------
    4. Dynamic Background
  --------------------------------------------------------------*/
  function dynamicBackground() {
    $('[data-src]').each(function () {
      var src = $(this).attr('data-src');
      $(this).css({
        'background-image': 'url(' + src + ')',
      });
    });
  }

  function sanitizeNavLinks() {
    $('a[href]').each(function () {
      const href = $(this).attr('href') || '';
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http')
      ) {
        return;
      }
      const slug = href
        .replace(window.location.origin, '')
        .replace(/^\//, '')
        .split('#')[0]
        .split('?')[0]
        .replace(/\.html?$/i, '')
        .trim();

      const normalized = slug || 'index';
      const isDynamicRoute = normalized.includes('/');

      if (!dewcoPages.has(normalized) && !isDynamicRoute) {
        return;
      }

      const targetPath = normalized === 'index' ? '/' : `/${normalized}`;
      $(this).attr('href', targetPath);
    });

    $('ul').each(function () {
      if (!$(this).children().length) {
        $(this).remove();
      }
    });
  }

  /*--------------------------------------------------------------
    5. Swiper Initialize
  --------------------------------------------------------------*/
  function swiperInit() {
    function createSwiper(selector, config) {
      $(selector).each(function () {
        if (this.classList.contains('swiper-initialized')) {
          return;
        }
        const options = typeof config === 'function' ? config(this) : config;
        new Swiper(this, options);
      });
    }

    createSwiper('.cs_slider_1', {
      loop: true,
      speed: 1000,
      autoplay: true,
      pagination: {
        el: '.cs_pagination',
        clickable: true,
      },
    });

    createSwiper('.cs_slider_2', function (el) {
      return {
        loop: true,
        speed: 1000,
        autoplay: true,
        navigation: {
          nextEl: el.querySelector('.cs_swiper_next'),
          prevEl: el.querySelector('.cs_swiper_prev'),
        },
        pagination: {
          el: el.querySelector('.cs_pagination'),
          clickable: true,
        },
      };
    });

    createSwiper('.cs_slider_3', {
      loop: true,
      autoplay: true,
      speed: 1000,
      slidesPerView: 'auto',
      spaceBetween: 25,
      pagination: false,
    });

    if ($.exists('.cs_slider_4')) {
      createSwiper('.cs_slider_4', {
        loop: true,
        speed: 1000,
        effect: 'fade',
        mousewheel: true,
        navigation: {
          nextEl: '.cs_swiper_next',
          prevEl: '.cs_swiper_prev',
        },
      });
      $('.cs_swiper_next')
        .off('click.csSwiperNext')
        .on('click.csSwiperNext', function () {
          $(this).addClass('cs_animated_class');
          setTimeout(function () {
            $('.cs_swiper_next').removeClass('cs_animated_class');
          }, 1000);
        });
      $('.cs_swiper_prev')
        .off('click.csSwiperPrev')
        .on('click.csSwiperPrev', function () {
          $(this).addClass('cs_animated_class');
          setTimeout(function () {
            $('.cs_swiper_prev').removeClass('cs_animated_class');
          }, 1000);
        });
    }

    if ($.exists('.cs_slider_5')) {
      var menu = [
        '01. Color splash with motion pulse',
        '02. 3D objects for background',
        '03. Rendering car with full moon',
        '04. Round objects illustration',
        '05. Two cylinder pipe bar',
        '06. Abstract black & white motion',
      ];
      createSwiper('.cs_slider_5', {
        pagination: {
          el: '.cs_swiper_navigation',
          clickable: true,
          renderBullet: function (index, className) {
            return `<span class="${className}"><span class="cs_swiper_bullet_text">${menu[index]}</span></span>`;
          },
        },
        direction: 'vertical',
        mousewheel: true,
        loop: true,
        speed: 1000,
      });
    }

    createSwiper('.cs_slider_6', {
      loop: true,
      autoplay: false,
      mousewheel: true,
      speed: 800,
      slidesPerView: 'auto',
      spaceBetween: 25,
      pagination: {
        el: '.cs_pagination',
        clickable: true,
      },
    });
  }

  /*--------------------------------------------------------------
    6. Modal Video
  --------------------------------------------------------------*/
  function modalVideo() {
    if ($.exists('.cs_video_open')) {
      if (!$('.cs_video_popup').length) {
        $('body').append(`
          <div class="cs_video_popup">
            <div class="cs_video_popup_overlay"></div>
            <div class="cs_video_popup_content">
              <div class="cs_video_popup_layer"></div>
              <div class="cs_video_popup_container">
                <div class="cs_video_popup_align">
                  <div class="embed-responsive embed-responsive-16by9">
                    <iframe class="embed-responsive-item" src="about:blank"></iframe>
                  </div>
                </div>
                <div class="cs_video_popup_close"></div>
              </div>
            </div>
          </div>
        `);
      }
      $(document)
        .off('click.csVideoOpen')
        .on('click.csVideoOpen', '.cs_video_open', function (e) {
          e.preventDefault();
          var video = $(this).attr('href');
          video = video.split('?v=')[1].trim();
          $('.cs_video_popup_container iframe').attr(
            'src',
            `https://www.youtube.com/embed/${video}`,
          );
          $('.cs_video_popup').addClass('active');
        });
      $('.cs_video_popup_close, .cs_video_popup_layer')
        .off('click.csVideoClose')
        .on('click.csVideoClose', function (e) {
          $('.cs_video_popup').removeClass('active');
          $('html').removeClass('overflow-hidden');
          $('.cs_video_popup_container iframe').attr('src', 'about:blank');
          e.preventDefault();
        });
    }
  }

  /*--------------------------------------------------------------
    7. Parallax
  --------------------------------------------------------------*/
  function parallaxEffect() {
    $('.cs_parallax').each(function () {
      var windowScroll = $(document).scrollTop(),
        windowHeight = $(window).height(),
        barOffset = $(this).offset().top,
        barHeight = $(this).height(),
        barScrollAtZero = windowScroll - barOffset + windowHeight,
        barHeightWindowHeight = windowScroll + windowHeight,
        barScrollUp = barOffset <= windowScroll + windowHeight,
        barSctollDown = barOffset + barHeight >= windowScroll;

      if (barSctollDown && barScrollUp) {
        var calculadedHeight = barHeightWindowHeight - barOffset;
        var mediumEffectPixel = barScrollAtZero / 7;
        var miniEffectPixel = calculadedHeight / 10;
        var miniEffectPixel2 = calculadedHeight / 3;
        var miniEffectPixel3 = calculadedHeight / 6;
        var miniEffectPixel4 = barScrollAtZero / 6;
        // console.log(windowHeight / 2);
        $(this)
          .find('.cs_to_left')
          .css('transform', `translateX(-${miniEffectPixel}px)`);
        $(this)
          .find('.cs_to_right')
          .css('transform', `translateX(${miniEffectPixel}px)`);
        $(this)
          .find('.cs_to_up')
          .css('transform', `translateY(-${miniEffectPixel}px)`);
        $(this)
          .find('.cs_to_up_2')
          .css('transform', `translateY(-${miniEffectPixel2}px)`);
        $(this)
          .find('.cs_to_up_3')
          .css('transform', `translateY(-${miniEffectPixel3}px)`);
        $(this)
          .find('.cs_to_down')
          .css('transform', `translateY(${miniEffectPixel}px)`);
        $(this)
          .find('.cs_to_rotate')
          .css('transform', `rotate(${miniEffectPixel}deg)`);
        $(this)
          .find('.cs_parallax_bg')
          .css('background-position', `center -${mediumEffectPixel}px`);
      }
    });
  }

  /*--------------------------------------------------------------
    8. Scroll Up
  --------------------------------------------------------------*/
  function scrollUp() {
    $('.cs_scrollup')
      .off('click.csScrollUp')
      .on('click.csScrollUp', function (e) {
        e.preventDefault();
        $('html,body').animate(
          {
            scrollTop: 0,
          },
          0,
        );
      });
  }
  /*--------------------------------------------------------------
    9. Portfolio Section
  --------------------------------------------------------------*/
  function portfolioSection() {
    $('.cs_portfolio.cs_style_1 .cs_btn')
      .off('mouseenter.csPortfolio mouseleave.csPortfolio')
      .hover(
        function () {
          $(this)
            .parents('.cs_portfolio')
            .find('.cs_portfolio_img')
            .addClass('active');
        },
        function () {
          $(this)
            .parents('.cs_portfolio')
            .find('.cs_portfolio_img')
            .removeClass('active');
        },
      );
  }

  /*--------------------------------------------------------------
    10. Circle Button Animation
  --------------------------------------------------------------*/
  function circleButtonAnimation() {
    $('.cs_round_btn')
      .off('mouseenter.csRound mouseout.csRound')
      .on('mouseenter.csRound', function (e) {
        var x = e.pageX - $(this).offset().left;
        var y = e.pageY - $(this).offset().top;

        $(this).find('span').css({
          top: y,
          left: x,
        });
      })
      .on('mouseout.csRound', function (e) {
        var x = e.pageX - $(this).offset().left;
        var y = e.pageY - $(this).offset().top;

        $(this).find('span').css({
          top: y,
          left: x,
        });
      });

    const allBtn = gsap.utils.toArray('.cs_round_btn_wrap');
    const allBtnCirlce = gsap.utils.toArray('.cs_round_btn');

    allBtn.forEach((btn, i) => {
      $(btn)
        .off('mousemove.csRoundWrap mouseleave.csRoundWrap')
        .on('mousemove.csRoundWrap', function (e) {
          callParallax(e);
        })
        .on('mouseleave.csRoundWrap', function () {
          gsap.to(allBtnCirlce[i], 0.5, {
            x: 0,
            y: 0,
            ease: Power2.easeOut,
          });
        });

      function callParallax(e) {
        parallaxIt(e, allBtnCirlce[i], 80);
      }

      function parallaxIt(e, target, movement) {
        var $this = $(btn);
        var relX = e.pageX - $this.offset().left;
        var relY = e.pageY - $this.offset().top;

        gsap.to(target, 0.5, {
          x: ((relX - $this.width() / 2) / $this.width()) * movement,
          y: ((relY - $this.height() / 2) / $this.height()) * movement,
          ease: Power2.easeOut,
        });
      }
    });
  }

  /*--------------------------------------------------------------
    11. Dynamic contact form
  --------------------------------------------------------------*/
  function contactForm() {
    if ($.exists('#cs_form')) {
      const form = document.getElementById('cs_form');
      const result = document.getElementById('cs_result');
      if (!form || !result || form.dataset.bound === 'true') {
        return;
      }
      form.dataset.bound = 'true';
      form.addEventListener('submit', function (e) {
        const formData = new FormData(form);
        e.preventDefault();
        var object = {};
        formData.forEach((value, key) => {
          object[key] = value;
        });
        var json = JSON.stringify(object);
        result.innerHTML = 'Please wait...';

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: json,
        })
          .then(async response => {
            let json = await response.json();
            if (response.status == 200) {
              result.innerHTML = json.message;
            } else {
              console.log(response);
              result.innerHTML = json.message;
            }
          })
          .catch(error => {
            console.log(error);
            result.innerHTML = 'Something went wrong!';
          })
          .then(function () {
            form.reset();
            setTimeout(() => {
              result.style.display = 'none';
            }, 5000);
          });
      });
    }
  }

  /*--------------------------------------------------------------
    12. particles
  --------------------------------------------------------------*/
  function particles() {
    if ($.exists('#particles-js')) {
      if (typeof particlesJS !== 'function') {
        return;
      }
      $('#particles-js canvas').remove();
      if (window.pJSDom && window.pJSDom.length) {
        window.pJSDom.forEach(function (p) {
          if (
            p &&
            p.pJS &&
            p.pJS.fn &&
            p.pJS.fn.vendors &&
            p.pJS.fn.vendors.destroypJS
          ) {
            p.pJS.fn.vendors.destroypJS();
          }
        });
        window.pJSDom.length = 0;
      }
      var particalColor = $('#particles-js').attr('data-color');
      particlesJS('particles-js', {
        particles: {
          number: {
            value: 120,
            density: {
              enable: true,
              value_area: 789.1476416322727,
            },
          },
          color: {
            value: particalColor,
          },
          shape: {
            type: 'circle',
            stroke: {
              width: 0,
              color: '#000000',
            },
            polygon: {
              nb_sides: 5,
            },
            image: {
              src: 'img/github.svg',
              width: 100,
              height: 100,
            },
          },
          opacity: {
            value: 0.4,
            random: false,
            anim: {
              enable: true,
              speed: 0.6,
              opacity_min: 0,
              sync: false,
            },
          },
          size: {
            value: 2,
            random: true,
            anim: {
              enable: true,
              speed: 5,
              size_min: 0,
              sync: false,
            },
          },
          line_linked: {
            enable: false,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.2,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: {
              enable: true,
              mode: 'bubble',
            },
            onclick: {
              enable: true,
              mode: 'push',
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 83.91608391608392,
              size: 1,
              duration: 3,
              opacity: 1,
              speed: 3,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
      });
    }
  }

  /*--------------------------------------------------------------
    13. Random Portfolio
  --------------------------------------------------------------*/
  // Random Portfolio Hover Effect
  function randomPortfolio() {
    $('.cs_randomness_wrap .cs_portfolio')
      .off('mouseenter.csRandom mouseleave.csRandom')
      .hover(
        function () {
          $(this)
            .parents('.cs_randomness_wrap')
            .find('.cs_section_heading')
            .addClass('active');
        },
        function () {
          $(this)
            .parents('.cs_randomness_wrap')
            .find('.cs_section_heading')
            .removeClass('active');
        },
      );

    if ($.exists('#cs_smooth_wrapper') && typeof ScrollSmoother !== 'undefined') {
      if (dewcoState.smoother && dewcoState.smoother.kill) {
        dewcoState.smoother.kill();
      }
      let skewSetter = gsap.quickTo('.cs_portfolio_in', 'skewY'),
        clamp = gsap.utils.clamp(-5, 5);
      dewcoState.smoother = ScrollSmoother.create({
        smooth: 1.35,
        smoothTouch: false,
        normalizeScroll: false,
        ignoreMobileResize: true,
        onUpdate: self => skewSetter(clamp(self.getVelocity() / -80)),
        onStop: () => skewSetter(0),
      });
    }
  }

  /*--------------------------------------------------------------
    14. Cursor Animation
  --------------------------------------------------------------*/
  function cursorInit() {
    if (!$('.cs_cursor_lg').length) {
      $('body').append('<span class="cs_cursor_lg d"></span>');
      $('body').append('<span class="cs_cursor_sm"></span>');
    }
    const hoverTargets =
      '.cs_text_btn, .cs_site_header a, .cs_down_btn, .cs_social_btns a, .cs_menu_widget';
    $('body')
      .off('mouseenter.csCursor mouseleave.csCursor', hoverTargets)
      .on('mouseenter.csCursor', hoverTargets, function () {
        $('.cs_cursor_lg').addClass('opacity-0');
        $('.cs_cursor_sm').addClass('opacity-0');
      })
      .on('mouseleave.csCursor', hoverTargets, function () {
        $('.cs_cursor_lg').removeClass('opacity-0');
        $('.cs_cursor_sm').removeClass('opacity-0');
      });
    if (!dewcoState.cursorMoveBound) {
      document.addEventListener('mousemove', cursorMovingAnimation);
      dewcoState.cursorMoveBound = true;
    }
  }
  function cursorMovingAnimation(event) {
    try {
      const timing = gsap.timeline({
        defaults: {
          x: event.clientX,
          y: event.clientY,
        },
      });

      timing
        .to('.cs_cursor_lg', {
          ease: 'power2.out',
        })
        .to(
          '.cs_cursor_sm',
          {
            ease: 'power2.out',
          },
          '-=0.4',
        );
    } catch (err) {
      console.log(err);
    }
  }
  window.dewcoInit = initializeDewco;
})(jQuery); // End of use strict
