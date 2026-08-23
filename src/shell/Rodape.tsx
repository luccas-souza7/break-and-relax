import { forwardRef } from 'react'
import { Mail } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Contacts. Shown on the opening and closing screens, never during the game.
 * No call to action, no pitch: just where to find the author.
 */

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

const GitHubIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
    <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58l-.01-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z" />
  </svg>
)

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35ZM12.05 21.7h-.01a9.6 9.6 0 0 1-4.9-1.34l-.35-.21-3.64.95.97-3.55-.23-.36a9.58 9.58 0 0 1-1.47-5.12c0-5.3 4.32-9.6 9.63-9.6a9.57 9.57 0 0 1 9.62 9.61c0 5.3-4.32 9.62-9.62 9.62ZM20.5 3.49A11.94 11.94 0 0 0 12.05 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.26-1.64a11.94 11.94 0 0 0 5.79 1.47h.01c6.58 0 11.94-5.35 11.94-11.93a11.86 11.86 0 0 0-3.5-8.41Z" />
  </svg>
)

type Contact = { label: string; href: string; icon: ReactNode; external: boolean }

const CONTACTS: Contact[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/luccas-souza7/',
    icon: LinkedInIcon,
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/luccas-souza7',
    icon: GitHubIcon,
    external: true,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5511932018859',
    icon: WhatsAppIcon,
    external: true,
  },
  {
    label: 'E-mail',
    href: 'mailto:luccasnsouza1@gmail.com',
    icon: <Mail aria-hidden="true" className="size-4" />,
    external: false,
  },
]

export const Rodape = forwardRef<HTMLElement>(function Rodape(_props, ref) {
  return (
    <footer ref={ref} className="flex flex-col items-center gap-[clamp(4px,1dvh,12px)] text-center">
      <p className="text-xs text-tinta-fraca">Feito por Luccas Souza</p>
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {CONTACTS.map((contact) => (
          <li key={contact.label}>
            <a
              href={contact.href}
              {...(contact.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 text-sm text-tinta-fraca transition-colors hover:text-tinta"
            >
              {contact.icon}
              {contact.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
})
