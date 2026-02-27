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

  let lastSnap = null;

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

  function cssUrlValue(url){
    // Returns a value suitable for element.style.backgroundImage
    // Always quote and URI-encode to handle spaces/diacritics safely.
    const u = encodeURI(String(url || ''))
      .replace(/"/g, '%22')
      .replace(/\)/g, '%29')
      .replace(/\(/g, '%28');
    return `url("${u}")`;
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
  function placeSmart(postId, x, y, w, h){

    if(!canFitBounds(x,y,w,h)) return {ok:false};

    const items = state.items;
    const moving = items.find(it => it.post_id === postId);
    if(!moving) return {ok:false};

    const area = {x,y,w,h};

    const hits = items.filter(it =>
        it.post_id !== postId &&
        rectOverlap(area,it)
    );

    // 1) prázdné místo → move
    if(hits.length === 0){
      moving.x = x;
      moving.y = y;
      render();
      return {ok:true};
    }

    // 2) swap pokud 1 karta
    if(hits.length === 1){

      const target = hits[0];
      const oldArea = {x:moving.x,y:moving.y};

      if(canFitBounds(oldArea.x, oldArea.y, target.w, target.h)){

        moving.x = x;
        moving.y = y;

        target.x = oldArea.x;
        target.y = oldArea.y;

        render();
        return {ok:true};
      }
    }

    // 3) jinak push
    return placeWithPush(postId, x, y, w, h);
  }

  function placeWithPush(postId, x, y, w, h){

    if(!canFitBounds(x,y,w,h)){
      return {ok:false, error:"Out of bounds"};
    }

    const items = state.items;
    const moving = items.find(it => it.post_id === postId);
    if(!moving) return {ok:false};

    // 1) nastav moving kartu
    moving.x = x;
    moving.y = y;
    moving.w = w;
    moving.h = h;

    let changed = true;
    let guard = 0;

    // =====================================================
    // 🔥 Push dokud existují kolize
    // =====================================================
    while(changed && guard++ < 200){

      changed = false;

      // 2) všechny kolize s moving → posun dolů
      for(const it of items){

        if(it.post_id === postId) continue;

        if(rectOverlap(moving, it)){
          it.y = moving.y + moving.h;
          changed = true;
        }
      }

      // 3) kolize mezi ostatními kartami (cascade)
      const sorted = [...items].sort((a,b)=>
          (a.y - b.y) || (a.x - b.x)
      );

      for(let i=0; i<sorted.length; i++){

        for(let j=i+1; j<sorted.length; j++){

          const a = sorted[i];
          const b = sorted[j];

          if(a.post_id === b.post_id) continue;

          if(rectOverlap(a,b)){
            b.y = a.y + a.h;
            changed = true;
          }
        }
      }
    }

    if(guard >= 200){
      return {ok:false, error:"Push overflow"};
    }

    // grid může růst dolů
    ensureRowsFor(items);

    render();
    return {ok:true};
  }

  function previewPushLayout(postId, x, y, w, h) {

    // 1) klon layoutu (preview nesmí měnit state.items)
    const items = state.items.map(it => ({ ...it }));

    // 2) moving karta
    const moving = items.find(it => it.post_id === postId);
    if (!moving) return;

    moving.x = x;
    moving.y = y;
    moving.w = w;
    moving.h = h;

    let changed = true;
    let guard = 0;

    // =====================================================
    // 🔥 push preview dokud existují kolize
    // =====================================================
    while (changed && guard++ < 200) {

      changed = false;

      // A) kolize s moving kartou
      for (const it of items) {

        if (it.post_id === postId) continue;

        if (rectOverlap(moving, it)) {
          it.y = moving.y + moving.h;
          changed = true;
        }
      }

      // B) cascade kolize mezi ostatními kartami
      const sorted = [...items].sort((a, b) =>
          (a.y - b.y) || (a.x - b.x)
      );

      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {

          const a = sorted[i];
          const b = sorted[j];

          if (rectOverlap(a, b)) {
            b.y = a.y + a.h;
            changed = true;
          }
        }
      }
    }

    // =====================================================
    // ✅ aplikace preview pozic na DOM
    // =====================================================
    items.forEach(it => {

      const card = gridEl.querySelector(
          `.news-card[data-post-id="${it.post_id}"]`
      );
      if (!card) return;

      card.style.gridColumn = `${it.x + 1} / span ${it.w}`;
      card.style.gridRow = `${it.y + 1} / span ${it.h}`;
    });

    // =====================================================
    // ✅ oprava prázdných slotů v preview
    // =====================================================
    const occ = occupiedMap(items);

    gridEl.querySelectorAll('.ng-cell').forEach(cell => {

      const cx = parseInt(cell.dataset.x, 10);
      const cy = parseInt(cell.dataset.y, 10);

      const isOccupied = occ.has(cellKey(cx, cy));

      if (isOccupied) {
        cell.style.visibility = "hidden";
        cell.style.pointerEvents = "none";
      } else {
        cell.style.visibility = "visible";
        cell.style.pointerEvents = "auto";
      }
    });
  }


  function previewSmartLayout(postId, x, y, w, h) {

    // 🚫 karta se nevejde → žádný preview
    if (!canFitBounds(x, y, w, h)) {
      render();
      return;
    }

    const items = state.items.map(it => ({ ...it }));
    const moving = items.find(it => it.post_id === postId);
    if (!moving) return;

    const area = { x, y, w, h };

    const hits = items.filter(it =>
        it.post_id !== postId &&
        rectOverlap(area, it)
    );

    // ✅ CASE 1: oblast prázdná
    if (hits.length === 0) {

      moving.x = x;
      moving.y = y;

    } else {

      const oldArea = {
        x: moving.x,
        y: moving.y,
        w: moving.w,
        h: moving.h
      };

      const remaining = items.filter(it =>
          it.post_id === postId ||
          !rectOverlap(area, it)
      );

      moving.x = x;
      moving.y = y;
      moving.w = w;
      moving.h = h;

      const collisionAfterMove = remaining.some(it =>
          it.post_id !== postId &&
          rectOverlap(moving, it)
      );

      if (!collisionAfterMove) {

        let canFitBack = true;

        for (const hit of hits) {

          const test = {
            ...hit,
            x: oldArea.x,
            y: oldArea.y
          };

          // 🚫 nesmí být mimo grid
          if (!canFitBounds(test.x, test.y, test.w, test.h)) {
            canFitBack = false;
            break;
          }

          const collides = remaining.some(it =>
              it.post_id !== postId &&
              rectOverlap(test, it)
          );

          if (collides) {
            canFitBack = false;
            break;
          }
        }

        if (canFitBack) {

          for (const hit of hits) {
            hit.x = oldArea.x;
            hit.y = oldArea.y;
          }

        } else {
          return previewPushLayout(postId, x, y, w, h);
        }

      } else {
        return previewPushLayout(postId, x, y, w, h);
      }
    }

    // ✅ aplikace preview do DOM
    items.forEach(it => {
      const card = gridEl.querySelector(
          `.news-card[data-post-id="${it.post_id}"]`
      );
      if (!card) return;

      card.style.gridColumn = `${it.x + 1} / span ${it.w}`;
      card.style.gridRow = `${it.y + 1} / span ${it.h}`;
    });

  }



  function rowBoundaryIsClear(afterRowIndex){
    // True if there is NO item that spans across the boundary between row afterRowIndex and afterRowIndex+1.
    // Example: afterRowIndex = 0 means boundary between row 0 and row 1.
    const y = parseInt(String(afterRowIndex), 10);
    if(!Number.isFinite(y) || y < 0) return false;
    for(const it of state.items){
      const top = it.y;
      const bottomExclusive = it.y + it.h;
      // Item spans across boundary if it covers rows y and y+1
      if(top <= y && bottomExclusive >= (y + 2)) return false;
    }
    return true;
  }

  function render(){
    gridEl.style.setProperty('--cols', String(state.gridCols));
    gridEl.style.setProperty('--rows', String(state.gridRows));
    ensureRowsFor(state.items);

    gridEl.innerHTML = '';

    // --- Row gutter controls ---
    // "−" is attached to each row, "+" is an inserter between rows.

    // Inserter above the first row (adds a new row at the very top)
    // This is equivalent to "add row after -1".
    {
      const y = -1;
      // Only show if the boundary before the first row is considered clear.
      // (Always true with current layout constraints, but keep same logic.)
      if(rowBoundaryIsClear(0)){
        const insTop = document.createElement('div');
        insTop.className = 'ng-row-inserter ng-row-inserter--top';
        insTop.dataset.rowIndex = String(y);
        insTop.dataset.action = 'row-add-after';
        insTop.style.setProperty('--ri', String(y));
        insTop.title = (lang === 'en') ? 'Add row above first row' : 'Přidat řádek nad první řádek';
        insTop.setAttribute('aria-label', insTop.title);

        const btnAddTop = document.createElement('button');
        btnAddTop.type = 'button';
        btnAddTop.className = 'ng-row-btn ng-row-btn--add';
        btnAddTop.dataset.action = 'row-add-after';
        btnAddTop.dataset.rowIndex = String(y);
        btnAddTop.title = insTop.title;
        btnAddTop.setAttribute('aria-label', insTop.title);
        btnAddTop.textContent = '+';

        insTop.appendChild(btnAddTop);
        gridEl.appendChild(insTop);
      }
    }

    for(let y=0; y<state.gridRows; y++){
      const gutter = document.createElement('div');
      gutter.className = 'ng-row-gutter';
      gutter.style.gridColumn = `1 / span ${state.gridCols}`;
      gutter.style.gridRow = `${y+1} / span 1`;
      gutter.dataset.rowIndex = String(y);

      // Render remove only for empty rows
      if(rowIsEmpty(y)){
        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'ng-row-btn ng-row-btn--remove';
        btnRemove.dataset.action = 'row-remove';
        btnRemove.dataset.rowIndex = String(y);
        btnRemove.title = (lang === 'en') ? `Remove row ${y+1}` : `Odebrat řádek ${y+1}`;
        btnRemove.setAttribute('aria-label', btnRemove.title);
        btnRemove.textContent = '−';
        gutter.appendChild(btnRemove);
      }

      gridEl.appendChild(gutter);

      // Inserter between row y and y+1 (including after last row)
      // Show only if there is no tile spanning across this boundary.
      if(rowBoundaryIsClear(y)){
        const ins = document.createElement('div');
        ins.className = 'ng-row-inserter';
        ins.dataset.rowIndex = String(y);
        ins.dataset.action = 'row-add-after';
        ins.style.setProperty('--ri', String(y));
        ins.title = (lang === 'en') ? `Add row after row ${y+1}` : `Přidat řádek za řádek ${y+1}`;
        ins.setAttribute('aria-label', ins.title);

        const btnAddAfter = document.createElement('button');
        btnAddAfter.type = 'button';
        btnAddAfter.className = 'ng-row-btn ng-row-btn--add';
        btnAddAfter.dataset.action = 'row-add-after';
        btnAddAfter.dataset.rowIndex = String(y);
        btnAddAfter.title = ins.title;
        btnAddAfter.setAttribute('aria-label', ins.title);
        btnAddAfter.textContent = '+';

        ins.appendChild(btnAddAfter);
        gridEl.appendChild(ins);
      }
    }
    for(const it of state.items){
      const post = getPost(it.post_id) || {post_id: it.post_id, title_cs: '', title_en: '', perex_cs:'', perex_en:'', body_cs:'', body_en:'', badge:'', date:'', image:''};

      const card = document.createElement('article');
      card.className = 'news-card ng-tile-card';
      card.dataset.postId = String(it.post_id);
      card.style.gridColumn = `${it.x+1} / span ${it.w}`;
      card.style.gridRow = `${it.y+1} / span ${it.h}`;
      // Ensure card is clickable (override accidental global styles)
      card.style.pointerEvents = 'auto';

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
        <button type="button" data-size="2x2">2x2</button>
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
      gridEl.appendChild(card);
      setupBetterDrag(card, it);
    }
    // background cells with plus
    // background cells with plus (jen prázdné)
    const occ = occupiedMap();

    for(let y = 0; y < state.gridRows; y++){
      for(let x = 0; x < state.gridCols; x++){

        if(occ.has(cellKey(x,y))) continue; // 🔥 přeskoč obsazené

        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'ng-cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.style.gridColumn = `${x+1} / span 1`;
        cell.style.gridRow = `${y+1} / span 1`;

        cell.dataset.occupied = '0';
        cell.innerHTML = '<span class="ng-plus">+</span>';

        cell.addEventListener('click', ()=>{
          openPostEditor({mode:'create', x, y}).catch(err=>setStatus(err.message,true));
        });

        gridEl.appendChild(cell);
      }
    }

    // tiles (rendered as final .news-card)


    // Update UI
    // Defensive: ensure grid and its children accept pointer events (override external CSS overlays)
    try{
      gridEl.style.pointerEvents = 'auto';
      // Avoid forcing a very large inline z-index here. Leave stacking to CSS where
      // `.ng-editor-panel` intentionally has a very high z-index so it stays above.
      // Only set a minimal inline z-index if none exists (keeps interactive but doesn't
      // push the editor panel behind the grid).
      gridEl.style.zIndex = String(parseInt(gridEl.style.zIndex || '10', 10) || 10);

      // Make sure important interactive elements accept pointer events
      // Allow cards, cells, action buttons
      gridEl.querySelectorAll('.ng-cell, .news-card, .ng-row-gutter .ng-row-btn, .ng-row-inserter .ng-row-btn, .ng-actions--overlay button').forEach(el=>{
        try{ el.style.pointerEvents = 'auto'; }catch(e){}
      });
      // Ensure row inserter containers themselves do not intercept clicks (only the button should respond)
      gridEl.querySelectorAll('.ng-row-inserter').forEach(ins=>{ try{ ins.style.pointerEvents = 'none'; }catch(e){} });
    }catch(e){}

    updateRowControlsUI();
  }
  function setupBetterDrag(card, it){

    let isDragging = false;
    let dragStarted = false;
    let startX = 0;
    let startY = 0;

    const DRAG_THRESHOLD = 6; // kolik px musí uživatel potáhnout, aby to byl drag

    let gridRect;
    let colWidth;
    let rowHeight;

    const onMouseDown = (e)=>{
      if(e.button !== 0) return;
      if(e.target.closest('.ng-actions')) return;

      startX = e.clientX;
      startY = e.clientY;
      dragStarted = false;
      isDragging = true;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const startDrag = (e)=>{
      dragStarted = true;

      const rect = card.getBoundingClientRect();
      gridRect = gridEl.getBoundingClientRect();

      colWidth = gridRect.width / state.gridCols;
      rowHeight = gridRect.height / state.gridRows;

      card.style.width = rect.width + 'px';
      card.style.height = rect.height + 'px';
      card.style.left = rect.left + 'px';
      card.style.top = rect.top + 'px';

      card.classList.add('is-dragging');
      card.style.position = 'fixed';
      card.style.zIndex = '9999';
      card.style.pointerEvents = 'none';

      moveAt(e);
    };

    const moveAt = (e)=>{
      card.style.left = e.clientX - card.offsetWidth/2 + 'px';
      card.style.top  = e.clientY - card.offsetHeight/2 + 'px';
    };

    const onMouseMove = (e)=>{
      if(!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // 🔥 nezačneme drag, dokud se fakt nehýbe
      if(!dragStarted){
        if(Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD){
          startDrag(e);
        } else {
          return;
        }
      }

      moveAt(e);

      lastSnap = getSnapPosition(e, it);

      if (lastSnap) {
        previewSmartLayout(
            it.post_id,
            lastSnap.x,
            lastSnap.y,
            it.w,
            it.h
        );
      }
    };

    const onMouseUp = (e)=>{
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if(!isDragging){
        return;
      }

      // Pokud se nikdy nezačalo táhnout → je to klik
      if(!dragStarted){
        isDragging = false;
        return;
      }

      // reset stylů
      card.classList.remove('is-dragging');
      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.zIndex = '';
      card.style.pointerEvents = '';
      card.style.width = '';
      card.style.height = '';

      if (lastSnap) {
        const res = placeSmart(
            it.post_id,
            lastSnap.x,
            lastSnap.y,
            it.w,
            it.h
        );

        if (res.ok) {
          markDirty();
          setStatus('Přesunuto. Nezapomeň uložit.');
        } else {
          setStatus(res.error || 'Nelze přesunout.', true);
        }
      }

      lastSnap = null;
      isDragging = false;

      render();
    };

    card.addEventListener('mousedown', onMouseDown);
  }
  function getSnapPosition(e, it){
    const gridRect = gridEl.getBoundingClientRect();

    const colWidth = gridRect.width / state.gridCols;
    const rowHeight = gridRect.height / state.gridRows;

    const rawX = (e.clientX - gridRect.left) / colWidth;
    const rawY = (e.clientY - gridRect.top) / rowHeight;

    let x = Math.round(rawX - it.w / 2);
    let y = Math.round(rawY - it.h / 2);

    x = Math.min(Math.max(x, 0), state.gridCols - it.w);
    y = Math.max(y, 0);

    return { x, y };
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
      const res = placeSmart(postId, cell.x, cell.y, it.w, it.h);
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
        // NOTE: rows are now handled in AUTO mode on load, to avoid empty rows after reload.
        // Persisted value is kept as a manual minimum only.
      }
    } catch (e) {}

    state.posts = (posts.items || []).map(p => ({
      post_id: p.id,
      badge: p.badge,
      // Keep both a primary image and the images array (if provided by API)
      image: p.image || (Array.isArray(p.images) ? (p.images[0] || '') : ''),
      images: Array.isArray(p.images) ? p.images.slice() : (p.images ? [p.images] : []),
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
    state.rowsMode = 'manual';
    state.gridRowsManual = Math.max(state.gridRowsManual, neededRowsByTiles(), 1);


    ensureRowsFor(state.items);
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

  function clampManualRows(){
    state.gridRowsManual = Math.max(1, parseInt(String(state.gridRowsManual || 1), 10) || 1);
  }

  function addRowAfter(rowIndex){
    const y = Math.max(-1, parseInt(String(rowIndex), 10));
    state.rowsMode = 'manual';
    clampManualRows();

    // Insert a row after y: shift items with y > rowIndex down by 1
    for(const it of state.items){
      if(it.y > y) it.y += 1;
    }

    state.gridRowsManual += 1;
    recomputeRows(state.items);
    render();
    markDirty();
    setStatus((lang === 'en') ? 'Row added. Don\'t forget to save.' : 'Řádek přidán. Nezapomeň uložit.');
  }

  function rowIsEmpty(rowIndex){
    const y = parseInt(String(rowIndex), 10);
    if(!Number.isFinite(y) || y < 0) return false;
    for(const it of state.items){
      const top = it.y;
      const bottomExclusive = it.y + it.h;
      if(y >= top && y < bottomExclusive) return false;
    }
    return true;
  }

  function canRemoveSpecificRow(rowIndex){
    clampManualRows();
    const y = parseInt(String(rowIndex), 10);
    if(!Number.isFinite(y) || y < 0) return {ok:false, reason:'bad_index'};
    if(state.gridRowsManual <= 1) return {ok:false, reason:'min_1'};
    if(y >= state.gridRowsManual) return {ok:false, reason:'not_in_manual'};
    if(!rowIsEmpty(y)) return {ok:false, reason:'not_empty'};

    // Simulate: remove row y and shift items below up by 1
    const sim = state.items.map(it => ({...it}));
    for(const it of sim){
      if(it.y > y) it.y -= 1;
    }

    const neededAfter = Math.max(maxBottomY(sim), 1);
    const manualAfter = Math.max(state.gridRowsManual - 1, 1);
    if(neededAfter > manualAfter) return {ok:false, reason:'would_cut'};

    return {ok:true};
  }

  function removeSpecificRow(rowIndex){
    const check = canRemoveSpecificRow(rowIndex);
    if(!check.ok){
      const msg = (function(){
        switch(check.reason){
          case 'min_1':
            return (lang === 'en') ? 'At least 1 row must remain.' : 'Musí zůstat alespoň 1 řádek.';
          case 'not_empty':
            return (lang === 'en') ? 'Cannot remove: row is not empty.' : 'Nelze odebrat: řádek není prázdný.';
          case 'would_cut':
            return (lang === 'en') ? 'Cannot remove: it would cut off existing tiles.' : 'Nelze odebrat: došlo by k oříznutí dlaždic.';
          default:
            return (lang === 'en') ? 'Cannot remove this row.' : 'Tento řádek nelze odebrat.';
        }
      })();
      setStatus(msg, true);
      return;
    }

    const y = parseInt(String(rowIndex), 10);

    // Apply: remove row y
    for(const it of state.items){
      if(it.y > y) it.y -= 1;
    }

    state.rowsMode = 'manual';
    clampManualRows();
    state.gridRowsManual = Math.max(1, state.gridRowsManual - 1);

    recomputeRows(state.items);
    render();
    markDirty();
    setStatus((lang === 'en') ? 'Row removed. Don\'t forget to save.' : 'Řádek odebrán. Nezapomeň uložit.');
  }

  function updateRowControlsUI(){
    // per-row UI is rendered into the grid; we only keep the counter in status if needed
    // and ensure gutter buttons are disabled correctly.
    try {
      const needed = neededRowsByTiles();
      // Soft hint:
      if(statusEl && !statusEl.textContent){
        statusEl.textContent = (lang === 'en')
          ? `Rows: ${state.gridRowsManual} (min ${needed}).`
          : `Řádky: ${state.gridRowsManual} (min ${needed}).`;
      }
    } catch (e) {}

    // Update gutter button disabled states (after each render)
    const gutters = gridEl.querySelectorAll('.ng-row-gutter');
    gutters.forEach(g=>{
      const y = parseInt(g.dataset.rowIndex || '-1', 10);
      const btnRemove = g.querySelector('[data-action="row-remove"]');
      if(btnRemove){
        const ok = canRemoveSpecificRow(y).ok;
        btnRemove.disabled = !ok;
      }
    });
  }

  function ensureRowControls(){
    // Deprecated: row controls are now per-row.
    return;
  }

  function setupRowGutterActions(){
    gridEl.addEventListener('click', (ev)=>{
      const btn = ev.target && ev.target.closest ? ev.target.closest('[data-action]') : null;
      if(!btn) return;
      const action = btn.getAttribute('data-action');
      if(action !== 'row-add-after' && action !== 'row-remove') return;

      ev.preventDefault();
      ev.stopPropagation();

      const y = parseInt(btn.getAttribute('data-row-index') || btn.dataset.rowIndex || '-1', 10);
      if(!Number.isFinite(y)) return;

      if(action === 'row-add-after'){
        addRowAfter(y);
        setTimeout(()=>{
          const q = `.ng-row-inserter [data-action="row-add-after"][data-row-index="${y}"]`;
          const el = gridEl.querySelector(q);
          if(el) el.focus();
        }, 0);
      }
      if(action === 'row-remove'){
        removeSpecificRow(y);
        setTimeout(()=>{
          const y2 = Math.max(0, Math.min(y, state.gridRows - 1));
          const q = `.ng-row-inserter [data-action="row-add-after"][data-row-index="${y2}"]`;
          const el = gridEl.querySelector(q);
          if(el) el.focus();
        }, 0);
      }
    });
  }

  // Initial paint so user always sees grid cells even if API fails.
  try {
    // ensureRowControls(); // deprecated
    setupRowGutterActions();
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

    // Use public modal classes so editor inherits the same cascading visual style.
    dlg = document.createElement('div');
    dlg.id = 'ngPostEditorPanel';
    dlg.className = 'modal';
    dlg.setAttribute('aria-hidden', 'true');

    dlg.innerHTML = `
      <div class="modal__backdrop" aria-hidden="true"></div>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="ngPostEditorTitle">
        <button class="modal__close" type="button" aria-label="${lang === 'en' ? 'Close' : 'Zavřít'}" data-close="true">✕</button>
        <form class="modal__grid" autocomplete="off">
          <div class="modal__media">
            <button type="button" class="modal__nav-arrow modal__nav-prev" data-action="img-prev" aria-label="Předchozí">◀</button>
            <img id="ngPostEditorPreview" src="" alt="" />
            <div class="ng-preview-counter" aria-hidden="true"><span id="ngPostEditorPreviewCounter"></span></div>
            <button type="button" class="modal__nav-delete" data-action="img-delete" aria-label="Smazat obrázek">🗑</button>
            <button type="button" class="modal__nav-arrow modal__nav-next" data-action="img-next" aria-label="Další">▶</button>
          </div>

          <div class="modal__content">
            <div class="modal__topline">
              <h2 class="modal__title" id="ngPostEditorTitle">${lang === 'en' ? 'Edit post' : 'Upravit příspěvek'}</h2>
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
      if(closeHit) return closePostEditor();

      // language tab switch
      const tab = t && t.closest ? t.closest('[data-langtab]') : null;
      if(tab){
        e.preventDefault();
        const langKey = tab.getAttribute('data-langtab');
        dlg.querySelectorAll('[data-langtab]').forEach(b=>b.classList.toggle('is-active', b.getAttribute('data-langtab')===langKey));
        dlg.querySelectorAll('[data-langpane]').forEach(p=>p.classList.toggle('is-active', p.getAttribute('data-langpane')===langKey));
        return;
      }

      // image navigation buttons (prev/next)
      const nav = t && t.closest ? t.closest('[data-action]') : null;
      if(nav){
        const action = nav.getAttribute('data-action');
        if(action === 'img-prev' || action === 'img-next'){
          e.preventDefault();
          try{
            const imgs = getEditorImages(dlg);
            if(!imgs || imgs.length === 0) return;
            let idx = parseInt(dlg.dataset.galleryIndex || '0', 10) || 0;
            if(action === 'img-prev') idx = Math.max(0, idx - 1);
            else idx = Math.min(imgs.length - 1, idx + 1);
            dlg.dataset.galleryIndex = String(idx);
            updateEditorPreview(dlg);
          }catch(err){ console.debug('[ng-editor] img-nav failed', err); }
          return;
        }
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
    // Also include image_paths array (parsed from dlg.dataset.images) so backend can persist gallery
    let imgs = [];
    try{ imgs = JSON.parse(dlg.dataset.images || '[]') || []; }catch(e){ imgs = []; }
    imgs = Array.isArray(imgs) ? imgs.map(i=>String(i || '')) .filter(Boolean) : [];
    return {
      badge: get('badge').trim(),
      date: get('date').trim(),
      image: String(dlg.dataset.uploadedImage || '').trim(),
      image_paths: imgs,
      title_cs: get('title_cs').trim(),
      perex_cs: get('perex_cs'),
      body_cs: get('body_cs'),
      title_en: get('title_en').trim(),
      perex_en: get('perex_en'),
      body_en: get('body_en'),
    };
  }

  // Gallery helpers for editor modal
  function getEditorImages(dlg){
    try{ return JSON.parse(dlg.dataset.images || '[]'); }catch(e){ return []; }
  }

  function updateEditorPreview(dlg){
    if(!dlg) return;
    const prev = dlg.querySelector('#ngPostEditorPreview');
    const imgs = getEditorImages(dlg);
    let idx = parseInt(dlg.dataset.galleryIndex || '0', 10) || 0;
    if(idx < 0) idx = 0; if(idx > Math.max(0, imgs.length - 1)) idx = Math.max(0, imgs.length - 1);
    dlg.dataset.galleryIndex = String(idx);
    if(prev){
      if(imgs.length && imgs[idx]){ prev.src = resolveAssetPath(imgs[idx]); prev.style.display = ''; prev.alt = dlg.querySelector('[name="title_cs"]') ? dlg.querySelector('[name="title_cs"]').value : '';
      } else {
        // fallback to uploadedImage single
        const up = String(dlg.dataset.uploadedImage || '').trim();
        if(up){ prev.src = resolveAssetPath(up); prev.style.display = ''; } else { prev.src = ''; prev.style.display = 'none'; }
      }
    }
    // update counter under preview
    try{
      const counterEl = dlg.querySelector('#ngPostEditorPreviewCounter');
      const total = (imgs && imgs.length) ? imgs.length : (String(dlg.dataset.uploadedImage || '').trim() ? 1 : 0);
      if(counterEl){
        if(total <= 0){ counterEl.parentElement.style.display = 'none'; }
        else { counterEl.parentElement.style.display = ''; counterEl.textContent = `${Math.max(1, idx + 1)} / ${total}`; }
      }
    }catch(e){}
    // toggle nav disabled states
    const prevBtn = dlg.querySelector('[data-action="img-prev"]');
    const nextBtn = dlg.querySelector('[data-action="img-next"]');
    if(prevBtn) prevBtn.disabled = imgs.length <= 1;
    if(nextBtn) nextBtn.disabled = imgs.length <= 1;
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

    // populate gallery image list (prefers explicit images array, falls back to single image)
    let images = [];
    try{
      if(p.images && Array.isArray(p.images) && p.images.length) images = p.images.slice();
      else if(p.image) images = [p.image];
    }catch(e){ images = [] }
    try{ dlg.dataset.images = JSON.stringify(images || []); }catch(e){ dlg.dataset.images = '[]'; }
    if(typeof dlg.dataset.galleryIndex === 'undefined') dlg.dataset.galleryIndex = '0';
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

    // preview image - use gallery-aware helper
    try{ updateEditorPreview(dlg); }catch(e){ console.debug('[ng-editor] preview update failed', e); }

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
            // If editing an existing post, attach this image on server side so it's stored in image_paths
            try{
              const imgs = getEditorImages(dlg) || [];
              // If we have a postId (editing), call attach API to persist
              if(postId && postId > 0){
                const attachRes = await fetch('/admin/api/news_image_attach.php', {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: {'Content-Type':'application/json','Accept':'application/json'},
                  body: JSON.stringify({post_id: postId, img_path: path})
                });
                const txt = await attachRes.text();
                let data;
                try{ data = JSON.parse(txt); }catch(e){ throw new Error('news_image_attach.php nevrátil JSON:\n' + txt.slice(0,800)); }
                if(!attachRes.ok || !data.ok) throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Attach failed');
                // server returns normalized images array
                const newImgs = Array.isArray(data.images) ? data.images : imgs.concat([path]);
                dlg.dataset.images = JSON.stringify(newImgs);
                dlg.dataset.galleryIndex = String(Math.max(0, newImgs.length - 1));
                // update local cache
                try{ const sp = getPost(postId); if(sp){ sp.images = newImgs.slice(); sp.image = sp.images.length ? sp.images[0] : ''; } }catch(e){}
               } else {
                 // local-only until post is created/saved
                 imgs.push(path);
                 dlg.dataset.images = JSON.stringify(imgs);
                 dlg.dataset.galleryIndex = String(Math.max(0, imgs.length - 1));
               }
            }catch(e){
              // fallback: keep local-only
              try{ const imgs = getEditorImages(dlg) || []; imgs.push(path); dlg.dataset.images = JSON.stringify(imgs); dlg.dataset.galleryIndex = '0'; }catch(_){}
            }
            if(prev2) updateEditorPreview(dlg);
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

    // Re-bind delete button handler (needs postId available) - runs after cloning too
    const deleteBtn = dlg.querySelector('[data-action="img-delete"]');
    if(deleteBtn){
      deleteBtn.onclick = async (ev)=>{
        ev && ev.preventDefault && ev.preventDefault();
        const imgs = getEditorImages(dlg) || [];
        let idx = parseInt(dlg.dataset.galleryIndex || '0', 10) || 0;
        if(!imgs || imgs.length === 0) return;
        idx = Math.max(0, Math.min(imgs.length-1, idx));
        const imgPath = imgs[idx];
        if(!imgPath) return;
        const conf = window.confirm(lang === 'en' ? 'Delete this image from post and server?' : 'Smazat tento obrázek z příspěvku a serveru?');
        if(!conf) return;
        try{
          if(postId && postId > 0){
            const res = await fetch('/admin/api/news_image_delete.php', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {'Content-Type':'application/json','Accept':'application/json'},
              body: JSON.stringify({post_id: postId, img_path: imgPath})
            });
            const txt = await res.text();
            let data;
            try{ data = JSON.parse(txt); }catch(e){ throw new Error('news_image_delete.php nevrátil JSON:\n' + txt.slice(0,800)); }
            if(!res.ok || !data.ok) throw new Error((data && data.errors ? data.errors.join(' | ') : '') || 'Delete failed');
            const remaining = Array.isArray(data.images) ? data.images : [];
            dlg.dataset.images = JSON.stringify(remaining);
            dlg.dataset.galleryIndex = '0';
            // update local cache
            try{ const sp = getPost(postId); if(sp){ sp.images = remaining.slice(); sp.image = sp.images.length ? sp.images[0] : ''; } }catch(e){}
             updateEditorPreview(dlg);
             setStatus((lang === 'en') ? 'Image deleted.' : 'Obrázek smazán.');
             showToastOk((lang === 'en') ? 'Image deleted.' : 'Obrázek smazán.');
          } else {
            // local-only: remove from dlg.dataset.images
            imgs.splice(idx,1);
            dlg.dataset.images = JSON.stringify(imgs);
            dlg.dataset.galleryIndex = String(Math.max(0, Math.min(imgs.length-1, idx)));
            updateEditorPreview(dlg);
            setStatus((lang === 'en') ? 'Image removed.' : 'Obrázek odstraněn.');
          }
        }catch(e){ setStatus(e && e.message ? e.message : String(e), true); }
      };
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
          // copy simple fields
          p.badge = payload.badge ?? p.badge;
          p.date = payload.date ?? p.date;
          p.title_cs = payload.title_cs ?? p.title_cs;
          p.title_en = payload.title_en ?? p.title_en;
          p.perex_cs = payload.perex_cs ?? p.perex_cs;
          p.perex_en = payload.perex_en ?? p.perex_en;
          p.body_cs = payload.body_cs ?? p.body_cs;
          p.body_en = payload.body_en ?? p.body_en;
          // persist image_paths -> images
          if(Array.isArray(payload.image_paths)){
            p.images = payload.image_paths.slice();
            p.image = p.images.length ? p.images[0] : '';
          } else if(payload.image){
            p.image = payload.image;
          }
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
    try{ document.body.classList.add('modal-open'); }catch(e){}
   }

   function closePostEditor(){
     const dlg = document.getElementById('ngPostEditorPanel');
     if(!dlg) return;
     dlg.classList.remove('is-open');
     dlg.setAttribute('aria-hidden', 'true');
     try{ document.body.classList.remove('modal-open'); }catch(e){}
   }

  const cssEscape = (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function')
    ? CSS.escape.bind(CSS)
    : (s)=>String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');

  // Debug helpers exposed for diagnostics
  try{
    if(typeof window !== 'undefined'){
      window.aktualityGrid = window.aktualityGrid || {};
      window.aktualityGrid.inspect = function(){
        try{
          const grid = document.getElementById('newsGridAdmin');
          if(!grid){ console.warn('newsGridAdmin not found'); return; }
          const cs = getComputedStyle(grid);
          console.log('newsGridAdmin computed:', {pointerEvents: cs.pointerEvents, zIndex: cs.zIndex, rect: grid.getBoundingClientRect()});
          const childs = Array.from(grid.querySelectorAll('.ng-cell, .news-card, .ng-row-inserter, .ng-row-inserter::before'));
          console.log('sample children (first 10) computed styles:');
          childs.slice(0,10).forEach(el=>{
            try{ const c = getComputedStyle(el); console.log(el, {tag: el.tagName, cls: el.className, pe: c.pointerEvents, z: c.zIndex}); }catch(e){}
          });
          // element under center
          const r = grid.getBoundingClientRect();
          const cx = Math.round(r.left + r.width/2);
          const cy = Math.round(r.top + r.height/2);
          const top = document.elementFromPoint(cx, cy);
          console.log('elementFromPoint at grid center:', top, top && getComputedStyle(top) ? getComputedStyle(top).pointerEvents : null);
        }catch(e){ console.warn('inspect failed', e); }
      };

      window.aktualityGrid.ensurePointerEvents = function(){
        try{
          const grid = document.getElementById('newsGridAdmin');
          if(!grid) return;
          grid.style.pointerEvents = 'auto';
          grid.style.zIndex = '25000';
          Array.from(grid.querySelectorAll('*')).forEach(el=>{ el.style.pointerEvents = 'auto'; });
          console.log('ensured pointer-events:auto on #newsGridAdmin and children');
        }catch(e){ console.warn('ensurePointerEvents failed', e); }
      };
    }
  }catch(e){}

})();

