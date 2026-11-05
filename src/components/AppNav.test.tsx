import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppNav } from './AppNav'

describe('AppNav', () => {
  it('исполнителю показывает «Мои задачи» и «Объекты»', () => {
    render(
      <MemoryRouter>
        <AppNav role="executor" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Мои задачи' })).toHaveAttribute('href', '/my-tasks')
    expect(screen.getByRole('link', { name: 'Объекты' })).toBeInTheDocument()
  })

  it('постановщику не показывает «Мои задачи»', () => {
    render(
      <MemoryRouter>
        <AppNav role="manager" />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: 'Мои задачи' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Объекты' })).toBeInTheDocument()
  })
})
