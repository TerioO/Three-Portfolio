interface IOptions {
    bloomLayer: number;
}

export function createMeshUserData({ bloomLayer }: IOptions){
    return {
        bloomLayer: bloomLayer ?? 1,
    }
}