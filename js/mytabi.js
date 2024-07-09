let C = null,
	schwas = null,
	mytabi = null,
	thans = false,
	sound = false,
	hiddendiv = null

const
	actcolor = 'moccasin;',
	resize = new CustomEvent('resize', { detail: { modul: 'ref' } }),
	open = { // открытые подсказки - ВСЕ
		cO6s: [],
		rO6s: [],
		Del: (xs, x) => {
			for (let i = 0; i < xs.length; i++)
				if (xs[i] === x) {
					xs.splice(i, 1)
					break
				}
		},
		Add: (xs, x) => xs.push(x)
	},
	StopEvent = e => {
		e.cancelBubble = true
		e.stopPropagation()
		e.preventDefault()
	},
	RowShow = rO6 => {
		open.Add(open.rO6s, rO6)
		rO6.var.act = true
		rO6.cH.style.display = 'table-cell'

		const pos = rO6.cH.getBoundingClientRect()
		if (rO6.rx)
			rO6.rx.style.height = pos.height + 'px'
		window.dispatchEvent(resize)
	},
	RowClose = rO6 => {
		open.Del(open.rO6s, rO6)
		rO6.var.act = false
		rO6.cH.style.display = 'none'
		if (rO6.rx)
			rO6.rx.style.height = 0
		window.dispatchEvent(resize)
	},
	ShowAct = (div, act) => {
		cO6 = div.cO6
		cO6.act = act
		cO6.td.style.backgroundColor = act ? 'yellow' : ''
	},
	H4Close = h4 => {
		const div = h4.parentNode

		C.PopO6Close(div)
	},
	AllClose = rO6s => {
		let stop = false
		for (const rO6 of rO6s) {
			if (rO6.var.act) {
				RowClose(rO6)
				stop = true
			}

			for (const td of rO6.rR.cells)
				if (td.cO6 && td.cO6.act) {
					C.PopO6Close(td.cO6.div)
					stop = true
				}
		}
		return stop
	},
	TabDblClick = e => {
		const x = e.srcElement
		let stop = false,
			row = x.parentNode

		if (x.tagName == 'TD') {
			const m = row.rowIndex % 5
			if (m > 0 && m < 4)
				stop = AllClose(row.rO6.rO6s)
		}
		else
			while (row)
				if (row.tagName == 'TR') {
					RowClose(row.rO6)
					stop = true
					break
				} else
					row = row.parentNode

		if (stop)
			StopEvent(e)
	},
	/* ---------------------------------------------------- */

	FillTab = (tab, rows) => {
		let schwa = tab.parentNode
		while (schwa && !schwa.classList.contains('schwa'))
			schwa = schwa.parentNode

		if (schwa) {
			tab.rO6s = []

			const div = schwa.querySelector("div[class='div-ol']"),
				aO5shp = schwa.parentNode.aO5shp,
				shdw = aO5shp ? aO5shp.shdw : null

			let i = -1, j = 0

			for (const row of rows) {
				const c0 = row.cells[0],
					isn = c0.innerText.match(/^\s*\d*\s*[,\.\/]\s*\d*\s*$/)

				if (isn) {
					i++
					j = 5 * i

					if (!rows[j + 4])
						alert(`нет подсказки '${isn}' (символ '-')`)
				}

				const
					rO6 = !isn ? tab.rO6s[i] : {
						var: { act: false, help: false, lis: null },
						rO6s: tab.rO6s,
						i: i,							// номер строки в строфе
						ol: div.children[i], 			// ссылка на подсказку
						rT: rows[j + 1],   				// рядок с русским текстом
						rA: rows[j + 2],   				// рядок с русским текстом
						rR: rows[j + 3],   				// рядок с русским текстом
						cH: rows[j + 4].cells[0], 		// ячейка с подсказков  (в рядке i4)
						rx: shdw ? 						// рядок с подсказков в shdw-прототипе
							shdw.querySelector("table[class='cnum']").rows[5 * i + 4] : null
					}

				if (isn) {
					Object.freeze(rO6)
					tab.rO6s[i] = rO6
				}
				row.rO6 = rO6
			}

			tab.addEventListener('dblclick', TabDblClick, { capture: true })
		}
		else {
			C.ConsoleAlert(`Не найден 'schwa' для ${C.MakeObjName(tab)}`)
			return
		}
	},
	FillHelp = row => {
		const rO6 = row.rO6,
			mschwa = new RegExp('ₔ' + '.{1}', 'g'),
			Schwa = s => {
				return '<sup>' + s.substring(1) + '</sup>'
			}

		rO6.var.help = true
		rO6.cH.setAttribute('colspan', '16')
		// rO6.ol.innerHTML = '<div>' + ol.outerHTML.replace(mschwa, Schwa) + '</div>'
		// rO6.cH.innerHTML = rO6.ol.innerHTML
		rO6.cH.innerHTML = '<div>' + rO6.ol.outerHTML.replace(mschwa, Schwa) + '</div>'
	},
	FillRowCell = (td, rO6) => {
		if (!rO6.var.lis)
			rO6.var.lis = rO6.cH.querySelectorAll("div>ol>li")

		const
			pos = td.getBoundingClientRect(),
			c = td.cellIndex,
			L = pos.left + 12,
			T = pos.top + 0.82 * pos.height,
			W = Math.max(pos.width, 244),
			lis = rO6.var.lis

		let err = ''

		if (!lis)
			err = `Нету или ошибочно написание пояснений для строки ${rO6.i}`
		else
			if (lis.length != td.parentNode.cells.length)
				err = `Несовпадение к-ва пояснений для строки ${rO6.i},- 
				ячеек=${td.parentNode.cells.length} а li-пояснений=${lis.length}`

		if (err) {
			C.ConsoleError(err)
			return
		}

		if (!td.cO6) {
			td.cO6 = {
				td: td, act: false, div: null,
				ShowAct: ShowAct,
				head: td.innerHTML.replace(/^[\s,.!?]|[\s,.!?]$/g, ''),
				help: '<div><div>\n' +
					lis[c].innerHTML.
						replace(/<p>(.|\n)*?<\/p>/mg, '').
						replace(/<span (.|\n)*?\/span>/mg, '').						
						replace(',,', '') +
					'</div></div>',
				pos: {},
				style: ``,
			}
			Object.seal(td.cO6)
		}
		if (!hiddendiv){
			hiddendiv = document.createElement('div')
			hiddendiv.id='iidd'
			document.body.appendChild(hiddendiv)
		}
		hiddendiv.style.width= W + 'px'
		hiddendiv.innerHTML=td.cO6.help
		// const p2=hiddendiv.getBoundingClientRect()

		let H =Math.max(hiddendiv.getBoundingClientRect().height +18, 1.5*pos.height)
		if (H > 280) H = 250

		Object.assign(td.cO6, {
			pos: { L: L, T: T, W: W, H: H, },
			style: `` +
				`margin-top: ${pos.top - T - 4 - 1}px; ` + // тут1 '4' - padding для .cpops (стр. 157)
				`margin-left: ${pos.left - L - 4 - 1}px; ` +
				`width: ${pos.width - 4 - 3}px; ` +
				`height: ${pos.height - 3}px; `
			,
		})
		return td.cO6
	},
	ShowT = e => {

		const td = e.srcElement
		if (td.nodeName != 'TD') return

		const
			row = td.parentNode,
			m = row.rowIndex % 5

		if (m < 1 || m > 3)  // ловим клики только на ячейкахв строках 1-3
			return

		const tab = row.parentNode.tagName == 'TABLE' ? row.parentNode : row.parentNode.parentNode
		if (!tab.rO6s) FillTab(tab, row.parentNode.rows)

		const rO6 = row.rO6
		if (!rO6.var.help) FillHelp(row)

		switch (m) {	// номер рядка в группе
			case 1:
				if (rO6.var.act) RowClose(rO6)
				else RowShow(rO6)
				break
			case 2:
				break
			case 3:
				const cO6 = FillRowCell(td, rO6)

				if (!cO6)
					console.error(`Ошибка в определении cO62 для rO6.i=${rO6.i} `)
				else
					if (cO6.act) {
						open.Del(open.cO6s, cO6)
						C.PopO6Close(cO6.div)
					}
					else {
						const pos = cO6.pos,
							div = cO6.div =
								C.PopO6Create(pos,
									`<h4 onclick="H4Close(this)" style="` + cO6.style + `">` +
									cO6.head +
									'</h4>\n' +
									cO6.help,
									ShowAct, 2)  // м.б. только 2 подсказки

						open.Add(open.cO6s, cO6)
						div.classList.add('cpops')
						cO6.act = true
						div.cO6 = cO6
						ShowAct(div, true)
					}
		}

		StopEvent(e)
	},
	SelectT = e => {
		const div = e.srcElement
		if (div.tagName != 'DIV' || div.classList.contains('mytabinum'))
			return

		let ichg = -1
		const isclick = e.type == 'click',
			divs = e.currentTarget.children,
			Hide = i => {
				divs[i].classList.remove('shown')
				schwas[i].classList.remove('shown')

				ichg = i
			},
			Show = i => {
				divs[i].classList.add('shown')
				schwas[i].classList.add('shown')
				ichg = i
			}
		// Play = i => {

		// }

		if (thans) {
			for (let i = 0; i < divs.length; i++)
				if (div === divs[i])
					if (i < 10) {
						if (divs[i].classList.contains('shown')) Hide(i)
						else Show(i)
						break
					} else
						if (i > 10) {
							if (divs[i].classList.contains('shown')) {
								divs[i].classList.remove('shown')
								for (let j = 0; j < 10; j++)Hide(j)
							}
							else {
								divs[i].classList.add('shown')
								for (let j = 0; j < 10; j++)Show(j)
							}
						}
			if (ichg >= 0) {
				const hrHidden = 'hr-hidden'
				let ifirst = -1
				for (let i = 0; i < 10; i++)
					if (divs[i].classList.contains('shown')) {
						const hr = schwas[i].querySelector("hr")
						if (hr)
							if (ifirst < 0) {
								if (!hr.classList.contains(hrHidden))
									hr.classList.add(hrHidden)
								ifirst = i
							}
							else
								hr.classList.remove(hrHidden)
					}

			}
		}
		if (sound)
			for (let i = 0; i < divs.length; i++) {
				const shown = divs[i].classList.contains('shown')

				if (div === divs[i]) {
					if (!shown) Show(i)
					// if (shown) Play(i)
					// else
					// 	if (isclick) Show(i)
					// 	else {
					// 		Show(i)
					// 		Play(i)
					// 	}
				}
				else
					if (shown) Hide(i)
			}

		if (ichg >= 0) {
			let i = open.cO6s.length
			while (i-- > 0) {
				C.PopO6Close(open.cO6s[i].div)
				open.Del(open.cO6s, open.cO6s[i])
			}
			i = open.rO6s.length
			while (i-- > 0) {
				RowClose(open.rO6s[i])
				open.Del(open.rO6s, open.rO6s[i])
			}

			const
				tab = schwas[ichg].querySelector("table"),
				rO6s = tab.rO6s

			if (rO6s)
				AllClose(rO6s)

			StopEvent(e)
			window.dispatchEvent(resize)
		}
	}

