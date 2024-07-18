import * as THREE from "three";

interface IOptions {
    text: string;
    fontSize?: number;
    spriteResolution?: number;
    textFillStyle?: string;
}

export function createSpriteLabel({ text, fontSize, spriteResolution, textFillStyle }: IOptions) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const font = `${fontSize ?? 150}px Arial`;
    ctx.font = font;

    const padding = 30;
    const textWidth = ctx.measureText(text).width;
    const textHeight = ctx.measureText(text).actualBoundingBoxAscent + ctx.measureText(text).actualBoundingBoxDescent;

    canvas.width = textWidth + padding;
    canvas.height = textHeight + padding;

    ctx.font = font;
    ctx.textBaseline = "top";

    // ctx.fillStyle = "rgba(0, 0, 0, 0)";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = textFillStyle ?? "white";
    ctx.fillText(text, padding / 2, padding / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        })
    );
    const res = spriteResolution ?? 0.005
    sprite.scale.x = canvas.width * res;
    sprite.scale.y = canvas.height * res; 

    return sprite;
}
