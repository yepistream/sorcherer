export class Sorcherer {
  constructor(...args: any[]);
  attach(innerHTML: string): void;
  dispose(): void;
  setDynamicVar(varName: string, value: string): void;
  getDynamicVar(varName: string): string;
}
