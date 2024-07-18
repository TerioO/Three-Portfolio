// THREE:
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
// GSAP animation library:
import gsap from "gsap";
// Custom utilities:
import { Blooms, IBloomsInit } from "./Blooms";
import { Model3D } from "./Model3D";
import { ModelNames } from "./Model3D";
import { Orbit, TOrbitNames, OrbitNames } from "./Orbit";
import { getNestedMeshes } from "./GetNestedMeshes";
import { HTMLPage } from "./HTMLPage";
import Stats from "three/examples/jsm/libs/stats.module.js";

interface IObjects {
    meshes: THREE.Mesh[],
    models: Model3D[],
    orbits: {
        [key in TOrbitNames]: Orbit;
    },
    focusValues: number[],
    focusIndex: number
}

export interface IThreeRootInit {
    canvas: HTMLCanvasElement | null;
    antialias: IBloomsInit["antialias"];
    stats: boolean;
    starsAmount: number;
}

export class ThreeRoot {
    // THREE:
    canvas: HTMLCanvasElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    orbitControls: OrbitControls;
    loadManager: THREE.LoadingManager;
    gltfLoader: GLTFLoader;
    raycasting: {
        raycaster: THREE.Raycaster;
        pointer: THREE.Vector2;
        hoveredObject: THREE.Mesh | null;
        clickedObject: THREE.Mesh | null;
    }
    blooms: Blooms;

