const APP_VERSION = '0.1.1';
const STORAGE_KEY = 'nestegg-data-v1';
const THEME_KEY = 'nestegg-theme';
const START_MONTH = '2026-07';
const START_DATE = '2026-07-01';
const MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const EXPENSE_TYPES = {
  fixed_recurring: 'Fissa ricorrente',
  variable_recurring: 'Ricorrente variabile',
  average_estimate: 'Media stimata',
  one_off: 'Una tantum',
  due_date: 'Con scadenza',
  installment: 'Rateizzata',
  project_extra: 'Straordinaria / Progetto'
};
const FREQUENCIES = {
  none: 'Nessuna', daily: 'Giornaliera', weekly: 'Settimanale', monthly: 'Mensile',
  bimonthly: 'Bimestrale', quarterly: 'Trimestrale', semiannual: 'Semestrale', yearly: 'Annuale'
};
const DEFAULT_CATEGORIES = [
  ['casa','Casa'],['mutuo','Mutuo / Affitto'],['condominio','Condominio'],['utenze','Utenze'],
  ['alimentari','Alimentari'],['auto','Auto'],['bambini','Bambini / Scuola'],['salute','Salute'],
  ['tasse','Tasse e imposte'],['assicurazioni','Assicurazioni'],['prestiti','Prestiti / Finanziamenti'],
  ['carte','Carte di credito'],['abbonamenti','Abbonamenti'],['tempo','Tempo libero'],['viaggi','Viaggi'],
  ['regali','Regali'],['contanti','Contanti'],['lavori','Ristrutturazione / Lavori'],['extra','Extra']
].map(function(item){ return { id: item[0], name: item[1] }; });

let state = {
  view: 'home',
  month: currentMonth() < START_MONTH ? START_MONTH : currentMonth(),
  theme: localStorage.getItem(THEME_KEY) || 'light',
  message: '',
  menuOpen: false
};
let data = loadData();

document.addEventListener('DOMContentLoaded', function(){
  applyTheme();
  exposeActions();
  render();
});

function exposeActions(){
  window.go = go;
  window.changeMonth = changeMonth;
  window.toggleMainMenu = toggleMainMenu;
  window.toggleTheme = toggleTheme;
  window.saveExpense = saveExpense;
  window.markDuePaid = markDuePaid;
  window.markDuePending = markDuePending;
  window.deleteExpense = deleteExpense;
  window.seedDemo = seedDemo;
  window.clearData = clearData;
}
function defaultData(){ return { categories: DEFAULT_CATEGORIES, expenses: [], dueDates: [] }; }
function loadData(){
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.assign(defaultData(), stored, { categories: stored.categories || DEFAULT_CATEGORIES });
  } catch (error) { return defaultData(); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36); }
function pad(n){ return String(n).padStart(2, '0'); }
function toISO(date){ return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function todayISO(){ return toISO(new Date()); }
function currentMonth(){ return todayISO().slice(0, 7); }
function addDays(iso, days){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + days); return toISO(d); }
function addMonths(month, delta){ const d = new Date(month + '-01T00:00:00'); d.setMonth(d.getMonth() + delta); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function esc(value){ return String(value == null ? '' : value).replace(/[&<>"]/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]; }); }
function eur(value){ return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(Number(value || 0)); }
function shortDate(iso){ return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day:'2-digit', month:'short' }) : ''; }
function longDate(iso){ return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }) : ''; }
function monthLabel(month){ const parts = month.split('-'); return MONTHS[Number(parts[1]) - 1] + ' ' + parts[0]; }
function categoryName(id){ const found = data.categories.find(function(c){ return c.id === id; }); return found ? found.name : 'Extra'; }
function isInMonth(date, month){ return String(date || '').startsWith(month || state.month); }
function isOverdue(due){ return due.status !== 'paid' && due.dueDate < todayISO(); }
function isToday(due){ return due.status !== 'paid' && due.dueDate === todayISO(); }
function isUpcoming(due){ return due.status !== 'paid' && due.dueDate > todayISO() && due.dueDate <= addDays(todayISO(), 7); }
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme); localStorage.setItem(THEME_KEY, state.theme); }
function go(view){ state.view = view; state.menuOpen = false; render(); }
function changeMonth(delta){ state.month = addMonths(state.month, delta); render(); }
function toggleMainMenu(){ state.menuOpen = !state.menuOpen; render(); }
function toggleTheme(){ state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); render(); }
function showMessage(message){ state.message = message; render(); window.setTimeout(function(){ if(state.message === message){ state.message = ''; render(); } }, 3200); }

