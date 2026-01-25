import mascotsMeta from "./mascots.meta.json";

export interface MascotMeta{
    id: number;
    name: string;
    path: string;
}

export const MASCOTS: MascotMeta[] = mascotsMeta as MascotMeta[];

export function getMascotById(id?: number): MascotMeta | undefined {
    if(!id) return undefined;
    return MASCOTS.find(mascot => mascot.id === id);
}

export function getMascotPath(id?: number): string | undefined {
    if(!id) return undefined;
    return getMascotById(id)?.path;
}