    // Custom:
    objects: IObjects;
    btns: {
        up: HTMLElement;
        left: HTMLElement;
        right: HTMLElement;
        center: HTMLElement;
        down: HTMLElement;
    }
    animationId: number | null;
    #flags: {
        followGroup: boolean;
        animateOrbits: boolean;
        raycasterOn: boolean;
        consoleWarns: boolean;
        navigation: {
            position: "html" | "center" | "orbit";
            isNavigatingDown: boolean;
        }
    }
    gsapSettings: GSAPTweenVars;
    settings: {
        cameraInitialPosition: [number, number, number],
        orbitControlsInitialTarget: [number, number, number]
    }
    htmlPage: HTMLPage;
    stats: Stats | null;

    constructor(init: IThreeRootInit) {
        // Initialization:
        if (!init.canvas) throw Error("Canvas element missing!");
        this.canvas = init.canvas;

        // App Settings:
        this.settings = {
            cameraInitialPosition: [0, 50, 90],
            orbitControlsInitialTarget: [0, 0, 0]
        }

        // Scene:
        this.scene = new THREE.Scene();

        // Camera:
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(...this.settings.cameraInitialPosition);

        // Renderer:
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.toneMapping = THREE.ReinhardToneMapping;

        // Orbit Controls:
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target = new THREE.Vector3(...this.settings.orbitControlsInitialTarget);
        this.orbitControls.update();

        // Load Manager:
        this.loadManager = new THREE.LoadingManager();
        this.gltfLoader = new GLTFLoader(this.loadManager);

        // Blooms:
        this.blooms = new Blooms({
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            antialias: init.antialias,
            bloomSettings: [
                {
                    layer_value: 1,
                    strength: 0.12,
                    radius: 0,
                    threshold: 0
                },
                {
                    layer_value: 2,
                    strength: 0.3,
                    radius: 0,
                    threshold: 0
                }
            ]
        })

        // Custom properties:
        this.raycasting = {
            raycaster: new THREE.Raycaster(),
            pointer: new THREE.Vector2(-10000, -10000),
            hoveredObject: null,
            clickedObject: null,
        }

        this.objects = {
            meshes: [],
            models: [],
            orbits: {
                1: new Orbit(1),
                2: new Orbit(2),
                3: new Orbit(3),
                4: new Orbit(4)
            },
            focusValues: [0, ...OrbitNames],
            focusIndex: 0,
        }

        this.btns = {
            up: document.querySelector(".three-btns .up") as HTMLElement,
            left: document.querySelector(".three-btns .left") as HTMLElement,
            center: document.querySelector(".three-btns .center") as HTMLElement,
            down: document.querySelector(".three-btns .down") as HTMLElement,
            right: document.querySelector(".three-btns .right") as HTMLElement,
        }

        this.animationId = 0;
        this.#flags = {
            followGroup: false,
            animateOrbits: true,
            raycasterOn: true,
            consoleWarns: true,
            navigation: {
                position: "center",
                isNavigatingDown: false
            }
        }
        this.gsapSettings = {
            duration: 1.5,
            ease: "power2.inOut",
        }

        this.htmlPage = new HTMLPage();
        this.stats = init.stats ? new Stats() : null;
        if(this.stats){
            this.stats.showPanel(0);
            document.body.appendChild(this.stats.dom);
        }

        this.#resizeRenderer();
        this.initModels();
        this.initScene(init.starsAmount);
        this.#addEventListeners();
    }

    initScene(starsAmount: number) {
        const { orbits, meshes } = this.objects;

        this.scene.add(new THREE.AmbientLight(0xffffff, 2));

        Object.values(orbits).forEach((o) => {
            this.scene.add(o.orbit);
            meshes.push(...o.getMeshes() as []);
        })

        const createStar = (name: string) => {
            const randNr = (min: number, max: number, negative: boolean = false) => {
                const nr = min + Math.random() * (max - min);
                if (negative && Math.random() > 0.5) {
                    return -nr;
                }
                else return nr;
            }
            const x = randNr(0, 1000, true);
            const y = randNr(0, 1000, true);
            const z = Math.abs(x) < 50
                ? randNr(50, 1000, true)
                : randNr(0, 1000, true)
            const scale = Math.abs(x) < 400
                ? randNr(0.3, 0.6)
                : randNr(0.6, 1.5)
            const star = new THREE.Mesh(
                new THREE.IcosahedronGeometry(scale, 2),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            )
            star.name = name;
            star.position.set(x, y, z);
            return star;
        }
        let starsDefault = 400;
        if(starsAmount >= 0 && starsAmount < 5000){
            starsDefault = starsAmount
        }
        for (let i = 0; i < starsDefault; i++) {
            const star = createStar(`Star-${i}`);
            this.scene.add(star);
        }

        // When 3D Models have loaded, start the animation:
        this.loadManager.onLoad = () => {
            this.objects.models.forEach((model) => {
                const { scene } = model;
                meshes.push(...model.getMeshes());
                if (["TS", "JS", "HTML", "CSS"].includes(scene.name)) {
                    orbits["1"].group.add(scene);
                }
                else if (["React", "Vue"].includes(scene.name)) {
                    orbits["2"].group.add(scene);
                }
                else if (["MongoDB", "NodeJS"].includes(scene.name)) {
                    orbits["3"].group.add(scene);
                }
                else if (scene.name === "ANDI") {
                    const mesh = model.getMeshes()[0]
                    mesh.layers.enable(mesh.userData.bloomLayer);
                    this.scene.add(scene);
                }
                else if (["NPM", "Vite"].includes(scene.name)) {
                    orbits["4"].group.add(scene);
                }
            });

            // Start animation:
            this.animationId = requestAnimationFrame(this.animate);
        }
    }

    initModels() {
        // Template:
        const styles = document.querySelector("#three-loading-style");
        const loadingTemplate = document.querySelector("#three-loading") as HTMLElement;
        const progress = loadingTemplate?.querySelector(".progress") as HTMLElement;
        const text = loadingTemplate?.querySelector(".text") as HTMLElement;

        // Update template loading status:
        this.loadManager.onProgress = (_url, loaded, total) => {
            const percent = Math.round(loaded / total * 100);
            if (loaded === total) {
                loadingTemplate.remove();
                styles?.remove();
            }
            progress.style.width = percent + "%";
            text.textContent = percent + "%";
        }

        // Remove default error message:
        this.loadManager.onError = (url) => {
            console.error(`Failed to load resource: ${url}`)
        }

        // Load logo models:
        ModelNames.forEach((name) => {
            this.gltfLoader.load(`models/Logo_${name}.glb`,
                (gltf) => {
                    const root = gltf.scene;
                    this.objects.models.push(new Model3D(root, name));
                },
                () => { },
                () => { }
            )
        });
    }

    animate = () => {
        const { meshes } = this.objects;
        if (this.stats) this.stats.begin();

        if (this.#flags.animateOrbits) this.animateOrbits();
        if (this.#flags.raycasterOn) this.#checkObjectIntersection();

        // this.renderer.render(this.scene, this.camera);
        this.blooms.render(meshes);
        this.orbitControls.update();

        if (this.stats) this.stats.end();
        this.animationId = requestAnimationFrame(this.animate);
    }

    animateOrbits() {
        const { models, orbits } = this.objects;
        models.forEach((model) => model.rotate())
        Object.values(orbits).forEach((orbit) => orbit.rotate())
    }

    #addEventListeners() {
        window.addEventListener("resize", () => {
            this.#resizeRenderer();
            if (!this.animationId) this.blooms.render(this.objects.meshes);
        })

        this.btns.center.addEventListener("click", this.#focusCenter)
        this.btns.left.addEventListener("click", () => this.focusGroup("left"))
        this.btns.right.addEventListener("click", () => this.focusGroup("right"))
        this.btns.down.addEventListener("click", this.navigateDown);
        this.btns.up.addEventListener("click", () => this.htmlPage.toggleControlsModal())

        this.canvas.addEventListener("mousemove", this.#setPickPosition);
        this.canvas.addEventListener("mouseout", this.#clearPickPosition);
        this.canvas.addEventListener("mouseleave", this.#clearPickPosition);
        this.canvas.addEventListener("mousedown", () => this.#activateRaycaster(false));
        this.canvas.addEventListener("mouseup", () => this.#activateRaycaster(true));
        this.canvas.addEventListener("click", this.onObjectClick)
    }

    focusGroup(dir: "left" | "right") {
        if (this.#flags.navigation.isNavigatingDown) return;
        this.#flags.animateOrbits = false;
        const { orbits, focusIndex, focusValues } = this.objects;

        // Remove effects from previous selected group:
        if (focusIndex !== 0) {
            const i = Math.abs(focusIndex) as TOrbitNames;
            this.toggleGroupButtonOpacity(i, 0);
            this.toggleGroupBloom(i, "disable");
            this.toggleBloomEffect(orbits[i].button, "disable");
        }

        // Update focus index:
        if (dir === "left") this.objects.focusIndex = (focusIndex - 1) % focusValues.length;
        else if (dir === "right") this.objects.focusIndex = (focusIndex + 1) % focusValues.length;
        const i = Math.abs(this.objects.focusIndex);
        if (i === 0) {
            this.#focusCenter();
            return;
        }

        // Update camera position to point to group:
        const focusedOrbit = orbits[i as TOrbitNames]
        const pos = new THREE.Vector3();
        focusedOrbit.group.getWorldPosition(pos);
        gsap.to(this.camera.position, {
            z: pos.z + 10, y: pos.y + 2, x: pos.x,
            ...this.gsapSettings,
            onStart: () => {
                this.orbitControls.enabled = false;
                if (this.#flags.navigation.position === "html") {
                    this.animationId = requestAnimationFrame(this.animate);
                    this.#flags.navigation.position = "orbit";
                    this.htmlPage.toggleDisplay("none");
                }
            },
            onComplete: () => {
                this.orbitControls.enabled = true;
                this.#flags.navigation.position = "orbit";
            }
        })
        gsap.to(this.orbitControls.target, {
            x: pos.x, y: pos.y, z: pos.z,
            ...this.gsapSettings
        })

        // Update bloom and button display:
        this.toggleGroupButtonOpacity(i as TOrbitNames, 1);
        this.toggleGroupBloom(i as TOrbitNames, "enable");
    }

    #focusCenter = () => {
        if (this.#flags.navigation.isNavigatingDown) return;
        // Remove bloom effect and button from previous focused group:
        if (this.objects.focusIndex !== 0) {
            const i = Math.abs(this.objects.focusIndex) as TOrbitNames
            this.toggleGroupBloom(i, "disable");
            this.toggleGroupButtonOpacity(i, 0);
            this.toggleBloomEffect(this.objects.orbits[i].button, "disable");
        }

        // Move the camera back to point to center:
        this.objects.focusIndex = 0;
        gsap.to(this.camera.position, {
            ...new THREE.Vector3(...this.settings.cameraInitialPosition),
            ...this.gsapSettings,
            onStart: () => {
                this.orbitControls.enabled = false;
                if (this.#flags.navigation.position === "html") {
                    this.animationId = requestAnimationFrame(this.animate);
                    this.#flags.navigation.position = "center";
                    this.htmlPage.toggleDisplay("none");
                }
            },
            onComplete: () => {
                this.orbitControls.enabled = true;
                this.#flags.navigation.position = "center";
            }
        })
        gsap.to(this.orbitControls.target, {
            ...new THREE.Vector3(...this.settings.orbitControlsInitialTarget),
            ...this.gsapSettings
        })

        // Resume animation:
        this.#flags.animateOrbits = true;
    }

    navigateDown = () => {
        if (this.htmlPage.isVisible) return;
        if (this.#flags.navigation.isNavigatingDown) return;
        gsap.to(this.camera.position, {
            x: 0, y: -100, z: 40,
            ...this.gsapSettings
        });
        gsap.to(this.orbitControls.target, {
            x: 0, y: -100, z: 0,
            ...this.gsapSettings,
            onStart: () => {
                this.#flags.navigation.isNavigatingDown = true;
            },
            onComplete: () => {
                if (this.animationId) cancelAnimationFrame(this.animationId);
                this.animationId = null;
                this.#flags.navigation.position = "html";
                this.#flags.navigation.isNavigatingDown = false;
                this.orbitControls.enabled = false;
                this.htmlPage.toggleDisplay("block");
            }
        })
    }

    onObjectClick = () => {
        const obj = this.raycasting.hoveredObject;
        if (obj) {
            this.toggleBloomEffect(obj);
        }
    }

    onObjectHover = (obj: THREE.Mesh, isHovering: boolean) => {
        // Execute some code on the object the mouse intersects
        if (isHovering) {
            if (obj.name.includes("Orbit-Button")) {
                this.canvas.style.cursor = "pointer";
            }
        }
        // This executes immediately after mouse leave object intersection, but you still have
        // access to the object:
        else {
            this.canvas.style.cursor = "initial";
        }
    }

    /**
     * Toggle the bloom effect for the orbits[i] logos
     */
    toggleGroupBloom(i: TOrbitNames, manual?: "enable" | "disable") {
        const { orbits } = this.objects;
        orbits[i].group.children.forEach((child) => {
            if (child instanceof THREE.Group) {
                const meshes = getNestedMeshes(child);
                meshes.forEach((mesh) => {
                    this.toggleBloomEffect(mesh, manual);
                })
            }
        });
    }

    /**
     * Toggle group button opacity
     */
    toggleGroupButtonOpacity(i: TOrbitNames, opacity: number) {
        const { orbits } = this.objects;
        gsap.to(orbits[i].button.material, {
            opacity,
            ...this.gsapSettings
        })
    }

    /**
     * Toggles the bloom layer of an object using objects **userData** property
     * 
     * Optional **manual** param allows for enabling/disabling of bloom effect instead of toggling
     */
    toggleBloomEffect(obj: THREE.Mesh, manual?: "enable" | "disable") {
        if (manual) {
            if (manual === "enable") {
                obj.layers.enable(obj.userData.bloomLayer);
            }
            else if (manual === "disable") {
                obj.layers.disable(obj.userData.bloomLayer);
            }
        }
        else {
            if (!this.testBloomLayer(obj)) {
                obj.layers.enable(obj.userData.bloomLayer);
            }
            else {
                obj.layers.disable(obj.userData.bloomLayer);
            }
        }
        if (obj.name.includes("Orbit-Button")) {
            const orbitIndex = Number(obj.name.slice(-1));
            const orbit = this.objects.orbits[orbitIndex as TOrbitNames];
            if (this.testBloomLayer(obj)) {
                orbit.toggleDescriptionOpacity(1);
            }
            else orbit.toggleDescriptionOpacity(0);
        }
    }

    /**
     * Checks if an object has a bloom effect active, returns boolean if so
     */
    testBloomLayer(obj: THREE.Mesh) {
        return this.blooms.BLOOMS.some(({ layer }) => layer.test(obj.layers));
    }

    #resizeRenderer = () => {
        const { clientWidth, clientHeight } = this.renderer.domElement;
        const needResize = clientWidth !== this.canvas.width || clientHeight !== this.canvas.height;
        if (needResize) {
            this.renderer.setSize(clientWidth, clientHeight, false);
            this.blooms.resizeComposers(clientWidth, clientHeight);

            this.camera.aspect = clientWidth / clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    #checkObjectIntersection() {
        const { hoveredObject, raycaster, pointer } = this.raycasting;
        if (hoveredObject) {
            this.onObjectHover(hoveredObject, false);
            this.raycasting.hoveredObject = null;
        }

        raycaster.setFromCamera(pointer, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
            this.raycasting.hoveredObject = intersects[0].object;
            this.onObjectHover(this.raycasting.hoveredObject, true);
        }
    }

    #setPickPosition = (e: MouseEvent) => {
        const { pointer } = this.raycasting;
        const canvas = this.renderer.domElement;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * canvas.width / rect.width;
        const y = (e.clientY - rect.top) * canvas.height / rect.height;

        pointer.x = (x / canvas.width) * 2 - 1;
        pointer.y = (y / canvas.height) * -2 + 1;
    }

    #clearPickPosition = () => {
        const { pointer } = this.raycasting;
        pointer.set(-10000, -10000);
    }

    #activateRaycaster = (value: boolean) => {
        this.#flags.raycasterOn = value;
    }
}