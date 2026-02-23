import { Sorcherer } from 'sorcherer';
import { Object3D, Vector3 } from 'three';

const object = new Object3D();
const overlay = new Sorcherer(object, new Vector3(0, 1, 0), true, false, true, 1.5);
overlay.attach('<div>$label=Hello$</div>');
overlay.setDynamicVar('label', 'Updated');

Sorcherer.registerObject3D(object);
Sorcherer.defaultScaleMultiplier = 1.25;

export { overlay };
