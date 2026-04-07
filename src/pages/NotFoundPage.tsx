import { EmptyState } from "../components/ui/AsyncState";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <EmptyState
        title="This route is not on display"
        body="The page you were looking for could not be found."
        actionLabel="Return home"
        actionHref="/"
      />
    </div>
  );
}
