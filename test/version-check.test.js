const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const versionCheck = require('../lib');

function createTempDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'vuepress-version-check-'));
}

const tests = [
	{
		name: 'uses the supplied build ID for the client and version file',
		run() {
			const outDir = createTempDir();
			try {
				const plugin = versionCheck({ buildId: 'theme-build-id' }, { outDir });
				const firstDefine = plugin.define();
				const secondDefine = plugin.define();

				assert.notStrictEqual(firstDefine, secondDefine);
				assert.strictEqual(firstDefine.__VUEPRESS_VERSION_CHECK_BUILD_ID__, 'theme-build-id');
				assert.strictEqual(secondDefine.__VUEPRESS_VERSION_CHECK_BUILD_ID__, 'theme-build-id');
				assert.strictEqual(plugin.globalUIComponents, undefined);
				assert.ok(fs.existsSync(plugin.enhanceAppFiles));
				assert.ok(fs.readFileSync(plugin.enhanceAppFiles, 'utf8').includes("Vue.component('VuepressVersionCheck'"));

				plugin.generated();
				assert.deepStrictEqual(
					JSON.parse(fs.readFileSync(path.join(outDir, 'version.json'), 'utf8')),
					{ id: 'theme-build-id' }
				);
			} finally {
				fs.rmSync(outDir, { recursive: true, force: true });
			}
		},
	},
	{
		name: 'does not throw when version.json cannot be written',
		run() {
			const outDir = createTempDir();
			const invalidOutDir = path.join(outDir, 'output-file');
			fs.writeFileSync(invalidOutDir, 'file');
			const originalWarn = console.warn;
			let warningCount = 0;
			console.warn = () => {
				warningCount += 1;
			};

			try {
				const plugin = versionCheck({ buildId: 'build-id' }, { outDir: invalidOutDir });
				assert.doesNotThrow(() => plugin.generated());
				assert.strictEqual(warningCount, 1);
			} finally {
				console.warn = originalWarn;
				fs.rmSync(outDir, { recursive: true, force: true });
			}
		},
	},
	{
		name: 'generates a build ID when none is supplied',
		run() {
			const outDir = createTempDir();
			try {
				const plugin = versionCheck({}, { outDir });
				const buildId = plugin.define().__VUEPRESS_VERSION_CHECK_BUILD_ID__;

				assert.match(buildId, /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
				plugin.generated();
				assert.strictEqual(
					JSON.parse(fs.readFileSync(path.join(outDir, 'version.json'), 'utf8')).id,
					buildId
				);
			} finally {
				fs.rmSync(outDir, { recursive: true, force: true });
			}
		},
	},
];

let failed = 0;
tests.forEach(test => {
	try {
		test.run();
		console.log(`ok - ${test.name}`);
	} catch (error) {
		failed += 1;
		console.error(`not ok - ${test.name}`);
		console.error(error.stack);
	}
});

if (failed) {
	process.exitCode = 1;
} else {
	console.log(`${tests.length} tests passed`);
}
