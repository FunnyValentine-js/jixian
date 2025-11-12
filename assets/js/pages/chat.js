window.PageChat = {
	async render(){
		return `
		<div class="my-4 chat-bg rounded-4 p-3 p-md-4">
			<div class="d-flex justify-content-between align-items-center mb-3">
				<h1 class="h4 mb-0">智能对话</h1>
				<div class="d-flex align-items-center gap-2">
					<select class="form-select form-select-sm" id="modelSelect" style="width:auto">
						<option value="deepseek">DeepSeek</option>
						<option value="qwen">Qwen</option>
					</select>
					<span class="toolbar-badge small" id="modelBadge">模型：DeepSeek</span>
				</div>
			</div>
			<div class="row g-3">
				<div class="col-lg-8">
					<div class="glass">
						<div class="p-3 p-md-4 d-flex flex-column" style="height: 65vh;">
							<div class="flex-grow-1 overflow-auto mb-3" id="chatList" aria-live="polite" aria-label="对话消息列表"></div>
							<div class="d-flex flex-wrap gap-2 mb-2" id="suggestions">
								<span class="chip" data-q="帮我基于20万预算推荐一款家用SUV">家用SUV推荐</span>
								<span class="chip" data-q="纯电/混动车型的优缺点分别是什么？">电/混对比</span>
								<span class="chip" data-q="城市通勤和周末自驾，预算30万，选什么？">通勤+自驾方案</span>
							</div>
							<form id="chatForm" class="d-flex gap-2 mt-auto">
								<input type="text" class="form-control" id="chatInput" placeholder="输入你的问题（Enter发送）..." required>
								<button class="btn btn-primary" type="submit" id="btnSend">发送</button>
								<button class="btn btn-outline-secondary" type="button" id="btnStop" disabled>停止</button>
							</form>
						</div>
					</div>
				</div>
				<div class="col-lg-4">
					<div class="glass h-100">
						<div class="p-3 p-md-4">
							<h2 class="h6">我的历史</h2>
							<ul class="list-group list-group-flush small" id="historyList" aria-label="历史记录"></ul>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	},
	mount(root){
		const list = root.querySelector('#chatList');
		const historyList = root.querySelector('#historyList');
		const form = root.querySelector('#chatForm');
		const input = root.querySelector('#chatInput');
		const btnSend = root.querySelector('#btnSend');
		const btnStop = root.querySelector('#btnStop');
		const suggestions = root.querySelector('#suggestions');
		const modelSelect = root.querySelector('#modelSelect');
		const modelBadge = root.querySelector('#modelBadge');

		let isGenerating = false;
		let stopRequested = false;
		let currentModel = localStorage.getItem('chat_model') || 'deepseek';
		modelSelect.value = currentModel;
		modelBadge.textContent = `模型：${modelSelect.selectedOptions[0].textContent}`;
		modelSelect.addEventListener('change', ()=>{
			currentModel = modelSelect.value;
			localStorage.setItem('chat_model', currentModel);
			modelBadge.textContent = `模型：${modelSelect.selectedOptions[0].textContent}`;
		});

		const appendMsg = (from, text)=>{
			const wrap = document.createElement('div');
			wrap.className = `mb-3`;
			wrap.innerHTML = `
			<div class="d-flex ${from==='user'?'justify-content-end':''} gap-2 align-items-start">
				${from==='user'?'':'<div class="chat-avatar bot">AI</div>'}
				<div class="chat-bubble ${from}">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
				${from==='user'?'<div class="chat-avatar">我</div>':''}
			</div>`;
			list.appendChild(wrap);
			list.scrollTop = list.scrollHeight;
		};

		const appendBotPlaceholder = ()=>{
			const wrap = document.createElement('div');
			wrap.className = `mb-3`;
			wrap.innerHTML = `
			<div class="d-flex gap-2 align-items-start">
				<div class="chat-avatar bot">AI</div>
				<div class="chat-bubble bot">
					<span class="typing">
						<span class="dot"></span><span class="dot"></span><span class="dot"></span>
					</span>
				</div>
			</div>`;
			list.appendChild(wrap);
			list.scrollTop = list.scrollHeight;
			return wrap.querySelector('.chat-bubble');
		};

		const renderMarkdownLite = (text)=>{
			// 粗略解析 ```lang ... ``` 代码块 与普通段落
			const lines = text.split('\n');
			let html = '';
			let inCode = false, codeLang = '', codeBuffer = [];
			const refs = [];
			const urlRe = /(https?:\/\/[^\s)]+)|([a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}\/[^\s)]+)/g;
			for (const raw of lines){
				const line = raw;
				if (!inCode && line.trim().startsWith('```')){
					inCode = true;
					codeLang = line.trim().slice(3).trim();
					codeBuffer = [];
					continue;
				}
				if (inCode && line.trim().startsWith('```')){
					// end code
					const codeHtml = codeBuffer.join('\n').replace(/</g,'&lt;').replace(/>/g,'&gt;');
					html += `<pre><code class="language-${codeLang||''}">${codeHtml}</code></pre>`;
					html += `<div class="message-actions"><button type="button" class="btn-copy" data-copy="code">复制代码</button></div>`;
					inCode = false; codeLang=''; codeBuffer=[];
					continue;
				}
				if (inCode){
					codeBuffer.push(line);
				}else{
					// 收集参考/来源行
					if (/^\s*(参考|来源)/.test(line) || urlRe.test(line)){
						const urls = (line.match(urlRe)||[]);
						if (urls.length) refs.push(...urls);
					}
					const safe = line.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(urlRe, (m)=>`<a href="${m.startsWith('http')?m:'http://'+m}" target="_blank" rel="noreferrer">${m}</a>`);
					html += `<p class="mb-2">${safe}</p>`;
				}
			}
			return { html, refs: Array.from(new Set(refs)).slice(0,10) };
		};

		const enhanceBotBubble = (bubbleEl, text)=>{
			const { html, refs } = renderMarkdownLite(text);
			bubbleEl.innerHTML = html;
			// 代码高亮
			try{
				bubbleEl.querySelectorAll('pre code').forEach(el=>{
					window.hljs && hljs.highlightElement(el);
				});
			}catch(e){}
			// 复制代码按钮
			bubbleEl.parentElement?.querySelectorAll('.btn-copy[data-copy="code"]').forEach(btn=>{
				btn.addEventListener('click', async ()=>{
					const pre = btn.closest('.message-actions')?.previousElementSibling;
					const codeText = pre?.innerText || '';
					await navigator.clipboard?.writeText(codeText);
					App.showToast('代码已复制','success');
				});
			});
			// 引用折叠
			if (refs.length){
				const refsEl = document.createElement('div');
				refsEl.className = 'refs';
				refsEl.innerHTML = `<details><summary>参考/来源（${refs.length}）</summary><ul class="small mt-2">${refs.map(u=>`<li><a href="${u}" target="_blank" rel="noreferrer">${u}</a></li>`).join('')}</ul></details>`;
				bubbleEl.appendChild(refsEl);
			}
			// 整段复制
			const copyAll = document.createElement('button');
			copyAll.type = 'button';
			copyAll.className = 'btn-copy ms-1';
			copyAll.textContent = '复制内容';
			copyAll.addEventListener('click', async ()=>{
				await navigator.clipboard?.writeText(text);
				App.showToast('内容已复制','success');
			});
			const actions = document.createElement('div');
			actions.className = 'message-actions';
			actions.appendChild(copyAll);
			bubbleEl.appendChild(actions);
		};

		const setBusy = (busy)=>{
			isGenerating = busy;
			input.disabled = busy;
			btnSend.disabled = busy;
			btnStop.disabled = !busy;
		};

		const pollPieces = async (chatId, onChunk)=>{
			// 轮询 pieces 直到结束信号
			while(!stopRequested){
				const { ok, res, msg } = await API.safe(API.robot.pieces, { chatId, limit: 64 });
				if (!ok){
					onChunk({ type:'error', text: msg || '获取片段失败' });
					break;
				}
				const arr = res?.data || [];
				if (!Array.isArray(arr) || arr.length===0){
					// 短暂等待后再拉取
					await new Promise(r=> setTimeout(r, 500));
					continue;
				}
				let shouldEnd = false;
				for (const piece of arr){
					if (typeof piece.id === 'number' && piece.id < 0){
						// 结束/重复/异常 信号
						if (piece.id === -2){
							onChunk({ type:'warn', text:'重复提问，本次未计入。' });
						}else if (piece.id === -1){
							// 正常结束或异常，统一结束
						}
						shouldEnd = true;
						continue;
					}
					if (piece.text){
						onChunk({ type:'text', text: piece.text });
					}
				}
				if (shouldEnd) break;
				await new Promise(r=> setTimeout(r, 400));
			}
		};

		form.addEventListener('submit', async (e)=>{
			e.preventDefault();
			if (isGenerating) return;
			const message = input.value.trim();
			if (!message) return;

			// 展示用户消息
			appendMsg('user', message);
			input.value = '';
			setBusy(true);
			stopRequested = false;

			// 发起对话，获取 chatId
			const start = await API.safe(API.robot.chat, currentModel, message);
			if (!start.ok){
				App.showToast(start.msg || '提问失败','danger');
				setBusy(false);
				return;
			}
			const chatId = start.res?.data;
			const botBox = appendBotPlaceholder();
			let botText = '';

			await pollPieces(chatId, (evt)=>{
				if (evt.type==='text'){
					botText += evt.text;
					// 渐进式显示为纯文本，完成后再做高亮渲染
					botBox.textContent = botText;
				}else if (evt.type==='warn'){
					App.showToast(evt.text, 'warning');
				}else if (evt.type==='error'){
					App.showToast(evt.text, 'danger');
				}
			});

			setBusy(false);

			// 渲染最终 markdown、代码高亮、复制与引用折叠
			try{
				const last = list.querySelector('.chat-bubble.bot:last-of-type');
				if (last) enhanceBotBubble(last, botText);
			}catch(e){}
		});

		btnStop.addEventListener('click', ()=>{
			if (!isGenerating) return;
			stopRequested = true;
			setBusy(false);
			App.showToast('已停止本次生成','warning');
		});

		// 历史记录
		(async ()=>{
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

		// 建议问题
		suggestions?.querySelectorAll('.chip').forEach(chip=>{
			chip.addEventListener('click', ()=>{
				input.value = chip.getAttribute('data-q')||'';
				input.focus();
			});
		});
	}
};


