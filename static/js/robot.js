import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#robot-canvas");
const assistant = document.querySelector("#pika-assistant");
const greeting = document.querySelector("#robot-greeting");
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

    const pointer = new THREE.Vector2();
    const position = new THREE.Vector2(
      Math.max(0, window.innerWidth - 214),
      Math.max(0, window.innerHeight - 244),
    );
    const clock = new THREE.Clock();
    let active = false;
    let mixer;
    let idleAction;
    let greetingAction;
    let reactionAction;
    let currentAction;
    let bubbleTimer;
    let expressionStart = -Infinity;
    let leftEyeExpression;
    let rightEyeExpression;
    let activeSection = "top";

    assistant.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    assistant.classList.add("is-visible");

    function showMessage(message, duration) {
      window.clearTimeout(bubbleTimer);
      greeting.textContent = message;
      assistant.classList.add("is-greeting");
      if (duration > 0) {
        bubbleTimer = window.setTimeout(() => {
          assistant.classList.remove("is-greeting");
        }, duration);
      }
    }

    function playAnimation(action) {
      if (!action || reducedMotion.matches) return;
      if (currentAction && currentAction !== action) {
        currentAction.fadeOut(0.15);
      }
      action.reset().fadeIn(0.15).play();
      currentAction = action;
    }

    function react(message) {
      showMessage(message, 1900);
      expressionStart = clock.elapsedTime;
      playAnimation(reactionAction);
    }

    function wrapEyeForExpression(model, name) {
      const eye = model.getObjectByName(name);
      if (!eye || !eye.parent) return null;

      const wrapper = new THREE.Group();
      wrapper.position.copy(eye.position);
      wrapper.quaternion.copy(eye.quaternion);
      wrapper.scale.copy(eye.scale);
      wrapper.userData.baseScale = wrapper.scale.clone();
      eye.parent.add(wrapper);
      wrapper.add(eye);
      eye.position.set(0, 0, 0);
      eye.quaternion.identity();
      eye.scale.set(1, 1, 1);
      return wrapper;
    }

    function updateCuteExpression(elapsed) {
      if (!leftEyeExpression || !rightEyeExpression) return;
      const time = elapsed - expressionStart;
      if (reducedMotion.matches || time < 0 || time > 0.65) {
        leftEyeExpression.scale.copy(leftEyeExpression.userData.baseScale);
        rightEyeExpression.scale.copy(rightEyeExpression.userData.baseScale);
        return;
      }

      const wink = Math.sin(Math.PI * THREE.MathUtils.clamp(time / 0.42, 0, 1));
      const sparkle = 1 + 0.12 * Math.sin(Math.PI * THREE.MathUtils.clamp(time / 0.65, 0, 1));
      leftEyeExpression.scale.copy(leftEyeExpression.userData.baseScale);
      leftEyeExpression.scale.x *= sparkle;
      leftEyeExpression.scale.y *= 1 - wink * 0.92;
      rightEyeExpression.scale.copy(rightEyeExpression.userData.baseScale);
      rightEyeExpression.scale.x *= sparkle;
      rightEyeExpression.scale.y *= sparkle;
    }

    const sectionMessages = {
      top: "Welcome! Let's explore Mirajul's portfolio together!",
      me: "Meet Mirajul, the developer behind the work!",
      about: "Here's how Mirajul builds AI-powered products.",
      stack: "Python, ML, FastAPI, Ai Engineering and frontend craft!",
      work: "Project time! Lumen AI turns videos into insights.",
      contact: "Have an idea? Send Mirajul a message!",
    };
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const projects = document.querySelector("#projects");
    let scrollFrame = 0;
    let activeProjectCard = null;

    function onSectionScroll() {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const marker = window.innerHeight * 0.38;
        let current = sections[0];
        sections.forEach((section) => {
          if (section.getBoundingClientRect().top <= marker) current = section;
        });
        if (!current || current.id === activeSection) return;
        activeSection = current.id;
        if (activeProjectCard) return;
        react(sectionMessages[activeSection] || "A new section to explore! ✨");
      });
    }

    window.addEventListener("scroll", onSectionScroll, { passive: true });

    projects.addEventListener("pointerover", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest(".card");
      if (!card || activeProjectCard === card) return;

      activeProjectCard = card;
      const title = card.querySelector("h3").textContent.replace("↗", "").trim();
      const description = card.querySelector("p").textContent.trim();
      const feature =
        description.length > 72
          ? `${description.slice(0, 69).trimEnd()}…`
          : description;
      showMessage(`${title}: ${feature}`, 0);
    });

    projects.addEventListener("pointerout", (event) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest(".card");
      if (
        !card ||
        (event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) ||
        activeProjectCard !== card
      ) {
        return;
      }

      activeProjectCard = null;
      assistant.classList.remove("is-greeting");
      if (activeSection === "work") {
        showMessage(sectionMessages.work, 1900);
      }
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("a, button, [data-h]");
      if (!control || control.matches(":disabled")) return;
      if (control.closest(".card")) return;
      const href = control.getAttribute("href") || "";
      const target = control.getAttribute("data-h") || "";
      const sectionId = href.charAt(0) === "#" ? href.slice(1) : target.slice(1);
      const message = sectionId
        ? sectionMessages[sectionId] || "Ooh, let's explore!"
        : "Yay! You picked something! (｡•̀ᴗ-)✧";
      react(message);
    });

    new GLTFLoader().load(
      "/pika-assistant.gltf",
      ({ scene: model, animations }) => {
        leftEyeExpression = wrapEyeForExpression(model, "LeftEyeGroup");
        rightEyeExpression = wrapEyeForExpression(model, "RightEyeGroup");
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
          mixer = new THREE.AnimationMixer(model);
          const idleClip = animations.find((clip) => clip.name === "Idle");
          const greetingClip = animations.find((clip) => clip.name === "Greeting");
          const reactionClip = animations.find((clip) => clip.name === "Speaking");
          idleAction = idleClip ? mixer.clipAction(idleClip) : null;
          greetingAction = greetingClip
            ? mixer.clipAction(greetingClip)
            : null;
          reactionAction = reactionClip
            ? mixer.clipAction(reactionClip)
            : null;

          if (reactionAction) {
            reactionAction.setLoop(THREE.LoopOnce, 1);
            reactionAction.clampWhenFinished = true;
          }

          mixer.addEventListener("finished", (event) => {
            if (event.action === greetingAction && currentAction === greetingAction) {
              playAnimation(idleAction);
              expressionStart = clock.elapsedTime;
            } else if (
              event.action === reactionAction &&
              currentAction === reactionAction
            ) {
              playAnimation(idleAction);
            }
          });

          showMessage(
            "Hello! Welcome to Mirajul's portfolio. It's lovely to have you here please enjoy exploring!",
            8000,
          );
          if (greetingAction && !reducedMotion.matches) {
            greetingAction.setLoop(THREE.LoopOnce, 1);
            greetingAction.clampWhenFinished = true;
            playAnimation(greetingAction);
          } else if (idleAction && !reducedMotion.matches) {
            playAnimation(idleAction);
          } else if (!reducedMotion.matches) {
            const fallbackClip = animations.find(
              (clip) => clip !== greetingClip && clip !== reactionClip,
            );
            if (fallbackClip) playAnimation(mixer.clipAction(fallbackClip));
          }
          robot.userData.mixer = mixer;
        }
      },
      undefined,
      (error) => console.error("Could not load pika-assistant.gltf.", error),
    );

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      pointer.set(event.clientX, event.clientY);
      active = true;
    });

    window.addEventListener("pointerout", (event) => {
      if (event.relatedTarget) return;
      active = false;
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
        assistant.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;

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

        robot.rotation.y += (lookX - robot.rotation.y) * 0.4;
        robot.rotation.x += (-lookY - robot.rotation.x) * 0.4;
        if (!reducedMotion.matches) {
          robot.rotation.y += 0.002;
          robot.position.y = Math.sin(elapsed * 1.3) * 0.055;
        }
      }

      if (robot.userData.mixer) robot.userData.mixer.update(delta);
      updateCuteExpression(elapsed);
      renderer.render(scene, camera);
    }

    animate();
  }
}
