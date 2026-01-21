// components/SiteFooter.tsx
export default function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-neutral-600">
        <div className="flex flex-wrap justify-center gap-6">
          <a className="hover:underline" href="#">
            Help
          </a>
          <a className="hover:underline" href="#">
            Site Guidelines
          </a>
          <a className="hover:underline" href="#">
            Terms &amp; Conditions
          </a>
          <a className="hover:underline" href="#">
            Privacy Policy
          </a>
        </div>

        <div className="mt-4 text-center text-neutral-500">© Rate My Teacher (BIPH internal)</div>
      </div>
    </footer>
  );
}
