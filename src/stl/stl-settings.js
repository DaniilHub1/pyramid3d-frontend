export const settings = {
	material: {
		color: 0xeeeeee,
		metalness: 0.1,
		roughness: 0.6,
		clearcoat: 0.6,
		clearcoatRoughness: 0.4,
	},
	camera: {
		fov: 50,
		near: 0.1,
		far: 1000,
	},
	directLight: {
		color: '#FFFFFF',
		intensity: 0.8 * Math.PI,
		position: [0.5, 0, 0.866], // ~60º
	},
	background: '#191919',
};
