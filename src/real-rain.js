function init() {
  scene = new THREE. Scene();
  camera = new THREE.PerspectiveCamera (60,window.innerWidth / window. innerHeight, 1, 1000);
  camera.position.z = 1;
  camera.rotation.x = 1.16;
  camera.rotation.y = -0.12;
  camera.rotation.z = 0.27;
  ambient = new THREE. AmbientLight (0x555555);
  scene.add (ambient);
  directionalLight = new THREE.DirectionalLight(0xffeedd);
  directionalLight.position.set(0,0,1);
  scene.add (directionalLight);
  renderer = new THREE. WebGLRenderer();
  renderer.setSize(window.innerWidth, window. innerHeight); document.body-appendChild(renderer.domElement);
}