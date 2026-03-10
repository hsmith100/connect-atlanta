import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import JoinTabBar from './JoinTabBar'

function renderBar(activeTab: 'volunteer' | 'vendor' | 'dj' | 'sponsor', isHeaderVisible = true) {
  const onTabSelect = jest.fn()
  const { container } = render(
    <JoinTabBar activeTab={activeTab} isHeaderVisible={isHeaderVisible} onTabSelect={onTabSelect} />
  )
  return { container, onTabSelect }
}

it('matches snapshot with dj tab active', () => {
  const { container } = renderBar('dj')
  expect(container).toMatchSnapshot()
})

it('matches snapshot with volunteer tab active', () => {
  const { container } = renderBar('volunteer')
  expect(container).toMatchSnapshot()
})

it('calls onTabSelect with the correct tab when a button is clicked', () => {
  const { onTabSelect } = renderBar('dj')
  fireEvent.click(screen.getByRole('button', { name: /volunteer/i }))
  expect(onTabSelect).toHaveBeenCalledWith('volunteer')
})

it('calls onTabSelect with vendor when vendor button is clicked', () => {
  const { onTabSelect } = renderBar('volunteer')
  fireEvent.click(screen.getByRole('button', { name: /vendor/i }))
  expect(onTabSelect).toHaveBeenCalledWith('vendor')
})

it('calls onTabSelect with sponsor when sponsor button is clicked', () => {
  const { onTabSelect } = renderBar('dj')
  fireEvent.click(screen.getByRole('button', { name: /sponsor/i }))
  expect(onTabSelect).toHaveBeenCalledWith('sponsor')
})

it('applies active styles to the active tab only', () => {
  renderBar('vendor')
  const vendorBtn = screen.getByRole('button', { name: /vendor/i })
  const djBtn = screen.getByRole('button', { name: /^dj$/i })
  expect(vendorBtn.className).toContain('border-brand-primary')
  expect(djBtn.className).not.toContain('border-brand-primary')
})
