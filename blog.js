/* blog.js
 - Loads posts.json (if present) or generates N sample posts client-side.
 - Renders listing + single post page.
 - Provides search, category & tag filters.
*/

const BLOG = (function(){
  const POSTS_URL = 'posts.json'; // local file path (optional)
  let posts = [];
  let visible = 9;

  // try to load posts.json
  async function loadPosts() {
    try {
      const r = await fetch(POSTS_URL, {cache: "no-cache"});
      if (!r.ok) throw new Error('no posts.json');
      posts = await r.json();
      console.info('Loaded posts.json', posts.length);
    } catch(err) {
      console.warn('posts.json not found or failed, generating sample posts.', err);
      posts = generateSamplePosts(50);
    }
    // normalize dates
    posts = posts.map(p => ({ ...p, date: p.date || randomDateString() }));
    return posts;
  }

  /* --------------------------
     Listing: render grid, search, filters
     -------------------------- */
  async function initList() {
    await loadPosts();
    populateCategoryFilter();
    renderTags();
    renderGrid();
    attachControls();
  }

  function renderGrid(reset=false) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;
    if (reset) visible = 9;
    const list = filteredPosts();
    grid.innerHTML = '';
    const slice = list.slice(0, visible);
    slice.forEach(p => grid.appendChild(createCard(p)));
    // toggle load more
    const loadMore = document.getElementById('loadMore');
    loadMore.style.display = (visible < list.length) ? 'block' : 'none';
  }

  function createCard(p){
    const el = document.createElement('article');
    el.className = 'post-card';
    el.innerHTML = `
      <div class="post-thumb"><img src="${escape(p.image||`https://picsum.photos/seed/${encodeURIComponent(p.id)}/1200/800`)}" alt="${escape(p.title)}"></div>
      <div class="post-body">
        <div class="meta">${escape(p.date)} • ${escape(p.author || 'FAYM')}</div>
        <h3><a href="blog-post.html?id=${encodeURIComponent(p.id)}">${escape(p.title)}</a></h3>
        <p class="muted">${escape(p.excerpt || '')}</p>
        <div style="margin-top:10px"><a class="btn btn-outline" href="blog-post.html?id=${encodeURIComponent(p.id)}">Read</a></div>
      </div>`;
    return el;
  }

  function attachControls(){
    const search = document.getElementById('searchInput');
    const select = document.getElementById('categorySelect');
    const loadMore = document.getElementById('loadMore');
    const reset = document.getElementById('resetFilters');
    search.addEventListener('input', ()=> { visible = 9; renderGrid(true); });
    select.addEventListener('change', ()=> { visible = 9; renderGrid(true); });
    loadMore.addEventListener('click', ()=> { visible += 9; renderGrid(); });
    reset.addEventListener('click', ()=> { search.value=''; select.value='all'; clearTagFilter(); visible=9; renderGrid(true); });
  }

  function populateCategoryFilter(){
    const select = document.getElementById('categorySelect');
    if (!select) return;
    const cats = Array.from(new Set(posts.map(p => (p.category||'Uncategorized').trim()))).sort();
    select.innerHTML = '<option value="all">All categories</option>' + cats.map(c=> `<option value="${escapeAttr(c)}">${escape(c)}</option>`).join('');
  }

  function renderTags(){
    const container = document.getElementById('tagFilters');
    if (!container) return;
    const allTags = posts.flatMap(p => p.tags || []);
    const unique = Array.from(new Set(allTags)).slice(0,40);
    container.innerHTML = unique.map(t=>`<div class="tag" data-tag="${escapeAttr(t)}">${escape(t)}</div>`).join('');
    container.querySelectorAll('.tag').forEach(el=>{
      el.addEventListener('click', ()=> {
        const tag = el.dataset.tag;
        toggleTagFilter(tag);
      });
    });
  }

  /* --------------------------
     Search + Filters helpers
     -------------------------- */
  function filteredPosts(){
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const cat = (document.getElementById('categorySelect')?.value || 'all');
    const activeTag = document.querySelector('.tag.active')?.dataset.tag;
    return posts.filter(p=>{
      if (cat !== 'all' && (p.category||'').toLowerCase() !== cat.toLowerCase()) return false;
      if (activeTag && !(p.tags||[]).map(t=>t.toLowerCase()).includes(activeTag.toLowerCase())) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.excerpt || ''} ${(p.tags||[]).join(' ')}`.toLowerCase();
      return hay.includes(q);
    }).sort((a,b)=> new Date(b.date) - new Date(a.date));
  }

  function toggleTagFilter(tag){
    // clicking toggles active
    const all = document.querySelectorAll('.tag');
    all.forEach(t=> t.classList.toggle('active', t.dataset.tag===tag && !t.classList.contains('active')));
    // if clicked active becomes active, others off
    all.forEach(t=> {
      if (t.dataset.tag !== tag) t.classList.remove('active');
    });
    renderGrid(true);
  }

  function clearTagFilter(){
    document.querySelectorAll('.tag').forEach(t=> t.classList.remove('active'));
  }

  /* --------------------------
     Single post rendering
     -------------------------- */
  async function renderPostFromQuery(){
    await loadPosts();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const slug = params.get('slug');
    let post;
    if (id) post = posts.find(p=> p.id === id);
    if (!post && slug) post = posts.find(p => p.slug === slug);
    if (!post) {
      document.getElementById('postArticle').innerHTML = '<p>Post not found.</p>';
      return;
    }
    renderPost(post);
    renderRelated(post);
  }

  function renderPost(p){
    const hero = document.getElementById('postHero');
    const body = document.getElementById('postBody');
    hero.innerHTML = `<h1 class="hero-title">${escape(p.title)}</h1>
                      <p class="meta">${escape(p.date)} • ${escape(p.author || 'FAYM')} • ${escape(p.category)}</p>
                      <img src="${escape(p.image || `https://picsum.photos/seed/${encodeURIComponent(p.id)}/1600/900`)}" alt="${escape(p.title)}">`;
    body.innerHTML = `<div class="post-content">${p.content || `<p>${escape(p.excerpt||'')}</p>`}</div>`;
  }

  function renderRelated(post){
    const relatedEl = document.getElementById('relatedPosts');
    if (!relatedEl) return;
    const rel = posts.filter(p => p.id !== post.id && (p.category === post.category || (p.tags||[]).some(t=> (post.tags||[]).includes(t)) )).slice(0,3);
    relatedEl.innerHTML = rel.map(r => `<article class="post-card">
        <img src="${escape(r.image||`https://picsum.photos/seed/${encodeURIComponent(r.id)}/1200/800`)}" alt="">
        <div class="post-body" style="padding:12px"><div class="meta">${escape(r.date)}</div><h3><a href="blog-post.html?id=${encodeURIComponent(r.id)}">${escape(r.title)}</a></h3></div>
      </article>`).join('') || '<p>No related posts found.</p>';
  }

  /* --------------------------
     Utilities & sample generator
     -------------------------- */
  function escape(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function escapeAttr(s=''){ return String(s).replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

  function randomDateString(){
    const start = new Date(2023,0,1).getTime();
    const end = new Date().getTime();
    const d = new Date(start + Math.random() * (end - start));
    return d.toISOString().slice(0,10);
  }

  function genId(i){ return `post-${i+1}`; }

  function generateSamplePosts(count=50){
    const titles = [
      "Minimal Styling for Modern Wardrobes","The Art of Layering","How to Choose the Perfect Hoodie",
      "Sustainable Fabrics You Should Know","Styling Accessories Like a Pro","Modern Streetwear Essentials",
      "The Rise of Neutral Tones","Care Guide for Luxury Garments","How to Build a Capsule Wardrobe",
      "Top 10 Wardrobe Staples for Men","The Best Fabrics for Summer","Winter Outfit Ideas","Workwear Essentials",
      "Shoes That Elevate Any Outfit","How to Mix Textures","Transitional Pieces for Every Season","Styling with Scarves",
      "Fashion Photography: Behind the Scenes","The Story Behind Our Brand","Travel Friendly Outfits",
      "Color Theory for Clothing","Monochrome Looks Masterclass","Athleisure Done Right","How to Choose Sunglasses",
      "The Minimalist's Guide to Prints","Denim That Lasts","How to Pack Light & Stylish","Behind the Design: Hoodie",
      "Style Icons Who Inspire Us","A Guide to Tailoring","From Sketch to Product: Our Process","The Ethics of Fashion",
      "The Future of Menswear","Streetwear Brands To Watch","How To Wear Patterns", "Layering for Rainy Days",
      "Choosing The Right Jacket","The Best Bags For Travel","Affordable Luxury Picks","How To Style Oversized",
      "The Black Shirt — Why It Works","Summer Fabrics Explained","Trans-seasonal Pieces","Print Mixing 101",
      "How To Create Contrast","Accessories That Transform","Day to Night Outfits","Choosing Sunglasses Frame",
      "How We Source Materials"
    ];
    const cats = ["Style","Trends","Sustainability","How-to","Brand"];
    const tagsPool = ["Minimal","Hoodie","Styling","Sustainable","Travel","Streetwear","Layering","Denim","Accessories","Care"];

    const arr = [];
    for (let i=0;i<count;i++){
      const title = titles[i % titles.length] + (i>titles.length-1 ? ` ${i}` : '');
      const slug = title.toLowerCase().replace(/\W+/g,'-').replace(/^-|-$/g,'');
      const cat = cats[i % cats.length];
      const tags = shuffle(tagsPool).slice(0, 3 + (i%2)).map(s=>s);
      const img = (i%5 === 0) ? '/mnt/data/2df58a6fd1aeac33a1b828e2c3f5d05d.jpg' : `https://picsum.photos/seed/blog${i}/1200/800`;
      arr.push({
        id: genId(i),
        title,
        slug,
        date: randomDateString(),
        author: i%3===0 ? "Favour Adebowale" : (i%3===1 ? "M. Adeyemi" : "Team FAYM"),
        category: cat,
        tags,
        excerpt: `A short intro to ${title}. Read on for styling tips and product picks.`,
        image: img,
        content: `<p>This is a sample article body for <strong>${title}</strong>. Use this content as a placeholder. Replace with your real article HTML.</p><p>Tip: Keep paragraphs short and use subheadings for scannability.</p><h3>Highlights</h3><ul><li>Quality over quantity</li><li>Choose neutral palettes</li><li>Invest in fit</li></ul>`
      });
    }
    return arr;
  }

  function shuffle(a){ return a.slice().sort(()=>Math.random() - 0.5); }

  // public API
  return {
    initList,
    renderPostFromQuery,
    _internal: { loadPosts, generateSamplePosts }
  };

})();
