window.PageAdmin = {
	async render() {
		// 页面分区：仪表盘 / 用户 / 咨询 / 反馈 / 礼品 / 日志 / 设置
		return `
		<div class="my-4">
			<div class="mb-3">
				<h1 class="h4 mb-0">管理控制台</h1>
			</div>

			<ul class="nav nav-pills mb-3" id="adminTabs" role="tablist">
				<li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabDash" type="button" role="tab">仪表盘</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabUsers" type="button" role="tab">用户</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabConsult" type="button" role="tab">咨询</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabFeedback" type="button" role="tab">反馈</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabGifts" type="button" role="tab">礼品</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabLogs" type="button" role="tab">日志</button></li>
				<li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSettings" type="button" role="tab">设置</button></li>
			</ul>

			<div class="tab-content">
				<!-- 仪表盘 -->
				<div class="tab-pane fade show active" id="tabDash" role="tabpanel">
					<div class="row g-3">
						${[
			{t: '用户数', k: 'users', v: '—'},
			{t: '今日反馈', k: 'feedback', v: '—'},
			{
				t: '未读反馈', k: 'unread', v: '—',
			},
			{t: '平均响应(ms)', k: 'latency', v: '—'},
		].map(x => `
						<div class="col-6 col-lg-3">
							<div class="card h-100">
								<div class="card-body">
									<div class="text-secondary small">${x.t}</div>
									<div class="h4 mb-0" data-kpi="${x.k}">${x.v}</div>
								</div>
							</div>
						</div>`).join('')}
					</div>
					<div class="card mt-3">
						<div class="card-body">
							<h2 class="h6 mb-3">热点词（Top 10）</h2>
							<ul class="small mb-0" id="hotWords"></ul>
						</div>
					</div>
				</div>

				<!-- 用户管理 -->
				<div class="tab-pane fade" id="tabUsers" role="tabpanel">
					<div class="card">
						<div class="card-body">
							<div class="row g-2 align-items-end mb-2">
								<div class="col-md-4"><input type="text" class="form-control" id="userKeyword" placeholder="搜索昵称/手机号"></div>
								<div class="col-md-2">
									<select class="form-select" id="userRole">
										<option value="">全部角色</option>
										<option value="ROOT">ROOT</option>
										<option value="NORMAL">NORMAL</option>
										<option value="BLOCKED">BLOCKED</option>
									</select>
								</div>
								<div class="col-md-2"><button class="btn btn-outline-secondary w-100" id="btnUserSearch">搜索</button></div>
							</div>
							<div class="table-responsive">
								<table class="table table-hover align-middle stackable">
									<thead><tr><th>ID</th><th>昵称</th><th>手机号</th><th>积分</th><th>角色</th><th>操作</th></tr></thead>
									<tbody id="userTableBody"></tbody>
								</table>
							</div>
							<nav class="mt-2" aria-label="用户分页">
								<ul class="pagination pagination-sm mb-0" id="userPager"></ul>
							</nav>
						</div>
					</div>
				</div>

				<!-- 咨询管理（联合信息） -->
				<div class="tab-pane fade" id="tabConsult" role="tabpanel">
					<div class="card">
						<div class="card-body">
							<div class="table-responsive">
								<table class="table table-striped align-middle stackable">
									<thead><tr><th>用户ID</th><th>昵称</th><th>预算(万)</th><th>场景</th><th>车型</th><th>燃料</th></tr></thead>
									<tbody id="consultTableBody"></tbody>
								</table>
							</div>
							<nav class="mt-2" aria-label="咨询分页">
								<ul class="pagination pagination-sm mb-0" id="consultPager"></ul>
							</nav>
						</div>
					</div>
				</div>

				<!-- 反馈管理 -->
				<div class="tab-pane fade" id="tabFeedback" role="tabpanel">
					<div class="row g-3">
						<div class="col-lg-6">
							<div class="card h-100">
								<div class="card-body">
									<h2 class="h6 mb-2">未读反馈</h2>
									<ul class="list-group small" id="fbNotRead"></ul>
								</div>
							</div>
						</div>
						<div class="col-lg-6">
							<div class="card h-100">
								<div class="card-body">
									<h2 class="h6 mb-2">已读反馈</h2>
									<ul class="list-group small" id="fbRead"></ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 礼品管理 -->
				<div class="tab-pane fade" id="tabGifts" role="tabpanel">
					<div class="card">
						<div class="card-body">
							<div class="row g-2 mb-2">
								<div class="col-md-2"><input class="form-control" id="giftTitle" placeholder="标题"></div>
								<div class="col-md-2"><input class="form-control" id="giftCost" placeholder="积分"></div>
								<div class="col-md-2"><input class="form-control" id="giftStorage" placeholder="库存"></div>
								<div class="col-md-3"><input class="form-control" id="giftPic1" placeholder="图片URL1"></div>
								<div class="col-md-3 d-grid"><button class="btn btn-primary" id="btnGiftAdd">新增礼品</button></div>
							</div>
							<div class="table-responsive">
								<table class="table table-hover align-middle stackable">
									<thead><tr><th>ID</th><th>标题</th><th>积分</th><th>库存</th><th>操作</th></tr></thead>
									<tbody id="giftTableBody"></tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				<!-- 行为日志 -->
				<div class="tab-pane fade" id="tabLogs" role="tabpanel">
					<div class="card">
						<div class="card-body">
							<div class="row g-2 align-items-end mb-2">
								<div class="col-md-3"><input type="number" class="form-control" id="logMs" placeholder="耗时 ≥ ms (默认500)" min="0"></div>
								<div class="col-md-2"><button class="btn btn-outline-secondary w-100" id="btnLoadLogs">查询</button></div>
							</div>
							<div class="table-responsive">
								<table class="table table-striped align-middle stackable">
									<thead><tr><th>时间</th><th>方法</th><th>URL</th><th>耗时(ms)</th><th>状态</th><th>IP</th></tr></thead>
									<tbody id="logTableBody"></tbody>
								</table>
							</div>
							<nav class="mt-2" aria-label="日志分页">
								<ul class="pagination pagination-sm mb-0" id="logPager"></ul>
							</nav>
						</div>
					</div>
				</div>

				<!-- 设置 -->
				<div class="tab-pane fade" id="tabSettings" role="tabpanel">
					<div class="card">
						<div class="card-body">
							<h2 class="h6 mb-3">系统设置</h2>
							<div class="row g-2">
								<div class="col-md-6">
									<label class="form-label">API BASE</label>
									<div class="input-group">
										<input class="form-control" id="baseInput" placeholder="http://host:port[/api]" value="${API.BASE}">
										<button class="btn btn-outline-secondary" id="btnSaveBase">保存并刷新</button>
									</div>
									<div class="form-text">用于切换环境或网关前缀。</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	}, mount(root) {
		// 仪表盘：热点词、KPI（用近似数据推断）
		(async () => {
			App.showToast('正在加载仪表盘...', 'warning');
			try {
				const hw = await API.safe(API.admin.hotWords, 10);
				const ul = root.querySelector('#hotWords');
				if (hw.ok && Array.isArray(hw.res?.data) && ul) {
					ul.innerHTML = hw.res.data.map(x => `<li>${x.word ||
					'—'} <span class="text-secondary">(${x.frequency || 0})</span></li>`).
							join('') || '<li class="text-secondary">暂无数据</li>';
				}
			} catch (e) {
			}
			// 粗略 KPI：用户总数来自第一页数量的估计，这里仅示意
			try {
				const users = await API.safe(API.admin.users, 1, 10);
				root.querySelector('[data-kpi="users"]').textContent = users.ok &&
				Array.isArray(users.res?.data) ? `~${users.res.data.length}+` : '—';
			} catch (e) {
			}
			try {
				const unread = await API.safe(
						API.admin.feedbackNotRead, {limit: 10, page: 1});
				root.querySelector('[data-kpi="unread"]').textContent = unread.ok &&
				Array.isArray(unread.res?.data) ? unread.res.data.length : '—';
			} catch (e) {
			}
			try {
				const actions = await API.safe(
						API.admin.actionCostLongerThan, {ms: 0, limit: 10, page: 1});
				if (actions.ok && Array.isArray(actions.res?.data) &&
						actions.res.data.length) {
					const avg = Math.round(
							actions.res.data.reduce((s, a) => s + (a.requestTimeCost || 0),
									0,
							) / actions.res.data.length);
					root.querySelector('[data-kpi="latency"]').textContent = `${avg}`;
				}
			} catch (e) {
			}
			root.querySelector('[data-kpi="feedback"]').textContent = '—';
			App.showToast('仪表盘已更新', 'success');
		})();

		// 用户管理
		let uPage = 1, uLimit = 10, userKeyword = '', userRole = '';
		const renderUsers = async () => {
			const tb = root.querySelector('#userTableBody');
			const pager = root.querySelector('#userPager');
			tb.innerHTML = `<tr><td colspan="6">${App.showLoading()}</td></tr>`;
			App.showToast(`正在查询用户（第 ${uPage} 页）...`, 'warning');
			const r = await API.safe(API.admin.users, uPage, uLimit);
			let rows = r.ok && Array.isArray(r.res?.data) ? r.res.data : [];
			// 前端过滤（后端未提供查询）
			if (userKeyword) rows = rows.filter(
					x => (x.nickname || '').includes(userKeyword) ||
							(x.phone || '').includes(userKeyword));
			if (userRole) rows = rows.filter(
					x => String(x.role).toUpperCase() === userRole.toUpperCase());
			tb.innerHTML = rows.map(u => `
				<tr>
					<td data-label="ID">${u.id || '—'}</td>
					<td data-label="昵称">${u.nickname || '—'}</td>
					<td data-label="手机号">${u.phone || '—'}</td>
					<td data-label="积分">${u.points ?? 0}</td>
					<td data-label="角色"><span class="badge text-bg-${(u.role || '') ===
					'BLOCKED' ? 'secondary' : 'success'}">${u.role || 'NORMAL'}</span></td>
					<td data-label="操作">
						<div class="btn-group btn-group-sm">
							<button class="btn btn-outline-secondary" data-user-view="${u.id}">详情</button>
							<button class="btn btn-outline-secondary" data-user-toggle="${u.id}" data-user-role="${u.role ||
					'NORMAL'}">${(u.role || '') === 'BLOCKED' ? '启用' : '禁用'}</button>
						</div>
					</td>
				</tr>`).join('') ||
					`<tr><td colspan="6">${App.showEmpty('暂无数据')}</td></tr>`;
			pager.innerHTML = `
				<li class="page-item ${uPage <= 1 ?
					'disabled' :
					''}"><a class="page-link" href="#" data-u-page="${Math.max(
					1, uPage - 1)}">上一页</a></li>
				<li class="page-item active"><span class="page-link">${uPage}</span></li>
				<li class="page-item"><a class="page-link" href="#" data-u-page="${uPage +
			1}">下一页</a></li>`;
			App.showToast('用户列表已更新', 'success');
		};
		root.querySelector('#btnUserSearch')?.addEventListener('click', () => {
			userKeyword = root.querySelector('#userKeyword').value.trim();
			userRole = root.querySelector('#userRole').value.trim();
			uPage = 1;
			renderUsers();
		});
		root.querySelector('#userPager')?.addEventListener('click', (e) => {
			if (e.target.matches('[data-u-page]')) {
				e.preventDefault();
				uPage = +e.target.getAttribute('data-u-page');
				if (uPage < 1) uPage = 1;
				renderUsers();
			}
		});
		// 用户行操作
		root.querySelector('#userTableBody')?.
				addEventListener('click', async (e) => {
					// 详情
					if (e.target.matches('[data-user-view]')) {
						const id = +e.target.getAttribute('data-user-view');
						App.showToast('正在查询用户详情...', 'warning');
						const r = await API.safe(API.admin.userOne, id);
						if (!r.ok || !r.res?.data) return App.showToast(
								r.msg || '查询失败', 'danger');
						const u = r.res.data;
						const modal = document.createElement('div');
						modal.className = 'modal fade';
						modal.tabIndex = -1;
						modal.innerHTML = `
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header"><h5 class="modal-title">用户详情</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
						<div class="modal-body small">
							<p>ID：${u.id || '—'}</p>
							<p>昵称：${u.nickname || '—'}</p>
							<p>手机号：${u.phone || '—'}</p>
							<p>积分：${u.points ?? 0}</p>
							<p>角色：${u.role || 'NORMAL'}</p>
							<p>创建：${u.createTime || '—'}</p>
							<p>更新：${u.updateTime || '—'}</p>
						</div>
						<div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">关闭</button></div>
					</div>
				</div>`;
						document.body.appendChild(modal);
						new bootstrap.Modal(modal).show();
						modal.addEventListener('hidden.bs.modal', () => modal.remove());
						App.showToast('用户详情已加载', 'success');
					}
					// 启用/禁用
					if (e.target.matches('[data-user-toggle]')) {
						const id = +e.target.getAttribute('data-user-toggle');
						const curr = (e.target.getAttribute('data-user-role') ||
								'NORMAL').toUpperCase();
						const nextRole = curr === 'BLOCKED' ? 'NORMAL' : 'BLOCKED';
						App.confirm(`确定将此用户设置为 ${nextRole} 吗？`, async () => {
							App.showToast('正在更新用户角色...', 'warning');
							const r = await API.safe(
									API.admin.userUpdate, {id, role: nextRole});
							if (r.ok) {
								App.showToast('用户状态已更新', 'success');
								renderUsers();
							} else App.showToast(r.msg || '更新失败', 'danger');
						});
					}
				});
		renderUsers();

		// 咨询（联合信息）
		let cPage = 1, cLimit = 10;
		const renderConsult = async () => {
			const tb = root.querySelector('#consultTableBody');
			const pager = root.querySelector('#consultPager');
			tb.innerHTML = `<tr><td colspan="6">${App.showLoading()}</td></tr>`;
			App.showToast(`正在查询咨询（第 ${cPage} 页）...`, 'warning');
			let rows = [];
			const r = await API.safe(API.admin.consultCombineAll, cPage, cLimit);
			if (r.ok && Array.isArray(r.res?.data)) rows = r.res.data;
			if (!rows.length && cPage > 1) {
				// 当获取不到数据且不在第一页时，自动回退一页再次请求
				cPage = Math.max(1, cPage - 1);
				return renderConsult();
			}
			tb.innerHTML = rows.map(c => `
				<tr>
					<td data-label="用户ID">${c.userId || '—'}</td>
					<td data-label="昵称">${c.nickname || '—'}</td>
					<td data-label="预算">${Math.round(
							(c.lowerBound || 0) / 10000)}-${Math.round(
							(c.upperBound || 1 << 31) / 10000)}万</td>
					<td data-label="场景">${c.mainUseCase || '—'}</td>
					<td data-label="车型">${c.preferredCarModel || '—'}</td>
					<td data-label="燃料">${c.preferredFuelType || '—'}</td>
				</tr>`).join('') ||
					`<tr><td colspan="6">${App.showEmpty('暂无数据')}</td></tr>`;
			const hasPrev = cPage > 1;
			const hasNext = rows.length === cLimit;
			// 根据是否还有数据控制分页按钮可用状态
			pager.innerHTML = `
				<li class="page-item ${hasPrev ? '' : 'disabled'}"><a class="page-link" href="#" data-c-page="${hasPrev ? Math.max(1, cPage - 1) : cPage}">上一页</a></li>
				<li class="page-item active"><span class="page-link">${cPage}</span></li>
				<li class="page-item ${hasNext ? '' : 'disabled'}"><a class="page-link" href="#" data-c-page="${hasNext ? (cPage + 1) : cPage}">下一页</a></li>`;
			App.showToast('咨询数据已更新', 'success');
		};
		root.querySelector('#consultPager')?.addEventListener('click', (e) => {
			if (e.target.matches('[data-c-page]')) {
				e.preventDefault();
				const nextPage = +e.target.getAttribute('data-c-page');
				if (!Number.isFinite(nextPage) || nextPage === cPage) return;
				cPage = Math.max(1, nextPage);
				renderConsult();
			}
		});
		renderConsult();

		// 反馈
		(async () => {
			App.showToast('正在加载反馈列表...', 'warning');
			const notRead = await API.safe(
					API.admin.feedbackNotRead, {limit: 20, page: 1});
			const read = await API.safe(
					API.admin.feedbackReadList, {limit: 20, page: 1});
			const nr = root.querySelector('#fbNotRead'),
					rd = root.querySelector('#fbRead');
			if (nr) {
				nr.innerHTML = (notRead.ok && Array.isArray(notRead.res?.data) ?
								notRead.res.data :
								[]).map(f => `
					<li class="list-group-item d-flex justify-content-between align-items-center">
						<span class="text-truncate me-2" title="${f.text || ''}">${f.text ||
						''}</span>
						<button class="btn btn-sm btn-outline-secondary" data-fb-read="${f.id}">标记已读</button>
					</li>`).join('') ||
						`<li class="list-group-item text-secondary">暂无未读</li>`;
			}
			if (rd) {
				rd.innerHTML = (read.ok && Array.isArray(read.res?.data) ?
								read.res.data :
								[]).map(f => `
					<li class="list-group-item small">
						<div class="d-flex justify-content-between"><span>${f.text ||
						''}</span><span class="text-secondary">${f.createTime || ''}</span></div>
					</li>`).join('') ||
						`<li class="list-group-item text-secondary">暂无已读</li>`;
			}
			root.querySelector('#fbNotRead')?.addEventListener('click', async (e) => {
				const id = e.target.getAttribute('data-fb-read');
				if (!id) return;
				App.showToast('正在标记为已读...', 'warning');
				const r = await API.safe(API.admin.feedbackMarkRead, +id);
				if (r.ok) {
					App.showToast('已标记为已读');
					e.target.closest('li')?.remove();
				} else App.showToast(r.msg || '操作失败', 'danger');
			});
			App.showToast('反馈列表已更新', 'success');
		})();

		// 礼品
		const renderGifts = async () => {
			const tb = root.querySelector('#giftTableBody');
			tb.innerHTML = `<tr><td colspan="5">${App.showLoading()}</td></tr>`;
			App.showToast('正在查询礼品...', 'warning');
			const all = await API.safe(API.points.gifts, 1, 50);
			const rows = all.ok && Array.isArray(all.res?.data) ? all.res.data : [];
			tb.innerHTML = rows.map(g => `
				<tr>
					<td data-label="ID">${g.id || '—'}</td>
					<td data-label="标题">${g.title || '—'}</td>
					<td data-label="积分">${g.cost ?? 0}</td>
					<td data-label="库存">${g.storage ?? 0}</td>
					<td data-label="操作">
						<div class="btn-group btn-group-sm">
							<button class="btn btn-outline-secondary" data-gift-del="${g.id}">下架</button>
						</div>
					</td>
				</tr>`).join('') ||
					`<tr><td colspan="5">${App.showEmpty('暂无礼品')}</td></tr>`;
			App.showToast('礼品列表已更新', 'success');
		};
		root.querySelector('#btnGiftAdd')?.addEventListener('click', async () => {
			const title = root.querySelector('#giftTitle').value.trim();
			const cost = +root.querySelector('#giftCost').value.trim();
			const storage = +root.querySelector('#giftStorage').value.trim();
			const pictureUrl1 = root.querySelector('#giftPic1').value.trim();
			if (!title || !cost || !pictureUrl1 || !Number.isFinite(storage)) {
				return App.showToast('请填写完整信息', 'warning');
			}
			App.showToast('正在新增礼品...', 'warning');
			const r = await API.safe(API.admin.giftInsert, {
				title,
				cost,
				storage,
				description: title,
				pictureUrl1,
				pictureUrl2: pictureUrl1,
				pictureUrl3: pictureUrl1,
			});
			if (r.ok) {
				App.showToast('已新增礼品');
				renderGifts();
			} else App.showToast(r.msg || '新增失败', 'danger');
		});
		root.querySelector('#giftTableBody')?.
				addEventListener('click', async (e) => {
					const id = e.target.getAttribute('data-gift-del');
					if (!id) return;
					App.confirm('确认下架该礼品？', async () => {
						App.showToast('正在下架礼品...', 'warning');
						const r = await API.safe(API.admin.giftDelete, id);
						if (r.ok) {
							App.showToast('已下架');
							renderGifts();
						} else App.showToast(r.msg || '操作失败', 'danger');
					});
				});
		renderGifts();

		// 行为日志
		let logPage = 1, logLimit = 10;
		const renderLogs = async ({resetPage = false} = {}) => {
			if (resetPage) logPage = 1;
			const tb = root.querySelector('#logTableBody');
			const pager = root.querySelector('#logPager');
			tb.innerHTML = `<tr><td colspan="6">${App.showLoading()}</td></tr>`;
			const ms = +(root.querySelector('#logMs').value || 500);
			App.showToast(`正在查询耗时 ≥ ${ms} ms 的请求（第 ${logPage} 页）...`, 'warning');
			const r = await API.safe(
					API.admin.actionCostLongerThan, {ms: ms, limit: logLimit, page: logPage});
			const rows = r.ok && Array.isArray(r.res?.data) ? r.res.data : [];
			if (!rows.length && logPage > 1) {
				// 无数据时回退一页，避免停留在空页
				logPage = Math.max(1, logPage - 1);
				return renderLogs();
			}
			tb.innerHTML = rows.map(a => `
				<tr>
					<td data-label="时间">${a.requestTime || '—'}</td>
					<td data-label="方法">${a.requestMethod || '—'}</td>
					<td data-label="URL">${a.requestUrl || '—'}</td>
					<td data-label="耗时">${a.requestTimeCost ?? 0}</td>
					<td data-label="状态">${a.responseStatusCode ?? 0}</td>
					<td data-label="IP">${a.ipAddress || '—'}</td>
				</tr>`).join('') ||
					`<tr><td colspan="6">${App.showEmpty('暂无数据')}</td></tr>`;
			if (pager) {
				const hasPrev = logPage > 1;
				const hasNext = rows.length === logLimit;
				// 依据返回条数动态控制分页按钮
				pager.innerHTML = `
					<li class="page-item ${hasPrev ? '' : 'disabled'}"><a class="page-link" href="#" data-log-page="${hasPrev ? Math.max(1, logPage - 1) : logPage}">上一页</a></li>
					<li class="page-item active"><span class="page-link">${logPage}</span></li>
					<li class="page-item ${hasNext ? '' : 'disabled'}"><a class="page-link" href="#" data-log-page="${hasNext ? (logPage + 1) : logPage}">下一页</a></li>`;
			}
			App.showToast('日志已更新', 'success');
		};
		root.querySelector('#btnLoadLogs')?.addEventListener('click', () => renderLogs({resetPage: true}));
		root.querySelector('#logPager')?.addEventListener('click', (e) => {
			if (e.target.matches('[data-log-page]')) {
				e.preventDefault();
				const targetPage = +e.target.getAttribute('data-log-page');
				if (!Number.isFinite(targetPage) || targetPage === logPage) return;
				logPage = Math.max(1, targetPage);
				renderLogs();
			}
		});
		renderLogs();

		// 设置：保存 BASE
		root.querySelector('#btnSaveBase')?.addEventListener('click', () => {
			const val = root.querySelector('#baseInput').value.trim();
			if (!val) return;
			API.setBase(val);
		});
	},
};


