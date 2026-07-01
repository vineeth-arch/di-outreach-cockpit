import { useSearchParams } from 'react-router-dom';

// The prospect drawer is driven by a `?p=<id>` search param so it overlays any page
// (pipeline or follow-ups) and is deep-linkable.
export function useProspectDrawer() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('p');

  function open(id: string) {
    const next = new URLSearchParams(params);
    next.set('p', id);
    setParams(next);
  }
  function close() {
    const next = new URLSearchParams(params);
    next.delete('p');
    setParams(next);
  }
  return { selectedId, open, close };
}
