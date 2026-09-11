// ─────────────────────────────────────────
//  FILMOZA – Main JavaScript
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  const page = detectPage();

  // ── NAVBAR scroll behaviour ──────────────
  initNavbar();

  // ── Mobile hamburger menu ────────────────
  initHamburger();

  // ── Page-specific logic ──────────────────
  if (page === 'index')   initHomePage();
  if (page === 'crew')    initCrewPage();
  if (page === 'profile') initProfilePage();

});

// ─── Helpers ────────────────────────────────────────────────

function detectPage() {
  const path = window.location.pathname;
  if (path.includes('crew.html'))    return 'crew';
  if (path.includes('profile.html')) return 'profile';
  return 'index';
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initHamburger() {
  const btn      = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navActs  = document.querySelector('.nav-actions');
  if (!btn || !navLinks) return;

  btn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navActs && navActs.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navActs && navActs.classList.remove('open');
    });
  });
}

function getAvailabilityBadge(status) {
  const map = {
    available: { cls: 'badge-available', label: 'Available Now' },
    soon:      { cls: 'badge-soon',      label: 'Available Soon' },
    busy:      { cls: 'badge-busy',      label: 'Currently Busy' },
  };
  const b = map[status] || map.busy;
  return `<span class="availability-badge ${b.cls}">${b.label}</span>`;
}

function getAvatarStyle(member) {
  return `background: linear-gradient(135deg, ${member.avatarColor}, ${shadeColor(member.avatarColor, -30)})`;
}

function shadeColor(hex, pct) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (num & 0xff) + pct));
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

function getInitials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function buildCrewCard(member, linkToProfile = true) {
  const skillsHtml = member.skills.slice(0, 4).map(s =>
    `<span class="skill-tag">${s}</span>`
  ).join('');

  const card = document.createElement('div');
  card.className = 'crew-card';
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `${member.name}, ${member.role}`);
  card.innerHTML = `
    <div class="crew-card-top">
      <div class="avatar-initials" style="${getAvatarStyle(member)}">
        ${getInitials(member.name)}
      </div>
      ${getAvailabilityBadge(member.availability)}
    </div>
    <div class="crew-card-body">
      <span class="crew-dept-tag">${member.department}</span>
      <h3>${member.name}</h3>
      <p class="crew-title">${member.role}</p>
      <div class="crew-meta">
        <span><i class="fas fa-briefcase"></i>${member.experience} yrs exp</span>
        <span><i class="fas fa-film"></i>${member.projects} projects</span>
        <span><i class="fas fa-location-dot"></i>${member.location.split(',')[0]}</span>
      </div>
      <div class="crew-skills">${skillsHtml}</div>
      <div class="crew-card-actions">
        <a href="profile.html?id=${member.id}" class="btn btn-primary">View Profile</a>
        <a href="profile.html?id=${member.id}#inquire" class="btn btn-outline">Inquire</a>
      </div>
    </div>
  `;

  if (linkToProfile) {
    card.querySelector('.crew-card-top').style.cursor = 'pointer';
    card.querySelector('.crew-card-top').addEventListener('click', () => {
      window.location.href = `profile.html?id=${member.id}`;
    });
  }

  return card;
}

