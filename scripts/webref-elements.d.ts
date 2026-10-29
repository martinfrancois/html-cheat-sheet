// @webref/elements ships no types; this covers the part scripts/sync-spec.ts reads.
declare module "@webref/elements" {
  interface Element {
    name: string;
    href: string;
    interface?: string;
  }
  const webref: { listAll(): Promise<Record<string, { spec: { title: string; url: string }; elements: Element[] }>> };
  export default webref;
}
