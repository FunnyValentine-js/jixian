window.PageUser = {
	async render(){
		// 拉取当前登录用户（若后端基于会话）
		let user = App.state.user;
		// 拉取咨询偏好，用于映射到个人信息页的偏好编辑
		let consult = {
			lowerBound: 0,
			upperBound: 0,
			mainUseCase: '',
			preferredFuelType: '',
			preferredBrand: '',
			preferredCarModel: '',
			otherRequirements: ''
		};
		try{
			const { ok, res } = await API.safe(API.auth.me);
			if (ok && res?.data){
				// 使用后端字段映射到现有结构
				const d = res.data;
				user = {
					name: d.nickname || user?.name || '用户',
					account: d.phone || user?.account || '',
					points: d.points || 0,
					role: d.role
				};
				App.saveUser(user);
			}
			const mine = await API.safe(API.consult.getMine);
			if (mine.ok && mine.res?.data){
				const d = mine.res.data;
				consult = {
					lowerBound: d.lowerBound||0,
					upperBound: d.upperBound||0,
					mainUseCase: d.mainUseCase||'',
					preferredFuelType: d.preferredFuelType||'',
					preferredBrand: d.preferredBrand||'',
					preferredCarModel: d.preferredCarModel||'',
					otherRequirements: d.otherRequirements||''
				};
			}
		}catch(e){}
		// 下拉多选选项
		const useCases = ['通勤','家用','商务','长途','旅行'];
		const fuels = ['燃油','电动','混动','增程'];
		const brands = ['大众','丰田','本田','比亚迪','特斯拉','奔驰','宝马','奥迪','日产','吉利'];
		const models = ['SUV','轿车','MPV','跑车','旅行车','皮卡'];
		const selUse = new Set((consult.mainUseCase||'').split(',').filter(Boolean));
		const selFuel = new Set((consult.preferredFuelType||'').split(',').filter(Boolean));
		const selBrand = new Set((consult.preferredBrand||'').split(',').filter(Boolean));
		const selModel = new Set((consult.preferredCarModel||'').split(',').filter(Boolean));
		const toAttr = (set)=> Array.from(set).join(',');
		return `
		<div class="my-4">
			<h1 class="h4 mb-3">个人中心</h1>
			<div class="row g-3">
				<div class="col-lg-3">
					<div class="list-group" id="userNav" role="tablist">
						<button class="list-group-item list-group-item-action active" data-bs-target="#tabProfile" data-bs-toggle="list" role="tab">基本信息</button>
						<button class="list-group-item list-group-item-action" data-bs-target="#tabRecords" data-bs-toggle="list" role="tab">咨询记录</button>
						<button class="list-group-item list-group-item-action" data-bs-target="#tabPoints" data-bs-toggle="list" role="tab">积分明细</button>
						<button class="list-group-item list-group-item-action" data-bs-target="#tabSecurity" data-bs-toggle="list" role="tab">安全设置</button>
					</div>
				</div>
				<div class="col-lg-9">
					<div class="tab-content">
						<div class="tab-pane fade show active" id="tabProfile" role="tabpanel">
							<div class="card">
								<div class="card-body">
									<h2 class="h6 mb-3">基本信息</h2>
									<div class="row g-3 align-items-center">
										<div class="col-md-6">
											<label class="form-label">姓名</label>
											<input type="text" class="form-control" id="pName" value="${user?.name||''}">
										</div>
										<div class="col-md-6">
											<label class="form-label">账号</label>
											<input type="text" class="form-control" value="${user?.account||''}" disabled>
										</div>
										<div class="col-md-12">
											<button class="btn btn-primary" id="saveProfile">保存</button>
										</div>
									</div>
									<hr class="my-4">
									<h2 class="h6 mb-3">购车偏好（将同步至服务器）</h2>
									<div class="row g-3">
										<div class="col-md-6">
											<label class="form-label">预算下限（万元）</label>
											<input type="number" min="0" step="1" class="form-control" id="cLower" value="${Math.round((consult.lowerBound||0)/10000)}" placeholder="例如 10">
										</div>
										<div class="col-md-6">
											<label class="form-label">预算上限（万元）</label>
											<input type="number" min="0" step="1" class="form-control" id="cUpper" value="${consult.upperBound>0?Math.round((consult.upperBound||0)/10000):''}" placeholder="不填表示不限">
										</div>
										<div class="col-md-6">
											<label class="form-label">主要使用场景（可多选）</label>
											<div class="table-card p-2" id="pickerUse" data-init="${toAttr(selUse)}">
												<div class="d-flex flex-wrap gap-2 mb-2" data-selected></div>
												<input type="text" class="form-control form-control-sm" data-input placeholder="输入后回车以添加，或选择推荐项">
												<div class="d-flex flex-wrap gap-2 mt-2" data-suggest>
													${useCases.map(x=>`<span class="chip" data-s="${x}">${x}</span>`).join('')}
												</div>
											</div>
										</div>
										<div class="col-md-6">
											<label class="form-label">燃料类型偏好（可多选）</label>
											<div class="table-card p-2" id="pickerFuel" data-init="${toAttr(selFuel)}">
												<div class="d-flex flex-wrap gap-2 mb-2" data-selected></div>
												<input type="text" class="form-control form-control-sm" data-input placeholder="输入后回车以添加，或选择推荐项">
												<div class="d-flex flex-wrap gap-2 mt-2" data-suggest>
													${fuels.map(x=>`<span class="chip" data-s="${x}">${x}</span>`).join('')}
												</div>
											</div>
										</div>
										<div class="col-md-6">
											<label class="form-label">品牌偏好（可多选）</label>
											<div class="table-card p-2" id="pickerBrand" data-init="${toAttr(selBrand)}">
												<div class="d-flex flex-wrap gap-2 mb-2" data-selected></div>
												<input type="text" class="form-control form-control-sm" data-input placeholder="输入后回车以添加，或选择推荐项">
												<div class="d-flex flex-wrap gap-2 mt-2" data-suggest>
													${brands.map(x=>`<span class="chip" data-s="${x}">${x}</span>`).join('')}
												</div>
											</div>
										</div>
										<div class="col-md-6">
											<label class="form-label">车型偏好（可多选）</label>
											<div class="table-card p-2" id="pickerModel" data-init="${toAttr(selModel)}">
												<div class="d-flex flex-wrap gap-2 mb-2" data-selected></div>
												<input type="text" class="form-control form-control-sm" data-input placeholder="输入后回车以添加，或选择推荐项">
												<div class="d-flex flex-wrap gap-2 mt-2" data-suggest>
													${models.map(x=>`<span class="chip" data-s="${x}">${x}</span>`).join('')}
												</div>
											</div>
										</div>
										<div class="col-md-12">
											<label class="form-label">其他需求</label>
											<textarea id="cOther" class="form-control" rows="3" placeholder="例如：大后备箱、智能驾驶辅助等">${consult.otherRequirements||''}</textarea>
										</div>
										<div class="col-md-12">
											<button class="btn btn-accent" id="saveConsult">保存购车偏好</button>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="tab-pane fade" id="tabRecords" role="tabpanel">
							<div class="card">
								<div class="card-body">
									<h2 class="h6 mb-3">咨询记录</h2>
									<ul class="list-group list-group-flush small" id="historyList" aria-label="历史记录"></ul>
								</div>
							</div>
						</div>
						<div class="tab-pane fade" id="tabPoints" role="tabpanel">
							<div class="card">
								<div class="card-body">
									<h2 class="h6 mb-3">积分进度</h2>
									<div class="d-flex align-items-center gap-3 mb-3">
										<span class="badge text-bg-primary">Lv.${Math.max(1, Math.ceil((user?.points||120)/100))}</span>
										<div class="flex-grow-1">
											<div class="progress" style="height:10px">
												<div class="progress-bar" style="width:${Math.min(100, ((user?.points||120)%100))}%"
													aria-valuenow="${Math.min(100, ((user?.points||120)%100))}" aria-valuemin="0" aria-valuemax="100"></div>
											</div>
										</div>
										<span class="small text-secondary">${user?.points||120} 分</span>
									</div>
									<p class="small text-secondary mb-0">完成咨询、完善资料可获得积分。</p>
								</div>
							</div>
						</div>
						<div class="tab-pane fade" id="tabSecurity" role="tabpanel">
							<div class="card">
								<div class="card-body">
									<h2 class="h6 mb-3">安全设置</h2>
									<div class="row g-3">
										<div class="col-md-6">
											<label class="form-label">修改密码</label>
											<input type="password" class="form-control" placeholder="新密码">
										</div>
										<div class="col-md-6">
											<label class="form-label invisible">占位</label>
											<button class="btn btn-outline-secondary w-100">提交</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	},
	mount(root){
		// Tag Picker 交互（参考 way.txt：推荐 + 手工输入 + 删除）
		function setupTagPicker(boxId, { limit=5 }){
			const box = root.querySelector(boxId);
			if (!box) return;
			const selWrap = box.querySelector('[data-selected]');
			const input = box.querySelector('[data-input]');
			const suggest = box.querySelectorAll('[data-s]');
			const initial = (box.dataset.init||'').split(',').map(x=>x.trim()).filter(Boolean);

			function renderChip(val){
				const span = document.createElement('span');
				span.className = 'chip';
				span.setAttribute('data-tag', val);
				span.innerHTML = `${val} <span aria-label="删除" role="button" class="ms-1">×</span>`;
				span.querySelector('span').addEventListener('click', ()=>{
					span.remove();
				});
				return span;
			}
			function addTag(val){
				val = (val||'').trim();
				if (!val) return;
				if (Array.from(selWrap.querySelectorAll('[data-tag]')).some(x=> x.getAttribute('data-tag')===val)) return;
				if (selWrap.querySelectorAll('[data-tag]').length >= limit){
					App.showToast(`最多可选择 ${limit} 项`,'warning'); return;
				}
				selWrap.appendChild(renderChip(val));
			}
			// 初始已选
			initial.forEach(v=> addTag(v));
			// 推荐点击
			suggest.forEach(s=> s.addEventListener('click', ()=> addTag(s.getAttribute('data-s')) ));
			// 输入回车添加
			input.addEventListener('keydown', (e)=>{
				if (e.key === 'Enter'){
					e.preventDefault();
					addTag(input.value);
					input.value='';
				}
			});
		}

		// 初始化各 Tag Picker
		setupTagPicker('#pickerUse',  { limit: 5 });
		setupTagPicker('#pickerFuel', { limit: 3 });
		setupTagPicker('#pickerBrand',{ limit: 6 });
		setupTagPicker('#pickerModel',{ limit: 4 });

		root.querySelector('#saveProfile')?.addEventListener('click', ()=>{
			const name = root.querySelector('#pName').value.trim();
			const user = { ...(App.state.user||{}), name };
			App.saveUser(user);
			App.showToast('已保存基本信息','success');
		});

		// 保存购车偏好 -> /consultation-content/update
		root.querySelector('#saveConsult')?.addEventListener('click', async ()=>{
			const lower = Math.max(0, Math.floor(+root.querySelector('#cLower').value||0)) * 10000;
			const upperInput = root.querySelector('#cUpper').value;
			const upper = upperInput ? Math.max(0, Math.floor(+upperInput||0)) * 10000 : 0;
			// 多选收集 -> 逗号分隔
			const getMulti = (pickerId)=> Array.from(root.querySelectorAll(`${pickerId} [data-selected] [data-tag]`)).map(x=>x.getAttribute('data-tag')).filter(Boolean).join(',');
			const payload = {
				lowerBound: lower,
				upperBound: upper,
				mainUseCase: getMulti('#pickerUse') || '任意',
				preferredFuelType: getMulti('#pickerFuel') || '任意',
				preferredBrand: getMulti('#pickerBrand'),
				preferredCarModel: getMulti('#pickerModel'),
				otherRequirements: (root.querySelector('#cOther').value||'').trim()
			};
			App.showToast('正在保存购车偏好...','warning');
			const r = await API.safe(API.consult.update, payload);
			if (r.ok){
				App.showToast('已保存购车偏好','success');
			}else{
				App.showToast(r.msg || '保存失败','danger');
			}
		});

		// 咨询记录 - 使用和智能对话相同的 API 和样式
		(async ()=>{
			const historyList = root.querySelector('#historyList');
			if (!historyList) return;
			const { ok, res } = await API.safe(API.robot.historyMe, { limit: 10, page: 1 });
			if (ok && Array.isArray(res?.data)){
				historyList.innerHTML = res.data.map(h=>`
					<li class="list-group-item">
						<div class="d-flex justify-content-between">
							<span class="${h.formUser?'':'text-primary'}">${(h.text||'').slice(0,24)}</span>
							<small class="text-secondary">${h.createTime||''}</small>
						</div>
					</li>
				`).join('');
			}else{
				historyList.innerHTML = `<li class="list-group-item text-secondary">暂无历史</li>`;
			}
		})();
	}
};


