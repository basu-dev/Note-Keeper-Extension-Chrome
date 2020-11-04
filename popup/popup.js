"use strict";
const d = document;
const htmlParser = new DOMParser();
let notes = [];
let firstPage,
  secondPage,
  firstPageCloseBtn,
  secondPageCloseBtn,
  backupBtn,
  textarea,
  noteCards,
  key;
d.addEventListener("DOMContentLoaded", () => {
  /*Initialize Variables*/
  firstPage = d.querySelector(".first-page");
  secondPage = d.querySelector(".second-page");
  firstPageCloseBtn = d.querySelector("#open-notes");
  secondPageCloseBtn = d.querySelector("#second-page-close");
  backupBtn = d.querySelector("#backup");
  textarea = d.querySelector("textarea");
  noteCards = d.querySelector(".cards");
  /*Adding Event Listners*/
  backupBtn.addEventListener("click", (_) => backupNotes());
  firstPageCloseBtn.addEventListener("click", (_) => showFirstPage(false));
  secondPageCloseBtn.addEventListener("click", (_) => showFirstPage(true));
  textarea.addEventListener("keyup", (e) => saveNote(e.target.value));
  /*Tasks Running As Soon As content is loaded*/
  fillTextarea();
});
const saveNote = (string) => {
    if(string.trim() == ''){
        deleteNote(key);
    }
  let data = {};
  data[key] = string;
  chrome.storage.sync.set(data, (res) => {
    console.log(res);
  });
};
const fillTextarea = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    key = "Notes " + new URL(tabs[0].url).origin;
    chrome.storage.sync.get(key, (data) => {
      if (data[key]) {
        textarea.value = data[key];
      }
    });
  });
};
const getNotes = () => {
  chrome.storage.sync.get(null, (data) => {
      notes=[];
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
      console.log("deleting", key);
    });
  }
};
const showNotes = (notes) => {
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
const backupNotes = () => {
  let a = d.createElement("a");
  let dt = new Date();
  a.setAttribute(
    "download",
    `NotesBackup-${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}-${dt.getMinutes()}.json`
  );
  a.href = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(notes)
  )}`;
  a.style.display = "none";
  d.body.append(a);
  console.log(a);
  a.click();
  d.querySelector("[download]").remove();
};
