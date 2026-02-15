export function preprocessQuery(query: string, currentUser: string): string {
  return query.replace(/\{currentUser\}/g, currentUser);
}
