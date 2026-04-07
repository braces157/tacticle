import { Link } from "react-router-dom";
import type { ImageAsset } from "../../types/domain";
import { Icon } from "./Icon";

export type EditorialGridItem = {
  id: string;
  title: string;
  description: string;
  image: ImageAsset;
  href: string;
};

export function EditorialGrid({ items }: { items: EditorialGridItem[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-10">
      {items.map((item, index) => (
        <Link
          key={item.id}
          to={item.href}
          className={[
            "stagger-item group block",
            index === 0 ? "md:col-span-6" : "",
            index === 1 ? "md:col-span-4 md:translate-y-16" : "",
            index >= 2 ? "md:col-span-4 md:-translate-y-8" : "",
          ].join(" ")}
        >
          <div className="poster-frame aspect-[4/3] overflow-hidden bg-[var(--color-card)]">
            <img
              src={item.image.src}
              alt={item.image.alt}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.03em]">
                {item.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                {item.description}
              </p>
            </div>
            <Icon
              name="arrow-right"
              className="mt-2 h-5 w-5 shrink-0 text-[var(--color-primary)] transition group-hover:translate-x-1"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
