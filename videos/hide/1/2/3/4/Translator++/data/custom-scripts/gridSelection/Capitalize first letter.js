/*
Capitalize first letter of selected text
*/

// Skip if current text is blank
if (!this.text) return;

const gStart = ["〚","〘","〖","【","《","〈","｛","［","〔","（","『","[","{","(","「","[","\"","'","<","("]

if (gStart.includes(this.text[0])) {
    this.setText(this.text[0] + common.capitalizeFirstLetter(this.text.substr(1)));
    return;
}

// use common library to capitalize the first letter
this.setText(common.capitalizeFirstLetter(this.text))