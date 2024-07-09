/* -global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  сборщик модулей ядра библиотеки
 * 
**/
// 
(function () {              // ---------------------------------------------- o5com ---
	const
		E = { // тут везде tag===window.  Д.б. перед 'use strict'
			Err: err => {
				console.error("%c%s", "background: yellow; color: black;border: solid 1px gold;", 'E: ' + err)
			},
			Msg: (txt, eve, nFun) => {
				if (C.consts.o5debug > 0) {
					console.groupCollapsed("%c%s", "background: lightblue; color: black;border: solid 1px gold;",
						`${txt} для eve='${eve}'\n ф-ии "${nFun}"`)
					console.trace()
					console.groupEnd()
				}
			},
			NFun: (Fun) => Fun.name || Fun,
			events: [],
			donets: [],
			AddEventListener: (eve, Fun, opts) => {
				const nFun = E.NFun(Fun)
				E.Msg('AddEventListener', eve, nFun)
				if (E.events.find(event => event.eve == eve && event.nFun == nFun && event.opts == opts))
					E.Err(`повторная регистрация  '${eve}' для ф-ии "${nFun}"`)
				else {
					const
						caller = arguments.callee
					for (const donet of E.donets)
						if (donet.eve == eve)
							if (donet.callers.includes(caller))
								E.Err(`Повторное выполнение '${eve}' для ф-ии "${nFun}"`)
							else {
								donet.callers.push(caller)
								Fun(donet.e)
							}

					E.events.push({ eve: eve, nFun: nFun, opts: opts })
					window.addEventListener(eve, Fun, opts)
				}
			},
			RemoveEventListener: (eve, Fun) => {
				const nFun = E.NFun(Fun)
				E.Msg('RemoveEventListener', eve, nFun)
				let i = E.events.length,
					k = -1
				while (i-- > 0 && k < 0)
					if (E.events[i].eve == eve && E.events[i].nFun == nFun)
						k = i

				if (k < 0)
					E.Err(`удаление неприсвоенного события '${eve}' функции "${nFun}" `)
				else {
					E.events.splice(k, 1)
					window.removeEventListener(eve, Fun)
				}
			},
			DispatchEvent: (eve, modulx, canrep) => {
				const modul = modulx ? modulx : ''
				if (C.consts.o5debug > 1 && !canrep) {
					console.groupCollapsed(`DispatchEvent: '${eve}' для modul= '${modul}'`)
					console.trace()
					console.groupEnd()
				}
				const donet = E.donets.find(donet => donet.eve == eve && donet.modul == modul)
				let e = null
				if (donet) {
					e = donet.e
					if (!canrep)
						E.Err(`повторная генерация события '${eve}' modul="${modul}"`)
				}
				else {
					const e2 = new CustomEvent(eve, modul ? { detail: { modul: modul } } : {})
					E.donets.push({ eve: eve, modul: modul, callers: [], e: e2, })
					e = e2
				}
				window.dispatchEvent(e)
			},
			Init: () => {
				E.events.splice(0, E.events.length)
				E.donets.splice(0, E.donets.length)
			},
		}

	'use strict'
	const olga5_modul = "o5com"
	if (!window.olga5) window.olga5 = []
	if (!window.olga5.C) window.olga5.C = {}
	if (!window.olga5[olga5_modul]) window.olga5[olga5_modul] = {}

	const
		modnames = ['CConsole', 'CEncode', 'CApi', 'CParams', 'TagsRef', 'IniScripts','CPops'], // 'IniScripts' д.б. ПОСЛЕДНИМ
		wshp = window.olga5[olga5_modul],
		C = window.olga5.C,
		strt_time = Number(new Date()),
		IncludeScripts = ({ modul = '', names = [], actscript = C.o5script, iniFun = {}, args = [] }) => {
			const
				nams = {},
				load = { is_set: false, timeout: 0, path: '' },
				actpath = actscript.src.match(/\S*\//)[0],
				OnTimer = () => {
					let s = ''
					for (const nam in nams)
						if (!nams[nam]) s += (s ? ', ' : '') + nam

					if (s)
						console.error(`Для ${modul} недозагрузились скрипты: ${s} (таймер o5timload=${C.consts.o5timload}с.)`)
					load.timeout = 0
				},
				OnLoad = name => {
					const lefts = []
					nams[name] = true
					for (const nam in nams)
						if (!nams[nam]) lefts.push(nam)

					if (C.consts.o5debug > 1)
						console.log(`загружено включение '${name}' осталось [${lefts.join(', ')}]`)
					if (lefts.length == 0) {
						if (load.timeout > 0) {
							window.clearTimeout(load.timeout)
							load.timeout = 0
						}
						iniFun(args)
					}
				},
				OnError = (name, e) => {
					console.error(`Для ${name} ошибка дозагрузки '${name}' (из ${e.target.src})`)
					// OnLoad(name)
				}

			for (const name of names)
				nams[name] = false
			for (const name of names) { // в очерёдности размещения	
				if (!window.olga5[modul]) {
					C.ConsoleError(`В скрипте, выполняющем дозагрузку скриптов, не создан объект 'window.olga5.${modul}'`)
					continue
				}
				if (window.olga5[modul][name]) OnLoad(name)
				else {
					if (!load.is_set)
						Object.assign(load, {
							is_set: true,
							path: actpath + modul + '/',
							timeout: window.setTimeout(OnTimer, 1000 * C.consts.o5timload),
						})

					const script = document.createElement('script')

					if (script.readyState) script.onreadystatechange = () => { OnLoad(name); }
					else script.onload = () => { OnLoad(name); }
					script.onerror = function (e) { OnError(name, e); }

					script.src = load.path + name + '.js'
					script.dataset.o5add = modul
					script.setAttribute('async', '')

					if (C.consts.o5debug > 0) {
						const MakeObjName = obj => obj ? (
							(obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
								('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
								'.' + (obj.className ? obj.className : '?'))) : 'НЕОПР.'
						console.log(`вставка ${(name + '.js').padEnd(15)}  перед  ${modul + '.js'} (в parentNode=${MakeObjName(actscript.parentNode)})`)
					}

					if (actscript.parentNode)
						actscript.parentNode.insertBefore(script, actscript)
					else // это ватще-то заплатка. по-хорошему надо бы убрать 'actscript' оставив 'module'	
						for (const scr of document.scripts)
							if (scr.src.lastIndexOf('/' + modul + '.js') > 0) {
								scr.parentNode.insertBefore(script, scr.nextSibling)   // т.е. тут insertAfter
								break
							}
				}
			}
			// console.log('--------------------- load.timeout='+load.timeout)
			// if (!load.timeout) iniFun(args)
		},
		RunO5com = () => {
			const
				DoneO5com = (e) => {
					if (e)
						document.removeEventListener('readystatechange', DoneO5com)

					const _url_olga5 = C.o5script.src.match(/\S*\//)[0],
						errs = []

					for (const modname of modnames)
						if (wshp[modname]) wshp[modname](_url_olga5)
						else
							errs.push(modname)

					const dt = ('' + (Number(new Date()) - strt_time)).padStart(4) + ' ms',
						name = dt + `        ${olga5_modul}`

					if (errs.length > 0)
						console.error('%c%s', "background: yellow; color: black;border: none;",
							`Не найдены [${errs.join(', ')}] в ${olga5_modul}.js ( где-то синтаксическая ошибка ?)`)
					console.log('%c%s', "background: blue; color: white;border: none;", '---<<<  инициализировано ядро      ' + name)
				}

			if (document.body) DoneO5com()
			else
				document.addEventListener('readystatechange', DoneO5com)
		},
		GetBaseHR = (root) => { // функции определения адреса текущиещей страницы и корня сайна
			const url = new window.URL(window.location) //"http://rombase.h1n.ru/o5/2020/olga5-all.html")
			if (root == 'root') return url.origin + '/'
			else return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
		},
		TryToDigit = x => {
// if (x.indexOf && x.indexOf('182')>=0)			
// console.log()
			if (typeof x === 'undefined') return 1		// true
			if (x === !!x) return x
			const val = ('' + x).replace(C.repQuotes, '')

			if (val == 'true') return true
			if (val == 'false') return false

			const i = parseInt(val)
			if (i == val) return i
			const f = parseFloat(val)
			if (f == val) return f
			const rez = val.replace(/\s*;\s*\n+\s*/g, ';').replace(/\s*\n+\s*/g, ';')
			return rez.replace(/\t+/g, ' ').trim()
		},
		HasProperty=(foo,nam)=>{
			return  Object.prototype.hasOwnProperty.call(foo, nam)
			// return  foo.hasOwnProperty(nam)
		},
		GetAttribute = (attrs, name) => { // нахождение значения 'attr' в массиве атрибутов 'attrs'
			for (const nam of [name, 'data-' + name, '_' + name, 'data_' + name])
				if (HasProperty(attrs, nam)) return attrs[nam]
		},
		GetAttrs = attributes => {
			const attrs = {}
			for (const attribute of attributes)
				attrs[Repname(attribute.name)] = TryToDigit(attribute.value)
			return attrs
		},
		Repname = name => {
			return name.trim().replaceAll('-', '_').toLowerCase()
		},
		ConstsFillFromUrl = (xs) => {  // параметры адресной строки,- м.б. (т.е. интерпретируются) только константы
			const hash = window.location.hash
			if (hash)
				C.save.hash = hash ? hash.substring(1).trim() : ''

			const smatchs = window.location.search.match(/[?&]\S+?(#|$)/) || []
			for (const smatch of smatchs) {
				const match = smatch.replaceAll(/(%20|\s)/g, '').trim()
				if (match) {
					const params = match.split(/[,;?&#]/)
					for (const param of params) {
						const u = param.trim()
						if (u.length > 0) {
							const prms = u.split(/[=:]/)
							let nam = Repname(prms[0])
							if (nam == 'o5nomenu' || nam == 'nomenu') nam = 'o5nomnu'
							if (nam == 'debug') nam = 'o5debug'
							// if (nam == 'o5debug') 
							// 	nam = 'o5debug'
							if (HasProperty(C.consts, nam)) {
								const val = TryToDigit(prms[1])
								xs[nam] = { val: val, source: C.save.urlName }
								C.constsurl[nam] = val
							}
						}
					}
				}
			}
		},
		ParamsFillFromScript = (xs, defs, attrs, p) => {
			const stradd = '(добавлен)'
			for (const name in attrs) {
				const nam = Repname(name)
				if (HasProperty(defs, nam) && !HasProperty(xs, nam)) {
					const add = HasProperty(defs, nam) ? '' : stradd
					xs[nam] = { val: TryToDigit(attrs[name]), source: `атрибут${add}` }
				}
			}

			let partype = 'data-o5' + p  // тут в частности o5consts
			if (!attrs[partype]) partype = 'data_o5' + p
			if (!attrs[partype]) partype = 'o5' + p
			if (attrs[partype]) {
				const params = attrs[partype].split(/[;]/)  // параметры в атрибуте разделяются только ';'
				for (const param of params) {
					const u = param.replace(/\s*#.*$/, ''), // trim()
						i = u.indexOf('=')
					if (i > 0) {
						const nam = Repname(u.substring(0, i).trim())
						if (!xs[nam]) {
							const add = HasProperty(defs, nam) ? '' : stradd,
								val = TryToDigit(u.substring(i + 1).trim())
							xs[nam] = { val: val, source: `параметр${add}` }
							// console.log(`${nam} = '${val}'`)
						}
					}
				}
			}

			let n = 0	// подсчет к-ва 'стандартных' параметров
			for (const nam in defs) {
				n++
				if (!xs[nam])
					xs[nam] = { val: TryToDigit(defs[nam]), source: 'default' }
			}
			return n
		}

	Object.assign(C, {
		repQuotes: /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g,
		olga5ignore: 'olga5-ignore',
		TryToDigit: TryToDigit,
		ParamsFillFromScript,
		GetAttrs: GetAttrs,
		GetAttribute: GetAttribute,
		Repname: Repname,
		IncludeScripts: IncludeScripts,
		E: E,
		o5script: document.currentScript,
		o5attrs: GetAttrs(document.currentScript.attributes),
		cstate: {	 			// общее состояние 
			depends: null,  	// только для подключенных скриптов, но с учетом как o5depends, так и очередности в задании и атрибута async
		},
		urlrfs: {
			_url_html: GetBaseHR('href'),
			_url_root: GetBaseHR('root'),
			_url_olga5: '' // будет задан при инициализации (document.currentScript.src.match(/\S*\//)[0],)
		},
		consts: {
			o5timload: 3, 	//mtiml ? (mtiml[5] ? mtiml[5] : 1) : (C.o5script.attributes['o5timload'] || 3),
			o5debug: 0, 	// mdebug ? (mdebug[5] ? mdebug[5] : 1) : (C.o5script.attributes['o5debug'] || 0),
			o5nomnu: 0,
			o5noact: 0,
			o5only: 0,
			o5incls: '',
			o5doscr: 'olga5_sdone',
         // o5depends: "pusto; o5inc; o5pop= o5snd; o5shp: o5inc, o5ref; o5ref= o5inc; o5snd:o5ref; o5shp=o5snd, o5ref; o5shp; o5inc; o5mnu",
			o5depends: "o5inc; o5pop:o5ref,o5snd; o5ref= o5inc; o5snd:o5ref; o5shp=o5snd, o5ref; o5mnu; o5tab",
			o5init_events: 'readystatechange:d, message',	// , transitionrun, transitionend
			o5hide_events: 'transitionrun',	// , transitionrun, transitionend
			o5done_events: 'beforeunload, olga5_unload',
		},
		constsurl: {},
		save: { hash: null, xs: null, p: '', n1: -1, urlName: 'url', libName: 'ядро', }, // сохранение для "красивой" печати - потом удалю

		ModulAddSub: (modul, sub, Fun) => {
			if (C.consts.o5debug) {
				// const nam = `${modul}/${sub}.js`
				// if ('o5shp/DoInit.js' == nam)
				// 	console.log()
				console.log(`}===< ${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'дозагружен' : 'подключён '}:  ${modul}/${sub}.js`)
			}

			if (window.olga5[modul] && window.olga5[modul][sub]) {
				console.groupCollapsed('%c%s', "background: yellow; color: black;border: solid 2px red;",
					`}---< Повтор загрузки '${modul}/${sub}'`)
				console.log(`Fun_old=${window.olga5[modul][sub]})`)
				console.log(`Fun_new=${Fun})`)
				console.groupEnd()
			}

			if (!window.olga5[modul])
				window.olga5[modul] = {}
			if (Fun)
				window.olga5[modul][sub] = Fun
			return window.olga5[modul]
		},
		ModulAdd: (W, pars) => {
			const modul = W.modul
			if (window.olga5.find(w => w.modul == modul))
				console.error('%c%s', "background: yellow; color: black;border: solid 2px red;",
					`}---< Повтор загрузки '${modul}`)
			else {
				if (C.consts.o5debug)
					console.log(`}---< ${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${modul}.js`)

				if (!window.olga5[modul])
					window.olga5[modul] = {}

				if (pars)
					Object.assign(window.olga5[modul], pars)

				window.olga5[modul].W = W
				window.olga5.push(W)
				// window.dispatchEvent(new CustomEvent('olga5_sload', { detail: { modul: modul } }))
				C.E.DispatchEvent('olga5_sload', W.modul)

				return window.olga5[modul]
			}
		},
        MyJoinO5s : aO5s => {
            let s = ''
            for (const aO5 of aO5s) s += (s ? ', ' : '') + aO5.name
            return s
        },
	})

	const xs = {}, // временное хранилилище для считываемых параметров
		p = 'consts',
		defs = C[p]

	Object.assign(C.save, { xs: xs, p: p, n1: -1 })

	ConstsFillFromUrl(xs)
	C.save.n1 = ParamsFillFromScript(xs, defs, C.o5attrs, p)

	for (const nam in xs) defs[nam] = xs[nam].val

	const
		mm = document.currentScript.src.match(/(!\.js)|(\bo5.js)\s*$/),
		AscInclude = () =>
			IncludeScripts({ modul: olga5_modul, names: modnames, actscript: C.o5script, iniFun: RunO5com, })

	if (mm) wshp.AscInclude = AscInclude  // формальный вызов чтобы всё поотмечать и вызвать iniFun()
	else
		AscInclude()

	console.log(`}+++< загружено ядро библиотеки`)
})();
/* -global document, window, console, Map*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 * расширение логирования
 */
(function () {              // ---------------------------------------------- o5com/CConsole ---
	'use strict'
	const olga5_modul = 'o5com',
		modulname = 'CConsole',
		C = window.olga5.C,
		padd = "padding-left:0.5rem;",
		clrtypes = {
			'A': "background: yellow; color: black;border: solid 3px red;",
			'E': "background: yellow; color: black;border: solid 1px gold;",
			'S': "background: blue;   color: white;border: solid 1px bisque;",
			'I': "background: beige;  color: black;border: solid 1px bisque;",
		},
		ConsoleMsg = (styp, txts, add, tab) => {
			const txt = (txts && txts[txts.length - 1] != '') ? txts + ' ' : txts,
				type = styp.substr(0, 1).toUpperCase(),
				clr1 = clrtypes[type],
				clr2 = "margin-left:0.4rem; background: white; color: black; border: solid " +
					(tab ? "1px gray;" : "1px bisque;")

			if (add === null || typeof add === 'undefined' || add === '') console.groupCollapsed('%c%s', (padd + clr1), txt)
			else
				if (Number.isInteger(add)) console.groupCollapsed('%c%s%c%s', (padd + clr1), txt, (padd), add + ' ')
				else console.groupCollapsed('%c%s%c%s', (padd + clr1), txt, (padd + clr2), add + ' ')

			const tt = []
			if (tab) {
				if (tab instanceof Array)
					tab.forEach((v, nam) => {
						let t = {}
						const // ss = [],
							O = (o) => {
								const uu = []
								if (o instanceof NamedNodeMap) {
									for (const atr of o) uu.push(atr.name + '=' + atr.value)
									return uu.join(',')
								} else if (o instanceof Object) {
									for (const x in o) uu.push(x + '=' + o[x])
									return uu.join(',')
								}
								else return (typeof o === 'undefined') ? ' `undef`' : (o == null ? '`null`' : o.toString())
							}
						let s = ''
						if (v instanceof Map) {
							v.forEach((x, nam) => s += (s == '' ? '' : ', ') + nam + ':' + x.toString())
							t[nam].val = '{' + s + '}'
						} else if (v instanceof Array) {
							v.forEach(x => s += (s == '' ? '' : ', ') + x)
							t[nam].val = '{' + s + '}'
						} else if (v instanceof Object) {
							for (const x in v)
								t[x] = O(v[x])
						} else
							t = v //t[nam] = v
						tt.push(t)
					})
				else if (tab instanceof Map)
					tab.forEach((v, nam) => {
						const t = { nam: nam }
						let s = ''
						if (v instanceof Map) {
							v.forEach((x, nam) => s += (s == '' ? '' : ', ') + nam + ':' + x.toString())
							t.val = '{' + s + '}'
						} else if (v instanceof Array) {
							v.forEach(x => s += (s == '' ? '' : ', ') + x)
							t.val = '{' + s + '}'
						} else if (v instanceof Object) {
							for (const x in v) s += (s == '' ? '' : ', ') + x + ':' + v[x]
							t.val = '{' + s + '}'
						} else
							t.val = v
						tt.push(t)
					})
				else for (const t in tab) {
					const v = tab[t]
					if (!t.match(/^\d*$/) && typeof v !== 'function')
						if (typeof v !== 'object') tt.push({ nam: t, val: v })
						else {
							const r = { nam: t }
							if (Array.isArray(v))
								for (let i = 0; i < v.length; i++)
									r['№-' + i] = v[i]
							else
								for (const x in v)
									r[x] = v[x]

							tt.push(r)
						}
				}
				if (tt.length > 0) {
					// tt.push({})    // иначе Chromium проглатывает последний элемент массива
					console.table(tt)
				}
			}
			console.table()
			// console.groupCollapsed(` ... трассировка вызовов :`)
			console.trace()
			// console.groupEnd()
			console.groupEnd()
		}

	C.ModulAddSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			ConsoleMsg: ConsoleMsg,
			ConsoleAlert: (txt, add, tab) => ConsoleMsg('alert', txt, add, tab),
			ConsoleError: (txt, add, tab) => ConsoleMsg('error', txt, add, tab),
			ConsoleSign: (txt, add, tab) => ConsoleMsg('sign', txt, add, tab),
			ConsoleInfo: (txt, add, tab) => ConsoleMsg('info', txt, add, tab),
		})
		return true
	}
	)
})();
/* -global document, window*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o5com/CEncode ---
	'use strict'
	const olga5_modul = 'o5com',
		modulname = 'CEncode',
		C = window.olga5.C,
		DelBacks = (s0) => {
			// const s00 = s0
			let n = 0
			const mrkN = '\n',
				mrk2 = '..'
			do {
				let l = s0.length,
					m = s0.match(/\.\.[^\/]/)
				if (m) s0 = s0.substr(0, m.index + 2) + '/' + s0.substr(m.index + 2)
				m = s0.match(/[^\/]\.\./)
				if (m) s0 = s0.substr(0, m.index + 1) + '/' + s0.substr(m.index + 1)
				if (l == s0.length) break
			} while (n++ < 99)

			const s2s = s0.split('/')
				// tt = []
			for (let i = 0; i < s2s.length; i++)
				if (s2s[i] == mrk2) {
					let j = i
					while (j-- > 0)
						if (s2s[j] != mrkN && s2s[j] != mrk2 && s2s[j] != '') {
							s2s[j] = mrkN
							s2s[i] = ''
							break
						}
				}

			let i = s2s.length
			while (i-- > 0)
				if (s2s[i] == mrkN || (i > 0 && s2s[i] == '' && s2s[i - 1] == ''))
					s2s.splice(i, 1)

			let s = s2s.join('/').replaceAll(/\/\.\//g, '/')
			return s.replaceAll(/[^:]\/\/+/g, (u) => { return u.substr(0, 2) })
		},
		// IsUrlNam = u => { return !!(u.trim() && !u.match(/[\/.\\#]/)) },
		IsUrlNam = u => {
			const isurl = !!(u && u.trim() && !u.match(/[\/.\\#]/))
			return isurl
		},
		IsFullUrl = url => {
			return url.match(/^https?:/i) ||
				url.match(/^\s*\/*\s*(((\d{1,3}\.){3}\d{1,3})|localhost)\//i)
		},
		DeCodeUrl = function (urlrfs, url, o5attrs = null) { // старое DeCodeUrl
			if (url.match(/^\s*data:/)) {
				return { url: url.trim(), err: '', num: 0 }
			}
			// if (url.match('myTunes-icon'))					
			// 	console.log(121212)				
			const errs = [],
				parts = [],
				Replace4320 = u =>
					u.replaceAll(/(&#43;)/g, '+').replaceAll(/(%20|&nbsp;)/g, ' ').trim(), // давать в такой очерёдностии, иначе снова вернёт %20 !,
				IsCompaund = orig => orig && (orig.includes('+') || IsUrlNam(orig)),
				SplitRefs = (s, refs = null) => {
					s.split('+').forEach(sprt => {
						const prt = sprt.replace(C.repQuotes, ''),	// trim(),
							isnam = IsUrlNam(prt),
							ref = isnam ? C.Repname(prt) : prt

						if (isnam) parts.num++
						if (refs && refs.find(r => ref == r))
							errs.push(`цикл. ссылки ${refs.join('->')}=>${ref};`)
						else {
							const attr = (isnam && o5attrs) ? C.GetAttribute(o5attrs, ref) : null

							if (attr) {
								if (!refs) refs = []
								refs.push(ref)
								SplitRefs(attr, refs)
							}
							else if (isnam) {
								if (urlrfs[ref]) SplitRefs(urlrfs[ref], refs)
								else
									errs.push(`неопр.: '${prt}` + (prt != ref ? ` (т.е. '${ref})` : ''))
							}
							else
								parts.push(ref)
						}
					})
				},
				ss = url.split('?'),
				orig = Replace4320(ss[0].trim()),
				ret = { url: url, err: '', num: 0 }

			if (IsCompaund(orig)) {
				Object.assign(parts, { num: 0, rght: ss[1] ? ('?' + ss[1]) : '' })

				SplitRefs(orig)

				let urld = ''
				for (const part of parts)
					if (urld && part && urld[urld.length - 1] != '/' && part[0] != '/') urld = urld + '/' + part
					else urld = ((urld ? urld : '') + (part ? part : ''))
				// console.log(orig, urld)
				if (urld) {
					if (!IsFullUrl(urld)) {
						if (parts[0] == '') urld = C.urlrfs._url_olga5 + urld
						else urld = C.urlrfs._url_html + urld
						if (!IsFullUrl(urld)) {  // если всё еще нету
							const hr = new window.URL(window.location).href
							urld = hr.substring(0, hr.lastIndexOf('/') + 1) + urld
						}
					}
					urld = DelBacks(urld) + parts.rght
				}
				Object.assign(ret, {
					url: urld,
					err: errs.length > 0 ? errs.join(', ') : (urld ? '' : `пустой 'url'`),
					num: parts.num
				})
			}
			return ret
		},
		TagDes = (tag, ref, errs = null) => {
			const
				regExp1 = /(.*(\/|\+)\s*)|(!*\.js\s*$)/g,
				regExp2 = /(\s*\+\s*)+/g
			for (const code of ['data-', '_', '']) {
				const from = code + ref,
					attr = tag.attributes[from]
				if (attr) {
					const orig = attr.nodeValue

					return {
						code: code,
						from: from,
						modul: orig.replace(regExp1, ''),
						orig: orig,
						trans: !!(orig.match(regExp2) || IsUrlNam(orig)),
					}
				}
			}
			if (errs)
				errs.push({ tag: C.MakeObjName(tag), ref: ref, txt: 'не определены атрибуты' })
		}

	C.ModulAddSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			DelBacks: DelBacks,
			IsFullUrl: IsFullUrl,
			DeCodeUrl: DeCodeUrl,
			TagDes: TagDes,
		})
		return true
	}
	)
})();
/* global document, window, console, Map*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o5com/CApi --- 111
	'use strict'
	const
		C = window.olga5.C,
		olga5_modul = 'o5com',
		modulname = 'CApi',
		// Match = scls => new RegExp(`\\b` + scls + `(\\s*[,:+]\\s*((([\`'"\\(\[])(.*?)\\4)|[^\\s\`'":,+]*))*(\\s*|$)`),
		// Match = scls => new RegExp(`\\b` + scls + `\\b(\\s*:\\s*\\w*|([\`'"\\([])(.*?)\\3)*`),
		Match = scls => new RegExp(`\\b` + scls + `\\b(\\s*[,:+]\\s*[^\\s:\`'"]*|([\`'"\\([])(.*?)\\2)*`),
		mquals = /\s*[:,]\s*/,
		GetTagsBy = (modul, fun, ask) => {
			const list = [],
				errs = [],
				nams = ask.split(ask.match(/;/) ? /\s*;\s*/ : /\s*,\s*/)
			for (const owner of C.owners)
				if (owner.modules.length == 0 || !modul ||
					owner.modules.find(m => { return m == modul })) {
					const Fun = owner.start[fun]
					if (Fun)
						for (const nam of nams) {
							const matches = Fun.call(owner.start, nam)
							let tags = []								
								
							// проверяю сам тег 'olga5_start'
							if (owner.start.matches(nam)) 
								tags.push(owner.start)
								
							if (matches) {
								const amatches =Array.from(matches)
								tags = tags.concat(amatches)
							}

							for (const tag of tags)
								if (!list.includes(tag))
									list.push(tag)
						}
					else
						errs.push({ tag: C.MakeObjName(owner.start), Fun: fun })
				}
			if (errs.length > 0)
				C.ConsoleError(`Ошибочные запросы функций для тегов`, errs.length, errs)
			return list
		}

	C.ModulAddSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			owners: [],
			scrpts: [],
			Match: Match,
			MakeObjName: function (obj, len) { // моё формирование имени объекта
				if (obj) {
					const nam = Object.is(obj, window) ? '#window' : (
						Object.is(obj, document) ? '#document' : (
							(obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
								('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
								'.' + (obj.className ? obj.className : '?')
							)
						))
					return nam.padEnd(len ? len : 0);
				}
				else
					return 'null';
			},
			GetTagsByQueryes: (queryes, modul) => {
				return GetTagsBy(modul, 'querySelectorAll', queryes)
			},
			GetTagsByIds: (ids, modul) => {
				const nams = ids.split(/\s*,\s*/)
				nams.forEach((nam, i, nams) => { nams[i] = '#' + nam });
				return GetTagsBy(modul, 'querySelectorAll', nams.join(','))
			},
			GetTagsByClassNames: (classnams, modul) => {
				const tags = GetTagsBy(modul, 'getElementsByClassName', classnams),
					rez = []
				for (const tag of tags)
					if (!tag.classList.contains(C.olga5ignore))
						rez.push(tag)
				return rez
			},
			GetTagsByTagNames: (tagnams, modul) => {
				return GetTagsBy(modul, 'getElementsByTagName', tagnams)
			},
			SelectByClassName: (classnam, modul, do_not_replace_class) => {
				const tags = GetTagsBy(modul, 'querySelectorAll', '[class *=' + classnam + ']'),
					match = Match(classnam),
					rez = []
				for (const tag of tags)
					if (!tag.classList.contains(C.olga5ignore)) {
						const ms = tag.className.match(match)
						if (ms) {
							const quals = [],
								m = ms[0].trim(),
								ss = m.split(mquals)

							if (!do_not_replace_class)  // кромк IniScript-теста ВСЕГДА убираю квалификаторы
								tag.className = tag.className.replace(m, classnam + ' ')

							for (let j = 1; j < ss.length; j++)
								quals.push(ss[j].trim())
							rez.push({ tag: tag, quals: quals, origcls: ms.input })
						}
					}
				return rez
			},
			QuerySelectorInit: (starts, scls) => {
				C.owners.splice(0, C.owners.length)

				const match = Match(scls),
					errs = []
				if (!starts || starts.length == 0)
					C.owners.push({ start: document.body, modules: [], origcls: 'document' }) // специально чуть по-иному
				else
					for (const tag of starts) {
						const quals = [],
							ms = tag.className.match(match)
						if (ms) {
							const
								m = ms[0].trim(),
								ss = m.split(mquals)

							tag.className = tag.className.replace(m, scls)// ВСЕГДА убираю квалификаторы (остальные в ms - не трогать!)

							for (let j = 1; j < ss.length; j++) {
								const modul = ss[j]

								if (C.scrpts.find(scrpt => scrpt.modul == modul)) quals.push(modul)
								else errs.push(modul)
							}
							C.owners.push({ start: tag, modules: quals, origcls: m }) // специально чуть по-иному
							if (C.consts.o5debug > 2)
								console.log(`${olga5_modul}/${modulname} QuerySelectorInit: id='${tag.id}',  '${m}', \n\t${quals}`)
						}
					}
				if (errs.length > 0)
					C.ConsoleError(`Неопределены квалификаторы для '${scls}': `, errs.join(', '))
			}
		})
		return true
	}
	)
})();
/* -global document, window, console,*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  Общий модуль, обязательный при подключении одного (ли несколиких)   моулей библиотеки
 *
 * параметры могут дублироваться командной строкой вызова страницы
 **/

