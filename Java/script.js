// script.js — лёгкий и автономный

(() => {
  const root = document.documentElement;
  const themeSwitch = document.getElementById('themeSwitch');
  const mobileToggle = document.getElementById('mobileNavToggle');
  const nav = document.getElementById('primary-navigation');

  /* ================================
      ТЕМНАЯ / СВЕТЛАЯ ТЕМЫ
  =================================*/
  const saved = localStorage.getItem('waveshape:theme');
  if (saved) root.setAttribute('data-theme', saved);
  else root.setAttribute('data-theme', 'dark');

  function toggleTheme() {
    const cur = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', cur);
    localStorage.setItem('waveshape:theme', cur);
  }

// в script.js внутри блока, где навешивается обработчик:
  if (themeSwitch) {
    themeSwitch.addEventListener('click', (e) => {
      toggleTheme();
      themeSwitch.classList.add('pulse');
      setTimeout(()=> themeSwitch.classList.remove('pulse'), 600);
    });
  }


  /* ================================
      STAGGER / FADE ANIMATION
  =================================*/
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('[data-stagger]').forEach((el) => observer.observe(el));

  /* ================================
      ScrollSpy — активный пункт меню
  =================================*/
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const links = Array.from(document.querySelectorAll('#primary-navigation a'));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach((a) =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + id)
          );
        }
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((s) => sectionObserver.observe(s));

  /* ================================
      MOBILE MENU — КОРРЕКТНАЯ ВЕРСИЯ
  =================================*/
  function updateMobileState() {
    if (window.innerWidth <= 760) {
      mobileToggle.style.display = 'inline-flex';
      nav.classList.remove('open');
      nav.style.display = 'none';
      mobileToggle.setAttribute('aria-expanded', 'false');
    } else {
      mobileToggle.style.display = 'none';
      nav.classList.remove('open');
      nav.style.display = '';
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  }

  updateMobileState();
  window.addEventListener('resize', updateMobileState);

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open'); // да/нет
      mobileToggle.setAttribute('aria-expanded', isOpen);

      // управление display через CSS-класс
      if (isOpen) {
        nav.style.display = 'flex';
      } else {
        nav.style.display = 'none';
      }
    });
  }

  /* ================================
      Закрытие меню после выбора пункта
  =================================*/
  document.querySelectorAll('.header-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth > 760) return; // на ПК не закрываем

      const isOpen = nav.classList.contains('open');
      if (isOpen) {
        nav.classList.remove('open');
        nav.style.display = 'none';
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
