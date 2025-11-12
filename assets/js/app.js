// 全局应用状态与工具
window.App = {
	state: {
		user: null,
	},
	_refreshing: false,

	loadState() {
		try {
			const savedUser = localStorage.getItem('app_user');
			if (savedUser) this.state.user = JSON.parse(savedUser);
		} catch (e) {
		}
	},

	saveUser(user) {
		this.state.user = user;
		if (user) localStorage.setItem('app_user', JSON.stringify(user));
		else localStorage.removeItem('app_user');
		this.updateAuthUI();
	},

	updateAuthUI() {
		const authArea = document.getElementById('authArea');
		const userMenuArea = document.getElementById('userMenuArea');
		const displayName = document.getElementById('navDisplayName');
		if (!authArea || !userMenuArea) return;
		if (this.state.user) {
			authArea.classList.add('d-none');
			userMenuArea.classList.remove('d-none');
			if (displayName) displayName.textContent = this.state.user.name || '用户';
		} else {
			userMenuArea.classList.add('d-none');
			authArea.classList.remove('d-none');
		}
	},

	isAdmin() {
		let role = this.state.user?.role;
		if (role === undefined || role === null) return false;
		if (typeof role === 'string') {
			const normalized = role.trim().toUpperCase();
			if (['ROOT', 'ADMIN', 'SUPER', 'SUPER_ADMIN'].includes(
					normalized)) return true;
			if (['0', '9', '10'].includes(normalized)) return true;
			return false;
		}
		if (typeof role === 'number') {
			return role === 0 || role === 9 || role === 10;
		}
		return false;
	},

	async refreshUser(force = false) {
		if (!window.API || this._refreshing) return this.state.user;
		try {
			this._refreshing = true;
			const result = await API.safe(API.auth.me);
			if (result.ok && result.res?.data) {
				const d = result.res.data;
				const merged = {
					name: d.nickname || this.state.user?.name || '用户',
					account: d.phone || this.state.user?.account || '',
					points: d.points ?? this.state.user?.points ?? 0,
					role: d.role ?? this.state.user?.role,
				};
				this.saveUser(merged);
				return merged;
			}
		} catch (e) {
			// ignore
		} finally {
			this._refreshing = false;
		}
		return this.state.user;
	},

	showToast(message, variant = 'success') {
		const container = document.getElementById('toastContainer');
		if (!container) return;
		const id = `toast-${Date.now()}`;
		const headerColor = variant === 'danger' ?
				'bg-danger' :
				variant === 'warning' ? 'bg-warning' : 'bg-success';
		const toastEl = document.createElement('div');
		toastEl.className = 'toast align-items-center text-bg-light border-0 show';
		toastEl.setAttribute('role', 'status');
		toastEl.setAttribute('aria-live', 'polite');
		toastEl.setAttribute('aria-atomic', 'true');
		toastEl.id = id;
		toastEl.innerHTML = `
			<div class="d-flex">
				<div class="toast-body">
					<span class="badge ${headerColor} me-2">&nbsp;</span>${message}
				</div>
				<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="关闭"></button>
			</div>
		`;
		container.appendChild(toastEl);
		setTimeout(() => toastEl.remove(), 3500);
	},

	showLoading() {
		return `
		<div class="text-center my-5" role="status" aria-live="polite">
			<div class="spinner-border text-primary" role="status" aria-label="加载中"></div>
			<div class="mt-2 text-secondary">加载中...</div>
		</div>`;
	},

	showEmpty(text = '暂无数据') {
		return `
		<div class="text-center my-5">
			<img src="./assets/img/empty.svg" alt="" width="80" height="80" class="mb-2 opacity-75">
			<div class="text-secondary">${text}</div>
		</div>`;
	},

	showError(text = '加载失败，请稍后重试') {
		return `
		<div class="alert alert-danger d-flex align-items-center" role="alert">
			<span class="me-2" aria-hidden="true">⚠️</span>
			<div>${text}</div>
		</div>`;
	},

	confirm(message, onConfirm) {
		const modal = document.createElement('div');
		modal.className = 'modal fade';
		modal.tabIndex = -1;
		modal.innerHTML = `
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">确认操作</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
				</div>
				<div class="modal-body"><p>${message}</p></div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
					<button type="button" class="btn btn-primary" id="confirmOk">确认</button>
				</div>
			</div>
		</div>`;
		document.body.appendChild(modal);
		const bsModal = new bootstrap.Modal(modal);
		modal.addEventListener('hidden.bs.modal', () => modal.remove());
		modal.querySelector('#confirmOk').addEventListener('click', () => {
			onConfirm?.();
			bsModal.hide();
		});
		bsModal.show();
	},

	initLazyImages() {
		const imgs = document.querySelectorAll('img[data-src]');
		const io = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const img = entry.target;
					img.src = img.getAttribute('data-src');
					img.onload = () => img.classList.remove('lazy');
					io.unobserve(img);
				}
			});
		}, {rootMargin: '200px'});
		imgs.forEach(img => io.observe(img));
	},
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
	const y = document.getElementById('yearNow');
	if (y) y.textContent = new Date().getFullYear();
	App.loadState();
	App.updateAuthUI();
	document.getElementById('btnLogout')?.addEventListener('click', () => {
		App.confirm('确认退出登录？', () => {
			App.saveUser(null);
			API.safe(API.auth.logout).then(res => console.log(res.msg));
			API.clearToken();
			API.setToken(undefined);
			location.hash = '#/home';
			App.showToast('已退出登录', 'success');
		});
	});
});


