import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

const ITEM = 'flex min-h-[2.75rem] items-center gap-2 transition hover:text-brand-ink'
const DOT = 'grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white'

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-4 text-sm font-semibold text-gray-700">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={ITEM}>
          <span className={`${DOT} font-bold`} aria-hidden="true">f</span>
          Facebook
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={ITEM}>
          <span className={DOT}>
            <Icon name="music" size={16} />
          </span>
          TikTok
        </a>
        <a href="tel:0985329350" className={ITEM}>
          <span className={DOT}>
            <Icon name="phone" size={16} />
          </span>
          098-532-9350
        </a>
        <span className="text-xs font-normal text-subtle">© {new Date().getFullYear()} TOKYO HOUSE</span>
        <Link to="/login" className={`${ITEM} ml-auto text-subtle`}>
          <Icon name="lock" size={16} />
          สำหรับพนักงาน
        </Link>
      </div>
    </footer>
  )
}
