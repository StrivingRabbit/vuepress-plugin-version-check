<template>
	<transition name="version-update-fade">
		<aside v-if="hasUpdate" class="version-update" aria-live="polite">
			<button
				class="version-update__close"
				type="button"
				aria-label="暂不刷新"
				title="暂不刷新"
				@click="dismiss"
			>
				&times;
			</button>
			<div class="version-update__icon" aria-hidden="true">!</div>
			<div class="version-update__content">
				<strong>文档已有更新</strong>
				<p>刷新页面后即可查看最新内容。</p>
				<button class="version-update__refresh" type="button" @click="refresh">
					立即刷新
				</button>
			</div>
		</aside>
	</transition>
</template>

<script>
const CHECK_INTERVAL = 2 * 60 * 1000
const VERSION_FILE = 'version.json'

function getCurrentVersion() {
	if (typeof __VUEPRESS_VERSION_CHECK_BUILD_ID__ === 'string') {
		return __VUEPRESS_VERSION_CHECK_BUILD_ID__
	}
	return ''
}

function getVersionUrl(base) {
	const normalizedBase = typeof base === 'string' && base ? base : '/'
	return `${normalizedBase.replace(/\/?$/, '/')}${VERSION_FILE}`
}

export default {
	name: 'VuepressVersionCheck',
	data() {
		return {
			currentVersion: getCurrentVersion(),
			dismissedVersion: '',
			hasUpdate: false,
			remoteVersion: '',
		}
	},
	computed: {
		versionUrl() {
			return getVersionUrl(this.$site && this.$site.base)
		},
	},
	mounted() {
		const isDevelopment = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
		if (isDevelopment || !this.currentVersion || typeof window.fetch !== 'function') return

		this._versionCheckerActive = true
		this.checkVersion()
		document.addEventListener('visibilitychange', this.handleVisibilityChange)
		this._versionCheckTimer = window.setInterval(this.checkVersion, CHECK_INTERVAL)
	},
	beforeDestroy() {
		this._versionCheckerActive = false
		document.removeEventListener('visibilitychange', this.handleVisibilityChange)
		window.clearInterval(this._versionCheckTimer)
	},
	methods: {
		checkVersion() {
			if (document.hidden || this._isCheckingVersion || this.hasUpdate || !this.currentVersion) return

			this._isCheckingVersion = true
			let request
			try {
				request = window.fetch(`${this.versionUrl}?t=${Date.now()}`, {
					cache: 'no-store',
					credentials: 'same-origin',
				})
			} catch (error) {
				this.finishVersionCheck()
				return
			}

			if (!request || typeof request.then !== 'function') {
				this.finishVersionCheck()
				return
			}

			request
				.then(response => {
					if (!response.ok) throw new Error(`Failed to fetch ${VERSION_FILE}`)
					return response.json()
				})
				.then(
					version => {
						if (
							this._versionCheckerActive &&
							version &&
							typeof version.id === 'string' &&
							version.id !== this.currentVersion &&
							version.id !== this.dismissedVersion
						) {
							this.remoteVersion = version.id
							this.hasUpdate = true
						}
						this.finishVersionCheck()
					},
					() => this.finishVersionCheck()
				)
		},
		finishVersionCheck() {
			this._isCheckingVersion = false
		},
		handleVisibilityChange() {
			if (!document.hidden) this.checkVersion()
		},
		dismiss() {
			this.dismissedVersion = this.remoteVersion
			this.hasUpdate = false
		},
		refresh() {
			window.location.reload()
		},
	},
}
</script>

<style lang="stylus" scoped>
.version-update
	position fixed
	right 24px
	bottom 24px
	z-index 98
	display flex
	width 320px
	max-width calc(100vw - 32px)
	padding 16px 38px 16px 16px
	border 1px solid #cfe6d9
	border-radius 6px
	background #fff
	box-shadow 0 10px 26px rgba(30, 50, 38, .16)
	box-sizing border-box

.version-update__icon
	flex 0 0 auto
	width 22px
	height 22px
	margin 1px 10px 0 0
	border-radius 50%
	background #42b983
	color #fff
	font-size 14px
	font-weight 600
	line-height 22px
	text-align center

.version-update__content
	min-width 0
	color #26332c

	strong
		display block
		font-size 14px
		line-height 1.4

	p
		margin 4px 0 10px
		color #5f6d65
		font-size 13px
		line-height 1.5

.version-update__refresh
	padding 5px 10px
	border 1px solid #42b983
	border-radius 4px
	background #42b983
	color #fff
	font-size 13px
	line-height 1.2
	cursor pointer
	transition background-color .15s ease, border-color .15s ease

	&:hover
		border-color #359c74
		background #359c74

	&:focus-visible
		outline 2px solid #42b983
		outline-offset 2px

.version-update__close
	position absolute
	top 7px
	right 8px
	width 24px
	height 24px
	padding 0
	border 0
	border-radius 4px
	background transparent
	color #78847d
	font-size 20px
	line-height 22px
	cursor pointer

	&:hover
		background #f0f5f2
		color #324339

	&:focus-visible
		outline 2px solid #42b983
		outline-offset 1px

.version-update-fade-enter-active,
.version-update-fade-leave-active
	transition opacity .2s ease, transform .2s ease

.version-update-fade-enter,
.version-update-fade-leave-to
	opacity 0
	transform translateY(8px)

@media (max-width 719px)
	.version-update
		right 16px
		bottom 16px
		width 300px
</style>
