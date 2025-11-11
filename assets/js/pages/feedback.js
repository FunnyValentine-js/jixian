window.PageFeedback = {
	async render(){
		return `
		<div class="my-4">
			<div class="row justify-content-center">
				<div class="col-lg-8">
					<div class="card">
						<div class="card-body p-4">
							<h1 class="h5 mb-3">提交反馈</h1>
							<p class="text-secondary small mb-3">你的意见对我们非常重要。反馈每天仅计分一次，每小时限一次提交。</p>
							<form id="fbForm" class="needs-validation" novalidate>
								<div class="mb-3">
									<label for="fbText" class="form-label">反馈内容（最多 250 字）</label>
									<textarea class="form-control" id="fbText" rows="6" maxlength="250" required placeholder="请描述你的问题或建议..."></textarea>
									<div class="d-flex justify-content-between mt-1">
										<div class="invalid-feedback">请输入反馈内容</div>
										<small class="text-secondary"><span id="fbCount">0</span>/250</small>
									</div>
								</div>
								<div class="d-flex gap-2">
									<button class="btn btn-primary" type="submit" id="fbSubmit">提交</button>
									<button class="btn btn-outline-secondary" type="button" id="fbClear">清空</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	},
	mount(root){
		const ta = root.querySelector('#fbText');
		const cnt = root.querySelector('#fbCount');
		const form = root.querySelector('#fbForm');
		const btn = root.querySelector('#fbSubmit');
		const clearBtn = root.querySelector('#fbClear');
		const updateCount = ()=> cnt.textContent = ta.value.length;
		ta.addEventListener('input', updateCount);
		updateCount();

		clearBtn.addEventListener('click', ()=>{
			ta.value=''; updateCount();
		});

		form.addEventListener('submit', async (e)=>{
			e.preventDefault();
			form.classList.add('was-validated');
			if (!form.checkValidity()) return;
			const text = ta.value.trim();
			if (!text) return;
			// 反馈需登录：尝试刷新登录态
			await App.refreshUser?.();
			if (!App.state.user){
				App.showToast('请先登录后再提交反馈','warning');
				sessionStorage.setItem('redirect_after_login', '#/feedback');
				location.hash = '#/login';
				return;
			}
			btn.disabled = true;
			App.showToast('正在提交反馈...','warning');
			const r = await API.safe(API.feedback.submit, text);
			if (r.ok){
				App.showToast('感谢你的反馈！已提交','success');
				ta.value=''; updateCount();
				// 刷新积分（若登录）
				await App.refreshUser?.();
			}else{
				// 针对 401 的特殊提示
				if ((r.msg||'').includes('401') || (r.msg||'').toLowerCase().includes('unauthorized')){
					App.showToast('未登录或会话已过期，请重新登录','danger');
					sessionStorage.setItem('redirect_after_login', '#/feedback');
					location.hash = '#/login';
				}else{
					App.showToast(r.msg || '提交失败','danger');
				}
			}
			btn.disabled = false;
		});
	}
};


