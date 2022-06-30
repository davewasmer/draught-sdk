import { id } from '@draught/utils';

export default class MockCollection<
  Document extends { _id: string; createdAt: string; updatedAt: string }
> {
  docs: Document[] = [];

  constructor(public name: string) {}

  filter(fn: (doc: Document) => boolean) {
    return this.docs.filter(fn);
  }

  add(data: Partial<Document>): Document {
    let doc: Document = { ...data } as Document;
    doc._id ??= id(this.name);
    doc.createdAt ??= new Date().toISOString();
    doc.updatedAt ??= new Date().toISOString();
    this.docs.push(doc);
    return doc;
  }
}
