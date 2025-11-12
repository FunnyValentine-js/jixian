// 简单哈希路由
(function(){
	// 动态获取页面对象，避免脚本加载顺序导致的未定义引用
	function getPage(path){
		switch(path){
			case '/home': return window.PageHome;
			case '/login': return window.PageAuth && window.PageAuth.login;
			case '/register': return window.PageAuth && window.PageAuth.register;
			case '/chat': return window.PageChat;
			case '/user': return window.PageUser;
			case '/points': return window.PagePoints;
			case '/feedback': return window.PageFeedback;
			case '/admin': return window.PageAdmin;
			default: return window.PageNotFound;
		}
	}

	function isAuthed(){
		return !!(App.state.user && (App.state.user.account || App.state.user.name));
	}

	async function guard(path){
		// 需要登录的页面
		const loginRequired = ['/user','/points','/feedback','/admin'];
		if (loginRequired.includes(path)){
			if (!isAuthed()){
				await App.refreshUser?.();
			}
			if (!isAuthed()){
				sessionStorage.setItem('redirect_after_login', `#${path}`);
				location.replace('#/login');
				return false;
			}
		}
		// 管理员权限：/user/me 获取的 role 必须为 0
		if (path === '/admin'){
			await App.refreshUser?.();
			const role = App.state.user?.role;
			const isRoot = role === 0 || role === '0';
			if (!isRoot){
				App.showToast('无权限访问管理员页面','danger');
				location.replace('#/home');
				return false;
			}
		}
		return true;
	}

	function setActiveNav(path){
		document.querySelectorAll('.navbar .nav-link').forEach(a=>{
			const href = a.getAttribute('href') || '';
			if (href === `#${path}`) a.classList.add('active');
			else a.classList.remove('active');
		});
	}

	async function render(){
		const app = document.getElementById('app');
		if (!app) return;
		// 首次无哈希时跳转至首页
		if (!location.hash){
			location.replace('#/home');
		}
		const hash = location.hash || '#/home';
		const path = hash.replace('#','');
		// 支持 "#/points?page=2" 这类带查询的哈希
		const pathOnly = path.split('?')[0];
		// 路由守卫
		if (!(await guard(pathOnly))) return;
		setActiveNav(pathOnly);
		const page = getPage(pathOnly);
		app.innerHTML = App.showLoading();
		try{
			const html = await page.render();
			app.innerHTML = html;
			page.mount?.(app);
			App.initLazyImages();
			// 将焦点移至主区域，辅助无障碍
			app.focus();
			// 登录后回跳
			if (pathOnly === '/login'){
				const key = 'redirect_after_login';
				const target = sessionStorage.getItem(key);
				if (App.state.user && target){
					sessionStorage.removeItem(key);
					location.replace(target);
				}
			}
		}catch(e){
			app.innerHTML = App.showError('页面加载失败');
		}
	}

	window.addEventListener('hashchange', render);
	window.addEventListener('DOMContentLoaded', render);
})();


