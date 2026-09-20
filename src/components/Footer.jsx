import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-5 text-sm font-semibold">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 transition hover:text-blue-600"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white">
            f
          </span>
          TOKYO HOUSE
        </a>
        <a
          href="https://tiktok.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 transition hover:text-black/60"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white">
            ♪
          </span>
          TOKYO HOUSE
        </a>
        <a
          href="tel:0985329350"
          className="flex items-center gap-2 transition hover:text-green-600"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white">
            ☎
          </span>
          098-5329-350
        </a>
        <Link
          to="/login"
          className="ml-auto text-black/40 transition hover:text-black"
        >
          เข้าสู่ระบบแอดมิน
        </Link>
      </div>
    </footer>
  )
}
