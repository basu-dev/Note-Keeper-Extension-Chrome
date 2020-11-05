const d = document;
("use strict");
const htmlParser = new DOMParser();
let notes = [];
let firstPage,
  secondPage,
  firstPageCloseBtn,
  secondPageCloseBtn,
  backupBtn,
  textarea,
  noteCards,
  deleteAllBtn,
  input,
  fileInput,
  key;
d.addEventListener("DOMContentLoaded", () => {
  /*Initialize Variables*/
  firstPage = d.querySelector(".first-page");
  secondPage = d.querySelector(".second-page");
  firstPageCloseBtn = d.querySelector("#open-notes");
  secondPageCloseBtn = d.querySelector("#second-page-close");
  backupBtn = d.querySelector("#backup");
  deleteAllBtn = d.querySelector("#delete-all");
  textarea = d.querySelector("textarea");
  input = d.querySelector("input");
  noteCards = d.querySelector(".cards");
  fileInput = d.querySelector("input[type=file]");
  /*Adding Event Listners*/
  firstPageCloseBtn.addEventListener("click", (_) => showFirstPage(false));
  secondPageCloseBtn.addEventListener("click", (_) => showFirstPage(true));
  textarea.addEventListener("keyup", (e) => saveNote(e.target.value, "body"));
  textarea.addEventListener("paste", (e) => saveNote(e.target.value, "body"));
  input.addEventListener("keyup", (e) => saveNote(e.target.value, "title"));
  backupBtn.addEventListener("click", (_) => backupNotes());
  deleteAllBtn.addEventListener("click", (_) => deleteAllNotes());
  fileInput.addEventListener("change", (e) => getBackupFromFile(e));
  /*Tasks Running As Soon As content is loaded*/
  // fillTextarea();
  showFirstPage(false);
});
const showFirstPage = (truth) => {
  if (truth) {
    fillTextarea();
    firstPage.style.display = "grid";
    secondPage.style.display = "none";
  } else {
    let notes = getNotes();
    showNotes(notes);
    firstPage.style.display = "none";
    secondPage.style.display = "grid";
  }
};
const saveNote = async (body, which) => {
  if (body.trim() == "") {
    if (input.value.trim() == "" && textarea.value.trim() == "") {
      deleteNote(key);
    }
  }
  let data = (await getNote(key)) ? await getNote(key) : {};
  if (data[key]) {
    data[key] = { ...data[key], [which]: body };
  } else {
    data[key] = {title: "",body: ""};
    data[key][which] = body;
  }
  chrome.storage.sync.set(data, (res) => {
    console.log(`saving ${JSON.stringify(data[key])}`);
  });
};
const getNote = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => {
      resolve(data);
    });
  });
};
const fillTextarea = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    key = "Notes " + new URL(tabs[0].url).origin;
    chrome.storage.sync.get(key, (data) => {
      console.log(data);
      if (data[key]) {
        textarea.value = data[key].body;
        input.value = data[key].title;
      }
    });
  });
};
const getNotes = () => {
  chrome.storage.sync.get(null, (data) => {
    console.log(data);
    notes = [];
    Object.keys(data).forEach((key) => {
      if (/Notes (.)+/.test(key)) {
        let note = {
          url: /Notes (.+)/.exec(key)[1],
          title: data[key].title,
          body: data[key].body,
        };
        notes.push(note);
      }
    });
    showNotes(notes);
  });
  return notes;
};
const deleteNote = (key) => {
  if (/^Notes .+$/.test(key)) {
    chrome.storage.sync.remove(key, (_) => getNotes());
  }
};
const deleteAllNotes = (_) => {
  if (confirm("Do You Want To Delete All Notes?")) {
    chrome.storage.sync.get(null, (data) => {
      Object.keys(data).forEach((key) => deleteNote(key));
      getNotes();
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
                  <div class="card-header">${note.url}<button id="${note.url}">Del</button></div>
                  <div class="card-title">${note.title}</div>
                  <pre class="card-body">${note.body}</pre>
              </div>
          `,
        "text/html"
      )
      .querySelector(".card");
    html.querySelector("button").addEventListener("click", (e) => {
      if (confirm("Do you want to delete  this note?")) {
        deleteNote(`Notes ${e.target.id}`);
      }
    });
    noteCards.appendChild(html);
  }
};
const backupNotes = () => {
  let a = d.createElement("a");
  let dt = new Date();
  a.setAttribute(
    "download",
    `NotesBackup-${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}-${dt.getMinutes()}-${dt.getSeconds()}.json`
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
const reader = new FileReader();
const getBackupFromFile = (e) => {
  let file = e.target.files[0];
  console.log(file.name);
  if (
    file.type == "application/json" &&
    /^NotesBackup-[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+.json$/.test(
      e.target.files[0].name
    )
  ) {
    console.log("valid file name");
    reader.readAsText(file, "UTF-8");
    reader.onloadend = (e) => {
      console.log(e.target.result);
      let isValid=true;
      ["url","title","body"].forEach(x=>{
        if(!e.target.result.includes(x)){
          isValid=false;
        }
      }
        );
      if(isValid){
        console.log("valid");
        notes = JSON.parse(e.target.result);
        if(notes[0].url && notes[0].body && notes[0].title){
          notes.forEach((note) => {
            const { url, body, title } = note;
            let data = {};
            data[`Notes ${url}`] = { title, body };
            chrome.storage.sync.set(data);
          });
          getNotes();
        }
      }
    };
  }
};
