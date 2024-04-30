import {
	AmbientLight,
	Box3,
	Cache,
	Color,
	DirectionalLight,
	HemisphereLight,
	Mesh,
	MeshPhysicalMaterial,
	LoaderUtils,
	LoadingManager,
	PerspectiveCamera,
	PointsMaterial,
	Scene,
	Vector3,
	WebGLRenderer,
	LinearToneMapping,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MANAGER = new LoadingManager();

const MATERIAL = {
	color: 0xffffff,
	envMap: null,
	metalness: 0.1,
	roughness: 0.1,
	opacity: 1.0,
	transparent: true,
	transmission: 0.99,
	clearcoat: 1.0,
	clearcoatRoughness: 0.25,
};

const INITIAL_STATE = {
	background: false,
	playbackSpeed: 1.0,
	autoRotate: false,

	// Lights
	punctualLights: true,
	exposure: 0.0,
	toneMapping: LinearToneMapping,
	ambientIntensity: 0.3,
	ambientColor: '#FFFFFF',
	directIntensity: 0.8 * Math.PI,
	directColor: '#FFFFFF',
	bgColor: '#191919',

	pointSize: 1.0,
};

Cache.enabled = true;

export class Viewer {
	constructor(el) {
		this.el = el;

		this.lights = [];
		this.content = null;
		this.state = { ...INITIAL_STATE, toneMapping: LinearToneMapping };

		this.prevTime = 0;

		this.stats = new Stats();
		this.stats.dom.height = '48px';
		[].forEach.call(this.stats.dom.children, (child) => (child.style.display = ''));

		this.backgroundColor = new Color(this.state.bgColor);

		this.scene = new Scene();
		this.scene.background = this.backgroundColor;

		const fov = false ? (0.8 * 180) / Math.PI : 60; // experiment
		const aspect = el.clientWidth / el.clientHeight;
		this.camera = new PerspectiveCamera(fov, aspect, 0.01, 1000);
		this.scene.add(this.camera);

		this.renderer = window.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0xcccccc);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(el.clientWidth, el.clientHeight);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.maxAzimuthAngle = Math.PI; // lock rotate
		this.controls.minAzimuthAngle = Math.PI; // lock rotate
		this.controls.screenSpacePanning = true;

		this.el.appendChild(this.renderer.domElement);

		this.animate = this.animate.bind(this);
		requestAnimationFrame(this.animate);
		window.addEventListener('resize', this.resize.bind(this), false);
	}

	animate(time) {
		requestAnimationFrame(this.animate);

		this.controls.update();
		this.stats.update();
		this.renderer.render(this.scene, this.camera);

		this.prevTime = time;
	}

	resize() {
		const { clientHeight, clientWidth } = this.el.parentElement;

		this.camera.aspect = clientWidth / clientHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(clientWidth, clientHeight);
	}

	load(url, rootPath, assetMap) {
		const baseURL = LoaderUtils.extractUrlBase(url);

		return new Promise((resolve, reject) => {
			MANAGER.setURLModifier((url, path) => {
				return (path || '') + url;
			});

			const loader = new STLLoader(MANAGER).setCrossOrigin('anonymous');

			const blobURLs = [];

			loader.load(
				url,
				(geometry) => {
					window.VIEWER.json = geometry;

					const material = new MeshPhysicalMaterial(MATERIAL);
					const mesh = new Mesh(geometry, material);
					this.scene.add(mesh);

					this.setContent(mesh);
					blobURLs.forEach(URL.revokeObjectURL);
					resolve(geometry);
				},
				(xhr) => {
					console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
				},
				(error) => {
					console.log(error);
					reject(error);
				},
			);
		});
	}

	/**
	 * @param {THREE.Object3D} object
	 */
	setContent(object) {
		this.clear();

		object.updateMatrixWorld(); // donmccurdy/three-gltf-viewer#330

		const box = new Box3().setFromObject(object);
		const size = box.getSize(new Vector3()).length();
		const center = box.getCenter(new Vector3());
		console.log(box);

		this.controls.reset();

		object.position.x -= center.x;
		object.position.y -= center.y;
		object.position.z -= center.z;

		this.camera.near = size / 100;
		this.camera.far = size * 100;
		this.camera.updateProjectionMatrix();

		this.camera.position.copy(center);
		this.camera.position.x += size / 2.0;
		this.camera.position.y += size / 2.0;
		this.camera.position.z += size / 1.3;
		this.camera.lookAt(center);

		this.controls.maxDistance = size * 10;
		this.controls.enabled = true;
		this.controls.enableZoom = false;
		this.controls.saveState();

		this.scene.add(object);
		this.content = object;

		this.state.punctualLights = true;

		this.content.traverse((node) => {
			if (node.isLight) {
				this.state.punctualLights = false;
			}
		});

		this.updateLights();
		this.updateDisplay();

		window.VIEWER.scene = this.content;
	}

	updateLights() {
		const state = this.state;
		const lights = this.lights;

		if (state.punctualLights && !lights.length) {
			this.addLights();
		} else if (!state.punctualLights && lights.length) {
			this.removeLights();
		}

		this.renderer.toneMapping = Number(state.toneMapping);
		this.renderer.toneMappingExposure = Math.pow(2, state.exposure);

		if (lights.length === 2) {
			lights[0].intensity = state.ambientIntensity;
			lights[0].color.set(state.ambientColor);
			lights[1].intensity = state.directIntensity;
			lights[1].color.set(state.directColor);
		}
	}

	addLights() {
		const state = this.state;

		// experiment
		if (true) {
			const hemiLight = new HemisphereLight();
			hemiLight.name = 'hemi_light';
			this.scene.add(hemiLight);
			this.lights.push(hemiLight);
		} else {
			const light1 = new AmbientLight(state.ambientColor, state.ambientIntensity);
			light1.name = 'ambient_light';
			this.camera.add(light1);

			const light2 = new DirectionalLight(state.directColor, state.directIntensity);
			light2.position.set(0.5, 0, 0.866); // ~60º
			light2.name = 'main_light';
			this.camera.add(light2);

			this.lights.push(light1, light2);
		}
	}

	removeLights() {
		this.lights.forEach((light) => light.parent.remove(light));
		this.lights.length = 0;
	}

	updateDisplay() {
		this.content.traverse((node) => {
			if (!node.geometry) return;
			const materials = Array.isArray(node.material) ? node.material : [node.material];
			materials.forEach((material) => {
				material.wireframe = false;
				if (material instanceof PointsMaterial) {
					material.size = this.state.pointSize;
				}
			});
		});

		this.controls.autoRotate = this.state.autoRotate;
	}

	clear() {
		if (!this.content) return;

		this.scene.remove(this.content);

		this.content.traverse((node) => {
			if (!node.geometry) return;
			node.geometry.dispose();
			const materials = Array.isArray(node.material) ? node.material : [node.material];
			materials.forEach((material) => {
				for (const key in material) {
					if (key !== 'envMap' && material[key] && material[key].isTexture) {
						material[key].dispose();
					}
				}
			});
		});
	}
}
