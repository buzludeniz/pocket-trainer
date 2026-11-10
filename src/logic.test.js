import { describe, expect, it, vi } from 'vitest'
import {
  applyTrainingAction, average, buildStudentCsv, cannedLessons, getLearnerRecords, isCompanyEmail,
  lessonFor, loadQuizHistory, loadStored, MAX_QUIZ_ATTEMPTS, people, QUIZ_HISTORY_KEY, quizHistoryReducer, sanitizeQuizHistory, scoreQuiz, summarizeQuizHistory, restoreArchived, seedTrainings, skillAreas, statusForAction, summarizeStudents,
} from './logic'

describe('training status', () => {
  it('maps actions to statuses', () => {
    expect(statusForAction('archive')).toBe('Archived')
    expect(statusForAction('restore')).toBe('Current')
    expect(statusForAction('delete')).toBe('Deleted')
  })
  it('only changes the targeted training, without mutating input', () => {
    const next = applyTrainingAction(seedTrainings, 't1', 'archive')
    expect(next.find(t => t.id === 't1').status).toBe('Archived')
    expect(next.filter(t => t.id !== 't1').map(t => t.status)).toEqual(['Current', 'Current', 'Archived'])
    expect(seedTrainings[0].status).toBe('Current')
  })
  it('restoreArchived restores only archived items', () => {
    const next = restoreArchived([{ id: 'a', status: 'Archived' }, { id: 'b', status: 'Deleted' }, { id: 'c', status: 'Draft' }])
    expect(next.map(t => t.status)).toEqual(['Current', 'Deleted', 'Draft'])
  })
})

describe('auth + lessons', () => {
  it('validates company email case-insensitively and trims', () => {
    expect(isCompanyEmail('maria@company.com')).toBe(true)
    expect(isCompanyEmail('  Maria@COMPANY.com ')).toBe(true)
    expect(isCompanyEmail('maria@gmail.com')).toBe(false)
    expect(isCompanyEmail('')).toBe(false)
  })
  it('picks the stored lesson, else a canned one by training id', () => {
    const custom = { title: 'x', questions: [] }
    expect(lessonFor({ id: 't9', lesson: custom })).toBe(custom)
    expect(lessonFor({ id: 't2' })).toBe(cannedLessons[1])
    expect(lessonFor({ id: 't1' })).toBe(cannedLessons[0])
  })
  it('canned lessons have valid quiz answers', () => {
    for (const lesson of cannedLessons) {
      for (const q of lesson.questions) expect(q.options[q.correct]).toBeDefined()
    }
  })
})

describe('progress and scoring', () => {
  it('rounds averages', () => {
    expect(average([78, 54])).toBe(66)
    expect(average([1, 2])).toBe(2)
  })
  it('getLearnerRecords returns only juniors', () => {
    const records = getLearnerRecords(seedTrainings, {})
    expect(records.map(r => r.role)).toEqual(['Junior', 'Junior', 'Junior'])
  })
  it("derives Aisha's progress from current junior trainings", () => {
    const aisha = getLearnerRecords(seedTrainings, { t1: 78, t2: 54 }).find(r => r.id === 'u1')
    expect(aisha.progress).toBe(66)
  })
  it('treats missing progress as 0 and ignores archived trainings', () => {
    const archived = applyTrainingAction(seedTrainings, 't2', 'archive')
    expect(getLearnerRecords(archived, { t1: 40 }).find(r => r.id === 'u1').progress).toBe(40)
    expect(getLearnerRecords(seedTrainings, {}).find(r => r.id === 'u1').progress).toBe(0)
  })
  it('keeps seed progress when there are no active junior trainings', () => {
    const none = seedTrainings.map(t => ({ ...t, status: 'Archived' }))
    expect(getLearnerRecords(none, { t1: 5 }).find(r => r.id === 'u1').progress).toBe(78)
  })
  it('summarizes students and flags those needing attention', () => {
    const s = summarizeStudents([
      { progress: 80, score: 90 }, { progress: 60, score: 90 }, { progress: 90, score: 70 },
    ])
    expect(s).toEqual({ averageProgress: 77, averageScore: 83, attentionCount: 2 })
  })
})

describe('CSV export', () => {
  const students = getLearnerRecords(seedTrainings, { t1: 78, t2: 54 })
  it('has a header, one row per student, CRLF separators', () => {
    const lines = buildStudentCsv(students).split('\r\n')
    expect(lines).toHaveLength(students.length + 1)
    expect(lines[0]).toBe(['Student', 'Email', 'Progress %', 'Latest score %', ...skillAreas.map(s => `${s.label} %`), 'Capabilities achieved', 'Issues faced'].map(h => `"${h}"`).join(','))
    expect(lines[1]).toContain('"Aisha Khan","aisha@company.com","66","82"')
  })
  it('escapes quotes', () => {
    const csv = buildStudentCsv([{ ...people[0], name: 'A "Q" B' }])
    expect(csv).toContain('"A ""Q"" B"')
  })
})

