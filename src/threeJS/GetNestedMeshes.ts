import * as THREE from "three";

export function getNestedMeshes(scene: THREE.Scene | THREE.Group) {
    const meshes: THREE.Mesh[] = [];
    const loopThroughChildren = (group: THREE.Group | THREE.Scene) => {
        group.children.forEach((child) => {
            if (child instanceof THREE.Group) {
                loopThroughChildren(child);
            }
            else if (child instanceof THREE.Mesh) {
                meshes.push(child);
            }
        })
    }
    loopThroughChildren(scene);
    return meshes;
}