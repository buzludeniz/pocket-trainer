
export const seedTrainings = [
  { id: 't1', title: 'HR Essentials', difficulty: 3, audience: 'Junior', status: 'Current', source: 'HR handbook.pdf', completion: 78, createdBy: 'Maria' },
  { id: 't2', title: 'Workplace Safety', difficulty: 5, audience: 'Junior', status: 'Current', source: 'Safety guide.docx', completion: 65, createdBy: 'Ethan' },
  { id: 't3', title: 'Conflict Resolution', difficulty: 7, audience: 'Senior', status: 'Current', source: 'Team playbook.pdf', completion: 81, createdBy: 'Maria' },
  { id: 't4', title: 'GDPR Awareness', difficulty: 8, audience: 'Dept Head', status: 'Archived', source: 'GDPR notes.pdf', completion: 41, createdBy: 'Maria' },
]

export const people = [
  { id: 'u1', name: 'Aisha Khan', role: 'Junior', email: 'aisha@company.com', progress: 78, score: 82, skills: { communication: 82, safety: 74, problemSolving: 78, teamwork: 88 }, capabilities: ['Clear handoffs', 'Hazard reporting', 'Peer feedback'], issues: ['Needs more practice prioritizing urgent requests'] },
  { id: 'u2', name: 'Lucas Hart', role: 'Junior', email: 'lucas@company.com', progress: 54, score: 70, skills: { communication: 68, safety: 79, problemSolving: 61, teamwork: 72 }, capabilities: ['Safe-work checks', 'Team updates'], issues: ['Conflict resolution assessment needs a retake', 'Training progress is below the team average'] },
  { id: 'u3', name: 'Sam Rivers', role: 'Junior', email: 'sam@company.com', progress: 91, score: 94, skills: { communication: 94, safety: 96, problemSolving: 89, teamwork: 92 }, capabilities: ['Incident response', 'Coaching peers', 'Consistent documentation'], issues: ['No open issues'] },
  { id: 'u4', name: 'Ethan Cole', role: 'Senior', email: 'ethan@company.com', progress: 76, score: 88 },
  { id: 'u5', name: 'Danielle Wu', role: 'Senior', email: 'danielle@company.com', progress: 72, score: 86 },
  { id: 'u6', name: 'Maria Chen', role: 'Dept Head', email: 'maria@company.com', progress: 100, score: 98 },
]

export const cannedLessons = [
  { title: 'Clear Communication', summary: 'A short guide to making expectations visible and easier to act on.', points: ['State the outcome before the task.', 'Confirm the owner and next deadline.', 'Leave a written trail for decisions.'], questions: [{ prompt: 'Which habit best improves team clarity?', options: ['Clear written expectations', 'Changing goals weekly', 'Avoiding feedback', 'Keeping decisions informal'], correct: 0 }, { prompt: 'What should follow an agreed decision?', options: ['A written next step', 'A longer meeting', 'No follow-up', 'A new owner'], correct: 0 }] },
  { title: 'Safe Work, Every Day', summary: 'Core principles for recognizing risk and responding with confidence.', points: ['Notice hazards before they become incidents.', 'Use the reporting path your team has agreed on.', 'Document the learning after a response.'], questions: [{ prompt: 'What is the best first response to an unsafe condition?', options: ['Report it and remove risk if safe', 'Ignore it', 'Wait until tomorrow', 'Only document it later'], correct: 0 }, { prompt: 'When does safety culture start?', options: ['Before an incident', 'After an accident', 'During drills only', 'When asked'], correct: 0 }] },
]

export const loadStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }

export const skillAreas = [
  { key: 'communication', label: 'Communication', color: '#729d48' },
  { key: 'safety', label: 'Safety', color: '#e6a33e' },
  { key: 'problemSolving', label: 'Problem solving', color: '#6588c5' },
  { key: 'teamwork', label: 'Teamwork', color: '#c66c53' },
]

export function getLearnerRecords(trainings, progress) {
  const activeJuniorTrainings = trainings.filter(training => training.audience === 'Junior' && training.status === 'Current')
  return people.filter(person => person.role === 'Junior').map(person => {
    if (person.id !== 'u1' || activeJuniorTrainings.length === 0) return person
    const currentProgress = activeJuniorTrainings.map(training => progress[training.id] ?? 0)
    return { ...person, progress: Math.round(currentProgress.reduce((total, value) => total + value, 0) / currentProgress.length) }
  })
}

export const statusForAction = (action) => (action === 'archive' ? 'Archived' : action === 'restore' ? 'Current' : 'Deleted')

export const applyTrainingAction = (trainings, id, action) =>
  trainings.map(t => (t.id === id ? { ...t, status: statusForAction(action) } : t))

export const restoreArchived = (trainings) =>
  trainings.map(t => (t.status === 'Archived' ? { ...t, status: 'Current' } : t))

export const isCompanyEmail = (email) => email.trim().toLowerCase().endsWith('@company.com')

export const lessonFor = (training) => training.lesson || cannedLessons[training.id === 't2' ? 1 : 0]

export const average = (values) => Math.round(values.reduce((a, b) => a + b, 0) / values.length)

export function summarizeStudents(students) {
  return {
    averageProgress: average(students.map(s => s.progress)),
    averageScore: average(students.map(s => s.score)),
    attentionCount: students.filter(s => s.progress < 65 || s.score < 75).length,
  }
}

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`

export function buildStudentCsv(students) {
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
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
}
