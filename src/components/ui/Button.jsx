import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import Spinner from './Spinner'

// เขียนชื่อ class เต็ม ๆ (ห้ามต่อสตริง) เพื่อให้ Tailwind หาเจอตอน build
const VARIANTS = {
  primary: 'btn-primary',
  dark: 'btn-dark',
  secondary: 'btn-secondary',
  success: 'btn-success',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

/**
 * ปุ่มมาตรฐานของระบบ
 * <Button variant="primary|dark|secondary|success|danger|ghost" size="sm|md|lg" icon="plus" loading block to="/path">
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading = false, block = false, to, href, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  const classes = [
    'btn',
    VARIANTS[variant],
    SIZES[size],
    block && 'btn-block',
    !children && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 20
  const content = (
    <>
      {loading ? <Spinner size={iconSize} /> : icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  )
})

export default Button
