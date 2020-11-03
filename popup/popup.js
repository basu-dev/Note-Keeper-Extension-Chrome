let d = document;
let notes = [];
let firstPage, secondPage, firstPageCloseBtn, secondPageCloseBtn;
d.addEventListener("DOMContentLoaded", () => {
  firstPage = d.querySelector(".first-page");
  secondPage = d.querySelector(".second-page");
  firstPageCloseBtn = d.querySelector("#open-notes");
  secondPageCloseBtn = d.querySelector("#second-page-close");
  firstPageCloseBtn.addEventListener("click", (_) => showFirstPage(false));
  secondPageCloseBtn.addEventListener("click", (_) => showFirstPage(true));
  let textarea = d.querySelector("textarea");
  let key = "";
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    key = "Notes " + getUrlOrigin(tabs[0].url);
    chrome.storage.sync.get(key, (data) => {
      if (data[key]) {
        textarea.value = data[key];
      }
    });
  });
  textarea.addEventListener("keyup", (e) => {
    let data = {};
    data[key] = e.target.value;
    chrome.storage.sync.set(data, (res) => {
      console.log(res);
    });
  });
});
const getUrlOrigin = (string) => {
  let url = new URL(string);
  return url.origin;
};
const getNotes = () => {
  notes = [];
  chrome.storage.sync.get(null, (data) => {
    Object.keys(data).forEach((key) => {
      let note = {
        url: /Notes (.+)/.exec(key)[1],
        note: data[key],
      };
      notes.push(note);
    });
    showNotes(notes);
  });
  return notes;
};
const deleteAllNotes = (_) => {
  chrome.storage.sync.get(null, (data) => {
    Object.keys(data).forEach((key) => deleteNote(key));
  });
};
const deleteNote = (key) => {
  if (/^Notes .+$/.test(key)) {
    chrome.storage.sync.remove(key, (data) => {
      console.log("deleting", data);
    });
  }
};
const htmlParser = new DOMParser();
const showNotes = (notes) => {
  let noteCards = d.querySelector(".cards");
  noteCards.innerHTML = "";
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    let html = htmlParser
      .parseFromString(
        /*html*/ `
            <div class="card">
                <div class="card-title">${note.url}<button>Del</button></div>
                <div class="card-body">${note.note}</div>
            </div>
        `,
        "text/html"
      )
      .querySelector(".card");
    noteCards.appendChild(html);
  }
};

const showFirstPage = (truth) => {
  if (truth) {
    firstPage.style.display = "grid";
    secondPage.style.display = "none";
  } else {
    let notes = getNotes();
    showNotes(notes);
    firstPage.style.display = "none";
    secondPage.style.display = "grid";
  }
};
