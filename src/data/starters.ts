export interface Starter {
  id: string;
  name: string;
  dex: number;
  types: string;
  description: string;
}

export const STARTERS_BY_GENERATION: Record<number, Starter[]> = {
  1: [
    { id: "bulbasaur", name: "Bulbasaur", dex: 1, types: "Planta / Veneno", description: "Lleva un bulbo en el lomo que crece con él." },
    { id: "charmander", name: "Charmander", dex: 4, types: "Fuego", description: "La llama de su cola indica su vitalidad." },
    { id: "squirtle", name: "Squirtle", dex: 7, types: "Agua", description: "Se protege en su caparazón y lanza agua a presión." },
  ],
  2: [
    { id: "chikorita", name: "Chikorita", dex: 152, types: "Planta", description: "Usa la hoja de su cabeza para oler el ambiente." },
    { id: "cyndaquil", name: "Cyndaquil", dex: 155, types: "Fuego", description: "Se enciende cuando se asusta o se enfada." },
    { id: "totodile", name: "Totodile", dex: 158, types: "Agua", description: "Mandíbulas fuertes y carácter juguetón." },
  ],
  3: [
    { id: "treecko", name: "Treecko", dex: 252, types: "Planta", description: "Ágil trepador que domina los árboles." },
    { id: "torchic", name: "Torchic", dex: 255, types: "Fuego", description: "Una bola de fuego en su interior lo mantiene caliente." },
    { id: "mudkip", name: "Mudkip", dex: 258, types: "Agua", description: "Detecta corrientes con la aleta de su cabeza." },
  ],
  4: [
    { id: "turtwig", name: "Turtwig", dex: 387, types: "Planta", description: "Un brote crece en su cabeza y hace fotosíntesis." },
    { id: "chimchar", name: "Chimchar", dex: 390, types: "Fuego", description: "Su cola arde y su energía no se apaga." },
    { id: "piplup", name: "Piplup", dex: 393, types: "Agua", description: "Orgulloso y elegante, nada con gran estilo." },
  ],
  5: [
    { id: "snivy", name: "Snivy", dex: 495, types: "Planta", description: "Sereno y seguro, trepa con rapidez." },
    { id: "tepig", name: "Tepig", dex: 498, types: "Fuego", description: "Lanza fuego por el hocico cuando se emociona." },
    { id: "oshawott", name: "Oshawott", dex: 501, types: "Agua", description: "Usa su concha como espada y escudo." },
  ],
  6: [
    { id: "chespin", name: "Chespin", dex: 650, types: "Planta", description: "Su caparazón de púas lo protege de golpes." },
    { id: "fennekin", name: "Fennekin", dex: 653, types: "Fuego", description: "Expulsa aire caliente por sus orejas." },
    { id: "froakie", name: "Froakie", dex: 656, types: "Agua", description: "Cubre su cuerpo con burbujas para amortiguar." },
  ],
  7: [
    { id: "rowlet", name: "Rowlet", dex: 722, types: "Planta / Volador", description: "Silencioso y preciso, ataca sin hacer ruido." },
    { id: "litten", name: "Litten", dex: 725, types: "Fuego", description: "Solitaria, su pelaje suelta chispas al acicalarse." },
    { id: "popplio", name: "Popplio", dex: 728, types: "Agua", description: "Crea pompas de agua y juega con ellas." },
  ],
  8: [
    { id: "grookey", name: "Grookey", dex: 810, types: "Planta", description: "Golpea con su rama al ritmo de la música." },
    { id: "scorbunny", name: "Scorbunny", dex: 813, types: "Fuego", description: "Corre sin parar y enciende sus pies." },
    { id: "sobble", name: "Sobble", dex: 816, types: "Agua", description: "Tímido, se camufla cuando llora." },
  ],
  9: [
    { id: "sprigatito", name: "Sprigatito", dex: 906, types: "Planta", description: "Caprichoso y dulce, su aroma relaja." },
    { id: "fuecoco", name: "Fuecoco", dex: 909, types: "Fuego", description: "Tranquilo y glotón, su llama es cálida." },
    { id: "quaxly", name: "Quaxly", dex: 912, types: "Agua", description: "Serio y pulcro, cuida mucho su peinado." },
  ],
};

export function generationForUser(telegramId: number): number {
  return (telegramId % 9) + 1;
}

export function startersForGeneration(generation: number): Starter[] {
  return STARTERS_BY_GENERATION[generation] ?? STARTERS_BY_GENERATION[1]!;
}

export function findStarter(id: string): Starter | undefined {
  for (const list of Object.values(STARTERS_BY_GENERATION)) {
    const found = list.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}
