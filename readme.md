# Sorcherer

![Osciliating Cat Demo](https://raw.githubusercontent.com/yepistream/sorcherer/refs/heads/main/osciliating_cat.gif)

**Sorcherer** is a lightweight JavaScript library for attaching dynamic HTML overlays to Three.js Object3D instances. With Sorcherer, you can define overlays in your HTML using a custom `<realm>` tag and have them automatically update (with culling, distance‑based scaling, rotation via CSS, auto‑centering, dynamic variables, and more) based on your 3D scene’s state.

  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Importing the Library](#importing-the-library)
    - [Browser UMD Bundle](#browser-umd-bundle)
    - [Defining Overlays via the `<realm>` Tag](#defining-overlays-via-the-realm-tag)
    - [Example](#example)
  - [API Reference](#api-reference)
    - [Static Methods](#static-methods)
    - [Instance Methods](#instance-methods)
  - [Contributing](#contributing)
  - [License](#license)


## Features

- **HTML Overlays for 3D Objects:** Attach DOM overlays to any Three.js Object3D.
- **Custom `<realm>` Tag:** Easily declare overlay elements with custom attributes.
- **Distance-Based Scaling:** Scale overlays based on the actual Euclidean distance from the camera.
- **Rotation Simulation:** Apply rotation from your Object3D via CSS’s `rotate` property. [!Currently Broken : D!]
- **Auto-Centering:** Optionally center overlays relative to their computed screen positions.
- **DOM Culling:** Efficient frustum culling to update only visible overlays.
- **Dynamic Variables:** Use placeholders in overlay content (e.g. `$dogCount=20$`) that become accessible as properties on the overlay instance.
- **Global Access & Cloning:** Access all overlays via `Sorcherer.instancesById` and clone overlays easily using the `attachClone` method.

## Installation

Sorcherer supports three common integration tracks depending on your runtime.

### 1) Bundler (ESM)

Install dependencies:

```bash
npm i sorcherer three
```

Import Sorcherer in your app:

```js
import Sorcherer from 'sorcherer';
```

Minimal end-to-end sample:

```js
import * as THREE from 'three';
import Sorcherer from 'sorcherer';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
cube.name = 'cube';
scene.add(cube);

document.body.insertAdjacentHTML('beforeend', `
  <realm>
    <div idm="cube" autoCenter="true" simulate3D="true">
      Cube: $label=ready$
    </div>
  </realm>
`);

Sorcherer.bootstrap(scene, camera, renderer);

(function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
})();
```

### 2) Node / CommonJS

Require Sorcherer in CommonJS:

```js
const Sorcherer = require('sorcherer');
```

Minimal end-to-end sample:

```js
const THREE = require('three');
const Sorcherer = require('sorcherer');

// In CommonJS builds, Sorcherer may be under .Sorcherer depending on your toolchain.
const Overlay = Sorcherer.Sorcherer || Sorcherer;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
const renderer = { domElement: { clientWidth: 800, clientHeight: 600 } }; // minimal renderer-like stub

const obj = new THREE.Object3D();
obj.name = 'serverObject';
scene.add(obj);

Overlay.registerScene(scene);
console.log('Registered overlays for:', [...Overlay.objectRegistry.keys()]);
```

### 3) CDN / Browser (script tags)

Load `three` and Sorcherer from a CDN, then use global `Sorcherer`:

```html
<!doctype html>
<html>
  <body>
    <realm>
      <div idm="cube" autoCenter="true" simulate3D="true">Hello from CDN</div>
    </realm>

    <script src="https://unpkg.com/three@0.152.2/build/three.min.js"></script>
    <script src="https://unpkg.com/sorcherer"></script>
    <script>
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
      camera.position.z = 4;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(innerWidth, innerHeight);
      document.body.appendChild(renderer.domElement);

      const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
      cube.name = 'cube';
      scene.add(cube);

      Sorcherer.bootstrap(scene, camera, renderer);

      function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      }
      animate();
    </script>
  </body>
</html>
```

## Usage

### Style injection

Sorcherer now injects its required base styles automatically at runtime, so you no longer need to include or manage a separate external CSS file for core overlay behavior.

### Browser UMD Bundle

For script-tag usage, build the UMD bundle:

```bash
npm run build
```

This generates:

- `dist/sorcherer.umd.js`
- `dist/sorcherer.umd.min.js`

The UMD build keeps `three` external, so load Three.js first and ensure it provides the global `THREE`:

```html
<script src="https://unpkg.com/three@0.152.2/build/three.min.js"></script>
<script src="./dist/sorcherer.umd.js"></script>
<script>
  // UMD export is available on window.Sorcherer
  const overlay = new window.Sorcherer.Sorcherer(myObject3D);
  // equivalent:
  const OverlayCtor = Sorcherer.Sorcherer;
</script>
```

### Defining Overlays via the `<realm>` Tag

Define overlays in your HTML with a custom `<realm>` tag. Each child element with an `idm` attribute is bound to a Three.js `Object3D` whose `.name` matches that `idm`.

Supported attributes on each child:

- `idm="cube"` – Name of the target `Object3D` (must match `object.name`).
- `simulate3D="true"` – Enable distance-based scaling of the overlay.
- `simulateRotation="true"` – Rotate the overlay with the object (around Z) via CSS transform.
- `offset="x,y,z"` – Optional world-space offset as a comma-separated vector, e.g. `"0,0.5,0"`.
- `autoCenter="true"` – Auto-center the overlay around the computed screen position.
- `scaleMultiplier="1.5"` – Multiplies the distance-based scale factor.

Inside the element you can use dynamic variable placeholders:

- `$varName$`
- `$varName=defaultValue$`

At runtime these become properties on the corresponding `Sorcherer` instance. For example, `$dogCount=0$` creates `instance.dogCount` which you can update from your render loop.

Example `<realm>` block:

```html
<realm>
  <div idm="cube"
       simulate3D="true"
       simulateRotation="true"
       autoCenter="true"
       offset="0,0.8,0">
    <div class="hud-title">$label=Magic Cube$</div>
    <div class="hud-meta">Distance: $distance=0.00$</div>
    <div class="hud-meta">Dog count: $dogCount=0$</div>
  </div>
</realm>
```

### Example

Below is a minimal example using `Sorcherer.bootstrap`, which replaces the older pattern of manually calling:

```js
Sorcherer.registerObject3D(cube);
Sorcherer.attachFromRealm();
Sorcherer.autoSetup(camera, renderer);
```

HTML:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sorcherer Example</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body {
        margin: 0;
        overflow: hidden;
        background: #02030a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      canvas {
        display: block;
      }
      .sorcherer-container {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
      }
      .magic-MinusOne {
        position: absolute;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(0,0,0,0.75);
        color: #fff;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: auto;
      }
    </style>
  </head>
  <body>
    <!-- Overlays -->
    <realm>
      <div idm="cube"
           simulate3D="true"
           simulateRotation="true"
           autoCenter="true"
           offset="0,0.8,0">
        <div class="hud-title">$label=Magic Cube$</div>
        <div class="hud-meta">Distance: $distance=0.00$</div>
        <div class="hud-meta">Dog count: $dogCount=0$</div>
      </div>
    </realm>

    <script type="module">
      import * as THREE from 'three';
      import { Sorcherer } from './sorcherer.js';

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050510);

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 1.5, 6);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      const light = new THREE.DirectionalLight(0xffffff, 1.4);
      light.position.set(5, 8, 5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404060, 0.6));

      const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
      const cubeMat = new THREE.MeshStandardMaterial({ color: 0x00ff99 });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.name = 'cube'; // must match idm="cube"
      scene.add(cube);

      // One call to set everything up:
      Sorcherer.bootstrap(scene, camera, renderer, {
        interval: 16,      // minimum ms between overlay updates
        autoAttach: true,  // scan <realm> and attach overlays
        autoRegister: true // register all named objects in the scene
      });

      // Access overlay instances by Object3D name:
      const overlays = Sorcherer.elements;
      let dogCount = 0;

      function animate() {
        requestAnimationFrame(animate);

        const t = Date.now() * 0.001;

        cube.position.x = Math.cos(t) * 2;
        cube.position.z = Math.sin(t) * 2;
        cube.position.y = Math.sin(t * 2) * 1;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.02;

        const cubeOverlay = overlays['cube'];
        if (cubeOverlay) {
          dogCount += 0.03;
          const dist = camera.position.distanceTo(cube.position).toFixed(2);
          cubeOverlay.label = 'Magic Cube';
          cubeOverlay.distance = dist;
          cubeOverlay.dogCount = dogCount.toFixed(0);
        }

        renderer.render(scene, camera);
      }

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      animate();
    </script>
  </body>
</html>
```

## API Reference

### Static Methods

- **`Sorcherer.bootstrap(scene, camera, renderer, options?)`**  
  High-level convenience that wires everything up in one call. It:

  1. Registers all named objects in `scene` (via `registerScene`) if `autoRegister` is `true`.
  2. Scans the DOM for `<realm>` tags and attaches overlays if `autoAttach` is `true`.
  3. Starts the auto-update loop (via `autoSetup`).

  ```ts
  Sorcherer.bootstrap(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    options?: {
      interval?: number;     // minimum ms between overlay updates (default: 16)
      autoAttach?: boolean;  // default: true
      autoRegister?: boolean // default: true
    }
  )
  ```

- **`Sorcherer.registerScene(scene)`**  
  Traverses a Three.js scene (or any `Object3D` subtree) and registers every object that has a non-empty `.name`:

  ```js
  Sorcherer.registerScene(scene);
  ```

  This is what `bootstrap` uses internally when `autoRegister: true`.

- **`Sorcherer.registerObject3D(object)`**  
  Registers a single `Object3D` using its `name` property as the key:

  ```js
  cube.name = 'cube';
  Sorcherer.registerObject3D(cube);
  ```

- **`Sorcherer.attachFromRealm(root?)`**  
  Scans the DOM for `<realm>` tags (optionally under a specific root element) and, for each child element with an `idm` attribute, creates and attaches a `Sorcherer` overlay instance bound to the registered `Object3D` with the same name.

  ```ts
  Sorcherer.attachFromRealm(root?: Document | Element);
  ```

  You rarely need to call this manually if you use `bootstrap`.

- **`Sorcherer.autoSetup(camera, renderer, interval?)`**  
  Starts the auto-update loop that calls `bufferAll(camera, renderer)` on a throttled `requestAnimationFrame` loop.

  ```ts
  Sorcherer.autoSetup(
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    interval?: number // minimum ms between updates, default 16
  );
  ```

  Normally invoked for you by `bootstrap`.

- **`Sorcherer.stopAutoSetup()`**  
  Stops the auto-update loop started by `autoSetup` or `bootstrap`.

  ```js
  Sorcherer.stopAutoSetup();
  ```

- **`Sorcherer.bufferAll(camera, renderer)`**  
  Updates all active overlays:

  - Computes the camera frustum.
  - Performs frustum culling per target object.
  - Calls `bufferInstance(camera, renderer)` on visible overlays.
  - Hides overlays whose objects are outside the camera frustum.

  You usually don’t call this directly; it’s driven by `autoSetup`.

- **`Sorcherer.defaultScaleMultiplier`**  
  Global default for distance-based scaling (used when an instance does not specify its own `scaleMultiplier`).

  ```js
  Sorcherer.defaultScaleMultiplier = 1.5;
  ```

- **`Sorcherer.instancesById`**  
  A plain object mapping `Object3D.name` → overlay instance:

  ```js
  const cubeOverlay = Sorcherer.instancesById['cube'];
  cubeOverlay.dogCount = '42';
  ```

- **`Sorcherer.elements`**  
  Alias for `Sorcherer.instancesById` (handy shorter name):

  ```js
  const overlays = Sorcherer.elements;
  overlays.cube.label = 'Magic Cube';
  ```

### Instance Methods

A `Sorcherer` instance is created either:

- Internally by `attachFromRealm` when it processes a `<realm>` child, or
- Manually via `new Sorcherer(object, ...)`.

Constructor:

```ts
new Sorcherer(
  object: THREE.Object3D,
  offset?: THREE.Vector3,      // default: (0,0,0)
  simulate3D?: boolean,        // default: false
  simulateRotation?: boolean,  // default: false
  autoCenter?: boolean,        // default: false
  scaleMultiplier?: number     // default: Sorcherer.defaultScaleMultiplier
);
```

- **`attach(innerHTML)`**  
  Binds an HTML template to the overlay. Parses dynamic variable placeholders of the form `$var$` and `$var=default$`, stores them, and immediately renders the overlay.

  ```js
  const overlay = new Sorcherer(cube, new THREE.Vector3(0, 0.8, 0), true, true, true);
  overlay.attach(`
    <div>Health: $health=100$</div>
    <div>Ammo: $ammo=30$</div>
  `);
  ```

- **`renderDynamicVars()`**  
  Rebuilds the current HTML from `this.template` by substituting the latest `dynamicVars` values into all `$var$` placeholders. Normally you don’t need to call this manually because `setDynamicVar` and direct property setters call it for you.

- **`setDynamicVar(varName, value)` / `getDynamicVar(varName)`**  
  Low-level accessors for dynamic variables:

  ```js
  overlay.setDynamicVar('health', '75');
  console.log(overlay.getDynamicVar('health'));
  ```

- **Dynamic variable property access**  
  For each `$varName$` placeholder in the template, `attach()` defines a property on the instance:

  ```html
  <div idm="cube">
    Health: $health=100$
  </div>
  ```

  ```js
  const cubeOverlay = Sorcherer.instancesById['cube'];
  cubeOverlay.health = '80';        // updates the DOM
  console.log(cubeOverlay.health);  // "80"
  ```

- **`bufferInstance(camera, renderer)`**  
  Repositions and transforms the overlay for its target object:

  - Computes world position (plus `offset`).
  - Projects to screen space and converts to pixel coordinates.
  - Applies optional `autoCenter`, distance-based scaling (`simulate3D`), and Z-rotation (`simulateRotation`).
  - Adjusts `z-index` based on distance.
  - Shows or hides the overlay as needed.

  This is called automatically from `bufferAll`.

- **`dispose()`**  
  Removes the overlay DOM element, unregisters it from `allLoadedElements`, and clears its entry from `instancesById` (if any). Use this when an overlay is no longer needed.

  ```js
  const overlay = Sorcherer.instancesById['cube'];
  overlay.dispose();
  ```

- **`attachClone(targetObject, newName?)`**  
  Clones an existing overlay (including its template and current `dynamicVars`) and attaches the clone to another `Object3D`.

  ```js
  const srcOverlay = Sorcherer.instancesById['cube'];
  const clone = srcOverlay.attachClone(otherMesh, 'otherMeshName');

  clone.label = 'Clone HUD';
  ```

  If `newName` is provided, `targetObject.name` is set to that value and the clone is stored in `Sorcherer.instancesById[newName]`.

## Contributing

Contributions are welcome! Please open issues or submit pull requests on the [GitHub repository](https://github.com/yepistream/sorcherer).

## License

This project is licensed under the MIT License.

# Only dependency is, of course, THREEJS
