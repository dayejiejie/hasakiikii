import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  return {
    title: `Note ${params.id}`,
  };
}

export default function Page({ params }: PageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Note {params.id}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Sample note content</p>
      </div>
    </div>
  );
} 