declare module "troika-three-text" {
    import { Mesh } from "three";

    class Text extends Mesh {
        text?: string;
        color?: number;
        fontSize?: number;
        fontWeight?: number | "normal" | "bold";
        fontStyle?: "italic" | "normal";
        letterSpacing?: number;
        lineHeight?: number | "normal";
        maxWidth?: number;
        textAlign?: "left" | "right" | "center" | "justify";
        constructor();
        sync();
        dispose();
    }

    export { Text };
}