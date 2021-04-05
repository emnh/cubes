const gpuMod = require('gpu.js');
const THREE = require("three");
const $ = require("jquery");

const main = function() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer( { antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const container = new THREE.Object3D();
  scene.add(container);

  const k = 20;
  const l = 2 * k + 1;
  const m = l * l * l;
  const sc = 2.0 / l;
  const sc2 = sc * 1.0;

	const gpu = new gpuMod.GPU();
	const ks = [];
  for (let i = -k; i <= k; i++) {
    ks.push(i);
  }
  //const klen = Math.ceil(Math.sqrt(ks.length)) * ks.length;
  const klen = ks.length;
  const createGeo = gpu.createKernel(function(a, b, c) {
    let x = a[this.thread.x];
    let y = b[this.thread.y];
    let z = c[this.thread.z];
    const k = this.constants.k;
    const sc = this.constants.sc;
    const dx = x;
    const dy = y;
    const dz = z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const present = (k - 1 <= d && d < k) ? 1 : 0;
    return [x * sc, y * sc, z * sc, present];
  }).setOutput([klen, klen, klen]).setConstants({
    k, sc
  });
  const out = createGeo(ks, ks, ks);

  /*
  let i = 0;
  const mats = [];
  const colors = [];
  const f = (x) => ((x + k) / l) + Math.random();
  for (let x = -k; x <= k; x++) {
    for (let y = -k; y <= k; y++) {
      for (let z = -k; z <= k; z++) {
        //const color = new THREE.Color(Math.random() * 0xffffff);
        const color = new THREE.Color(f(x), f(y), f(z));
        const matScale = new THREE.Matrix4();
        matScale.makeScale(sc, sc, sc);
        const matTransform = new THREE.Matrix4();
        matTransform.makeTranslation(x * sc2, y * sc2, z * sc2);
        const matMul = new THREE.Matrix4();
        matMul.multiplyMatrices(matTransform, matScale);
        const dx = x;
        const dy = y;
        const dz = z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (k - 1 <= d && d < k) {
          mats.push(matMul);
          colors.push(color);
          i += 1;
        }
      }
    }
  }
  */
  const vertexShader = `
	varying vec3 vUv;

	void main() {
		vUv = position;

		vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * modelViewPosition;
	}
`;

  const fragmentShader = `
	varying vec3 vUv;

	void main() {
		gl_FragColor = vec4(1.0);
	}
`;

	const material = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 1.0 },
			resolution: { value: new THREE.Vector2() }
		},
		vertexShader,
		fragmentShader
	});

  const geometry = new THREE.BoxGeometry();
  //const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const cube = new THREE.InstancedMesh(geometry, material, m);
  //console.log("Cubes", i);
  container.add(cube);
  /*
  for (let j = 0; j < m; j++) {
    //cube.setColorAt(j, colors[j]);
    cube.setColorAt(j, new THREE.Color(Math.random() * 0xffffff));
    const matTransform = new THREE.Matrix4();
    matTransform.makeTranslation(x * sc2, y * sc2, z * sc2);
    const matMul = new THREE.Matrix4();
    matMul.multiplyMatrices(matTransform, matScale);
    cube.setMatrixAt(j, mats[j]);
  }
  */

  const light = new THREE.DirectionalLight({ color: 0xffffff });
  light.position.set(10.0, 10.0, 10.0);
  light.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
  scene.add(light);

  const light2 = new THREE.PointLight({ color: 0xffffff });
  light2.position.set(0, 0, 5);
  scene.add(light2);

  const animate = function() {
    requestAnimationFrame(animate);
    container.rotation.x += 0.01;
    container.rotation.y += 0.01;
    //const sc = (Math.sin(performance.now() / 1000.0) + 2.0) * 1.0;
    //container.scale.set(sc, sc, sc);
    renderer.render(scene, camera);
  };

  animate();
};

$(main);

