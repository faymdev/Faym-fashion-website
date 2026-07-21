/* blog-main.js
  - fetches posts.json
  - renders list page and post page
  - provides search, category, tag filtering
  - uses reveal animation classes (add .reveal in markup already)
*/

(async function(){
  const DATA_PATH = 'posts.json';
  let POSTS = [];

  async function loadPosts(){
    try {
      const res = await fetch(DATA_PATH);
      POSTS = await res.json();
    } catch(e){
      console.error('Failed loading posts.json', e);
      POSTS = [];
    }
  }

  function formatDate(d){
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'});
  }

  /* ---------- LIST PAGE ---------- */
  async function initListPage(){
    await loadPosts();
    const postsList = document.getElementById('postsList');
    const categorySelect = document.getElementById('categorySelect');
    const tagContainer = document.getElementById('tagContainer');
    const searchInput = document.getElementById('searchInput');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const resetBtn = document.getElementById('resetBtn');

    // build category options
    const cats = ['all', ...Array.from(new Set(POSTS.map(p=>p.category))).sort()];
    categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');

    // build tag pills
    const tags = Array.from(new Set(POSTS.flatMap(p=>p.tags || []))).sort();
    tagContainer.innerHTML = tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('');

    let filtered = POSTS.slice();
    let visible = 6;

    function renderSlice(){
      const slice = filtered.slice(0, visible);
      postsList.innerHTML = slice.map(p=>{
        return `<a href="blog-post.html?id=${encodeURIComponent(p.id)}" class="post-card">
          <div class="post-card-inner">
            <img src="${p.hero}" alt="${escapeHtml(p.title)}" />
            <div style="padding:12px 0">
              <div class="post-meta">${escapeHtml(p.category)} • ${formatDate(p.date)}</div>
              <h3 style="margin:6px 0 8px">${escapeHtml(p.title)}</h3>
              <p style="color:var(--muted);">${escapeHtml(p.excerpt)}</p>
            </div>
          </div>
        </a>`;
      }).join('');
      

      
      if (visible >= filtered.length) loadMoreBtn.style.display = 'none'; else loadMoreBtn.style.display = 'inline-block';
      initReveal();
    }

    // search
    searchInput.addEventListener('input', e=>{
      const q = e.target.value.trim().toLowerCase();
      filtered = POSTS.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.content && p.content.toLowerCase().includes(q)));
      visible = 6;
      renderSlice();
    });

    // category
    categorySelect.addEventListener('change', e=>{
      const c = e.target.value;
      filtered = c === 'all' ? POSTS.slice() : POSTS.filter(p=>p.category === c);
      visible = 6;
      renderSlice();
    });

    // tag click
    tagContainer.addEventListener('click', e=>{
      const tag = e.target.dataset.tag;
      if (!tag) return;
      filtered = POSTS.filter(p => (p.tags || []).includes(tag));
      visible = 6;
      renderSlice();
    });

    loadMoreBtn.addEventListener('click', ()=>{ visible += 6; renderSlice(); });
    resetBtn.addEventListener('click', ()=>{ filtered = POSTS.slice(); visible = 6; categorySelect.value='all'; searchInput.value=''; renderSlice(); });

    // initial render
    renderSlice();
  }

  /* ---------- POST PAGE ---------- */
  async function initPostPage(){
    await loadPosts();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const post = POSTS.find(p=>p.id === id) || POSTS[0];
    if (!post) {
      document.getElementById('postContent').innerHTML = '<p>Post not found.</p>';
      return;
    }

    // hero
    const hero = document.getElementById('postHero');
    hero.style.backgroundImage = `url('${post.hero}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';

    document.getElementById('postTitle').innerText = post.title;
    document.getElementById('postExcerpt').innerText = post.excerpt;
    document.getElementById('postMeta').innerText = `${post.author} • ${formatDate(post.date)} • ${post.category}`;

    // content (safe-ish: posts.json content uses small HTML fragments)
    document.getElementById('postContent').innerHTML = post.content + renderTags(post.tags);

    // related posts (same category, excluding this)
    const related = POSTS.filter(p=>p.category === post.category && p.id !== post.id).slice(0,3);
    const relatedList = document.getElementById('relatedList');
    relatedList.innerHTML = related.map(r => `
      <a class="post-card" href="blog-post.html?id=${encodeURIComponent(r.id)}">
        <img src="${r.hero}" alt="${escapeHtml(r.title)}" />
        <div style="padding:10px 0"><div class="post-meta">${escapeHtml(r.category)} • ${formatDate(r.date)}</div><strong>${escapeHtml(r.title)}</strong></div>
      </a>
    `).join('');

    initReveal();
  }

  /* ---------- Helpers ---------- */
  function renderTags(tags = []){
    if (!tags.length) return '';
    return `<div class="tags">${tags.map(t=>`<a href="blog.html" class="tag" data-tag="${t}" style="margin-right:8px">${t}</a>`).join('')}</div>`;
  }

  function escapeHtml(s=''){ return (''+s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  /* ---------- Simple reveal init (reuse your site reveal classes) ---------- */
  function initReveal(){
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el=>{
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) el.classList.add('visible');
    });
    window.addEventListener('scroll', ()=>{
      const revs = document.querySelectorAll('.reveal');
      revs.forEach(el=>{
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) el.classList.add('visible');
      });
    });
  }

  /* expose */
  window.BLOG = { initListPage, initPostPage, POSTS };
})();
