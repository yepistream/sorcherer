declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
  }

  export class Object3D {
    name: string;
  }

  export class Scene extends Object3D {}
  export class Camera extends Object3D {}
  export class Frustum {}
  export class Matrix4 {}
  export class WebGLRenderer {}
}
