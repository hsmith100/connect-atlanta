import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { StoreCartProvider, useStoreCart, useCartCount } from './cartContext'

function Probe() {
  const cart = useStoreCart()
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="has-a">{String(cart.has('a'))}</span>
      <button onClick={() => cart.add({ photoId: 'a', collectionId: 'c1', thumbnailUrl: 't-a' })}>add a</button>
      <button onClick={() => cart.add({ photoId: 'b', collectionId: 'c1', thumbnailUrl: 't-b' })}>add b</button>
      <button onClick={() => cart.remove('a')}>remove a</button>
      <button onClick={() => cart.removeMany(['a', 'b'])}>remove many</button>
      <button onClick={() => cart.clear()}>clear</button>
    </div>
  )
}

function renderCart() {
  return render(<StoreCartProvider><Probe /></StoreCartProvider>)
}

beforeEach(() => window.localStorage.clear())
afterEach(() => jest.restoreAllMocks())

it('adds, de-duplicates and removes photos', () => {
  renderCart()
  fireEvent.click(screen.getByText('add a'))
  fireEvent.click(screen.getByText('add a'))
  fireEvent.click(screen.getByText('add b'))
  expect(screen.getByTestId('count')).toHaveTextContent('2')
  expect(screen.getByTestId('has-a')).toHaveTextContent('true')
  fireEvent.click(screen.getByText('remove a'))
  expect(screen.getByTestId('count')).toHaveTextContent('1')
  fireEvent.click(screen.getByText('remove many'))
  expect(screen.getByTestId('count')).toHaveTextContent('0')
})

it('persists to localStorage and restores on the next visit', () => {
  const { unmount } = renderCart()
  fireEvent.click(screen.getByText('add a'))
  expect(JSON.parse(window.localStorage.getItem('bob_photo_cart')!)).toEqual([{ photoId: 'a', collectionId: 'c1', thumbnailUrl: 't-a' }])
  unmount()
  renderCart()
  expect(screen.getByTestId('count')).toHaveTextContent('1')
})

it('ignores corrupt stored data', () => {
  window.localStorage.setItem('bob_photo_cart', '{not json')
  renderCart()
  expect(screen.getByTestId('count')).toHaveTextContent('0')
})

it('still works when storage is unavailable', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  renderCart()
  act(() => { fireEvent.click(screen.getByText('add a')) })
  expect(screen.getByTestId('count')).toHaveTextContent('1')
})

it('clears the cart', () => {
  renderCart()
  fireEvent.click(screen.getByText('add a'))
  fireEvent.click(screen.getByText('clear'))
  expect(screen.getByTestId('count')).toHaveTextContent('0')
})

it('throws a clear error outside the provider', () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  expect(() => render(<Probe />)).toThrow('useStoreCart must be used inside StoreCartProvider')
})

it('useCartCount returns 0 without a provider', () => {
  function Count() { return <span data-testid="c">{useCartCount()}</span> }
  render(<Count />)
  expect(screen.getByTestId('c')).toHaveTextContent('0')
})
