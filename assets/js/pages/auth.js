window.PageAuth = {
	login: {
		async render(){
			return `
			<div class="row justify-content-center my-5">
				<div class="col-sm-10 col-md-8 col-lg-5">
					<div class="card shadow-sm">
						<div class="card-body p-4">
							<div class="text-center mb-3">
								<img src="./assets/img/logo.svg" alt="Logo" width="40" height="40" class="mb-2">
								<h1 class="h5 mb-0">登录</h1>
							</div>
							<form class="needs-validation" novalidate id="formLogin">
								<div class="form-floating mb-3">
									<input type="text" class="form-control" id="loginAccount" placeholder="手机号或邮箱" required>
									<label for="loginAccount">手机号或邮箱</label>
									<div class="invalid-feedback">请输入正确的账号</div>
								</div>
								<div class="form-floating mb-3">
									<input type="password" class="form-control" id="loginPassword" placeholder="密码" required minlength="6">
									<label for="loginPassword">密码</label>
									<div class="invalid-feedback">至少6位密码</div>
								</div>
								<div class="d-flex justify-content-between align-items-center mb-3">
									<div class="form-check">
										<input class="form-check-input" type="checkbox" value="" id="rememberMe">
										<label class="form-check-label" for="rememberMe">记住我</label>
									</div>
									<a class="small" href="#">忘记密码？</a>
								</div>
								<button class="btn btn-primary w-100" type="submit">登录</button>
							</form>
							<div class="text-center text-secondary small my-3">或</div>
							<div class="d-grid gap-2">
								<button class="btn btn-outline-secondary" type="button" aria-label="使用第三方登录">使用第三方登录</button>
							</div>
							<div class="text-center mt-3 small">
								还没有账号？<a href="#/register">前往注册</a>
							</div>
						</div>
					</div>
				</div>
			</div>`;
		},
		mount(root){
			const form = root.querySelector('#formLogin');
			form.addEventListener('submit', (e)=>{
				e.preventDefault();
				form.classList.add('was-validated');
				if (!form.checkValidity()) return;
				(async ()=>{
					const account = root.querySelector('#loginAccount').value.trim();
					const pwd = root.querySelector('#loginPassword').value.trim();
					const { ok, res, msg } = await API.safe(API.auth.login, { phone: account, password: pwd, code: null });
					if (!ok){
						App.showToast(msg || '登录失败','danger');
						return;
					}
					// 登录成功后再拉取用户信息
					const me = await API.safe(API.auth.me);
					let name = account.includes('@') ? account.split('@')[0] : `用户${account.slice(-4)}`;
					let user = { name, account };
					if (me.ok && me.res?.data){
						const d = me.res.data;
						user = { name: d.nickname || name, account: d.phone || account, points: d.points||0, role: d.role };
					}
					App.saveUser(user);
					App.showToast('登录成功');
					location.hash = '#/home';
				})();
			});
		}
	},
	register: {
		async render(){
			return `
			<div class="row justify-content-center my-5">
				<div class="col-sm-11 col-md-9 col-lg-7">
					<div class="card shadow-sm">
						<div class="card-body p-4">
							<h1 class="h5 mb-3 text-center">注册</h1>
							<form class="needs-validation" novalidate id="formRegister">
								<div class="row g-3">
									<div class="col-md-6">
										<div class="form-floating">
											<input type="text" class="form-control" id="rName" placeholder="姓名" required>
											<label for="rName">姓名</label>
											<div class="invalid-feedback">请输入姓名</div>
										</div>
									</div>
									<div class="col-md-6">
										<div class="input-group">
											<select class="form-select flex-shrink-0" id="rCc" aria-label="国家代码" style="max-width: 90px">
												<option selected value="+86">+86</option>
												<option value="+852">+852</option>
												<option value="+853">+853</option>
												<option value="+886">+886</option>
											</select>
											<input type="tel" class="form-control flex-fill" id="rPhone" placeholder="手机号" required pattern="\\d{6,}">
											<div class="invalid-feedback">请输入正确的手机号</div>
										</div>
									</div>
									<div class="col-md-6">
										<div class="form-floating">
											<input type="password" class="form-control" id="rPwd" placeholder="密码" required minlength="6">
											<label for="rPwd">密码</label>
											<div class="invalid-feedback">至少6位密码</div>
										</div>
									</div>
								</div>
								<div class="mt-4 d-grid">
									<button class="btn btn-accent btn-lg" type="submit">创建账号</button>
								</div>
							</form>
							<div class="text-center mt-3 small">
								已有账号？<a href="#/login">前往登录</a>
							</div>
						</div>
					</div>
				</div>
			</div>`;
		},
		mount(root){
			const form = root.querySelector('#formRegister');
			form.addEventListener('submit', (e)=>{
				e.preventDefault();
				form.classList.add('was-validated');
				if (!form.checkValidity()) return;
				(async ()=>{
					const name = root.querySelector('#rName').value.trim();
					const phone = root.querySelector('#rPhone').value.trim();
					const pwd = root.querySelector('#rPwd').value.trim();
					const { ok, res, msg } = await API.safe(API.auth.register, { nickname: name, phone, password: pwd });
					if (!ok){
						App.showToast(msg || '注册失败','danger');
						return;
					}
					// 注册后尝试自动登录
					await API.safe(API.auth.login, { phone, password: pwd, code: null });
					const me = await API.safe(API.auth.me);
					const user = me.ok && me.res?.data ? {
						name: me.res.data.nickname || name,
						account: me.res.data.phone || phone,
						points: me.res.data.points||0,
						role: me.res.data.role
					} : { name, account: phone };
					App.saveUser(user);
					App.showToast('注册成功，已登录');
					location.hash = '#/home';
				})();
			});
		}
	}
};


