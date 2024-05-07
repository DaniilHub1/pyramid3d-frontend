import WebGL from 'three/addons/capabilities/WebGL.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { Viewer } from './viewer.js';

class App {
	constructor(el) {
		this.el = el;

		this.viewerEl = el.querySelector('.viewer');
		this.reloadEl = el.querySelector('.reload');
		this.statsEl = el.querySelector('.stats');
		this.spinnerEl = el.querySelector('.spinner');
		this.uploadEl = el.querySelector('.upload');
		this.inputEl = el.querySelector('#file-input');

		this.viewer = new Viewer(this.viewerEl);
		this.loader = new STLLoader().setCrossOrigin('anonymous');

		this.reloadEl.addEventListener('click', () => {
			this.viewer.clear();
			this.statsEl.classList.add('hidden');
			this.reloadEl.classList.add('hidden');
			this.uploadEl.classList.remove('hidden');
		});

		this.inputEl.addEventListener('change', () => {
			this.uploadEl.classList.add('hidden');
			this.showSpinner();

			this.load(this.inputEl.files[0])
				.then((geometry) => {
					this.viewer.view(geometry);

					this.hideSpinner();
					this.viewerEl.classList.remove('hidden');
					this.reloadEl.classList.remove('hidden');
					this.showStats();
				})
				.catch((error) => this.onError(error));
		});
	}

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
					URL.revokeObjectURL(fileURL);
					resolve(geometry);
				},
				(xhr) => {
					console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
				},
				(error) => {
					reject(error);
				},
			);
		});
	}

	onError(error) {
		let message = error.message || error.toString();
		if (message.match(/ProgressEvent/)) {
			message = 'Ошибка при загрузке файла. Попробуйте снова';
		} else if (message.match(/Unexpected token/)) {
			message = `Ошибка распознавания содержимого. Убедитесь, что файл валиден и не поврежден`;
		}
		window.alert(message); // TODO: move to popup
		console.error(error);
	}

	showStats() {
		[...this.statsEl.querySelectorAll('.stats__item > span')].forEach((el) => {
			el.textContent = this.viewer.sizes[el.className].toFixed(1);
		});

		this.statsEl.classList.remove('hidden');
	}

	showSpinner() {
		this.spinnerEl.classList.remove('hidden');
	}

	hideSpinner() {
		this.spinnerEl.classList.add('hidden');
	}
}

window.VIEWER = {};

if (!WebGL.isWebGLAvailable()) {
	console.error('WebGL is not supported in this browser.');
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new App(document.body, location);
	window.VIEWER.app = app;
	console.info(app);
});