(function () {              // ---------------------------------------------- o5com/CParams ---
	'use strict'
	const olga5_modul = 'o5com',
		modulname = 'CParams',
		C = window.olga5.C,
		csslist = {}, // перечень наименований создаваемых классо
		// repQuotes = /^['"`\s]+|['"`\s]+$/g,
		SplitParams = (s, parnam, dlms = ';') => {
			const errs = [],
				params = {},
				regexp = new RegExp('\\s*[' + dlms + ']\\s*', 'g'),

				regcomments = /(\s+\/\/|#).*?(\n|$|;)/g,

				x = s.replace(/\/\*(.|\n)*?\*\//gm, '').
					replace(regcomments, ';'),		 // убрал оба типа коментов
				spairs = x.trim().split(regexp)

			// const
			// 	match= new RegExp(`\\s*[${dlms}]\\s*$`),
			// 	spairs = []

			// for (const m of mm)
			// 	spairs.push(m[0].replace(/\s+/g, ''))
			// // ,m2=s(Symbol.matchAll(regexp))

			if (C.consts.o5debug > 0) {
				const comments = s.match(regcomments)
				if (comments)
					comments.forEach(comment => {
						if (comment.match(/[^=]=[^=]/))
							errs.push({ par: comment, err: `в комменте подозрительный одиночный '='` })
					})
			}

			for (const spair of spairs)
				if (spair) {
					const pair = spair.split(/\s*=\s*/),
						nam = C.Repname(pair[0].trim())
					if (params[nam])	
						errs.push({ par: spair, err: `повтор '${nam}' (замена)` })
										
					if (pair.length == 1) {
						params[nam] = true
						errs.push({ par: spair, err: `отсутствие '=' (принято =true)` })
					}
					else {
						// const val = (pair[1] || '').replace(match, '').replace(C.repQuotes, '') // .replace(C.repQuote2, '')
						const val = (pair[1] || '').replace(C.repQuote2, '')
						
						if (nam) params[nam] = C.TryToDigit(val)
						else
							if (val.length > 1)
								errs.push({ par: spair, err: `у параметра (с val='${val}') нет имени` })
					}
				}

			if (errs.length > 0)
				C.ConsoleError(`Разбор  параметров `, parnam, errs)

			return params
		},
		DeCodeUrlRfs = (urlrfs, modul) => {
			const urlerrs = [],
				urlsets = []

			for (const nam in urlrfs) {
				const val = urlrfs[nam]
				// if (val.match('myMusikIT'))					
				// console.log(121212)		isurl		
				if (val != null && typeof val !== 'undefined') {
					if (!val.replace)
						alert('значение URL - не строка')
					const url = val.replace(C.repQuotes, ''), //.replace(C.repQuote2, ''),
						wref = C.DeCodeUrl(urlrfs, url)

					if (wref.err.length > 0)
						urlerrs.push({ ori: nam, err: wref.err, url: url })
					urlsets.push({ nam: nam, url: wref.url, 'ориг.': (wref.url != url) ? url : '-"-' })
					urlrfs[nam] = wref.url
				} else
					urlerrs.push({ ori: nam, err: `не определено`, url: '' })
			}

			if (C.consts.o5debug > 0 && urlsets.length == 0)
				C.ConsoleInfo(`${modul}: именованные ссылки отсутствуют`, '   ?')

			if (urlerrs.length > 0)
				C.ConsoleError(`${modul}: недоопределённые ссылки`, urlerrs.length, urlerrs)
		},
		// CopyVals = (xs, c, type) => {
		// 	for (const nam in c) {
		// 		const x = xs.find(x => x.nam == nam)
		// 		if (x) Object.assign(x, { val: c[nam], source: type })
		// 		else xs.push({ nam: nam, val: c[nam], source: type })
		// 	}
		// },
		InitCSS = (W, o5css) => {
			const chs = document.head.children,
				id = W.class + '_internal',
				cmodul = csslist[W.class]
			let err = ''

			if (typeof cmodul === 'undefined') {
				for (const ch of chs)
					if (ch.nodeName == "STYLE" && ch.id == id) {
						err = `Стиль id='${id}' (модуль: '${W.modul}', класс: '${W.class}) уже определён в документе`
						break
					}
			} else
				if (cmodul != W.modul) err = `Класс '${W.class}' повторяется в модулях '${cmodul}' и '${W.modul}. '`

			if (err) C.ConsoleError('>>  создание CSS  ' + err, 'InitCSS')
			else {
				if (C.consts.o5debug > 0)
					console.log(`>>  СОЗДАНИЕ CSS   ${W.class} (для модуля ${W.modul}) с id='${id}'`)
				csslist[W.class] = W.modul

				const styl = document.createElement('style')
				styl.setAttribute('type', 'text/css')
				styl.id = id

				const moeCSS = document.head.appendChild(styl)
				moeCSS.innerHTML = o5css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
				// (\/\/.*$)           мои коменты '//' до конца строки
				// (\/\*(.|\s)*?\*\/)  стандартные коменты (проверить!!! поему-то переносит строки правил)
				// (\s*$)              пустое до конца строки       
			}
		},
		PrintParams = (modul, xs, p, n1) => {
			let n2 = 0
			for (const nam in xs) n2++
			C.ConsoleInfo(`${modul}: все константы '${p}' `, `${('' + n2).padStart(2)} (своих=${('' + n1).padStart(2)})`, xs)
		},
		ParamsFill = function (W, o5css) {
			if (W.isReady)
				return

			const scrpt = C.scrpts.find(scrpt => scrpt.modul == W.modul)

			if (!scrpt) {
				C.ConsoleError(`В 'C.scrpts' не наден модуль `, W.modul)
				return
			}

			if (o5css) InitCSS(W, o5css)

			const m1 = /\s+|\/\/.*$/gm,
				isnew = !!scrpt.script,
				attrs = isnew ? C.GetAttrs(scrpt.script.attributes) : C.o5attrsParamsFillFromScript

			if (!W.origs)
				W.origs = {
					consts: (W.consts || '').replace(m1, ''),
					urlrfs: (W.urlrfs || '').replace(m1, '')
				}

			for (const p of ['consts', 'urlrfs']) {
				const xs = {} // временное хранилилище для считываемых параметров

				for (const nam in C[p]) {
					const source = C.constsurl.hasOwnProperty(nam) ? C.save.urlName : `ядро`
					if (!xs.hasOwnProperty(nam))
						xs[nam] = { val: C[p][nam], source: source }
				}
				if (isnew) {
					const askps = SplitParams(W.origs[p], p, ';'),
						n1 = C.ParamsFillFromScript(xs, askps, attrs, p)

					W[p] = {}	// преобразовываю в объект
					if (p == 'urlrfs') {
						const urls = {}
						for (const nam in xs) urls[nam] = xs[nam].val
						DeCodeUrlRfs(urls, `${W.modul}: `)
						for (const nam in xs)
							xs[nam].url = urls[nam]
					}
					else
						for (const nam in C.constsurl)
							if (xs[nam].source != C.save.urlName)
								Object.assign(xs[nam], { val: C.constsurl[nam], source: `${C.save.urlName}(восстановил)` })

					for (const nam in xs)
						W[p][nam] = xs[nam].val

					if (C.consts.o5debug > 0) PrintParams(W.modul, xs, p, n1)
				}
				else
					if (C.consts.o5debug > 0) C.ConsoleInfo(`${W.modul}: параметры и ссылки берутся только из скрипта ядра библиотеки`)
			}
		}

	C.ModulAddSub(olga5_modul, modulname, url_olga5 => {
		C.urlrfs._url_olga5 = url_olga5

		Object.assign(C, {
			ParamsFill: ParamsFill,
			SplitParams: SplitParams,
		})

		if (C.consts.o5debug > 0) PrintParams(C.save.libName, C.save.xs, C.save.p, C.save.n1)

		const p = 'urlrfs',
			xs = {}, // временное хранилилище для считываемых параметров
			defs = C[p]

		const n1 = C.ParamsFillFromScript(xs, defs, C.o5attrs, p)
		for (const nam in xs) defs[nam] = xs[nam].val

		DeCodeUrlRfs(defs, C.save.libName)

		for (const nam in defs) { xs[nam].url = defs[nam] }
		if (C.consts.o5debug > 0) PrintParams(C.save.libName, xs, p, n1)

		return true
	})
})();
/* -global document, window, console, Map*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  исправление 'src', 'data-src' и 'href' в тегах html-заголовка
 **/
//
(function () {              // ---------------------------------------------- o5com/TagRefs ---
	'use strict'
	let wshp = {}

	const
		olga5_modul = 'o5com',
		modulname = 'TagsRef',
		C = window.olga5.C,
		ReplaceTag = (tagName, change, adrName, url, errs) => {
			const addnew = document.createElement(tagName),
				regExp = new RegExp(/[\\+<>'"`=#\\/\\\\]/)
			let err = false
			for (const attr of change.attributes) {
				if (!err && attr.name.match(regExp)) {
					errs.push({ tag: tagName, ref: attr.name, txt: `cодержит кавычки или '+><=#/'` })
					err = true
				}
				else
					try {
						addnew.setAttribute(attr.name, attr.value) // здесь копирую "как есть" 
					} catch (err) {
						errs.push({ tag: tagName, ref: url, txt: (attr.name + '=' + attr.value), err:err.message })
					}
			}
			addnew.setAttribute(adrName, url)

			change.parentNode.insertBefore(addnew, change)
			change.parentNode.removeChild(change) //  ??  а вот удалять  -м.б. и не надо: для контроля

			return addnew
		},
		ConvertScripts = () => {
			// if (!(Symbol.iterator in Object(window.olga5))) return		//?

			const errs = [],
				scrs = [],
				preloads = [],
				load_snm = {},
				Orig = (obj) => {
					const origs = obj.outerHTML.match(/\s(data-)?src\s*=\s*["*'][^"']*["*']/g)
					if (origs && origs.length > 0) {
						origs.forEach(orig => {
							orig = orig.replaceAll(/["'s*]/g, '')
						})
						return origs.join(', ')
					} else
						return '-нету-'
				}

			for (const w of window.olga5)
				preloads.push({ w: w, orig: Orig(C.o5script), script: C.o5script, isset: false, })

			/*				сначала из тегов <script>, пропуская те, которые в скомпилированном			*/

			const s = C.consts.o5incls.trim(),
				incls = s ? s.split(/\s*[,;]\s*/) : [],
				match_o5 = /\bo5\w+/,  // начинаются с o5
				igns = [],
				needs = {}

			incls.forEach(incl => { if (incl) needs[incl] = 1 })
			for (const script of document.scripts) {
				// if (C.consts.o5debug > 1) console.log(`тег <script>: id= '${script.id}', src= "${script.src}"`)

				// if (script === C.o5script) // это ядро, т.е. конец скриптов (не зависимо от наличия 'o5_scripts')
				// 	break
				if (script === C.o5script) // пропускаю ядро и модуль o5inc
					continue

				if (script.dataset.o5add) continue 		// это добавленный мною скрипт		
				if (script.innerText.trim()) continue	// это встроенный скрипт

				const td = C.TagDes(script, 'src', errs)

				if (!td || !(td.modul.match(match_o5) || (td.trans && !C.consts.o5only)))
					continue

				if (incls.length > 0)
					if (needs[td.modul]) needs[td.modul] = 0
					else {
						igns.push(td.modul)
						continue
					}

				if (load_snm[td.modul])
					errs.push({ tag: td.modul, ref: td.orig, txt: 'повторная загрузка модуля' })
				load_snm[td.modul] = td.orig // перезаписываю!

				const w = window.olga5.find(w => w.modul == td.modul),
					scrpt = { modul: td.modul, orig: td.orig, act: { W: w, need: false }, script: script, }
				let dochg = ''
				if (!w || td.code == '_' || (td.trans && td.code != 'data-')) {
					dochg = !w ? 'новый  ' : 'замена '
					if (C.consts.o5debug > 1) console.log(`тег <script>: id= '${script.id}' -> в обработку (${dochg}): orig=${td.orig}`)

					scrpt.act.W = null
					let url = td.orig
					if (td.trans) {
						const wref = C.DeCodeUrl(C.urlrfs, td.orig)
						if (wref.err)
							errs.push({ tag: td.modul, ref: td.from, txt: wref.err })
						url = wref.url
					}
					if (!script.getAttribute('async') && !script.getAttribute('defer'))
						script.setAttribute('async', '')
					scrpt.script = ReplaceTag('script', script, 'src', url, errs)
				}

				C.scrpts.push(scrpt)
				scrs.push({
					modul: scrpt.modul,
					orig: scrpt.orig,
					src: scrpt.script.src,
					txt: dochg + td.from
				})
			}
			/*				дописываю те, которые в скомпилированном и отсутствуют в SCRIPT's			*/
			for (const w of window.olga5) {
				const modul = w.modul
				if (!C.scrpts.find(scrpt => scrpt.modul == modul))
					// if (!igns(modul)) {
					if (!igns.includes(modul)) {
						C.scrpts.push({ modul: modul, orig: '', act: { W: w, need: false }, script: C.o5script })
						scrs.push({ modul: modul, orig: '', src: C.o5script.src, txt: `из скомпилированного` })
					}
			}

			/* строю зависимости cкриптов (сначала идут скомпилированные) - сначала по 'o5depends'*/
			const ss = C.consts['o5depends'].split(/\s*[;]+\s*/),
				sinc = 'o5inc',
				o5inc = C.scrpts.find(scrpt => scrpt.modul == sinc)

			for (const s of ss) {
				const uu = s.trim().split(/\s*[:=]+\s*/), // split(/[:=]/), // 
					u = uu[0],
					rfs = uu[1] ? uu[1].split(/\s*,\s*/) : []
				if (u) {
					const scrpt = C.scrpts.find(scrpt => scrpt.modul == u)
					if (scrpt) {
						scrpt.depends ||= (scrpt.modul != sinc && o5inc) ? [o5inc] : []
						for (const rf of rfs)
							if (rf != sinc) { // уже и так включено
								const scr = C.scrpts.find(scrpt => scrpt.modul == rf)
								if (scr && !scrpt.depends.includes(scr))
									scrpt.depends.push(scr)
							}
					}
				}
			}

			// const depends = []
			// for (const s of ss) {
			// 	const uu = s.trim().split(/\s*[:=]+\s*/)
			// 	depends.push({ modul: uu[0], rfs: rfs })
			// }
			// for (const scrpt of C.scrpts) {
			// 	scrpt.depends ||= (scrpt.modul != sinc && o5inc) ? [o5inc] : []
			// 	for (const depend of depends)
			// 		if (depend.modul == scrpt.modul) 
			// 			for (const rf of depend.rfs)
			// 				if (!scrpt.depends.includes(rf)) // уже и так включено
			// 					scrpt.depends.push(scr)
			// }

			/* -"- тепер для остальны */
			const sdeps = [],
				cdeps = []
			for (const scrpt of C.scrpts) {
				if (!scrpt.depends)
					scrpt.depends = scrpt.script.attributes.hasOwnProperty('async') ? [] : cdeps.concat(sdeps)
				if (scrpt.orig) sdeps.push(scrpt)
				else cdeps.push(scrpt)
			}
			/* в отладочном режиме - делаю проверку*/
			if (C.consts.o5debug > 0) {
				let scrpt = null
				const list = [],
					errs = [],
					ChectForRev = (modul, depends) => {
						let ok = true
						list.push(modul)
						for (const depend of depends)
							if (depend === scrpt) {
								errs.push({ scrpt: scrpt.modul, refs: list.join('-> ') })
								ok = false
							}
						if (depends.length > 0 && ok)
							for (const depend of depends)
								ChectForRev(depend.modul, depend.depends)
						list.pop()
					}
				for (scrpt of C.scrpts)
					ChectForRev(scrpt.modul, scrpt.depends)
				if (errs.length > 0)
					C.ConsoleError(`зацикленные ссылки в зависимостях модулей`, errs.length, errs)
			}

			const errneeds = []
			for (const need in needs) {
				if (needs[need]) errneeds.push(need)
			}
			if (errneeds.length > 0)
				C.ConsoleError(`Из заданных в 'o5incls' отсутствуют модули:`, errneeds.join(', '))
			// сюда проверь!?
			if (C.consts.o5debug > 0) {
				if (scrs.length > 0) C.ConsoleInfo("Найденные olga5 SCRIPT'ы : ", scrs.length, scrs)
				else C.ConsoleInfo("Не найдены olga5 SCRIPT'ы ?")

				if (igns.length > 0)
					C.ConsoleInfo(`Проигнорированы скрипты, отсутствующие в 'o5incls': `, igns.join(', '))

				if (C.consts.o5debug > 1) { // тестирование атрибутов
					const errs = []
					for (const scrpt of C.scrpts)
						for (const attr of scrpt.script.attributes)
							if (!attr.name || attr.name.match(/['"`\+\.,;]/))
								errs.push({ 'атрибут': attr.name, 'скрипт': scrpt.script.src, })
					if (errs.length > 0)
						C.ConsoleError(`${errs.length} странных атрибутов (м.б. перепутаны кавычки?) у скрипта`, s, errs)
				}
			}
			if (errs.length > 0)
				C.ConsoleError(`Ошибки в преобразовании SCRIPT `, errs.length, errs)

			for (const scrpt of C.scrpts) {
				Object.assign(scrpt.act, { done: 0, start: 0, timeout: 0, timera: null, incls: null, })
				Object.seal(scrpt.act)
				Object.freeze(scrpt)
			}
			Object.freeze(C.scrpts)

			scrs.splice(0, scrs.length)
			errs.splice(0, errs.length)
		},
		ConvertLinks = () => {
			const links = [],
				errs = []
			for (const child of document.head.children)
				if (child.tagName.toLowerCase() == 'link') {
					const td = C.TagDes(child, 'href', errs)
					if (!td.orig) {
						C.ConsoleError(`обнаружен <link> без 'href', '_href' или 'data-href': `, child.outerHTML, null)
						continue
					}
					if (td.trans) { 									// для link'ов не надо проверять 'o5'
						const wref = C.DeCodeUrl(C.urlrfs, td.orig)
						if (wref.err)
							errs.push({ tag: td.modul, ref: td.from, txt: wref.err })

						ReplaceTag('link', child, 'href', wref.url, errs)
						links.push({ orig: td.orig, src: wref.url, txt: td.from })
					}

					wshp.o5iniready ||= child.href.match(/\/o5ini\.css$/)
				}

			if (C.consts.o5debug > 0)
				if (links.length > 0) C.ConsoleInfo("Скорректированные LINK'и : ", links.length, links)
				else C.ConsoleInfo("Скорректированных LINK'ов нет ")

			if (errs.length > 0)
				C.ConsoleError(`Ошибки в преобразовании LINK `, errs.length, errs)

			links.splice(0, links.length)
			errs.splice(0, errs.length)

		}

	wshp = C.ModulAddSub(olga5_modul, modulname, () => {
		ConvertScripts()
		ConvertLinks()
	})
})();
/* -global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  загрузка (при необходимости) и инициализация подключаемых скриптов
 **/
//
(function () {              // ---------------------------------------------- o5com/IniScripts ---
	'use strict'
	const olga5_modul = 'o5com',
		modulname = 'IniScripts',
		C = window.olga5.C,
		myclr = "background: blue; color: white;border: none;"
	class MyEvents {
		doceves = ['DOMContentLoaded', 'readystatechange', 'visibilitychange', 'blur']
		meves = []
		constructor(list) {
			const meves = list.trim().split(/\s*[,;]\s*/) || []
			for (const meve of meves) {
				const ss = meve.trim().split(/\s*[:]\s*/)
				if (ss[0].length > 0) {
					const eve = ss[0],
						su = ss[1] ? ss[1].toUpperCase() : '',
						isd = su == 'D' ? true : (su == 'W' ? false : this.doceves.includes(eve))
					this.meves.push({ eve: eve, isd: isd })
				}
				// this.meves.push({ eve: ss[0], isd: ss[1] && ss[1].toUpperCase() == 'D' })
			}
			Object.freeze(this)
		}
		AddEvents = (Fun) => { // addEventListener
			for (const meve of this.meves)
				if (meve.isd) document.addEventListener(meve.eve, Fun, true)
				else
					window.addEventListener(meve.eve, Fun)
			// C.E.AddEventListener(meve.eve, Fun)
		}
		RemEvents = (Fun) => { // addEventListener
			for (const meve of this.meves)
				if (meve.isd) document.removeEventListener(meve.eve, Fun, true)
				else {
					window.removeEventListener(meve.eve, Fun)
					// C.E.RemoveEventListener(meve.eve, Fun)
				}
		}
	}
	class MyTimer {
		constructor(text) {
			this.text = text
			this.act = { time: 0, name: '' }
			Object.seal(this.act)
			Object.freeze(this)
		}
		Stop = (add) => {
			// console.log('...=', this.act.time,  this.act.name)
			if (this.act.time) {
				const dt = (' ' + (Number(new Date()) - this.act.time)).padStart(8) + ' ms',
					name = dt + ' ' + this.act.name.padStart(12)
				if (add)
					console.error('%c%s', "background: yellow; color: black;border: none;",
						this.text + name + ' [' + add + ']')
				else {
					console.log('%c%s', myclr, this.text + name)
					this.act.time = 0
				}
			}
		}
		Start = (name) => {
			if (this.act.time)
				this.Stop('не закончено')

			this.act.time = Number(new Date())
			this.act.name = name
			// console.log('...+', this.act.time,  this.act.name)
		}
	}
	const
		DocURL = () => document.URL.match(/[^?&#]*/)[0].trim(),
		/**
		 * InitScripts(nam) - выполнение очередного требуемого скрипта
		 * 			ВЫЗЫВАЕТСЯ: 
		 * 				- в конце инициализации данного скрипта
		 * 				- по событиям загрузки и/или обновления документа
		 * 				- по событиям загрузки и/или инициализаации очередного скрипта
		 * 			ВЫПОЛНЯЕТСЯ если документ содержит тег '.olga5_Start' (или загружен тест)
		 * 				или документ уже загружен/обновлён, или вызов был по обновлению документа
		 * @param {nam} наименование скрипта (для протокола)
		 * @param {isok}  необязательный признак готовности документа (наименование события)
		 */
		InitScripts = nam => {
			if (!(C.page && C.page.pact && C.page.pact.ready)) {
				if (C.consts.o5debug > 1)
					console.log(`--->>>     ______ InitScripts _____     ${nam} -- return`)
				return
			}

			if (C.consts.o5debug > 1)
				console.log(`--->>>     ______ InitScripts _____     ${nam} `)
			const start = C.page.pact.start
			for (const scrpt of C.scrpts) {
				const act = scrpt.act
				// if (act.W.modul=='o5inc')				
				// act.timera =0
				if (!act.timera)
					act.timera = new MyTimer(`---<<<             инициирован `)
				if (start != act.start && act.W && !act.incls)
					if (act.need && act.W.Init) {
						const depend = scrpt.depends.find(depend => (depend.act.need && depend.act.done != start))
						if (!depend) {
							if (C.consts.o5debug > 1)
								console.log(`--->>>     ______ начало нинициализации _____     ${act.W.modul} `)
							act.start = start
							act.timera.Start(act.W.modul)
							act.W.Init()
						}
					} else
						Object.assign(act, { start: start, done: start })
			}
		},
		OnInit = e => {	//  завершение инициализации очередного скрипта
			if (!e.detail || !e.detail.modul) {
				C.page.errs.push({ modul: '?', err: `для события '${e.type}' НЕ указан 'detail' или 'detail.modul'` })
				return
			}

			const modul = e.detail.modul.trim(),
				scrpt = C.scrpts.find(scrpt => scrpt.modul == modul),
				start = C.page.pact.start,
				lefts = []
			C.scrpts.forEach(scr => {
				if (scr.modul != modul && scr.act.done != start && scr.act.need)
					lefts.push(scr.modul)
			})
			if (C.consts.o5debug > 1) {
				console.log(`- - > после инициализации '${modul}': ` +
					(lefts.length > 0 ? `осталось:  ${lefts.join(', ')}` : ` не осталось`))
			}
			if (scrpt) {
				const act = scrpt.act
				act.timera.Stop('')
				act.done = act.start
				if (lefts.length > 0)
					InitScripts(`инициирован '${modul}'`)
				else
					C.page.PageFinish(0)
			} else
				C.page.errs.push({ modul: modul, err: `для события '${e.type}' указан несуществующий модуль` })
		},
		OnLoad = e => {	// завершение загрузки очередного скрипта
			const start = C.page.pact.start,
				newloads = [],
				Included = modul => {
					const nam = `загружены включения для '${modul}'`,
						scrpt = C.scrpts.find(scrpt => scrpt.modul == modul)
					if (C.consts.o5debug > 0)
						console.log(`OnLoad: '${nam}'`)

					scrpt.act.incls = ''
					// const debug = window.open("", "", "width=200,height=100");
					InitScripts(nam)
				}

			if (C.consts.o5debug > 1)
				console.log('- - > после загрузки ' + (e ? ` '${e.detail.modul}'` : ` ядра`))
			for (const scrpt of C.scrpts) {
				const w = scrpt.act.W || window.olga5.find(x => x.modul == scrpt.modul)
				if (w) {
					if (scrpt.act.start != start || !scrpt.act.W) {
						scrpt.act.W = w
						newloads.push(w.modul)
					}
					if (w.incls && scrpt.act.incls == null) {
						scrpt.act.incls = w.incls
						C.IncludeScripts({
							modul: w.modul,
							names: w.incls.names,
							actscript: w.incls.actscript,
							iniFun: Included,
							args: [w.modul]
						})
					}
				}
			}
			if (C.consts.o5debug > 2)
				console.log('    > ' + newloads.length ? ` (готовы к инициации: ${newloads.join(', ')})` : ' (но инициировать нечего)')

			if (newloads.length > 0)
				InitScripts(`загрузка [${newloads.join(', ')}]`)
		}

	class Page {
		pact = { url: '', ready: false, start: 0, timerp: new MyTimer("}==  КОНЕЦ  обработки  страницы"), timer: 0, mos: [] }
		errs = []
		ScriptsFinish = e => { // закрытие всех новых элементов страницы

			const pact = this.pact
			if (!pact.ready) return

			pact.ready = false

			const n0 = this.childs.length
			if (C.consts.o5debug > 0) console.log('%c%s', myclr,
				`}=====< закрытие по '${e.type}' (n= ${n0}) страницы "${pact.url}"`)

			let n = n0
			while (n-- > 0) {
				const child = this.childs[n],
					owner = child.aO5_pageOwner
				for (const item of owner.children)
					if (item == child) {
						// item.remove()
						item.style.display = 'none'
						owner.removeChild(item)
						break
					}
			}
			this.childs.splice(0, n0);

			C.scrpts.forEach(scrpt => {
				const act = scrpt.act
				if (act && pact.start == act.start && act.W && act.W.Done)
					act.W.Done()
			})

			this.donePage.RemEvents(this.ScriptsFinish)
			// window.dispatchEvent(new window.Event('olga5_done'))
			C.E.DispatchEvent('olga5_done')
		}
		ScriptsStart = () => {  // начало обработки страницы

			C.QuerySelectorInit(this.starts, this.olga5Start) //  чтобы пересчитало область определения

			for (const scrpt of C.scrpts) { // делаем при каждой инициализации
				if (C.owners.length == 0) scrpt.act.need = true
				else {
					scrpt.act.need = false
					for (const owner of C.owners) {
						if (owner.modules.length == 0) scrpt.act.need = true
						else
							scrpt.act.need = !!owner.modules.find(modul => modul == scrpt.modul)
						if (scrpt.act.need) break
					}
				}
			}
			if (C.consts.o5debug > 0) {
				let asknoneed = []
				for (const scrpt of C.scrpts)
					if (!scrpt.act.need)
						asknoneed.push(scrpt.modul)
				const l = asknoneed.length
				if (l > 0)
					C.ConsoleError(`В скриптах заданы ${l} 'ненужн${l > 1 ? 'ых' : 'ый'}' модул${l > 3 ? 'ей' : (l > 1 ? 'я' : 'ь')}: `, asknoneed.join(', '))
			}

			if (C.consts.o5doscr) {  // запуск встроенных cкриптоав
				const scrs = C.GetTagsByTagNames('script'),
					scriptDone = C.consts.o5doscr,
					m = new RegExp('\\bdocument\\.currentScript\\.setAttribute\\s*\\(\\s*[\'`"]' + scriptDone + '.*?(;|\\n|$)', 'i')

				for (const scr of scrs) {
					const matchs = scr.innerText.match(m)
					if (matchs) {
						const atr = scr.attributes[scriptDone]
						if (!atr || atr.value != 1) {
							const s = scr.innerText.replace(matchs[0], '')
							if (C.consts.o5debug > 0)
								console.log(`Выполняется скрипт: \n${s}`)
							eval(s)
							scr.setAttribute(scriptDone, 1)
						}
					}
				}
			}
		}
		PageFinish = bytimer => { // конец инициалзации страницы
			const pact = this.pact
			pact.timerp.Stop(bytimer ? 'таймер' : '')
			if (pact.timer > 0) {
				window.clearTimeout(pact.timer)
				pact.timer = 0
			}
			if (document.body.classList.contains(this.cls))
				document.body.classList.remove(this.cls)

			if (bytimer) {
				for (const scrpt of C.scrpts) {
					const act = scrpt.act
					let err = ''
					if (!err) {
						if (!act.W) err = "не загружен файл "
						else if (act.start == 0) err = "инициализация не начиналась?"
						else if (act.start != act.done) err = "инициализация не закончилась"
					}
					if (err) this.errs.push({ modul: scrpt.modul, err: err })
				}
			}

			const errs = this.errs
			if (errs.length > 0) {
				C.ConsoleError(`Скрипты ${bytimer ? 'НЕ' : ''} завершились (есть ошибки)`, errs.length, errs)
				errs.splice(0, errs.length) //  могут еще завершиться и без ошибок
			}
			if (pact.mos) {
				const mos = this.pact.mos
				for (const mo of mos)
					mo.disconnect()
				// mo = null
				mos.splice(0, mos.length)
				// mos = null
			}
			this.loadDone.RemEvents(OnLoad)
			this.initDone.RemEvents(OnInit)
			// window.dispatchEvent(new window.Event('olga5_ready'))
			C.E.DispatchEvent('olga5_ready')
		}
		PageStart = (url) => {
			if (C.consts.o5debug > 0)
				console.log('%c%s', myclr, "----- старт обработки страницы ", url)

			if (!document.body.classList.contains(this.cls))
				document.body.classList.add(this.cls) // это если есть такой класс

			const pact = this.pact
			pact.timerp.Start(url)
			if (C.consts.o5timload) {
				if (pact.timer > 0) window.clearTimeout(pact.timer)
				pact.timer = window.setTimeout(this.PageFinish, 1000 * C.consts.o5timload, true)
			}

			this.loadDone.AddEvents(OnLoad)
			this.initDone.AddEvents(OnInit)
			this.donePage.AddEvents(this.ScriptsFinish)

			this.errs.splice(0, this.errs.length)
			this.ScriptsStart()
			// InitScripts(`загружена страница '${url}'`)

			OnLoad()  // после InitScripts
		}
		clr = "background: green;color:white;"
		CheckInit = (e, second) => { // проверка и начало инициализации страницы !
			const o5inc = 'o5inc',
				pact = this.pact,
				url = DocURL(),
				starts = document.querySelectorAll("[class *= '" + this.olga5Start + "']"),
				isolga5 = starts && starts.length,
				isloaded = document.readyState == 'complete' ||
					(url.match(/\bolga5-tests\b/i) && document.readyState == 'interactive'),
				isnew = pact.url != url || !pact.ready

			if (C.consts.o5debug > 1 && e) {
				console.groupCollapsed('%c%s', this.clr, '____>  ' + e.type.padEnd(22) +
					(isolga5 ? 'ДА ' : '  ') + (isnew ? 'новая ' : 'повт. ') +
					document.readyState[0] + ':' + url.padEnd(55))
				for (const nam in e)
					if (nam != 'type' && !(e[nam] instanceof Function)) console.log(nam.padEnd(24), e[nam])
				console.groupEnd()
			}
			// if (isloaded && !C.scrpts.finish){ // уточняю конечный список скриптов - м.б. еще чего ждать
			// 	C.scrpts.finish=true
			// }
			if (isnew && isloaded) {

				pact.start = Number(new Date()) + Math.random()

				let w = null,
					o5include = null
				if (!second) {
					o5include = document.querySelector('[o5include]')
					w = window.olga5.find(modul => modul.modul == o5inc)

					if (!w && o5include) C.ConsoleError(`Имеется тег с атрибутом 'o5include' но отсутствует модуль '${o5inc}'`)
					else
						if (w && !o5include && C.consts.o5debug > 0)
							C.ConsoleInfo(`¿ Задан модуль '${o5inc}' но отсутствует тег с атрибутом 'o5include' ?`)
				}


				// забрать в общую обработку
				// проверить, чтобы в очерёдности обработки o5inc  всегда было первым!				
				// 				if (w && o5include) {
				// 					const
				// 						scrpt = C.scrpts.find(scrpt => scrpt.modul == o5inc)
				// 					if (scrpt)
				// 						Object.assign(scrpt.act, { W: w, start: pact.start, done: pact.start, need:false })
				// 					else
				// 						C.ConsoleError(`Не найден scrpt для modul='${o5inc}'`)

				// 					// window.addEventListener('olga5-incls', e => this.CheckInit(e, true))	//1
				// 					C.E.AddEventListener('olga5-incls', e => this.CheckInit(e, true))	//1
				// 					w.Init()
				// 				}
				// 				else


				if (isolga5) {
					this.ScriptsFinish(e)
					Object.assign(pact, { url: url, ready: true })

					pact.mos.splice(0, pact.mos.length)

					this.starts.splice(0, this.starts.length)
					for (let i = 0; i < starts.length; i++)
						this.starts[i] = starts[i]

					this.PageStart(url)
				}
				else
					C.ConsoleError(`Отсутствует тег с класом '${this.olga5Start}'`) // или атрибутом 'o5include'`)
			}
		}
		CheckHide = e => { // проверка и начало инициализации страницы
			const pact = this.pact,
				url = DocURL()

			if (pact.url != url && pact.ready) {
				console.log('%c%s', this.clr, '____<  ' + e.type.padEnd(22) + ' закрыл: ' + url.padEnd(55))

				this.ScriptsFinish(e)
				pact.url = url
			}
		}
		AppendChild = (owner, child) => {
			child.aO5_pageOwner = owner
			owner.appendChild(child)
			this.childs.push(child)
		}
		InsertBefore = (owner, child, reference) => {
			child.aO5_pageOwner = owner
			owner.insertBefore(child, reference)
			this.childs.push(child)
		}

		constructor() {
			this.olga5Start = 'olga5_Start'
			this.cls = 'olga5_isLoading'
			this.childs = []
			this.starts = []

			const initEvents = new MyEvents(C.consts.o5init_events)
			initEvents.AddEvents(this.CheckInit)	//{ capture: true }

			const closeEvents = new MyEvents(C.consts.o5hide_events)
			closeEvents.AddEvents(this.CheckHide)	//{ capture: true }

			this.donePage = new MyEvents(C.consts.o5done_events)
			this.loadDone = new MyEvents('olga5_sload')
			this.initDone = new MyEvents('olga5_sinit')
			Object.seal(this.pact)
			Object.freeze(this)
		}
	}

	let wshp = C.ModulAddSub(olga5_modul, modulname, () => {
		if (C.consts.o5debug > 0) console.log(` ===  инициализация ${olga5_modul}/${modulname}.js`)

		if (C.consts.o5nomnu > 0)
			document.body.classList.add('o5nomnu')

		if (C.consts.o5noact > 0) {
			((C && C.consts.o5debug > 0) ? C.ConsoleError : console.log)("}---> загружено `ядро библиотеки`, но инициализация ОТКЛЮЧЕНА по o5noact= '" + C.consts.o5noact + "'")
			return
		}

		if (C.scrpts.length > 0) {
			Object.assign(C, {
				page: new Page(),
			})
			C.E.Init()  // сброс событий
		}
		else {
			C.ConsoleInfo(`IniScripts.js: вообще нет скриптов для обработки`)
			// window.dispatchEvent(new window.Event('olga5_ready'))
			C.E.DispatchEvent('olga5_ready')
		}

		return true
	}
	)

	if (wshp.AscInclude)
		wshp.AscInclude()
})();/* -global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o5inc ---	
	'use strict'
	let
		incls = null
	const
		pard = window.location.search.match(/(&|\?|\s)(is|o5)?(-|_)?debug\s*(\s|$|\?|#|&|=\s*\d*)/),
		o5debug = (pard ? (pard[0].match(/=/) ? parseInt(pard[0].match(/\s*\d+/) || 1) : 1) : 2),
		clrs = {	//	копия из CConsole
			'E': "background: yellow; color: black;border: solid 1px gold;",
			'I': "background: beige;  color: black;border: solid 1px bisque;",
		},
		C = window.olga5 ? window.olga5.C : {
			consts: {
				o5debug: o5debug
			},
			avtonom: true,
			ConsoleInfo: (head, txt, rezs) => {
				console.groupCollapsed('%c%s', clrs['I'], head + ' - ' + txt)
				console.table(rezs)
				console.trace()
				console.groupEnd()
			},
			ConsoleError: (head, ne, rezs) => {
				console.groupCollapsed('%c%s', clrs['E'], head + ` - есть ${ne} ошибок!`)
				console.table(rezs)
				console.trace()
				console.groupEnd()
			},
		},
		_div = document.createElement('div'),
		W = {
			modul: 'o5inc',
			Init: InclStart,
			consts: 'o5getall=true; o5isfinal=1',
		},
		o5include = 'o5include',
		InclFinish = () => {
			let ok = true
			for (const url in incls)
				if (incls[url].err) {
					ok = false
					break
				}
			if (!ok || C.consts.o5debug > 0) {
				const head = `${W.modul}:  обработка 'CInclude'`,
					rezs = []

				for (const url in incls) {
					const incl = incls[url]
					rezs.push({ ori: incl.ori, url: incl.url, err: incl.err || 'OK', })
				}

				if (ok) C.ConsoleInfo(head, 'OK', rezs)
				else
					C.ConsoleError(head + ' - есть ошибки:', rezs.length, rezs)
			}

			// window.dispatchEvent(new CustomEvent('olga5_sinit', { detail: { modul: W.modul } }))
			// window.dispatchEvent(new CustomEvent('olga5-incls', { detail: { modul: W.modul } }))
			if (W.consts.o5isfinal)
				C.E.DispatchEvent('olga5_sinit', W.modul)
			if (C.avtonom) {
				const e = new CustomEvent('olga5-incls', {modul:W.modul})
				window.dispatchEvent(e)
			}
			else
				C.E.DispatchEvent('olga5-incls', W.modul)
		},
		AddIncls = (tags) => {
			// console.log(`INC_1 `)
			const errs = [],
				IsDisplay = tag => {
					let div = tag
					while (div.tagName.match(/div/i)) {
						const nst = window.getComputedStyle(div),
							display = nst.getPropertyValue('display')
						if (display == 'none') {
							return false
						}
						div = div.parentNode
					}
					return true
				}
			for (const tag of tags) // группировка по url'ам, чтобы не грузить лишнее
				if (W.consts.o5getall || IsDisplay(tag)) {
					const ref = tag.getAttribute(o5include)

					tag.removeAttribute(o5include)
					tag.setAttribute('_' + o5include, ref)  // так... для истории

					const
						ss = ref.split(/[?!]/),
						ori = ss[0].trim(),
						wref = (C.DeCodeUrl) ? C.DeCodeUrl(C.urlrfs, ori, '') : { url: ori, err: '' }
					if (wref.err) {
						if (!errs.contains(ori)) errs.push(ori)
						continue
					}

					const url = wref.url,
						sel = ss.length > 1 ? ss[ss.length - 1] : ''
					let incl = incls[url]
					if (!incl) {
						incl = {
							ori: ori,
							url: url,
							mtags: [], err: '', text: '', done: false, isent: false,
							xhr: new XMLHttpRequest(),
						}
						Object.seal(incl)
						incls[url] = incl

						Object.assign(incl.xhr, {
							incl: incl,
							onload: OnLoad,
							onerror: OnError,
							timeout: 10000,
							responseType: 'text',
							withCredentials: true,
						})
						incl.xhr.open("get", url, true)
					}
					incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.indexOf('!') >= 0 }) // на случай если и '?' и '&'
				}

			// console.log(`INC_2 `, incls)
			let n = 0
			for (const url in incls) {
				const incl = incls[url]
				if (!incl.isent) {
					incl.isent = true
					incl.xhr.send()
				}
				else
					if (incl.done)	//	но если файл уже был загружен, то не надо ждать					
						DoLoad(incl)
				n++
			}
			return n
		},
		AskFinish = (incl, ok) => {

			if (!ok) console.log(`========  o5inc.OnLoad(${incl.xhr.status})   ${incl.xhr.responseURL}`)
			else
				if (C.consts.o5debug > 0) console.log(`========  o5inc.OnLoad(${incl.xhr.status})  ------ ${incl.xhr.responseURL}`)

			for (const url in incls)
				if (!incls[url].done)
					return

			InclFinish()
		},
		DoLoad = incl => {
			// const errs = [],
			// 	u = incl.xhr.responseText,
			// 	m1 = u.match(/<\s*body/),
			// 	m2 = u.match(/<\/\s*body\s*>/)
			// _div.innerHTML = u.substring(m1.index, m2.index)+'</body>' // incl.xhr.responseText.substring(i)

			const errs = [],
				mm = incl.xhr.responseText.match(/<body[^>]*>/),
				i = mm.index

			// _DIV.innerHTML = mm[0].replace(/<\bbody\b/, '<div') +
			// 	incl.xhr.responseText.substring(i) +
			// 	'\n</div>'
			// const _div = _DIV.children[0]
			_div.innerHTML = incl.xhr.responseText.substring(i)

			if (C.consts.o5debug > 1) {
				console.groupCollapsed(`${W.modul} : Обрабатывается`)
				console.log(_div.innerHTML)
				console.groupEnd()
			}
			const tags = []
			for (const mtag of incl.mtags)
				if (!mtag.done) {
					mtag.done - true
					const
						sel = mtag.sel,
						tag = mtag.tag

					let srcs = null,
						outer = mtag.outer
					if (sel) {
						switch (sel[0]) {
							case '[': srcs = _div.querySelectorAll(sel)
								break
							case '#': srcs = _div.querySelectorAll(`[id='${sel.substring(1)}']`)
								break
							case '.': {
								const s = sel.substring(1),
									ss = s.split(/\s*:\s*/g),
									cc = ss[0],
									qs = _div.querySelectorAll("[class *= '" + cc + "']"),
									mcc = new RegExp('\\b' + cc + '\\b(:\\w*)*', 'g')
								if (qs)
									for (const q of qs) {
										const m = q.className.match(mcc)
										if (m) {
											const mm = m[0].split(/\s*:\s*/g)
											let kv = true
											for (let i = 1; i < ss.length; i++) {
												let ok = false
												for (let j = 1; j < mm.length; j++)
													if (mm[j] == ss[i]) {
														ok = true
														break
													}
												if (!ok) {
													kv = false
													break
												}
											}
											if (kv) {
												if (!srcs) srcs = []
												srcs.push(q)
											}
										}
									}
								break
							}
							default: srcs = _div.getElementsByTagName(sel)
						}
						if (!srcs || srcs.length == 0) {
							errs.push(sel)
							continue
						}
					}
					else {
						srcs = [_div]  // для всего "тела" 1ищвн 2 не включаем
						outer = false
					}

					for (const src of srcs) {
						const s = outer ? src.outerHTML : src.innerHTML
						if (C.consts.o5debug > 1)
							tag.innerHTML += `\n<!-- вставка с id='${src.id}' -->`

						if (outer) //!tag.innerHTML &&
							tag.innerHTML += '\n'
						tag.innerHTML += s.trimRight() + '\n' // тут '\n' надо для "красоты" в тестах
					}
					tags.concat(tag.querySelectorAll("div[" + o5include + "]") || [])

					// const scrpts = tag.getElementsByTagName('script')
					// // for (const scrpt of scrpts){
					// if (scrpts.length > 0) {
					// 	const scrpt = scrpts[0],
					// 		script = document.createElement('script')
					// 	script.innerHTML = "console.log('-234-')"
					// 	// tag.appendChild(script)
					// 	scrpt.parentNode.insertBefore(script, scrpt)
					// }

				}
			if (errs.length > 0)
				incl.err = `не опр. '${errs.join(', ')}'`

			if (tags && tags.length > 0)
				AddIncls(tags)
		},
		OnLoad = function () {
			const
				xhr = this,
				incl = xhr.incl

			if (C.consts.o5debug > 0) {
				console.groupCollapsed(`${W.modul} : прочитан (${xhr.status}) url='${xhr.responseURL}'`)
				console.log(xhr.responseText)
				console.groupEnd()
			}
			incl.done = true


			if (xhr.status == 200)
				DoLoad(incl)
			else
				incl.err = `статус загрузки = ${xhr.status}`

			// delete incl.xhr  надо бы удалять, ео не получается

			AskFinish(incl, true)
		},
		OnError = function () {
			const incl = this.incl
			incl.err = 'ошибка загрузки (блокировано by CORS ?)'
			incl.done = true
			AskFinish(incl, false)
		}

	function InclStart(e) {
		if (C.consts.o5debug > 0) {
			console.log(`========  инициализация '${W.modul}'   ------` +
				` ${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'} `)
			_div.style.display = 'none'
			_div.id = 'moe'
			if (C.consts.o5debug > 1) {
				_div.title = "моя копия: чтобы посмотреть, чего загрузили"
				document.body.appendChild(_div)
			}
		}
		if (C.ParamsFill)
			C.ParamsFill(W)
		const tags = document.querySelectorAll("div[" + o5include + "]")
		let n = 0

		// console.log(`INC_0 `)
		if (tags && tags.length > 0) {
			incls = {}
			n = AddIncls(tags)
		}

		if (n == 0)
			InclFinish()
	}

	window.addEventListener(o5include, InclStart)
	if (C.avtonom) {
		document.addEventListener('DOMContentLoaded', InclStart)

		if (o5debug)
			console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
	}
	else
		C.ModulAdd(W)
})();
/* -global document, window, console, Object*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/*eslint no-useless-escape: 0*/
(function () { // 3---------------------------------------------- o5tab ---
	'use strict';

	const
		pard = window.location.search.match(/(\&|\?|\s)(is|o5)?(-|_)?debug\s*(\s|$|\?|#|&|=\s*\d*)/),
		o5debug = (pard ? (pard[0].match(/=/) ? parseInt(pard[0].match(/\s*\d+/) || 1) : 1) : 2),
		o5tagTable = "§¶▸▹↢⇔↣ₔᐞ⇅¿",
		C = window.olga5 ? window.olga5.C : { // заменитель библиотечного
			consts: {
				o5debug: o5debug,
				o5tag_table: o5tagTable
			},
			avtonom: true,
			incdone: false,
			GetTagsByQueryes: query => document.querySelectorAll(query), // второй аргумент - игнорится			
		},
		// currentScript = document.currentScript,
		W = {
			modul: 'o5tab',
			Init: TabInit,
			consts: `o5tag_table= ${o5tagTable}`,
			urlrfs: '',
		},
		cc_span = 'o5tab-span',
		cc_odd = 'o5tab-odd',
		SortTab = e => {
			let up =0
			const th = e.target,
				cc_Up = 'o5tab-sortUp',
				cc_Dn = 'o5tab-sortDn',
				aO5 = th.aO5tab,
				tr = th.parentElement,
				trpa = tr.parentElement,
				table = trpa.tagName == 'TABLE' ? trpa : trpa.parentElement,
				m = th.getAttribute('issort') - 1, // столбцы нумеруют от 1
				mm2 = Number.MAX_SAFE_INTEGER,
				mm1 = mm2 - 1,
				NumsSort = (v1, v2) => {
					return (v1.v == v2.v) ? 0 : ((up && v1.v > v2.v) || (!up && v1.v < v2.v) ? 1 : -1)
				}
			for (const tbody of table.tBodies) {
				const nums = []
				for (let i = 0; i < tbody.rows.length; i++) {
					const r = tbody.rows[i],
						c = r.cells[m],
						u = c ? c.innerText : mm1,
						v = isNaN(u) ? mm2 : parseFloat(u)
					nums.push({
						i: i,
						v: v,
						r: r
					})
				}

				for (const cell of tr.cells)
					if (cell.aO5tab) {
						cell.classList.remove(cc_Up)
						cell.classList.remove(cc_Dn)
					}
				up = aO5.up
				th.classList.add(up ? cc_Up : cc_Dn)

				aO5.up = !aO5.up

				nums.sort(NumsSort )

				let odd = false,
					dec = -1

				for (const num of nums) {
					const r = num.r
					if (!r.classList.contains(cc_span)) {
						const d = Math.trunc(num.v)
						if (dec != d) {
							dec = d
							odd = !odd
						}
					}

					if (odd) r.classList.add(cc_odd)
					else
						if (r.classList.contains(cc_odd))
							r.classList.remove(cc_odd)
					tbody.appendChild(r)
				}
			}
		},
		PrepTables = () => {
			const sel = 'o5table',
				tags = C.GetTagsByQueryes('[' + sel + ']'),
				d = W.consts.o5tag_table,

				d_head = d[0] ? d[0] : '§',
				d_line = d[1] ? d[1] : '¶',
				cellD = d[2] ? d[2] : '▸',
				cellC = d[3] ? d[3] : '▹',
				aligL = d[4] ? d[4] : '↢',
				aligC = d[5] ? d[5] : '⇔',
				aligR = d[6] ? d[6] : '↣',
				schwa = d[7] ? d[7] : 'ₔ',
				cellV = d[8] ? d[8] : 'ᐞ',
				csort = d[9] ? d[9] : '⇅',
				ctitl = d[10] ? d[10] : '¿',
				m_line = new RegExp('\\s*[\\n' + d_line + ']+\\s*', 'gm'), // разделитель строк
				m_cell = new RegExp('\\s+\\w*(' + cellD + '|' + cellC + ')\\s*', 'g'), // разделитель ячеек (для '▸' - с числом)
				m_clsR = new RegExp('^\\s*\\w*' + cellD),      				// проверка класса в начале рядка
				m_clsC = new RegExp('\\s*\\w+' + cellD + '\\s*$'),      				// проверка класса в ячейке				
				m_sort = new RegExp('\\s*\\d*' + csort + '\\s*', 'g'), // целочисл. сортировка ( с необязательным номером столбца (начиная с 1))
				m_Cell = new RegExp('[^' + cellC + cellD + ']*([' + cellC + cellD + ']|$)', 'g'), // содержимое ячейки
				m_alig = new RegExp('\\s*[' + aligL + aligC + aligR + cellV + csort + ']\\s*', 'g'), // признак выравнивания и объединения
				mschwa = new RegExp(schwa + '.{1}', 'g'),
				m_titl = new RegExp('\\s*\\d+\\s*' + ctitl + '\\s*', ''), // целочисл. сортировка ( с необязательным номером столбца (начиная с 1))
				titles = [],
				Schwa = s => '<sup>' + s.substring(1) + '</sup>'

			for (const tag of tags) {
				const ss = tag.innerHTML.split(m_line),
					rows = [],
					ncs = []
				for (let k = 0; k < ss.length; k++) {
					let s = ss[k]
					if (!s || s.match(/^\s*#/)) continue

					const mT = s.match(m_titl)
					if (mT && mT.length > 0) {
						const j = s.indexOf(ctitl),
							s1 = s.substring(0, j - 1).trim(),
							s2 = s.substring(j + 1).trim()
						titles.push({ k: parseInt(s1), s: s2 })
						continue
					}
					// if (s.indexOf('33	▸10      ▸2.5    ▸0.1   ▸12.1  ▸9.3')>=0)
					// 	console.log()

					if (s[s.length - 1] == d_line) s[s.length - 1] = ' '

					const tds = []
					tds.clsR = ''
					tds.isth = s[0] == d_head

					if (!tds.isth) {		// проверка первым символом разделитель ячеек - берём класс рядка
						const mR = s.match(m_clsR)
						if (mR) {
							const len = mR[0] ? mR[0].length - 1 : 0
							if (len > 0) {
								// tds.clsR = ` class="o5tab-tr_${parseInt(mR[0].substring(0, len))}" `
								tds.clsR = ` class="o5tab-tr_${mR[0].substring(0, len)}" `
								s = s.substring(len + 1)
							}
						}
					}

					const cells = (tds.isth ? s.substring(1) : s).match(m_Cell),
						nc = cells.length

					if (!ncs.includes(nc)) {
						if (ncs.length > 0)
							console.error(`o5tab, тег id='${tag.id}': изменено к-во (${ncs[0]}=>${nc}) ячеек в строке ${k}: "${s.substring(0, 33) + (s.length > 33 ? ' ...' : '')}"`)
						ncs.push(nc)
					}
					let txt = '',
						cspan = 0

					for (let i = 0; i < cells.length; i++) {
						const cell = cells[i],
							mcs = cell.match(m_cell),
							mc = mcs && mcs.length > 0 ? mcs[0].trim() : null,
							mC = cell.match(m_clsC),
							u = cell.replace(mC ? m_clsC : m_cell, '') // в объединённой ячейке объединяем отдельные слова. Чтобы раздельно - через &nbsp;						

						if (!mc && !u) continue // это пустая (незакрытая) ячейка в конце строки справа

						txt += u

						if (mc && mc[0] == cellC) cspan++
						else {
							let align = '',
								isspan = false,
								issort = -1,
								stitle = ''

							if (tds.isth) {
								const mS = txt.match(m_sort)
								if (mS) {
									txt = txt.replace(m_sort, '')
									const s = mS[0].trim()
									if (s.length > 1) issort = parseInt(s.substring(0, s.length - 1))
									else issort = i + 1
									const j = s.indexOf(csort)
									if (j >= 0)
										stitle = s.substring(j + 1).trim()
								}
							}
							const mA = txt.match(m_alig)
							if (mA) {
								for (const ma of mA) {
									switch (ma.trim()) {
										case aligL:
											align = 'left';
											break
										case aligC:
											align = 'center';
											break
										case aligR:
											align = 'right';
											break
										case cellV:
											isspan = true;
											break
									}
								}
								txt = txt.replace(m_alig, '') //все вычистил, сработал лишь первый							
							}

							// const len = mC ? mC.length - 1 : 0
							tds.push({
								txt: txt.replace(mschwa, Schwa).trim() + (issort ? ' ' : ''),
								isspan: isspan,
								issort: issort,
								stitle: stitle,
								vspan: '',
								cspan: cspan,
								align: align ? ` style="text-align:${align};"` : '',
								class: mC ? ` o5tab-td_${mC[0].substring(0, mC[0].length - 1).trim()}` : '',
								// class: (len > 0 && mC.indexOf(cellD)>0) ? ` o5tab-td_${mC.substring(0, len)}` : '',
							})
							txt = ''
							cspan = 0
						}
					}
					rows.push(tds)
				}
				let n = 0 // самый длинный рядок
				for (const tds of rows)
					if (n < tds.length) n = tds.length
				n = n - 1

				for (const tds of rows)
					if (n > tds.length) {
						let cspan = 0
						for (let i = 0; i < tds.length; i++)
							if (tds[i].cspan > 0)
								cspan += tds[i].cspan

						for (let i = tds.length + cspan; i < n; i++)
							tds.push({
								txt: '',
								isspan: false,
								issort: -1,
								stitle: '',
								vspan: '',
								cspan: 0,
								align: '',
								class: '',
							})
					}

				for (let i = 0; i < n; i++) { // перебо сначала по столбцам
					let cell = null,
						vspan = 0
					for (const tds of rows)
						if (i < tds.length) {
							const td = tds[i]
							if (td.isspan && cell) {
								cell.txt += ' ' + td.txt
								vspan++
							} else {
								if (vspan) {
									cell.vspan = ` rowspan=${vspan + 1}`
									vspan = 0
								}
								cell = td
							}
						}
				}

				const table = document.createElement('table')

				for (const attr of tag.attributes)
					if (attr.name != sel)
						table.setAttribute(attr.name, attr.value)

				let html = '<thead>\n',
					isbody = false
				for (const tds of rows) {
					let row = '',
						rcls = ''
					const head = tds.isth ? 'th' : 'td'
					if (!tds.isth && !isbody) {
						isbody = true
						html += '</thead>\n' + '<tbody>\n'
					}

					let k = 0
					for (const td of tds) {
						if (tds.isth) k++
						if (td.isspan) {
							if (td === tds[0])
								rcls = cc_span
						} else {
							const cls = td.class ? ` class="${td.class}"` : '',
								sort = td.issort >= 0 ? ` issort=${td.issort}` : '',
								cspan = td.cspan > 0 ? ` colspan=${td.cspan + 1}` : ''
							let titl = ''
							if (tds.isth && sort)
								for (const title of titles)
									if (title.k == k) {
										titl = ` title="${title.s}"`
										break
									}
							row += '<' + head + cls + sort + cspan + td.vspan + td.align + titl + '>' + td.txt + '</' + head + '>'
						}
					}
					html += '<tr' + tds.clsR + (rcls ? ` class="${rcls}"` : ``) + '>' + row + '</tr>\n'
				}
				if (isbody) html += '</tbody>\n'
				else html += '</thead>\n'

				html += '<tfoot>' + '</tfoot>\n'

				table.innerHTML = html

				table.style.opacity = 1

				const atag = tag.parentNode.insertBefore(table, tag)
				tag.parentNode.removeChild(tag)

				const thead = atag.tHead
				for (const row of thead.rows)
					for (const cell of row.cells)
						if (cell.hasAttribute('issort')) {
							cell.aO5tab = {
								up: true
							}
							cell.addEventListener('click', SortTab)
						}

				let odd = false
				for (const tbody of table.tBodies)
					for (const r of tbody.rows) {
						if (!r.classList.contains(cc_span))
							odd = !odd

						if (odd) r.classList.add(cc_odd)
					}
			}
		}

	function TabInit(e) {
		if (C.incdone) return // т.е. уже отработало после o5inc

		if (!C.avtonom)
			C.ParamsFill(W)

		if (o5debug > 0) console.log(`========  инициализация '${W.modul}'   ------` +
			`${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'}`)

		PrepTables()

		if (!C.avtonom)
			C.E.DispatchEvent('olga5_sinit', W.modul)
	}

	if (C.avtonom) {
		const Find = (scripts, nam) => {
			const mnam = new RegExp('\\b' + nam + '\\b')
			for (const script of scripts) {
				const attributes = script.attributes
				for (const attribute of attributes) {
					if (attribute.value.match(mnam)) return true
				}
			}
		}
		if (Find(document.scripts, 'o5inc.js'))
			window.addEventListener('olga5-incls', W.Init)
		else
			document.addEventListener('DOMContentLoaded', W.Init)
		// window.addEventListener('olga5-incls', e=>{
		// 	C.incdone = true	
		// 	TabInit(e)
		// })
		// if (!window.olga5)
		// 	window.olga5 = {}

		if (!window.olga5) window.olga5 = []
		Object.assign(window.olga5, { PrepTables: PrepTables, })
		W.consts = C.consts

		PrepTables()
		if (o5debug)
			console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
	}
	else
		C.ModulAdd(W)

})();/* global document, window, console  */
/* exported olga5_menuPopDn_Click    */
/* jshint asi:true                   */
/* jshint esversion: 6               */
(function () { // ---------------------------------------------- o5pop ---
    let focusTime = 0

    const // phases = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'],                
        pard = window.location.search.match(/(\&|\?|\s)(is|o5)?(-|_)?debug\s*(\s|$|\?|#|&|=\s*\d*)/),
        o5debug = (pard ? (pard[0].match(/=/) ? parseInt(pard[0].match(/\s*\d+/) || 1) : 1) : 2),
        eclr = 'background: yellow; color: black;',
        clrs = { //	копия из CConsole
            'E': `${eclr}border: solid 1px gold;`,
        },
        thisClass = 'olga5_popup',
        cls_Act = thisClass + '-Act',
        cls_errArg = thisClass + '-errArg',
        namo5css = thisClass + '_internal',
        dflts = { // тут все названия дб. в нижнем ренистре !!!
            moes: { text: '', group: '', head: '', },
            sizs: { width: 588, height: 345, left: -22, top: 11, innerwidth: null, innerheight: null, screenx: null, screeny: null, },
            wins: { alwaysraised: 1, alwaysontop: 1, menubar: 0, toolbar: 0, status: 0, resizable: 1, scrollbars: 0, },
        },
        C = window.olga5 ? window.olga5.C : { // заменитель библиотечного
            consts: {
                o5debug: o5debug
            },
            repQuotes: /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g,
            ConsoleError: (msg, name, errs) => {
                const txt = msg + (name ? ' ' + name + ' ' : '')
                console.groupCollapsed('%c%s', clrs.E, txt)
                if (errs && errs.length > 0) console.table(errs)
                else console.error(txt)
                console.trace("трассировка вызовов :")
                console.groupEnd()
            },
            MakeObjName: obj => (obj ? (
                (obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
                    ('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
                    '.' + (obj.className ? obj.className : '?'))) : 'НЕОПР?'),
            GetTagsByQueryes: query => document.querySelectorAll(query), // второй аргумент - игнорится
            avtonom: true,
        },
        SetTagError = (tag, txt, errs) => { // добавление и протоколирование НОВЫХ ошибок для тегов
            const
                isnew = tag.title.indexOf(txt) < 0,
                first = tag.title == tag.aO5pop.title // .trim().indexOf('?') != 0

            if (first) tag.title = tag.aO5pop.title + ' ?-> ' + txt
            else if (isnew) tag.title = tag.title + '; ' + txt

            if (isnew) C.ConsoleError(`${txt} для тега : `, C.MakeObjName(tag), errs)
            if (!tag.classList.contains(cls_errArg))
                tag.classList.add(cls_errArg)
        },
        RemoveTagErrors = tag => { // добавление и протоколирование НОВЫХ ошибок для тегов            
            if (tag.classList.contains(cls_errArg)) {
                tag.title = tag.aO5pop.title
                tag.classList.remove(cls_errArg)
            }
        },
        AddPars = (pars, dests, errs, force) => {
            for (const _par in pars) {
                const par = _par.toLowerCase()
                let isp = false
                for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                    const dflt = dflts[nam],
                        dest = dests[nam]
                    if (dflt.hasOwnProperty(par)) {
                        if (force || !dest.hasOwnProperty(par))
                            dest[par] = pars[_par]
                        isp = true
                        break
                    }
                }
                if (!isp)
                    errs.push(`неопределённый параметр '${par}' `)
            }
        },
        CopyPars = (pars, dests, errs, force) => {
            for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                const srcs = pars[nam],
                    dest = dests[nam]
                for (const _par in srcs) { // например 'sizs'
                    const par = _par.toLowerCase()
                    if (force || !dest.hasOwnProperty(par))
                        dest[par] = srcs[_par]
                }
            }
        },
        dlmattr = /[\s'"`]*[,;][\s'"`]*/,
        dlmpar = /[\s'"`]*[:=][\s'"`]*/,
        SplitPars = (spar, pars, refs, errs, tagname) => {
            const ss = spar.split(dlmattr)
            for (const s of ss)
                if (s.trim()) {
                    const uu = s.split(dlmpar),
                        u0 = uu[0].replace(C.repQuotes, '')

                    if (uu.length == 1) refs[u0] = null
                    else {
                        const u1 = uu[1].replace(C.repQuotes, '')
                        let nam = u0.toLowerCase()
                        if (nam == 'id') refs[u1] = null
                        else {
                            if (nam.length == 1) {
                                if (nam == 'g') nam = 'group'
                                if (nam == 'n') nam = 'nocss'
                                else if (nam == 'w') nam = 'width'
                                else if (nam == 'h') nam = 'height'
                                else if (nam == 't') nam = 'top'
                                else if (nam == 'l') nam = 'left'
                            }
                            if (!pars.hasOwnProperty(nam))
                                pars[nam] = u1
                            else
                                errs.push(`для  '${tagname}' повтор параметра '${u0}' (без учета регистра и сокращения)`)
                        }
                    }
                }
                else if (ss.length > 0)
                    errs.push(`для  '${tagname}' отсутствие параметра в массиве параметров`)

            if (errs.length > 0)
                C.ConsoleError(`для  '${tagname}' ошибки при разборе строки аргументов`, spar, errs)
        }

    function GetPops(e, args) {
        'use strict'
        const tag = e.currentTarget,
            eve = e.type,
            CalcTagPars = (eve, tag, args, errs) => {
                if (!tag.aO5pop) {
                    tag.aO5pop = Object.assign({}, {
                        name: C.MakeObjName(tag),
                        title: tag.title,
                        tag: tag,
                        apops: {}
                    })
                    Object.freeze(tag.aO5pop)
                }

                const ap = tag.getAttribute(o5popup),
                    pops = tag.aO5pop.apops[eve] = {
                        tag: tag,
                        eve: eve, //для обратного поиска
                        url: '',
                        act: tag,
                        spar: '', // это просто для истории
                        key: tag.aO5pop.name + '(' + eve + ')' + e.timeStamp, // наименование окна
                        wins: {},
                        moes: {},
                        sizs: {},
                        swins: null,
                        smoes: null, // будут доопределены позже
                    }

                if (eve == click && ap) { // при клике 'o5popup' приоритетнее
                    const mm = ap.match(/\s*[;,]\s*/),
                        i = mm ? mm.index : 9999
                    // ss = ap.split(/\s*;\s*/)
                    pops.spar = ap.substring(i + 1)
                    if (tag.a5pop) {
                        const mtag = tag.a5pop.mtag,
                            popup = mtag.tag.attributes.o5popup
                        let url = ''
                        if (popup) {
                            const pars = mtag.tag.attributes.o5popup.nodeValue.split(/[;,]/)
                            url = pars[0].trim()
                            // if (!mtag.match())
                            pops.spar += ',' + mtag.id
                        }
                        pops.url = url ? url : mtag.tag.getAttribute('href')
                    }
                    else
                        pops.url = ap.substring(0, i).trim()
                } else {
                    const l = args.length,
                        nam = l > 0 ? args[0] : '' // имя объекта, на котором д.б. мигание,
                    pops.url = (l > 1) ? args[1] : ''
                    pops.spar = (l > 2) ? args[2] : ''
                    if (nam) {
                        const istr = typeof nam === 'string',
                            act = istr ? document.getElementById(nam) : nam

                        if (act) pops.act = act
                        else
                            errs.push(`для  '${tag.aO5pop.name}' не найден тег мигания '${istr ? nam : C.MakeObjName(nam)}'`)
                    }
                }

                if (C.DeCodeUrl) {
                    const o5attrs = tag ? C.GetAttrs(tag.attributes) : '',
                        ori = (pops.url || '').replace(C.repQuotes, ''),
                        url = (ori.trim() && !ori.match(/[\/.\\#]/)) ? (document.URL + '?o5nomnu#' + ori) : ori,
                        wref = C.DeCodeUrl(W.urlrfs, url, o5attrs)

                    if (wref.err)
                        errs.push(`Ошибка перекодирования url='${pops.url}':  ${wref.err}`)
                    pops.url = wref.url
                }

                Object.seal(pops)

                if (pops.spar) {
                    const refs = {},
                        pars = {}

                    SplitPars(pops.spar, pars, refs, errs, tag.aO5pop.name)
                    AddPars(pars, pops, errs, false)

                    for (const ref in refs) {
                        let itag = refs[ref]
                        if (!itag) {
                            if (itag !== '') {
                                itag = document.getElementById(ref)
                                if (itag) refs[ref] = itag
                                else {
                                    refs[ref] = '' // чтл бы больше не пытать
                                    errs.push(`для  '${tag.aO5pop.name}' в '${eve}' не найден ссылочный тег с id='${ref}'`)
                                }
                            }
                            if (!itag) continue
                        }
                        let iargs = null,
                            ieve = click
                        const iap = itag.getAttribute(o5popup)
                        if (iap) {
                            const ss = ap ? iap.split(/\s*;\s*/) : ['']
                            iargs = [''].concat(ss)
                        } else
                            for (const iattr of itag.attributes)
                                if (iattr.value.match(/\.*PopUp\s*\(/)) {
                                    iargs = iattr.value.match(/(['"])(.*?)\1/g) // внутри парных кавычек

                                    for (let i = 0; i < iargs.length; i++)
                                        iargs[i] = iargs[i].replace(C.repQuotes, '')
                                    ieve = iattr.name.replace('on', '').toLocaleLowerCase()
                                    break
                                }
                        if (iargs) {
                            CalcTagPars(ieve, itag, iargs, errs)
                            CopyPars(itag.aO5pop.apops[ieve], pops, errs, false)
                        } else {
                            errs.push(`для  '${tag.aO5pop.name}' в '${eve}' у тега с id='${ref}' отсутствует атрибут '${o5popup}'`)
                            refs[ref] = '' // чтл бы больше не пытать
                        }
                    }
                }
                return pops
            }

        let pops = null
        const errs = []

        if (tag.aO5pop && tag.aO5pop.apops && tag.aO5pop.apops[eve]) pops = tag.aO5pop.apops[eve]
        else
            pops = CalcTagPars(eve, tag, args, errs)

        if (pops.swins === null) {
            const doubles = {
                left: 'screenx',
                top: 'screeny',
                width: 'innerwidth',
                height: 'innerheight',
            },
                CalcSummString = nam => {
                    const pars = pops[nam],
                        ss = []
                    for (const par in pars) {
                        const v = ('' + pars[par]).trim(),
                            val = v.match(/[\d.,]+/) ? v : `'${v}'`
                        ss.push(par + '=' + val)
                    }
                    return ss.join(',')
                }

            for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                const pars = dflts[nam],
                    dest = pops[nam]
                for (const _par in pars) { // например 'sizs'
                    const par1 = _par.toLowerCase(),
                        par2 = (nam === 'sizs') ? doubles[par1] : ''
                    if (!dest.hasOwnProperty(par1) && !(par2 && dest.hasOwnProperty(par2))) {
                        const v = pars[_par]
                        if (v !== null) dest[par1] = v
                    }
                }
            }

            CalcSizes(pops.sizs, errs, tag.aO5pop.name) //  для проверки корректности

            pops.swins = CalcSummString('wins')
            pops.smoes = CalcSummString('moes')

            Object.freeze(pops)
            for (const nam in dflts)
                if (dflts.hasOwnProperty(nam))
                    Object.freeze(pops[nam])
        }

        if (errs.length > 0)
            C.ConsoleError(`Ошибки обработки (цепочки) ссылок для тега `, C.MakeObjName(tag), errs)
        return pops
    }

    const wopens = [],
        click = 'click',
        o5popup = 'o5popup',
        aclicks = ['click', 'keyup', 'keydown', 'keypress'],
        DClosePops = () => ClosePops(null),
        W = {
            modul: 'o5pop',
            Init: Popups,
            Done: DClosePops,
            class: thisClass,
            consts: `		
                o5nocss=0;  // 0 - подключаются CSS'ы;
                o5timer=0.7 // интервал мигания ;
                o5params=''  // умалчиваемые для mos, sizs, wins;
			`,
        },
        attrs = document.currentScript.attributes,
        timerms = 1000 * ((attrs && attrs.o5timer) ? parseFloat(attrs.o5timer.value) : 2.1),
        o5css = `
.${thisClass},
.${thisClass + 'C'},
.${cls_Act} {
    cursor: pointer;
}        
.${thisClass}{    
	cursor: pointer;
	color: black;
	background-color: lavender;
	border-radius: 4px;
	border: 1px dashed gray;
}
b.${thisClass},
i.${thisClass},
u.${thisClass},
span.${thisClass},
 .${thisClass} {
    padding-left: 4px;				
    padding-right: 3px;
}
img.${thisClass} {
    border: none;
    background-color: transparent;
    position: relative;
}
.${cls_errArg} {
    opacity:0.5;
}
    /*  мигание вызвавшего тега
    */
.${cls_Act} {
    outline-offset: 2x;
    animation: blink ${timerms}ms infinite linear;
}
@keyframes blink {
    99% {outline: 2px dashed  black;outline-offset: 2x;}
    66% {outline: 3px dashed  white;}
    33% {outline: 2px dashed  black;}
    0% {outline: 3px dashed white;outline-offset: -2x;}
}
`,
        ClosePop = wopen => {
            if (o5debug > 1) console.log(`${W.modul}: ClosePop`.padEnd(22) +
                `${wopen.name}`.padEnd(22))
            if (wopen.time + 444 > (new Date()).getTime()) return

            const act = wopen.pops.act
            if (wopen.text)
                act[act.value ? 'value' : 'innerHTML'] = wopen.text

            if (act.classList.contains(cls_Act)) act.classList.remove(cls_Act)

            if (wopen.win.window && !wopen.win.window.closed) wopen.win.close()

            const i = wopens.indexOf(wopen)
            if (i > -1)
                wopens.splice(i, 1)

            if (wopens.length === 0) {
                window.clearInterval(wopens.tBlink)
                wopens.tBlink = 0
            }
        },
        CloseCloseds = () => {
            let i = wopens.length
            while (i-- > 0) {
                const wopen = wopens[i]
                if (wopen.win && wopen.win.closed) ClosePop(wopen)
            }
        },
        // DoBlinks = isnew => {
        DoBlinks = () => {
            CloseCloseds()
            if (wopens.length === 0) return

            for (const wopen of wopens)
                if (!wopen.noact && wopen.head !== '')
                    try { // тут м.б. ошибку по доступу из другого домена
                        const doc = wopen.win.document
                        if (doc) { // окно наконец-то загрузилось
                            const title = doc.title.trim()
                            if (!wopen.titlD && title) {
                                if (o5debug > 1) console.log(`${W.modul}: DoBlinks загрузилось`)
                                wopen.titlD = title
                                wopen.titlB = wopen.head ? wopen.head : title.replaceAll(/./g, '*') + '*'
                            }
                            doc.title = wopen.titlD == title ? wopen.titlB : wopen.titlD
                        }
                    } catch (e) {
                        wopen.noact = e.message
                        C.ConsoleError('DoBlink: прекращено по причине: "' + e.message + '"')
                    }
            wopens.tBlink = window.setTimeout(DoBlinks, timerms)
        },
        GetCSS = () => {
            const chs = document.head.children
            // let i = 0
            for (const ch of chs) {
                // if (i==14)
                // i=i
                // console.log(i++, ch.nodeName, ch.id, ch.id==namo5css)
                if (ch.nodeName.toUpperCase() == "STYLE" && ch.id == namo5css)
                    return ch
            }
        },
        IncludeCSS = () => { // подключение CSS'ов, встроенных в скрипт  (копия из o5com!.js)                
            let css = GetCSS()
            if (!css) {
                if (o5debug > 0)
                    console.log(`>>  СОЗДАНИЕ CSS   ${thisClass} (для модуля ${W.modul})`)
                const styl = document.createElement('style')
                styl.setAttribute('type', 'text/css')
                styl.id = namo5css
                css = document.head.appendChild(styl)
            } else
                if (o5debug > 0)
                    console.log(`>>  ИНЗМЕНЕНИЕ CSS   ${thisClass} (для модуля ${W.modul}) `)
            css.innerHTML = o5css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
        },
        ClosePops = grp => { // закрыть все с такой группой и анонимные ('группа' типа 0)
            'use strict'
            if (wopens.length === 0) return
            let n = 0,
                i = wopens.length
            while (i-- > 0) {
                const wopen = wopens[i],
                    group = wopen.pops.moes.group

                if (grp == group || grp === null || !group) {      //|| typeof grp == 'event') {
                    ClosePop(wopen)
                    n++
                }
            }
            if (o5debug > 0)
                console.log(`${W.modul}: закрыты ${n} окон группы '${grp === null ? 'всё' : grp}'`)
        },
        CalcSizes = (sizs, errs, tagname) => {
            'use strict'
            const screen = window.screen,
                she = screen.height,
                swi = screen.width,
                GetVal = nam => {
                    const u = sizs[nam] // м.б. как строка так и число
                    if (u) {
                        const isw = nam == 'width' || nam == 'left' || nam == 'innerwidth' || nam == 'screenx',

                            v = parseFloat(u),
                            // va = Math.abs(v),   mperc = /\s*[\d.,]*%\s*/
                            val = (u.match && u.match(/\s*[\d.,]+%\s*/)) ? (0.01 * v * (isw ? swi : she)) : v // размер в пикселах]
                        // val= (u.match && u.match(mperc))?( 0.01 * val * (isw ? swi : she) - 0.5 * (isw ? wi : he)):va
                        return {
                            isw: isw,
                            val: val,
                        }
                    }
                }
            let ss = [],
                wi = 0,
                he = 0,
                dtps = {
                    w: false,
                    h: false,
                    l: false,
                    t: false
                },
                CheckDubl = (nam, m1, m2, x, txt) => {
                    if (nam.match(m1) || nam.match(m2)) {
                        if (dtps[x]) errs.push(`для  '${tagname}' дублирование ` + txt)
                        dtps[x] = true
                    }
                }

            for (const nam of ['width', 'height', 'innerwidth', 'innerheight']) {
                const z = GetVal(nam)
                if (z) {
                    const val = Math.abs(z.val)

                    if (z.isw) wi = val
                    else he = val
                    ss.push(nam + '=' + parseInt(val))
                    if (errs) {
                        CheckDubl = (nam, /width/, /innerwidth/, 'w', 'ширины окна')
                        CheckDubl = (nam, /height/, /innerheight/, 'h', 'высоты окна')
                        if (val < 100) errs.push(`для  '${tagname}' значение '${nam}' меньше 100`)
                    }
                }
            }

            const aW = screen.availWidth,
                aH = screen.availHeight,
                RePos = (val, actW, maxW, minL) => {
                    let x = val
                    if (x > maxW) x = maxW - actW
                    if (x > -1) x = minL + x
                    else x = minL // + x + maxW - actW - 4
                    return x
                }
            for (const nam of ['left', 'top', 'screenx', 'screeny']) {
                const z = GetVal(nam)
                if (z) {
                    const isw = z.isw,
                        v = z.val < 0 ? (isw ? aW + z.val - wi : aH - z.val - he) : z.val,
                        val = RePos(v, isw ? wi : he, isw ? aW : aH, isw ? screen.availLeft : screen.availTop)

                    ss.push(nam + '=' + parseInt(val))
                    if (errs) {
                        CheckDubl = (nam, /left/, /screenx/, 'l', 'левой позиции')
                        CheckDubl = (nam, /top/, /screeny/, 't', 'верхней позиции')
                    }
                }
            }
            return ss.join(',')
        },
        optsFocus = {
            capture: true,
            moja: 'fignia'
        },
        Focus = e => {
            if (wopens.length === 0 || focusTime == e.timeStamp) return

            focusTime = e.timeStamp
            window.setTimeout(() => {
                for (const wopen of wopens)
                    wopen.win.focus()
            }, 1)
            if (o5debug > 1)
                console.log(`${W.modul}: Focus для ${wopens.length} тегов (${e.eventPhase}, ${e.isTrusted ? 'T' : 'f'}, ${e.timeStamp.toFixed(1).padEnd(6)}, ${e.type})`)
        },
        o5nocss = attrs && attrs.o5nocss && attrs.o5nocss.value,
        doneattr = W.modul + '-done'

    function WindowOpen(pops, s) {
        const url = pops.url
        if (url && url.length > 1) {
            // let isref = false
            if (url[0] == '#') {
                const id = url.substring(1),
                    tag = document.getElementById(id)
                if (tag) {

                } else {
                    C.ConsoleError(`PopUp: ссылка на отсутствующие внутренний тег:`, id)
                    return
                }
            }
            return window.open(url, pops.key, s)
        }
    }

    function ShowWin(pops) {
        'use strict'
        if (o5debug > 1) console.log(`${W.modul}: ShowWin`.padEnd(22) +
            `${C.MakeObjName(pops.tag)}`.padEnd(22) +
            `${C.MakeObjName(pops.act)}, '${pops.eve}') `)

        const tag = pops.tag,
            wopen = wopens.find(wopen => wopen.pops.tag == tag && wopen.pops.eve == pops.eve)

        if (wopen) { // повтор события на теге - закрываю всплытое окно!
            ClosePop(wopen)
            return
        }

        ClosePops(pops.moes.group)

        const sizs = CalcSizes(pops.sizs),
            s = sizs + ',' + pops.swins,
            win = WindowOpen(pops, s)
        if (win) {
            const wopen = {
                pops: pops,
                win: win,
                head: pops.moes.head,
                text: '',
                titlD: '',
                titlB: '',
                noact: '',
                name: tag.aO5pop.name,
                time: (new Date()).getTime() // отстройка от "дребезжания"o5contents
            }
            const act = pops.act

            if (pops.moes.text) { // для анонимных - не менять текст
                wopen.text = act.value ? act.value : act.innerHTML
                act[act.value ? 'value' : 'innerHTML'] = pops.moes.text
            }
            RemoveTagErrors(tag)

            wopens.push(wopen)

            if (timerms > 99 && tag.classList.contains(thisClass)) {
                act.classList.add(cls_Act)
                if (wopens.tBlink)
                    window.clearInterval(wopens.tBlink)
                DoBlinks(true)
            }
        } else
            if (!aclicks.includes(pops.eve))
                SetTagError(tag, `создание окна по событию '${pops.ve}'`, [`вероятно следует снять запрет на всплытие окон в браузере`])

        return sizs + ',\n' + pops.swins + ',\n' + pops.smoes
    }

    function PopUp() {
        if (arguments.length < 0 || arguments.length > 3) {
            C.ConsoleError(`PopUp: ошибочное к-во аргументов='${arguments.length}'`, [` у PopUp() их д.б. от 1 до 3)`])
            return '?'
        }

        let caller = arguments.callee
        while (caller.caller)
            caller = caller.caller

        const e = caller.arguments[0],
            pops = GetPops(e, arguments)

        if (e.target.nodeName != "A" || !e.target.hasAttribute('href')) {
            e.cancelBubble = true
            return ShowWin(pops)
        }

    }

    function PopShow() { //  устарешая обёртка  ---- width, height, url
        if (arguments.length == 3 && !isNaN(arguments[0]) && !isNaN(arguments[1])) {
            let caller = arguments.callee
            while (caller.caller)
                caller = caller.caller

            const e = caller.arguments[0],
                pops = GetPops(e, ['', arguments[2], `width=${arguments[0]}, height=${arguments[1]}`])
            e.cancelBubble = true
            return ShowWin(pops)
        } else {
            C.ConsoleError(`PopShow: ошибочно к-во или тип аргументов [${arguments.join(', ')}]`)
            return '?'
        }
    }

    function Popups(e) {
        'use strict'
        if (!C.avtonom)
            if (o5nocss || GetCSS()) C.ParamsFill(W) // CSS сохранилось после автономного создания
            else // иначе - никак, т.к. не известно, кто раньше загрузится
                C.ParamsFill(W, o5css) // CSS пересоздаётся (для Blogger'а)

        if (o5debug > 0) console.log(`========  инициализация '${W.modul}'   ------` +
            `${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'}`)

        focusTime = 0

        let o5c = null
        const tags = C.GetTagsByQueryes('[' + o5popup + ']'),
            mids = [],
            o5contents = 'o5contents',
            AskRefTag = (tag0, params) => {
                const mcc = params[0].match(/^\s*id=\s*\w+\b/i)
                if (!mcc) return

                const ss = mcc[0],
                    id = ss.split('=')[1].trim(),
                    mid = mids.find(mid => mid.mtag && mid.mtag.id == id),
                    errid = `========  ссылочный id='${id}'`

                if (!o5c) o5c = document.getElementById(o5contents)
                if (!o5c)
                    return `${errid} не найден контент=${o5contents} <li>`

                let mtag = mid ? mid.mtag : null

                if (!mtag) {
                    for (let i = 0; i < o5c.children.length; i++) {
                        const child = o5c.children[i]
                        let tag = null
                        if (child.id == id) tag = child
                        else tag = child.querySelector('#' + id)
                        if (tag) {
                            mtag = { i: i + 1, tag: tag, id: id }
                            break
                        }
                    }
                    if (!mtag)
                        return `${errid} отсутствует в '${o5contents}'`

                    mids.push(mtag)
                }

                const tag = mtag.tag

                //     mpopup = tag.attributes.o5popup
                // if (!mpopup)
                //     return `${errid} не содержит 'o5popup'`

                // const mparams = mpopup.nodeValue.split(/[;,]/)
                // let mli = tag.parentNode

                // while (mli.nodeName != 'LI')
                //     mli = mli.parentNode

                // if (!mli)
                //     return `${errid} не принадлежит <li>`

                tag0.classList.add(o5contents)
                tag0.title = tag0.title + (tag0.title ? ' ' : '') + tag.innerText
                // let s1 = tag0.innerText,
                //     s2 = (tag0.innerText ? '+' : ''),
                //     s3 = tag0.innerText + (tag0.innerText ? ' ' : '') + `[  ${mtag.i} ]`
                tag0.innerHTML = tag0.innerText + (tag0.innerText ? ' ' : '') + `[&#8202;${mtag.i}&#8202;]`
                tag0.a5pop = { mtag: mtag }
                // tag.attributes.o5popup+=',' + id
            }

        if (tags)
            for (const tag of tags) {
                if (tag.getAttribute(doneattr)) {
                    console.error('%c%s', eclr, `(========  повтор инициализации для id='${tag.id}'`)
                    continue
                }
                tag.setAttribute(doneattr, 'OK')
                const params = tag.attributes.o5popup.nodeValue.split(/[;,]/)
                if (params.length > 0) {
                    let err = AskRefTag(tag, params)
                    if (err) {
                        console.error('%c%s', eclr, err + ` (для id='${tag.id}')`)
                        continue
                    }

                    if (!o5nocss && !tag.classList.contains(thisClass) && !params.find(param => param.match(/\bnocss\b/i)))
                        tag.classList.add(thisClass)

                    tag.addEventListener(click, PopUp)
                }
            }

        for (const eve of ['focus', 'click'])
            window.addEventListener(eve, Focus, optsFocus) // т.е. e.eventPhase ==1

        window.addEventListener(click, ClosePops)

        document.addEventListener('visibilitychange', DClosePops) // для автономной работы

        if (!o5nocss) // т.е. если явно НЕ запрещено    
            IncludeCSS()

        const errs = []
        if (attrs && attrs.o5params) {
            const pars = {},
                refs = {} // тут - refs не нуже
            SplitPars(attrs.o5params, pars, refs, errs)
            AddPars(pars, dflts, errs, false, 'конфиг.')
        }
        if (errs.length > 0)
            C.ConsoleError(`Ошибки формирования параметров окна (из url'а):`, errs.length, errs)

        window.dispatchEvent(new CustomEvent('olga5_sinit', {
            detail: {
                modul: W.modul
            }
        }))
        // C.E.DispatchEvent('olga5_sinit')
    }

    if (C.avtonom) {
		const Find = (scripts, nam) => {
			const mnam = new RegExp('\\b' + nam + '\\b')
			for (const script of scripts) {
				const attributes = script.attributes
				for (const attribute of attributes) {
					if (attribute.value.match(mnam)) return true
				}
			}
		}
		if (Find(document.scripts, 'o5inc.js'))
			window.addEventListener('olga5-incls', W.Init)
		else
			document.addEventListener('DOMContentLoaded', W.Init)

        // document.addEventListener('DOMContentLoaded', W.Init)
        // document.addEventListener('olga5-incls', W.Init)
        if (!window.olga5) window.olga5 = []
        Object.assign(window.olga5, {
            PopUp: PopUp,
            PopShow: PopShow
        })

        if (o5debug)
            console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
    } else 
        C.ModulAdd(W)   


})();/* -global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o5mnu ---
	'use strict'
	const
		C = window.olga5.C,
		W = {
			modul: 'o5mnu',
			Init: Init,
			class: 'olga5_menu',
			consts: 'o5menudef=; scrollY=-18'
		},
		class_empty = W.class + '_empty',
		class_small = W.class + '_small',
		o5css = `
.${W.class} {
    margin: 0 !important;
    padding: 0 !important;
    font-size: small;
    height: min-content;
    width: max-content;
    z-index: 1111111;
    top: 1px;
    right: 1px;
    position: unset; /* будут присвоено ниже */
    display: initial; 
}
.${W.class}.Left {left: 1px; right:''}

/*.${class_small} {
	width: 144px;
	text-align: center ! important;
	text-align: -moz-center;
	text-align: -webkit-center;
	font-size: smaller ! important;
	line-height: 11px ! important;
}*/

.${W.class} ul {
    margin: 0;
    padding: 0;
    border-radius: 2px;
    display: grid;    /* иначе переносит строки последующего пункта при открытии подменю */
}

.${W.class} li {
    display: block;
    color: white;
    background: gray;
    height: 1.5em;
    text-align: left;
	text-align: -webkit-left;
	text-align: -moz-left;
    border-bottom: 0.01em solid lightseagreen;
    padding: 1px 5px 1px 2px;
    cursor: pointer;
    font-family: sans-serif;
    font-size: small;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.${W.class} li>ul {
    position: absolute;
    top: unset;
    display: none;
    padding: 0;
    margin: 0;
    border: 1px solid darkgrey;
    outline: 1px solid white;
    float: right;
}
.${W.class}.Left li>ul {float: left;}

.${W.class}>li {
    background-color: white;
    border: none;
    border-radius: 8px;
    background-color: transparent;	
	text-align: right;
	text-align: -moz-right;
	text-align: -webkit-right;
	// text-align: -moz-left;
}

.${W.class}.Left>li {
    text-align: left;
	text-align: -webkit-left;
	text-align: -moz-left;
}

.${W.class}>li>ul {
    outline: 1px solid bisque;
    top: 0.5em;
    position: relative;
    right: 0.1em;
}

.${W.class}>li>ul {left: 0.1em;}
.${W.class}>li>ul>li>ul { right: 3.1em; margin-top: -4px;}
.${W.class}>li>ul>li>ul>li>ul { right: 6.1em; margin-top: -3px;}
.${W.class}>li>ul>li>ul>li>ul>li>ul { right: 9.1em; margin-top: -3px;}
.${W.class}>li>ul>li>ul>li>ul>li>ul>li>ul { right: 12.1em; margin-top: -3px;}
.${W.class}.Left>li>ul {left: 0.1em;}
.${W.class}.Left>li>ul>li>ul { left: 3.1em; margin-top: -4px;}
.${W.class}.Left>li>ul>li>ul>li>ul {left: 6.1em; margin-top: -3px;}
.${W.class}.Left>li>ul>li>ul>li>ul>li>ul {left: 9.1em; margin-top: -3px;}
.${W.class}.Left>li>ul>li>ul>li>ul>li>ul>li>ul {left: 12.1em; margin-top: -3px;}

.${W.class} li>span {
    display: flex;
    padding-left: 6px;
    height: 100%;
    align-items: center;
    width: max-content;
    justify-content: flex-start;
    overflow: hidden;
}

.${W.class}>li>span {
    border: 1px solid darkgray;
    border-radius: 8px;
    color: black;
    background-color: yellow;
    padding: 3px 4px 2px 4px;
    justify-content: center;
    height: min-content;
	// width: -moz-min-content;
	width: fit-content;
}

.${W.class} li:hover {
    color: black;
    background-color: lavender;
}

.${W.class}>li:hover {
    background: transparent;
    height: 3em;
}

.${W.class}>li:hover>span {
    color: white;
    background: gray;
    border: 0.01em solid lightseagreen;
    padding-bottom: 4px;
}

.${W.class} li:hover>ul,
.${W.class} li>ul:hover {
    display: block;
}

.${W.class} li:active>ul {    /* для корректного "гашения" - д.б. ПОСЛЕДНИМ ! */
    display: none;
}
.main-outer {
    background-color: ghostwhite;
    border: 1px solid navajowhite;
}

.${class_empty} {
    height: 2px ! important;
    background-color: aqua ! important;
}

.olga5-menuhidden{
	display:none;
}
`,

		// const phases = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE',]
		win = { target: '_self', resize: true, scrollX: 0, scrollY: -18, }, // blockclick: false, timclick: 0 },
		Target = function (e) {
			let target = e.toElement || e.target
			while (target && !target.o5menus) target = target.parentElement
			return target
		},
		OnMnu = function (e) {
			const target = Target(e)
			if (target && !target.o5menus.ready) target.o5menus.ready = true
		},
		GoTo = function (o5menus) {
			const tag = document.getElementById(o5menus.ref)
			if (tag) {
				tag.scrollIntoView({ block: o5menus.block, behavior: "smooth" })
				return true
				// if (win.scrollY != 0) window.scrollBy(0, win.scrollY)
			} else
				C.ConsoleError("GoTo: не определён тег в текущем окне: ", o5menus.ref)
		},
		DoMnu = e => {
			if (C.consts.o5debug)
				console.log('DoMnu: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6))
			const target = Target(e)
			if (target && target.o5menus.ready) {
				const o5menus = target.o5menus
				o5menus.ready = false

				let ok = true
				if (o5menus.isext) window.open(o5menus.ref, win.target)
				else
					ok = GoTo(o5menus)

				if (ok && win.resize) {
					if (window.olga5.o5shp)
						window.olga5.o5shp.DoResize('из o5mnu')
				}
				win.blockclick = true
				e.cancelBubble = true
			}
		},
		Clear = e => {
			if (C.consts.o5debug)
				console.log('Clear: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6) +
					' ' + (win.blockclick ? 'очищаю' : ''))
			if (win.blockclick) {
				win.blockclick = false
				e.cancelBubble = true
			}
			// // win.timclick = e.timeStamp
			// e.cancelBubble = true
		},
		MnuInit = function (items) {
			if (C.consts.o5nomnu > 0) return

			const proc = 'MnuInit',
				errs = []
			if (!items || !items[0]) errs.push(`${proc}: не определеныа структура меню`)
			if (errs.length == 0) {
				const uls = [],
					item0 = items[0],
					base = item0.base || ''

				const id = item0.id || ''
				if (id && document.getElementById(id)) errs.push(`${proc}: повтор создания меню с id='${id}'`)

				if (item0.target) {
					win.target = item0.target
					win.resize = false
				}
				if (W.consts.scrollY) win.scrollY = parseInt(W.consts.scrollY)

				let ul = document.createElement("ul")

				ul.id = id
				ul.className = W.class
				if (item0.right) ul.style.right = item0.right
				else if (item0.left) {
					ul.style.left = item0.left
					ul.classList.add('Left')
				}
				if (item0.top) ul.style.top = item0.top

				let owner = document.body
				if (item0.owner) {
					if (typeof item0.owner === 'object') owner = item0.owner
					else {
						const own = item0.owner.trim(),
							xwner = (!own || own.match(/\.body\b/)) ? document.body : document.querySelector(own)

						if (xwner) owner = xwner
						else
							C.ConsoleError(`${proc}: нет owner'а для '${own}'`)
					}
				}
				if (item0.position) ul.style.position = item0.position
				else if (!item0.owner) ul.style.position = 'fixed'
				else ul.style.position = 'absolute'

				if (ul.style.position == 'absolute') {
					const nst = window.getComputedStyle(owner),
						position = nst.getPropertyValue('position')
					if (position != 'absolute')
						C.ConsoleError(`${proc}: контейнер ${C.MakeObjName(owner)} для меню '${C.MakeObjName(ul)}' имеет position='${position}' (не ''absolute)`)
				}
				if (item0.noremov) owner.insertBefore(ul, owner.firstChild)  // НЕ удаляется по закрытии страницы (owner.appendChild(ul))				
				else
					C.page.InsertBefore(owner, ul, owner.firstChild)

				ul.addEventListener('mousedown', DoMnu, true)
				ul.addEventListener('click', DoMnu, true)
				// window.addEventListener('click', Clear, true)
				C.E.AddEventListener('click', Clear, true)

				uls[0] = ul
				const blc = (item0.block || 's')[0].toLowerCase(),
					block = blc == 's' ? 'start' : (blc == 'e' ? 'end' : (blc == 'n' ? 'nearesr' : 'center'))

				let m = 0
				for (const item of items) {
					const li = document.createElement('li')

					// li.addEventListener('click', Clear, true) 
					li.style.zIndex = 99999
					li.o5menus = { isext: true, block: block }
					if (item.ref) {
						const ref = item.ref || '',
							wl = window.location
						if (ref.length == 0) li.o5menus.ref = wl.origin + wl.pathname
						else if (C.IsFullUrl(ref)) li.o5menus.ref = ref // (ref.match(/^\s*(https?:)\/\//)) li.o5menus.ref = ref
						else if (ref.match(/\.html?($|\?|&|#)/)) li.o5menus.ref = base + ref
						else {
							li.o5menus.ref = ref[0] == '#' ? ref.substr(1) : ref
							li.o5menus.isext = false
						}
					}

					if (item.title) li.title = item.title
					if (item.class) li.classList.add(item.class)
					if (item.style) li.style = item.style

					if (m == 0)
						li.onmouseover = OnMnu

					ul.appendChild(li)

					if (item.span && item.span != '') {
						const span = document.createElement('span')
						span.innerText = item.span
						li.appendChild(span)
					} else
						li.classList.add(class_empty)

					if (item.add) {
						ul = document.createElement("ul")
						ul.style.width = item.add
						li.appendChild(ul)
						uls[++m] = ul
					} else if (item.ret) {
						m = m - item.ret
						if (m < 0) {
							errs.push('m: item.ret=' + item.ret + ', ')
							m = 0
						}
						ul = uls[m]
					}
				}
			}
			if (errs.length > 0)
				C.ConsoleError("${proc}: ошибки создания меню: ", errs.length, errs)
		}

	function Init() {
		const
			InitByText = menu => {// если есть такой атрибут}
				const regval = /^["'`;{\s]*|["'`},\s]*$/g,
					lis = menu.match(/{[^}]*}/g) || [],
					items = [],
					errs = []

				for (const li of lis) {
					const pairs = li.match(/[^,]+(,|})/g),
						item = {}
					for (const pair of pairs) {
						try {
							const i = pair.indexOf(':'),
								nam = pair.substr(0, i).replaceAll(regval, ''),
								val = pair.substr(i + 1).replaceAll(regval, '')
							item[nam] = val
						} catch (err) {
							errs.push({ li: li, pair: pair, err:err.message })
						}
					}
					items.push(item)
				}
				if (errs.length > 0)
					C.ConsoleError("Init: ошибки в строках атрибута 'o5menudef': ", errs.length, errs)

				MnuInit(items)
			}

		if (C.consts.o5nomnu > 0) C.ConsoleInfo(`Меню отключено по o5nomnu=${C.consts.o5nomnu}`)
		else {
			if (!W.isReady) {
				C.ParamsFill(W, o5css)
				window.olga5.Menu = MnuInit
			}

			const menu = (W.consts['o5menudef'] || '').trim()
			if (menu)	// если есть такой атрибут}
				InitByText(menu)

			const tags = C.GetTagsByClassNames('olga5-menuhidden', W.modul)
			if (tags)
				tags.forEach(tag => {
					InitByText(tag.innerText.trim())	//, tag)
				})
		}
		// window.dispatchEvent(new CustomEvent('olga5_sinit', { detail: { modul: W.modul } }))
		C.E.DispatchEvent('olga5_sinit', W.modul)
	}

	C.ModulAdd(W)
})();
/* -global document, window*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/*eslint no-useless-escape: 0*/
(function () {              // 3---------------------------------------------- o5ref ---
	'use strict';

	const
		C = window.olga5.C,
		currentScript = document.currentScript,
		W = {
			modul: 'o5ref',
			Init: RefInit,
			consts: 'o5tag_attrs=;',
			urlrfs: '',
		},
		ParseTagAttrs = params => {
			const errs = [],
				otags = {}
			// aa=onYouTubeIframeAPIReady
			for (const pnam in params) {
				const param = params[pnam]
				if (!param)
					errs.push({ 'где': `nam='${pnam}'`, err: `пустой параметр` })
				else {
					const regexp = /\s*[,;]+\s*/g,
						nams = pnam.split(regexp),
						attrs = param.split(regexp)

					for (const attr of attrs)
						if (attr && attr.match(/\s+/)) {
							errs.push({ par: `в значении '${pnam}=${attr}'`, err: `пробелы заменены ','` })
							attr.replace(/\s+/g, ',')
						}

					for (const nam of nams) {
						if (!nam) {
							errs.push({ par: `nam='${nam}'`, err: `пустой 'тег' в параметре` })
							continue
						}
						if (!otags[nam]) otags[nam] = {}
						for (const attr of attrs) {
							if (attr)
								if (!otags[nam][attr]) otags[nam][attr] = 0// счетчик использования
						}
					}
				}
			}
			if (errs.length > 0)
				C.ConsoleError(`Ошибки в параметрах`, 'o5tag_attrs', errs)
			return otags
		},
		ConvertUrls = otags => {
			let tagnams = ''
			for (const nam in otags)
				tagnams += (tagnams ? ',' : '') + nam

			const tags = C.GetTagsByTagNames(tagnams, W.modul),
				undefs = [],
				rez = []

			for (const tag of tags) {
				const nam = C.MakeObjName(tag),
					attrs = otags[(tag.tagName.toLowerCase())],
					o5attrs = C.GetAttrs(tag.attributes)

				for (const attr in attrs)
					if (attr) {
						const tagattr = tag.attributes[attr]
						if (tagattr) {
							const ori = tagattr.nodeValue,
								wref = C.DeCodeUrl(W.urlrfs, ori, o5attrs),
								anew = attr.replace(/(data-)|(_)/, '')
							// anew = (attr[0] == '_') ? attr.substring(1) : attr

							if (wref.err)
								undefs.push({ 'имя (refs)': nam, 'атрибут': attr, 'адрес': ori, 'непонятно': wref.err })

							if (wref.url && (ori != wref.url || attr != anew)) {
								if (attr != anew)     	// если обработано без ошибок, то удаляю - чтоб другие модули не повторяли
									tag.removeAttribute(attr)

								tag.setAttribute(anew, wref.url)

								rez.push({ nam: nam, attr: (attr + (anew != attr ? ` (${anew})` : ``)), src: ori, rez: wref.url })
								attrs[attr]++
							}
						}
					}
			}

			if (rez.length < 1) C.ConsoleError(`${W.modul}: не выполнено ни одной подстановки?`)
			else
				if (C.consts.o5debug > 0) C.ConsoleInfo(`${W.modul}: выполнено подстановок для тегов:`, rez.length, rez)

			if (undefs.length > 0)
				C.ConsoleError(`${W.modul}: неопределённые адреса: `, undefs.length, undefs)
			// if (unreal.length > 0) C.ConsoleAlert(`${W.modul}: непонятные адреса: `, unreal.length, unreal)
		},
		PrepTubes = () => {
			let YT = null
			const sel = 'o5youtube',
				tags = C.GetTagsByQueryes('[' + sel + ']'),
				onPlayerReady = e => {
					const aO5 = e.target.g.aO5
					if (!aO5.ready) { // при первой установке статуса удаляю фон чтоб не выглядывал
						aO5.ready = true
						aO5.tag.removeAttribute('style')
						if (aO5.style)
							aO5.tag.setAttribute('style', aO5.style)
					}
					// console.log(1)
				},
				onPlayerStateChange = e => {
					const act = e.target.getPlayerState(),
						aO5 = e.target.g.aO5
					if (C.consts.o5debug > 0) {
						let s = ''
						switch (act) {
							case 0: s = 'воспроизведение видео завершено'; break
							case 1: s = 'воспроизведение'; break
							case 2: s = 'пауза'; break
							case 3: s = 'буферизация'; break
							case 5: s = 'видео находится в очереди'; break
							default: s = 'воспроизведение видео не началось'
						}
						console.log(aO5.tag.id, 2, act, s)
					}
					if (act == 1) {
						window.dispatchEvent(new CustomEvent('olga5_stopPlay', { detail: { tag: aO5.tag, type: 'yt', } }))
					}
				},
				onYtReady = () => {	//	
					YT = window.YT
					// console.log(4)
				},
				AddFrame = e => {
					if (YT === null) {
						YT = 0
						const script = document.createElement('script')
						script.src = "https://www.youtube.com/iframe_api"

						script.onload = function () {
							window.YT.ready(onYtReady)
						}
						script.onerror = function () {
							C.ConsoleError("ошибка загрузки YouTube API ", this.src)
						}

						// var firstScriptTag = document.getElementsByTagName('script')[0]
						// firstScriptTag.parentNode.insertBefore(script, firstScriptTag)
						currentScript.parentNode.insertBefore(script, currentScript)
					}

					const tag = e.target,
						aO5 = tag.aO5yt

					if (YT && YT.loaded) {
						const x = document.createElement('div'),	// кандидат на намену через iFrame
							div = tag.appendChild(x)

						if (aO5.chkmove) {
							if (aO5.chkmove == 'wait')
								tag.removeEventListener('mousemove', AddFrame)
							tag.aO5yt.chkmove = ''
						}

						aO5.player = new window.YT.Player(div, {
							height: 'inherit',
							width: 'inherit',
							videoId: aO5.videoId,
							events: {
								'onReady': onPlayerReady,
								'onStateChange': onPlayerStateChange
							}
						})
						aO5.iframe = aO5.player.getIframe()
						aO5.iframe.aO5 = aO5

						// tag.addEventListener('olga5_stopPlay', e => {
						// 	// console.log(aO5.tag.id, 5)
						// 	e.target.aO5yt.player.playVideo()
						// })
						window.addEventListener('olga5_stopPlay', e => {
							const act = e.detail.tag
							for (const tag of tags)
								if (tag !== act && tag.aO5yt.player)
									tag.aO5yt.player.stopVideo()
							// console.log(act.id, 5, e.detail)
						})
					}
					else
						if (aO5.chkmove == 'ask') {
							aO5.chkmove = 'wait'
							tag.addEventListener('mousemove', AddFrame)
						}
				}

			for (const tag of tags) {
				const videoId = tag.attributes[sel].nodeValue,
					style = tag.getAttribute('style') || ''

				if (style)
					tag.removeAttribute('style')
				tag.setAttribute('style', style + `background: url(//img.youtube.com/vi/${videoId}/hqdefault.jpg) 0% 0% / contain no-repeat;background-position: center;`)
				tag.aO5yt = { player: null, videoId: videoId, chkmove: 'ask', tag: tag, style: style, ready: false }

				tag.addEventListener('mouseover', AddFrame, { once: true })
				// tag.addEventListener('olga5_stopPlay', e => {
				// 	if (this !== e.detail.tag)
				// 		this.aO5yt.player.stopVideo()
				// 	// console.log(act.id, 5, e.detail)
				// })
			}
		}

	function RefInit() {

		C.ParamsFill(W)

		const o5tag_attrs = 'o5tag_attrs',
			s = W.consts[o5tag_attrs]

		if (s) {
			const params = C.SplitParams(s, o5tag_attrs, ';\n'),
				otags = ParseTagAttrs(params)
			if (C.consts.o5debug > 0) C.ConsoleInfo(`${W.modul}: обрабатываемые атрибуты тегов`, o5tag_attrs, otags)
			ConvertUrls(otags)
		}

		PrepTubes()
		// PrepTables()

		// window.dispatchEvent(new CustomEvent('olga5_sinit', { detail: { modul: W.modul } }))
		C.E.DispatchEvent('olga5_sinit', W.modul)

		// InitRPos()
	}

	C.ModulAdd(W)
})();
/* -global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- o5snd/AO5snd ---
    "use strict"
    const
        olga5_modul = 'o5snd',
        modulname = 'AO5snd',
        C = window.olga5.C,
        wshp = C.ModulAddSub(olga5_modul, modulname, snd => {
            const
                ss = wshp.setClass,
                olga5sndError = wshp.css.olga5sndError,
                W = window.olga5.find(w => w.modul == olga5_modul), // так делать во всех подмодулях 
                o5debug = C.consts.o5debug,
                lognam = `${olga5_modul}/${modulname} `,
                o5shift_speed = W.consts.o5shift_speed < 0.2 ? 0.2 : W.consts.o5shift_speed,

                SetTitle = (aO5, txt) => {
                    aO5.snd.title = txt
                    if (aO5.image.play)
                        aO5.image.play.title = aO5.snd.title
                },
                setVolume = {
                    step: 0.1,
                    vmin: 0.2,
                    vmax: 1.0,
                    SetV: (aO5, add) => {
                        if (add == 0) SetTitle(aO5, ``)
                        else {
                            const audio = aO5.sound.audio,
                                v = audio.volume + add * setVolume.step,
                                txt = `громкость=${parseInt(v * 100)}%`

                            audio.volume = v > setVolume.vmax ? setVolume.vmax : (v < setVolume.vmin ? setVolume.vmin : v)
                            SetTitle(aO5, txt)
                            if (o5debug > 1)
                                console.log(`${lognam} Изменено: ${txt} для '${aO5.name}' }`)
                        }
                    }
                },
                errTypes = {
                    'неАктивир.': 'звук не проигрывалтся (автоматически) т.к. не активирована страница',
                    'неЗагружен': `ошибка в 'audio' (если еще не загружено - повторите)`,
                    'неРазрешен': 'прежде проигрывать - активируйтесь на странице (это требование браузера)',
                    'ошибкаКода': 'ошибка в коде',
                    'естьОшибка': 'ошибка проигрывания',
                    SetT: (aO5, mrk, err) => {
                        aO5.sound.errIs[mrk] = err
                        const t = aO5.title
                        SetTitle(aO5, err ? `Для тега ${t ? ("'" + t + "'") : ''} ошибка: ${errTypes[mrk]}` : t)
                    },
                    AddError: (aO5, mrk, txt) => {
                        if (!aO5.sound.errIs[mrk]) {
                            errTypes.SetT(aO5, mrk, true)
                            C.ConsoleError(`"${errTypes[mrk]}" (код=${mrk})` + (txt ? ` ${txt}` : '') + ` для '${aO5.name}'`)

                            aO5.sound.errIs.errs = true
                            if (!aO5.snd.classList.contains(olga5sndError))
                                aO5.snd.classList.add(olga5sndError)
                        }
                    },
                    RemError: (aO5, mrk) => {
                        if (aO5.sound.errIs[mrk]) {
                            errTypes.SetT(aO5, mrk, false)
                            console.log(`${lognam} Устранена ошибка: errTypes.${mrk}`)

                            const errIs = aO5.sound.errIs
                            for (const erri in errIs)
                                if (erri != 'errs' && errIs[erri])
                                    return

                            aO5.sound.errIs.errs = false
                            if (aO5.snd.classList.contains(olga5sndError))
                                aO5.snd.classList.remove(olga5sndError)
                        }
                    }
                },
                StartSound = (aO5) => {
                    const sound = aO5.sound,
                        audio = sound.audio,
                        Play = (aO5) => {
                            if (o5debug > 1) console.log(`${lognam}   > Play()`)

                            if (aO5.modis.over && !wshp.activated)
                                errTypes.AddError(aO5, 'неАктивир.')

                            if (sound.ison) { // если курсор не ушел
                                if (o5debug > 1) console.log(`${lognam} --> Play OK`)
                                try {
                                    const audio = sound.audio
                                    // audio.volume = aO5.sound.volume
                                    audio.playbackRate = sound.shiftKey != 0 ? o5shift_speed : 1.0
                                    if (sound.state != ss.pause) audio.currentTime = 0 // т.е. если перезапуск старого музона	
                                    else audio.currentTime = Math.max(audio.currentTime - W.consts.o5return_time, 0)

                                    audio.play()
                                }
                                catch (e) {
                                    console.error(`ошибка воспроизведения:`, e.message)
                                }
                            }
                            else
                                wshp.StopSound(aO5)
                        }

                    if (o5debug > 1) console.log(`${lognam} --> StartSound() из '${aO5.sound.state}'`)

                    if (wshp.actaudio && wshp.actaudio != audio)
                        wshp.StopSound(wshp.actaudio.aO5snd)
                    
					window.dispatchEvent(new CustomEvent('olga5_stopPlay', { detail: { tag: wshp.actaudio, type: 'audio(moe)', } }))

                    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
                        Play(aO5)
                    else {
                        wshp.setClass.SetC(aO5, wshp.setClass.pause)
                        audio.addEventListener('canplay', () => Play(aO5), { capture: true, once: true })
                    }
                    // }
                },
                GetTargetObj = e => {
                    let obj = e.target
                    while (obj && !obj.aO5snd) obj = obj.parentElement
                    if (obj && obj.aO5snd) return obj
                },
                /*
    + mouseleave  когда курсор манипулятора (обычно мыши) перемещается за границы элемента.
    - mouseout    когда курсор покидает границы элемента или одного из его дочерних элементов
    + mouseenter  не отправляется никаким потомкам, когда указатель перемещается из пространства 
    - mouseover   отправляется в самый глубокий элемент дерева DOM, затем оно всплывает в иерархии
                */
                eFocus = ['mouseenter', 'focus'],
                Activate = e => {
                    const snd = GetTargetObj(e),
                        aO5 = snd.aO5snd,
                        PlayError = (aO5, e) => {
                            if (o5debug > 0) console.error(`--> PlayError ${aO5.name}`, e)
                            if (e.name == 'TypeError') errTypes.AddError(aO5, 'ошибкаКода')
                            else if (e.name == 'NotAllowedError') errTypes.AddError(aO5, 'неРазрешен')
                            else if (e.code != 20) errTypes.AddError(aO5, 'естьОшибка',
                                `e.type='${e.type}'` + e.code ? `\n\tcode= '${e.code}': ${e.message}` : ``)
                        },
                        eAudios = [
                            {
                                type: 'error', Act: (snd, e) => {
                                    const aO5 = snd.aO5snd
                                    errTypes.AddError(aO5, 'неЗагружен',
                                        `\n${e.type}: (это при audio_play= '${aO5.parms.audio_play}', attrs.aplay= '${aO5.modis.aplay}') `)
                                }
                            },
                            {
                                type: ss.play, Act: snd => {
                                    const aO5 = snd.aO5snd,
                                        sound = aO5.sound,
                                        errIs = sound.errIs
                                    if (aO5.sound.errIs.errs)
                                        for (const mrk in errTypes)
                                            if (typeof mrk === 'string' && errIs[mrk])
                                                errTypes.RemError(aO5, mrk)

                                    wshp.setClass.SetC(aO5, wshp.setClass.play)
                                    wshp.actaudio = sound.audio
                                    wshp.activated = true
                                }
                            },
                            {
                                type: 'ended', Act: snd => {
                                    const aO5 = snd.aO5snd
                                    if (aO5.modis.loop) {
                                        const audio = aO5.sound.audio
                                        audio.currentTime = 0
                                        audio.play()
                                    } else
                                        wshp.StopSound(aO5)
                                }
                            },
                            { type: 'loadstart', Act: snd => snd.classList.add(wshp.css.olga5sndLoad) },
                            { type: 'loadeddata', Act: snd => snd.classList.remove(wshp.css.olga5sndLoad) },
                            { type: 'abort', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                            { type: 'stalled', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                        ],
                        OnPlayAct = (e, eacts, txt) => {
                            const type = e.type,
                                snd = GetTargetObj(e),
                                aO5 = snd.aO5snd

                            if (o5debug > 1) console.log(`${lognam}  OnPlayAct.${txt}  ${('' + e.timeStamp).padStart(8)}` +
                                ` для ${aO5.name} '${type}' при isOny= ${aO5.sound.ison}`)

                            eacts.find(eact => eact.type == type).Act(snd, e)
                        },
                        OnPlayActAudios = e => { OnPlayAct(e, eAudios, 'audio') },
                        StopBubble = e => {
                            e.stopPropagation()  // 
                            e.preventDefault()
                            e.cancelBubble = true
                            return false
                        },
                        CallStartSound = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd,
                                sound = aO5.sound

                            // if (o5debug > 1) console.log(`${lognam}  CallStartSound() ${aO5.name} '${aO5.sound.state}'  e.type= '${e.type}'`)
                            Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })

                            if (e.type == 'mouseenter')
                                switch (sound.state) {
                                    case ss.pause: sound.audio.play()
                                        break
                                    case ss.stop: if (aO5.modis.over) StartSound(aO5)
                                        break
                                    default: return
                                }
                            else if (e.type == 'click') {
                                const isA = snd.tagName.toUpperCase() == 'A'
                                switch (sound.state) {
                                    case ss.pause:
                                        if (isA) {
                                            wshp.StopSound(aO5)
                                            return // чтобы избежать StopBubble(e)
                                        }
                                        else sound.audio.play()
                                        break
                                    case ss.stop: StartSound(aO5)
                                        break
                                    case ss.play:
                                        sound.audio.pause()
                                        wshp.setClass.SetC(aO5, wshp.setClass.pause)
                                }

                                if (isA)
                                    return StopBubble(e)
                            }
                        },
                        CallStopSound = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd

                            if (e.type == 'mouseleave') {
                                aO5.sound.ison = false
                            }
                            if (aO5.sound.state != ss.stop &&
                                snd.style.display != 'none' &&
                                (!aO5.modis.alive || aO5.sound.audio.paused)) {

                                wshp.StopSound(aO5)

                                SetTitle(aO5, '')
                                if (e.type == 'click') // для любых тегов - только лишь остановить музон
                                    return StopBubble(e)
                            }
                        },
                        DoKeyDown = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd,
                                sound = aO5.sound,
                                key = e.key.match(/ArrowUp|ArrowRight/) ? 1 :
                                    (e.key.match(/ArrowDown|ArrowLeft/) ? -1 : 0)
                            if (sound.ison && sound.audio.played && key != 0) {
                                setVolume.SetV(aO5, key)
                                return StopBubble(e)
                            }
                        },
                        SetEventListeners = snd => {
                            snd.addEventListener('mouseleave', CallStopSound, { capture: true })
                            snd.addEventListener('keydown', DoKeyDown, { capture: true })
                            snd.addEventListener('click', CallStartSound, { capture: true })
                            if (snd.aO5snd.modis.over)
                                StartSound(aO5)
                        },
                        audio = aO5.sound.audio = new Audio() // ocument.createElement('audio'),

                    if (o5debug > 1) console.log(`${lognam}  Activate ${aO5.name} '${e.type}'`)

                    setVolume.SetV(aO5, 0)

                    for (const eWait of eFocus) // убрал оба чтоб не срабатывали
                        snd.removeEventListener(eWait, Activate, { capture: true })

                    Object.assign(audio, { aO5snd: aO5, src: aO5.parms.audio_play, autoplay: false, controls: false, muted: false, loop: false, crossorigin: "" })
                    audio.load()

                    for (const eAudio of eAudios)
                        audio.addEventListener(eAudio.type, OnPlayActAudios, { capture: true })

                    Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })
                    if (!aO5.image.play)
                        if (aO5.parms.image_play)
                            wshp.imgs.makeImgPlay(aO5, SetEventListeners)  // StartSound, 
                        else
                            aO5.image.play = aO5.image.stop

                    snd.addEventListener('mouseenter', CallStartSound, { capture: true })
                    SetEventListeners(snd)

                },
                WaitActivate = snd => {
                    if (snd.aO5snd.modis.none) return

                    if (o5debug > 2) console.log(`${lognam}  WaitActivate ${snd.id}`)
                    for (const eWait of eFocus)
                        snd.addEventListener(eWait, Activate, { capture: true })
                }

            class AO5snd {
                constructor(snd) {
                    const aO5 = this
                    aO5.snd = snd
                    aO5.title = snd.title
                    aO5.name = C.MakeObjName(snd)
                    aO5.o5attrs = C.GetAttrs(snd.attributes)
                    aO5.srcAtr = snd.hasAttribute('href') ? 'href' : (snd.hasAttribute('src') ? 'src' : '')

                    for (const errType in errTypes)
                        if (typeof errType === 'string') aO5.sound.errIs[errType] = false

                    Object.seal(aO5.attrs)  // freeze() дам в PrepareSnds
                    Object.seal(aO5.parms)  // -"-
                    Object.seal(aO5.sound)	// не замораживается 
                    Object.seal(aO5.image)	// -"-
                    Object.freeze(aO5)

                    if (snd.tagName.match(/img/i))
                        aO5.image.stop = snd

                    snd.aO5snd = aO5
                }

                snd = null; title = ''; name = ''; o5attrs = null; srcAtr = null;

                modis = { over: false, alive: false, loop: snd.getAttribute('loop'), aplay: '', dspl: snd.style.display, none: false }
                sound = { audio: null, errIs: { errs: false, }, state: ss.stop, eventsAreSet: false, ison: false, shiftKey: 0 }
                parms = { audio_play: '', image_play: '' }
                image = { stop: null, play: null }

                // для доступа из o5snd
                waitActivate = snd => WaitActivate(snd)
            }
            return new AO5snd(snd)

        }

        )

})();
/* -global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- o5snd/Prep ---
    "use strict"

    const
        olga5_modul = 'o5snd',
        modulname = 'Prep',
        C = window.olga5.C,
        o5debug = C.consts.o5debug,
        lognam = `${olga5_modul}/${modulname} `,
        StopSoundOnPage = () => {
            if (wshp.actaudio)
                wshp.StopSound(wshp.actaudio.aO5snd)
        },
        TryEncode = (ori, tag) => {
            const wref = C.DeCodeUrl(wshp.W.urlrfs, ori.url, tag ? tag.aO5snd.o5attrs : '')
            if (wref.err.length > 0)
                errs.Add(C.MakeObjName(tag), ori.url, "декодир. ссылки", ori.atr, wref.err)
            return wref.url
        },
        urlattrs = [],
        errs = [],
        wshp = C.ModulAddSub(olga5_modul, modulname, mtags => {
            const btns = { stop: '', play: '' },
                DecodeAttrs = (mtag) => {
                    const snd = mtag.tag,
                        scls = snd.className,
                        aO5 = snd.aO5snd,
                        modis = aO5.modis,
                        ers = []
                    for (const qual of mtag.quals) {
                        const c = qual.substring(0, 1).toUpperCase()

                        if ('AOLFN'.indexOf(c) >= 0)
                            switch (c) {
                                case 'A': modis.alive = true
                                    break
                                case 'O': modis.over = true
                                    break
                                case 'L': modis.loop = true
                                    break
                                case 'F': if (!snd.classList.contains(wshp.css.olga5freeimg))
                                    snd.classList.add(wshp.css.olga5freeimg)
                                    break
                                case 'N': modis.none = true
                                    break
                                default: ers.push(qual)
                            }
                        else
                            modis.aplay = qual.replace(/^[`'"]?\s*|\s*[`'"]?$/g, '')
                    }

                    if (ers.length > 0)
                        errs.Add(aO5.name, scls, 'квалиф. класса', ers.join(', '), "ошибочные квалиф.")

                    if (!modis.aplay && !modis.none)
                        errs.Add(aO5.name, scls, `игнор остальных квалиф.`, 'audio_play', "нету аудио-квалиф.")

                    if (aO5.modis.none) snd.classList.add(wshp.css.olga5sndNone)

                    if (!snd.alt || (snd.alt.trim() == '')) snd.alt = snd.title.trim()
                },
                PrepOther = aO5 => {
                    const snd = aO5.snd,
                        srcAtr = aO5.srcAtr,
                        ori = wshp.OriForTag(snd, srcAtr, '')

                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        if (url != snd[srcAtr]) {
                            snd.setAttribute(srcAtr, url)
                            urlattrs.push({ snd: aO5.name, atr: srcAtr, url: url, 'ориг.': ori.url })
                        }
                    }
                    else
                        errs.Add(aO5.name, 'PrepUrlsAudio()', `тег <${aO5.snd.tagName}>`, '', `Нет ${'data-' + srcAtr}, ${'_' + srcAtr} или ${srcAtr}`)

                    if (ori.atr == 'data-' + srcAtr || ori.atr == '_' + srcAtr)
                        snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

                },
                GetBtnUrl = (atr) => {
                    const ori = { url: wshp.W.urlrfs[atr], atr: atr }

                    if (ori.url) {
                        const url = TryEncode(ori, null)
                        if (url != ori.url)
                            urlattrs.push({ snd: atr, atr: ori.atr, url: url, 'ориг.': ori.url })
                        return url
                    }
                }

            for (const mtag of mtags) {
                const snd = mtag.tag,
                    tagName = snd.tagName.toLowerCase()

                if (tagName.match(/audio/i)) continue

                const aO5 = wshp.AO5snd(snd)

                if (mtag.quals && mtag.quals.length > 0) {
                    DecodeAttrs(mtag)

                    const ori = { url: aO5.modis.aplay, atr: 'audio_play' }
                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        aO5.parms.audio_play = url
                        urlattrs.push({ snd: aO5.name, atr: ori.atr, url: url, 'ориг.': ori.url })
                    }
                }
                else if (!aO5.modis.none)
                    errs.Add(aO5.name, 'PrepUrlsSnd()', `для тега <${aO5.snd.tagName}> '${aO5.name}' `, '', `нет 'audio_play' или иных атрибутов url'а`)

                if (aO5.image.stop) {
                    if (!wshp.imgs) {
                        wshp.imgs = wshp.Imgs()
                        btns.stop = GetBtnUrl('btn_stop') || ''
                        btns.play = GetBtnUrl('btn_play') || ''
                    }
                    const urlatr = wshp.imgs.prepImage(aO5, btns, TryEncode)
                    if (urlatr.snd)
                        urlattrs.push(urlatr)

                    if (snd.src) wshp.imgs.regiBySrc(snd)
                }
                else
                    if (aO5.srcAtr) // если есть адрес - пробую перекодировать
                        PrepOther(aO5)

                aO5.waitActivate(snd)

                Object.seal(aO5.modis) // м.б. изменено 'none'
                Object.freeze(aO5.parms)
            }

            // window.addEventListener('olga5_done', StopSoundOnPage)
            C.E.AddEventListener('olga5_done', StopSoundOnPage)
            for (const eve of ['blur', 'pagehide', 'dblclick'])
                document.addEventListener(eve, StopSoundOnPage)

            /*
                        PrepareAudios
            */
            const audios = C.GetTagsByTagNames('audio', wshp.W.modul),
                efirsts = ['mouseenter', 'focusin'],
                OnPlay = (audio) => {                    
					window.dispatchEvent(new CustomEvent('olga5_stopPlay', { detail: { tag: audio, type: 'audio(тег)', } }))
                    const a = wshp.actaudio
                    if (a && a != audio)
                        wshp.StopSound(a.aO5snd)

                    wshp.actaudio = audio
                },
                OnEnter = (e) => {
                    const audio = e.target
                    audio.setAttribute('src', audio.aO5snd.url)
                    efirsts.forEach(efirst => audio.removeEventListener(efirst, OnEnter))
                }

            for (const audio of audios) {
                const aO5 = audio.aO5snd = {
                    url: '',
                    audio: audio,
                    sound: { state: wshp.setClass.stop, },
                    name: C.MakeObjName(audio),
                    o5attrs: C.GetAttrs(audio.attributes),
                }

                const name = C.MakeObjName(audio),
                    ori = wshp.OriForTag(audio, 'src', 'audio_play')

                if (ori.url) {
                    const url = TryEncode(ori, audio),
                        src = audio.getAttribute('src')
                    if (ori.url != src) {
                        aO5.url = url
                        efirsts.forEach(efirst => audio.addEventListener(efirst, OnEnter))
                    }
                    if (url != src)
                        urlattrs.push({ snd: name, atr: 'src', url: url, 'ориг.': ori.url })

                    audio.addEventListener('play', e => { OnPlay(e.target) })
                }
                else
                    errs.Add(name, 'PrepUrlsAudio()', `тег 'audio'`, '', `Нет 'audio_play', 
                            ${'data-' + aO5.srcAtr}, ${'_' + aO5.srcAtr}, ${aO5.srcAtr}`)
            }

            if (urlattrs.length > 0)
                if (C.consts.o5debug > 0) C.ConsoleInfo(`Всего выполнено подстановок snd/audio`, urlattrs.length, urlattrs)

            if (errs.length > 0)
                C.ConsoleError(`${wshp.W.modul}: ошибки перекодировки тегов с ${wshp.W.class}`, errs.length, errs)
        })


    errs.Add = function (name, url, txt, atr, err) {
        this.push({ snd: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
    }

    Object.assign(wshp, {
        setClass: {
            stop: 'stop', play: 'play', pause: 'pause',
            SetC: (aO5, state) => {
                if (o5debug > 1) console.log(`${lognam} SetC (${aO5.name}, '${state}')`)
                const classList = (aO5.image.play ? aO5.image.play : aO5.snd).classList
                if (state == wshp.setClass.play) {
                    const image = aO5.image
                    if (image.play) {
                        image.stop.style.display = 'none'
                        image.play.style.display = aO5.modis.dspl
                    }
                    classList.add(wshp.css.olga5sndPlay)
                    classList.remove(wshp.css.olga5sndPause)
                }
                else if (state == wshp.setClass.pause) {
                    classList.remove(wshp.css.olga5sndPlay)
                    classList.add(wshp.css.olga5sndPause)
                }
                else if (state == wshp.setClass.stop) {
                    classList.remove(wshp.css.olga5sndPlay)
                    classList.remove(wshp.css.olga5sndPause)
                }
                else alert(`setClass.SetC: state='${state}'`)
                aO5.sound.state = state
            }
        },
        OriForTag: (tag, ref, atnam) => {
            const ori = { url: '', atr: '' },
                attr = atnam ? C.GetAttribute(tag.aO5snd.o5attrs, atnam) : ''
            if (attr)
                Object.assign(ori, { url: attr.value, atr: atnam })
            else
                if (ref) {
                    const td = C.TagDes(tag, ref)
                    if (td)
                        Object.assign(ori, { url: td.orig, atr: td.from })
                }
            return ori
        },
        StopSound: aO5 => {
            if (o5debug > 1) console.log(`${lognam}  StopSound (${aO5.name})`)

			// тут его НИЗЗЯ ! window.dispatchEvent(new CustomEvent('olga5_stopPlay', { detail: { tag: aO5.audio, type: 'audio', } }))

            wshp.actaudio = null

            const image = aO5.image,
                audio = aO5.audio ? aO5.audio : aO5.sound.audio

            audio.pause()
            audio.currentTime = 0
            aO5.sound.state = wshp.setClass.stop

            if (image && image.play) {
                image.play.style.display = 'none'
                image.stop.style.display = aO5.modis.dspl
            }

            if (audio !== aO5.audio)
                wshp.setClass.SetC(aO5, wshp.setClass.stop)
        },
    })

    window.addEventListener('olga5_stopPlay', e => {
        if (wshp.actaudio && wshp.actaudio != e.detail.tag)
            wshp.StopSound(wshp.actaudio.aO5snd)
        // console.log(act.id, 5, e.detail)
    })

})();
/* -global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- o5snd/Imgs ---
    "use strict"
    const
        C = window.olga5.C,
        olga5_modul = 'o5snd',
        modulname = 'Imgs',
        wshp = C.ModulAddSub(olga5_modul, modulname, () => {
            let imgs = null
            const
                a = document.createElement('a'),
                lognam = `${olga5_modul}/${modulname} `,
                FullUrl = (url) => {
                    if (C.IsFullUrl(url)) return url
                    else {
                        a.href = url
                        return a.href
                    }
                },
                GetImgForRef = (ref) => new Promise((Resolve, Reject) => {
                    if (!ref)
                        Reject(`Неопределённая 'ref'-ссылка`)

                    const url = FullUrl(ref),
                        maps = imgs.maps,
                        map = maps.get(url)

                    if (map) Resolve({ img: map.img, new: false })
                    else {
                        /*	https://codeengineered.com/blog/09/12/performance-comparison-documentcreateelementimg-vs-new-image/
                        For now I’m going to continue to use document.createElement('img'). 
                        Not only is this the w3c recommendation but it’s the faster method in IE8, the version users are slowly starting to adopt.
                        */
                        if (C.consts.o5debug > 2)
                            console.log(`${lognam} olga5_Imgs создание нового для url=${url}`)

                        const nimg = document.createElement('img')
                        Object.assign(nimg, { src: url, importance: 'high', loading: 'eager', crossOrigin: null })
                        maps.set(url, { img: nimg, err: '' })

                        nimg.addEventListener('load', () => {
                            if (C.consts.o5debug > 1)
                                console.log(`${lognam} GetImgForRef: загружен url= ${url}`)
                            if (url.trim() == '')
                                alert('url=?')
                            Resolve({ img: nimg, new: true })
                        }, { once: true })

                        nimg.addEventListener('error', e => {
                            // Reject(`GetImgForRef: для url=${url}- ошибка ${e.message ? e.message : 'не определен (?)'}`)
                            Reject({ err: `GetImgForRef ошибка: ${e.message ? e.message : 'не определен'}`, url: url })
                        }, { once: true })
                    }
                }),
                RegiBySrc = (maps, img) => new Promise((Resolve, Reject) => {
                    if (img && img.src) {
                        const src = img.src,
                            url = FullUrl(src),
                            s = url == src ? '' : `(src=${src})`,
                            isinmap = maps.get(url)

                        if (!isinmap)
                            maps.set(url, { img: img.cloneNode(true), err: '' })
                        if (C.consts.o5debug > 1)
                            console.log(`${lognam} olga5_Imgs ${isinmap ? 'повтор  ' : 'добавлен'} url=${url} для img.id='${img.id}' ${s}`)
                    }
                    else
                        console.error(`olga5_Imgs : попытка добавить` + (img ? ` пустой src для img.id='${img.id}'` : ` пустой  <img>`))
                }),
                CopyStyle = (img, newimg) => {
                    newimg.className = img.className
                    if (img.attributes.style) {
                        if (!newimg.attributes.style)
                            newimg.setAttribute('style', '')
                        newimg.attributes.style.nodeValue += img.attributes.style.nodeValue
                    }
                },
                MakeImgPlay = (aO5, SetEventListeners) => { //  StartSound, 
                    GetImgForRef(aO5.parms.image_play).then(nimg => {
                        console.log(`MakeImgPlay.GetImgForRef.then() для ='${aO5.name}' с image_play=${aO5.parms.image_play}`)
                        const img = aO5.image.stop,
                            newimg = nimg.new ? nimg.img : nimg.img.cloneNode(false)

                        Object.assign(newimg, {
                            id: (img.aO5snd.id ? img.aO5snd.id : C.MakeObjName(img.aO5snd)).replace('_stop', '') + '_play',
                            aO5snd: img.aO5snd, // тут НЕ делать новый, в создавать ссылку
                            title: img.aO5snd.title,
                        })
                        CopyStyle(img, newimg)
                        aO5.image.play = newimg

                        SetEventListeners(newimg)

                        newimg.style.display = 'none'
                        img.parentNode.insertBefore(newimg, img.nextSibling)
                        if (aO5.sound.state != 'stop') {
                            aO5.image.stop.style.display = 'none'
                            aO5.image.play.style.display = aO5.modis.dspl
                        }
                        // if (aO5.modis.over)
                        //     StartSound(aO5)
                    }).
                        catch(err => {
                            C.ConsoleError(`MakeImgPlay.${err}`)
                        })
                },
                SetImgByRef = (img, ref) => { // подставить новый nimg вместо img с 'недествительным' src	
                    GetImgForRef(ref).then(nimg => {
                        const newimg = nimg.new ? nimg.img : nimg.img.cloneNode(true)
                        Object.assign(newimg, {
                            // id: (img.id ? img.id : img.aO5snd.name) + '_stop',
                            id: img.id, // оставляю тот же id
                            aO5snd: Object.assign({}, img.aO5snd), // тут - НОВЫЙ aO5
                            title: img.aO5snd.title,
                        })
                        newimg.name = C.MakeObjName()
                        const aO5 = newimg.aO5snd

                        Object.assign(aO5, { snd: newimg, id: newimg.id })
                        CopyStyle(img, newimg)
                        aO5.image.stop = newimg

                        aO5.waitActivate(newimg)

                        img.parentNode.insertBefore(newimg, img.nextSibling)
                        img.parentNode.removeChild(img)
                        img = null
                    }).catch(reject => {
                        C.ConsoleError(reject.err, reject.url.replace(/https?:\/\//, ''))
                    })
                    // }).catch(err => {
                    //     C.ConsoleError(`SetImgByRef.${err}`)
                    // })
                },
                PrepImage = (aO5, btns, TryEncode) => {
                    const urlatr = {},
                        snd = aO5.snd,
                        iatr = 'image_play',
                        ori = wshp.OriForTag(snd, '', iatr)

                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        aO5.parms.image_play = url // а сам aO5.image.play будет (при задании 'image_play') создан лишь при обращении
                    }
                    else {
                        const iplay = snd.getAttribute(iatr)
                        if (iplay) {
                            const url = TryEncode({ atr: iatr, url: iplay }, snd)
                            aO5.parms.image_play = url
                        }
                        else
                            if (btns.play)
                                aO5.parms.image_play = btns.play
                    }

                    Object.assign(ori, wshp.OriForTag(snd, 'src', ''))

                    if (ori.url) {
                        const url = TryEncode(ori, snd),
                            src = snd.getAttribute('src')

                        if (url && src != url) {
                            SetImgByRef(aO5.snd, url)
                            Object.assign(urlatr, { snd: aO5.name, atr: 'src', url: url, 'ориг.': ori.url })

                        } else
                            aO5.waitActivate(aO5.image.stop)
                    }
                    else
                        if (btns.stop) SetImgByRef(aO5.snd, btns.stop)
                        else
                            console.error(aO5.name, 'PrepImage()', `тег <img>`, '', `Нет вариантов url'а и отсутствует 'btn_stop'`)

                    if (ori.atr == 'data-src' || ori.atr == '_src')
                        snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

                    return urlatr
                }

            class Imgs {
                constructor() { this.maps = new Map() }
                makeImgPlay = (aO5, StartSound, CallStartSound, CallStopSound) => MakeImgPlay(aO5, StartSound, CallStartSound, CallStopSound)
                regiBySrc = img => RegiBySrc(this.maps, img)
                prepImage = (aO5, btns, TryEncode) => PrepImage(aO5, btns, TryEncode)
            }
            imgs = new Imgs()
            return imgs
        }
        )
})();
/* -global document, window*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o5snd ---
	'use strict';

	const
		C = window.olga5.C,
		W = {
			modul: 'o5snd',
			Init: SndInit,
			class: 'olga5_snd',
			consts: `		
				o5shift_speed=0.5 # при Shift - замедлять вдвое;
				o5return_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
			`,
			urlrfs: 'btn_play=""; btn_stop=',
			incls: {
				names: ['AO5snd', 'Imgs', 'Prep'],
				actscript: document.currentScript,
			}
		},
		wshp = C.ModulAdd(W),
		css = {
			olga5sndError: `olga5-sndError`, olga5sndLoad: `olga5-sndLoad`, olga5sndPause: `olga5-sndPause`,
			olga5sndPlay: `olga5-sndPlay`, olga5sndNone: `olga5-sndNone`, olga5freeimg: `olga5-freeimg`,
		},
		o5css = `
		.${W.class}:not(.${css.olga5sndNone}) {
			cursor: pointer;
		}
		.${W.class}.${css.olga5sndPlay} {
			cursor: progress;
			animation: olga5_viewTextWash 5s infinite linear;
		}
		.${W.class}.${css.olga5sndPause} {
			cursor: wait;
			animation: none;
		}
		.${W.class}.${css.olga5sndError} {
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}
		.${W.class}.${css.olga5sndLoad} {
			opacity: 0.5;
			outline: 1px dotted black;
			cursor: wait;
		}
		img.${W.class}:not(.${css.olga5freeimg}) {
			background-color: transparent;
			position: inherit;
			padding: 0 !important;
			vertical-align: bottom;
			border-radius: 50%;
			box-shadow: none !important;
			animation: none;
			max-height: 28px;
			max-width:  28px;
		}
		img.${W.class}.${css.olga5sndPlay} {
			animation: olga5_sndImgSwing 2s infinite linear;
		}
		@keyframes olga5_viewTextWash {
			100%,0% {background-color: white;color: aqua;}
			75%,25% {background-color: gold;}
			50% {background-color: coral;color: blue;    }
		}
		@keyframes olga5_sndImgSwing {
			100%,50%,0% {transform: rotateZ(0deg);}
			25% {transform: rotateZ(33deg);}
			75% {transform: rotateZ(-33deg);}
		}
	`

	function SndInit() {

		wshp.css = css

		C.ParamsFill(W, o5css)


		const excls = document.getElementsByClassName('olga5_snd_none') 
		for (const excl of excls) {
			const exs = excl.querySelectorAll('[class *=olga5_snd]')
			for (const ex of exs)
				ex.classList.add('olga5-sndNone')
		}

		const mtags = C.SelectByClassName(W.class, W.modul)
		wshp.Prep(mtags)

		// window.dispatchEvent(new CustomEvent('olga5_sinit', { detail: { modul: W.modul } }))
		C.E.DispatchEvent('olga5_sinit', W.modul)
	}

})();
/* -global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- o5shp/MakeAO5 ---
    "use strict"
    let wshp = {} 
        // debugids = ['shp_text', 'shp_1÷4']

    const
        olga5_modul = "o5shp",
        modulname = 'MakeAO5',
        C = window.olga5.C,
        SetClick = (aO5, clk, next) => {
            if (next) aO5.act.underClick = clk
            else {
                aO5.act.wasClick = clk
                aO5.fix.iO5up = clk ? aO5.fix.iO5 : null
                aO5.cart.style.zIndex = clk ? aO5.cls.minIndex : aO5.cls.zIndex
            }
            for (const iO5 of aO5.aO5s) {
                iO5.act.underClick = clk
                SetClick(iO5, clk, true)
            }
            wshp.DoScroll(aO5.cls.aO5o)
        },
        Show = aO5 =>  {
            if (!aO5.act.dspl){
            aO5.act.dspl = true
            aO5.cart.style.display = ''
            aO5.shdw.style.opacity=0        
            for (const iO5 of aO5.aO5s) Show(iO5)}
        },
        Hide = aO5 => {
            if (aO5.act.dspl){
            aO5.act.dspl = false
            aO5.shdw.style.opacity=1
            aO5.cart.style.display = 'none'
            for (const iO5 of aO5.aO5s) Hide(iO5)}
        },
        DoFixV = (aO5, iO5) => {
            const posC = aO5.posC,
                putV = aO5.cls.putV,
                hovered = aO5.hovered

            if (putV == 'T') {
                if (iO5) posC.top = iO5.posC.top + iO5.posC.height
                else posC.top = hovered.to.pos.top
            } else {
                const bottom = iO5 ? iO5.posC.top : hovered.to.pos.bottom
                if (iO5) posC.top = iO5.posC.top + iO5.posC.height
                else posC.top = bottom - posC.height
            }
            Object.assign(aO5.fix, { putV: putV, iO5: iO5 })
        },
        DoShpClick = function (e) {
            const
                MarkClick = aO5 => {
                    if (aO5.fix.putV === '') {
                        const parents = aO5.prev.pO5.prevs, // ДОБАВИЛ !!
                            m = parents.length,
                            lastParent = m > 0 ? parents[m - 1] : null
                        if (lastParent && lastParent.aO5shp)
                            MarkClick(lastParent.aO5shp)
                    } else
                        aO5.SetClick(true)
                }

            let shp = e.target
            while (shp && !shp.aO5shp) shp = shp.parentElement

            if (shp && shp.aO5shp) {
                if (shp.onclick) shp.onclick(e)
                MarkClick(shp.aO5shp)
            }
        },
        Clone = function (aO5) {
            if (C.consts.o5debug > 1)
                console.log(`----------------- клонирую '${aO5.name}' -----------`)

            const shp = aO5.shp,
                cart = aO5.cart = document.createElement('div'),
                shdw = aO5.shdw = shp.cloneNode(true),
                posC = shp.getBoundingClientRect()

            // cart
            Object.assign(cart.style, {
                width: Math.ceil(posC.width) + 'px',
                height: Math.ceil(posC.height) + 'px',
                left: (posC.left) + 'px',
                top: (posC.top) + 'px',
            })
            cart.aO5shp = aO5 // чтобы найти при обработке клика
            cart.pO5 = null

            cart.classList.add(wshp.olga5cart)

            // коррекция shdw
            shdw.classList.add(C.olga5ignore)

            const add = '_shdw',
                parentNode = shp.parentNode,
                ids = shdw.querySelectorAll("[id]")

            ids.forEach(id => {
                if (id.hasAttribute('id'))
                    id.setAttribute('id', id.id + add)
            })
            if (shp.id) {
                shdw.id = shp.id + add
                cart.id = shp.id + '_cart'
            }
            wshp.W.origs.consts.split(/;|,/).forEach(c => {
                shdw.removeAttribute(c.split(/=|:/)[0])
            })
            if (aO5.cls.dirV == 'D') shdw.style.height = '0.1px' // на экране НЕ должно занимать месо

            // // коррекция shp
            // const 
            // MyRound = (s) => { return Math.round(parseFloat(s)) },
            //    GPV = nam => { return MyRound(nst.getPropertyValue(nam)) },
            //     nst = window.getComputedStyle(shp) // д.б. до replaceChild()
            // Object.assign(aO5.addSize, {
            //     w: Math.ceil(GPV('padding-left') + GPV('padding-right') + GPV('border-left-width') + GPV('border-right-width')),
            //     h: Math.ceil(GPV('padding-top') + GPV('padding-bottom') + GPV('border-top-width') + GPV('border-bottom-width'))
            // })

            const nst = window.getComputedStyle(shp) // д.б. до replaceChild()
            for (const prop of [   // перенос нужных "внешних" свойств на cart 
                'opacity', 'outline-color', 'outline-offset', 'outline-style', 'outline-width'
            ]) {
                const wi = nst.getPropertyValue(prop)
                if (wi && wi.length > 0) {
                    shp.style[prop] = ''
                    cart.style[prop] = wi
                    if (prop == 'opacity')
                        aO5.cls.cartopacity = wi
                }
            }
            for (const prop of [   // перенос нужных "внешних" свойств на shdw 
                'zoom', 'transform'
            ]) {
                const wi = nst.getPropertyValue(prop)
                if (wi && wi.length > 0) {
                    shp.style[prop] = ''
                    shdw.style[prop] = wi
                }
            }

            parentNode.replaceChild(shdw, shp)  // д.б. перед коррекцией shp но после shdw

            Object.assign(shp.style, {
                position: 'relative',
                'margin-top': 0, 'margin-left': 0, 'margin-right': 0, 'margin-bottom': 0,
            })
            
            Object.assign(aO5.posS, { left: 0, top: 0, width: posC.width, height: posC.height, })
            // aO5.SetShpStyle()

            cart.appendChild(shp)
            parentNode.insertBefore(cart, shdw)

            for (const o of [cart, aO5.posW, aO5.posC, aO5.posS]) Object.seal(o)
            Object.freeze(aO5)

/* !1 */            shp.addEventListener('dblclick', DoShpClick, { capture: false, passive: true })

            for (const iO5 of aO5.aO5s)
                Clone(iO5)
        },
        Tbelong = { attr: '', to: null, le: null, ri: null, bo: null }

   
    class AO5 {
        constructor(shp, cls) {
            this.name = window.olga5.C.MakeObjName(shp)
            this.id = shp.id
            this.shp = shp
            this.prev = shp.parentElement
            Object.assign(this.cls, cls)

            // for (const nam of ['cls', 'old', 'addSize', 'act', 'fix', 'hovered', 'located', 'posW', 'posC', 'posS'])
            for (const nam of ['cls', 'old', 'act', 'fix', 'hovered', 'located', 'posW', 'posC', 'posS'])
                Object.seal(this[nam])
            Object.seal(this)
        }
        name = '' // повтор - чтобы было 1-м в отладчике
        aO5s = [] // перечень включенных в этот aO5
        cls = { kill: false, remo: false, dirV: '', putV: 'T', alive: false, nest: -2, level: 0, zIndex: 0, minIndex: 0, aO5o: [], } //  pitch: 'S', }
        old = { hovered: { to: null, located: { to: null } }, located: { to: null } } //  для отладки: зраненеие предыдущих контейнеров
        // addSize = { w: 0, h: 0 }
        act = { dspl: false, wasKilled: false, wasClick: false, underClick: false, pushedBy: null, }
        fix = { putV: '', iO5: null, iO5up: null }
        hovered = Object.assign({ act: 'hovered', asks: [], }, Tbelong) // массивы д.б.персонально
        located = Object.assign({ act: 'located', asks: [], }, Tbelong)
        posW = { top: 0, left: 0, height: 0, width: 0 }
        posC = Object.assign({}, this.posW)
        posS = { top: 0, left: 0, height: 0, width: 0, }

        cart = null
        shdw = null

        Show = () => Show(this)
        Hide = () => Hide(this)
        DoFixV = (iO5) => DoFixV(this, iO5)
        SetClick = (clk) => SetClick(this, clk)
        SetShpStyle = () => {
            const aO5 = this,
            posC=aO5.posC,
            posS=aO5.posS
            
            Object.assign(aO5.cart.style, {
                top: (posC.top) + 'px',
                left: (posC.left) + 'px',
                width: (posC.width) + 'px',
                height: (posC.height) + 'px',
                // width: (Math.ceil(posC.width)+1) + 'px',
                // height: (Math.ceil(posC.height)+1) + 'px',
                display: '',
            })
            Object.assign(aO5.shp.style, {
                top: (posS.top) + 'px',
                left: (posS.left) + 'px',
                width: (posS.width) + 'px',
                height: (posS.height) + 'px',
                // width: Math.floor(posS.width) + 'px',
                // height: Math.floor(posS.height) + 'px',
            })
// console.log(aO5.cart.style.width, aO5.shp.style.width, parseInt( aO5.cart.style.width)-parseInt(aO5.shp.style.width))
        }

    }

    // --------------------------------------------------------------------- //    
    wshp = C.ModulAddSub(olga5_modul, modulname, (shp, cls, PO5) => {
        shp.aO5shp = new AO5(shp, cls)
        const aO5 = shp.aO5shp
        let pO5 = aO5.prev.pO5
        if (!pO5) {
            // console.log('--++ ' + C.MakeObjName(aO5.prev))
            try {
                aO5.prev.pO5 = new PO5(aO5.prev, aO5)
            } catch (err) {
                console.error('--?? ' + C.MakeObjName(aO5.prev), err.message)
            }
            pO5 = aO5.prev.pO5
        }
        else if (wshp.W.consts.o5debug > 0)
            pO5.PutBords(pO5, "FillBords: взял для '" + aO5.name + "' => ")

        pO5.aO5s.push(aO5)

        const prevs = pO5.prevs,
            parent = prevs.find(parent => parent.aO5shp),
            own = parent ? parent.aO5shp : null
        if (own)
            for (const prev of prevs) {
                const hasown = prev.pO5.owns.own
                prev.pO5.owns.own = own
                if (prev.aO5shp || hasown) break
            }

        const aO5s = (own || wshp).aO5s
        aO5s.push(aO5)

        if (shp.tagName.match(/\b(img|iframe|svg)\b/i) && !shp.complete) {
            if (C.consts.o5debug > 0) C.ConsoleInfo(`ожидается завершение загрузки '${aO5.name}'`)
            shp.addEventListener('load', () => {
                wshp.DoResize(`из '${modulname}'`)
            })
        }
    })
    wshp.Clone = Clone

})();
/* -global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
(function () {              // ---------------------------------------------- o5shp/DoInit ---
    "use strict"
    // let debugids = []  // 'shp_text' // 'shp_1÷4' // 'shp-demo' // 'shp_text'        

    const
        olga5_modul = "o5shp",
        modulname = 'DoInit',
        C = window.olga5.C,
        o5debug = C.consts.o5debug,
        IsFloat001 = (s) => { return Math.abs(parseFloat(s) > 0.01) },
        prevsPO5 = {},
        FillBords = (pO5, strt) => { // РЕКУРСИЯ !
            if (pO5.prevs.length > 0)
                return

            pO5.prevs.push(pO5.current)
            if (pO5.isFinal || pO5.current.aO5shp) {
                if (o5debug > 1) console.log("FillBords:  " + strt + " == конец")
                Object.assign(pO5.cdif, { ct: true, cl: true, cr: true, cb: true })
            }
            else {
                const prev = pO5.current.parentElement // не надо ...aO5shp.shdw т.к. ещё не было клонирования
                if (o5debug > 2) console.log("FillBords:  " + strt + " += " + C.MakeObjName(prev))

                if (!prev.pO5) {
                    prev.pO5 = new PO5(prev)
                    FillBords(prev.pO5, strt)
                }
                for (const parent of prev.pO5.prevs)
                    pO5.prevs.push(parent)

                const cc = pO5.colors,
                    cd = pO5.cdif,
                    c = prev.pO5.colors.c

                if (!cd.ct) cd.ct = cc.t != c && cc.t != '#000000'
                if (!cd.ct) cd.ct = cc.b != c && cc.b != '#000000'
                if (!cd.ct) cd.ct = cc.l != c && cc.l != '#000000'
                if (!cd.ct) cd.ct = cc.r != c && cc.r != '#000000'
            }

            if (o5debug > 0) pO5.PutBords(pO5, "FillBords:  " + strt + " +> ")
        },
        Finish = () => {
            const hash = C.save.hash
            if (hash) { // делать именно когда загружен документ (например - тут)
                const tag = document.getElementById(hash)
                if (tag) tag.scrollIntoView({ alignToTop: true, block: 'start', behavior: "auto" })
                else
                    C.ConsoleError(`Неопределён hash= '${hash}' в адресной строке`)
            }
        },
        DbgDoResize = e => { // для отладки  !!!!!!!!!!!!!!!!!!
            if (e.timeStamp > wshp.etimeStamp + 0.1)
                if (!e.target.classList.contains(wshp.W.class))
                    wshp.DoResize('из DbgDoResize ')
            wshp.etimeStamp = e.timeStamp
        },
        DoScroll = e => {
            const pO5 = (e.target == document ? document.body : e.target).pO5
            if (pO5) {
                if (wshp.W.consts.o5debug > 2)
                    console.log(e)
                const aO5s = (pO5.owns.own ? pO5.owns.own : wshp).aO5s

                // document.removeEventListener('scroll', DoScroll, true)

                wshp.DoScroll(aO5s, e.timeStamp)

                // document.addEventListener('scroll', DoScroll, true)
            }
        }

    class PO5 {
        constructor(current, aO5) {
            this.current = current
            this.id = current.id
            this.name = C.MakeObjName(current)
            this.isBody = current === document.body || current.nodeName == 'BODY'
            this.isFinal = this.isBody ||
                ['overview-content', 'viewitem-panel'].find(cls => current.classList.contains(cls))
            this.isDIV = current.tagName.match(/\bdiv\b/i)  // == "DIV"
            if (o5debug > 2)
                console.log("создаётся pO5 для '" + this.name + "'")
            FillBords(this, 'pO5=' + this.name + (aO5 ? (' для aO5=' + aO5.name) : ''))

            this.nst = window.getComputedStyle(current)
            this.PO5Colors()
            Object.seal(this.prevs)
            Object.seal(this.pos)
            Object.seal(this.located)
            Object.seal(this.colors)
            Object.seal(this.scroll)
            Object.seal(this.act)
            Object.seal(this.cdif)
            Object.freeze(this)
        }
            // nst = {}
        add = { top: 0, left: 0, right: 0, bottom: 0 }
        owns = { own: null }
        aO5s = []
        prevs = []; // всегда содержит самого себя
        located = { to: null, le: null, ri: null, bo: null, timeStamp: 0 } // для тех которые в aO5.hovered
        cdif = { tim: 0, ct: false, cl: false, cr: false, cb: false }
        pos = { tim: 0, top: 0, left: 0, right: 0, bottom: 0, } // пересчитывается при Scroll
        colors = { c: 0, t: 0, l: 0, r: 0, b: 0, }
        scroll = { tim: 0, yesV: false, yesH: false } // пересчитывается при Resize
        
        PO5Colors() {
            const pO5 = this,
                cc = pO5.colors,
                nst = pO5.nst,
                cd = {
                    ct: IsFloat001(nst.borderTopWidth),
                    cl: IsFloat001(nst.borderLeftWidth),
                    cr: IsFloat001(nst.borderRightWidth),
                    cb: IsFloat001(nst.borderBottomWidth),
                },
                CN = (nst, nam) => {
                    const color = nst.getPropertyValue(nam + '-color'),
                        rgb = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i),
                        GRGB = (i) => { return ("0" + parseInt(rgb[i], 10).toString(16)).slice(-2) }
                    return (rgb && rgb.length === 4) ? "#" + GRGB(1) + GRGB(2) + GRGB(3) : ''
                },
                c = CN(pO5.nst, 'background')
            for (const bord of ['top', 'left', 'right', 'bottom'])
                pO5.add[bord] = parseFloat(nst.getPropertyValue('border-' + bord + '-width'))
            Object.assign(cc, {
                // tim: timeStamp,
                c: c,
                t: cd.ct ? CN(nst, 'border-top') : c,
                l: cd.cl ? CN(nst, 'border-left') : c,
                r: cd.cr ? CN(nst, 'border-right') : c,
                b: cd.cb ? CN(nst, 'border-bottom') : c,
            })
            Object.seal(cc)
            Object.assign(pO5.cdif, {
                ct: cd.ct ? cc.t != c : false,
                cl: cd.cl ? cc.l != c : false,
                cr: cd.cr ? cc.r != c : false,
                cb: cd.cb ? cc.b != c : false,
            })
        }
        PutBords (pO5, txt) {
            let s = '',
                j = pO5.prevs.length
            while (j-- > 0) {
                const bord = pO5.prevs[j],
                    name = bord.pO5 ? bord.pO5.name : C.MakeObjName(bord) // для того pO5 еще только создаётся
                s += (s ? ', ' : '') + name
            }
            if (o5debug > 2)
                console.log(txt + s)
            if (!prevsPO5[pO5.name]) prevsPO5[pO5.name] = s
        }
    }

    const
        // name = 'страница',
        // aO5s = [],
        // nests = [],
        // wasResize = false,
        // aO5str = '', // строка рез. вложенности (для демок  и отладки)
        // TestCC3a = pO5 => { // для теста CC3a в alltst.js
        //     pO5.PO5Colors(0)
        //     FillBords(pO5, 'pO5=' + C.MakeObjName(pO5.current))
        // },
        wshp = C.ModulAddSub(olga5_modul, modulname, () => {
            const       // timeInit = Date.now() + Math.random(),
                mtags = C.SelectByClassName(wshp.W.class, olga5_modul),
                errs = [],
                MakeAO5s = () => {
                    const
                        DecodeType = (quals) => {
                            const cls = {
                                level: 0, kill: false, remo: false, pitch: 'S', alive: false,
                                dirV: '', putV: 'T', none: false, cartopacity: 1,
                            }
                            const errs = []
                            for (const qual of quals) {
                                const tt = qual.replaceAll(/-/g, '=').split('='),
                                    c = tt[0].substr(0, 1).toUpperCase()

                                if (c != '' && !isNaN(c)) cls.level = Number(c)
                                else if (c === 'N') cls.none = true
                                else if (c === 'K') cls.kill = true
                                else if (c === 'R') cls.remo = true
                                else if (c === 'C') cls.pitch = 'C' // сжимает предыдущий
                                else if (c === 'P') cls.pitch = 'P' // сталкивает предыдущий
                                else if (c === 'S') cls.pitch = 'S' // сдвигает предыдущий
                                else if (c === 'O') cls.pitch = 'O' // наезжает на предыдущий
                                else if (c === 'A') cls.alive = true
                                else if (c === 'D' || c === 'U') cls.dirV = c
                                else if (c === 'B' || c === 'T') cls.putV = c
                                else errs.push(`'${c}'`)
                            }
                            if (cls.kill) cls.remo = false
                            if (!cls.dirV && !cls.kill && !cls.remo) cls.dirV = 'U'

                            Object.freeze(cls)
                            return { cls: cls, err: errs.length ? (`неопр. коды: ` + errs.join(', ')) : '' }
                        },
                        ClearO5s = (aO5s) => { // рекурсия
                            if (aO5s && aO5s.length > 0) {
                                for (const aO5 of aO5s)
                                    ClearO5s(aO5.aO5s)
                                aO5s.splice(0, aO5s.length)
                            }
                        }

                    wshp.aO5str = ''
                    ClearO5s(wshp.aO5s)

                    // wshp.FillClasses()
                    for (const mtag of mtags) {
                        const dt = DecodeType(mtag.quals),
                            shp = mtag.tag

                        if (dt.err) errs.push({ shp: C.MakeObjName(shp), className: mtag.origcls, err: dt.err })

                        if (!dt.cls.none && !mtag.tag.classList.contains('olga5_shp_none'))
                            wshp.MakeAO5(shp, dt.cls, PO5)
                    }

                    if (errs.length > 0) C.ConsoleError("Ошибки классов подвисабельных объектов", errs.length, errs)
                },
                SetLevelsAll = (aO5s) => { // сортировки и формирование
                    let aO5str = ''
                    const
                        SetLevels = (aO5s, nest) => {
                            if (typeof wshp.nests[nest] === 'undefined') wshp.nests[nest] = []
                            if (o5debug > 2) console.log('  >> SetLevels (' + nest + '): aO5s=' + C.MyJoinO5s(aO5s));
                            for (const aO5 of aO5s) {
                                aO5.cls.nest = nest // только для показа в тестах
                                wshp.nests[nest].push(aO5)
                            }
                            aO5s.nest = nest 
                            const       //slevel = ''.padEnd(nest * 4),
                                pr1 = '[(<\\',
                                pr2 = '])>/'
                            aO5str += (nest > 3 ? '|' : pr1[nest]) + nest + ' '
                            for (const aO5 of aO5s) {
                                aO5str += aO5.name + (aO5.aO5s.length > 0 ? ':' : ' ')
                                if (aO5.aO5s.length > 0) SetLevels(aO5.aO5s, nest + 1)
                            }
                            aO5str += (nest > 3 ? '|' : pr2[nest]) + ' '
                        }

                    SetLevels(aO5s, 0)

                    if (o5debug > 1)
                        console.log(" >> SetLevelsAll " + ('' + Date.now()).substr(-6) + ", вложенности объектов: \n\t  " + aO5str)
                    return aO5str
                }

            MakeAO5s()

            wshp.aO5str = SetLevelsAll(wshp.aO5s)

            if (o5debug > 0) {
                const sels = []
                for (const mtag of mtags)
                    sels.push({ name: C.MakeObjName(mtag.tag), origcls: mtag.origcls, class: mtag.tag.className, quals: mtag.quals.join(', '), })
                if (sels.length > 0) C.ConsoleInfo(`o5shp: найдены селекторы:`, sels.length, sels)

                for (const start of C.page.starts)
                    start.addEventListener('click', DbgDoResize)
            }

            if (wshp.aO5s.length > 0) {

                for (const aO5 of wshp.aO5s)
                    wshp.Clone(aO5)

                wshp.DoResize('из DoInit')
                // SwitchOpacity(wshp.aO5s)

                C.E.AddEventListener('resize', e => {
                    wshp.DoResize(e)
                })
                document.addEventListener('scroll', DoScroll, true)
            }

            Finish()

            errs.splice(0, errs.length)
            mtags.splice(0, mtags.length)
        })

    Object.assign(wshp, {
        name: 'страница',
        aO5s: [],
        nests: [],
        wasResize: false,
        aO5str: '', // строка рез. вложенности (для демок  и отладки)
        etimeStamp: 0,
    })
})();

/* -global window, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
(function () {              // ---------------------------------------------- o5shp/DoResize ---
    "use strict"
    let wshp = {},
        o5debug = 0,
        debugids = ['head_32']  //  shp_5÷8 'shp_text' // 'shp_1÷4' // 'shp-demo' // 'shp_text'

    const
        olga5_modul = "o5shp",
        modulname = 'DoResize',
        C = window.olga5.C,
        errs = [],
        MyRound = (s) => { return Math.round(parseFloat(s)) },
        IsInClass = (classList, clss) => {
            for (const cls of clss)
                if (cls !== '' && !classList.contains(cls)) return false
            return true
        },
        ReadAttrsAll = (aO5s, showerr) => {
            let Error = C.ConsoleError
            const
                atribs = [
                    { atr: 'olga5_frames', cod: 'hovered', def: 's' },
                    { atr: 'olga5_owners', cod: 'located', def: 'b' }],
                AddNew = (asks, ask) => {
                    const a = Object.assign({}, ask);
                    Object.seal(a);
                    asks.push(a);
                },
                ChecksReadAttrs = (aO5, code, attr, errs) => {
                    const typs = 'CINSB',
                        blng = aO5[code],
                        ss = attr ? attr.split(/[,;]/g) : ['']
                    if (debugids.includes(aO5.name))
                        if (debugids);
                    blng.asks.splice(0, blng.asks.length)
                    blng.attr = attr

                    let i = ss.length
                    while (--i >= 0) {
                        const s = ss[i].trim()
                        if (s.length > 0) {
                            const
                                cc = s.split(':'),
                                u = cc[0].trim(),
                                t = u.length > 0 ? u[0].toUpperCase() : '?'
                            if (typs.includes(t)) {
                                const cod = cc.length > 1 ? cc[1].trim() : '',
                                    num = cc.length > 2 ? MyRound(cc[2]) : 1,
                                    fix = cc.length > 2 ? cc[2].toUpperCase() == 'F' : false

                                AddNew(blng.asks, { typ: t, cod: cod, num: num, nY: num, ok: false, fix: fix, bords: [] })
                            }
                            else
                                errs.push({ name: aO5.name, str: s, err: "тип ссылки не начинается одним из '" + typs + "'" })
                        }
                    }
                },
                ReadAttrs = (aO5s, atrib) => {
                    // if (o5debug > 1) console.log('  >> ReadAttrs (' + atrib.cod + ') для объектов [' + C.MyJoinO5s(aO5s) + ']');
                    let prevN = '' // значене этого атрибута у предыдущего тега

                    for (const aO5 of aO5s) { // определение вложенностей shp's друг в друга
                        const shp = aO5.shp,
                            atrX = shp.getAttribute(atrib.atr),
                            atrN = atrX || (shp.attributes.olga5_repeat ? prevN : ''),
                            attr = atrN.length > 0 ? atrN : atrib.def

                        if (atrN) prevN = atrN
                        ChecksReadAttrs(aO5, atrib.cod, attr, errs)
                        // if (atrib.cod=='located')                        
                        // console.log(`aO5.id=${aO5.id}, atrib.cod=${atrib.cod}, attr=${attr}, aO5.located.asks.length=${aO5.located.asks.length}`)
                        if (aO5[atrib.cod].asks.length === 0) {
                            AddNew(aO5[atrib.cod].asks, { typ: atrib.def.toUpperCase(), cod: '', num: 1, nY: 1, ok: false, fix: false, bords: [] })
                            errs.push({ name: aO5.name, str: attr, err: "нету [id, класс, тип, к-во]" })
                            Error = C.ConsoleAlert
                        }

                        if (aO5.aO5s.length > 0)
                            ReadAttrs(aO5.aO5s, atrib)
                    }
                }

            for (const atrib of atribs) {
                ReadAttrs(aO5s, atrib)
            }
            if (errs.length > 0 && showerr)
                Error("Ошибки в атрибутах  для тегов", errs.length, errs)
        },
        CalcSizes = (aO5s) => {
            const GPV = (nam, nst) => { return MyRound(nst.getPropertyValue(nam)) }
            for (const aO5 of aO5s) {
                const pos = aO5.shdw.getBoundingClientRect(),
                   nst = window.getComputedStyle(aO5.shp),
                    // add = aO5.addSize
                    add = {
                        w: Math.ceil(GPV('padding-left', nst) + GPV('padding-right', nst) + GPV('border-left-width', nst) + GPV('border-right-width', nst)),
                        h: Math.ceil(GPV('padding-top', nst) + GPV('padding-bottom', nst) + GPV('border-top-width', nst) + GPV('border-bottom-width', nst))
                    }

                Object.assign(aO5.posS, { width: Math.floor(pos.width - add.w), height: Math.floor(pos.height - add.h) })

                CalcSizes(aO5.aO5s)

                if (o5debug > 2)
                    console.log(`${aO5.name} : pos.width=${pos.width}, add.w=${add.w}, posS.width=${aO5.posS.width}`)
            }
        },
        SortAll = (aO5s) => { // сортировка и индексация
            const nest = aO5s.nest

            if (o5debug > 2)
                console.log('  >> яSortAll (' + nest + '): aO5s=' + C.MyJoinO5s(aO5s))
            
            for (const aO5 of aO5s) {
                const b = aO5.shdw.getBoundingClientRect()
                Object.assign(aO5.posW, { top: b.top, left: b.left })
            }
            aO5s.sort((a1, a2) => { // для вызовов (для работы)
                const i1 = Math.round(parseFloat(a1.posW.top)),
                    i2 = Math.round(parseFloat(a2.posW.top))
                return (i1 != i2) ? (i1 - i2) : (a1.cls.level - a2.cls.level)
            })

            let minIndex = 10000 + (nest + 1) * 100,
                z = minIndex
            for (const aO5 of aO5s) {
                Object.assign(aO5.cls, { minIndex: minIndex, aO5o: aO5s })
                if (!aO5.cls.remo || aO5.cls.dirV) {
                    aO5.cart.style.zIndex = ++z
                    aO5.cls.zIndex = z
                }
            }

            for (const aO5 of aO5s)
                if (aO5.aO5s.length > 0)
                    SortAll(aO5.aO5s)
        },

        FillBlngsAll = function (aO5s, showerr, timeStamp) {
            const errs = [],
                AskScrolls = (pO5) => {
                    const minScrollW = 3,
                        current = pO5.current,
                        nst = pO5.nst,
                        dw = minScrollW + MyRound(nst.borderLeftWidth) + MyRound(nst.borderRightWidth) + MyRound(nst.paddingLeft) + MyRound(nst.paddingRight),
                        dh = MyRound(nst.borderTopWidth) + MyRound(nst.borderBottomWidth) + MyRound(nst.paddingTop) + MyRound(nst.paddingBottom)
                    Object.assign(pO5.scroll, {
                        tim: timeStamp,
                        yesV: current.offsetWidth > (current.clientWidth + dw),
                        yesH: current.offsetHeight > (current.clientHeight + dh),
                    })   // let err = '',
                    //     rez = ''
                },
                FillBlngs = function (aO5s) {
                    const
                        FillAsk = function (aO5, ask, act) {
                            const t = ask.typ,
                                c = (ask.cod || '').trim(),
                                cu = c.toUpperCase(),
                                clss = c.split(/[.,]/),
                                parents = aO5.prev.pO5.prevs,
                                k2 = parents.length

                            if (debugids.includes(aO5.name))
                                if (debugids);
                            for (let k = 0; k < k2; k++) {
                                const parent = parents[k],
                                    pO5 = parent.pO5,
                                    final = pO5.isFinal || (!ask.fix && pO5.current.aO5shp)

                                if (t == 'S' && pO5.scroll.tim != timeStamp)
                                    AskScrolls(pO5)

                                ask.ok =
                                    (t == 'I' && pO5.id == c && ask.nY-- <= 1) ||
                                    (t == 'N' && (cu === '' ? final : (parent.nodeName == cu && ask.nY-- <= 1))) ||
                                    (t == 'C' && IsInClass(parent.classList, clss) && ask.nY-- <= 1) ||
                                    (t == 'S' && (final || pO5.scroll.yesV)) ||
                                    (t == 'B' && (final || (aO5.cls.dirV != 'D' && pO5.cdif.ct) || (aO5.cls.dirV != 'U' && pO5.cdif.cb)))
                                // (t == 'B' && (final || (aO5.cls.dirV == 'U' && pO5.cdif.ct) || (aO5.cls.dirV == 'D' && pO5.cdif.cb)))

                                if (ask.ok)
                                    ask.bords.push(...parents.slice(k, ask.fix ? k + 1 : k2))

                                if (ask.ok || final) break
                            }

                            // let err = '',
                            //     rez = ''
                            if (ask.bords.length === 0) {
                                const subst = parents[k2 - 1],
                                    nam = window.olga5.C.MakeObjName(subst),
                                    i = ask.bords.indexOf(nam)
                                errs.push({ aO5: aO5.name, 'для типа': act, 'не найден': (t + ':' + c), 'подставлен': (i < 0 ? '+ ' : '= ') + nam })
                                if (i < 0)
                                    ask.bords.push(subst)
                            }
                        }
                    if (o5debug > 2) console.log('  >> FillBlngs: aO5s=' + C.MyJoinO5s(aO5s))
                    for (const aO5 of aO5s) {
                        for (const blng of [aO5.hovered, aO5.located]) {
                            for (const ask of blng.asks) {
                                ask.bords.splice(0, ask.bords.length)
                                Object.assign(ask, { nY: ask.num, ok: false })
                            }
                            for (const ask of blng.asks)
                                FillAsk(aO5, ask, blng.act)
                        }

                        if (aO5.aO5s.length > 0)
                            FillBlngs(aO5.aO5s)
                    }
                }

            FillBlngs(aO5s)
            if (errs.length > 0 && showerr)
                C.ConsoleError("При старте (в  'DoResize'): не опр. ссылки на контейнеры ", errs.length, errs)
        }

    let showerr = true

    wshp = C.ModulAddSub(olga5_modul, modulname, txt => {
        /* 
        фактически - д.б. 1 раз. - при первом скроллинге,
        но для отладки - может вызываться повторно
        */
        const timeStamp = Date.now() + Math.random()
        let aO5s = wshp.aO5s

        o5debug = C.consts.o5debug

        if (o5debug > 1) {
            console.groupCollapsed(`  старт Resize(${txt}) для '` + (() => {
                let s = ''
                aO5s.forEach(aO5 => { s += (s ? ', ' : '') + aO5.name })
                return s
            })())
            console.trace("трассировка вызовов ")
            console.groupEnd()
        }

        ReadAttrsAll(aO5s, showerr)
        SortAll(aO5s)
        CalcSizes(aO5s)
        FillBlngsAll(aO5s, showerr, timeStamp)
        
        wshp.DoScroll(wshp.aO5s)
        showerr = false
    }
    )

})();
/*jshint asi:true  */
/* -global window, console */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
(function () {              // ---------------------------------------------- o5shp/DoScroll ---
    "use strict"
    let wshp = {},
        timeStamp = 0,
        debugids = ['shp1'] // , 'shp_text' shp1 shp_1÷4 shp_5÷8 'shp_text' // 'shp_1÷4' // 'shp-demo' // 'shp_text'

    const
        olga5_modul = "o5shp",
        modulname = 'DoScroll',
        lognam = `${olga5_modul}/${modulname} `,
        C = window.olga5.C,
        datestart = Date.now(),
        CalcParentLocate = pO5 => {
            if (pO5.isBody) {
                const doc = document.documentElement
                Object.assign(pO5.pos,
                    { tim: timeStamp, top: 0, bottom: doc.clientHeight, left: 0, right: doc.clientWidth })
            }
            else {
                const current = pO5.current,
                    isO5 = current.aO5shp,
                    p = isO5 ? current.aO5shp.posC : current.getBoundingClientRect(),
                    // right1 = isO5 ? p.left + p.width : p.right,
                    // bottom1 = isO5 ? p.top + p.height : p.bottom,
                    right = isO5 ? p.left + p.width : p.left + current.clientWidth + pO5.add.left,
                    bottom = isO5 ? p.top + p.height : p.top + current.clientHeight + pO5.add.top
                Object.assign(pO5.pos,
                    { tim: timeStamp, top: p.top + pO5.add.top, bottom: bottom, left: p.left + pO5.add.left, right: right })
            }
        },
        CalcParentsLocates = (aO5) => { // пересчитываются размеры всех предков-контейнеров        
            for (const blng of [aO5.hovered, aO5.located])
                for (const ask of blng.asks)
                    for (const parent of ask.bords)
                        if (parent.pO5.pos.tim == timeStamp) break
                        else
                            CalcParentLocate(parent.pO5)
        },
        PrepareBords = (aO5) => {
            const bO5 = document.body.pO5,
                a = { to: bO5, le: bO5, ri: bO5, bo: bO5 },
                Located = (bords, a) => {
                    const bO5 = bords.length > 0 ? bords[bords.length - 1].pO5 : null
                    for (const bord of bords) {
                        const pO5 = bord.pO5,
                            pos = pO5.pos
                        if (pos.top != pos.bottom) {
                            if (a.to === null || a.to == bO5 || a.to.pos.top < pos.top) a.to = pO5
                            if (a.bo === null || a.bo == bO5 || a.bo.pos.bottom > pos.bottom) a.bo = pO5
                        }
                        if (pos.left != pos.right) {
                            if (a.le === null || a.le == bO5 || a.le.pos.left < pos.left) a.le = pO5
                            if (a.ri === null || a.ri == bO5 || a.ri.pos.right > pos.right) a.ri = pO5
                        }
                    }
                }
            for (const ask of aO5.hovered.asks)
                Located([ask.bords[0]], a)
            Object.assign(aO5.hovered, a)

            Object.assign(a, { to: bO5, le: bO5, ri: bO5, bo: bO5 })

            for (const ask of aO5.located.asks)
                Located(ask.bords, a)
            Object.assign(aO5.located, a)

            for (const hoverMarks of ['to', 'le', 'ri', 'bo']) {
                const pO5 = aO5.hovered[hoverMarks]
                if (!pO5 || !pO5.located)
                    alert(`located '${hoverMarks}' (in  DoScroll.PrepareBords)`)
                if (pO5.located.timeStamp != timeStamp) { // чтобы не повторяться для одинаковых
                    Located(pO5.prevs, pO5.located)
                    pO5.located.timeStamp = timeStamp
                }
            }
        },
        CutBounds = (aO5) => {
            const putV = aO5.cls.putV,
                act = aO5.act,
                posC = aO5.posC,
                top = aO5.located.to.pos.top,
                bT = (putV == 'T') ? Math.max(aO5.hovered.to.located.to.pos.top, top) : top,
                bot = aO5.located.bo.pos.bottom,
                bB = (putV == 'B') ? Math.min(aO5.hovered.bo.located.bo.pos.bottom, bot) : bot,
                bL = aO5.located.le.pos.left, // эти два - без выпендрёжа
                bR = aO5.located.ri.pos.right

            if (debugids.includes(aO5.id))
                if (debugids); // контрольный останов
            if (bT > bB || bL >= bR) {
                if (act.wasClick && act.dspl)
                    aO5.SetClick(false)
                aO5.Hide()
            } else {
                // if (aO5.fix.putV) 
                {
                    if (posC.top < bT) {
                        const d = bT - posC.top
                        if (posC.height <= d) aO5.Hide()
                        else {
                            posC.top = bT
                            posC.height -= d
                            aO5.posS.top -= d
                        }
                    }
                    if (act.dspl && posC.top + posC.height > bB) {
                        if (posC.top >= bB) aO5.Hide()
                        else posC.height -= posC.top + posC.height - bB
                    }
                }
                if (act.dspl && bL > posC.left) {
                    const d = bL - posC.left
                    if (d >= posC.width) aO5.Hide()
                    else {
                        posC.left = bL
                        posC.width -= d
                        aO5.posS.left -= d
                    }
                }
                if (posC.left + posC.width > bR) {
                    if (posC.left >= bR) aO5.Hide()
                    else
                        posC.width -= (posC.left + posC.width - bR)
                }
            }
        },
        DebugShowBounds = (aO5s) => {
            const fmt = [12, 26, 18, 12, 1],
                nms = ['shp', 'asks', 'bords', ' to..bo', '',],
                MyRound4 = (s) => { return ('' + Math.round(parseFloat(s))).padStart(4) },
                Store = (blng, name) => {
                    const aa = [],
                        a2 = blng.asks.length,
                        Addaa = (a) => {
                            if (!aa[a]) aa[a] = { bb: [] }
                            if (!aa[a].bb[0]) aa[a].bb[0] = []
                        }

                    Addaa(0)
                    aa[0].bb[0][0] = name
                    for (let a = 0; a < a2; a++) {
                        const ask = blng.asks[a],
                            b2 = ask.bords.length // Math.max(ask.bords.length, 2)

                        Addaa(a)
                        aa[a].b2 = b2
                        aa[a].bb[0][1] = ask.typ + ':' + ask.cod + ':' + ask.num + (ask.fix ? 'F' : '') // rez[a][1]
                        for (let b = 0; b < b2; b++) {
                            const bord = ask.bords[b]
                            if (!aa[a].bb[b]) aa[a].bb[b] = []
                            if (bord) {
                                aa[a].bb[b][2] = bord.pO5.name
                                aa[a].bb[b][3] = '=' + MyRound4(bord.pO5.pos.top) + '..' + MyRound4(bord.pO5.pos.bottom)
                            }
                        }
                    }
                    aa[0].bb[0][4] = '  to= ' + blng.to.name.padEnd(10) + ' ' + MyRound4(blng.to.pos.top) +
                        ',  bo= ' + blng.bo.name.padEnd(10) + ' ' + MyRound4(blng.bo.pos.bottom)

                    for (let a = 0; a < a2; a++) {
                        const b2 = aa[a].b2
                        for (let b = 0; b < b2; b++) {
                            let s = ''
                            for (let j = 0; j < 5; j++)
                                s += (aa[a].bb[b][j] || '').padEnd(fmt[j])

                            if (s.trim())
                                console.log(lognam + s)
                        }
                    }
                },
                ShowBounds = (aO5s, checkonly) => {
                    let names = ''
                    for (const aO5 of aO5s)
                        if (aO5.act.dspl)
                            for (const blng of [aO5.hovered, aO5.located]) {
                                const ish = blng === aO5.hovered,
                                    old = ish ? aO5.old.hovered : aO5.old.located,
                                    name = aO5.name + (ish ? '/H' : '/L')

                                if (old.to != blng.to || old.bo != blng.bo) { // показывать только для изменённых
                                    if (checkonly)
                                        names += (names ? ', ' : '') + name
                                    else {
                                        old.to = blng.to
                                        old.bo = blng.bo
                                        Store(blng, name)
                                    }
                                }
                            }
                    return names
                }

            const names = ShowBounds(aO5s, 'checkonly')

            if (names) {
                let s = '   '
                for (let j = 0; j < 5; j++)
                    s += (' ' + nms[j]).padEnd(fmt[j])
                s += ' --> ' + names + '  (t= ' + (Date.now() - datestart) + ')'
                const clr = "background: beige; color: black;border: solid 1px bisque;"
                console.groupCollapsed('%c%s', clr, s)
                ShowBounds(aO5s)
                console.groupEnd()
            }
        },
        FixSet = (aO5) => {
            const posW = aO5.posW,
                act = aO5.act,
                cls = aO5.cls
            if (!(act.wasClick || act.underClick || act.pushedBy || act.wasKilled) &&
                (
                    (cls.dirV == 'U' && posW.top < aO5.hovered.to.pos.top && aO5.located.to.pos.top <= aO5.hovered.to.pos.top) ||
                    (cls.dirV == 'D' && posW.top + posW.height < aO5.hovered.bo.pos.bottom)
                )
            ) aO5.DoFixV()
        },
        CheckIsUp = function (k, aO5s) {
            const aO5 = aO5s[k],
                cls = aO5.cls,
                posC = aO5.posC,
                minIndex = aO5s[0].cls.zIndex - 1,
                HideByO5 = (iO5) => {
                    iO5.Hide()  // iO5.act.dspl = false
                    iO5.act.pushedBy = aO5
                    iO5.cart.style.zIndex = minIndex
                }
            let i = k
            while (--i >= 0) {
                const iO5 = aO5s[i],
                    iposC = iO5.posC,
                    iposS = iO5.posS
                if (iO5.fix.putV === '' || cls.putV != iO5.cls.putV || posC.left + posC.width < iposC.left || posC.left > iposC.left + iposC.width || !iO5.act.dspl) continue
                if (cls.putV == 'T') {
                    const d = iO5.posC.top + iO5.posC.height - posC.top
                    if (cls.dirV == 'U' || cls.remo) { //только при движении вверх
                        if (d > 0) {
                            if (cls.level <= iO5.cls.level) {
                                if (cls.pitch == 'P' || iposC.height <= d) HideByO5(iO5)
                                else
                                    if (cls.pitch == 'S') {
                                        iposC.height -= d
                                        iposS.top = -d
                                    }
                                    else
                                        if (cls.pitch == 'C') {
                                            iposC.height -= d
                                            // iposS.height = -d
                                        }
                            } else
                                if (cls.dirV == 'U')
                                    aO5.DoFixV(iO5)
                        }
                    } else
                        if (cls.dirV == 'D') // никаких просто else - всегда проверять!
                            if (posC.top + posC.height > aO5.located.bo.pos.bottom) {
                                if (cls.level <= iO5.cls.level) iO5.Hide()  // iO5.act.dspl = false
                                else aO5.DoFixV(iO5)
                            }
                } else {//                    if (cls.putV == 'B') { // можно и не проверять,                    
                    const posW = aO5.posW
                    if (cls.dirV == 'U' && posW.top < aO5.hovered.to.pos.top) {
                        if (cls.level <= iO5.cls.level) HideByO5(iO5)
                        else aO5.DoFixV(iO5)
                    } else {
                        const b = aO5.hovered.bo.pos.bottom
                        if (cls.dirV == 'D' && posW.top < b) {
                            if (cls.pitch == 'P' || posW.top + posW.height <= 1 + b) HideByO5(iO5)
                            else {
                                if (cls.pitch == 'S' || cls.pitch == 'C') {
                                    iposC.height = iO5.posW.height - (b - posW.top)
                                    if (iposC.height <= 1) iO5.Hide()  // iO5.act.dspl = false
                                } else
                                    if (posW.top + posW.height <= b) aO5.DoFixV(iO5)
                            }
                        }
                    }
                }
            }
        },
        Scroll = (aO5s) => {
            if (wshp.W.consts.o5debug > 2)
                console.log(lognam + "Scroll для '" + (() => {
                    let s = ''
                    aO5s.forEach(aO5 => { s += (s ? ', ' : '') + aO5.name })
                    return s
                })() + "'")
            let k2 = -1,
                onscr = true
            for (const [k, aO5] of aO5s.entries()) {
                if (onscr) {
                    CalcParentsLocates(aO5)
                    PrepareBords(aO5)

                    const b = aO5.shdw.getBoundingClientRect()
                    Object.assign(aO5.posW, { top: b.top, left: b.left, height: Math.ceil(b.height), width: Math.ceil(b.width) })
                    Object.assign(aO5.posC, aO5.posW)
                    Object.assign(aO5.posS, { top: 0, left: 0, })
                    onscr = aO5.posW.top < aO5.located.bo.pos.bottom //aO5.act.first.pO5.pos.bottom) {
                }
                if (onscr) {
                    k2 = k
                    aO5.Show()
                } else {        //тут не давать 'break' - пусть попрячет остальные !
                    aO5.Hide()
                    aO5.act.wasKilled = false
                }
            }

            let killevel = -1
            for (let k = k2; k >= 0; k--) {
                const aO5 = aO5s[k],
                    act = aO5.act,
                    cls = aO5.cls,
                    posW = aO5.posW,
                    hovered = aO5.hovered

                if (act.pushedBy && (cls.alive || posW.top > hovered.to.pos.top) && act.pushedBy.posW.top > hovered.to.pos.top) {
                    act.pushedBy = null
                    aO5.cart.style.zIndex = aO5.cls.zIndex
                }
                if (killevel >= 0 && killevel <= aO5.cls.level)
                    act.wasKilled = true
                else if (cls.alive ||
                    (cls.dirV == 'U' && posW.top > hovered.to.pos.top) ||
                    (cls.dirV == 'D' && posW.top > hovered.bo.pos.bottom)
                )
                    act.wasKilled = false

                if (cls.kill)
                    killevel = killevel < 0 ? cls.level : Math.min(killevel, cls.level)
            }

            for (let k = 0; k <= k2; k++) { // '<=' - чтобы захватить всплытие 'киллера'
                const aO5 = aO5s[k],
                    cls = aO5.cls
                Object.assign(aO5.fix, { putV: '', iO5: null })
                // if (cls.dirV != '') {
                if (!aO5.act.wasKilled) {
                    if (cls.dirV)  // это может отсутствовать у kill cls.remo || 
                        FixSet(aO5)
                    if (k > 0 && (cls.dirV || cls.remo)) {
                        const act = aO5.act
                        if (act.dspl && !act.wasClick && !act.underClick && !act.pushedBy && !act.wasKilled)
                            CheckIsUp(k, aO5s)
                    }
                }
                // }
                CutBounds(aO5)
            }

            for (let k = 0; k <= k2; k++) { // эту часть проверок делать "после" чтобы определились координаты iO5
                const aO5 = aO5s[k],
                    posW = aO5.posW

                if (aO5.act.wasClick && posW.top > aO5.hovered.to.pos.top) {
                    const dir = aO5.cls.dirV,
                        iO5 = aO5.fix.iO5 || aO5.fix.iO5up

                    if (dir == 'D' ? (posW.top > aO5.hovered.bo.pos.bottom) :
                        (iO5 ? posW.top > iO5.posC.top + iO5.posC.height : (dir == 'U')))
                        aO5.SetClick(false)
                }
            }

            for (const aO5 of aO5s)  // д.б. отдельно от CutBounds, т.к. м.б. пересчитаны размеры                
                if (aO5.act.dspl) { //  вообще-то тут два варианта: либо после сталкивания пропадает совсем, либо попадает на своё место, но уже под верхний                  
                    aO5.SetShpStyle()

                    if (aO5.fix.putV) {
                        // aO5.cart.classList.add(wshp.olga5ifix)
                        aO5.Show()
                    }
                    else{ 
                        aO5.Hide()
                        // aO5.cart.classList.remove(wshp.olga5ifix)
                    }
                }

            if (wshp.W.consts.o5debug > 2)
                DebugShowBounds(aO5s)

            for (const aO5 of aO5s)   //  не скроллировать внутренности!
                if (aO5.aO5s.length > 0)
                    Scroll(aO5.aO5s)
        }

    wshp = C.ModulAddSub(olga5_modul, modulname,
        (aO5s, etimeStamp) => {
            timeStamp = etimeStamp ? etimeStamp : (Date.now() + Math.random())

            if (aO5s.length > 0) {
                const debug = timeStamp && wshp.W.consts.o5debug > 2
                if (debug)
                    console.groupCollapsed(`  старт Scroll для '` + (() => {
                        let s = ''
                        aO5s.forEach(aO5 => { s += (s ? ', ' : '') + `${aO5.name}(top=${parseInt(aO5.posW.top)}) ` })
                        return s
                    })() + "'" + ' (t=' + (Date.now() - datestart) + ')')

                Scroll(aO5s)

                if (debug) {
                    console.trace("трассировка вызовов ")
                    console.groupEnd()
                }
            }
            // window.dispatchEvent(new window.Event('o5shp_scroll'))
            C.E.DispatchEvent('o5shp_scroll', 'DoScroll', true)
        }
    )

})();
﻿/* -global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
(function () {              // ---------------------------------------------- o5shp ---
	"use strict";

	const
		C = window.olga5.C,
		W = {
			modul: 'o5shp',
			Init: ShpInit,
			class: 'olga5_shp',
			consts: `		
				o5shp_dummy=0.123 //  просто так, для проверок в all0_.html;
                olga5_frames='s';
                olga5_owners='b';
			`,
			incls: {
				names: ['DoScroll', 'DoResize', 'MakeAO5', 'DoInit'],
				actscript: document.currentScript,
			},
		},
		olga5cart = 'olga5-cart',
		// olga5ifix = 'olga5-ifix',
		o5css = `
.${olga5cart} {
    position : fixed;
    overflow : hidden;
    background-color : transparent;
    direction : ltr; // эти 4 д.б. тут чтобы "перебить" из shp
	opacity: 0;  // это только вначале
	cursor: pointer;
}`,
		LastDoResize = () => {
			// if (window.olga5.o5shp && window.olga5.o5shp.DoResize)
			window.olga5.o5shp.DoResize('по olga5_ready')
		}

	function ShpInit() {

		C.E.AddEventListener('olga5_ready', () => {
			window.setTimeout(LastDoResize, 1)
		})

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('olga5_shp_none') 
		for (const excl of excls) {
			const exs = excl.querySelectorAll('[class *=olga5_shp]')
			for (const ex of exs)
				ex.classList.add('olga5_shp_none')
		}

		window.olga5[W.modul].DoInit()

		C.E.DispatchEvent('olga5_sinit', W.modul)

		window.olga5[W.modul].activated = false 	// признак, что было одно из activateEvents 
		const activateEvents = ['click', 'keyup', 'resize'],
			wd = window, // document
			SetActivated = () => {
				window.olga5[W.modul].activated = true
				activateEvents.forEach(activateEvent => wd.removeEventListener(activateEvent, SetActivated))
			}
		activateEvents.forEach(activateEvent => wd.addEventListener(activateEvent, SetActivated))
	}

	// C.ModulAdd(W, { olga5cart: olga5cart, olga5ifix: olga5ifix, })	
	C.ModulAdd(W, { olga5cart: olga5cart, })
})();
