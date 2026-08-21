const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Panel({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={cx(className)} {...props}>
      {children}
    </Component>
  )
}
