/*
PowerPulse — template behaviors (based on TemplateMo 622 Clearwave)
Defensive: each feature only wires up if its elements exist in the page.
*/

(function () {
  /* ── Smooth Scroll (JS-driven, overrides CSS) ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  /* ── NAV SCROLL ── */
  var nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── MOBILE MENU ── */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    function openMobileMenu() {
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMobileMenu(); });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMobileMenu(); });
    });
  }

  /* ── SCROLL REVEAL ── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── STAT COUNTERS ── */
  function animateCounter(el) {
    var target = parseFloat(el.dataset.target);
    var decimal = el.dataset.decimal;
    var duration = 1800;
    var start = performance.now();
    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      var val = eased * target;
      el.textContent = decimal ? val.toFixed(1) : Math.floor(val);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = decimal ? target.toFixed(1) : target;
    }
    requestAnimationFrame(step);
  }
  var statsGrids = document.querySelectorAll('.stats-grid');
  if ('IntersectionObserver' in window && statsGrids.length) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stat-num').forEach(animateCounter);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statsGrids.forEach(function (el) { statObserver.observe(el); });
  } else {
    statsGrids.forEach(function (grid) {
      grid.querySelectorAll('.stat-num').forEach(function (el) {
        var target = parseFloat(el.dataset.target);
        el.textContent = el.dataset.decimal ? target.toFixed(1) : target;
      });
    });
  }

  /* ── 3D CAROUSEL (landing page only) ── */
  var carouselStage = document.getElementById('carouselStage');
  var carouselTrack = document.getElementById('carouselTrack');
  var carouselPrev = document.getElementById('carouselPrev');
  var carouselNext = document.getElementById('carouselNext');
  var carouselDots = document.getElementById('carouselDots');
  var zoomPips = document.getElementById('zoomPips');
  var zoomIn = document.getElementById('zoomIn');
  var zoomOut = document.getElementById('zoomOut');

  if (carouselStage && carouselTrack && carouselPrev && carouselNext && carouselDots && zoomPips && zoomIn && zoomOut) {
    var cards = Array.from(document.querySelectorAll('.phone-card'));
    var totalCards = cards.length;
    var currentCenter = 2;
    var autoTimer = null;
    var isAnimating = false;

    var zoomSteps = [
      { pw: 160, g1: 178, g2: 316, gh: 450, sh: 420 },
      { pw: 200, g1: 222, g2: 395, gh: 560, sh: 520 },
      { pw: 240, g1: 266, g2: 474, gh: 670, sh: 620 },
      { pw: 280, g1: 310, g2: 553, gh: 780, sh: 720 },
      { pw: 320, g1: 354, g2: 632, gh: 890, sh: 820 },
    ];
    var zoomLevel = 2;

    var posConfig = {
      'center':       [  0,    0,    1,    1   ],
      'left1':        [ -1,   28,  0.82,  1   ],
      'right1':       [  1,  -28,  0.82,  1   ],
      'left2':        [ -1,   45,  0.64,  0.55],
      'right2':       [  1,  -45,  0.64,  0.55],
      'hidden-left':  [ -1,   60,  0.48,  0   ],
      'hidden-right': [  1,  -60,  0.48,  0   ],
    };
    var posGap = {
      'center': 0, 'left1': 'g1', 'right1': 'g1',
      'left2': 'g2', 'right2': 'g2',
      'hidden-left': 'gh', 'hidden-right': 'gh',
    };

    function applyCardStyles(suppressTransition) {
      var s = zoomSteps[zoomLevel];
      cards.forEach(function (card) {
        var pos = card.dataset.pos;
        var cfg = posConfig[pos];
        if (!cfg) return;
        var gapKey = posGap[pos];
        var tx = cfg[0] * (gapKey ? s[gapKey] : 0);
        var shell = card.querySelector('.phone-shell');

        if (suppressTransition) {
          card.style.transition = 'none';
          if (shell) shell.style.transition = 'none';
        }

        card.style.width = s.pw + 'px';
        card.style.transform = 'translateX(' + tx + 'px) rotateY(' + cfg[1] + 'deg) scale(' + cfg[2] + ')';
        card.style.opacity = cfg[3];
        if (shell) {
          shell.style.width = s.pw + 'px';
          if (pos === 'center') {
            shell.style.boxShadow = '0 0 0 1px rgba(130,160,200,0.6), 0 40px 80px rgba(10,18,32,0.22), 0 0 48px rgba(29,111,242,0.12), inset 0 1px 0 rgba(255,255,255,0.6)';
          } else {
            shell.style.boxShadow = '';
          }
        }

        if (suppressTransition) {
          requestAnimationFrame(function () {
            card.style.transition = '';
            if (shell) shell.style.transition = '';
          });
        }
      });
      carouselStage.style.height = s.sh + 'px';
    }

    function getPositionForOffset(cardIndex, centerIndex, total) {
      var offset = cardIndex - centerIndex;
      while (offset > Math.floor(total / 2)) offset -= total;
      while (offset < -Math.floor(total / 2)) offset += total;
      var posMap = { '-2': 'left2', '-1': 'left1', '0': 'center', '1': 'right1', '2': 'right2' };
      return posMap[String(offset)] || (offset < 0 ? 'hidden-left' : 'hidden-right');
    }

    function updatePositions() {
      cards.forEach(function (card, i) {
        card.dataset.pos = getPositionForOffset(i, currentCenter, totalCards);
      });
      Array.prototype.forEach.call(document.querySelectorAll('.carousel-dot'), function (dot, i) {
        dot.classList.toggle('active', i === currentCenter);
      });
      applyCardStyles(false);
    }

    function goTo(index) {
      if (isAnimating) return;
      isAnimating = true;
      currentCenter = ((index % totalCards) + totalCards) % totalCards;
      updatePositions();
      setTimeout(function () { isAnimating = false; }, 700);
    }

    function next() { goTo((currentCenter + 1) % totalCards); }
    function prev() { goTo((currentCenter - 1 + totalCards) % totalCards); }

    cards.forEach(function (_, i) {
      var dot = document.createElement('div');
      dot.className = 'carousel-dot' + (i === currentCenter ? ' active' : '');
      dot.addEventListener('click', function () { goTo(i); });
      carouselDots.appendChild(dot);
    });

    function resetAuto() { stopAuto(); startAuto(); }
    function startAuto() { autoTimer = setInterval(next, 3500); }
    function stopAuto() { clearInterval(autoTimer); }

    carouselNext.addEventListener('click', function () { next(); resetAuto(); });
    carouselPrev.addEventListener('click', function () { prev(); resetAuto(); });

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (card.dataset.pos !== 'center') { goTo(i); resetAuto(); }
      });
    });

    carouselStage.addEventListener('mouseenter', stopAuto);
    carouselStage.addEventListener('mouseleave', startAuto);

    var touchStartX = 0;
    carouselStage.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    carouselStage.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetAuto(); }
    });

    /* ── CAROUSEL ZOOM ── */
    zoomSteps.forEach(function (_, i) {
      var pip = document.createElement('div');
      pip.className = 'zoom-pip' + (i === zoomLevel ? ' active' : '');
      pip.addEventListener('click', function () { setZoom(i); });
      zoomPips.appendChild(pip);
    });

    function setZoom(level) {
      zoomLevel = Math.max(0, Math.min(zoomSteps.length - 1, level));
      applyCardStyles(true);
      Array.prototype.forEach.call(zoomPips.querySelectorAll('.zoom-pip'), function (p, i) {
        p.classList.toggle('active', i === zoomLevel);
      });
      zoomOut.disabled = zoomLevel === 0;
      zoomIn.disabled = zoomLevel === zoomSteps.length - 1;
    }

    zoomIn.addEventListener('click', function () { setZoom(zoomLevel + 1); });
    zoomOut.addEventListener('click', function () { setZoom(zoomLevel - 1); });

    updatePositions();
    setZoom(zoomLevel);
    startAuto();
  }

  /* ── PRICING TOGGLE ── */
  var pricingToggle = document.getElementById('pricingToggle');
  var priceStarter = document.getElementById('price-starter');
  if (pricingToggle && priceStarter) {
    var prices = { starter: [0, 0], pro: [5, 4], ent: [15, 12] };
    var annualTotals = { starter: 0, pro: 48, ent: 144 };
    var isAnnual = false;
    var monthlyLabel = document.getElementById('monthlyLabel');
    var annualLabel = document.getElementById('annualLabel');

    function updatePricing() {
      var idx = isAnnual ? 1 : 0;
      document.getElementById('price-starter').textContent = prices.starter[idx];
      document.getElementById('price-pro').textContent = prices.pro[idx];
      document.getElementById('price-ent').textContent = prices.ent[idx];
      document.getElementById('annual-note-starter').textContent = isAnnual ? '$' + annualTotals.starter + ' billed annually' : '\u00a0';
      document.getElementById('annual-note-pro').textContent = isAnnual ? '$' + annualTotals.pro + ' billed annually' : '\u00a0';
      document.getElementById('annual-note-ent').textContent = isAnnual ? '$' + annualTotals.ent + ' billed annually' : '\u00a0';
      monthlyLabel.classList.toggle('active', !isAnnual);
      annualLabel.classList.toggle('active', isAnnual);
      pricingToggle.classList.toggle('annual', isAnnual);
      pricingToggle.setAttribute('aria-checked', isAnnual);
    }

    pricingToggle.addEventListener('click', function () { isAnnual = !isAnnual; updatePricing(); });
    pricingToggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isAnnual = !isAnnual; updatePricing(); }
    });
  }

  /* ── FAQ ACCORDION ── */
  var faqItems = document.querySelectorAll('.faq-item');
  var faqToggleAllBtn = document.getElementById('faqToggleAll');
  if (faqItems.length) {
    var allOpen = false;

    faqItems.forEach(function (item) {
      var question = item.querySelector('.faq-question');
      function toggleFaq() {
        var isOpen = item.classList.contains('open');
        item.classList.toggle('open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
      }
      question.addEventListener('click', toggleFaq);
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(); }
      });
    });

    if (faqToggleAllBtn) {
      var faqToggleIcon = document.getElementById('faqToggleIcon');
      faqToggleAllBtn.addEventListener('click', function () {
        allOpen = !allOpen;
        faqItems.forEach(function (item) {
          item.classList.toggle('open', allOpen);
          item.querySelector('.faq-question').setAttribute('aria-expanded', String(allOpen));
        });
        faqToggleIcon.textContent = allOpen ? '−' : '+';
        faqToggleAllBtn.lastChild.textContent = allOpen ? ' Collapse all' : ' Expand all';
      });
    }
  }
})();
