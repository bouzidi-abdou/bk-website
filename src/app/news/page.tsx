import { Megaphone } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { trackVisit } from "@/lib/track";
import NewsFeed from "@/components/news-feed";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "الأخبار والإعلانات — BK MARKET",
  description: "آخر أخبار وتحديثات وعروض متجر BK MARKET.",
};

export default async function NewsPage() {
  const session = await getSessionUser();
  const isAdmin = session ? await isAdminUser(session.discordId) : false;
  await trackVisit("/news");

  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pt-44">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_45%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 start-1/2 size-[320px] -translate-x-1/2 rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-[11px] font-black text-neutral-500 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
            <Megaphone className="size-3.5 text-accent" />
            BK MARKET NEWS
          </span>
          <h1 className="mt-5 text-3xl font-black md:text-5xl">
            الأخبار <span className="shine-text font-display">والإعلانات</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            كل جديد في المتجر — تحديثات، عروض حصرية، وإعلانات مهمة. تفاعل معنا
            بإعجابك على المنشورات.
          </p>
        </div>

        <div className="mt-10">
          <NewsFeed isAdmin={isAdmin} />
        </div>
      </div>
    </section>
  );
}
