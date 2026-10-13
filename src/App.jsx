import { Suspense, lazy, useEffect, useLayoutEffect, useState } from 'react'
import {
  Archive, ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, ChevronRight,
  CirclePlay, Download, FileUp, LayoutDashboard, LogOut,
  Menu, Moon, Plus, Search, Sparkles, Sun, Trash2, Users,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import './App.css'

const SolarSystemScene = lazy(() => import('./SolarSystemScene'))

const seedTrainings = [
  { id: 't1', title: 'HR Essentials', difficulty: 3, audience: 'Junior', status: 'Current', source: 'HR handbook.pdf', completion: 78, createdBy: 'Maria' },
  { id: 't2', title: 'Workplace Safety', difficulty: 5, audience: 'Junior', status: 'Current', source: 'Safety guide.docx', completion: 65, createdBy: 'Ethan' },
  { id: 't3', title: 'Conflict Resolution', difficulty: 7, audience: 'Senior', status: 'Current', source: 'Team playbook.pdf', completion: 81, createdBy: 'Maria' },
  { id: 't4', title: 'GDPR Awareness', difficulty: 8, audience: 'Dept Head', status: 'Archived', source: 'GDPR notes.pdf', completion: 41, createdBy: 'Maria' },
]

const people = [
  { id: 'u1', name: 'Aisha Khan', role: 'Junior', email: 'aisha@company.com', progress: 78, score: 82, skills: { communication: 82, safety: 74, problemSolving: 78, teamwork: 88 }, capabilities: ['Clear handoffs', 'Hazard reporting', 'Peer feedback'], issues: ['Needs more practice prioritizing urgent requests'] },
  { id: 'u2', name: 'Lucas Hart', role: 'Junior', email: 'lucas@company.com', progress: 54, score: 70, skills: { communication: 68, safety: 79, problemSolving: 61, teamwork: 72 }, capabilities: ['Safe-work checks', 'Team updates'], issues: ['Conflict resolution assessment needs a retake', 'Training progress is below the team average'] },
  { id: 'u3', name: 'Sam Rivers', role: 'Junior', email: 'sam@company.com', progress: 91, score: 94, skills: { communication: 94, safety: 96, problemSolving: 89, teamwork: 92 }, capabilities: ['Incident response', 'Coaching peers', 'Consistent documentation'], issues: ['No open issues'] },
  { id: 'u4', name: 'Ethan Cole', role: 'Senior', email: 'ethan@company.com', progress: 76, score: 88 },
  { id: 'u5', name: 'Danielle Wu', role: 'Senior', email: 'danielle@company.com', progress: 72, score: 86 },
  { id: 'u6', name: 'Maria Chen', role: 'Dept Head', email: 'maria@company.com', progress: 100, score: 98 },
]

const cannedLessons = [
  { title: 'Clear Communication', summary: 'A short guide to making expectations visible and easier to act on.', points: ['State the outcome before the task.', 'Confirm the owner and next deadline.', 'Leave a written trail for decisions.'], questions: [{ prompt: 'Which habit best improves team clarity?', options: ['Clear written expectations', 'Changing goals weekly', 'Avoiding feedback', 'Keeping decisions informal'], correct: 0 }, { prompt: 'What should follow an agreed decision?', options: ['A written next step', 'A longer meeting', 'No follow-up', 'A new owner'], correct: 0 }] },
  { title: 'Safe Work, Every Day', summary: 'Core principles for recognizing risk and responding with confidence.', points: ['Notice hazards before they become incidents.', 'Use the reporting path your team has agreed on.', 'Document the learning after a response.'], questions: [{ prompt: 'What is the best first response to an unsafe condition?', options: ['Report it and remove risk if safe', 'Ignore it', 'Wait until tomorrow', 'Only document it later'], correct: 0 }, { prompt: 'When does safety culture start?', options: ['Before an incident', 'After an accident', 'During drills only', 'When asked'], correct: 0 }] },
]

const loadStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }

function App() {
  const [screen, setScreen] = useState('landing')
  const [role, setRole] = useState('Junior')
  const [view, setView] = useState('dashboard')
  const [trainings, setTrainings] = useState(() => loadStored('pt-trainings', seedTrainings))
  const [learnerProgress, setLearnerProgress] = useState(() => loadStored('pt-progress', { t1: 78, t2: 54 }))
  const [activeTraining, setActiveTraining] = useState(seedTrainings[0])
  const [notice, setNotice] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('pt-theme')
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => localStorage.setItem('pt-trainings', JSON.stringify(trainings)), [trainings])
  useEffect(() => localStorage.setItem('pt-progress', JSON.stringify(learnerProgress)), [learnerProgress])
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('pt-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const begin = () => setScreen('auth')
  const logout = () => { setScreen('landing'); setView('dashboard') }
  const openTraining = (training) => { setActiveTraining(training); setView('lesson') }
  const showNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600) }
  const changeTraining = (id, action) => { setTrainings(current => current.map(t => t.id === id ? { ...t, status: action === 'archive' ? 'Archived' : action === 'restore' ? 'Current' : 'Deleted' } : t)); showNotice(action === 'archive' ? 'Training moved to Archive.' : action === 'restore' ? 'Training restored to Current.' : 'Training deleted.') }
  const publishTraining = (training) => { setTrainings(current => [training, ...current]); setActiveTraining(training); setView('dashboard'); showNotice(training.status === 'Draft' ? 'Draft saved. Finish it whenever you are ready.' : 'Training published and ready for learners.') }
  const restoreAll = () => { setTrainings(current => current.map(t => t.status === 'Archived' ? { ...t, status:'Current' } : t)); showNotice('All archived trainings have been restored.') }

  let page
  if (screen === 'landing') page = <Landing onBegin={begin} onReadBrief={() => setScreen('brief')} />
  else if (screen === 'brief') page = <ProductBrief onBack={() => setScreen('landing')} onBegin={begin} />
  else if (screen === 'auth') page = <Auth onBack={() => setScreen('landing')} onEnter={(newRole) => { setRole(newRole); setScreen('app'); setView('dashboard') }} />
  else page = <Workspace role={role} view={view} setView={setView} trainings={trainings} progress={learnerProgress} setProgress={setLearnerProgress} activeTraining={activeTraining} openTraining={openTraining} changeTraining={changeTraining} publishTraining={publishTraining} restoreAll={restoreAll} notice={notice} logout={logout} />

  return <>{page}<button className="theme-toggle" type="button" onClick={() => setDarkMode(current => !current)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={darkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun size={19} /> : <Moon size={19} />}</button></>
}

