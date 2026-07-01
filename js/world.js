/* ============ SCCC "The Yard at Dusk" — homepage 3D hero ============ */
(function () {
  "use strict";
  var mount = document.getElementById("world");
  if (!mount || typeof THREE === "undefined") return;
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0c0a, 0.055);

  var camera = new THREE.PerspectiveCamera(52, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 100);
  camera.position.set(0, 1.4, 9);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  // ground
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x0a0908, roughness: 0.85, metalness: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.6;
  scene.add(ground);

  // gold monolith
  var monolith = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 5.4, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x14120e, roughness: 0.35, metalness: 0.9,
      emissive: 0xc9a24a, emissiveIntensity: 0.35
    })
  );
  monolith.position.y = 0.9;
  scene.add(monolith);

  // crest decal on the monolith
  var crest = null;
  new THREE.TextureLoader().load("assets/brand/mark-glyph-gold.png", function (tex) {
    crest = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    crest.position.set(0, 1.4, 0.26);
    scene.add(crest);
  });

  // dust particles -- fewer on small/low-power screens
  var isSmall = mount.clientWidth < 700;
  var N = isSmall ? 350 : 900;
  var pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = Math.random() * 14 - 1.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  var dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: 0xc9a24a, size: 0.03, transparent: true, opacity: 0.6 })
  );
  scene.add(dust);

  // lights
  scene.add(new THREE.AmbientLight(0x1b1a17, 1.0));
  var key = new THREE.SpotLight(0xffd27a, 3.2, 40, Math.PI / 6, 0.4, 1.2);
  key.position.set(5, 10, 6); scene.add(key);
  var rim = new THREE.PointLight(0xc9a24a, 2.0, 30); rim.position.set(-6, 3, -4); scene.add(rim);

  // interaction
  var mx = 0, my = 0, scroll = 0;
  if (!reduce) {
    addEventListener("mousemove", function (e) {
      mx = (e.clientX / innerWidth - 0.5);
      my = (e.clientY / innerHeight - 0.5);
    });
    addEventListener("scroll", function () {
      scroll = Math.min(window.scrollY / innerHeight, 1);
    }, { passive: true });
  }

  addEventListener("resize", function () {
    camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  });

  if (reduce) {
    // Static frame only -- no continuous camera drift for reduced-motion users.
    camera.lookAt(0, 0.9, 0);
    renderer.render(scene, camera);
    return;
  }

  var t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.005;
    monolith.rotation.y = t * 0.4;
    if (crest) crest.rotation.y = monolith.rotation.y;
    dust.rotation.y = t * 0.05;
    dust.position.y = Math.sin(t) * 0.2;

    camera.position.x += (mx * 3 - camera.position.x) * 0.05;
    camera.position.y += ((1.4 - my * 1.5) - camera.position.y) * 0.05;
    camera.position.z += ((9 - scroll * 5) - camera.position.z) * 0.05;
    camera.lookAt(0, 0.9, 0);
    renderer.render(scene, camera);
  })();
})();
