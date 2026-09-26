export default function WhatsAppButton({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      title={label}
      className="fixed bottom-24 end-4 z-20 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 lg:bottom-6"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-7" fill="currentColor">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6ZM12 .2A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.7A11.8 11.8 0 1 0 12 .2Z" />
      </svg>
    </a>
  );
}