function Logo() { return <span className="brand"><span className="brand-mark"><span /></span>POCKET TRAINER</span> }

function Landing({ onBegin, onReadBrief }) {
  return <main className="site-shell landing">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grain" />
    <nav className="nav wrap"><Logo /><div className="landing-nav-actions"><button className="nav-brief" onClick={onReadBrief}><BookOpen size={15} /> Product thinking</button><button className="nav-cta" onClick={onBegin}>Log in <ArrowRight size={15} /></button></div></nav>
    <section className="hero wrap">
      <div className="hero-copy"><p className="eyebrow"><Sparkles size={14} /> Training, made lighter</p><h1>Learn better.<br /><em>One bite at a time.</em></h1><p className="hero-intro">Turn your team&apos;s know-how into short, vivid lessons that people actually remember.</p><button className="button button-dark" onClick={onBegin}>Enter Pocket Trainer <ArrowRight size={18} /></button></div>
      <div className="hero-art"><Suspense fallback={<div className="solar-scene solar-scene-loading" role="img" aria-label="Solar system loading" />}><SolarSystemScene /></Suspense><div className="floating-card breathing-card"><span className="card-kicker">TODAY&apos;S LESSON</span><strong>Workplace safety</strong><div className="breath-meter"><i /><i /><i /><i /><i /></div><span className="card-footer"><BookOpen size={14} /> 4 minute micro-lesson</span></div><div className="floating-card pulse-card"><span className="pulse-dot" /> 87% team progress</div></div>
    </section>
    <section className="landing-proof wrap"><span>Upload once</span><span>Learn in minutes</span><span>See what sticks</span></section>
  </main>
}