const NAV_ITEMS = [
  ['home','⌂','Dashboard'], ['new','＋','Nuova spesa'], ['expenses','▤','Spese'],
  ['dues','◷','Scadenze'], ['budget','▥','Budget'], ['settings','•••','Impostazioni']
];
function logoIcon(){ return 'assets/nest-egg-logo.svg'; }
function logoWordmark(){ return 'assets/nest-egg-wordmark.svg'; }
function navButtons(tag){
  return NAV_ITEMS.map(function(item){
    const active = state.view === item[0] ? 'active' : '';
    return '<button class="' + active + '" onclick="go(\'' + item[0] + '\')"><span>' + item[1] + '</span><' + tag + '>' + item[2] + '</' + tag + '></button>';
  }).join('');
}
function menuDropdown(){
  if(!state.menuOpen) return '';
  return '<div class="topMenu" role="menu"><button class="topMenuClose" onclick="toggleMainMenu()" aria-label="Chiudi menu">✕</button><img class="topMenuLogo" src="' + logoWordmark() + '" alt="Nest Egg">' + navButtons('b') + '</div>';
}
function appShell(content){
  return '<div class="shell"><aside class="sidebar"><div class="sidebarBrand"><img class="sidebarLogo" src="' + logoWordmark() + '" alt="Nest Egg" onclick="go(\'home\')" role="button" title="Torna alla Home"></div><nav class="sidebarNav">' + navButtons('b') + '</nav><div class="sidebarFoot"><div class="version">' + APP_VERSION + ' · Budget Edition · © ' + new Date().getFullYear() + ' johnbruk</div></div></aside><div class="shellMain"><div class="topbar"><div class="headerMenuWrap"><button class="headerIcon" onclick="toggleMainMenu()" title="Apri menu" aria-label="Apri menu">☰</button>' + menuDropdown() + '</div><img class="topbarLogo" src="' + logoIcon() + '" alt="Nest Egg" onclick="go(\'home\')" role="button" title="Torna alla Home"><button class="headerIcon" onclick="go(\'settings\')" title="Impostazioni">⚙</button></div><div class="app">' + (state.message ? '<div class="toast">' + esc(state.message) + '</div>' : '') + content + '<div class="version mobileVersion">' + APP_VERSION + ' · Budget Edition · © ' + new Date().getFullYear() + ' johnbruk</div></div></div></div>';
}
function monthSelector(){ return '<div class="month"><button onclick="changeMonth(-1)">‹</button><strong>' + monthLabel(state.month) + '</strong><button onclick="changeMonth(1)">›</button></div>'; }
function render(){
  const app = document.getElementById('app');
  if(!app) return;
  const views = { home: homeView, new: newExpenseView, expenses: expensesView, dues: duesView, budget: budgetView, settings: settingsView };
  app.innerHTML = appShell((views[state.view] || homeView)());
}

