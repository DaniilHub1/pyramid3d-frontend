import WebGL from 'three/addons/capabilities/WebGL.js';
import { Viewer } from './viewer.js';
import queryString from 'query-string';

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
	constructor(el, location) {
		const hash = location.hash ? queryString.parse(location.hash) : {};
		this.options = {
			model: hash.model || '',
			preset: hash.preset || '',
			cameraPosition: hash.cameraPosition ? hash.cameraPosition.split(',').map(Number) : null,
		};

		this.el = el;
		this.viewer = null;
		this.viewerEl = null;
		this.spinnerEl = el.querySelector('.spinner');
		this.dropEl = el.querySelector('.dropzone');
		this.inputEl = el.querySelector('#file-input');

		this.inputEl.addEventListener('change', () => this.load(this.inputEl.files[0]))
		this.hideSpinner();

		const options = this.options;

		if (options.model) {
			this.view(options.model, '', new Map());
		}

	}

	/**
	 * Sets up the view manager.
	 * @return {Viewer}
	 */
	createViewer() {
		this.viewerEl = document.createElement('div');
		this.viewerEl.classList.add('viewer');
		this.dropEl.innerHTML = '';
		this.dropEl.appendChild(this.viewerEl);
		this.viewer = new Viewer(this.viewerEl, this.options);

		this.viewerEl.addEventListener('mousewheel', (ev) => {
			console.log(ev)
			ev.preventDefault(); 
			ev.stopImmediatePropagation()
		})

		return this.viewer;
	}

	/**
	 * Loads a fileset provided by user action.
	 * @param  {File} file
	 */
	load(file) {
		let rootFile;

		if (file.name.match(/\.stl$/)) {
			rootFile = file;
		} else {
			this.onError('Пожалуйста, используйте формат .stl');
		}

		this.view(rootFile, file);
	}

	/**
	 * Passes a model to the viewer, given file and resources.
	 * @param  {File|string} rootFile
	 * @param  {string} rootPath
	 * @param  {file} file
	 */
	view(rootFile, file) {
		if (this.viewer) this.viewer.clear();

		const viewer = this.viewer || this.createViewer();

		const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);
		const rootPath =  "localhost:3000"

		viewer
			.load(fileURL, rootPath, file)
			.catch((e) => this.onError(e))
			.then((stl) => {
				this.hideSpinner();
				if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
			});
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
		} else if (error && error.target && error.target instanceof Image) {
			message = 'Missing texture: ' + error.target.src.split('/').pop();
		}
		window.alert(message);
		console.error(error);
	}

	showSpinner() {
		this.spinnerEl.style.display = '';
	}

	hideSpinner() {
		this.spinnerEl.style.display = 'none';
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new App(document.body, location);
	window.VIEWER.app = app;
	console.info(app);
});
