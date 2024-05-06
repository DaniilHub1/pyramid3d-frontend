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

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

Cache.enabled = true;

export class Viewer {
	constructor(el) {
		this.el = el;

		this.content = null;

		this.prevTime = 0;

		this.scene = new Scene();
		this.scene.background = new Color('#191919');

		this.material = new MeshPhysicalMaterial({
			color: 0xeeeeee,
			metalness: 0.1,
			roughness: 0.6,
			clearcoat: 0.6,
			clearcoatRoughness: 0.4,
		});

		this.camera = this.#createCamera();
		this.scene.add(this.camera);

		this.renderer = window.renderer = this.#createRenderer();
		this.el.appendChild(this.renderer.domElement);

		this.controls = this.#createControls();

		this.animate = this.animate.bind(this);
		requestAnimationFrame(this.animate);
	}

	#createCamera() {
		const fov = (1 * 180) / Math.PI;
		const aspect = this.el.clientWidth / this.el.clientHeight;

		return new PerspectiveCamera(fov, aspect, 0.01, 1000);
	}

	#createRenderer() {
		const renderer = new WebGLRenderer({ antialias: true });

		renderer.setClearColor(0xcccccc);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(this.el.clientWidth, this.el.clientHeight);

		return renderer;
	}

	#createControls() {
		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.maxAzimuthAngle = Math.PI; // lock rotate
		controls.minAzimuthAngle = Math.PI; // lock rotate
		controls.screenSpacePanning = true;
		controls.enableZoom = false;

		return controls;
	}

	animate(time) {
		requestAnimationFrame(this.animate);
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		this.prevTime = time;
	}

	view(geometry) {
		window.VIEWER.json = geometry;

		this.controls.reset();

		this.content = new Mesh(geometry, this.material);
		this.content.updateMatrixWorld();

		this.#setSizes();
		this.#setCamera();
		this.#setPosition();
		this.#setLights();

		this.scene.add(this.content);

		window.VIEWER.scene = this.content;
	}

	#setSizes() {
		const box = new Box3().setFromObject(this.content);

		this.sizes = {
			size: box.getSize(new Vector3()).length(),
			center: box.getCenter(new Vector3()),
			length: box.max.x - box.min.x,
			width: box.max.y - box.min.y,
			height: box.max.z - box.min.z,
		};
	}

	#setPosition() {
		const { center } = this.sizes;

		this.content.position.x -= center.x;
		this.content.position.y -= center.y;
		this.content.position.z -= center.z;
	}

	#setCamera() {
		const { size, center } = this.sizes;

		this.camera.near = size / 100;
		this.camera.far = size * 100;
		this.camera.updateProjectionMatrix();

		this.camera.position.copy(center);
		this.camera.position.x += size / 2.0;
		this.camera.position.y += size / 2.0;
		this.camera.position.z += size / 1.3;
		this.camera.lookAt(center);
	}

	#setLights() {
		this.scene.add(new HemisphereLight());

		const directLight = new DirectionalLight('#FFFFFF', 0.8 * Math.PI);
		directLight.position.set(0.5, 0, 0.866); // ~60º
		this.camera.add(directLight);
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