function ProductBrief({ onBack, onBegin }) {
  return <main className="site-shell brief-page">
    <div className="ambient ambient-one" /><div className="grain" />
    <nav className="brief-nav wrap"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back</button><Logo /><button className="button button-dark compact" onClick={onBegin}>Log in <ArrowRight size={15} /></button></nav>
    <article className="brief-content wrap">
      <header className="brief-hero"><div><p className="eyebrow"><BookOpen size={14} /> Pocket Trainer / Product brief</p><h1>Why we built<br />Pocket Trainer.</h1></div><p className="brief-lead">A guide to the problem, product choices, and demo boundaries behind the PRD.</p></header>
      <section className="brief-thesis"><div className="brief-persona-meta"><span className="brief-index">PROJECT / PERSONA</span><p><strong>PT — Pocket Trainer</strong><br />Team: Deniz Ikili (+ teammates)<br />Maria · Head of HR</p></div><div><h2>Good knowledge is often trapped in documents.</h2><p>The PRD starts with Maria, a non-technical department head who is highly skilled in training, engaging, and a strong teacher and mentor. Still, she finds it difficult to create high-quality training in fields owned by other department heads.</p><div className="brief-persona-facts"><p><strong>Her strengths</strong>Training · Engagement · Mentorship</p><p><strong>What she needs</strong>Cooperation · Better lectures · Shared expertise</p></div></div></section>
      <section className="brief-process">
        <div className="brief-section-heading"><p className="eyebrow">The product idea</p><h2>From source material<br />to visible progress.</h2></div>
        <div className="brief-steps">
          <section><span>01 / START WITH WHAT EXISTS</span><h3>Use the team&apos;s material.</h3><p>Upload a handbook, guide, or playbook instead of starting from a blank page.</p></section>
          <section><span>02 / MAKE IT TEACHABLE</span><h3>Keep learning bite-sized.</h3><p>Shape the material into a short lecture and quiz, with difficulty tuned for its audience.</p></section>
          <section><span>03 / CLOSE THE LOOP</span><h3>Make learning visible.</h3><p>Juniors build skills, Seniors spot where support is needed, and Department Heads can plan from team progress.</p></section>
        </div>
      </section>
      <section className="brief-stories"><p className="eyebrow">The user stories behind the roles</p><div className="brief-story-list">
        <article><span>01 / JUNIOR</span><p><strong>Wants to study deeply</strong> so they can earn a role or master a new field.</p></article>
        <article><span>02 / SENIOR</span><p><strong>Wants to follow progress</strong> to document capabilities and see where juniors need support.</p></article>
        <article><span>03 / DEPARTMENT HEAD</span><p><strong>Wants a view of training data</strong> across the team to make longer-term department and company plans.</p></article>
      </div></section>
      <section className="brief-roles"><p className="eyebrow">Designed around three roles</p><div className="brief-role-row"><strong>Junior</strong><p>Studies lessons, takes quick knowledge checks, and follows personal progress.</p></div><div className="brief-role-row"><strong>Senior</strong><p>Creates training, follows junior progress, and sees capabilities alongside issues.</p></div><div className="brief-role-row"><strong>Department Head</strong><p>Gets a wider view of student development and reporting for longer-term decisions.</p></div></section>
      <section className="brief-how"><div className="brief-section-heading"><p className="eyebrow">How the app works</p><h2>One entry point.<br />Three journeys.</h2></div><ol className="brief-flow">
        <li><span>01</span><div><h3>Explore or sign in</h3><p>Read this Product thinking brief from the landing page, or choose Log in / Enter Pocket Trainer to continue.</p></div></li>
        <li><span>02</span><div><h3>Choose a demo role</h3><p>Enter an address ending in @company.com and choose Junior, Senior, or Dept Head. This is a demo gate, not account creation.</p></div></li>
        <li><span>03</span><div><h3>Junior learns</h3><p>Open a current training, read the short lesson, answer its knowledge check, then finish to save progress in this browser.</p></div></li>
        <li><span>04</span><div><h3>Senior supports</h3><p>Review junior capabilities and issues, search learners, or create training by naming it, setting audience and difficulty, selecting a file, generating the demo lesson, and publishing it. Current trainings can be archived or deleted.</p></div></li>
        <li><span>05</span><div><h3>Department Head plans</h3><p>Review the student skill matrix and comparison chart, then use Generate report to show a progress summary and download its CSV.</p></div></li>
      </ol></section>
      <section className="brief-requirements"><div className="brief-section-heading"><p className="eyebrow">From notes to requirements</p><h2>What the build<br />does and defers.</h2></div><div className="brief-requirement-groups">
        <section><span>FUNCTIONAL / DEMO</span><ul><li><strong>Files to lessons:</strong> upload starts a scripted lecture-and-quiz generation flow.</li><li><strong>Company email to auth:</strong> the gate checks for @company.com and routes by the selected role.</li><li><strong>Audience to difficulty:</strong> training forms capture an audience and a level from 1–10; content is not truly adapted in this prototype.</li></ul></section>
        <section><span>OPTIONAL / FUTURE WORK</span><ul><li>Track time spent per lecture and quiz.</li><li>Tailor lessons with a real AI model.</li><li>Research markets and sub-markets for positioning.</li><li>Implement real GDPR and security compliance; the demo report is not a compliance system.</li></ul></section>
      </div><div className="brief-differentiators"><p className="eyebrow">What sets the idea apart</p><p>In-house AI as a future direction · bite-sized lectures, quizzes, and tests · simple explanations that support deeper understanding.</p></div></section>
      <section className="brief-revenue"><div><p className="eyebrow">Proposed revenue stream</p><h2>Simple monthly access.</h2></div><div className="brief-price"><strong>$1</strong><div><b>per user / month</b><p>A low-cost recurring subscription for platform access, inspired by per-user learning-platform pricing.</p><small>Proposal only. This demo has no checkout, payment collection, or subscription billing.</small></div></div></section>
      <section className="brief-outcomes"><div><p className="eyebrow">What success means</p><h2>Prove the experience<br />end to end.</h2></div><ul><li>Every role can reach its core workflow without a dead end.</li><li>The scripted upload-to-lesson journey completes in under six seconds.</li><li>Management views show useful sample progress instead of empty charts.</li><li>The interface stays approachable for a non-technical author.</li></ul></section>
      <section className="brief-boundaries"><p className="eyebrow">What this prototype does not claim</p><div className="brief-boundary-grid"><p><strong>Lesson generation is simulated.</strong> Uploaded file contents are ignored; a scripted sequence returns one of the prepared lesson and quiz examples.</p><p><strong>Authentication is a UI gate.</strong> The company-email check does not connect to SSO or verify a real account.</p><p><strong>Data is local demo data.</strong> Training progress is stored in this browser; skill evaluations, capabilities, and issues are sample records.</p></div></section>
      <footer className="brief-footer"><p>Compiled from the Pocket Trainer PRD and original planning notes. The PRD favors React and Recharts; this demo uses React, custom CSS, Lucide icons, Recharts, and browser storage.</p><button className="button button-dark" onClick={onBegin}>Enter Pocket Trainer <ArrowRight size={17} /></button></footer>
    </article>
  </main>
}

function Auth({ onBack, onEnter }) {
  const [email, setEmail] = useState('maria@company.com'); const [chosenRole, setChosenRole] = useState('Dept Head'); const [error, setError] = useState('')
  const submit = (e) => { e.preventDefault(); if (!email.trim().toLowerCase().endsWith('@company.com')) return setError('Use your company email (for example, maria@company.com).'); onEnter(chosenRole) }
  return <main className="auth-page"><div className="ambient ambient-one" /><div className="grain" /><section className="auth-card glass-panel"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back</button><Logo /><p className="eyebrow">Welcome to the learning room</p><h2>Sign in and<br /><em>make progress.</em></h2><form onSubmit={submit}><label>Company email<input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" /></label><label>Your demo role<select value={chosenRole} onChange={e => setChosenRole(e.target.value)}><option>Junior</option><option>Senior</option><option>Dept Head</option></select></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark" type="submit">Continue <ArrowRight size={17} /></button></form><p className="auth-help">Can&apos;t log in? Contact your company ID administrator.</p></section></main>
}

