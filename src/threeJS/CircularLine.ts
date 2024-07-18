import * as THREE from "three";

interface Options {
    partial?: number;
    color?: number;
    transparent?: boolean;
    opacity?: number;
}

export function createCircularLine(radius: number, segments: number, options?: Options) {
    const partial = options?.partial ?? 0;
    
    const points: THREE.Vector3[] = [];
    const full = 2 * Math.PI - partial;
    for (let i = 0; i < segments; i++) {
        points.push(new THREE.Vector3(
            radius * Math.cos((i / segments) * full),
            0,
            radius * Math.sin((i / segments) * full)
        ))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: options?.color ?? 0xffffff,
        transparent: options?.transparent ?? false,
        opacity: options?.opacity ?? 1
    });

    return new THREE.Line(geometry, material);
}
