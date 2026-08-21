const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Badge({ as: Component = 'span', className = '', children, ...props }) {
  return (
    <Component className={cx(className)} {...props}>
      {children}
    </Component>
  )
}
