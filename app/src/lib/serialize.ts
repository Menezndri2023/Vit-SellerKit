/** Mongoose lean documents → plain JSON props for Client Components (ObjectId, Date, Buffer → strings). */
export function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
