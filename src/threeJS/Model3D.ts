import * as THREE from "three";
import { createMeshUserData } from "./CreateMeshUserData";
import { getNestedMeshes } from "./GetNestedMeshes";

export const ModelNames = ["CSS", "HTML", "JS", "TS", "React", "Vue", "NodeJS", "MongoDB", "NPM", "Vite", "ANDI"] as const;
export type TModelNames = typeof ModelNames[number];
interface IModel3DScene extends THREE.Group {
    name: TModelNames;
}

export class Model3D {
    scene: IModel3DScene;
    rotationValue: number;
    constructor(scene: THREE.Group, name: TModelNames) {
        this.scene = scene as IModel3DScene;
        this.scene.name = name;
        this.rotationValue = 0;

        this.scene.scale.set(0.5, 0.5, 0.5);
        this.scene.position.set(0, 0, 0);

        // Group1:
        if (["TS", "JS", "HTML", "CSS"].includes(this.scene.name)) {
            const dist = 3;
            this.rotationValue = 0.01;
            if (this.scene.name === "JS") {
                this.scene.position.x = dist;
            }
            else if (this.scene.name === "TS") {
                this.scene.position.x = -dist;
            }
            else if (this.scene.name === "HTML") {
                this.scene.position.z = dist;
                this.scene.rotation.set(0, Math.PI / 2, 0);
                this.scene.scale.set(0.75, 0.75, 0.75);
            }
            else if (this.scene.name === "CSS") {
                this.scene.position.z = -dist;
                this.scene.scale.set(0.55, 0.55, 0.55);
            }
        }
        // Group2:
        else if (this.scene.name === "React") {
            this.scene.position.x = -2.5;
        }
        else if (this.scene.name === "Vue") {
            this.scene.position.z = -0.3;
            this.scene.position.x = 2.5
        }
        // Group3:
        else if (this.scene.name === "MongoDB") {
            this.scene.position.x = -2.5;
            this.scene.position.y = 0.5;
        }
        else if (this.scene.name === "NodeJS") {
            this.scene.position.x = 2.5;
        }
        // Group 4:
        else if (this.scene.name === "Vite") {
            this.scene.position.x = 2.5;
        }
        else if (this.scene.name === "NPM") {
            this.scene.position.x = -2.5;
            this.scene.position.y = 0.75;
        }
        // Center:
        else if (this.scene.name === "ANDI") {
            this.scene.scale.set(20, 20, 20);
            this.scene.position.set(0, -5, 0);
            if (this.scene.children[0] instanceof THREE.Mesh) {
                this.scene.children[0].material.color.set(new THREE.Color(0xffffff));
            }
        }
    }

    rotate(newValue?: number) {
        const value = newValue ? newValue : this.rotationValue;
        this.scene.rotation.y += value;
    }

    disableRotation() {
        this.scene.rotation.y = 0;
    }

    getMeshes() {
        /*
            HTML_1 = small left panel
            HTML_2 = bg (frame)
            HTML_3 = 5
            CSS_1 = 5
            CSS_2 = bg (frame)
            CSS_3 = small left panel
            JS001 = bg
            JS002 = JS
            TS_1 = TS
            TS_2 = bg
            Vue_1 = gray
            Vue_2 = green
            NPM_1 = frame (red)
            NPM_2 = npm
            Vite_1 = yellow
            Vite_2 = bg
            NodeJS = bg
            MongoDB = bg
            React = bg
            ANDI = bg
        */
        const layers = [
            {
                names: ["HTML_2", "CSS_2", "JS002"],
                value: 30
            },
            {
                names: ["HTML_3", "CSS_1", "TS_1", "Vue_1", "NPM_2", "Vite_2", "ANDI"],
                value: 1
            },
            {
                names: ["HTML_1", "CSS_3", "JS001", "TS_2", "Vue_2", "NPM_1", 
                    "Vite_1",
                    "React", "MongoDB", "NodeJS"],
                value: 2
            }
        ]
        const meshes = getNestedMeshes(this.scene);
        meshes.forEach((mesh) => {
            mesh.userData = createMeshUserData({
                bloomLayer: 30
            });
            for(let i=0; i<layers.length; i++){
                if(layers[i].names.some((name) => name === mesh.name)){
                    mesh.userData = createMeshUserData({
                        bloomLayer: layers[i].value
                    });
                    break;
                }
            }
        })
        return meshes;
    }
}