export default function searchIncludes(string: string, query: string): boolean {
  return string
    .replace(" ", "")
    .toLowerCase()
    .includes(query.replace(" ", "").toLowerCase());
}
