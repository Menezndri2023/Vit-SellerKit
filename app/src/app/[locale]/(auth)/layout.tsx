import LocaleSwitcher from '@/components/LocaleSwitcher';
import Logo from '@/components/Logo';

export default function AuthLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
