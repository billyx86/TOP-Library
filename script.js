let myLibrary = [];

function Book(title, author, pages) {
  this.title = title;
  this.author = author;
  this.pages = pages;
}

function addBookToLibrary() {
  let newTitle = prompt("Enter the title of the book: ");
  let newAuthor = prompt("Enter the author: ");
  let newPages = prompt("Enter the number of pages: ");

  myLibrary.push(new Book(newTitle, newAuthor, newPages));

  console.log(myLibrary);
}

addBookToLibrary();
addBookToLibrary();