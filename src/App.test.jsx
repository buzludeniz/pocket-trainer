import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./SolarSystemScene', () => ({ default: () => <div data-testid="scene" /> }))

async function signIn(role) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getAllByRole('button', { name: /enter pocket trainer/i })[0])
  await user.selectOptions(screen.getByLabelText(/your demo role/i), role)
  await user.click(screen.getByRole('button', { name: /continue/i }))
  return user
}

describe('App', () => {
  it('renders the landing screen', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/learn better/i)
    expect(await screen.findByTestId('scene')).toBeInTheDocument()
  })

  it('rejects a non-company email', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getAllByRole('button', { name: /enter pocket trainer/i })[0])
    const email = screen.getByLabelText(/company email/i)
    await user.clear(email)
    await user.type(email, 'bob@gmail.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/use your company email/i)).toBeInTheDocument()
  })

  it('shows junior trainings and persists them to localStorage', async () => {
    await signIn('Junior')
    expect(screen.getByText('HR Essentials')).toBeInTheDocument()
    expect(screen.queryByText('Conflict Resolution')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('pt-trainings'))).toHaveLength(4)
    expect(JSON.parse(localStorage.getItem('pt-progress'))).toEqual({ t1: 78, t2: 54 })
  })

  it('completing a lesson saves 100% progress', async () => {
    const user = await signIn('Junior')
    await user.click(screen.getAllByRole('button', { name: /resume/i })[0])
    await user.click(screen.getByRole('button', { name: /quick check/i }))
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: /^A/ }))
      await user.click(screen.getByRole('button', { name: /next question|finish training/i }))
    }
    expect(screen.getByText(/training complete/i)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('pt-progress')).t1).toBe(100)
  })

  it('senior can archive a training and it is persisted', async () => {
    const user = await signIn('Senior')
    const card = screen.getByRole('heading', { name: 'HR Essentials' }).closest('article')
    await user.click(within(card).getByRole('button', { name: /archive training/i }))
    expect(screen.queryByRole('heading', { name: 'HR Essentials' })).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('pt-trainings'))
    expect(stored.find(t => t.id === 't1').status).toBe('Archived')
  })

  it('department head sees the skill matrix', async () => {
    await signIn('Dept Head')
    expect(screen.getByRole('table', { name: /skill development matrix/i })).toBeInTheDocument()
    expect(screen.getByText(/3 learners tracked/i)).toBeInTheDocument()
  })

  it('restores saved trainings and theme from localStorage', async () => {
    localStorage.setItem('pt-theme', 'dark')
    localStorage.setItem('pt-trainings', JSON.stringify([{ id: 'x1', title: 'Saved One', difficulty: 2, audience: 'Junior', status: 'Current', source: 's.pdf', completion: 10, createdBy: 'me' }]))
    await signIn('Junior')
    expect(screen.getByText('Saved One')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  async function takeQuiz(user, optionPattern) {
    await user.click(screen.getAllByRole('button', { name: /resume/i })[0])
    await user.click(screen.getByRole('button', { name: /quick check/i }))
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: optionPattern }))
      await user.click(screen.getByRole('button', { name: /next question|finish training/i }))
    }
  }

  it('saves each quiz attempt to one storage key', async () => {
    const user = await signIn('Junior')
    await takeQuiz(user, /^B(?!ack)/)
    const history = JSON.parse(localStorage.getItem('pt-quiz-history'))
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ trainingId: 't1', score: 0 })
    expect(Number.isNaN(Date.parse(history[0].date))).toBe(false)
  })

  it('junior progress view lists real quiz results', async () => {
    localStorage.setItem('pt-quiz-history', JSON.stringify([{ trainingId: 't1', score: 50, date: '2026-03-03T12:00:00.000Z' }]))
    const user = await signIn('Junior')
    expect(screen.getByText('From 1 quiz attempt')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /progress/i }))
    const list = screen.getByRole('list', { name: /quiz history/i })
    expect(within(list).getByText('HR Essentials')).toBeInTheDocument()
    expect(within(list).getByText('50%')).toBeInTheDocument()
  })

  it('junior keeps sample data without history', async () => {
    await signIn('Junior')
    expect(screen.getByText('86%')).toBeInTheDocument()
    expect(screen.queryByText(/quiz attempt/i)).not.toBeInTheDocument()
  })

  it('senior follow-up uses real history for the learner who has it', async () => {
    localStorage.setItem('pt-quiz-history', JSON.stringify([{ trainingId: 't1', score: 40, date: 'x' }, { trainingId: 't1', score: 65, date: 'y' }]))
    await signIn('Senior')
    const card = screen.getByRole('heading', { name: 'Aisha Khan' }).closest('article')
    expect(card).toHaveTextContent('65% latest score · 2 quiz attempts')
    const lucas = screen.getByRole('heading', { name: 'Lucas Hart' }).closest('article')
    expect(lucas).toHaveTextContent('70% latest score')
    expect(lucas).not.toHaveTextContent(/quiz attempt/)
  })

  it('survives corrupt quiz history in storage', async () => {
    localStorage.setItem('pt-quiz-history', '{broken')
    await signIn('Senior')
    expect(screen.getByRole('heading', { name: 'Aisha Khan' }).closest('article')).toHaveTextContent('82% latest score')
  })
})
