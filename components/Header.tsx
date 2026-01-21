// components/Header.tsx
import HeyMenu from "@/components/HeyMenu";

export default function Header({
  heyName,
  isAuthed,
  active = "teachers",
  showSearch = true,
  searchAction = "/teachers",
  searchDefaultValue,
}: {
  heyName: string;
  isAuthed: boolean;
  active?: "teachers" | "my_ratings";
  showSearch?: boolean;
  searchAction?: string;
  searchDefaultValue?: string;
}) {
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a
          href="https://rmt-biph.com/"
          className="rounded bg-white px-2 py-1 text-xs font-black tracking-widest text-black"
        >
          RMT
        </a>

        {showSearch ? (
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-sm font-semibold">
              {active === "my_ratings" ? "My Ratings" : "Teachers"}
            </div>

            {active !== "my_ratings" ? (
              <>
                <form action={searchAction} className="relative">
                  <input
                    name="q"
                    defaultValue={searchDefaultValue}
                    placeholder="Teacher name"
                    className="h-9 w-[360px] rounded-full bg-white/10 px-4 text-sm outline-none placeholder:text-white/60 focus:bg-white/15"
                  />
                </form>
                <div className="text-sm text-white/70">at</div>
                <a
                  href="/teachers"
                  className="text-sm font-semibold underline underline-offset-2 decoration-white/40"
                >
                  BIPH
                </a>
              </>
            ) : null}
          </div>
        ) : (
          <div className="text-sm font-semibold">
            {active === "my_ratings" ? "My Ratings" : "Teachers"}
          </div>
        )}

        <div className="ml-auto">
          <HeyMenu heyName={heyName} isAuthed={isAuthed} />
        </div>
      </div>
    </header>
  );
}
