const fs = require('fs');
const path = require('path');

function getFormattedDate() {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	const hours = now.getHours().toString().padStart(2, '0');
	const minutes = now.getMinutes().toString().padStart(2, '0');
	const seconds = now.getSeconds().toString().padStart(2, '0');

	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function getBuildId(options) {
	if (options && typeof options.buildId === 'string' && options.buildId) {
		return options.buildId;
	}
	return getFormattedDate();
}

module.exports = (options = {}, ctx) => {
	const buildId = getBuildId(options);

	return {
		name: 'vuepress-plugin-version-check',
		// VuePress 会分别创建客户端和服务端配置，必须在每次应用时返回新对象，避免 define 值被重复转义。
		define() {
			return {
				__VUEPRESS_VERSION_CHECK_BUILD_ID__: buildId,
			};
		},
		generated() {
			try {
				fs.writeFileSync(
					path.resolve(ctx.outDir, 'version.json'),
					`${JSON.stringify({ id: buildId })}\n`
				);
			} catch (error) {
				console.warn('[vuepress-plugin-version-check] Failed to generate version.json.', error);
			}
		},
		enhanceAppFiles: path.resolve(__dirname, 'enhanceApp.js'),
		globalUIComponents: ['VuepressVersionCheck'],
	};
};
