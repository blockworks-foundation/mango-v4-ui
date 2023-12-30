/**
 * @jest-environment jsdom
 */
import Button from '@components/shared/Button'
import { render, screen } from '@testing-library/react'

test('renders a button with the correct text', () => {
  const btnText = 'Click me'
  render(
    <Button
      onClick={() => null}
      className="flex w-full items-center justify-center"
      size="large"
    >
      {btnText}
    </Button>,
  )
  const button = screen.getByText(btnText)
  expect(button).toBeTruthy()
})
