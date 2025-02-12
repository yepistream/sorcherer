// src/sorcherer.js

// Dynamically load magicalStyle.css if not already loaded.
(function loadMagicalStyle() {
  if (typeof document !== "undefined" && !document.getElementById('magical-style')) {
    const link = document.createElement('link');
    link.id = 'magical-style';
    link.rel = 'stylesheet';
    // Adjust the path if your structure changes.
    link.href = '/magicalStyle.css';
    document.head.appendChild(link);
  }
})();

import { Vector3, Frustum, Matrix4 } from 'three';

/**
 * Sorcherer - A library for attaching HTML overlays to Three.js Object3D instances.
 *
 * Overlays can be defined via a custom `<realm>` tag and support features such as:
 * - Distance-based scaling (simulate3D)
 * - Rotation via the CSS "rotate" property (simulateRotation)
 * - Auto-centering of the overlay
 * - Custom offsets
 * - DOM culling based on camera frustum
 */
export class Sorcherer {
  // All overlay instances.
  static allLoadedElements = new Set();
  // For frustum culling.
  static frustum = new Frustum();
  static matrix = new Matrix4();
  // Container element for all overlays.
  static container = document.createElement('div');
  static autoUpdateRunning = false;
  // Registry mapping Object3D names to objects.
  static objectRegistry = new Map();
  // Default scale multiplier (developers can change this via Sorcherer.defaultScaleMultiplier).
  static defaultScaleMultiplier = 1;

  // Static initializer: attach the overlay container.
  static {
    if (typeof document !== "undefined") {
      Sorcherer.container.classList.add('sorcherer-container');
      document.body.appendChild(Sorcherer.container);
    }
  }

  /**
   * @param {THREE.Object3D} object - The target Object3D.
   * @param {THREE.Vector3} [offset=new Vector3()] - Optional offset for the overlay.
   * @param {boolean} [simulate3D=false] - Scale the overlay based on distance.
   * @param {boolean} [simulateRotation=false] - Rotate the overlay with the object.
   * @param {boolean} [autoCenter=false] - Auto-center the overlay relative to its computed screen position.
   * @param {number} [scaleMultiplier] - Multiplier applied to distance-based scaling (defaults to Sorcherer.defaultScaleMultiplier).
   */
  constructor(object, offset = new Vector3(), simulate3D = false, simulateRotation = false, autoCenter = false, scaleMultiplier) {
    this.object = object;
    this.offset = offset;
    this.simulate3D = simulate3D;
    this.simulateRotation = simulateRotation;
    this.autoCenter = autoCenter;
    this.scaleMultiplier = (scaleMultiplier !== undefined) ? scaleMultiplier : Sorcherer.defaultScaleMultiplier;
    this._parentSpan = this.createSpan();
    this.innerHTML = "";

    if (typeof document !== "undefined") {
      Sorcherer.container.appendChild(this._parentSpan);
      Sorcherer.allLoadedElements.add(this);
    }

    if (object && typeof object.dispose === 'function') {
      const originalDispose = object.dispose.bind(object);
      object.dispose = () => {
        this.dispose();
        originalDispose();
      };
    }
  }

  /**
   * Creates the overlay element.
   * @returns {HTMLSpanElement}
   */
  createSpan() {
    const span = document.createElement('span');
    span.classList.add('magic-MinusOne');
    span.style.position = 'absolute';
    span.style.display = 'none';
    span.style.transformOrigin = 'top left';
    return span;
  }

  /**
   * Attaches HTML content to the overlay. Uses innerHTML so markup is parsed.
   * @param {string} innerHTML - The HTML content to display.
   */
  attach(innerHTML) {
    this.innerHTML = innerHTML;
    this._parentSpan.innerHTML = innerHTML;
    this._parentSpan.style.display = 'block';
  }

  /**
   * Updates the overlay’s position, scaling, and rotation based on the camera.
   * @param {THREE.Camera} camera - The active camera.
   * @param {THREE.Renderer} renderer - The active renderer.
   */
  async bufferInstance(camera, renderer) {
    if (!this.object) return;
    if (!this.object.visible) {
      this._parentSpan.style.display = 'none';
      return;
    }
    
    // Get world position with offset.
    const objectWorldPos = new Vector3();
    this.object.getWorldPosition(objectWorldPos);
    objectWorldPos.add(this.offset);
    
    // Compute distance from camera.
    const distance = camera.position.distanceTo(objectWorldPos);
    
    // Project position into screen space.
    const projectedPos = objectWorldPos.clone();
    projectedPos.project(camera);
    
    const widthHalf = renderer.domElement.clientWidth / 2;
    const heightHalf = renderer.domElement.clientHeight / 2;
    const x = widthHalf * (projectedPos.x + 1);
    const y = heightHalf * (1 - projectedPos.y);
    
    // Build the transform for translation (with auto-centering if enabled).
    let transform = `translate(${x}px, ${y}px)`;
    if (this.autoCenter) {
      transform += ' translate(-50%, -50%)';
    }
    
    // Apply distance-based scaling if enabled.
    if (this.simulate3D) {
      const referenceDistance = 5; // A reference distance at which scale is the default.
      const scale = Math.max(0.1, this.scaleMultiplier * (referenceDistance / distance));
      transform += ` scale(${scale})`;
    }
    
    // Set translation and scaling.
    this._parentSpan.style.transform = transform;
    
    // Apply rotation separately via the CSS "rotate" property.
    if (this.simulateRotation) {
      const angleDeg = this.object.rotation.z * (180 / Math.PI);
      this._parentSpan.style.rotate = `${angleDeg}deg`;
    } else {
      this._parentSpan.style.rotate = '';
    }
    
    // Adjust zIndex based on distance.
    this._parentSpan.style.zIndex = Math.round(1000 / distance).toString();
    this._parentSpan.style.display = 'block';
  }