function Workspace({ role, view, setView, trainings, progress, setProgress, activeTraining, openTraining, changeTraining, publishTraining, restoreAll, notice, logout }) {
  const nav = role === 'Junior' ? [{ id:'dashboard', label:'Training', icon:BookOpen }, { id:'progress', label:'My progress', icon:BarChart3 }] : [{ id:'dashboard', label:'Current', icon:LayoutDashboard }, { id:'create', label:'New training', icon:Plus }, { id:'drafts', label:'Drafts', icon:FileUp }, { id:'people', label:'Find junior', icon:Users }, { id:'archive', label:'Archive', icon:Archive }, ...(role === 'Dept Head' ? [{ id:'export', label:'Generate report', icon:BarChart3 }] : [])]
  return <main className="app-shell"><aside className="sidebar"><Logo /><div className="role-badge">{role}</div><nav>{nav.map(({id,label,icon:Icon}) => <button key={id} onClick={() => setView(id)} className={view === id ? 'active' : ''}><Icon size={18} />{label}</button>)}</nav><button className="logout" onClick={logout}><LogOut size={17} />Sign out</button></aside><section className="workspace"><header className="workspace-head"><div><p className="eyebrow">Pocket Trainer / {role}</p><h1>{view === 'dashboard' ? `Hello, ${role === 'Dept Head' ? 'Maria' : role === 'Senior' ? 'Ethan' : 'Aisha'}.` : titleForView(view)}</h1></div><button className="profile" onClick={() => setView('dashboard')} aria-label="Return to dashboard"><span>{role[0]}</span><Menu size={18} /></button></header>{notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}{view === 'dashboard' && <Dashboard role={role} trainings={trainings} progress={progress} openTraining={openTraining} changeTraining={changeTraining} onCreate={() => setView('create')} onViewPeople={() => setView('people')} />}{view === 'create' && <CreateTraining onPublish={publishTraining} onCancel={() => setView('dashboard')} />}{view === 'drafts' && <DraftView trainings={trainings} onPublish={(id) => changeTraining(id,'restore')} onCreate={() => setView('create')} />}{view === 'people' && <People />}{view === 'archive' && <ArchiveView trainings={trainings} onRestore={(id) => changeTraining(id,'restore')} onRestoreAll={restoreAll} />}{view === 'export' && <ExportData />}{view === 'progress' && <JuniorProgress trainings={trainings} progress={progress} />}{view === 'lesson' && <Lesson training={activeTraining} onBack={() => setView('dashboard')} setProgress={setProgress} />}</section></main>
}

const titleForView = (view) => ({ create:'Create something useful.', drafts:'Work in progress.', people:'Find your learners.', archive:'Saved for later.', export:'Student progress report.', progress:'Your momentum.', lesson:'Keep going.' }[view] || 'Pocket Trainer')

