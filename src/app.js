import WebGL from 'three/addons/capabilities/WebGL.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { Viewer } from './viewer.js';

window.VIEWER = {};

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	console.error('The File APIs are not fully supported in this browser.');
} else if (!WebGL.isWebGLAvailable()) {
	console.error('WebGL is not supported in this browser.');
}

class App {
	/**
	 * @param  {Element} el
	 * @param  {Location} location
	 */
	constructor(el) {
		this.el = el;
		this.viewer = null;
		this.loader = new STLLoader().setCrossOrigin('anonymous');

		this.viewerEl = el.querySelector('.viewer');
		this.reloadEl = el.querySelector('.reload');
		this.statsEl = el.querySelector('.stats');
		this.spinnerEl = el.querySelector('.spinner');
		this.dropEl = el.querySelector('.dropzone');
		this.inputEl = el.querySelector('#file-input');

		this.state = 'drop';

		this.inputEl.addEventListener('change', () => {
			this.load(this.inputEl.files[0])
				.then((geometry) => {
					this.view(geometry);
				})
				.catch((error) => this.onError(error));
		});
	}

	/**
	 * Loads a fileset provided by user action.
	 * @param  {File} file
	 */
	load(file) {
		return new Promise((resolve, reject) => {
			const fileURL = typeof file === 'string' ? file : URL.createObjectURL(file);
			const rootPath = 'localhost:3000';

			if (!file.name.match(/\.stl$/)) {
				reject('Пожалуйста, используйте формат .stl');
			}

			this.loader.load(
				fileURL,
				(geometry) => {
					if (typeof fileURL === 'object') URL.revokeObjectURL(fileURL);
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

	view(geometry) {
		if (this.viewer) this.viewer.clear();

		if (!this.viewer) {
			this.viewer = new Viewer(this.viewerEl);
		}

		this.reloadEl.addEventListener('click', () => {
			this.state = 'drop';
			this.viewer.clear();
		});

		this.dropEl.classList.add('hidden');
		this.showSpinner();

		this.hideSpinner();
		this.viewerEl.classList.remove('hidden');
		this.reloadEl.classList.remove('hidden');

		this.viewer.view(geometry);

		this.showStats();
	}

	/**
	 * @param  {Error} error
	 */
	onError(error) {
		let message = (error || {}).message || error.toString();
		if (message.match(/ProgressEvent/)) {
			message = 'Unable to retrieve this file. Check JS console and browser network tab.';
		} else if (message.match(/Unexpected token/)) {
			message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
		}
		window.alert(message); // TODO: move to popup
		console.error(error);
	}

	showStats() {
		const widthEl = this.statsEl.querySelector('.stats__item--width');
		const heightEl = this.statsEl.querySelector('.stats__item--height');
		const lengthEl = this.statsEl.querySelector('.stats__item--length');
		const volumeEl = this.statsEl.querySelector('.stats__item--volume');

		widthEl.textContent = this.viewer.sizes.width.toFixed(2);
		heightEl.textContent = this.viewer.sizes.height.toFixed(2);
		lengthEl.textContent = this.viewer.sizes.length.toFixed(2);
		volumeEl.textContent = (
			this.viewer.sizes.height *
			this.viewer.sizes.length *
			this.viewer.sizes.width
		).toFixed(1);

		this.statsEl.classList.remove('hidden');
	}

	showSpinner() {
		this.spinnerEl.classList.remove('hidden');
	}

	hideSpinner() {
		this.spinnerEl.classList.add('hidden');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new App(document.body, location);
	window.VIEWER.app = app;
	console.info(app);
});
