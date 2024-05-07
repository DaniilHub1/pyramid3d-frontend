import { Viewer, Loader } from './stl';
import { UI } from './ui.js';

class App {
	constructor(rootEl) {
		this.ui = new UI(rootEl);
		this.viewer = new Viewer(this.ui.viewerEl);
		this.loader = new Loader();

		this.ui.resetEl.addEventListener('click', () => {
			this.viewer.clear();
			this.ui.set('reset');
		});

		this.ui.inputEl.addEventListener('change', () => this.handleUpload());
	}

	handleUpload() {
		this.ui.set('upload');

		this.loader
			.load(this.ui.inputEl.files[0])
			.then((geometry) => {
				this.viewer.view(geometry);

				[...this.ui.statsEl.children].forEach((el) => {
					el.textContent = this.viewer.sizes[el.className].toFixed(1);
				});

				this.ui.set('view');
			})
			.catch((error) => {
				this.ui.set('error', error);
			});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new App(document.body, location);
	console.info(app);
});
