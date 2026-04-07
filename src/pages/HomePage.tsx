import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "../components/ui/SectionHeading";
import { EditorialGrid, type EditorialGridItem } from "../components/ui/EditorialGrid";
import { ProductCard } from "../components/ui/ProductCard";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { catalogService } from "../services/storefrontApi";
import type { Category, ProductSummary } from "../types/domain";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<ProductSummary[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      catalogService.listCategories(),
      catalogService.listFeaturedProducts(),
    ])
      .then(([categoryData, featuredData]) => {
        setCategories(categoryData);
        setFeatured(featuredData);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!loaded) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Curating the gallery…" /></div>;
  }

  if (!categories.length || !featured.length) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <ErrorState
          title="The gallery is still being arranged."
          body="Categories or featured pieces are not available yet. Try the full gallery view to keep exploring."
        />
      </div>
    );
  }

  const categoryItems: EditorialGridItem[] = categories.map((category) => ({
    id: category.id,
    title: category.name,
    description: category.description,
    image: category.heroImage,
    href: `/category/${category.slug}`,
  }));

  return (
    <div className="page-fade">
      <section className="relative overflow-hidden px-6 pb-20 pt-10 md:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <p className="eyebrow">The Tactile Gallery</p>
            <h1 className="display-hero max-w-2xl">Silent precision. Collected with intent.</h1>
            <p className="max-w-md text-base leading-8 text-[var(--color-muted)]">
              A storefront built like an editorial exhibition, where each keyboard,
              switch, and finishing piece is framed as an object of daily ritual.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/category/keyboards">
                <Button>Explore keyboards</Button>
              </Link>
              <Link to="/browse">
                <Button variant="secondary">Browse the full gallery</Button>
              </Link>
              <Link to="/search?q=tactile">
                <Button variant="tertiary">Search the gallery</Button>
              </Link>
            </div>
          </div>

          <div className="poster-frame min-h-[420px] rounded-[2rem] lg:min-h-[640px]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI"
              alt="All-white mechanical keyboard resting on a bright editorial desk."
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          kicker="Exhibition / 01"
          title="Browse by collection"
          description="Intentional asymmetry keeps each category feeling curated rather than templated."
        />
        <div className="mt-12">
          <EditorialGrid items={categoryItems} />
        </div>
      </section>

      <section className="bg-[var(--color-surface-low)] py-20">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Manifesto</p>
            <h2 className="mt-4 font-['Manrope'] text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">
              We believe in the weight of things.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--color-muted)]">
              Tactile exists for people who spend long hours in front of digital
              work and still want one object on the desk to feel unmistakably
              physical, intentional, and calm.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-card p-6">
              <p className="eyebrow">Acoustics</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Marbly, soft, and tuned for the kind of rooms where sharp noise is a distraction.
              </p>
            </div>
            <div className="surface-card p-6 md:translate-y-10">
              <p className="eyebrow">Materials</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                Stone-toned finishes, matte PBT, brushed brass, and light-stroke details.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading
          kicker="Exhibition / 02"
          title="Featured objects"
          description="A tighter selection pulled from the current gallery for people who want a fast way in."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link to="/browse">
            <Button variant="secondary">View more curation</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
