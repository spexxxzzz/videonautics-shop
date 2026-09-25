// Static showcase behavior only. No authentication, analytics, or API calls.
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    include('header-placeholder', 'partials/header.html'),
    include('footer-placeholder', 'partials/footer.html'),
  ]);

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = new Date().getFullYear();

  const menuButton = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      menu.classList.toggle('active', open);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('active');
    }));
  }

  document.querySelectorAll('.video-comp-container').forEach(setupComparison);

  const videos = [...document.querySelectorAll('video[data-src]')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) {
        loadVideo(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, { rootMargin: '350px 0px', threshold: 0.01 });
  videos.forEach(video => observer.observe(video));

  const scrollHint = document.getElementById('mouse-scroll');
  scrollHint?.addEventListener('click', () => document.getElementById('main')?.scrollIntoView({ behavior: 'smooth' }));

  const form = document.getElementById('waitlistForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('formMessage');
    if (message) message.innerHTML = 'Newsletter signup is not live yet. Please contact <a href="mailto:admin@videonautics.shop">admin@videonautics.shop</a>.';
  });
});

async function include(id, path) {
  const target = document.getElementById(id);
  if (!target) return;
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  target.innerHTML = await response.text();
}

function loadVideo(video) {
  if (video.dataset.initialized) return;
  video.dataset.initialized = 'true';
  const spinner = video.closest('.video-comp-video')?.querySelector('.loading-indicator');
  spinner?.classList.add('active');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.addEventListener('loadeddata', () => {
    video.classList.add('loaded');
    spinner?.classList.remove('active');
  }, { once: true });
  video.addEventListener('error', () => spinner?.classList.remove('active'), { once: true });
  const mp4 = video.dataset.src;
  const manifest = mp4.replace('/downloads/default.mp4', '/manifest/video.m3u8');
  if (window.Hls?.isSupported()) {
    const hls = new window.Hls({ maxBufferLength: 10 });
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(manifest));
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) spinner?.classList.remove('active');
    });
    video.hlsInstance = hls;
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = manifest;
  } else {
    video.src = mp4;
  }
}

function setupComparison(container) {
  const overlay = container.querySelector('.video-comp-overlay');
  const slider = container.querySelector('.video-comp-slider');
  if (!overlay || !slider) return;

  const update = clientX => {
    const rect = container.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    overlay.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    slider.style.left = `${percent}%`;
  };

  slider.addEventListener('pointerdown', event => {
    slider.setPointerCapture(event.pointerId);
    update(event.clientX);
  });
  slider.addEventListener('pointermove', event => {
    if (slider.hasPointerCapture(event.pointerId)) update(event.clientX);
  });
  container.addEventListener('click', event => update(event.clientX));
}
