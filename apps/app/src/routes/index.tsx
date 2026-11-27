import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => (
    <main className="font-sans">
      <h1>Katinails</h1>
    </main>
  ),
});
