import * as THREE from "three";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from "three/examples/jsm/Addons.js";
import { FXAAShader } from "three/examples/jsm/Addons.js";

export interface IBloomsInit {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    bloomSettings: {
        layer_value: number;
        threshold: number;
        strength: number;
        radius: number;
    }[];
    antialias: "fxaa" | "smaa" | "none"
}

export class Blooms {
    #renderPass: RenderPass;
    #mixPass: ShaderPass;
    #outputPass: OutputPass;
    finalComposer: EffectComposer;
    BLOOMS: {
        bloomPass: UnrealBloomPass;
        bloomComposer: EffectComposer;
        layer: THREE.Layers;
        layer_value: number;
        materials: { [k: string]: THREE.Material | THREE.Material[] };
    }[];
    #darkMaterial: THREE.MeshBasicMaterial;

    constructor({ scene, camera, renderer, antialias, bloomSettings }: IBloomsInit) {
        const canvas = renderer.domElement;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;

        this.BLOOMS = [];
        this.#darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });

        this.#renderPass = new RenderPass(scene, camera);

        bloomSettings.forEach((settings) => {
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H),
                settings.strength,
                settings.radius,
                settings.threshold
            );
            const bloomComposer = new EffectComposer(renderer);
            bloomComposer.renderToScreen = false;
            bloomComposer.addPass(this.#renderPass);
            bloomComposer.addPass(bloomPass);

            const layer_value = settings.layer_value;
            const layer = new THREE.Layers();
            layer.set(layer_value);

            this.BLOOMS.push({
                bloomPass,
                bloomComposer,
                layer_value,
                layer,
                materials: {}
            })
        });

        const uniforms = this.BLOOMS.reduce<{ [k: string]: any }>((acc, curr) => {
            acc[`bloomTexture${curr.layer_value}`] = {
                value: curr.bloomComposer.renderTarget2.texture
            }
            return acc;
        }, {});
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = (() => {
            let base = `uniform sampler2D baseTexture;`
            this.BLOOMS.forEach((el) => {
                base += `uniform sampler2D bloomTexture${el.layer_value};`;
            })
            base += `
                varying vec2 vUv;
                void main(){
                    gl_FragColor = texture2D(baseTexture, vUv);
            `;
            this.BLOOMS.forEach((el) => {
                base += `gl_FragColor += vec4(1.0) * texture2D(bloomTexture${el.layer_value}, vUv);`;
            });
            base += "}";
            return base;
        })();

        this.#mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    ...uniforms
                },
                vertexShader,
                fragmentShader,
                defines: {}
            }), "baseTexture"
        )
        this.#mixPass.needsSwap = true;

        this.#outputPass = new OutputPass();
        this.finalComposer = new EffectComposer(renderer);
        this.finalComposer.addPass(this.#renderPass);
        this.finalComposer.addPass(this.#mixPass);

        // Antialiasing:
        const fxaaPass = new ShaderPass(FXAAShader);
        const smaaPass = new SMAAPass(W, H);
        if(antialias === "fxaa") this.finalComposer.addPass(fxaaPass);
        else if(antialias === "smaa") this.finalComposer.addPass(smaaPass);

        this.finalComposer.addPass(this.#outputPass);
    }

    render(meshes: THREE.Mesh[]) {
        this.BLOOMS.forEach((el, i) => {
            meshes.forEach((mesh) => this.#nonBloomed(mesh, i));
            el.bloomComposer.render();
            meshes.forEach((mesh) => this.#restoreMaterial(mesh, i));
        });

        this.finalComposer.render();
    }

    resizeComposers(W: number, H: number) {
        this.BLOOMS.forEach((el) => {
            el.bloomComposer.setSize(W, H);
        })
        this.finalComposer.setSize(W, H);
    }

    #nonBloomed = (obj: any, i: number) => {
        const { materials, layer } = this.BLOOMS[i];
        if (layer.test(obj.layers) === false) {
            materials[obj.uuid] = obj.material;
            obj.material = this.#darkMaterial;
        }
    }

    #restoreMaterial = (obj: any, i: number) => {
        const { materials } = this.BLOOMS[i];
        if (materials[obj.uuid]) {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
        }
    }
}