import { Camera, Frustum, Matrix4, Object3D, Scene, Vector3, WebGLRenderer } from 'three';

export interface SorchererBootstrapOptions {
  interval?: number;
  autoAttach?: boolean;
  autoRegister?: boolean;
}

export declare class Sorcherer {
  static allLoadedElements: Set<Sorcherer>;
  static frustum: Frustum;
  static matrix: Matrix4;
  static container: HTMLDivElement | null;
  static autoUpdateRunning: boolean;
  static objectRegistry: Map<string, Object3D>;
  static instancesById: Record<string, Sorcherer>;
  static get elements(): Record<string, Sorcherer>;
  static defaultScaleMultiplier: number;

  object: Object3D;
  offset: Vector3;
  simulate3D: boolean;
  simulateRotation: boolean;
  autoCenter: boolean;
  scaleMultiplier: number;
  template: string;
  dynamicVars: Record<string, string>;

  constructor(
    object: Object3D,
    offset?: Vector3,
    simulate3D?: boolean,
    simulateRotation?: boolean,
    autoCenter?: boolean,
    scaleMultiplier?: number
  );

  createSpan(): HTMLSpanElement | {
    style: Record<string, string>;
    classList: { add(...tokens: string[]): void };
    innerHTML: string;
  };
  attach(innerHTML: string): void;
  renderDynamicVars(): void;
  setDynamicVar(varName: string, value: string): void;
  getDynamicVar(varName: string): string;
  bufferInstance(camera: Camera, renderer: WebGLRenderer): void;
  dispose(): void;
  attachClone(targetObject: Object3D, newName: string): Sorcherer;

  static bufferAll(camera: Camera, renderer: WebGLRenderer): void;
  static autoSetup(camera: Camera, renderer: WebGLRenderer, interval?: number): void;
  static stopAutoSetup(): void;
  static registerObject3D(object: Object3D): void;
  static registerScene(scene: Object3D): void;
  static bootstrap(
    scene: Scene,
    camera: Camera,
    renderer: WebGLRenderer,
    options?: SorchererBootstrapOptions
  ): void;
  static attachFromRealm(root?: Document | Element): void;
}
