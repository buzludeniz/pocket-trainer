import { describe, expect, it, vi } from 'vitest'
import {
  applyTrainingAction, average, buildStudentCsv, cannedLessons, getLearnerRecords, isCompanyEmail,
  lessonFor, loadStored, people, restoreArchived, seedTrainings, skillAreas, statusForAction, summarizeStudents,
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
