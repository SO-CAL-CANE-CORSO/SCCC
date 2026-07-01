/* ============ SCCC cinematic engine ============ */
/* Expects globals from CDN (loaded in <head>): gsap, ScrollTrigger, Lenis, THREE. All optional/guarded. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  function initLenis() {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ duration: 1.15, easing: function (t){return Math.min(1,1.001-Math.pow(2,-10*t));}, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasGSAP) { lenis.on("scroll", ScrollTrigger.update); }
  }

  /* ---------- Loader intro ---------- */
  function initLoader() {
    var loader = doc.querySelector(".loader");
    if (!loader) { start(); return; }
    doc.body.classList.add("loading");
    var bar = loader.querySelector(".loader__bar");
    var num = loader.querySelector(".loader__num");
    var p = { v: 0 };
    function done() {
      doc.body.classList.remove("loading");
      if (hasGSAP) {
        gsap.to(loader, { yPercent: -100, duration: 1, ease: "expo.inOut", onComplete: function(){ loader.remove(); } });
      } else { loader.style.display = "none"; }
      start();
    }
    if (hasGSAP && !reduce) {
      gsap.to(p, { v: 100, duration: 1.6, ease: "power2.inOut",
        onUpdate: function(){ if(bar) bar.style.width = p.v + "%"; if(num) num.textContent = String(Math.round(p.v)).padStart(3,"0"); },
        onComplete: done });
      gsap.from(".loader__mark", { yPercent: 120, duration: 1.1, ease: "expo.out" });
    } else { if(bar) bar.style.width="100%"; setTimeout(done, 250); }
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (window.matchMedia("(hover:none)").matches) return;
    var dot = doc.createElement("div"); dot.className = "cursor";
    var ring = doc.createElement("div"); ring.className = "cursor-ring";
    doc.body.append(dot, ring);
    var mx=0,my=0,rx=0,ry=0;
    window.addEventListener("mousemove", function(e){ mx=e.clientX; my=e.clientY; dot.style.transform="translate("+mx+"px,"+my+"px) translate(-50%,-50%)"; });
    (function loop(){ rx+=(mx-rx)*.16; ry+=(my-ry)*.16; ring.style.transform="translate("+rx+"px,"+ry+"px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    doc.querySelectorAll("a,button,.card,.look__item,.size,summary").forEach(function(el){
      el.addEventListener("mouseenter", function(){ ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function(){ ring.classList.remove("is-hover"); });
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = doc.querySelector(".nav");
    var burger = doc.querySelector(".burger");
    var menu = doc.querySelector(".menu");
    if (nav) {
      var onScroll = function(){ nav.classList.toggle("scrolled", window.scrollY > 40); };
      onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    }
    if (burger && menu) {
      function setOpen(open){
        menu.classList.toggle("open", open); burger.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", String(open));
        menu.setAttribute("aria-hidden", String(!open));
        if (open) { menu.removeAttribute("inert"); } else { menu.setAttribute("inert", ""); }
        doc.body.style.overflow = open ? "hidden" : "";
      }
      burger.addEventListener("click", function(){ setOpen(!menu.classList.contains("open")); });
      menu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ setOpen(false); }); });
      doc.addEventListener("keydown", function(e){ if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false); });
      setOpen(false);
    }
  }

  /* ---------- Page transition ---------- */
  function initTransitions() {
    var pt = doc.querySelector(".pt");
    if (hasGSAP && !reduce && pt) gsap.set(pt, { yPercent: 100 });
    doc.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute("href");
      if (!href || href.charAt(0)==="#" || a.target==="_blank" || href.indexOf("http")===0 || href.indexOf("mailto")===0) return;
      a.addEventListener("click", function(e){
        if (!hasGSAP || reduce || !pt) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        gsap.timeline()
          .set(pt,{yPercent:100})
          .to(pt,{yPercent:0,duration:.6,ease:"expo.inOut"})
          .add(function(){ window.location.href = href; });
      });
    });
  }

  /* ---------- Reveal + scroll animations ---------- */
  function initReveals() {
    if (!hasGSAP) { doc.querySelectorAll(".reveal").forEach(function(el){el.style.opacity=1;el.style.transform="none";}); doc.querySelectorAll(".reveal-line>*").forEach(function(el){el.style.transform="none";}); return; }
    if (reduce) { gsap.set(".reveal,.reveal-line>*",{opacity:1,y:0,yPercent:0}); return; }
    doc.querySelectorAll(".reveal-line").forEach(function(line){
      var inner = line.children[0]; if(!inner) return;
      gsap.to(inner,{yPercent:0,duration:1.1,ease:"expo.out",scrollTrigger:{trigger:line,start:"top 88%"}});
    });
    ScrollTrigger.batch(".reveal",{start:"top 86%",onEnter:function(b){ gsap.to(b,{opacity:1,y:0,duration:1,stagger:.09,ease:"power3.out"}); }});
    var hero = doc.querySelector(".hero");
    if (hero) {
      var img = hero.querySelector(".hero__img");
      if (img) gsap.fromTo(img,{scale:1.15,yPercent:0},{yPercent:18,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:true}});
      gsap.to(hero.querySelector(".hero__in"),{yPercent:-30,opacity:0,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:true}});
    }
    doc.querySelectorAll(".story__panel").forEach(function(panel){
      var bg = panel.querySelector(".story__bg");
      if (bg) gsap.fromTo(bg,{scale:1.2},{scale:1,ease:"none",scrollTrigger:{trigger:panel,start:"top bottom",end:"bottom top",scrub:true}});
    });
  }

  /* ---------- Marquee ---------- */
  function initMarquee() {
    doc.querySelectorAll(".marquee__track").forEach(function(track){
      if (reduce) return;
      var dir = track.dataset.dir === "right" ? 1 : -1;
      var html = track.innerHTML; track.innerHTML = html + html;
      var x = 0, w = track.scrollWidth / 2, speed = 0.4;
      (function move(){ x += speed*dir; if (dir<0 && x<=-w) x=0; if (dir>0 && x>=0) x=-w; track.style.transform="translateX("+x+"px)"; requestAnimationFrame(move); })();
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (window.matchMedia("(hover:none)").matches || reduce || !hasGSAP) return;
    doc.querySelectorAll("[data-magnetic]").forEach(function(el){
      el.addEventListener("mousemove", function(e){ var r=el.getBoundingClientRect(); gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.35,y:(e.clientY-r.top-r.height/2)*.5,duration:.5,ease:"power3.out"}); });
      el.addEventListener("mouseleave", function(){ gsap.to(el,{x:0,y:0,duration:.6,ease:"elastic.out(1,.4)"}); });
    });
  }

  /* ---------- WebGL smoke / gold-dust shader ---------- */
  function initWebGL() {
    var mount = doc.querySelector(".hero__canvas");
    if (!mount || !window.THREE || reduce) return;
    var w = mount.clientWidth, h = mount.clientHeight;
    var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(w, h); mount.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    var uniforms = {
      u_time:{value:0}, u_res:{value:new THREE.Vector2(w,h)}, u_mouse:{value:new THREE.Vector2(.5,.5)}
    };
    var frag = [
      "precision highp float;",
      "uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;",
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
      "return mix(mix(hash(i+vec2(0.0,0.0)),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
      "float fbm(vec2 p){float v=0.0;float a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);",
      "for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=0.5;}return v;}",
      "void main(){vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv;p.x*=u_res.x/u_res.y;",
      "float t=u_time*0.04;",
      "vec2 q=vec2(fbm(p+t),fbm(p-t+5.2));",
      "vec2 r=vec2(fbm(p+q*1.5+vec2(1.7,9.2)+t),fbm(p+q*1.5+vec2(8.3,2.8)-t));",
      "float f=fbm(p+r*1.2);",
      "float md=distance(uv,u_mouse);float glow=smoothstep(0.6,0.0,md)*0.35;",
      "vec3 base=vec3(0.02,0.02,0.025);",
      "vec3 smoke=mix(base,vec3(0.08,0.08,0.09),f*f);",
      "vec3 gold=vec3(0.78,0.63,0.29);",
      "float veins=smoothstep(0.55,0.85,f+r.x*0.3);",
      "vec3 col=mix(smoke,gold,veins*0.5+glow);",
      "col+=gold*glow;",
      "col*=0.5+0.5*smoothstep(1.1,0.1,length(uv-0.5));",
      "gl_FragColor=vec4(col,1.0);}"
    ].join("\n");
    var mat = new THREE.ShaderMaterial({ uniforms:uniforms, fragmentShader:frag, vertexShader:"void main(){gl_Position=vec4(position,1.0);}" });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));
    window.addEventListener("mousemove", function(e){ uniforms.u_mouse.value.x=e.clientX/window.innerWidth; uniforms.u_mouse.value.y=1.0-e.clientY/window.innerHeight; });
    function resize(){ w=mount.clientWidth; h=mount.clientHeight; renderer.setSize(w,h); uniforms.u_res.value.set(w,h); }
    window.addEventListener("resize", resize);
    var vis = true; doc.addEventListener("visibilitychange", function(){ vis=!doc.hidden; });
    (function render(time){ if(vis){ uniforms.u_time.value=time*0.001; renderer.render(scene,camera); } requestAnimationFrame(render); })();
  }

  /* ---------- Product page interactions ---------- */
  function initPDP() {
    var reserveLink = doc.querySelector("[data-reserve]");
    doc.querySelectorAll(".sizes").forEach(function(g){
      g.querySelectorAll(".size").forEach(function(s){
        s.addEventListener("click", function(){
          g.querySelectorAll(".size").forEach(function(x){x.classList.remove("sel");});
          s.classList.add("sel");
          if (reserveLink) {
            var url = new URL(reserveLink.href, window.location.href);
            url.searchParams.set("size", s.textContent.trim());
            reserveLink.href = url.pathname + url.search;
          }
        });
      });
    });
  }

  /* ---------- Reserve-flow prefill (contact page arrived at via "Reserve this piece") ---------- */
  function initReservePrefill() {
    var params = new URLSearchParams(window.location.search);
    var product = params.get("product");
    if (!product) return;
    var size = params.get("size");
    var productField = doc.getElementById("reserve-product");
    var msgField = doc.getElementById("msg");
    var label = product.replace(/-/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
    if (productField) productField.value = label + (size ? " (Size " + size + ")" : "");
    if (msgField && !msgField.value) {
      msgField.value = "Reserve request: " + label + (size ? ", Size " + size : "");
    }
  }

  /* ---------- Forms ---------- */
  function initForms() {
    doc.querySelectorAll("form[data-form]").forEach(function(f){
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var s = f.querySelector(".form__status");
        var btn = f.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        if (s) s.textContent = "Sending\u2026";
        fetch(f.action, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
          .then(function(res){
            if (res.ok) {
              if (s) s.textContent = "Thank you \u2014 you're on the list. We'll be in touch.";
              f.reset();
            } else {
              res.json().then(function(data){
                var msg = (data && data.errors && data.errors.length) ? data.errors.map(function(x){return x.message;}).join(", ") : "Something went wrong \u2014 please try again or email us directly.";
                if (s) s.textContent = msg;
              }).catch(function(){ if (s) s.textContent = "Something went wrong \u2014 please try again or email us directly."; });
            }
          })
          .catch(function(){ if (s) s.textContent = "Network error \u2014 please try again or email us directly."; })
          .finally(function(){ if (btn) btn.disabled = false; });
      });
    });
  }

  function start() {
    initReveals(); initMarquee(); initMagnetic(); initWebGL();
    if (hasGSAP && !reduce) ScrollTrigger.refresh();
  }

  doc.addEventListener("DOMContentLoaded", function(){
    initLenis(); initCursor(); initNav(); initTransitions(); initPDP(); initForms(); initReservePrefill();
    initLoader();
  });
})();
