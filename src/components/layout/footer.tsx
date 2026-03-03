import Image from "next/image"
import Link from "next/link"
import { FaXTwitter } from "react-icons/fa6"
import { SiGitbook, SiTelegram } from "react-icons/si"

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background py-6">
      <div className="container flex items-center justify-between px-4 md:px-6">
        <Link
          href="https://visualisa.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 font-medium text-muted-foreground hover:text-foreground"
        >
          <Image src="/logo-black1.png" alt="vLend" width={24} height={24} />
          <span>vLend</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="https://vlend.visualisa.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Website
          </Link>
          <Link
            href="https://vlend.gitbook.io/vlend-docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <SiGitbook className="h-5 w-5" />
          </Link>
          <Link
            href="https://x.com/visualisaxyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <FaXTwitter className="h-5 w-5" />
          </Link>
          <Link
            href="https://t.me/+DJEsQfpkhPgyZGY0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <SiTelegram className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
