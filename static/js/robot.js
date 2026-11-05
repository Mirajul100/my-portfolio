import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#robot-canvas");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (finePointer.matches) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
  } catch (error) {
    console.error("Could not initialize the 3D robot preview.", error);
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(190, 220, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 190 / 220, 0.1, 100);
    camera.position.set(0, 0.15, 4.5);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const robot = new THREE.Group();
    scene.add(robot);

    new GLTFLoader().load(
      "/colored_model.glb",
      ({ scene: model, animations }) => {
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 1.75 / Math.max(size.x, size.y, size.z);

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );
        robot.add(model);

        if (animations.length) {
          const mixer = new THREE.AnimationMixer(model);
          animations.forEach((clip) => mixer.clipAction(clip).play());
          robot.userData.mixer = mixer;
        }
      },
      undefined,
      (error) => console.error("Could not load colored_model.glb.", error),
    );

    const pointer = new THREE.Vector2();
    const position = new THREE.Vector2();
    const clock = new THREE.Clock();
    let active = false;

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      pointer.set(event.clientX, event.clientY);
      if (!active) {
        position.copy(pointer);
        active = true;
        canvas.classList.add("is-visible");
      }
    });

    window.addEventListener("pointerout", (event) => {
      if (event.relatedTarget) return;
      active = false;
      canvas.classList.remove("is-visible");
    });

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (active) {
        const side = pointer.x > window.innerWidth - width - 32 ? -1 : 1;
        const left = THREE.MathUtils.clamp(
          pointer.x + side * (width * 0.68),
          0,
          window.innerWidth - width,
        );
        const top = THREE.MathUtils.clamp(
          pointer.y - height / 2,
          0,
          window.innerHeight - height,
        );
        const smooth = reducedMotion.matches ? 1 : 0.14;

        position.x += (left - position.x) * smooth;
        position.y += (top - position.y) * smooth;
        canvas.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;

        const robotCenterX = position.x + width / 2;
        const robotCenterY = position.y + height / 2;
        const lookX = THREE.MathUtils.clamp(
          (pointer.x - robotCenterX) / (width * 0.65),
          -0.55,
          0.55,
        );
        const lookY = THREE.MathUtils.clamp(
          (pointer.y - robotCenterY) / (height * 0.8),
          -0.3,
          0.3,
        );

        robot.rotation.y += (lookX - robot.rotation.y) * 0.1;
        robot.rotation.x += (-lookY - robot.rotation.x) * 0.1;
        if (!reducedMotion.matches) {
          robot.rotation.y += 0.002;
          robot.position.y = Math.sin(elapsed * 1.3) * 0.055;
        }
      }

      if (robot.userData.mixer) robot.userData.mixer.update(delta);
      renderer.render(scene, camera);
    }

    animate();
  }
}
