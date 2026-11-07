'use strict';
(() => {
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.getElementById('intro');
  const skip = document.getElementById('skip-intro');
  let introTimer, hideTimer, returnFocus;
  const filmTimers = [];
  const filmFrames = [...intro.querySelectorAll('.intro-frame')];
  function clearFilmTimers() { filmTimers.splice(0).forEach(clearTimeout); }
  function finishIntro() {
    clearTimeout(introTimer);
    clearFilmTimers();
    if (intro.hidden) return;
    intro.classList.add('leaving');
    body.classList.remove('is-intro');
    body.classList.add('ready');
    document.querySelector('main').inert = false;
    document.querySelector('.site-header').inert = false;
    document.querySelector('.site-footer').inert = false;
    if (intro.contains(document.activeElement)) (returnFocus || document.querySelector('.brand')).focus({preventScroll:true});
    hideTimer = setTimeout(() => { intro.hidden = true; }, reduced.matches ? 0 : 1050);
  }
  function playIntro() {
    if (reduced.matches) { body.classList.add('ready'); showToast('已遵循系统设置，减少动画效果'); return; }
    clearTimeout(hideTimer);
    clearTimeout(introTimer);
    clearFilmTimers();
    const active = document.activeElement;
    returnFocus = active && active !== body && !intro.contains(active) ? active : document.querySelector('.brand');
    body.classList.remove('ready');
    intro.classList.remove('leaving');
    intro.hidden = false;
    // Restart the letter animation when replaying the opening.
    intro.getAnimations({subtree:true}).forEach(animation => { animation.cancel(); animation.play(); });
    body.classList.add('is-intro');
    document.querySelector('main').inert = true;
    document.querySelector('.site-header').inert = true;
    document.querySelector('.site-footer').inert = true;
    skip.focus({preventScroll:true});
    const chapters = [
      ['湖山之间，保持好奇。', 'PROLOGUE / 序章'],
      ['以语言，连接更大的世界。', '01 / ENGLISH'],
      ['以智能，探索新的可能。', '02 / INTELLIGENCE'],
      ['在真实的问题里，付诸实践。', '03 / IN PRACTICE'],
      ['不止一面，自有无限。', 'LI BINGKUN / 李炳坤']
    ];
    function showFrame(index) {
      filmFrames.forEach((frame, i) => frame.classList.toggle('is-current', i === index));
      document.getElementById('film-count').textContent = String(index + 1).padStart(2, '0');
      document.getElementById('film-chapter').textContent = chapters[index][0];
      document.getElementById('film-category').textContent = chapters[index][1];
    }
    showFrame(0);
    chapters.slice(1).forEach((_, index) => {
      filmTimers.push(setTimeout(() => showFrame(index + 1), (index + 1) * 720));
    });
    introTimer = setTimeout(finishIntro, 4400);
  }
  body.classList.add('motion');
  if (!reduced.matches && !location.hash) playIntro();
  else requestAnimationFrame(() => body.classList.add('ready'));
  skip.addEventListener('click', finishIntro);
  document.getElementById('replay-intro').addEventListener('click', playIntro);
  document.addEventListener('keydown', event => {
    if (!intro.hidden && event.key === 'Escape') finishIntro();
    if (!intro.hidden && body.classList.contains('is-intro') && event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  });
  reduced.addEventListener('change', () => { if (reduced.matches) finishIntro(); });

  document.querySelectorAll('.replay-opening').forEach(button => button.addEventListener('click', playIntro));
  const progress = document.querySelector('.reading-progress');
  let scrollScheduled = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    let active = '';
    document.querySelectorAll('.site-header nav a').forEach(link => {
      const section = document.querySelector(link.hash);
      if (section && section.getBoundingClientRect().top < innerHeight * .45) active = link.hash;
    });
    document.querySelectorAll('.site-header nav a').forEach(link => {
      link.classList.toggle('active', link.hash === active);
      if (link.hash === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    scrollScheduled = false;
  }
  addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); } }, {passive:true});
  addEventListener('resize', updateScroll);
  updateScroll();

  let toastTimer;
  function showToast(message) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const value = button.dataset.copy, label = button.dataset.label;
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; } catch {
      const input = document.createElement('textarea'); input.value = value;
      input.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; body.appendChild(input); input.select();
      try { copied = document.execCommand('copy'); } catch {}
      input.remove(); button.focus({preventScroll:true});
    }
    showToast(copied ? `${label}已复制：${value}` : `请选中并复制${label}：${value}`);
  }));

  const rail = document.getElementById('resume-rail');
  const laneButtons = [...document.querySelectorAll('[data-lane]')];
  const lanes = [...rail.querySelectorAll('.resume-lane')];
  const railPrev = document.getElementById('rail-prev'), railNext = document.getElementById('rail-next');
  function selectLane(index) {
    const lane = lanes[index];
    rail.scrollTo({left:lane.offsetLeft - rail.offsetLeft, behavior:reduced.matches ? 'instant' : 'smooth'});
    laneButtons.forEach((button, i) => { button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  }
  laneButtons.forEach((button, index) => button.addEventListener('click', () => selectLane(index)));
  railPrev.addEventListener('click', () => rail.scrollBy({left:-(lanes[0].offsetWidth + 16),behavior:reduced.matches ? 'instant' : 'smooth'}));
  railNext.addEventListener('click', () => rail.scrollBy({left:lanes[0].offsetWidth + 16,behavior:reduced.matches ? 'instant' : 'smooth'}));
  function updateRail() {
    railPrev.disabled = rail.scrollLeft < 2;
    railNext.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
    if (rail.scrollWidth > rail.clientWidth + 2) {
      const index = Math.round(rail.scrollLeft / (lanes[0].offsetWidth + 16));
      laneButtons.forEach((button, i) => { button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
    }
  }
  rail.addEventListener('scroll', updateRail, {passive:true}); addEventListener('resize', updateRail); updateRail();
  rail.addEventListener('keydown', event => {
    if (event.target !== rail) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); rail.scrollBy({left:(event.key === 'ArrowRight' ? 1 : -1) * (lanes[0].offsetWidth + 16),behavior:reduced.matches ? 'instant' : 'smooth'}); }
  });
  function closeOtherEntries(entry) {
    entry.closest('.lane-entries').querySelectorAll('.resume-entry[open]').forEach(other => {
      if (other !== entry) other.open = false;
    });
  }
  document.querySelectorAll('.resume-entry').forEach(entry => entry.addEventListener('toggle', () => {
    if (entry.open) closeOtherEntries(entry);
  }));

  rail.querySelectorAll('.lane-entries').forEach(list => {
    let hoveredSummary;
    let revealTimer;
    function cancelReveal() {
      clearTimeout(revealTimer);
      hoveredSummary = null;
    }
    list.addEventListener('pointerleave', cancelReveal);
    list.addEventListener('click', cancelReveal);
    list.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const summary = event.target.closest('.resume-entry > summary');
      if (summary === hoveredSummary) return;
      clearTimeout(revealTimer);
      hoveredSummary = summary;
      if (!summary || summary.parentElement.open) return;
      revealTimer = setTimeout(() => {
        if (!summary.matches(':hover')) return;
        const focused = document.activeElement;
        if (list.contains(focused) && focused.matches(':focus-visible') && focused.closest('.entry-description')) return;
        const entry = summary.parentElement;
        const entryTop = entry.getBoundingClientRect().top;
        closeOtherEntries(entry);
        entry.open = true;
        list.scrollTop += entry.getBoundingClientRect().top - entryTop;
      }, 110);
    }, {passive:true});
  });

  let filter = 'all', expanded = false;
  const cards = [...document.querySelectorAll('.portfolio-card')];
  const more = document.getElementById('more-works');
  function filterProjects() {
    let visible = 0;
    cards.forEach(card => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.hidden = !matches || (filter === 'all' && !expanded && visible >= 6);
      if (matches) visible++;
    });
    const shown = cards.filter(card => !card.hidden).length;
    document.getElementById('work-status').textContent = `${filter === 'all' ? '精选' : '当前分类'} ${shown} 项 · 点击查看更多照片与完整经历`;
    more.hidden = filter !== 'all';
    more.innerHTML = expanded ? '收起作品 <span>−</span>' : `更多作品 ${Math.max(0,cards.length - 6)} <span>＋</span>`;
    document.querySelectorAll('[data-filter]').forEach(button => { button.classList.toggle('active', button.dataset.filter === filter); button.setAttribute('aria-pressed', String(button.dataset.filter === filter)); });
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; filterProjects(); }));
  more.addEventListener('click', () => { expanded = !expanded; filterProjects(); });
  filterProjects();

  const projectDialog = document.getElementById('project-dialog');
  const photoDialog = document.getElementById('photo-dialog');
  const projectMap = new Map(window.PORTFOLIO_PROJECTS.map(project => [project.id, project]));
  const workPreview = document.getElementById('work-link-preview');
  const workPreviewImage = workPreview.querySelector('img');
  let previewTrigger, linkedCardTimer;
  function hideWorkPreview() {
    workPreview.classList.remove('is-visible');
    previewTrigger = null;
  }
  function showWorkPreview(trigger) {
    const cover = document.getElementById('work-' + trigger.dataset.project)?.querySelector('.portfolio-cover img');
    if (!cover) return;
    previewTrigger = trigger;
    workPreviewImage.src = cover.currentSrc || cover.src;
    workPreviewImage.style.objectPosition = getComputedStyle(cover).objectPosition;
    const rect = trigger.getBoundingClientRect();
    const {offsetWidth:width, offsetHeight:height} = workPreview;
    const edge = 12, gap = 14;
    let left = rect.right + gap, top = rect.top + (rect.height - height) / 2;
    if (left + width > innerWidth - edge) {
      left = rect.left - width - gap;
      if (left < edge) {
        left = rect.left;
        top = rect.bottom + gap + height <= innerHeight - edge
          ? rect.bottom + gap : rect.top - height - gap;
      }
    }
    workPreview.style.left = Math.max(edge, Math.min(left, innerWidth - width - edge)) + 'px';
    workPreview.style.top = Math.max(edge, Math.min(top, innerHeight - height - edge)) + 'px';
    workPreview.classList.add('is-visible');
  }
  function revealLinkedWork(hash) {
    const card = cards.find(item => '#' + item.id === hash);
    if (!card) return;
    if (card.hidden) {
      filter = 'all';
      expanded = true;
      filterProjects();
    }
    clearTimeout(linkedCardTimer);
    cards.forEach(item => item.classList.toggle('is-linked', item === card));
    requestAnimationFrame(() => {
      card.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth', block:'start'});
    });
    linkedCardTimer = setTimeout(() => card.classList.remove('is-linked'), 3500);
  }
  document.querySelectorAll('.entry-image-link[data-project]').forEach(trigger => {
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') showWorkPreview(trigger);
    });
    trigger.addEventListener('pointerleave', () => {
      if (previewTrigger === trigger && !trigger.matches(':focus-visible')) hideWorkPreview();
    });
    trigger.addEventListener('focus', () => {
      if (trigger.matches(':focus-visible') && !projectDialog.open) showWorkPreview(trigger);
    });
    trigger.addEventListener('blur', hideWorkPreview);
  });
  addEventListener('scroll', hideWorkPreview, {capture:true, passive:true});
  addEventListener('resize', hideWorkPreview);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideWorkPreview();
  });
  addEventListener('hashchange', () => revealLinkedWork(location.hash));
  revealLinkedWork(location.hash);
  let activePhotos = [], photoIndex = 0;
  function unlockDialogs() { body.style.overflow = projectDialog.open || photoDialog.open ? 'hidden' : ''; }
  function closeProject() { projectDialog.close(); unlockDialogs(); }
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    hideWorkPreview();
    const project = projectMap.get(button.dataset.project);
    document.getElementById('dialog-category').textContent = project.tag;
    document.getElementById('dialog-title').textContent = project.title;
    const content = document.getElementById('dialog-content'); content.replaceChildren();
    project.sections.forEach(([heading, text]) => {
      const h = document.createElement('h3'); h.textContent = heading;
      const p = document.createElement('p'); p.innerHTML = text; content.append(h,p);
    });
    activePhotos = project.photos;
    const gallery = document.getElementById('project-gallery'); gallery.replaceChildren();
    project.photos.forEach((photo, index) => {
      const trigger = document.createElement('button'); trigger.type = 'button'; trigger.dataset.photoIndex = index;
      trigger.setAttribute('aria-label', '放大查看：' + photo.title);
      const image = document.createElement('img'); image.src = photo.src; image.alt = photo.title;
      const label = document.createElement('span'); label.textContent = photo.title;
      trigger.append(image,label); gallery.append(trigger);
    });
    const links = document.getElementById('project-links'); links.replaceChildren();
    (project.links || []).forEach(([label,url]) => { const link=document.createElement('a'); link.href=url; link.textContent=label+' ↗'; if(url.startsWith('https://')){link.target='_blank';link.rel='noopener noreferrer';} links.append(link); });
    projectDialog.showModal(); projectDialog.scrollTop = 0; unlockDialogs();
  }));
  projectDialog.querySelector('.dialog-close').addEventListener('click', closeProject);
  projectDialog.addEventListener('cancel', event => { event.preventDefault(); event.stopPropagation(); if (photoDialog.open) closePhoto(); else closeProject(); });
  projectDialog.addEventListener('close', unlockDialogs);
  document.getElementById('dialog-contact').addEventListener('click', closeProject);
  projectDialog.addEventListener('click', event => { if (event.target !== projectDialog) return; const r=projectDialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject(); });

  const stage = document.getElementById('zoom-stage'), full = document.getElementById('photo-full');
  const photoDownload = document.getElementById('photo-download');
  const photoNavigation = document.getElementById('photo-navigation');
  let zoom = 1, panX = 0, panY = 0, dragStart = null;
  const touchPoints = new Map(); let pinchStart = null;
  function renderZoom() {
    const maxX = Math.max(0, (full.offsetWidth * zoom - stage.clientWidth) / 2);
    const maxY = Math.max(0, (full.offsetHeight * zoom - stage.clientHeight) / 2);
    panX = Math.max(-maxX, Math.min(maxX,panX)); panY = Math.max(-maxY, Math.min(maxY,panY));
    full.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
    document.getElementById('zoom-value').textContent = Math.round(zoom * 100)+'%';
    stage.classList.toggle('is-zoomed',zoom > 1);
    document.getElementById('zoom-out').disabled = zoom <= 1;
    document.getElementById('zoom-in').disabled = zoom >= 4;
  }
  function setZoom(value) { zoom=Math.max(1,Math.min(4,value));if(zoom===1){panX=0;panY=0;}renderZoom(); }
  function showPhoto(index) {
    photoIndex = (index + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[photoIndex]; full.src=photo.src;full.alt=photo.title;
    document.getElementById('photo-title').textContent=photo.title;
    document.getElementById('photo-position').textContent=`${photoIndex+1} / ${activePhotos.length}`;
    touchPoints.clear();pinchStart=null;dragStart=null;panX=0;panY=0;setZoom(1);
  }
  function openPhoto(index) {
    photoNavigation.hidden = activePhotos.length < 2;
    photoDialog.classList.toggle('single-photo', photoNavigation.hidden);
    photoDialog.showModal();
    showPhoto(index);
    unlockDialogs();
  }
  document.getElementById('project-gallery').addEventListener('click', event => {
    const trigger=event.target.closest('[data-photo-index]');if(!trigger)return;
    photoDownload.hidden = true;
    openPhoto(Number(trigger.dataset.photoIndex));
  });
  const documentPreviews = {
    resume: {src:'assets/resume-preview.png', title:'个人简历', filename:'李炳坤个人简历.pdf'},
    card: {src:'assets/business-card.png', title:'个人名片', filename:'李炳坤个人名片.png'}
  };
  document.querySelectorAll('[data-preview]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const preview = documentPreviews[link.dataset.preview];
    activePhotos = [preview];
    photoDownload.href = link.href;
    photoDownload.download = preview.filename;
    photoDownload.hidden = false;
    openPhoto(0);
  }));
  function closePhoto() { photoDialog.close();unlockDialogs();touchPoints.clear();dragStart=null;stage.classList.remove('is-panning'); }
  photoDialog.querySelector('.photo-close').addEventListener('click', closePhoto);
  photoDialog.addEventListener('cancel', event => { event.preventDefault(); event.stopPropagation(); closePhoto(); });
  photoDialog.addEventListener('close', unlockDialogs);
  photoDialog.addEventListener('click', event => { if(event.target!==photoDialog)return;const r=photoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePhoto(); });
  document.getElementById('photo-prev').addEventListener('click', () => showPhoto(photoIndex-1));
  document.getElementById('photo-next').addEventListener('click', () => showPhoto(photoIndex+1));
  document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoom-.5));
  document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoom+.5));
  document.getElementById('zoom-reset').addEventListener('click', () => setZoom(1));
  full.addEventListener('load',renderZoom);
  stage.addEventListener('dblclick', () => setZoom(zoom>1?1:2));
  stage.addEventListener('wheel', event => { event.preventDefault();setZoom(zoom + (event.deltaY<0?.15:-.15)); },{passive:false});
  stage.addEventListener('pointerdown', event => {
    if(event.button!==0 && event.pointerType==='mouse')return;
    touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.setPointerCapture(event.pointerId);
    if(touchPoints.size===2){const a=[...touchPoints.values()];pinchStart={distance:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),zoom};dragStart=null;}
    else if(zoom>1){dragStart={x:event.clientX,y:event.clientY,panX,panY};stage.classList.add('is-panning');}
  });
  stage.addEventListener('pointermove', event => {
    if(!touchPoints.has(event.pointerId))return;
    touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(touchPoints.size===2&&pinchStart){const a=[...touchPoints.values()];setZoom(pinchStart.zoom*Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)/Math.max(1,pinchStart.distance));}
    else if(dragStart){panX=dragStart.panX+event.clientX-dragStart.x;panY=dragStart.panY+event.clientY-dragStart.y;renderZoom();}
  });
  function endDrag(event){touchPoints.delete(event.pointerId);dragStart=null;pinchStart=null;stage.classList.remove('is-panning');}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',event=>{if(!photoDialog.open)return;if(activePhotos.length>1&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();showPhoto(photoIndex+(event.key==='ArrowRight'?1:-1));}if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom+.5);}if(event.key==='-'){event.preventDefault();setZoom(zoom-.5);}});

  // A bounded, event-driven gold/green light trail; idle frames stop automatically.
  const canvas=document.getElementById('particle-trail'), context=canvas.getContext('2d');
  const trailToggle=document.getElementById('trail-toggle');
  let trailEnabled=true, particles=[], trailFrame=0, lastParticle=0;
  const finePointer=matchMedia('(pointer:fine)');
  function sizeCanvas(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);context.setTransform(dpr,0,0,dpr,0,0);}
  function trailAllowed(){return trailEnabled&&!reduced.matches&&finePointer.matches&&!document.hidden;}
  function drawTrail(now){context.clearRect(0,0,innerWidth,innerHeight);particles=particles.filter(p=>now-p.born<650);particles.forEach(p=>{const age=(now-p.born)/650;context.globalAlpha=(1-age)*.6;context.fillStyle=p.color;context.beginPath();context.arc(p.x+p.dx*age,p.y+p.dy*age,Math.max(.1,p.size*(1-age)),0,Math.PI*2);context.fill();});context.globalAlpha=1;if(particles.length&&trailAllowed())trailFrame=requestAnimationFrame(drawTrail);else trailFrame=0;}
  function clearTrail(){particles=[];if(trailFrame)cancelAnimationFrame(trailFrame);trailFrame=0;context.clearRect(0,0,innerWidth,innerHeight);}
  sizeCanvas();addEventListener('resize',sizeCanvas);
  addEventListener('pointermove',event=>{const now=performance.now();if(!trailAllowed()||now-lastParticle<24||event.pointerType==='touch')return;lastParticle=now;particles.push({x:event.clientX,y:event.clientY,born:now,dx:(Math.random()-.5)*28,dy:Math.random()*20,size:1+Math.random()*2,color:Math.random()>.5?'#a77d34':'#47664b'});if(particles.length>35)particles.shift();if(!trailFrame)trailFrame=requestAnimationFrame(drawTrail);},{passive:true});
  trailToggle.addEventListener('click',()=>{trailEnabled=!trailEnabled;trailToggle.textContent='光效 · '+(trailEnabled?'开':'关');trailToggle.setAttribute('aria-pressed',String(trailEnabled));if(!trailEnabled)clearTrail();});
  reduced.addEventListener('change',()=>{if(reduced.matches)clearTrail();});document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTrail();});
  document.getElementById('year').textContent=new Intl.DateTimeFormat('en',{timeZone:'Asia/Shanghai',year:'numeric'}).format(new Date());
})();

