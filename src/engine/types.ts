export type Grammar = Record<string, string[]>;

export type Modifier = (input: string) => string;

export type SeededRandom = () => number;
