const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const state = { data:null, filter:'all' };

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function init(){
  $('#year').textContent = new Date().getFullYear();
  bindUI();
  setupEffects();
  try{
    const r = await fetch('/api/portfolio', {headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('API error');
    state.data = await r.json();
    render(state.data);
  }catch(e){
    console.error(e);
    $('#bio').textContent = 'Portfolio data could not be loaded. Please refresh the page.';
  }
}

function render(data){
  const p = data.profile;
  $('#headline').textContent = p.headline;
  $('#bio').textContent = p.bio;
  $('#availability').textContent = p.availability?.toUpperCase() || 'AVAILABLE FOR OPPORTUNITIES';
  $('#stats').innerHTML = data.stats.map(s => `<div class="stat"><span class="mono">${escapeHtml(s.label.toUpperCase())}</span><b>${escapeHtml(s.value)}</b><small>${escapeHtml(s.caption || '')}</small></div>`).join('');
  $('#experienceList').innerHTML = data.experiences.map((e,i) => `<article class="timeline-item"><div class="timeline-num mono">0${i+1}</div><div class="timeline-main"><div class="timeline-top"><span>${escapeHtml(e.company)}</span><span>${escapeHtml(e.period)}</span></div><h3>${escapeHtml(e.role)}</h3><p>${escapeHtml(e.description)}</p><div class="tag-row">${escapeHtml(e.tags).split('·').map(t=>`<span class="tag">${escapeHtml(t.trim())}</span>`).join('')}</div><ul>${e.achievements.map(a=>`<li>${escapeHtml(a)}</li>`).join('')}</ul></div></article>`).join('');
  renderProjects();
  $('#skillList').innerHTML = data.skills.map(s => `<div class="skill-row"><div class="skill-label"><span>${escapeHtml(s.name)}</span><span>${s.level}%</span></div><div class="skill-group">${escapeHtml(s.group_name)}</div><div class="skill-track"><i style="--level:${Math.min(100,Math.max(0,Number(s.level)||0))}%"></i></div></div>`).join('');
}

function renderProjects(){
  const items = state.data.projects.filter(p => state.filter === 'all' || p.category.includes(state.filter));
  $('#projectGrid').innerHTML = items.map((p,i)=>`<article class="project-card ${p.featured?'featured':''}" data-project="${escapeHtml(p.slug)}"><div class="project-image"><div class="project-label mono">${escapeHtml(p.category)}</div><div class="project-code">${String(i+1).padStart(2,'0')}</div><div class="project-lines"></div><div class="project-badge">${p.stats?.[0]?.v ?? ''}<small>${p.stats?.[0]?.l ?? ''}</small></div></div><div class="project-info"><div class="project-index mono">PROJECT / ${escapeHtml(p.portfolio_page ? `PAGE ${p.portfolio_page}` : 'CASE STUDY')}</div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.subtitle)}</p><div class="tag-row">${escapeHtml(p.tools).split('·').map(t=>`<span class="tag">${escapeHtml(t.trim())}</span>`).join('')}</div><button class="text-link">VIEW DETAILS ↗</button></div></article>`).join('');
  $$('#projectGrid [data-project]').forEach(card=>card.addEventListener('click',()=>openProject(card.dataset.project)));
}

function bindUI(){
  $('#menuBtn').addEventListener('click',()=>$('#navLinks').classList.toggle('open'));
  $$('#navLinks a').forEach(a=>a.addEventListener('click',()=>$('#navLinks').classList.remove('open')));
  $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{ $$('.filter').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); state.filter=btn.dataset.filter; renderProjects(); }));
  $$('#openPortfolio').forEach(b=>b.addEventListener('click',openPdf));
  $$('.mini-btn').filter(x=>x.id==='copyEmail').forEach(b=>b.addEventListener('click',()=>copyEmail($('#copyEmail'))));
  $$('[data-email]').forEach(x=>x.addEventListener('click',openEmail));
  $('#modalCopy').addEventListener('click',()=>copyEmail($('#modalCopy')));
  $$('[data-close]').forEach(x=>x.addEventListener('click',closeEmail));
  $$('[data-close-project]').forEach(x=>x.addEventListener('click',closeProject));
  $$('[data-close-pdf]').forEach(x=>x.addEventListener('click',closePdf));
  $$('[data-close-message]').forEach(x=>x.addEventListener('click',closeMessage));
  $('#pmPdf').addEventListener('click',()=>{closeProject();openPdf();});
  $('#openMessage').addEventListener('click',openMessage);
  $('#contactForm').addEventListener('submit',sendMessage);
  document.addEventListener('keydown', e=>{if(e.key==='Escape'){closeEmail();closeProject();closePdf();closeMessage();}});
}

