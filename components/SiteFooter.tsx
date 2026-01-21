// components/SiteFooter.tsx
export default function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-neutral-600">
        <div className="flex flex-wrap justify-center gap-6">
          <a className="hover:underline" href="https://rmt-biph.com/site-guidelines">
            Site Guidelines
          </a>
          <a className="hover:underline" href="https://rmt-biph.com/terms-and-conditions">
            Terms &amp; Conditions
          </a>
          <a className="hover:underline" href="https://rmt-biph.com/privacy-policy">
            Privacy Policy
          </a>
          <a className="hover:underline" href="https://rmt-biph.com/contact">
            Contact Us
          </a>
        </div>

        <div className="mt-4 text-center text-neutral-500">© 2026 Rate My Teacher, BIPH. All Rights Reserved</div>
      </div>
    </footer>
  );
}
