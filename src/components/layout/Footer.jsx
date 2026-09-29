import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { SHOP } from '../../config/constants'

const ITEM = 'flex min-h-[2.75rem] items-center gap-2 transition hover:text-brand-ink'
const DOT = 'grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white'

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-4 text-sm font-semibold text-gray-700">
        <a href={SHOP.facebook} target="_blank" rel="noopener noreferrer" className={ITEM}>
          <span className={`${DOT} font-bold`} aria-hidden="true">f</span>
          Facebook
        </a>
        <a href={SHOP.tiktok} target="_blank" rel="noopener noreferrer" className={ITEM}>
          <span className={DOT}>
            <Icon name="music" size={16} />
          </span>
          TikTok
        </a>
        <a href={SHOP.line} target="_blank" rel="noopener noreferrer" className={ITEM}>
          <span className={DOT}>
            <Icon name="chat" size={16} />
          </span>
          LINE
        </a>
        <a href="tel:0985329350" className={ITEM}>
          <span className={DOT}>
            <Icon name="phone" size={16} />
          </span>
          098-532-9350
        </a>
        <Link to="/login" className={`${ITEM} ml-auto text-subtle`}>
          <Icon name="lock" size={16} />
          สำหรับพนักงาน
        </Link>
      </div>
      <p className="px-4 pb-4 text-center text-xs text-subtle">
        © {new Date().getFullYear()} TOKYO HOUSE by Itthikon_Dev11
      </p>
    </footer>
  )
}