describe('loadStored', () => {
  it('returns parsed value from localStorage', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }))
    expect(loadStored('k', {})).toEqual({ a: 1 })
  })
  it('falls back when missing, null, or corrupt', () => {
    expect(loadStored('missing', 'fb')).toBe('fb')
    localStorage.setItem('bad', '{not json')
    expect(loadStored('bad', 'fb')).toBe('fb')
  })
  it('falls back when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadStored('k', 'fb')).toBe('fb')
    spy.mockRestore()
  })
})

describe('quiz history reducer', () => {
  const rec = (trainingId, score, date = '2026-01-01T00:00:00.000Z') => ({ type: 'record', trainingId, score, date })
  it('appends attempts without mutating state', () => {
    const start = []
    const next = quizHistoryReducer(quizHistoryReducer(start, rec('t1', 80)), rec('t2', 50.4))
    expect(next).toEqual([
      { trainingId: 't1', score: 80, date: '2026-01-01T00:00:00.000Z' },
      { trainingId: 't2', score: 50, date: '2026-01-01T00:00:00.000Z' },
    ])
    expect(start).toEqual([])
  })
  it('ignores invalid attempts and unknown actions', () => {
    const state = [{ trainingId: 't1', score: 90, date: 'd' }]
    expect(quizHistoryReducer(state, rec('', 50))).toBe(state)
    expect(quizHistoryReducer(state, rec('t1', 101))).toBe(state)
    expect(quizHistoryReducer(state, rec('t1', NaN))).toBe(state)
    expect(quizHistoryReducer(state, rec('t1', 50, ''))).toBe(state)
    expect(quizHistoryReducer(state, { type: 'nope' })).toBe(state)
  })
  it('clears and caps history length', () => {
    expect(quizHistoryReducer([{ trainingId: 't1', score: 1, date: 'd' }], { type: 'clear' })).toEqual([])
    let state = []
    for (let i = 0; i < MAX_QUIZ_ATTEMPTS + 5; i++) state = quizHistoryReducer(state, rec('t1', i % 100))
    expect(state).toHaveLength(MAX_QUIZ_ATTEMPTS)
  })
  it('scores answers as a percentage', () => {
    const lesson = { questions: [{ correct: 0 }, { correct: 1 }] }
    expect(scoreQuiz(lesson, [0, 1])).toBe(100)
    expect(scoreQuiz(lesson, [0, 0])).toBe(50)
    expect(scoreQuiz(lesson, [])).toBe(0)
    expect(scoreQuiz({ questions: [] }, [])).toBe(0)
  })
  it('summarizes history', () => {
    expect(summarizeQuizHistory([])).toBeNull()
    expect(summarizeQuizHistory([{ score: 50 }, { score: 100 }])).toEqual({ attempts: 2, latest: 100, average: 75 })
  })
})

describe('quiz history persistence', () => {
  it('round-trips through localStorage', () => {
    const history = [{ trainingId: 't1', score: 88, date: '2026-02-02T00:00:00.000Z' }]
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history))
    expect(loadQuizHistory()).toEqual(history)
  })
  it('falls back to empty on corrupt or malformed storage', () => {
    localStorage.setItem(QUIZ_HISTORY_KEY, '{not json')
    expect(loadQuizHistory()).toEqual([])
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify({ a: 1 }))
    expect(loadQuizHistory()).toEqual([])
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify([null, 5, { trainingId: 't1', score: 'x', date: 'd' }, { trainingId: 't2', score: 70, date: 'd', extra: 1 }]))
    expect(loadQuizHistory()).toEqual([{ trainingId: 't2', score: 70, date: 'd' }])
    expect(sanitizeQuizHistory(undefined)).toEqual([])
  })
})

describe('learner records with quiz history', () => {
  it('keeps sample data when there is no history', () => {
    const [aisha] = getLearnerRecords(seedTrainings, { t1: 78, t2: 54 }, [])
    expect(aisha.score).toBe(82)
    expect(aisha.attempts).toBeUndefined()
  })
  it('uses real history for the demo junior only', () => {
    const history = [{ trainingId: 't1', score: 60, date: 'a' }, { trainingId: 't1', score: 100, date: 'b' }]
    const [aisha, lucas, sam] = getLearnerRecords(seedTrainings, { t1: 78, t2: 54 }, history)
    expect(aisha).toMatchObject({ score: 100, attempts: 2, averageScore: 80 })
    expect(lucas.score).toBe(70)
    expect(sam.score).toBe(94)
  })
  it('applies history even when no junior trainings are current', () => {
    const none = seedTrainings.map(t => ({ ...t, status: 'Archived' }))
    const [aisha] = getLearnerRecords(none, {}, [{ trainingId: 't1', score: 40, date: 'a' }])
    expect(aisha.score).toBe(40)
    expect(aisha.progress).toBe(78)
  })
})