function showToast(message, type = 'success') {
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i><span>${message}</span>`;
  document.body.appendChild(t);

  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(24px)'; t.style.transition = '0.4s ease'; }, 3200);
  setTimeout(() => t.remove(), 3700);
}

// ─── Home Page ───────────────────────────────────────────────

function initHomePage() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  const featured = CREW_DATA.filter(m => m.featured);
  featured.forEach(member => grid.appendChild(buildCrewCard(member)));
}

// ─── Crew Listing Page ───────────────────────────────────────

function initCrewPage() {
  const grid         = document.getElementById('crewGrid');
  const noResults    = document.getElementById('noResults');
  const resultCount  = document.getElementById('resultCount');
  const searchInput  = document.getElementById('searchInput');
  const searchClear  = document.getElementById('searchClear');
  const deptFilter   = document.getElementById('deptFilter');
  const expFilter    = document.getElementById('expFilter');
  const availFilter  = document.getElementById('availFilter');
  const sortSelect   = document.getElementById('sortSelect');

  if (!grid) return;

  // Pre-select department from URL params
  const params = new URLSearchParams(window.location.search);
  const deptParam = params.get('dept');
  if (deptParam && deptFilter) {
    // Map URL slugs to exact option values
    const slugMap = {
      'direction':          'Direction',
      'cinematography':     'Cinematography',
      'editing':            'Editing',
      'sound':              'Sound Design',
      'sound-design':       'Sound Design',
      'production-design':  'Production Design',
      'vfx':                'VFX & Animation',
      'vfx-animation':      'VFX & Animation',
      'makeup':             'Hair & Makeup',
      'hair-makeup':        'Hair & Makeup',
      'costume':            'Costume Design',
      'costume-design':     'Costume Design',
    };
    const mappedValue = slugMap[deptParam.toLowerCase()];
    if (mappedValue) deptFilter.value = mappedValue;
  }

  function getFiltered() {
    const q    = searchInput.value.toLowerCase().trim();
    const dept = deptFilter.value;
    const exp  = expFilter.value;
    const avail= availFilter.value;

    return CREW_DATA.filter(m => {
      const matchQ = !q || m.name.toLowerCase().includes(q)
                         || m.role.toLowerCase().includes(q)
                         || m.department.toLowerCase().includes(q)
                         || m.skills.some(s => s.toLowerCase().includes(q));
      const matchD  = !dept  || m.department === dept;
      const matchE  = !exp   || m.expLevel === exp;
      const matchA  = !avail || m.availability === avail;
      return matchQ && matchD && matchE && matchA;
    });
  }

  function getSorted(list) {
    const val = sortSelect.value;
    const arr = [...list];
    if (val === 'name')         arr.sort((a,b) => a.name.localeCompare(b.name));
    if (val === 'exp-desc')     arr.sort((a,b) => b.experience - a.experience);
    if (val === 'projects-desc')arr.sort((a,b) => b.projects - a.projects);
    if (val === 'featured')     arr.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return arr;
  }

  function render() {
    const filtered = getSorted(getFiltered());
    grid.innerHTML = '';

    if (filtered.length === 0) {
      noResults.classList.remove('hidden');
      grid.classList.add('hidden');
    } else {
      noResults.classList.add('hidden');
      grid.classList.remove('hidden');
      filtered.forEach(m => grid.appendChild(buildCrewCard(m)));
    }

    resultCount.textContent = `${filtered.length} crew member${filtered.length !== 1 ? 's' : ''} found`;
  }

  // Events
  searchInput.addEventListener('input', render);
  deptFilter .addEventListener('change', render);
  expFilter  .addEventListener('change', render);
  availFilter.addEventListener('change', render);
  sortSelect .addEventListener('change', render);

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    render();
    searchInput.focus();
  });

  render();
}

// ─── Profile Page ────────────────────────────────────────────

function initProfilePage() {
  const container = document.getElementById('profileContainer');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const member = CREW_DATA.find(m => m.id === id);

  if (!member) {
    container.innerHTML = `
      <div style="text-align:center;padding:120px 0;color:var(--gray);">
        <i class="fas fa-user-slash" style="font-size:3rem;color:rgba(232,176,75,0.2);margin-bottom:16px;display:block;"></i>
        <h2 style="color:var(--gray-light)">Profile not found</h2>
        <p style="margin:12px 0 24px;">This crew member doesn't exist or the link is incorrect.</p>
        <a href="crew.html" class="btn btn-primary">Browse All Crew</a>
      </div>`;
    return;
  }

  // Update page title
  document.title = `${member.name} – FILMOZA`;

  // Build filmography
  const filmHtml = member.filmography.map(f => `
    <div class="film-item">
      <span class="film-year">${f.year}</span>
      <div class="film-info">
        <h4>${f.title}</h4>
        <p>${f.role} · ${f.type}</p>
      </div>
      ${f.awards ? `<span class="film-badge"><i class="fas fa-trophy"></i> ${f.awards}</span>` : ''}
    </div>
  `).join('');

  // Build awards
  const awardHtml = member.awardsList.length
    ? member.awardsList.map(a => `
      <div class="award-item">
        <i class="fas fa-trophy"></i>
        <div><strong>${a.title}</strong><span>${a.event}</span></div>
      </div>
    `).join('')
    : `<p style="color:var(--gray);font-size:0.88rem;">No awards listed yet.</p>`;

  // Build skills
  const skillsHtml = member.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');

  const availMap = {
    available: { cls: 'badge-available', label: 'Available Now' },
    soon:      { cls: 'badge-soon',      label: 'Available Soon' },
    busy:      { cls: 'badge-busy',      label: 'Currently Busy' },
  };
  const avail = availMap[member.availability] || availMap.busy;

  container.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Home</a>
      <i class="fas fa-chevron-right"></i>
      <a href="crew.html">Find Crew</a>
      <i class="fas fa-chevron-right"></i>
      <span>${member.name}</span>
    </nav>

    <div class="profile-layout">

      <!-- SIDEBAR -->
      <aside class="profile-sidebar">

        <div class="profile-card">
          <div class="profile-card-banner" style="${getAvatarStyle(member)}">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" style="${getAvatarStyle(member)}">${getInitials(member.name)}</div>
            </div>
          </div>
          <div class="profile-card-body">
            <h1>${member.name}</h1>
            <p class="profile-role">${member.role}</p>
            <span class="availability-badge ${avail.cls}" style="margin-bottom:16px;display:inline-block;">${avail.label}</span>
            <p class="profile-bio">${member.bio}</p>
            <ul class="profile-info-list">
              <li><i class="fas fa-layer-group"></i><span>${member.department}</span></li>
              <li><i class="fas fa-briefcase"></i><span>${member.experience} years experience</span></li>
              <li><i class="fas fa-film"></i><span>${member.projects} projects completed</span></li>
              <li><i class="fas fa-trophy"></i><span>${member.awards} award${member.awards !== 1 ? 's' : ''}</span></li>
              <li><i class="fas fa-location-dot"></i><span>${member.location}</span></li>
            </ul>
            <div class="profile-card-actions">
              <button class="btn btn-primary" id="inquireBtn">
                <i class="fas fa-paper-plane"></i> Send Inquiry
              </button>
              ${member.reelUrl !== '#'
                ? `<a href="${member.reelUrl}" class="btn btn-outline" target="_blank" rel="noopener"><i class="fas fa-play"></i> Watch Reel</a>`
                : `<button class="btn btn-outline" disabled title="Reel not available"><i class="fas fa-play"></i> Demo Reel</button>`
              }
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <h4>Skills &amp; Tools</h4>
          <div class="skills-list">${skillsHtml}</div>
        </div>

      </aside>

      <!-- MAIN -->
      <main class="profile-main">

        <section class="profile-section">
          <h2><i class="fas fa-chart-bar"></i> Career Overview</h2>
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-number">${member.projects}</span>
              <span class="stat-label">Projects</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">${member.experience}</span>
              <span class="stat-label">Years Exp.</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">${member.awards}</span>
              <span class="stat-label">Awards</span>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h2><i class="fas fa-clapperboard"></i> Filmography</h2>
          <div class="filmography-list">${filmHtml}</div>
        </section>

        <section class="profile-section">
          <h2><i class="fas fa-trophy"></i> Awards &amp; Recognition</h2>
          <div class="awards-list">${awardHtml}</div>
        </section>

        <section class="profile-section">
          <h2><i class="fas fa-play-circle"></i> Demo Reel</h2>
          <div class="reel-btn-wrap" style="padding:32px 0;">
            <div style="background:var(--dark-4);border-radius:12px;padding:48px;text-align:center;border:2px dashed rgba(255,255,255,0.08);">
              <i class="fas fa-video" style="font-size:2.5rem;color:rgba(232,176,75,0.3);margin-bottom:16px;display:block;"></i>
              <p style="color:var(--gray);font-size:0.9rem;margin-bottom:20px;">Demo reel available on request.</p>
              <button class="btn btn-primary" id="reelInquireBtn">
                <i class="fas fa-paper-plane"></i> Request Reel Access
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  `;

  // Auto-open modal if ?id=X#inquire
  if (window.location.hash === '#inquire') {
    setTimeout(openModal, 300);
  }

  // Inquiry button
  document.getElementById('inquireBtn')?.addEventListener('click', openModal);
  document.getElementById('reelInquireBtn')?.addEventListener('click', openModal);

  // Modal subtitle
  document.getElementById('modalSubtitle').textContent = `Send an inquiry to ${member.name} about your project.`;

  initModal();
}

// ─── Inquiry Modal ───────────────────────────────────────────

function openModal() {
  const modal = document.getElementById('inquiryModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modal.querySelector('#producerName')?.focus();
}

function closeModal() {
  const modal = document.getElementById('inquiryModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function initModal() {
  const modal     = document.getElementById('inquiryModal');
  const closeBtn  = document.getElementById('modalClose');
  const form      = document.getElementById('inquiryForm');

  if (!modal) return;

  closeBtn?.addEventListener('click', closeModal);

  // Close on overlay click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Form submission
  form?.addEventListener('submit', e => {
    e.preventDefault();

    const name  = document.getElementById('producerName')?.value.trim();
    const email = document.getElementById('producerEmail')?.value.trim();
    const proj  = document.getElementById('projectTitle')?.value.trim();
    const msg   = document.getElementById('message')?.value.trim();

    if (!name || !email || !proj || !msg) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    closeModal();
    form.reset();
    showToast('Inquiry sent! The crew member will be in touch soon.', 'success');
  });
}
