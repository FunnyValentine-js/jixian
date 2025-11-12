// 简易 API 客户端，基于 default.md 文档
(function(global){
	// 允许通过 window.API_BASE 或 localStorage.API_BASE 覆盖后端地址
	const DEFAULT_BASE = 'http://47.96.191.232:80/api';
	const BASE = (global.API_BASE || localStorage.getItem('API_BASE') || DEFAULT_BASE).replace(/\/+$/,'');
	// 始终携带 Cookie，确保会话能建立（需要后端允许 CORS 且 Allow-Credentials=true）
	const USE_CREDENTIALS = true;

	// 固定 Authorization 令牌（按需修改）
	const FIXED_AUTHORIZATION = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoxOTg4MTk3ODg2NTQ3NTI1NjMzLCJleHAiOjE3NjMwMDMxNDJ9.rgwNdxSDs0ehCvdnRfAhxhynefmoGDsmd1IEqtYGZmCo5t-dK4_KJ-ITd7Y4yYGxaUG6rhWVSmDIdL2fuYOSfUgDhMw8f_5tMtdWS4veGf_0VycL2FMrAN9zh9-AXpajFt5Mn5N89Weqyfo3-4g0zTamj_VSN6Ugvimf7OGA6gzRHJSvNY5KpKp7IISvMT7k5TgyuquZaofHJUNsDOVFwrmVcOBw0SxqluFALH22oB54wqkDQECVvnpoLOkajDg66g__rjdYIdvG0R7ElGR5taPL1o01Id6dE1Ae3IDrpI9DtlNNw7EFGEGIFwlqCDvqhT4P8EnvuGIo2kMpx57b9Q';

	// 统一持久化 token（localStorage + cookie）
	function persistToken(token){
		if (!token) return;
		try{
			// 去除可能的 "Bearer " 前缀，统一存储为纯 token
			const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
			if (!cleanToken) return;
			localStorage.setItem('API_TOKEN', cleanToken);
			// 简单设为 Lax，若需要跨站可改为 None; Secure（需 HTTPS）
			document.cookie = `API_TOKEN=${encodeURIComponent(cleanToken)}; path=/; SameSite=Lax`;
		}catch(e){
			console.warn('Failed to persist token:', e);
		}
	}

	function getAuthHeaders(){
		// 动态从本地读取 token（推荐）
		try{
			const t = localStorage.getItem('API_TOKEN');
			if (t) return { authorization: t.startsWith('Bearer ') ? t : `Bearer ${t}` };
		}catch(e){}
		// 若本地没有，则回退使用固定令牌
		if (FIXED_AUTHORIZATION) return { authorization: `Bearer ${FIXED_AUTHORIZATION}` };
		return {};
	}

	async function request(url, { method='GET', data, headers } = {}){
		const opts = {
			method,
			headers: {
				'Accept': '*/*',
				...(data ? { 'Content-Type': 'application/json' } : {}),
				...getAuthHeaders(),
				...headers
			},
			body: data ? JSON.stringify(data) : undefined,
			// credentials: USE_CREDENTIALS ? 'include' : 'omit',
			// mode: 'cors'
		};
		let res;
		try{
			res = await fetch(url, opts);
		}catch(err){
			console.error('API error:', err);
			throw new Error('网络请求失败，可能是跨域或网络不可达（请使用本地服务器打开前端，或在后端开启 CORS 并允许来源）');
		}
		// 优先从响应头捕获并保存 Token（登录、注册、更新等操作会返回新 token）
		// 注意：由于 CORS 限制，自定义响应头需要后端在 Access-Control-Expose-Headers 中声明
		let tokenFromHeader = null;
		try{
			// 尝试多种可能的响应头名称
			tokenFromHeader = res.headers.get('authorization') 
				|| res.headers.get('Authorization') 
				|| res.headers.get('x-auth-token') 
				|| res.headers.get('X-Auth-Token')
				|| res.headers.get('token')
				|| res.headers.get('Token');
			if (tokenFromHeader) {
				persistToken(tokenFromHeader);
				console.log('[API] Token saved from response header');
			}
		}catch(e){
			// CORS 限制：无法访问自定义响应头时，会在这里捕获
			// 这种情况需要后端在 Access-Control-Expose-Headers 中添加 authorization
			console.warn('[API] Cannot read authorization header (CORS restriction). Backend should expose it in Access-Control-Expose-Headers.');
		}
		
		const contentType = res.headers.get('content-type') || '';
		let payload = null;
		try{
			payload = contentType.includes('application/json') ? await res.json() : await res.text();
		}catch(e){
			// ignore
		}
		if (!res.ok){
			throw new Error(typeof payload === 'string' ? payload : (payload?.msg || `HTTP ${res.status}`));
		}
		
		// 如果响应头中没有 token，尝试从响应体中获取（作为备选方案）
		if (!tokenFromHeader && payload && typeof payload === 'object'){
			try{
				const maybeToken = payload?.data?.token 
					|| payload?.data?.authorization
					|| payload?.token 
					|| payload?.authorization;
				if (maybeToken) {
					persistToken(maybeToken);
					console.log('[API] Token saved from response body');
				}
			}catch(e){
				// ignore
			}
		}
		
		// 默认返回结构 { code, data, msg }
		// 检查业务状态码：code !== 0 表示业务错误（即使 HTTP 状态码是 200）
		if (payload && typeof payload === 'object' && ('code' in payload || 'data' in payload || 'msg' in payload)){
			// 如果 code 存在且不为 0，视为业务错误
			if ('code' in payload && payload.code !== 0 && payload.code !== null && payload.code !== undefined){
				const errorMsg = payload.msg || `业务错误 (code: ${payload.code})`;
				// 特殊处理 "request too much" 错误，提供更友好的提示
				if (errorMsg.includes('too much') || errorMsg.includes('请求过多') || errorMsg.includes('request too much')){
					throw new Error('请求过于频繁，请稍后再试');
				}
				throw new Error(errorMsg);
			}
			// code 为 0 或不存在 code 字段，返回响应
			return payload;
		}
		return payload;
	}

	// 与 @front-end 对齐的日期与数字工具（用于部分基于 path 的时间区间接口）
	function num2Str(n){
		return n < 10 ? `0${n}` : `${n}`;
	}
	/**
	 * @param {Date} date
	 * @returns {string} yyyy-MM-dd_HH:mm:ss
	 */
	function dateToPathVariable(date){
		const fullYear = date.getFullYear();
		const month = num2Str(date.getMonth() + 1); // month 从0开始
		const day = num2Str(date.getDate());
		const hours = num2Str(date.getHours());
		const minutes = num2Str(date.getMinutes());
		const seconds = num2Str(date.getSeconds());
		return `${fullYear}-${month}-${day}_${hours}:${minutes}:${seconds}`;
	}
	// 参数归一/校验
	function clampInt(value, min, def){
		let n = parseInt(value, 10);
		if (isNaN(n) || n < min) n = def;
		return n;
	}
	function toDateOr(value, fallback){
		if (value instanceof Date) return value;
		if (value === undefined || value === null || value === '') return fallback;
		const d = new Date(value);
		return isNaN(d.getTime()) ? fallback : d;
	}
	/**
	 * 通用 REST 风格路径构造：basePath/[first]/[from]/[to]/[read]/[limit]/[page]
	 * - 自动处理默认值与校验：limit>=1，page>=1；from/to 兜底为时间范围
	 * - 可根据需要省略某些段（未提供则不拼接）
	 */
	function buildQueryPath(basePath, first, { timeFrom, timeTo, limit=20, page=1, read } = {}){
		const parts = [];
		if (first !== undefined && first !== null && `${first}` !== '') parts.push(encodeURIComponent(String(first)));
		// 只有在显式传入 timeFrom/timeTo 参数键时才拼接日期，未传则跳过对应段落
		if ('timeFrom' in (arguments[2] || {})){
			const from = toDateOr(timeFrom, new Date(0));
			parts.push(dateToPathVariable(from));
		}
		if ('timeTo' in (arguments[2] || {})){
			const to = toDateOr(timeTo, new Date());
			parts.push(dateToPathVariable(to));
		}
		if ('read' in (arguments[2] || {})){
			parts.push(String(!!read));
		}
		if ('limit' in (arguments[2] || {})){
			parts.push(String(clampInt(limit, 1, 20)));
		}
		if ('page' in (arguments[2] || {})){
			parts.push(String(clampInt(page, 1, 1)));
		}
		return parts.length ? `${basePath}/${parts.join('/')}` : basePath;
	}

	const Api = {
		auth: {
			login: (loginForm)=> request(`${BASE}/user/login`, { method:'POST', data: loginForm }),
			logout: ()=> request(`${BASE}/user/logout`, { method:'POST' }),
			register: (registerForm)=> request(`${BASE}/user/register`, { method:'POST', data: registerForm }),
			me: ()=> request(`${BASE}/user/me`),
			code: (phone)=> request(`${BASE}/user/code?phone=${encodeURIComponent(phone)}`, { method:'POST' }),
			update: (userDto)=> request(`${BASE}/user/update`, { method:'PUT', data: userDto }),
			getById: (id)=> request(`${BASE}/user/one/${id}`),
			pointsHistory: ({ limit=20, page=1 }={})=>{
				const url = buildQueryPath(`${BASE}/user/points/history`, null, { limit, page });
				return request(url);
			}
		},
		robot: {
			chat: (model='deepseek', message)=>{
				const path = model === 'qwen' ? '/robot/chat/qwen' : '/robot/chat/deepseek';
				const payload = typeof message === 'string' ? { message } : (message||{});
				return request(`${BASE}${path}`, { method:'POST', data: payload });
			},
			historyMe: ({ limit=20, page=1, timeFrom, timeTo }={})=>{
				const url = buildQueryPath(`${BASE}/robot/history/me`, null, { timeFrom, timeTo, limit, page });
				return request(url);
			},
			pieces: ({ chatId, limit })=>{
				// 文档为 DELETE /robot/pieces/{chat-id}[/{limit}]
				const path = typeof limit==='number' ? `${chatId}/${limit}` : `${chatId}`;
				return request(`${BASE}/robot/pieces/${path}`, { method:'DELETE' });
			}
		},
		points: {
			// 与 @front-end 对齐为 path 传参
			gifts: (page=1, limit=12)=> request(`${BASE}/gift/all/${limit}/${page}`),
			giftsInRange: ({ lower=0, upper=null, page=1, limit=12 })=>{
				// 若后端实现为 path 变量，可改为 /gift/cost-in-range/{lower}/{upper}/{limit}/{page}
				// 这里尽量与后端保持兼容，若 upper 缺省则不传
				if (upper==null){
					return request(`${BASE}/gift/cost-in-range/${lower}/${limit}/${page}`);
				}
				return request(`${BASE}/gift/cost-in-range/${lower}/${upper}/${limit}/${page}`);
			},
			consume: (id)=> request(`${BASE}/gift/consume/`, { method:'PUT', data:{ id } }),
			detail: (id)=> request(`${BASE}/gift/detail/${id}`)
		},
		feedback: {
			submit: (text)=> request(`${BASE}/feedback/feedback`, { method:'POST', data: { text } })
		},
		consult: {
			getMine: ()=> request(`${BASE}/consultation-content/me`),
			update: (dto)=> request(`${BASE}/consultation-content/update`, { method:'PUT', data: dto })
		},
		admin: {
			users: (page=1, limit=10)=> request(`${BASE}/admin/user/all/${clampInt(limit,1,10)}/${clampInt(page,1,1)}`),
			userOne: (id)=> request(`${BASE}/admin/user/one/${id}`),
			userCreate: ()=> request(`${BASE}/admin/user/create`),
			userQuery: (queryDto)=> request(`${BASE}/admin/user/query`, { method:'POST', data: queryDto }),
			userUpdate: (info)=> request(`${BASE}/admin/user/update`, { method:'PUT', data: info }),
			userPointsHistory: ({ userId, limit=20, page=1 })=>{
				const url = buildQueryPath(`${BASE}/admin/user/points/history`, userId, { limit, page });
				return request(url);
			},
			consultAll: (page=1, limit=10)=> request(`${BASE}/admin/consultation/all/${clampInt(limit,1,10)}/${clampInt(page,1,1)}`),
			consultCombineAll: (page=1, limit=10)=> request(`${BASE}/admin/consultation/combine/all/${clampInt(limit,1,10)}/${clampInt(page,1,1)}`),
			consultCombineById: (id)=> request(`${BASE}/admin/consultation/combine/${id}`),
			consultByUserId: (userId)=> request(`${BASE}/admin/consultation/user/${userId}`),
			hotWords: (limit=10)=> request(`${BASE}/admin/consultation/hot-word/${limit}`),
			feedbackNotRead: ({ limit=20, page=1, timeFrom, timeTo }={})=>{
				const url = buildQueryPath(`${BASE}/admin/feedback/not-read`, null, { timeFrom, timeTo, limit, page });
				return request(url);
			},
			feedbackReadList: ({ limit=20, page=1, timeFrom, timeTo }={})=>{
				const url = buildQueryPath(`${BASE}/admin/feedback/read`, null, { timeFrom, timeTo, limit, page });
				return request(url);
			},
			feedbackMarkRead: (id)=> {
				// 文档说明：body里面简单的就是一个id, 不需要键值对
				return request(`${BASE}/admin/feedback/read`, { method:'PUT', data: id });
			},
			feedbackByUser: ({ userId, read=false, limit=20, page=1 })=>{
				const url = buildQueryPath(`${BASE}/admin/feedback/user`, userId, { read, limit, page });
				return request(url);
			},
			robotHistoryUser: ({ userId, timeFrom, timeTo, limit=20, page=1 })=>{
				const url = buildQueryPath(`${BASE}/admin/robot/history`, userId, { timeFrom, timeTo, limit, page });
				return request(url);
			},
			actionCostLongerThan: ({ ms, limit=20, page=1 })=>{
				const url = buildQueryPath(`${BASE}/admin/action/cost`, ms, { limit, page });
				return request(url);
			},
			actionRequestTimeLatest: ({ timeFrom, timeTo, limit=20, page=1 }={})=>{
				const url = buildQueryPath(`${BASE}/admin/action/request-time-latest`, null, { timeFrom, timeTo, limit, page });
				return request(url);
			},
			giftInsert: (giftInfo)=> request(`${BASE}/admin/gift/insert`, { method:'POST', data: giftInfo }),
			giftUpdate: (giftInfo)=> request(`${BASE}/admin/gift/update`, { method:'PUT', data: giftInfo }),
			giftDelete: (id)=> request(`${BASE}/admin/gift/delete/${id}`, { method:'DELETE' })
		},
		// 基础能力暴露
		get BASE(){ return BASE; },
		setBase(next){
			if (typeof next === 'string' && next){
				localStorage.setItem('API_BASE', next);
				location.reload();
			}
		},
		get token(){ return localStorage.getItem('API_TOKEN')||''; },
		setToken(tok){
			if (tok) persistToken(tok);
			else { localStorage.removeItem('API_TOKEN'); document.cookie = 'API_TOKEN=; Max-Age=0; path=/'; }
		},
		clearToken(){ localStorage.removeItem('API_TOKEN'); },
		pingEcho(message='ping'){
			return request(`${BASE}/hello/echo/${encodeURIComponent(message)}`);
		}
	};

	// 简单的容错封装：失败时返回 null 并记录 msg
	Api.safe = async (fn, ...args)=>{
		try{
			const res = await fn(...args);
			return { ok:true, res };
		}catch(e){
			console.error('API error:', e);
			return { ok:false, msg: e.message || '请求失败' };
		}
	};

	global.API = Api;

	// 若本地尚无 token，初始化为固定令牌（可被登录/注册/更新时返回的新 token 覆盖）
	try{
		if (!localStorage.getItem('API_TOKEN') && FIXED_AUTHORIZATION){
			persistToken(FIXED_AUTHORIZATION);
		}
	}catch(e){}
})(window);


