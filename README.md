# vuepress-plugin-version-check

Generate `version.json` during a VuePress build and prompt users to refresh when a newer build is available.

```js
module.exports = {
  plugins: [
    ['version-check', { buildId: '2026-07-27_12-00-00' }],
  ],
}
```

The plugin checks `/version.json` every two minutes while the page is visible and immediately when the page returns to the foreground.
