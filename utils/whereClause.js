class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchword = this.bigQ.search
      ? {
          $or: [
            { name: { $regex: this.bigQ.search, $options: "i" } },
            { description: { $regex: this.bigQ.search, $options: "i" } },
            { tags: { $regex: this.bigQ.search, $options: "i" } },
          ],
        }
      : {};

    this.base = this.base.find({ ...searchword });
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    delete copyQ["search"];
    delete copyQ["limit"];
    delete copyQ["page"];

    let stringOfCopyQ = JSON.stringify(copyQ);

    stringOfCopyQ = stringOfCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);

    this.base = this.base.find(jsonOfCopyQ);

    return this;
  }

  pager(resultperPage) {
    let currentPage = 1;

    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }

    this.base = this.base
      .limit(resultperPage)
      .skip(resultperPage * (currentPage - 1));

    return this;
  }
}

module.exports = WhereClause;