function homeView(){
  const totals = kpis();
  return '<div class="homeTop"><h1>Dashboard</h1>' + monthSelector() + '<button class="primary cta" onclick="go(\'new\')">＋ Nuova spesa</button><div class="card heroCard"><div class="kpiGrid three"><div><span>Uscite mese</span><strong>' + eur(totals.month) + '</strong><small>' + monthLabel(state.month) + '</small></div><div><span>Scadenze aperte</span><strong>' + totals.open + '</strong><small>Da pagare</small></div><div><span>Prossimi 7 giorni</span><strong>' + eur(totals.next7) + '</strong><small>Impegni vicini</small></div></div><div class="chartWrap"><div class="chartTitle"><span>Andamento uscite mensili</span><span>' + state.month.slice(0,4) + '</span></div>' + annualChartSvg() + '</div></div><div class="grid"><div class="wide">' + dueCard() + '</div><div>' + categoryCard() + '</div><div>' + summaryCard() + '</div></div></div>';
}
function kpis(){
  const open = data.dueDates.filter(function(d){ return d.status !== 'paid'; });
  const next = open.filter(function(d){ return isToday(d) || isUpcoming(d); });
  return { month: monthTotal(state.month), open: open.length, next7: next.reduce(function(s,d){ return s + Number(d.amount || 0); }, 0), overdue: open.filter(isOverdue).length };
}
function annualChartSvg(){
  const year = Number(state.month.slice(0,4));
  const values = Array.from({length:12}, function(_, i){ return monthTotal(year + '-' + pad(i + 1)); });
  const max = Math.max.apply(null, values.concat([1]));
  const points = values.map(function(v, i){ return (i / 11 * 100) + ',' + (52 - (v / max * 46)); }).join(' ');
  return '<div class="annualChartBox"><svg class="lineChart" viewBox="0 0 100 58" preserveAspectRatio="none"><line x1="0" y1="52" x2="100" y2="52"></line><line x1="0" y1="30" x2="100" y2="30"></line><polyline points="' + points + '"></polyline></svg><div class="chartMonths">' + MONTHS.map(function(m){ return '<span>' + m.slice(0,3) + '</span>'; }).join('') + '</div></div>';
}
function dueCard(){
  const rows = data.dueDates.filter(function(d){ return d.status !== 'paid' && (isOverdue(d) || isToday(d) || isUpcoming(d)); }).sort(function(a,b){ return a.dueDate.localeCompare(b.dueDate); });
  return '<div class="card cardLink" onclick="go(\'dues\')" role="button"><b>Scadenze di oggi e prossimi giorni <span class="cardLinkArrow">›</span></b>' + (rows.length ? '<div class="list">' + rows.slice(0,5).map(dueRow).join('') + '</div>' : '<div class="empty">Nessuna scadenza urgente.</div>') + '</div>';
}
function categoryCard(){
  const rows = categoryTotals(state.month).slice(0,4);
  if(!rows.length) return '<div class="card"><b>Spese per categoria</b><div class="empty">Nessuna spesa nel mese.</div></div>';
  return '<div class="card"><b>Spese per categoria</b><div class="statRow">' + rows.map(function(r, i){ const tint = ['tint-blue','tint-orange','tint-sage','tint-pink'][i % 4]; return '<div class="stat ' + tint + '"><div class="statHead"><span class="statDot"></span><span class="statLbl">' + esc(r.name) + '</span></div><strong>' + eur(r.amount) + '</strong></div>'; }).join('') + '</div></div>';
}
function summaryCard(){
  const totals = kpis();
  return '<div class="card"><b>Riepilogo scadenze</b><div class="statRow"><div class="stat tint-orange"><div class="statHead"><span class="statDot"></span><span class="statLbl">Scadute</span></div><strong>' + totals.overdue + '</strong><small>Non pagate</small></div><div class="stat tint-sage"><div class="statHead"><span class="statDot"></span><span class="statLbl">Da controllare</span></div><strong>' + totals.open + '</strong><small>Aperte</small></div></div></div>';
}
function dueRow(d){
  const status = d.status === 'paid' ? 'Pagata' : isOverdue(d) ? 'Scaduta' : isToday(d) ? 'Oggi' : 'Da pagare';
  const tag = d.status === 'paid' ? 'green' : isOverdue(d) ? 'orange' : isToday(d) ? 'blue' : 'gray';
  return '<div class="row"><div class="date">' + shortDate(d.dueDate) + '</div><div><div class="title">' + esc(d.title) + '</div><div class="desc">' + esc(categoryName(d.categoryId)) + ' · <span class="tag ' + tag + '">' + status + '</span></div></div><div class="value">' + eur(d.amount) + '</div></div>';
}
function newExpenseView(){
  return '<h1>Nuova spesa</h1>' + monthSelector() + '<div class="card"><form class="form" onsubmit="saveExpense(event)"><div class="field"><label>Tipologia spesa</label><select name="expenseType">' + options(EXPENSE_TYPES) + '</select></div><div class="field"><label>Categoria</label><select name="categoryId">' + data.categories.map(function(c){ return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div><div class="field"><label>Descrizione</label><input name="title" placeholder="Mutuo casa, TARI, spesa supermercato" required></div><div class="field"><label>Importo</label><input name="amount" type="number" step="0.01" min="0" required></div><div class="field"><label>Data riferimento</label><input name="date" type="date" value="' + (todayISO() < START_DATE ? START_DATE : todayISO()) + '" required></div><div class="field"><label>Frequenza</label><select name="frequency">' + options(FREQUENCIES) + '</select></div><div class="field"><label>Data scadenza</label><input name="dueDate" type="date"></div><div class="field"><label>Metodo pagamento</label><input name="paymentMethod" placeholder="Conto, carta, contanti"></div><div class="field"><label>Note</label><textarea name="notes"></textarea></div><div class="actions"><button class="primary">Salva spesa</button><button type="button" class="secondary" onclick="go(\'home\')">Annulla</button></div></form></div>';
}
function options(obj){ return Object.keys(obj).map(function(key){ return '<option value="' + key + '">' + obj[key] + '</option>'; }).join(''); }
function saveExpense(event){
  event.preventDefault();
  const f = Object.fromEntries(new FormData(event.target));
  const expense = { id: uid('exp'), title: f.title, amount: Number(f.amount || 0), date: f.date, categoryId: f.categoryId, expenseType: f.expenseType, frequency: f.frequency, paymentMethod: f.paymentMethod || '', notes: f.notes || '' };
  data.expenses.unshift(expense);
  if(f.dueDate || ['fixed_recurring','due_date','installment','project_extra'].indexOf(f.expenseType) >= 0){
    data.dueDates.unshift({ id: uid('due'), title: f.title, amount: Number(f.amount || 0), dueDate: f.dueDate || f.date, categoryId: f.categoryId, status: 'pending', sourceExpenseId: expense.id });
  }
  saveData(); state.view = 'home'; showMessage('Spesa salvata.');
}
function expensesView(){
  const rows = data.expenses.filter(function(e){ return isInMonth(e.date); }).sort(function(a,b){ return b.date.localeCompare(a.date); });
  return '<h1>Spese</h1>' + monthSelector() + (rows.length ? '<div class="list">' + rows.map(function(e){ return '<div class="row"><div class="date">' + shortDate(e.date) + '</div><div><div class="title">' + esc(e.title) + '</div><div class="desc">' + esc(categoryName(e.categoryId)) + ' · ' + EXPENSE_TYPES[e.expenseType] + '</div></div><div class="value">' + eur(e.amount) + '<br><button class="secondary danger" style="padding:6px;margin-top:6px" onclick="deleteExpense(\'' + e.id + '\')">Elimina</button></div></div>'; }).join('') + '</div>' : '<div class="card empty">Nessuna spesa inserita.</div>');
}
function duesView(){
  const rows = data.dueDates.slice().sort(function(a,b){ return a.dueDate.localeCompare(b.dueDate); });
  return '<h1>Scadenze</h1>' + monthSelector() + (rows.length ? '<div class="list">' + rows.map(function(d){ const paid = d.status === 'paid'; return '<div class="row"><div class="date">' + shortDate(d.dueDate) + '</div><div><div class="title">' + esc(d.title) + '</div><div class="desc">' + esc(categoryName(d.categoryId)) + ' · ' + (paid ? 'Pagata' : isOverdue(d) ? 'Scaduta' : 'Da pagare') + ' · ' + longDate(d.dueDate) + '</div></div><div class="value">' + eur(d.amount) + '<br><button class="secondary" style="padding:6px;margin-top:6px" onclick="' + (paid ? 'markDuePending' : 'markDuePaid') + '(\'' + d.id + '\')">' + (paid ? 'Ripristina' : 'Pagata') + '</button></div></div>'; }).join('') + '</div>' : '<div class="card empty">Nessuna scadenza inserita.</div>');
}
function budgetView(){
  const rows = categoryTotals(state.month);
  return '<h1>Budget</h1>' + monthSelector() + '<div class="card heroCard"><div class="kpiGrid"><div><span>Totale mese</span><strong>' + eur(monthTotal(state.month)) + '</strong><small>Uscite + scadenze</small></div><div><span>Categorie</span><strong>' + rows.length + '</strong><small>Con movimenti</small></div></div><div class="chartWrap"><div class="chartTitle"><span>Andamento uscite mensili</span><span>' + state.month.slice(0,4) + '</span></div>' + annualChartSvg() + '</div></div>' + (rows.length ? '<div class="list">' + rows.map(function(r){ return '<div class="row"><div class="roundIcon blue">€</div><div><div class="title">' + esc(r.name) + '</div><div class="desc">' + monthLabel(state.month) + '</div></div><div class="value">' + eur(r.amount) + '</div></div>'; }).join('') + '</div>' : '<div class="card empty">Nessun dato per il mese.</div>');
}
function settingsView(){ return '<h1>Impostazioni</h1><div class="card"><div class="form"><div class="field"><label>Data avvio operativo</label><input readonly value="1 luglio 2026"></div><div class="field"><label>Notifiche</label><input readonly value="Web app + email nella prossima fase"></div><div class="actions"><button class="primary" onclick="seedDemo()">Carica dati demo</button><button class="secondary" onclick="toggleTheme()">Cambia tema</button><button class="secondary danger" onclick="clearData()">Cancella dati locali</button></div></div></div>'; }
function markDuePaid(id){ const due = data.dueDates.find(function(d){ return d.id === id; }); if(due){ due.status = 'paid'; due.paidDate = todayISO(); saveData(); render(); } }
function markDuePending(id){ const due = data.dueDates.find(function(d){ return d.id === id; }); if(due){ due.status = 'pending'; delete due.paidDate; saveData(); render(); } }
function deleteExpense(id){ data.expenses = data.expenses.filter(function(e){ return e.id !== id; }); data.dueDates = data.dueDates.filter(function(d){ return d.sourceExpenseId !== id; }); saveData(); render(); }
function monthTotal(month){ return data.expenses.filter(function(e){ return isInMonth(e.date, month); }).reduce(function(s,e){ return s + Number(e.amount || 0); }, 0) + data.dueDates.filter(function(d){ return isInMonth(d.dueDate, month); }).reduce(function(s,d){ return s + Number(d.amount || 0); }, 0); }
function categoryTotals(month){
  const map = {};
  function add(id, amount){ const name = categoryName(id); if(!map[id]) map[id] = { name: name, amount: 0 }; map[id].amount += Number(amount || 0); }
  data.expenses.filter(function(e){ return isInMonth(e.date, month); }).forEach(function(e){ add(e.categoryId, e.amount); });
  data.dueDates.filter(function(d){ return isInMonth(d.dueDate, month); }).forEach(function(d){ add(d.categoryId, d.amount); });
  return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return b.amount - a.amount; });
}
function seedDemo(){
  data = defaultData();
  data.expenses = [
    { id: uid('exp'), title:'Spesa supermercato media', amount:180, date:'2026-07-06', categoryId:'alimentari', expenseType:'average_estimate', frequency:'weekly' },
    { id: uid('exp'), title:'Carburante', amount:90, date:'2026-07-08', categoryId:'auto', expenseType:'variable_recurring', frequency:'weekly' }
  ];
  data.dueDates = [
    { id: uid('due'), title:'Mutuo casa', amount:850, dueDate:'2026-07-05', categoryId:'mutuo', status:'pending' },
    { id: uid('due'), title:'Assicurazione auto', amount:620, dueDate:'2026-07-15', categoryId:'assicurazioni', status:'pending' },
    { id: uid('due'), title:'TARI', amount:450, dueDate:'2026-11-30', categoryId:'tasse', status:'pending' }
  ];
  saveData(); state.view = 'home'; showMessage('Dati demo caricati.');
}
function clearData(){ if(confirm('Cancellare i dati locali di Nest Egg?')){ localStorage.removeItem(STORAGE_KEY); data = defaultData(); render(); } }