function LegacyDashboard({ role, trainings, progress, openTraining, changeTraining, onCreate, onViewPeople }) {
  const current = trainings.filter(t => t.status === 'Current'); const avg = role === 'Junior' ? Math.round(Object.values(progress).reduce((a,b) => a+b, 0) / Object.values(progress).length) : Math.round(current.reduce((a,t)=>a+t.completion,0)/current.length)
  return <><div className="metric-grid detailed-metrics"><Metric label={role === 'Junior' ? 'Your progress' : 'Training completion'} value={`${avg}%`} caption="Across active learning" /><Metric label={role === 'Junior' ? 'Lessons ready' : 'Active trainings'} value={role === 'Junior' ? current.filter(t=>t.audience==='Junior').length : current.length} caption="Ready for your team" /><Metric label={role === 'Dept Head' ? 'Learners engaged' : 'Knowledge checks'} value={role === 'Dept Head' ? '93%' : '18'} caption="This month" /><Metric label="Average score" value={role === 'Junior' ? '86%' : '84%'} caption="Up 6% this month" /></div><div className="dashboard-grid"><section className="panel progress-panel"><div className="panel-head"><div><p className="eyebrow">Learning pulse</p><h2>Progress that tells a story.</h2></div><BarChart3 size={20} /></div><div className="chart-bars">{[42,61,48,74,66,86,78].map((v,i)=><div key={i}><i style={{height:`${v}%`}} /><span>{['M','T','W','T','F','S','S'][i]}</span></div>)}</div><div className="chart-legend"><span><i className="legend-dot violet" /> Completed lessons</span><span>+18% vs last week</span></div></section><section className="panel insight-panel"><p className="eyebrow">Pocket insight</p><h3>{role === 'Junior' ? 'You are building a powerful learning streak.' : 'Shorter lessons are being completed 24% faster.'}</h3><p>Keep the next lesson focused and practical.</p><span className="spark"><Sparkles size={18} /></span></section></div>{role !== 'Junior' && <section className="dashboard-detail-grid"><section className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">Team activity</p><h2>What changed today.</h2></div><Users size={19} /></div>{[['Aisha Khan','Completed HR Essentials','8 min ago'],['Sam Rivers','Scored 94% on Workplace Safety','42 min ago'],['Lucas Hart','Started Conflict Resolution','2 hrs ago']].map(([name,event,time])=><div className="activity-row" key={name}><span className="avatar">{name[0]}</span><p><b>{name}</b> {event}<small>{time}</small></p></div>)}</section><section className="panel coverage-panel"><p className="eyebrow">Coverage by audience</p><h2>Learning reach.</h2><div className="coverage-item"><span>Junior</span><div><i style={{width:'84%'}} /></div><b>84%</b></div><div className="coverage-item"><span>Senior</span><div><i style={{width:'72%'}} /></div><b>72%</b></div><div className="coverage-item"><span>Leaders</span><div><i style={{width:'91%'}} /></div><b>91%</b></div><button className="underlined" onClick={onViewPeople}>View full report <ChevronRight size={15} /></button></section></section>}<section className="list-section"><div className="list-head"><div><p className="eyebrow">Your library</p><h2>{role === 'Junior' ? 'Pick up where you left off.' : 'Current training.'}</h2></div>{role !== 'Junior' && <button className="button button-dark compact" onClick={onCreate}><Plus size={16} /> New training</button>}</div><div className="training-grid">{current.filter(t => role !== 'Junior' || t.audience === 'Junior').map(t => <TrainingCard key={t.id} training={t} role={role} onOpen={() => openTraining(t)} onChange={changeTraining} />)}</div>{role !== 'Junior' && trainings.some(t => t.status === 'Archived') && <p className="archive-note"><Archive size={15} /> {trainings.filter(t => t.status === 'Archived').length} archived training{trainings.filter(t => t.status === 'Archived').length !== 1 && 's'} can be restored from Archive.</p>}</section></>
}
function Metric({ label, value, caption }) { return <section className="metric glass-panel"><p>{label}</p><strong>{value}</strong><span>{caption}</span></section> }
function TrainingCard({ training, role, onOpen, onChange }) { return <article className="training-card glass-panel"><div className="training-top"><span className="level">LEVEL {training.difficulty}</span>{role !== 'Junior' && <div className="card-actions"><button aria-label="Archive training" onClick={() => onChange(training.id,'archive')}><Archive size={15} /></button><button aria-label="Delete training" onClick={() => onChange(training.id,'delete')}><Trash2 size={15} /></button></div>}</div><h3>{training.title}</h3><p>{training.source} · {training.audience}</p><div className="completion"><i style={{width:`${training.completion}%`}} /></div><footer><span>{training.completion}% complete</span><button onClick={onOpen}>{role === 'Junior' ? 'Resume' : 'Preview'} <ChevronRight size={15} /></button></footer></article> }
function ArchiveView({ trainings, onRestore, onRestoreAll }) { const archived = trainings.filter(t => t.status === 'Archived'); return <section className="archive-view"><div className="archive-intro panel"><span className="export-icon"><Archive size={27} /></span><div><p className="eyebrow">Recoverable storage</p><h2>Your training, held safely.</h2><p>Restore an archived training whenever it becomes useful again. Deleted trainings are removed permanently.</p></div>{archived.length > 1 && <button className="quiet-button" onClick={onRestoreAll}>Restore all</button>}</div>{archived.length ? <div className="archive-grid">{archived.map(t=><article className="archive-card panel" key={t.id}><div><span className="level">LEVEL {t.difficulty}</span><h3>{t.title}</h3><p>{t.source} · {t.audience}</p></div><button className="button button-dark compact" onClick={() => onRestore(t.id)}><Archive size={16} /> Restore training</button></article>)}</div> : <section className="empty-archive panel"><Archive size={28} /><h2>Nothing is archived.</h2><p>When you archive a training from the Current dashboard, it will appear here ready to restore.</p></section>}</section> }
function DraftView({ trainings, onPublish, onCreate }) { const drafts = trainings.filter(t => t.status === 'Draft'); return <section className="archive-view"><div className="archive-intro panel"><span className="export-icon"><FileUp size={27} /></span><div><p className="eyebrow">Unpublished work</p><h2>Ideas worth finishing.</h2><p>Drafts stay private until you are ready to put them in front of learners.</p></div></div>{drafts.length ? <div className="archive-grid">{drafts.map(t=><article className="archive-card panel" key={t.id}><div><span className="level">LEVEL {t.difficulty}</span><h3>{t.title}</h3><p>{t.audience} audience · saved just now</p></div><button className="button button-dark compact" onClick={() => onPublish(t.id)}>Publish draft <ArrowRight size={16} /></button></article>)}</div> : <section className="empty-archive panel"><FileUp size={28} /><h2>No drafts yet.</h2><p>Save a training draft when you have an idea but not the source material ready.</p><button className="button button-dark compact" onClick={onCreate}><Plus size={15} /> Create a draft</button></section>}</section> }


const skillAreas = [
  { key: 'communication', label: 'Communication', color: '#729d48' },
  { key: 'safety', label: 'Safety', color: '#e6a33e' },
  { key: 'problemSolving', label: 'Problem solving', color: '#6588c5' },
  { key: 'teamwork', label: 'Teamwork', color: '#c66c53' },
]

function getLearnerRecords(trainings, progress) {
  const activeJuniorTrainings = trainings.filter(training => training.audience === 'Junior' && training.status === 'Current')
  return people.filter(person => person.role === 'Junior').map(person => {
    if (person.id !== 'u1' || activeJuniorTrainings.length === 0) return person
    const currentProgress = activeJuniorTrainings.map(training => progress[training.id] ?? 0)
    return { ...person, progress: Math.round(currentProgress.reduce((total, value) => total + value, 0) / currentProgress.length) }
  })
}

function Dashboard(props) {
  const students = getLearnerRecords(props.trainings, props.progress)
  return <>{props.role === 'Dept Head' && <DepartmentHeadAnalytics students={students} />}{props.role === 'Senior' && <SeniorDevelopment students={students} />}<LegacyDashboard {...props} /></>
}

function DepartmentHeadAnalytics({ students }) {
  const chartData = students.map(student => ({ ...student.skills, name: student.name }))
  return <section className="leadership-analytics">
    <div className="analytics-heading"><div><p className="eyebrow">Department overview</p><h2>Student development</h2></div><span>{students.length} learners tracked</span></div>
    <div className="analytics-grid">
      <section className="panel matrix-panel">
        <div className="panel-head"><div><p className="eyebrow">Progress matrix</p><h3>Skill development by student</h3></div><Users size={19} /></div>
        <div className="matrix-scroll"><div className="development-matrix" role="table" aria-label="Student skill development matrix" style={{ gridTemplateColumns: `minmax(125px, 1.3fr) repeat(${skillAreas.length}, minmax(68px, 1fr))` }}>
          <span className="matrix-name matrix-header" role="columnheader">Student</span>{skillAreas.map(skill => <span className="matrix-header" role="columnheader" key={skill.key}>{skill.label}</span>)}
          {students.map(student => <div className="matrix-row" role="row" key={student.id}>
            <strong className="matrix-name" role="rowheader">{student.name}<small>{student.progress}% overall progress</small></strong>
            {skillAreas.map(skill => <span className="matrix-cell" role="cell" key={skill.key} style={{ backgroundColor: `color-mix(in srgb, #8bc66b ${student.skills[skill.key]}%, #f4f2eb)` }} title={`${student.name}: ${skill.label} ${student.skills[skill.key]}%`}>{student.skills[skill.key]}%</span>)}
          </div>)}
        </div></div>
        <div className="matrix-scale"><span>Developing</span><i /><span>Strong</span></div>
      </section>
      <section className="panel skills-chart-panel">
        <div className="panel-head"><div><p className="eyebrow">Skill evaluation</p><h3>Competencies across learners</h3></div><BarChart3 size={19} /></div>
        <div className="skills-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 3 }}>
          <CartesianGrid stroke="#dcded4" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: '#59645e', fontSize: 10 }} tickFormatter={name => name.split(' ')[0]} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#778079', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={value => [`${value}%`, 'Evaluation']} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {skillAreas.map(skill => <Bar key={skill.key} dataKey={skill.key} name={skill.label} fill={skill.color} maxBarSize={16} radius={[3, 3, 0, 0]} />)}
        </BarChart></ResponsiveContainer></div>
      </section>
    </div>
  </section>
}

