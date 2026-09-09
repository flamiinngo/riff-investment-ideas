import type { Idea } from '@/types';

type PublishResult = { idea: Idea; error?: string };

async function jsonResponse<T>(response: Response) {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? 'Riff could not complete this request.');
  return body;
}

export async function loadPublishedIdeas() {
  const response = await fetch('/api/ideas', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  return jsonResponse<{ ideas: Idea[] }>(response);
}

export async function publishRiffIdea(draft: Idea) {
  const response = await fetch('/api/ideas', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientRequestId: draft.id,
      name: draft.name,
      description: draft.description,
      thesis: draft.thesis,
      allocation: draft.allocation,
      parentIdeaId: draft.parentIdeaId,
    }),
  });
  return (await jsonResponse<PublishResult>(response)).idea;
}
