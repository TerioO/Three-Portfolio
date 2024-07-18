import * as THREE from "three";
import { createCircularLine } from "./CircularLine";
import { createSpriteLabel } from "./CreateSpriteLabel";
import { createMeshUserData } from "./CreateMeshUserData";
import { Text } from "troika-three-text";

export const OrbitNames = [1, 2, 3, 4] as const;
export type TOrbitNames = typeof OrbitNames[number];

export class Orbit {
    orbit: THREE.Group;
    group: THREE.Group;
    label: THREE.Sprite | null;
    trajectory: THREE.Line | null;
    description: Text;
    button: THREE.Mesh;
    name: TOrbitNames;
    rotationValues: {
        orbit: {
            y: number;
        };
        group: {
            y: number;
        }
    };

    constructor(name: TOrbitNames) {
        this.name = name;
        this.orbit = new THREE.Group();
        this.orbit.name = `Orbit-${this.name}`;
        this.group = new THREE.Group();
        this.group.name = `Orbit-Group-${this.name}`;

        this.trajectory = null;
        this.label = null;
        this.description = new Text();
        this.description.fontSize = 1;
        this.description.maxWidth = 10;
        this.description.textAlign = "justify";
        this.description.position.set(-5, -5, 0);
        (this.description.material as THREE.Material).opacity = 0;

        this.button = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 0.7, 10, 1),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        )
        this.button.name = `Orbit-Button-${this.name}`;
        this.button.position.y = -2;
        this.button.rotation.z = Math.PI;

        this.rotationValues = {
            orbit: {
                y: 0
            },
            group: {
                y: 0
            }
        }

        // Trajectory line settings:
        const opacity = 0.01;
        const transparent = true;

        // Orbit positions:
        const getPosX = () => {
            const base = 40;
            const increment = 20;
            return base + increment * (this.name - 1);
        }
        // Orbit 1:
        if (this.name === 1) {
            this.orbit.rotation.set(0, 0, 0);
            this.group.position.set(getPosX(), 0, 0);
            this.rotationValues = {
                orbit: {
                    y: 0.005
                },
                group: {
                    y: 0.02
                }
            }

            this.trajectory = createCircularLine(getPosX(), 86, { partial: 0.35, transparent, opacity });
            this.trajectory.rotation.y = -0.2;
            this.label = createSpriteLabel({ text: "Web Dev Skills" });

            this.description.text = "HTML5 - CSS3 + SASS - JS + TS";
            this.description.maxWidth = 20;
            this.description.position.x = -6;
        }

        // Orbit 2:
        else if (this.name === 2) {
            this.orbit.rotation.set(0.1, Math.PI / 4, 0);
            this.group.position.set(getPosX(), 0, 0);
            this.rotationValues = {
                orbit: {
                    y: 0.002
                },
                group: {
                    y: 0.03
                }
            }

            this.trajectory = createCircularLine(getPosX(), 128, { partial: 0.25, transparent, opacity });
            this.trajectory.rotation.y = -0.15;
            this.label = createSpriteLabel({ text: "Frontend Frameworks" });

            this.description.text = `React - Router - Redux Toolkit - RTK Query
    Vue (CompositionAPI) - Vue Router - Pinia - VueUse`;
            this.description.maxWidth = 25;
            this.description.position.x = -12;
            
        }

        // Orbit 3:
        else if (this.name === 3) {
            this.orbit.rotation.set(-0.1, -Math.PI / 2, 0);
            this.group.position.set(getPosX(), 0, 0);
            this.rotationValues = {
                orbit: {
                    y: 0.001
                },
                group: {
                    y: 0.01
                }
            }

            this.trajectory = createCircularLine(getPosX(), 164, { partial: 0.27, transparent: true, opacity });
            this.trajectory.rotation.y = -0.15;
            this.label = createSpriteLabel({ text: "Backend Skills" });

            this.description.text = `NodeJS - ExpressJS - MongoDB (mongoose)`
            this.description.maxWidth = 20;
            this.description.position.x = -10;
        }
        // Orbit 4:
        else if (this.name === 4) {
            this.orbit.rotation.set(0, 0, 0);
            this.group.position.set(getPosX(), 0, 0);
            this.rotationValues = {
                orbit: {
                    y: 0.0005
                },
                group: {
                    y: 0.005
                }
            }

            this.trajectory = createCircularLine(getPosX(), 164, { partial: 0.27, transparent: true, opacity });
            this.trajectory.rotation.y = -0.15;
            this.label = createSpriteLabel({ text: "Tools" });

            this.description.text = `Vite - npm - git`
        }

        this.orbit.add(this.group);
        if (this.trajectory) {
            this.trajectory.position.y = 1.2;
            this.trajectory.name = `Orbit-Trajectory-${this.name}`;
            this.orbit.add(this.trajectory);
        }
        if(this.label){
            this.label.position.y = 4.5;
            this.label.name = `Orbit-Label-${this.name}`;
            this.label.layers.enable(1);
            this.group.add(this.label);
        }
        this.button.userData = createMeshUserData({
            bloomLayer: 2
        });
        this.group.add(this.button);
        this.group.add(this.description);
    }

    rotate() {
        const { orbit, group } = this.rotationValues;
        this.orbit.rotation.y += orbit.y;
        this.group.rotation.y += group.y;
    }

    disableRotation() {
        this.orbit.rotation.y = 0;
        this.group.rotation.y = 0;
    }

    getMeshes() {
        return [
            this.trajectory,
            this.label,
            this.button,
            this.description
        ]
    }

    toggleDescriptionOpacity(opacity: number){
        const text = this.description;
        if(text.material instanceof THREE.Material){
            text.material.opacity = opacity;
        }
    }
}