window.addEventListener('olga5_ready', function () {
	C = window.olga5.C
	// const tabs = document.getElementsByTagName('table'),
	// 	mtn = document.getElementsByClassName('mytabinum')[0]

	mytabi = document.getElementById('mytabi')
	if (!mytabi) // это - тестовый вариант
		return
	
	schwas = mytabi.querySelectorAll("div[class*='schwa']") // getElementsByClassName('schwa')
	thans = mytabi.classList.contains('trans')
	sound = mytabi.classList.contains('sound')

	const
		// tabs = mytabi.querySelectorAll("table"),
		mtn = mytabi.querySelectorAll("div[class*='mytabinum']")[0]

	// for (const tab of tabs)
	// 	tab.addEventListener('click', ShowT)
	mytabi.addEventListener('click', ShowT)
	mtn.addEventListener('click', SelectT)
	mtn.addEventListener('dblclick', SelectT)

	const body = document.body,
		bkgc = window.getComputedStyle(body, null).getPropertyValue("background-color"),
		carts = document.getElementsByClassName('olga5-cart')

	for (const cart of carts)
		cart.style.backgroundColor = bkgc

	for (const qq of [
		{ t: 'id', b: 'op05_cart' },
		{ t: 'id', b: 'op09_cart' },
		{ t: 'class', b: 'mytabselect' },
	]) {
		const sel = "div[" + qq.t + "='" + qq.b + "']",
			qs = mytabi.querySelectorAll(sel)
		if (qs)
			for (const q of qs)
				q.style.backgroundColor = bkgc
	}

	for (const schwa of schwas)
		if (!schwa.classList.contains('olga5-ignore'))
			schwa.style.backgroundColor = bkgc
})