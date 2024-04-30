import WebGL from 'three/addons/capabilities/WebGL.js';
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

		this.viewerEl = el.querySelector('.viewer');
		this.reloadEl = el.querySelector('.reload');
		this.statsEl = el.querySelector('.stats');
		this.spinnerEl = el.querySelector('.spinner');
		this.dropEl = el.querySelector('.dropzone');
		this.inputEl = el.querySelector('#file-input');

		this.state = 'drop';

		this.inputEl.addEventListener('change', () => this.load(this.inputEl.files[0]));
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

		if (!this.viewer) {
			this.viewer = new Viewer(this.viewerEl);
		}

		this.reloadEl.addEventListener('click', () => {
			this.state = 'drop';
			this.viewer.clear();
		});

		this.dropEl.classList.add('hidden');
		this.showSpinner();

		const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);
		const rootPath = 'localhost:3000';

		this.viewer
			.load(fileURL, rootPath, file)
			.catch((e) => this.onError(e))
			.then(() => {
				this.hideSpinner();
				this.viewerEl.classList.remove('hidden');
				this.reloadEl.classList.remove('hidden');
				this.statsEl.classList.remove('hidden');
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
		}
		window.alert(message); // TODO: move to popup
		console.error(error);
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