function SeniorDevelopment({ students }) {
  return <section className="senior-development">
    <div className="analytics-heading"><div><p className="eyebrow">Learner follow-up</p><h2>Capabilities and issues</h2></div><span>{students.length} junior learners</span></div>
    <div className="student-development-list">{students.map(student => <article className="panel student-development" key={student.id}>
      <header><div><h3>{student.name}</h3><span>{student.progress}% progress · {student.score}% latest score</span></div><div className="student-mini-progress"><i style={{ width: `${student.progress}%` }} /></div></header>
      <div className="development-columns"><section><h4>Capabilities achieved</h4><ul>{student.capabilities.map(capability => <li key={capability}><Check size={14} />{capability}</li>)}</ul></section><section><h4>Issues faced</h4><ul className={student.issues[0] === 'No open issues' ? 'issue-list clear' : 'issue-list'}>{student.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></section></div>
    </article>)}</div>
  </section>
}
function People() { const [query,setQuery] = useState(''); const currentTrainings = loadStored('pt-trainings', seedTrainings); const currentProgress = loadStored('pt-progress', { t1: 78, t2: 54 }); const results = getLearnerRecords(currentTrainings, currentProgress).filter(p => p.name.toLowerCase().includes(query.toLowerCase())); return <section className="panel people-panel"><div className="search-box"><Search size={18} /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a junior by name" /></div><div className="people-list">{results.map(p=><article key={p.id}><span className="avatar">{p.name[0]}</span><div><strong>{p.name}</strong><small>{p.email}</small></div><span className="person-progress">{p.progress}% <i style={{width:`${p.progress}%`}} /></span><span className="score">{p.score}% score</span></article>)}</div></section> }

function CreateTraining({ onPublish, onCancel }) {
  const [title,setTitle] = useState(''); const [audience,setAudience] = useState('Junior'); const [difficulty,setDifficulty] = useState(4); const [file,setFile] = useState(null); const [stage,setStage] = useState('form'); const [lesson,setLesson] = useState(null)
  // STUB: simulates AI generation; it does not read or upload file contents.
  const generate = (e) => { e.preventDefault(); if (!file) return; setStage('analyzing'); const stages = ['Analyzing document...', 'Extracting key concepts...', 'Generating bite-sized lecture...']; let index = 0; const interval = setInterval(() => { index += 1; if(index === stages.length) { clearInterval(interval); const next = cannedLessons[Math.floor(Math.random()*cannedLessons.length)]; setLesson(next); setStage('ready') } else setStage(stages[index]) }, 950) }
  if(stage !== 'form') return <section className="generator panel">{stage === 'ready' ? <><span className="generator-check"><Check size={24} /></span><p className="eyebrow">Generation complete</p><h2>{lesson.title}</h2><p>{lesson.summary}</p><div className="generated-preview">{lesson.points.map(point=><span key={point}><Check size={14} />{point}</span>)}</div><button className="button button-dark" onClick={() => onPublish({ id:`t${Date.now()}`, title:title || lesson.title, difficulty, audience, status:'Current', source:file.name, completion:0, createdBy:'You', lesson })}>Publish training <ArrowRight size={17} /></button></> : <><div className="spinner-orb" /><p className="eyebrow">Pocket AI (demo simulation)</p><h2>{stage}</h2><p>Shaping your uploaded source into a practical learning moment.</p></>}</section>
  const saveDraft = () => onPublish({ id:`t${Date.now()}`, title:title || 'Untitled training', difficulty, audience, status:'Draft', source:file?.name || 'No source attached', completion:0, createdBy:'You' })
  return <form className="create-form panel" onSubmit={generate}><div className="form-header"><p className="eyebrow">New training</p><h2>Start with what<br />you already <em>know.</em></h2></div><div className="form-grid"><label>Training name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Customer care essentials" /></label><label>Audience<select value={audience} onChange={e=>setAudience(e.target.value)}><option>Junior</option><option>Senior</option><option>Dept Head</option></select></label></div><label className="difficulty-label">Choose difficulty <b>Level {difficulty}</b></label><div className="difficulty-row">{[1,2,3,4,5,6,7,8,9,10].map(n=><button type="button" onClick={()=>setDifficulty(n)} className={n===difficulty?'selected':''} key={n}>{n}</button>)}</div><label className="dropzone"><FileUp size={25} /><strong>{file ? file.name : 'Drop a document here'}</strong><span>{file ? 'Ready to generate' : 'PDF, DOCX or TXT — the demo does not read file contents.'}</span><input type="file" onChange={e=>setFile(e.target.files?.[0])} /></label><div className="form-buttons"><button type="button" className="quiet-button" onClick={onCancel}>Cancel</button><button type="button" className="quiet-button" onClick={saveDraft}>Save draft</button><button className="button button-dark" type="submit" disabled={!file}>Generate training <Sparkles size={17} /></button></div></form>
}

function Lesson({ training, onBack, setProgress }) { const lesson = training.lesson || cannedLessons[training.id === 't2' ? 1 : 0]; const [mode,setMode] = useState('read'); const [answer,setAnswer] = useState(null); const [question,setQuestion] = useState(0); const complete = () => { setProgress(p=>({...p,[training.id]:100})); setMode('done') }; return <section className="lesson-wrap"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to training</button>{mode === 'read' && <article className="lesson-card panel"><span className="level">LEVEL {training.difficulty}</span><h2>{training.title}</h2><p className="lesson-summary">{lesson.summary}</p><div className="lesson-points">{lesson.points.map(point=><p key={point}><span><Check size={15} /></span>{point}</p>)}</div><button className="button button-dark" onClick={()=>setMode('quiz')}>Take the quick check <CirclePlay size={17} /></button></article>}{mode === 'quiz' && <article className="lesson-card panel"><p className="eyebrow">Knowledge check {question + 1} / {lesson.questions.length}</p><h2>{lesson.questions[question].prompt}</h2><div className="options">{lesson.questions[question].options.map((option,i)=><button key={option} disabled={answer !== null} onClick={()=>setAnswer(i)} className={answer === null ? '' : i === lesson.questions[question].correct ? 'correct' : answer === i ? 'wrong' : ''}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>{answer !== null && <button className="button button-dark" onClick={()=> question === lesson.questions.length - 1 ? complete() : (setQuestion(question+1),setAnswer(null))}>{question === lesson.questions.length - 1 ? 'Finish training' : 'Next question'} <ArrowRight size={17} /></button>}</article>}{mode === 'done' && <article className="lesson-card panel completion-card"><span className="generator-check"><Check size={25} /></span><p className="eyebrow">Training complete</p><h2>That knowledge is yours now.</h2><p>Your progress has been updated. Keep your learning streak alive with another short lesson.</p><button className="button button-dark" onClick={onBack}>Back to my training <ArrowRight size={17} /></button></article>}</section> }

function JuniorProgress({ trainings, progress }) { return <section className="panel progress-detail"><p className="eyebrow">Your chapter list</p><h2>A little further, every day.</h2>{trainings.filter(t=>t.audience==='Junior' && t.status === 'Current').map(t=><div className="chapter" key={t.id}><span>{t.title}</span><div><i style={{width:`${progress[t.id] || 0}%`}} /></div><b>{progress[t.id] || 0}%</b></div>)}</section> }
function ExportData() {
  const [report, setReport] = useState(null)
  const [pdfTools, setPdfTools] = useState(null)
  const [pdfError, setPdfError] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([import('jspdf'), import('jspdf-autotable')])
      .then(([pdfModule, tableModule]) => {
        if (!cancelled) setPdfTools({ jsPDF: pdfModule.jsPDF, autoTable: tableModule.autoTable })
      })
      .catch(() => { if (!cancelled) setPdfError(true) })
    return () => { cancelled = true }
  }, [])

  const generateReport = () => {
    if (!pdfTools) return
    const trainings = loadStored('pt-trainings', seedTrainings)
    const progress = loadStored('pt-progress', { t1: 78, t2: 54 })
    const students = getLearnerRecords(trainings, progress)
    const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
    const headers = ['Student', 'Email', 'Progress %', 'Latest score %', ...skillAreas.map(skill => `${skill.label} %`), 'Capabilities achieved', 'Issues faced']
    const rows = students.map(student => [
      student.name,
      student.email,
      student.progress,
      student.score,
      ...skillAreas.map(skill => student.skills[skill.key]),
      student.capabilities.join('; '),
      student.issues.join('; '),
    ])
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
    const downloadUrl = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'pocket-trainer-student-progress.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

    const reportSummary = {
      students,
      averageProgress: Math.round(students.reduce((total, student) => total + student.progress, 0) / students.length),
      averageScore: Math.round(students.reduce((total, student) => total + student.score, 0) / students.length),
      attentionCount: students.filter(student => student.progress < 65 || student.score < 75).length,
      generatedAt: new Date().toLocaleString(),
    }
    const { jsPDF, autoTable } = pdfTools
    const pdfDocument = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdfDocument.internal.pageSize.getWidth()
    const margin = 14
    const cardGap = 6
    const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4
    const summaryStats = [
      ['LEARNERS', String(students.length)],
      ['AVERAGE PROGRESS', `${reportSummary.averageProgress}%`],
      ['AVERAGE SCORE', `${reportSummary.averageScore}%`],
      ['NEEDS ATTENTION', String(reportSummary.attentionCount)],
    ]

    pdfDocument.setProperties({ title: 'Pocket Trainer Student Progress Report', subject: 'Student training statistics' })
    pdfDocument.setFont('helvetica', 'bold')
    pdfDocument.setFontSize(19)
    pdfDocument.setTextColor(23, 33, 43)
    pdfDocument.text('Student progress report', margin, 18)
    pdfDocument.setFont('helvetica', 'normal')
    pdfDocument.setFontSize(8)
    pdfDocument.setTextColor(94, 105, 99)
    pdfDocument.text(`Pocket Trainer | Generated ${reportSummary.generatedAt}`, margin, 25)

    summaryStats.forEach(([label, value], index) => {
      const x = margin + index * (cardWidth + cardGap)
      pdfDocument.setFillColor(244, 245, 237)
      pdfDocument.roundedRect(x, 32, cardWidth, 27, 2, 2, 'F')
      pdfDocument.setFont('helvetica', 'bold')
      pdfDocument.setFontSize(7)
      pdfDocument.setTextColor(94, 105, 99)
      pdfDocument.text(label, x + 5, 40)
      pdfDocument.setFontSize(15)
      pdfDocument.setTextColor(23, 33, 43)
      pdfDocument.text(value, x + 5, 53)
    })

    pdfDocument.setFont('helvetica', 'normal')
    pdfDocument.setFontSize(7.5)
    pdfDocument.setTextColor(78, 89, 83)
    pdfDocument.text('Needs attention: progress below 65% or latest quiz score below 75%. Skill, capability, and issue data are demo records.', margin, 68)

    autoTable(pdfDocument, {
      head: [['Student', 'Progress', 'Quiz score', 'Communication', 'Safety', 'Problem solving', 'Teamwork', 'Capabilities achieved', 'Issues faced']],
      body: students.map(student => [
        student.name,
        `${student.progress}%`,
        `${student.score}%`,
        `${student.skills.communication}%`,
        `${student.skills.safety}%`,
        `${student.skills.problemSolving}%`,
        `${student.skills.teamwork}%`,
        student.capabilities.join('; '),
        student.issues.join('; '),
      ]),
      startY: 74,
      margin: { left: margin, right: margin, bottom: 16 },
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [23, 33, 43], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 248, 242] },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 }, 3: { cellWidth: 27 }, 4: { cellWidth: 16 }, 5: { cellWidth: 25 }, 6: { cellWidth: 18 }, 7: { cellWidth: 48 } },
      didDrawPage: ({ pageNumber }) => {
        pdfDocument.setFont('helvetica', 'normal')
        pdfDocument.setFontSize(7)
        pdfDocument.setTextColor(112, 122, 116)
        pdfDocument.text(`Pocket Trainer | Student progress | Page ${pageNumber}`, margin, pdfDocument.internal.pageSize.getHeight() - 7)
      },
    })
    pdfDocument.save('pocket-trainer-student-progress.pdf')
    setReport(reportSummary)
  }

  return <section className="report-page">
    <div className="export-card panel"><span className="export-icon"><BarChart3 size={30} /></span><p className="eyebrow">Student progress</p><h2>Progress, clearly reported.</h2><p>Generate a student-by-student progress summary and download both CSV and PDF reports.</p><button className="button button-dark" onClick={generateReport} disabled={!pdfTools}>{pdfTools ? 'Generate report' : 'Preparing report...'} <Download size={17} /></button><small>{pdfError ? 'PDF export could not be loaded. Refresh this page to try again.' : `Progress uses locally saved training completion. Skill scores, capabilities, and issues are demo records.${pdfTools ? '' : ' Preparing PDF export...'}`}</small></div>
    {report && <section className="report-result" aria-live="polite">
      <div className="report-heading"><div><p className="eyebrow">Generated report</p><h2>Student progress overview</h2></div><span>{report.generatedAt}</span></div>
      <div className="metric-grid report-metrics"><Metric label="Average progress" value={`${report.averageProgress}%`} caption="Across junior learners" /><Metric label="Average score" value={`${report.averageScore}%`} caption="Latest knowledge checks" /><Metric label="Needs attention" value={report.attentionCount} caption="Progress below 65% or score below 75%" /></div>
      <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Student</th><th>Progress</th><th>Score</th><th>Capabilities</th><th>Open issues</th></tr></thead><tbody>{report.students.map(student => <tr key={student.id}><th scope="row">{student.name}</th><td>{student.progress}%</td><td>{student.score}%</td><td>{student.capabilities.length}</td><td>{student.issues[0] === 'No open issues' ? 'None' : student.issues.length}</td></tr>)}</tbody></table></div>
      <p className="report-note">The downloaded CSV and PDF include each student&apos;s skill evaluations, achieved capabilities, and reported issues.</p>
    </section>}
  </section>
}

export default App
