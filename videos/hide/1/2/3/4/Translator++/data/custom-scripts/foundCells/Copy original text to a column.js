const targetColumn = 1;
const overwrite = false;


if (!this.cells[0]) return;


if (this.cells[targetColumn]) {
    if (!overwrite) return;
}

this.cells[targetColumn] = this.cells[0];