function setModal(el, open){el.classList.toggle('open',open);el.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('no-scroll', open);}
const emailModal=$('#emailModal'), projectModal=$('#projectModal'), pdfModal=$('#pdfModal'), messageModal=$('#messageModal');
function openEmail(){setModal(emailModal,true)} function closeEmail(){setModal(emailModal,false)}
function openProject(slug){
  const p=state.data.projects.find(x=>x.slug===slug); if(!p)return;
  $('#pmCategory').textContent=p.category; $('#pmTitle').textContent=p.title; $('#pmDescription').textContent=p.description;
  $('#pmStats').innerHTML=p.stats.map(s=>`<div><b>${escapeHtml(s.v)}</b><span>${escapeHtml(s.l)}</span></div>`).join('');
  $('#pmDetails').innerHTML=p.details.map(x=>`<div>› ${escapeHtml(x)}</div>`).join('');
  $('#pmTools').innerHTML=escapeHtml(p.tools).split('·').map(t=>`<span class="tag">${escapeHtml(t.trim())}</span>`).join('');
  $('#pmPdf').style.display=p.portfolio_page?'inline-flex':'none';
  if(p.portfolio_page) $('#pdfFrame').src=`/assets/portfolio.pdf#page=${p.portfolio_page}&view=FitH`;
  setModal(projectModal,true);
}
function closeProject(){setModal(projectModal,false)}
function openPdf(){ $('#pdfFrame').src='/assets/portfolio.pdf#page=1&view=FitH'; setModal(pdfModal,true)} function closePdf(){setModal(pdfModal,false)}
function openMessage(){setModal(messageModal,true)} function closeMessage(){setModal(messageModal,false)}

async function copyEmail(button){
  const email='dezadzulhian@gmail.com';
  try{await navigator.clipboard.writeText(email); $('#copyStatus').textContent='Copied: '+email; if(button) button.textContent='COPIED ✓'; setTimeout(()=>{if(button)button.textContent='COPY EMAIL'},1600);}catch{$('#copyStatus').textContent=email;}
}

async function sendMessage(e){
  e.preventDefault();
  const form=e.currentTarget, status=$('#formStatus'), button=form.querySelector('button[type=submit]');
  button.disabled=true; status.textContent='Sending…';
  try{
    const payload=Object.fromEntries(new FormData(form).entries());
    const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok) throw new Error(data.message||'Unable to send');
    status.textContent=data.message; form.reset();
  }catch(err){status.textContent=err.message;}
  finally{button.disabled=false;}
}

function setupEffects(){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.1});
  $$('.reveal').forEach(x=>io.observe(x));
  const glow=$('.cursor-orb'); window.addEventListener('pointermove', e=>{glow.style.transform=`translate3d(${e.clientX-150}px,${e.clientY-150}px,0)`});
  const canvas=$('#particles'), ctx=canvas.getContext('2d'); let dots=[];
  function resize(){canvas.width=innerWidth;canvas.height=innerHeight;const count=Math.min(90,Math.floor(innerWidth/16));dots=Array.from({length:count},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.2+.2}));}
  resize(); addEventListener('resize',resize);
  (function tick(){ctx.clearRect(0,0,canvas.width,canvas.height);dots.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(214,255,109,.38)';ctx.fill();});requestAnimationFrame(tick);})();
}
init();
