import {
	Box3,
	Cache,
	Color,
	DirectionalLight,
	HemisphereLight,
	Mesh,
	MeshPhysicalMaterial,
	PerspectiveCamera,
	Scene,
	Vector3,
	WebGLRenderer,
} from 'three';

import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { settings } from './stl-settings';

Cache.enabled = true;

export class Viewer {
	constructor(el) {
		this.el = el;

		this.content = null;

		this.scene = new Scene();
		this.scene.background = new Color(settings.background);

		this.material = new MeshPhysicalMaterial(settings.material);

		this.camera = this.#createCamera();
		this.scene.add(this.camera);

		this.renderer = this.#createRenderer();
		this.el.appendChild(this.renderer.domElement);

		this.controls = this.#createControls();

		this.animate = this.animate.bind(this);
		this.prevTime = 0;
		requestAnimationFrame(this.animate);
	}

	#createCamera() {
		const { fov, near, far } = settings.camera;
		const aspect = this.el.clientWidth / this.el.clientHeight;

		return new PerspectiveCamera(fov, aspect, near, far);
	}

	#createRenderer() {
		if (!WebGL.isWebGLAvailable()) {
			throw new Error('WebGL is not supported in this browser.');
		}

		const renderer = new WebGLRenderer({ antialias: true });

		renderer.setClearColor(0xcccccc);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(this.el.clientWidth, this.el.clientHeight);

		return renderer;
	}

	#createControls() {
		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.rotateSpeed = 0.5;
		controls.screenSpacePanning = true;
		controls.enableZoom = false;
		controls.target = new Vector3(0, 0, 0);
		controls.maxDistance = (this.camera.far / 3) * 2;

		return controls;
	}

	animate(time) {
		requestAnimationFrame(this.animate);
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		this.prevTime = time;
	}

	view(geometry) {
		this.controls.reset();

		this.content = new Mesh(geometry, this.material);
		this.content.updateMatrixWorld();

		this.#setSizes();
		this.#setCamera();
		this.#setPosition();
		this.#setLights();

		this.scene.add(this.content);
	}

	#setSizes() {
		const box = new Box3().setFromObject(this.content);

		this.sizes = {
			size: box.getSize(new Vector3()),
			center: box.getCenter(new Vector3()),
			length: box.max.x - box.min.x,
			width: box.max.y - box.min.y,
			height: box.max.z - box.min.z,
		};

		this.box = box;

		this.sizes.volume = this.sizes.length * this.sizes.width * this.sizes.height;
	}

	#setPosition() {
		const { center } = this.sizes;

		this.content.position.x -= center.x;
		this.content.position.y -= center.y;
		this.content.position.z -= center.z;
	}

	#setCamera() {
		const { size } = this.sizes;

		const fov = this.camera.fov * (Math.PI / 180);
		const fovh = 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect);
		const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
		const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
		const cameraZ = Math.max(dx, dy) * 1.25;
		const minZ = this.box.min.z;
		const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

		this.camera.position.set(0, 0, cameraZ);
		this.camera.far = cameraToFarEdge * 3;
		this.camera.updateProjectionMatrix();
	}

	#setLights() {
		const { color, intensity, position } = settings.directLight;
		const [posX, posY, posZ] = position;

		const directLight = new DirectionalLight(color, intensity);
		directLight.position.set(posX, posY, posZ);
		this.camera.add(directLight);

		this.scene.add(new HemisphereLight());
	}

	clear() {
		if (!this.content) {
			return;
		}

		this.scene.remove(this.content);
		this.content.traverse((node) => {
			node.geometry?.dispose();
		});
	}
}
