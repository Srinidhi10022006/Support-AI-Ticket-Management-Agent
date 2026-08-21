const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Button({ as: Component = 'button', className = '', children, type = 'button', ...props }) {
  const finalProps = Component === 'button' ? { type, ...props } : props

  return (
    <Component className={cx(className)} {...finalProps}>
      {children}
    </Component>
  )
}
