window.PagePoints = {
	async render() {
		// 拉取礼品列表（带分页）
		let gifts = [];
		const params = new URLSearchParams(location.hash.split('?')[1] || '');
		const page = +(params.get('page') || 1);
		const limit = +(params.get('limit') || 12);
		// 积分历史分页参数
		const historyPage = +(params.get('historyPage') || 1);
		const historyLimit = +(params.get('historyLimit') || 20);

		// 生成足量本地模拟礼物（保证≥3页）
		const TOTAL_MOCK = 48; // 4页 * 12
		const buildMockCatalog = () => Array.from({length: TOTAL_MOCK}).
				map((_, idx) => ({
					id: idx + 1,
					title: `示例礼品 ${idx + 1}`,
					pictureUrl: `./assets/img/gift${(idx % 3) + 1}.svg`,
					cost: 50 + (idx % 10) * 10,
					storage: (idx % 5 === 0) ? 0 : (10 - (idx % 7)),
				}));
		let usingMock = false;
		try {
			const {ok, res} = await API.safe(API.points.gifts, page, limit);
			if (ok && res?.data && Array.isArray(res.data)) {
				gifts = res.data;
			} else {
				usingMock = true;
			}
		} catch (e) {
			usingMock = true;
		}
		if (usingMock) {
			const catalog = buildMockCatalog();
			const start = (page - 1) * limit;
			gifts = catalog.slice(start, start + limit);
		}

		// 拉取积分历史数据
		let pointsHistory = [];
		let historyTotalPages = 1;
		let historyTotal = 0;
		let hasMorePages = false;
		try {
			const {ok, res} = await API.safe(API.points.selfPointHistory, historyLimit, historyPage);
			if (ok && res?.data) {
				// 处理返回的数据结构（可能是数组，或者包含 records 和 pagination 信息的对象）
				if (Array.isArray(res.data)) {
					pointsHistory = res.data;
					// 如果返回的数据条数等于 limit，可能还有下一页
					hasMorePages = res.data.length === historyLimit;
				} else if (res.data.records && Array.isArray(res.data.records)) {
					pointsHistory = res.data.records;
					// 如果有分页信息，提取总页数和总数
					if (res.data.total !== undefined) {
						historyTotal = res.data.total;
						historyTotalPages = Math.ceil(historyTotal / historyLimit);
						hasMorePages = historyPage < historyTotalPages;
					} else if (res.data.totalPages !== undefined) {
						historyTotalPages = res.data.totalPages;
						hasMorePages = historyPage < historyTotalPages;
					} else {
						// 没有分页信息，根据返回数据量判断
						hasMorePages = res.data.records.length === historyLimit;
					}
				} else if (res.data.list && Array.isArray(res.data.list)) {
					pointsHistory = res.data.list;
					if (res.data.total !== undefined) {
						historyTotal = res.data.total;
						historyTotalPages = Math.ceil(historyTotal / historyLimit);
						hasMorePages = historyPage < historyTotalPages;
					} else {
						// 没有分页信息，根据返回数据量判断
						hasMorePages = res.data.list.length === historyLimit;
					}
				}
			}
		} catch (e) {
			console.error('获取积分历史失败:', e);
		}

		const grid = (gifts || []).map(g => `
			<div class="col-6 col-md-4 col-lg-3">
				<div class="card h-100 card-hover">
					<img class="card-img-top ${g.pictureUrl ?
				'' :
				'd-none'} lazy" width="100%" height="140" data-src="${g.pictureUrl ||
		'./assets/img/gift1.svg'}" alt="${g.title || '商品'}">
					<div class="card-body d-flex flex-column">
						<div class="fw-semibold text-truncate" title="${g.title ||
		''}">${g.title || '商品'}</div>
						<p class="text-secondary small flex-grow-1">${g.storage === 0 ?
				'库存：售罄' :
				`库存：${g.storage ?? '--'}`}</p>
						<div class="d-flex justify-content-between align-items-center">
							<span class="badge text-bg-secondary">需要 ${g.cost ?? '--'}</span>
							<div class="btn-group">
								<button class="btn btn-sm btn-outline-secondary" data-detail-id="${g.id}">详情</button>
								<button class="btn btn-sm btn-primary" data-gift-id="${g.id}" ${g.storage ===
		0 ? 'disabled' : ''}>兑换</button>
							</div>
						</div>
					</div>
				</div>
			</div>`).join('');
		const makeLink = (p, l) => `#/points?page=${p}&limit=${l}`;
		const makeHistoryLink = (hp, hl) => {
			const params = new URLSearchParams(location.hash.split('?')[1] || '');
			params.set('historyPage', hp);
			params.set('historyLimit', hl);
			if (page) params.set('page', page);
			if (limit) params.set('limit', limit);
			return `#/points?${params.toString()}`;
		};
		// 当使用本地模拟数据时，提供明确的分页边界（≥3页）
		let prevDisabled = page <= 1 ? 'disabled' : '';
		let nextDisabled = '';
		if (usingMock) {
			const totalPages = Math.ceil(TOTAL_MOCK / limit);
			nextDisabled = page >= totalPages ? 'disabled' : '';
		}
		// 积分历史分页状态
		const historyPrevDisabled = historyPage <= 1 ? 'disabled' : '';
		// 判断是否还有下一页：如果有总页数信息则使用总页数，否则根据返回数据量判断
		let historyNextDisabled = '';
		if (historyTotalPages > 1) {
			// 有总页数信息，使用总页数判断
			historyNextDisabled = historyPage >= historyTotalPages ? 'disabled' : '';
		} else {
			// 没有总页数信息，根据返回数据量判断
			historyNextDisabled = !hasMorePages ? 'disabled' : '';
		}
		
		// 格式化日期时间（处理格式：YYYY-MM-DD_HH:mm:ss）
		const formatDateTime = (dateStr) => {
			if (!dateStr) return '--';
			try {
				// 如果格式是 YYYY-MM-DD_HH:mm:ss，将下划线替换为空格
				if (typeof dateStr === 'string' && dateStr.includes('_')) {
					// 替换所有下划线为空格（虽然通常只有一个）
					return dateStr.replace(/_/g, ' ');
				}
				// 尝试解析标准日期格式
				const date = new Date(dateStr);
				if (isNaN(date.getTime())) return dateStr;
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			} catch (e) {
				return dateStr;
			}
		};
		
		// 格式化积分变动（flow 字段可能为正数或负数）
		const formatPointsChange = (flow) => {
			if (flow === null || flow === undefined) return '--';
			const num = Number(flow);
			if (isNaN(num)) return String(flow);
			return num > 0 ? `+${num}` : String(num);
		};
		
		// 翻译 reason 为中文
		const translateReason = (reason) => {
			const reasonMap = {
				'FEEDBACK': '提交反馈',
				'IMPROVE_SELF_INFORMATION': '完善个人资料',
				'CHAT': '智能对话',
				'CONSUME': '兑换礼品',
				'LOGIN': '每日登录',
				'REGISTER': '注册账号',
			};
			return reasonMap[reason] || reason || '未知来源';
		};
		
		// 生成积分历史表格行
		const historyRows = pointsHistory.length > 0 ? pointsHistory.map(item => {
			// 使用实际的 API 返回字段：createDate 和 flow
			const time = item.createDate || item.time || item.createTime || item.createdAt || item.date || item.timestamp || '';
			const flow = item.flow !== undefined ? item.flow : (item.points || item.amount || item.change || item.pointChange || 0);
			const reason = item.reason || item.source || item.description || item.type || '';
			const source = translateReason(reason);
			return `
				<tr>
					<td data-label="时间">${formatDateTime(time)}</td>
					<td data-label="变动">${formatPointsChange(flow)}</td>
					<td data-label="来源">${source}</td>
				</tr>`;
		}).join('') : `
			<tr>
				<td colspan="3" class="text-center text-secondary">暂无积分历史记录</td>
			</tr>`;
		return `
		<div class="my-4">
			<h1 class="h4 mb-3">积分系统</h1>
			<div class="row g-3">
				<div class="col-lg-4">
					<div class="card h-100">
						<div class="card-body">
							<h2 class="h6">积分概览</h2>
							<div class="display-6 fw-bold">${App.state.user?.points ?? 120}</div>
							<div class="text-secondary small mb-2">当前积分（登录后实时刷新）</div>
							<div class="d-flex align-items-center gap-3">
								<span class="badge text-bg-primary">Lv.${Math.max(
				1, Math.ceil(((App.state.user?.points ?? 120)) / 100))}</span>
								<div class="flex-grow-1">
									<div class="progress" style="height:8px">
										<div class="progress-bar" style="width:${Math.min(
				100, ((App.state.user?.points ?? 120) % 100))}%"></div>
									</div>
									<div class="small text-secondary mt-1">每 100 分升 1 级</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="col-lg-8">
					<div class="card h-100">
						<div class="card-body">
							<h2 class="h6 mb-3">如何获得积分</h2>
							<div class="row g-2">
								<div class="col-md-4">
									<div class="table-card p-3 h-100">
										<div class="fw-semibold mb-2">每日任务</div>
										<ul class="mb-0 small text-secondary">
											<li class="mb-1">每日首次登录：+5</li>
											<li class="mb-1">与智能对话（≤5次/日）：+5/次</li>
										</ul>
									</div>
								</div>
								<div class="col-md-4">
									<div class="table-card p-3 h-100">
										<div class="fw-semibold mb-2">成长任务</div>
										<ul class="mb-0 small text-secondary">
											<li class="mb-1">完善个人资料：+10</li>
											<li class="mb-1">提交有效反馈（≤1次/日）：+10</li>
										</ul>
									</div>
								</div>
								<div class="col-md-4">
									<div class="table-card p-3 h-100">
										<div class="fw-semibold mb-2">快捷入口</div>
										<div class="d-grid gap-2">
											<button class="btn btn-outline-primary btn-sm" id="goProfile">完善个人资料</button>
											<button class="btn btn-outline-primary btn-sm" id="goChat">打开智能对话</button>
											<button class="btn btn-outline-primary btn-sm" id="goFeedback">提交用户反馈</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<h2 class="h6 mt-4 mb-3">积分商城</h2>
			<div class="row g-3" id="giftGrid">${grid}</div>
			<nav class="mt-3" aria-label="分页">
				<ul class="pagination pagination-sm mb-0">
					<li class="page-item ${prevDisabled}"><a class="page-link" href="${makeLink(
				Math.max(1, page - 1), limit)}">上一页</a></li>
					<li class="page-item active"><span class="page-link">${page}</span></li>
					<li class="page-item ${nextDisabled}"><a class="page-link" href="${makeLink(
				page + 1, limit)}">下一页</a></li>
				</ul>
			</nav>

			<h2 class="h6 mt-4 mb-3">积分历史</h2>
			<div class="card">
				<div class="card-body">
					<div class="table-responsive">
						<table class="table table-striped align-middle stackable">
							<thead><tr><th>时间</th><th>变动</th><th>来源</th></tr></thead>
							<tbody id="pointsHistoryTableBody">
								${historyRows}
							</tbody>
						</table>
					</div>
					<nav class="mt-2" aria-label="积分历史分页">
						<ul class="pagination pagination-sm mb-0">
							<li class="page-item ${historyPrevDisabled}">
								${historyPrevDisabled ? 
									'<span class="page-link">上一页</span>' : 
									`<a class="page-link" href="${makeHistoryLink(Math.max(1, historyPage - 1), historyLimit)}">上一页</a>`}
							</li>
							<li class="page-item active"><span class="page-link">${historyPage}</span></li>
							<li class="page-item ${historyNextDisabled}">
								${historyNextDisabled ? 
									'<span class="page-link">下一页</span>' : 
									`<a class="page-link" href="${makeHistoryLink(historyPage + 1, historyLimit)}">下一页</a>`}
							</li>
						</ul>
					</nav>
				</div>
			</div>
		</div>`;
	}, mount(root) {
		// 懒加载图
		App.initLazyImages();
		// 任务快捷入口
		root.querySelector('#goProfile')?.
				addEventListener('click', () => location.hash = '#/user');
		root.querySelector('#goChat')?.
				addEventListener('click', () => location.hash = '#/chat');
		root.querySelector('#goFeedback')?.addEventListener('click', () => {
			App.confirm('现在去提交一条产品反馈？', async () => {
				const {ok, msg} = await API.safe(
						API.feedback.submit, '前端积分页面反馈：体验良好');
				if (ok) {
					App.showToast('反馈提交成功', 'success');
					// 刷新积分
					const me = await API.safe(API.auth.me);
					if (me.ok && me.res?.data) {
						const d = me.res.data;
						App.saveUser({...(App.state.user || {}), points: d.points});
					}
				} else {
					App.showToast(msg || '反馈提交失败', 'danger');
				}
			});
		});
		// 兑换
		root.querySelectorAll('[data-gift-id]').forEach(btn => {
			btn.addEventListener('click', async () => {
				const id = +btn.getAttribute('data-gift-id');
				btn.disabled = true;
				const {ok, res, msg} = await API.safe(API.points.consume, id);
				if (ok) {
					App.showToast('兑换成功', 'success');
					// 刷新用户积分
					await API.safe(API.auth.me).then(me => {
						if (me.ok && me.res?.data) {
							const d = me.res.data;
							App.saveUser({...(App.state.user || {}), points: d.points});
						}
					});
				} else {
					App.showToast(msg || '兑换失败', 'danger');
				}
				btn.disabled = false;
			});
		});
		// 详情模态
		root.querySelectorAll('[data-detail-id]').forEach(btn => {
			btn.addEventListener('click', async () => {
				const id = +btn.getAttribute('data-detail-id');
				let detail = null;
				let errorMsg = null;
				try {
					// 使用 API.points.detail 方法获取详情
					const {ok, res} = await API.safe(API.points.detail, id);
					// 即使 code 不是 200，也可能有数据（如 code=0 时）
					if (res) {
						// 优先从 res.data 获取数据
						if (res.data) {
							detail = res.data;
						} else if (res.title || res.id !== undefined) {
							// 如果直接返回对象（没有嵌套 data）
							detail = res;
						}
						// 如果有错误消息，保存起来
						if (res.msg && res.code !== 200) {
							errorMsg = res.msg;
						}
					}
				} catch (e) {
					console.error('获取礼品详情失败:', e);
					errorMsg = e.message || '获取详情失败';
				}
				// 如果没有获取到数据（完全失败），使用默认数据
				// 注意：即使 API 返回空数据（如 code=0），也应该使用返回的数据进行渲染
				if (!detail) {
					// 完全没有数据，使用完全默认的数据
					detail = {
						title: '示例礼品',
						description: '这是一个示例详情',
						pictureUrl1: './assets/img/gift1.svg',
						pictureUrl2: './assets/img/gift2.svg',
						pictureUrl3: './assets/img/gift3.svg',
						cost: 80,
						storage: 10,
					};
				}
				// 如果有错误消息，显示提示
				if (errorMsg) {
					App.showToast(errorMsg, 'warning');
				}
				// 处理图片 URL（空字符串也视为无效）
				const pic1 = (detail.pictureUrl1 && detail.pictureUrl1.trim()) || './assets/img/gift1.svg';
				const pic2 = (detail.pictureUrl2 && detail.pictureUrl2.trim()) || './assets/img/gift2.svg';
				const pic3 = (detail.pictureUrl3 && detail.pictureUrl3.trim()) || './assets/img/gift3.svg';
				// 处理积分和库存显示
				const cost = detail.cost !== undefined && detail.cost !== null ? detail.cost : '--';
				const storage = detail.storage !== undefined && detail.storage !== null ? detail.storage : '--';
				const isStorageZero = detail.storage === 0 || detail.storage === '0';
				
				const modal = document.createElement('div');
				modal.className = 'modal fade';
				modal.tabIndex = -1;
				modal.innerHTML = `
				<div class="modal-dialog modal-lg modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title">${detail.title || '礼品详情'}</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
						</div>
						<div class="modal-body">
							<div class="row g-2 mb-2">
								<div class="col-4"><img class="img-fluid rounded lazy" data-src="${pic1}" alt="${detail.title || '礼品图片1'}"></div>
								<div class="col-4"><img class="img-fluid rounded lazy" data-src="${pic2}" alt="${detail.title || '礼品图片2'}"></div>
								<div class="col-4"><img class="img-fluid rounded lazy" data-src="${pic3}" alt="${detail.title || '礼品图片3'}"></div>
							</div>
							<p class="mb-0">${detail.description || '暂无描述'}</p>
						</div>
						<div class="modal-footer">
							<span class="me-auto text-secondary small">需要积分：${cost}；库存：${storage}</span>
							<button type="button" class="btn btn-primary" id="detailExchange"${isStorageZero ? ' disabled' : ''}>立即兑换</button>
						</div>
					</div>
				</div>`;
				document.body.appendChild(modal);
				const bs = new bootstrap.Modal(modal);
				modal.addEventListener('hidden.bs.modal', () => modal.remove());
				modal.querySelector('#detailExchange')?.
						addEventListener('click', async () => {
							const ex = await API.safe(API.points.consume, id);
							if (ex.ok) {
								App.showToast('兑换成功', 'success');
								bs.hide();
								await API.safe(API.auth.me).then(me => {
									if (me.ok && me.res?.data) {
										const d = me.res.data;
										App.saveUser({...(App.state.user || {}), points: d.points});
									}
								});
							} else {
								App.showToast(ex.msg || '兑换失败', 'danger');
							}
						});
				bs.show();
				App.initLazyImages();
			});
		});
	},
};


