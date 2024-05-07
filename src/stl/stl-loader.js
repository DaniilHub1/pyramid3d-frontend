import { STLLoader } from 'three/addons/loaders/STLLoader.js';

export class Loader {
	#errorMessages = {
		progressError: 'Ошибка при загрузке файла. Попробуйте снова',
		unexpectedToken: 'Ошибка распознавания содержимого. Убедитесь, что файл не поврежден',
		formatError: 'Пожалуйста, используйте формат .stl',
		baseError: 'Непредвиденная ошибка',
	};

	constructor() {
		this.stlLoader = new STLLoader().setCrossOrigin('anonymous');
	}

	load(file) {
		return new Promise((resolve, reject) => {
			const fileURL = typeof file === 'string' ? file : URL.createObjectURL(file);
			const rootPath = 'localhost:3000';

			if (!file.name.match(/\.stl$/)) {
				reject(new Error(this.#errorMessages.formatError));
			}

			this.stlLoader.load(
				fileURL,
				(geometry) => {
					URL.revokeObjectURL(fileURL);
					resolve(geometry);
				},
				(xhr) => {
					console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
				},
				(error) => {
					const message = error.message || error.toString();

					if (message.match(/ProgressEvent/)) {
						reject(new Error(this.#errorMessages.progressError));
					} else if (message.match(/Unexpected token/)) {
						reject(new Error(this.#errorMessages.unexpectedToken));
					}

					reject(new Error(this.#errorMessages.baseError));
				},
			);
		});
	}
}
