const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Keep the navigation legible over both the moving footage and the page end.
const nav = document.querySelector('.nav');
if (nav) {
  const hero = document.querySelector('.hero');
  const toggle = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > (hero ? hero.offsetHeight - 90 : 30));
  };
  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle, { passive: true });
  toggle();

  const menuToggle = nav.querySelector('.nav-menu-toggle');
  const menuLinks = [...nav.querySelectorAll('#primary-navigation a[href^="#"]')];
  const closeMenu = () => {
    nav.classList.remove('nav--menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  menuLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  // A shared, animated underline follows the section currently in view.
  const updateActiveLink = (link) => {
    menuLinks.forEach((item) => {
      const active = item === link;
      item.classList.toggle('is-current', active);
      if (active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
    if (link) {
      nav.style.setProperty('--nav-marker-x', `${link.offsetLeft}px`);
      nav.style.setProperty('--nav-marker-width', `${link.offsetWidth}px`);
    } else {
      nav.style.setProperty('--nav-marker-width', '0px');
    }
  };
  const sectionLinks = menuLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(({ section }) => section);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) updateActiveLink(sectionLinks.find(({ section }) => section === visible.target)?.link);
    }, { rootMargin: '-38% 0px -48% 0px', threshold: [0, 0.15, 0.4, 0.7] });
    sectionLinks.forEach(({ section }) => sectionObserver.observe(section));
  }
  window.addEventListener('resize', () => {
    const activeLink = menuLinks.find((link) => link.classList.contains('is-current'));
    if (activeLink) updateActiveLink(activeLink);
  }, { passive: true });
}

// Keep remote background footage from downloading and decoding six clips at
// once. Each one runs only while its section is close to the viewport.
const backgroundVideos = [...document.querySelectorAll('[data-bg-video]')];
if (reduceMotion) {
  backgroundVideos.forEach((video) => video.classList.add('is-static'));
} else if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting && document.visibilityState === 'visible') {
        video.play().catch(() => video.classList.add('is-static'));
      } else {
        video.pause();
      }
    });
  }, { rootMargin: '240px 0px', threshold: 0 });
  backgroundVideos.forEach((video) => videoObserver.observe(video));
} else {
  backgroundVideos.slice(0, 1).forEach((video) => video.play().catch(() => video.classList.add('is-static')));
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') backgroundVideos.forEach((video) => video.pause());
  else if (!reduceMotion) backgroundVideos.forEach((video) => {
    const bounds = video.getBoundingClientRect();
    if (bounds.bottom > -240 && bounds.top < window.innerHeight + 240) {
      video.play().catch(() => video.classList.add('is-static'));
    }
  });
});

// Content enters quietly; if reduced motion is requested, show it immediately.
const revealItems = document.querySelectorAll('.reveal');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('in-view'));
}
