// admin/aktuality_grid.js
// Visual grid editor embedded directly in admin/aktuality.php.
(function(){
  'use strict';

  const root = document.getElementById('aktualityAdminGrid');
  if(!root) return;

  const gridEl = document.getElementById('newsGridAdmin');
  const statusEl = document.getElementById('newsGridStatus');
  const btnSave = document.getElementById('btnNewsGridSave');
  // (row controls are rendered into the actions bar)
  const toastOk = document.getElementById('toastOk');

  if(!gridEl){
    console.warn('[aktuality_grid] #newsGridAdmin not found');
    return;
  }

  const lang = document.documentElement.lang || 'cs';

  const state = {
    gridCols: parseInt(root.dataset.gridCols || '2', 10) || 2,
    // rows are now dynamic; initial is from DOM, but can grow
    gridRows: parseInt(root.dataset.gridRows || '8', 10) || 8,
    gridRowsManual: parseInt(root.dataset.gridRows || '8', 10) || 8,
    rowsMode: 'manual', // 'manual' | 'auto'
    items: [],
    posts: [],
    draggingPostId: null,
  };

  let dirty = false;
  function markDirty(){
    dirty = true;
  }

  function showToastOk(msg){
    if(!toastOk) return;
    toastOk.textContent = msg || 'Uloženo.';
    toastOk.classList.add('is-show');
    toastOk.style.display = '';
    // auto-hide like admin/index.php
    setTimeout(()=>{
      toastOk.classList.remove('is-show');
      toastOk.style.display = 'none';
    }, 3500);
  }

  function setStatus(msg, isError){
    if(!statusEl){
      if(msg) console[isError ? 'error' : 'log']('[aktuality_grid]', msg);
      return;
    }
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#b00020' : '#111';
  }

  function rectOverlap(a,b){
    return (a.x < b.x + b.w) && (a.x + a.w > b.x) && (a.y < b.y + b.h) && (a.y + a.h > b.y);
  }

  function maxBottomY(items){
    let m = 0;
    for(const it of items){
      m = Math.max(m, it.y + it.h);
    }
    return m;
  }

  function recomputeRows(items){
    const neededByTiles = maxBottomY(items);
    if(state.rowsMode === 'auto'){
      state.gridRows = Math.max(neededByTiles, 1);
    } else {
      state.gridRows = Math.max(state.gridRowsManual, neededByTiles, 1);
    }
    gridEl.style.setProperty('--rows', String(state.gridRows));
  }

  function ensureRowsFor(items){
    // Keep for backwards compatibility with existing calls; now uses recomputeRows.
    recomputeRows(items);
  }

  function tileTitle(p){
    const t = (lang === 'en') ? (p.title_en || p.title_cs) : (p.title_cs || p.title_en);
    return t || ('#' + p.post_id);
  }

  function tileTextPreview(p){
    if(!p) return '';
    const perex = (lang === 'en') ? (p.perex_en || p.perex_cs) : (p.perex_cs || p.perex_en);
    const bodyHtml = (lang === 'en') ? (p.body_en || p.body_cs) : (p.body_cs || p.body_en);

    // Convert HTML to plain text safely.
    const tmp = document.createElement('div');
    tmp.innerHTML = String(bodyHtml || '');
    const bodyText = (tmp.textContent || '').trim();

    const parts = [String(perex || '').trim(), bodyText].filter(Boolean);
    const text = parts.join('\n\n').trim();
    if(!text) return '';
    const max = 900; // keep tile readable
    return text.length > max ? (text.slice(0, max) + '…') : text;
  }

  function resolveAssetPath(path) {
    const p0 = String(path || '');
    if (!p0) return p0;

    // Normalize slashes and trim leading ./
    let p = p0.replace(/\\/g, '/').replace(/^\.\/+/, '');

    // Normalize legacy values that include ../Images/... (make it root-relative)
    if (p.startsWith('../Images/')) return '/' + p.slice(3); // "../Images/x" -> "/Images/x"

    // Absolute and protocol-relative
    if (/^(https?:)?\/\//i.test(p) || p.startsWith('/')) return p;

    // Keep other ../ paths as-is (legacy uploads etc.)
    if (p.startsWith('../')) return p;

    // admin/aktuality.php is one level deeper than site root
    if (p.startsWith('Images/')) {
      return '/' + p; // root-relative is safest
    }

    return p;
  }

  function cssUrlEscape(url){
    // Make as safe as possible for CSS url(...)
    const u = encodeURI(String(url || ''));
    return u.replace(/"/g, '%22').replace(/\)/g, '%29').replace(/\(/g, '%28');
  }

  function cssUrlValue(url){
    // Returns a value suitable for element.style.backgroundImage
    // Always quote and URI-encode to handle spaces/diacritics safely.
    const u = encodeURI(String(url || ''))
      .replace(/"/g, '%22')
      .replace(/\)/g, '%29')
      .replace(/\(/g, '%28');
    return `url("${u}")`;
  }

  // --- Row controls (add/remove rows of cells) ---
  // This affects editor workspace height and is persisted via API as grid_rows.

  function ensureRowControls(){
    const head = root.querySelector('.ng-head');
    if(!head) return;
    const bar = head.querySelector('.ng-actionsbar');
    if(!bar) return;

    // Avoid duplicates
    if(bar.querySelector('.ng-row-controls')) return;

    const wrap = document.createElement('div');
    wrap.className = 'ng-row-controls';

    const label = document.createElement('span');
    label.className = 'ng-rows-label';
    label.textContent = (lang === 'en') ? 'Rows:' : 'Řádky:';

    const btnAdd = document.createElement('button');
    btnAdd.type = 'button';
    btnAdd.className = 'ng-btn';
    btnAdd.id = 'btnGridRowAdd';
    btnAdd.title = (lang === 'en') ? 'Add one empty row of cells' : 'Přidat prázdný řádek políček';
    btnAdd.textContent = (lang === 'en') ? '+ row' : '+ řádek';

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'ng-btn';
    btnRemove.id = 'btnGridRowRemove';
    btnRemove.title = (lang === 'en') ? 'Remove the last empty row' : 'Odebrat poslední prázdný řádek';
    btnRemove.textContent = (lang === 'en') ? '− row' : '− řádek';

    const counter = document.createElement('span');
    counter.className = 'ng-rows-counter';
    counter.setAttribute('aria-live', 'polite');

    wrap.appendChild(label);
    wrap.appendChild(btnAdd);
    wrap.appendChild(btnRemove);
    wrap.appendChild(counter);

    // Put before Save if possible
    const saveBtn = bar.querySelector('#btnNewsGridSave');
    if(saveBtn && saveBtn.parentNode === bar){
      bar.insertBefore(wrap, saveBtn);
    } else {
      bar.appendChild(wrap);
    }

    btnAdd.addEventListener('click', ()=> addRow(1));
    btnRemove.addEventListener('click', ()=> removeRow(1));

    // store refs
    bar._ngRowCounter = counter;
    bar._ngRowRemoveBtn = btnRemove;

    // initial state
    try { updateRowControlsUI(); } catch (e) {}
  }

  function getPost(postId){
    return state.posts.find(p=>p.post_id===postId) || null;
  }

  function cellKey(x,y){ return `${x}:${y}`; }

  function occupiedMap(items = state.items){
    const occ = new Map();
    for(const it of items){
      for(let dy=0; dy<it.h; dy++){
        for(let dx=0; dx<it.w; dx++){
          occ.set(cellKey(it.x+dx, it.y+dy), it.post_id);
        }
      }
    }
    return occ;
  }

  function overlapsAny(candidate, items){
    for(const it of items){
      if(it.post_id === candidate.post_id) continue;
      if(rectOverlap(candidate, it)) return true;
    }
    return false;
  }

  function canFitBounds(x,y,w,h){
    if(x < 0 || y < 0) return false;
    if(![1,2].includes(w) || ![1,2].includes(h)) return false;
    if(x + w > state.gridCols) return false;
    return true; // y can grow
  }

  /**
   * Push-down placement:
   * - We place the moving tile at (x,y,w,h)
   * - If it collides, we push colliding tiles down (and cascades) until stable.
   * - This prefers minimal movement and keeps X positions.
   */
  function placeWithPush(postId, x, y, w, h){
    if(!canFitBounds(x,y,w,h)) return {ok:false, error:'Mimo mřížku'};

    const moving = state.items.find(it=>it.post_id===postId);
    if(!moving) return {ok:false, error:'Neznámý post'};

    // Clone items for simulation
    const items = state.items.map(it => ({...it}));
    const m = items.find(it=>it.post_id===postId);
    m.x = x; m.y = y; m.w = w; m.h = h;

    // Cascade: while there is any overlap, push down the ones that overlap.
    let changed = true;
    let guard = 0;
    while(changed && guard++ < 500){
      changed = false;

      for(const it of items){
        if(it.post_id === postId) continue;
        if(rectOverlap(m, it)){
          // push this tile just below moving tile
          it.y = m.y + m.h;
          changed = true;
        }
      }

      // Now resolve overlaps between non-moving tiles as well by scanning top-down.
      const sorted = [...items].sort((a,b)=> (a.y-b.y) || (a.x-b.x) || (a.post_id-b.post_id));
      for(let i=0;i<sorted.length;i++){
        for(let j=i+1;j<sorted.length;j++){
          const a = sorted[i];
          const b = sorted[j];
          if(a.post_id === b.post_id) continue;
          if(rectOverlap(a,b)){
            // push lower priority one down below the other (the one with bigger y stays, push the other down)
            if(a.y <= b.y){
              b.y = a.y + a.h;
            } else {
              a.y = b.y + b.h;
            }
            changed = true;
          }
        }
      }
    }

    if(guard >= 500) return {ok:false, error:'Nelze vyřešit kolize'};

    // Apply back
    state.items = items;
    ensureRowsFor(state.items);
    render();
    return {ok:true};
  }

  function render(){
    gridEl.style.setProperty('--cols', String(state.gridCols));
    gridEl.style.setProperty('--rows', String(state.gridRows));
    ensureRowsFor(state.items);

    gridEl.innerHTML = '';

    // background cells with plus
    const occ = occupiedMap();
    for(let y=0;y<state.gridRows;y++){
      for(let x=0;x<state.gridCols;x++){
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'ng-cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.style.gridColumn = `${x+1} / span 1`;
        cell.style.gridRow = `${y+1} / span 1`;

        const isOcc = occ.has(cellKey(x,y));
        cell.disabled = isOcc;
        cell.innerHTML = '<span class="ng-plus">+</span>';
        cell.addEventListener('click', ()=>{
          if(isOcc) return;
          // open editor in "create" mode (empty values); on save it will create a new post and place it here
          openPostEditor({mode:'create', x, y}).catch(err=>setStatus(err.message,true));
        });

        gridEl.appendChild(cell);
      }
    }

    // tiles (rendered as final .news-card)
    for(const it of state.items){
      const post = getPost(it.post_id) || {post_id: it.post_id, title_cs: '', title_en: '', perex_cs:'', perex_en:'', body_cs:'', body_en:'', badge:'', date:'', image:''};

      const card = document.createElement('article');
      card.className = 'news-card ng-tile-card';
      card.dataset.postId = String(it.post_id);
      card.draggable = true;
      card.style.gridColumn = `${it.x+1} / span ${it.w}`;
      card.style.gridRow = `${it.y+1} / span ${it.h}`;

      const bg = document.createElement('div');
      bg.className = 'news-card__bg';
      bg.setAttribute('aria-hidden', 'true');
      if(post.image){
        const resolved = resolveAssetPath(post.image);
        if(resolved){
          bg.style.backgroundImage = cssUrlValue(resolved);
        }
      }

      const overlay = document.createElement('div');
      overlay.className = 'news-card__overlay';
      overlay.setAttribute('aria-hidden', 'true');

      const content = document.createElement('div');
      content.className = 'news-card__content';

      const chip = document.createElement('span');
      chip.className = 'news-chip';
      chip.textContent = (post.badge || post.date || '').trim();

      const title = document.createElement('h2');
      title.className = 'news-title';
      title.textContent = tileTitle(post);

      const perex = document.createElement('p');
      perex.className = 'news-perex';
      // show full post text preview (perex + body) to match request
      perex.textContent = tileTextPreview(post);

      const cta = document.createElement('span');
      cta.className = 'news-cta';
      cta.textContent = (lang === 'en') ? 'Read' : 'Přečíst';
      cta.setAttribute('aria-hidden', 'true');

      // Click on tile opens editor
      card.addEventListener('click', (ev)=>{
        // ignore clicks on overlay action buttons
        const t = ev.target;
        if(t && t.closest && t.closest('.ng-actions')) return;
        openPostEditor({mode:'edit', postId: it.post_id}).catch(err=>setStatus(err.message,true));
      });

      content.appendChild(chip);
      content.appendChild(title);
      content.appendChild(perex);
      content.appendChild(cta);

      // Admin overlay actions (resize/remove)
      const actions = document.createElement('div');
      actions.className = 'ng-actions ng-actions--overlay';
      actions.innerHTML = `
        <button type="button" data-size="1x1">1×1</button>
        <button type="button" data-size="2x1">2×1</button>
        <button type="button" data-size="1x2">1×2</button>
        <button type="button" data-size="2x2">2×2</button>
        <button type="button" data-action="edit">${lang === 'en' ? 'Edit' : 'Upravit'}</button>
        <button type="button" data-action="remove">Odebrat</button>
      `;

      // Edit action
      actions.querySelector('[data-action="edit"]').addEventListener('click', (ev)=>{
        ev.stopPropagation();
        openPostEditor({mode:'edit', postId: it.post_id}).catch(err=>setStatus(err.message,true));
      });

      actions.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const size = b.getAttribute('data-size');
        const [wStr,hStr] = size.split('x');
        const w = parseInt(wStr,10), h = parseInt(hStr,10);
        const res = placeWithPush(it.post_id, it.x, it.y, w, h);
        if(res.ok){
          markDirty();
          setStatus('Velikost změněna. Nezapomeň uložit.');
        } else {
          setStatus(res.error || 'Nelze změnit velikost.', true);
        }
      }));

      actions.querySelector('[data-action="remove"]').addEventListener('click', async (ev)=>{
        ev.stopPropagation();

        const ok = window.confirm(lang === 'en'
          ? 'Delete this post permanently? (This will remove it from DB)'
          : 'Opravdu smazat tento příspěvek? (Smaže se z databáze)'
        );
        if(!ok) return;

        try {
          const res = await fetch('/admin/api/news_post_delete.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type':'application/json','Accept':'application/json'},
            body: JSON.stringify({id: it.post_id, gc: true})
          });

          const txt = await res.text();
          let data;
          try { data = JSON.parse(txt); } catch (e) { throw new Error('news_post_delete.php nevrátil JSON:\n' + txt.slice(0, 800)); }

          if(!res.ok || !data.ok){
            throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Delete failed');
          }

          // Remove from local state
          state.items = state.items.filter(x=>x.post_id!==it.post_id);
          state.posts = state.posts.filter(p=>p.post_id!==it.post_id);
          ensureRowsFor(state.items);

          // Persist layout change immediately
          await save();

          render();

          const delFiles = (data.deleted_files && data.deleted_files.length) ? `\nSmazané obrázky: ${data.deleted_files.join(', ')}` : '';
          setStatus((lang === 'en') ? 'Deleted.' : 'Smazáno.' + delFiles);
          showToastOk((lang === 'en') ? 'Post deleted.' : 'Příspěvek smazán.');
        } catch (e) {
          setStatus(e && e.message ? e.message : String(e), true);
        }
      });

      card.appendChild(bg);
      card.appendChild(overlay);
      card.appendChild(content);
      card.appendChild(actions);

      card.addEventListener('dragstart', (e)=>{
        state.draggingPostId = it.post_id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(it.post_id));
      });
      card.addEventListener('dragend', ()=>{ state.draggingPostId = null; gridEl.classList.remove('is-dragover'); });

      gridEl.appendChild(card);
    }

    // row controls
    // (removed)

    // Update row UI (buttons/counter)
    updateRowControlsUI();
  }

  function gridPointFromEvent(e){
    // snap to actual cell under pointer
    const rect = gridEl.getBoundingClientRect();
    const cols = state.gridCols;
    const rows = state.gridRows;
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    const relX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height - 1, e.clientY - rect.top));

    const x = Math.floor(relX / cellW);
    const y = Math.floor(relY / cellH);

    return {x, y};
  }

  function setupDnD(){
    gridEl.addEventListener('dragover', (e)=>{
      e.preventDefault();
      gridEl.classList.add('is-dragover');
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    gridEl.addEventListener('dragleave', ()=> gridEl.classList.remove('is-dragover'));

    gridEl.addEventListener('drop', (e)=>{
      e.preventDefault();
      gridEl.classList.remove('is-dragover');
      const postId = parseInt((e.dataTransfer && e.dataTransfer.getData('text/plain')) || '0', 10);
      if(!postId) return;

      const it = state.items.find(x=>x.post_id===postId);
      if(!it) return;

      const cell = gridPointFromEvent(e);
      const res = placeWithPush(postId, cell.x, cell.y, it.w, it.h);
      if(res.ok){
        markDirty();
        setStatus('Přesunuto. Nezapomeň uložit.');
      } else {
        setStatus(res.error || 'Nelze přesunout.', true);
      }
    });
  }

  async function load(){
    const [postsRes, layoutRes] = await Promise.all([
      fetch('/admin/api/news_posts.php', {credentials:'same-origin', headers:{'Accept':'application/json'}}),
      fetch('/admin/api/news_layout.php', {credentials:'same-origin', headers:{'Accept':'application/json'}})
    ]);

    const postsText = await postsRes.text();
    const layoutText = await layoutRes.text();

    if (!postsRes.ok) {
      throw new Error(`news_posts.php HTTP ${postsRes.status}:\n` + postsText.slice(0, 1200));
    }
    if (!layoutRes.ok) {
      throw new Error(`news_layout.php HTTP ${layoutRes.status}:\n` + layoutText.slice(0, 1200));
    }

    let posts, layout;
    try { posts = JSON.parse(postsText); } catch (e) { throw new Error('news_posts.php nevrátil JSON:\n' + postsText.slice(0, 1200)); }
    try { layout = JSON.parse(layoutText); } catch (e) { throw new Error('news_layout.php nevrátil JSON:\n' + layoutText.slice(0, 1200)); }

    if(!posts.ok) throw new Error((posts.errors||[]).join('\n') || 'posts api failed');
    if(!layout.ok) throw new Error((layout.errors||[]).join('\n') || 'layout api failed');

    // Apply persisted rows (if present)
    try {
      const persistedRows = layout && layout.layout && typeof layout.layout.grid_rows !== 'undefined'
        ? parseInt(String(layout.layout.grid_rows), 10)
        : NaN;
      if(Number.isFinite(persistedRows) && persistedRows > 0){
        state.gridRowsManual = persistedRows;
        // reflect in DOM dataset for any later reads
        root.dataset.gridRows = String(persistedRows);
        // ensure effect is visible even before items are applied
        state.rowsMode = 'manual';
        recomputeRows(state.items);
      }
    } catch (e) {}

    state.posts = (posts.items || []).map(p => ({
      post_id: p.id,
      badge: p.badge,
      image: p.image,
      date: p.date,
      title_cs: p.title_cs,
      title_en: p.title_en,
      perex_cs: p.perex_cs,
      perex_en: p.perex_en,
      body_cs: p.body_cs,
      body_en: p.body_en,
    }));

    if(!layout.items || layout.items.length === 0){
      // default mapping when layout is empty: fill 2×N (alternate columns)
      const sorted = [...state.posts].sort((a,b)=>a.post_id-b.post_id);
      const items = [];
      let i = 0;
      for(const p of sorted){
        const x = i % state.gridCols;
        const y = Math.floor(i / state.gridCols);
        items.push({post_id:p.post_id, x, y, w:1, h:1});
        i++;
      }

      state.items = items;
      ensureRowsFor(state.items);
    } else {
      state.items = layout.items.map(it=>({post_id:it.post_id,x:it.x,y:it.y,w:it.w,h:it.h}));
      ensureRowsFor(state.items);
    }

    // default: keep manual rows, but ensure enough for tiles
    state.rowsMode = 'manual';
    state.gridRowsManual = Math.max(state.gridRowsManual || 1, 1);

    ensureRowsFor(state.items);
    // make sure --rows matches persisted manual rows (or neededByTiles)
    recomputeRows(state.items);
    render();
    setStatus('Načteno.');
  }

  async function save(){
    const payload = {
      grid_cols: state.gridCols,
      grid_rows: state.gridRowsManual,
      items: state.items.map(it => ({post_id: it.post_id, x: it.x, y: it.y, w: it.w, h: it.h}))
    };
    const res = await fetch('/admin/api/news_layout.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(payload)
    });

    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (e) { throw new Error('Uložení nevrátilo JSON:\n' + txt.slice(0, 800)); }

    if(!data.ok){
      setStatus('Uložení selhalo: ' + (data.errors||[]).join(' | '), true);
      return;
    }

    dirty = false;
    showToastOk('Změny byly uloženy.');

    // refresh preview on the same page
    try {
      if (window.aktuality && typeof window.aktuality.refresh === 'function') {
        window.aktuality.refresh();
      }
    } catch (e) {}

    // refresh any other open tabs (public aktuality.php etc.)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('alabarte_news_layout');
        ch.postMessage({type:'layout_saved', layout:'aktuality_default', t:Date.now()});
        ch.close();
      }
    } catch (e) {}

    setStatus('Uloženo.');
  }

  btnSave && btnSave.addEventListener('click', ()=> save().catch(err=>setStatus(err.message,true)));
  // (row controls are handled by ensureRowControls())

  // --- Row controls (add/remove rows of cells) ---
  // This affects editor workspace height and is persisted via API as grid_rows.
  function neededRowsByTiles(){
    return Math.max(maxBottomY(state.items), 1);
  }

  function canRemoveRow(){
    // Removing 1 row is allowed only if it won't cut off any existing item.
    const after = Math.max((state.gridRowsManual || 1) - 1, 1);
    return neededRowsByTiles() <= after;
  }

  function addRow(count = 1){
    const n = Math.max(1, parseInt(String(count), 10) || 1);
    state.rowsMode = 'manual';
    state.gridRowsManual = Math.max(1, (state.gridRowsManual || 1) + n);
    recomputeRows(state.items);
    render();
    markDirty();
    setStatus((lang === 'en') ? 'Row added. Don\'t forget to save.' : 'Řádek přidán. Nezapomeň uložit.');
  }

  function removeRow(count = 1){
    const n = Math.max(1, parseInt(String(count), 10) || 1);
    state.rowsMode = 'manual';

    let removed = 0;
    for(let i=0;i<n;i++){
      if(!canRemoveRow()) break;
      state.gridRowsManual = Math.max(1, (state.gridRowsManual || 1) - 1);
      removed++;
    }

    if(removed === 0){
      setStatus(
        (lang === 'en')
          ? 'Cannot remove: there are items in the last row.'
          : 'Nelze odebrat: v posledním řádku už jsou položky.',
        true
      );
      return;
    }

    recomputeRows(state.items);
    render();
    markDirty();
    setStatus((lang === 'en') ? 'Row removed. Don\'t forget to save.' : 'Řádek odebrán. Nezapomeň uložit.');
  }

  function updateRowControlsUI(){
    const bar = root.querySelector('.ng-actionsbar');
    if(!bar) return;
    const counter = bar._ngRowCounter;
    const btnRemove = bar._ngRowRemoveBtn;

    if(counter){
      const needed = neededRowsByTiles();
      counter.textContent = `${state.gridRowsManual} (min ${needed})`;
      counter.title = (lang === 'en')
        ? `Saved rows: ${state.gridRowsManual}. Minimum required by tiles: ${needed}.`
        : `Uložené řádky: ${state.gridRowsManual}. Minimum podle dlaždic: ${needed}.`;
    }
    if(btnRemove){
      btnRemove.disabled = !canRemoveRow();
    }
  }

  function ensureRowControls(){
    const head = root.querySelector('.ng-head');
    if(!head) return;
    const bar = head.querySelector('.ng-actionsbar');
    if(!bar) return;

    if(bar.querySelector('.ng-row-controls')) return;

    const wrap = document.createElement('div');
    wrap.className = 'ng-row-controls';

    const label = document.createElement('span');
    label.className = 'ng-rows-label';
    label.textContent = (lang === 'en') ? 'Rows:' : 'Řádky:';

    const btnAdd = document.createElement('button');
    btnAdd.type = 'button';
    btnAdd.className = 'ng-btn';
    btnAdd.id = 'btnGridRowAdd';
    btnAdd.title = (lang === 'en') ? 'Add one empty row of cells' : 'Přidat prázdný řádek políček';
    btnAdd.textContent = (lang === 'en') ? '+ row' : '+ řádek';

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'ng-btn';
    btnRemove.id = 'btnGridRowRemove';
    btnRemove.title = (lang === 'en') ? 'Remove the last empty row' : 'Odebrat poslední prázdný řádek';
    btnRemove.textContent = (lang === 'en') ? '− row' : '− řádek';

    const counter = document.createElement('span');
    counter.className = 'ng-rows-counter';
    counter.setAttribute('aria-live', 'polite');

    wrap.appendChild(label);
    wrap.appendChild(btnAdd);
    wrap.appendChild(btnRemove);
    wrap.appendChild(counter);

    const saveBtn = bar.querySelector('#btnNewsGridSave');
    if(saveBtn && saveBtn.parentNode === bar){
      bar.insertBefore(wrap, saveBtn);
    } else {
      bar.appendChild(wrap);
    }

    btnAdd.addEventListener('click', ()=> addRow(1));
    btnRemove.addEventListener('click', ()=> removeRow(1));

    bar._ngRowCounter = counter;
    bar._ngRowRemoveBtn = btnRemove;

    updateRowControlsUI();
  }

  // Initial paint so user always sees grid cells even if API fails.
  try {
    ensureRowControls();
    gridEl.style.setProperty('--cols', String(state.gridCols));
    gridEl.style.setProperty('--rows', String(state.gridRows));
    render();
  } catch (e) {
    console.error('[aktuality_grid] initial render failed', e);
  }

  try {
    setupDnD();
  } catch (e) {
    console.error('[aktuality_grid] setupDnD failed', e);
    setStatus('Chyba inicializace drag&drop: ' + (e && e.message ? e.message : String(e)), true);
  }

  load().catch(err=>setStatus(err.message,true));

  // --- Post editor (create/edit) ---
  function escapeHtml(s){
    return String(s ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function ensurePostEditorDialog(){
    let dlg = document.getElementById('ngPostEditorPanel');
    if(dlg) return dlg;

    // Editor panel without fullscreen modal/backdrop
    dlg = document.createElement('div');
    dlg.id = 'ngPostEditorPanel';
    dlg.className = 'ng-editor-panel';
    dlg.setAttribute('aria-hidden', 'true');

    dlg.innerHTML = `
      <div class="ng-editor-panel__inner" role="dialog" aria-modal="true" aria-labelledby="ngPostEditorTitle">
        <button class="ng-editor-panel__close" type="button" aria-label="${lang === 'en' ? 'Close' : 'Zavřít'}" data-close="true">✕</button>

        <form class="ng-editor-panel__grid" autocomplete="off">
          <div class="ng-editor-panel__media">
            <img id="ngPostEditorPreview" src="" alt="" />
          </div>

          <div class="ng-editor-panel__content">
            <div class="ng-editor-panel__topline">
              <h2 class="ng-editor-panel__title" id="ngPostEditorTitle">${lang === 'en' ? 'Edit post' : 'Upravit příspěvek'}</h2>
            </div>

            <div class="ng-editorform">
              <div class="ng-editorrow">
                <label class="ng-field">
                  <span>Badge</span>
                  <input name="badge" type="text" maxlength="60" />
                </label>
                <label class="ng-field">
                  <span>${lang === 'en' ? 'Date label' : 'Datum (text)'}</span>
                  <input name="date" type="text" maxlength="32" placeholder="02/2026" />
                </label>
              </div>

              <div class="ng-upload">
                <div class="ng-upload__title">${lang === 'en' ? 'Change image' : 'Změnit obrázek'}</div>
                <label class="ng-upload__btn">
                  <input id="ngPostEditorImageFile" name="image_file" type="file" accept="image/jpeg,image/png,image/webp" />
                  <span>${lang === 'en' ? 'Upload image' : 'Nahrát obrázek'}</span>
                </label>
                <small class="ng-help">${lang === 'en' ? 'JPG/PNG/WebP, max ~6 MB' : 'JPG/PNG/WebP, max ~6 MB'}</small>
              </div>

              <div class="ng-langtabs" role="tablist" aria-label="Language">
                <button type="button" class="ng-langtab is-active" data-langtab="cs">CS</button>
                <button type="button" class="ng-langtab" data-langtab="en">EN</button>
              </div>

              <section class="ng-langpane is-active" data-langpane="cs">
                <label class="ng-field ng-field--full">
                  <span>Title (CS)</span>
                  <input name="title_cs" type="text" required maxlength="255" />
                </label>
                <label class="ng-field ng-field--full">
                  <span>Perex (CS)</span>
                  <textarea name="perex_cs" rows="3"></textarea>
                </label>
                <label class="ng-field ng-field--full">
                  <span>Body (CS)</span>
                  <textarea name="body_cs" rows="10"></textarea>
                  <small class="ng-help">${lang === 'en' ? 'You can paste HTML.' : 'Můžeš vložit HTML.'}</small>
                </label>
              </section>

              <section class="ng-langpane" data-langpane="en">
                <label class="ng-field ng-field--full">
                  <span>Title (EN)</span>
                  <input name="title_en" type="text" maxlength="255" />
                </label>
                <label class="ng-field ng-field--full">
                  <span>Perex (EN)</span>
                  <textarea name="perex_en" rows="3"></textarea>
                </label>
                <label class="ng-field ng-field--full">
                  <span>Body (EN)</span>
                  <textarea name="body_en" rows="10"></textarea>
                </label>
              </section>

              <div class="ng-editor-actions">
                <button type="button" class="ng-btn" data-action="cancel">${lang === 'en' ? 'Cancel' : 'Zrušit'}</button>
                <button type="submit" class="ng-btn ng-btn--primary" data-action="save">${lang === 'en' ? 'Save' : 'Uložit'}</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dlg);

    // Close bindings + language tabs
    dlg.addEventListener('click', (e)=>{
      const t = e.target;
      const closeHit = t && t.closest ? t.closest('[data-close="true"]') : null;
      if(closeHit) closePostEditor();

      const tab = t && t.closest ? t.closest('[data-langtab]') : null;
      if(tab){
        e.preventDefault();
        const langKey = tab.getAttribute('data-langtab');
        dlg.querySelectorAll('[data-langtab]').forEach(b=>b.classList.toggle('is-active', b.getAttribute('data-langtab')===langKey));
        dlg.querySelectorAll('[data-langpane]').forEach(p=>p.classList.toggle('is-active', p.getAttribute('data-langpane')===langKey));
      }
    });

    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && dlg.classList.contains('is-open')){
        closePostEditor();
      }
    });

    return dlg;
  }

  async function apiUploadNewsImage(file){
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/admin/api/news_image_upload.php', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      body: fd,
      headers: {
        'Accept':'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (e) { throw new Error('news_image_upload.php nevrátil JSON:\n' + txt.slice(0, 800)); }
    if(!res.ok || !data.ok) throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Image upload failed');
    return String(data.path || '');
  }

  function readEditorForm(dlg){
    const f = dlg.querySelector('form');
    const fd = new FormData(f);
    const get = (k)=> String(fd.get(k) ?? '');
    return {
      badge: get('badge').trim(),
      date: get('date').trim(),
      image: String(dlg.dataset.uploadedImage || '').trim(),
      title_cs: get('title_cs').trim(),
      perex_cs: get('perex_cs'),
      body_cs: get('body_cs'),
      title_en: get('title_en').trim(),
      perex_en: get('perex_en'),
      body_en: get('body_en'),
    };
  }

  function fillEditorForm(dlg, post){
    const p = post || {};
    const set = (name, val)=>{
      const el = dlg.querySelector(`[name="${cssEscape(name)}"]`);
      if(el) el.value = String(val ?? '');
    };
    set('badge', p.badge || '');
    set('date', p.date || '');
    set('title_cs', p.title_cs || '');
    set('perex_cs', p.perex_cs || '');
    set('body_cs', p.body_cs || '');
    set('title_en', p.title_en || '');
    set('perex_en', p.perex_en || '');
    set('body_en', p.body_en || '');
  }

  async function apiCreateEmptyPost(){
    const res = await fetch('/admin/api/news_create.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({
        title_cs: (lang === 'en' ? 'New post' : 'Nový příspěvek'),
        title_en: (lang === 'en' ? 'New post' : 'Nový příspěvek'),
        perex_cs: '',
        perex_en: '',
        body_cs: '',
        body_en: '',
        badge: '',
        image: '',
        date: '',
      })
    });
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (e) { throw new Error('news_create.php nevrátil JSON:\n' + txt.slice(0, 800)); }
    if(!res.ok || !data.ok) throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Create failed');
    return intOrZero(data.post_id) || 0;
  }

  function intOrZero(v){
    const n = parseInt(String(v ?? '0'), 10);
    return Number.isFinite(n) ? n : 0;
  }

  async function apiUpdatePost(postId, payload){
    const res = await fetch('/admin/api/news_post_update.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({id: postId, ...payload})
    });
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (e) { throw new Error('news_post_update.php nevrátil JSON:\n' + txt.slice(0, 800)); }
    if(!res.ok || !data.ok) throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Update failed');
    return true;
  }

  async function openPostEditor(opts){
    // opts: {mode:'edit'|'create', postId?, x?, y?}
    const dlg = ensurePostEditorDialog();
    const meta = dlg.querySelector('[data-role="meta"]');

    const mode = opts && opts.mode ? opts.mode : 'edit';
    const postId = intOrZero(opts && opts.postId);

    const post = (mode === 'edit' && postId) ? (getPost(postId) || null) : null;
    fillEditorForm(dlg, post);

    // keep current image unless user uploads a new one
    dlg.dataset.uploadedImage = (post && post.image) ? String(post.image) : '';

    // default language tab = document lang
    const defaultTab = (document.documentElement.lang === 'en') ? 'en' : 'cs';
    dlg.querySelectorAll('[data-langtab]').forEach(b=>b.classList.toggle('is-active', b.getAttribute('data-langtab')===defaultTab));
    dlg.querySelectorAll('[data-langpane]').forEach(p=>p.classList.toggle('is-active', p.getAttribute('data-langpane')===defaultTab));

    // preview image
    const prev = dlg.querySelector('#ngPostEditorPreview');
    if(prev){
      const img = dlg.dataset.uploadedImage ? resolveAssetPath(dlg.dataset.uploadedImage) : '';
      prev.src = img || '';
      prev.alt = post ? tileTitle(post) : '';
      prev.style.display = img ? '' : 'none';
    }

    // (upload handler is bound after form cloning)

    if(meta){
      meta.textContent = (mode === 'edit' && postId)
        ? `#${postId}`
        : (lang === 'en' ? 'New post' : 'Nový příspěvek');
    }

    const form = dlg.querySelector('form');

    // Remove previous submit handler by cloning form
    const formClone = form.cloneNode(true);
    form.parentNode.replaceChild(formClone, form);

    // Re-bind cancel buttons (because form replaced)
    dlg.querySelectorAll('[data-action="cancel"]').forEach(b=>b.addEventListener('click', ()=> closePostEditor()));

    // Re-bind upload input AFTER form clone (clone replaces the file input too)
    {
      const prev2 = dlg.querySelector('#ngPostEditorPreview');
      const fileInput2 = dlg.querySelector('#ngPostEditorImageFile');
      if(fileInput2){
        fileInput2.value = '';

        const handleFile = async ()=>{
          const f = fileInput2.files && fileInput2.files[0] ? fileInput2.files[0] : null;
          if(!f) return;
          try {
            setStatus((lang === 'en') ? `Uploading image… (${f.name})` : `Nahrávám obrázek… (${f.name})`);
            const path = await apiUploadNewsImage(f);
            dlg.dataset.uploadedImage = path;
            if(prev2){
              prev2.src = resolveAssetPath(path);
              prev2.style.display = '';
            }
            setStatus((lang === 'en') ? 'Image uploaded.' : 'Obrázek nahrán.');
            showToastOk((lang === 'en') ? 'Image uploaded.' : 'Obrázek nahrán.');
          } catch(e){
            setStatus(e && e.message ? e.message : String(e), true);
          }
        };

        fileInput2.onchange = handleFile;
        fileInput2.oninput = handleFile;
      }
    }

    formClone.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const payload = readEditorForm(dlg);
      if(!payload.title_cs){
        setStatus((lang === 'en') ? 'Title (CS) is required.' : 'Název (CS) je povinný.', true);
        return;
      }

      try {
        let id = postId;
        if(mode === 'create'){
          id = await apiCreateEmptyPost();

          // Add into local pool
          state.posts.push({
            post_id: id,
            badge: '',
            image: '',
            date: '',
            title_cs: '',
            title_en: '',
            perex_cs: '',
            perex_en: '',
            body_cs: '',
            body_en: '',
          });

          const x = intOrZero(opts && opts.x);
          const y = intOrZero(opts && opts.y);
          state.items.push({post_id: id, x, y, w: 1, h: 1});
          const placed = placeWithPush(id, x, y, 1, 1);
          if(!placed.ok){
            setStatus('Příspěvek vytvořen, ale nepodařilo se umístit: ' + (placed.error || ''), true);
          } else {
            markDirty();
          }
        }

        await apiUpdatePost(id, payload);

        // Update local cache
        const p = getPost(id);
        if(p){
          Object.assign(p, payload);
        }

        render();
        setStatus((lang === 'en') ? 'Saved.' : 'Uloženo.');
        showToastOk((lang === 'en') ? 'Post saved.' : 'Příspěvek uložen.');

        closePostEditor();
      } catch (e) {
        setStatus(e && e.message ? e.message : String(e), true);
      }
    });

    openPostEditorModal();
  }

  function openPostEditorModal(){
    const dlg = ensurePostEditorDialog();
    dlg.classList.add('is-open');
    dlg.setAttribute('aria-hidden', 'false');
  }

  function closePostEditor(){
    const dlg = document.getElementById('ngPostEditorPanel');
    if(!dlg) return;
    dlg.classList.remove('is-open');
    dlg.setAttribute('aria-hidden', 'true');
  }

  const cssEscape = (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function')
    ? CSS.escape.bind(CSS)
    : (s)=>String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');

})();