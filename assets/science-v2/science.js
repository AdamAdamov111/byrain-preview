/* Искусство биохимии: интерактив страницы */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  // появление блоков
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{threshold:.12});
  $$('.reveal').forEach(function(el){io.observe(el);});
  // параллакс героя
  var bg=$('.sci-hero__bg img');
  if(bg&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.addEventListener('scroll',function(){var y=window.scrollY;if(y<1200)bg.style.setProperty('--py',(y*.18)+'px');},{passive:true});}
  // счётчики
  $$('[data-count]').forEach(function(el){var end=parseInt(el.getAttribute('data-count'),10),done=false;var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!done){done=true;var t0=null;function tick(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1100);var v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=v;if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}});},{threshold:.5});o.observe(el);});
  // принципы
  $$('.prin').forEach(function(p){var b=$('.prin__more',p);if(!b)return;b.addEventListener('click',function(){var open=p.classList.toggle('is-open');b.textContent=open?'Свернуть':'Подробнее';});});
  // путь молекулы
  var steps=$$('.step'),imgs=$$('.path__stage img'),cap=$('.path__stage figcaption b'),capS=$('.path__stage figcaption span'),si=0,st=null;
  function setStep(i){si=i;steps.forEach(function(s,n){s.classList.toggle('is-active',n===i);s.setAttribute('aria-expanded',n===i);});imgs.forEach(function(im,n){im.classList.toggle('is-on',n===i);});if(cap)cap.textContent=steps[i].getAttribute('data-cap')||'';if(capS)capS.textContent='0'+(i+1)+' / 0'+steps.length;}
  steps.forEach(function(s,i){s.addEventListener('click',function(){setStep(i);clearInterval(st);});});
  if(steps.length){setStep(0);var ps=$('.path');var po=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){clearInterval(st);st=setInterval(function(){setStep((si+1)%steps.length);},4500);}else clearInterval(st);});},{threshold:.3});po.observe(ps);}
  // атлас
  var tabs=$$('.atlas__tabs button'),panels=$$('.atlas__panel');
  tabs.forEach(function(t,i){t.addEventListener('click',function(){tabs.forEach(function(x,n){x.setAttribute('aria-selected',n===i);});panels.forEach(function(p,n){p.classList.toggle('is-on',n===i);});});});
  // фильтры библиотеки
  var fbs=$$('.filters button'),papers=$$('.paper'),cnt=$('#lib-count');
  fbs.forEach(function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-f');fbs.forEach(function(x){x.setAttribute('aria-pressed',x===b);});var n=0;papers.forEach(function(p){var ok=f==='all'||(' '+p.getAttribute('data-tags')+' ').indexOf(' '+f+' ')>-1;p.classList.toggle('is-hidden',!ok);if(ok)n++;});if(cnt)cnt.textContent=n;});});
  // просмотр PDF
  var m=$('#pdfm'),fr=$('#pdfm-frame'),mt=$('#pdfm-title'),ms=$('#pdfm-sub'),md=$('#pdfm-dl'),mo=$('#pdfm-open'),last=null;
  function openPdf(btn){
    var p=btn.closest('.paper');var href=p.getAttribute('data-pdf');last=btn;
    if(window.self!==window.top){var w=window.open(href,'_blank','noopener');if(w)return;}
    mt.textContent=$('h3',p).textContent;ms.textContent=$('.paper__src',p).textContent;md.href=href;if(mo)mo.href=href;fr.src=href+'#view=FitH';m.hidden=false;document.body.style.overflow='hidden';$('#pdfm-close').focus();
  }
  function closePdf(){m.hidden=true;fr.src='about:blank';document.body.style.overflow='';if(last)last.focus();}
  $$('[data-view]').forEach(function(b){b.addEventListener('click',function(){openPdf(b);});});
  if(m){$('#pdfm-close').addEventListener('click',closePdf);m.addEventListener('click',function(e){if(e.target===m)closePdf();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden)closePdf();});}
  // скачивание через возможность артефакта, если страница открыта в просмотрщике claude.ai
  var dl=null;
  if(window.claude&&typeof window.claude.use==='function'){try{window.claude.use('downloads').then(function(ns){dl=ns||null;}).catch(function(){});}catch(e){}}
  $$('a[download]').forEach(function(a){a.addEventListener('click',function(e){
    if(!dl)return;
    e.preventDefault();
    if(a.getAttribute('data-busy'))return;
    var href=a.getAttribute('href'),name=href.split('/').pop();
    a.setAttribute('data-busy','1');
    fetch(href).then(function(r){return r.blob();}).then(function(b){return dl.save({filename:name,data:b});}).catch(function(){}).then(function(){a.setAttribute('data-busy','');});
  });});
  // почему уникальны: заголовки по словам, появление, стопка карточек
  $$('[data-split]').forEach(function(el){var words=el.textContent.trim().split(/\s+/);el.textContent='';words.forEach(function(w,i){var s=document.createElement('span');s.className='w';s.textContent=w;s.style.transitionDelay=(i*45)+'ms';el.appendChild(s);el.appendChild(document.createTextNode(' '));});});
  var pillars=$$('[data-pillar]');
  if(pillars.length){
    var pio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');}});},{threshold:.35});
    pillars.forEach(function(p){pio.observe(p);});
    var stackOn=window.matchMedia('(min-width: 861px)');
    function stack(){if(!stackOn.matches){pillars.forEach(function(p){p.classList.remove('is-back');});return;}pillars.forEach(function(p,i){var nxt=pillars[i+1];if(!nxt){p.classList.remove('is-back');return;}var r=nxt.getBoundingClientRect();p.classList.toggle('is-back',r.top<window.innerHeight*.55);});}
    window.addEventListener('scroll',stack,{passive:true});window.addEventListener('resize',stack);stack();
  }
  // боковая навигация
  var secs=$$('[data-nav]'),dots=$$('.sidenav a');
  if(secs.length){var no=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var id=e.target.id;dots.forEach(function(d){d.classList.toggle('is-on',d.getAttribute('href')==='#'+id);});}});},{rootMargin:'-40% 0px -50% 0px'});secs.forEach(function(s){no.observe(s);});}
  // пометки для согласования
  var dt=$('#dev-toggle');if(dt){dt.addEventListener('click',function(){var on=document.documentElement.classList.toggle('dev');dt.setAttribute('aria-pressed',on);});}
})();

/* пометки для согласования видны только с ?dev в адресе */
(function(){var dt=document.getElementById('dev-toggle');if(dt&&!/[?&]dev(=|&|$)/.test(location.search)){dt.hidden=true;document.documentElement.classList.remove('dev');}})();