  /**
   * Updates all overlays based on the active camera and renderer.
   * @param {THREE.Camera} camera - The active camera.
   * @param {THREE.Renderer} renderer - The active renderer.
   */
  static async bufferAll(camera, renderer) {
    Sorcherer.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    Sorcherer.frustum.setFromProjectionMatrix(Sorcherer.matrix);
    
    for (let element of Sorcherer.allLoadedElements) {
      const worldPos = new Vector3();
      element.object.getWorldPosition(worldPos);
      if (Sorcherer.frustum.containsPoint(worldPos)) {
        await element.bufferInstance(camera, renderer);
      } else {
        element._parentSpan.style.display = 'none';
      }
    }
  }

  /**
   * Starts the auto-update loop.
   * @param {THREE.Camera} camera - The active camera.
   * @param {THREE.Renderer} renderer - The active renderer.
   * @param {number} [interval=16] - Update interval (in ms).
   */
  static autoSetup(camera, renderer, interval = 16) {
    if (Sorcherer.autoUpdateRunning) return;
    Sorcherer.autoUpdateRunning = true;
    const loop = async () => {
      if (!Sorcherer.autoUpdateRunning) return;
      await Sorcherer.bufferAll(camera, renderer);
      setTimeout(loop, interval);
    };
    loop();
  }

  /**
   * Removes the overlay and cleans up references.
   */
  dispose() {
    if (this._parentSpan.parentElement) {
      this._parentSpan.parentElement.removeChild(this._parentSpan);
    }
    Sorcherer.allLoadedElements.delete(this);
  }

  /**
   * Registers a Three.js Object3D using its name as key.
   * @param {THREE.Object3D} object - The object to register.
   */
  static registerObject3D(object) {
    if (object && object.name) {
      Sorcherer.objectRegistry.set(object.name, object);
    }
  }

  /**
   * Scans the DOM for a custom <realm> tag and attaches overlays based on child elements’ attributes.
   *
   * Supported attributes on child elements:
   * - idm: The Object3D name to match.
   * - simulate3D: "true" enables distance-based scaling.
   * - simulateRotation: "true" enables rotation via CSS "rotate".
   * - offset: A comma-separated list (e.g., "0,0.5,0") defining a THREE.Vector3 offset.
   * - autoCenter: "true" enables auto-centering.
   * - scaleMultiplier: A number to multiply the computed scale factor.
   */
  static attachFromRealm() {
    const realmElement = document.querySelector('realm');
    if (!realmElement) return;
    const elements = realmElement.querySelectorAll('[idm]');
    elements.forEach(el => {
      const idm = el.getAttribute('idm');
      if (!idm) return;
      const object = Sorcherer.objectRegistry.get(idm);
      if (object) {
        const simulate3D = (el.getAttribute('simulate3D') || '').toLowerCase() === 'true';
        const simulateRotation = (el.getAttribute('simulateRotation') || '').toLowerCase() === 'true';
        const autoCenter = (el.getAttribute('autoCenter') || '').toLowerCase() === 'true';
        
        let offset = new Vector3();
        if (el.hasAttribute('offset')) {
          const offsetStr = el.getAttribute('offset');
          const parts = offsetStr.split(',').map(s => parseFloat(s.trim()));
          if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
            offset = new Vector3(parts[0], parts[1], parts[2]);
          }
        }
        
        let scaleMultiplier;
        if (el.hasAttribute('scaleMultiplier')) {
          const parsed = parseFloat(el.getAttribute('scaleMultiplier'));
          if (!isNaN(parsed)) {
            scaleMultiplier = parsed;
          }
        }
        
        const instance = new Sorcherer(object, offset, simulate3D, simulateRotation, autoCenter, scaleMultiplier);
        instance.attach(el.innerHTML);
        el.remove();
      }
    });
    if (realmElement.children.length === 0) {
      realmElement.remove();
    }
  }
}
