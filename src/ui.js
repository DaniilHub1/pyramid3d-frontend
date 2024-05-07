export class UI {
	constructor(rootEl) {
		this.rootEl = rootEl;

		this.viewerEl = rootEl.querySelector('.viewer');
		this.resetEl = rootEl.querySelector('.reset');
		this.inputEl = rootEl.querySelector('#file-input');

		this.spinnerEl = rootEl.querySelector('.spinner');
		this.uploadEl = rootEl.querySelector('.upload');

		this.statsEl = {
			wrapper: rootEl.querySelector('.stats'),
			children: rootEl.querySelectorAll('.stats__item > span'),
		};
	}

	#show(...nodes) {
		nodes.forEach((node) => {
			node.classList.remove('hidden');
		});
	}

	#hide(...nodes) {
		nodes.forEach((node) => {
			node.classList.add('hidden');
		});
	}

	set(action, message) {
		if (action === 'view') {
			this.#hide(this.spinnerEl);
			this.#show(this.viewerEl, this.resetEl, this.statsEl.wrapper);
		} else if (action === 'reset') {
			this.#hide(this.statsEl.wrapper, this.resetEl);
			this.#show(this.uploadEl);
		} else if (action === 'upload') {
			this.#hide(this.uploadEl);
			this.#show(this.spinnerEl);
		} else if (action === 'error') {
			window.alert(message); // TODO: move to popup
		}
	}
}
