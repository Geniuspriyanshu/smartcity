/* script.js */
/*
  Script features:
  - Generate sample projects (many) to make the page "long and vast"
  - Filter by sector and status, search, sort
  - Load more button to append more projects
  - Modal for project details
  - Populate timeline entries
  - Simple contact form handler (no actual network)
*/
document.addEventListener('DOMContentLoaded', () => {
  const projectsGrid = document.getElementById('projectsGrid');
  const timelineList = document.getElementById('timelineList');
  const sectorFilter = document.getElementById('sectorFilter');
  const statusFilter = document.getElementById('statusFilter');
  const sortBy = document.getElementById('sortBy');
  const searchInput = document.getElementById('search');
  const resultsCount = document.getElementById('countNumber');
  const loadMoreBtn = document.getElementById('loadMore');
  const clearFilters = document.getElementById('clearFilters');
  const projectModal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.querySelector('.modal-close');
  const yearSpan = document.getElementById('year');

  yearSpan.textContent = new Date().getFullYear();

  const sampleSectors = ['mobility','energy','water','safety','govtech','environment'];
  const sampleStatuses = ['planned','in-progress','completed','piloted'];
  const sampleImpact = ['Low','Medium','High','Very High'];

  // Utility: make many sample projects
  function generateSampleProjects(n=80){
    const arr = [];
    for(let i=1;i<=n;i++){
      const sector = sampleSectors[i % sampleSectors.length];
      const status = sampleStatuses[i % sampleStatuses.length];
      const impact = sampleImpact[i % sampleImpact.length];
      const year = 2018 + (i % 8);
      arr.push({
        id: 'p' + i,
        title: `${capitalize(sector)} Initiative #${i}`,
        summary: `A comprehensive ${sector} project focused on improving urban operations, citizen experience and measurable KPIs. This is an expanded description to make the catalog long and deep.`,
        sector, status, impact,
        start: `${year}-01-15`,
        end: status === 'completed' ? `${year+1}-06-15` : null,
        budgetMillion: Math.round((5 + (i % 20) * 2.3) * 10) / 10,
        details: longLorem(i)
      });
    }
    return arr;
  }

  function longLorem(i){
    return `Detailed plan for stage ${i}. Objectives include sensor deployments, strong maintenance contract, interoperable APIs, privacy-led data governance, citizen engagement and measurable KPIs. Implementation notes: allocate maintenance team, ensure local capacity building, pilot in 3 wards and iterate. Further reading: architecture docs, governance framework, procurement plan.`;
  }

  function capitalize(s){
    if(!s) return s;
    return s[0].toUpperCase() + s.slice(1);
  }

  const allProjects = generateSampleProjects(140); // make it long & vast
  let shownProjects = [];
  let page = 0;
  const pageSize = 12;

  // Render a page
  function renderPage(reset=false){
    if(reset){
      projectsGrid.innerHTML = '';
      page = 0;
    }
    const filtered = applyFilters(allProjects);
    const sorted = applySort(filtered);
    const pageSlice = sorted.slice(page * pageSize, (page+1)*pageSize);
    page++;
    shownProjects = shownProjects.concat(pageSlice);
    pageSlice.forEach(p => projectsGrid.appendChild(createCard(p)));

    resultsCount.textContent = filtered.length;
    // hide load more if nothing left
    if((page)*pageSize >= sorted.length) loadMoreBtn.style.display = 'none';
    else loadMoreBtn.style.display = 'inline-block';
    // if no results, show message
    if(filtered.length === 0) {
      projectsGrid.innerHTML = '<div class="muted">No projects match your filters.</div>';
    }
  }

  function applyFilters(list){
    const s = sectorFilter.value;
    const st = statusFilter.value;
    const q = (searchInput.value || '').trim().toLowerCase();
    return list.filter(p => {
      if(s !== 'all' && p.sector !== s) return false;
      if(st !== 'all' && p.status !== st) return false;
      if(q){
        const hay = `${p.title} ${p.summary} ${p.details} ${p.sector}`.toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function applySort(list){
    const key = sortBy.value;
    const copy = list.slice();
    if(key === 'newest') copy.sort((a,b)=> (b.start > a.start ? 1 : -1));
    else if(key === 'oldest') copy.sort((a,b)=> (a.start > b.start ? 1 : -1));
    else if(key === 'impact') copy.sort((a,b)=> {
      const rank = {'Very High':3,'High':2,'Medium':1,'Low':0};
      return (rank[b.impact] - rank[a.impact]);
    });
    return copy;
  }

  // Card markup
  function createCard(p){
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role','listitem');
    card.innerHTML = `
      <div class="card-top">
        <div class="tag">${capitalize(p.sector)}</div>
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.summary)}</p>
      <div class="meta">
        <div>${p.start}${p.end ? ' — ' + p.end : ''}</div>
        <div>•</div>
        <div>${p.status}</div>
        <div>•</div>
        <div>${p.impact} impact</div>
      </div>
      <div style="display:flex; gap:8px; margin-top:8px; align-items:center;">
        <button class="btn open-detail" data-id="${p.id}">Open</button>
        <div class="muted" style="font-size:13px">Budget: ${p.budgetMillion}M</div>
      </div>
    `;
    // delegate open
    card.querySelector('.open-detail').addEventListener('click', () => openModalWithProject(p));
    return card;
  }

  // Modal
  function openModalWithProject(p){
    projectModal.setAttribute('aria-hidden','false');
    modalBody.innerHTML = `
      <h2>${escapeHtml(p.title)}</h2>
      <p class="muted">Sector: ${p.sector} · Status: ${p.status} · Impact: ${p.impact}</p>
      <p>${escapeHtml(p.details)}</p>
      <h4>Key facts</h4>
      <ul>
        <li>Start: ${p.start}</li>
        <li>End: ${p.end || 'Ongoing'}</li>
        <li>Budget: ${p.budgetMillion} million</li>
      </ul>
      <h4>Stakeholders</h4>
      <p class="muted">City authority, local operator, vendor partners, citizen groups</p>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="btn primary" id="modalClosePrimary">Mark Favorite</button>
        <a class="btn ghost" href="#" id="modalOpenDocs">Open Docs</a>
      </div>
    `;
    // trap focus basic
    setTimeout(()=> {
      const closePrimary = document.getElementById('modalClosePrimary');
      closePrimary && closePrimary.addEventListener('click', ()=> {
        alert('Marked as favorite locally (demo).');
      });
    },0);
  }
  function closeModal(){
    projectModal.setAttribute('aria-hidden','true');
    modalBody.innerHTML = '';
  }

  modalClose.addEventListener('click', closeModal);
  projectModal.addEventListener('click', (e) => {
    if(e.target === projectModal) closeModal();
  });
  document.addEventListener('keydown', (e)=> {
    if(e.key === 'Escape') closeModal();
  });

  // timeline generator
  function populateTimeline(){
    const years = [2018,2019,2020,2021,2022,2023,2024,2025];
    years.forEach(y => {
      const li = document.createElement('li');
      li.innerHTML = `<h4>${y}</h4><p class="muted">Major milestones: planning, pilots, and scaling of cross-sector smart city solutions. Example deliverables include deployments in public transport and energy efficiency projects in multiple wards.</p>`;
      timelineList.appendChild(li);
    });
  }

  // search / filter events
  [sectorFilter, statusFilter, sortBy].forEach(el => el.addEventListener('change', ()=> { shownProjects=[]; renderPage(true); }));
  searchInput.addEventListener('input', debounce(()=> { shownProjects=[]; renderPage(true); }, 300));
  loadMoreBtn.addEventListener('click', ()=> renderPage(false));
  clearFilters.addEventListener('click', ()=> {
    sectorFilter.value = 'all';
    statusFilter.value = 'all';
    sortBy.value = 'newest';
    searchInput.value = '';
    shownProjects=[];
    renderPage(true);
  });

  // Load initial
  populateTimeline();
  renderPage(true);

  // Contact form handler
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('name').value;
    alert(`Thanks ${name}! Your message was received (demo).`);
    contactForm.reset();
  });
  document.getElementById('resetForm').addEventListener('click', ()=> contactForm.reset());

  // Helpers
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function debounce(fn, wait){
    let t;
    return (...args)=> {
      clearTimeout(t);
      t = setTimeout(()=> fn(...args), wait);
    };
  }

  // small utilities: lazy animate progress bars in systems section when visible
  const progressBars = document.querySelectorAll('.progress-bar');
  const progObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const el = en.target;
        const val = el.getAttribute('data-value') || '50';
        el.style.width = val + '%';
        progObserver.unobserve(el);
      }
    });
  }, {threshold:0.3});
  progressBars.forEach(pb => progObserver.observe(pb));

  // small accessibility: smooth scroll for internal nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      // allow external anchors like '#'
      if(a.getAttribute('href') === '#') return;
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

});