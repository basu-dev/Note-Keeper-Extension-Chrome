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
  restoreBtn,
  noteCards,
  deleteAllBtn,
  input,
  fileInput,
  closeFileInputBtn,
  count,
  searchBox,
  url;
/*generic functions*/
const select = (sel) => d.querySelector(sel);
const add = (element, eventtype, cb) => element.addEventListener(eventtype, cb);
const css = (element, style) =>
  Object.keys(style).forEach((key) => (element.style[key] = style[key]));
const randomId = (_) => {
  let id = "";
  for (let i = 0; i < 12; i++) {
    id = id.concat(Math.round(Math.random() * 9).toString());
  }
  return id;
};

add(d, "DOMContentLoaded", () => {
  /*Initialize Variables*/
  firstPage = select(".first-page");
  secondPage = select(".second-page");
  firstPageCloseBtn = select("#open-notes");
  secondPageCloseBtn = select("#second-page-close");
  backupBtn = select("#backup");
  deleteAllBtn = select("#delete-all");
  textarea = select("textarea");
  input = select("input");
  noteCards = select(".cards");
  restoreBtn = select("#restore");
  fileInput = select("input[type=file]");
  closeFileInputBtn = select("#close-file-input");
  buttonsDiv = select(".sec-page-btns");
  fileInputDiv = select("#file-input");
  searchBox = select("#search");
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    url = new URL(tabs[0].url).origin;
  });

  /*Adding Event Listners*/
  add(firstPageCloseBtn, "click", (_) => showFirstPage(false));
  add(secondPageCloseBtn, "click", (_) => newNote());
  add(textarea, "keyup", (e) => saveNote());
  add(textarea, "paste", (e) => saveNote());
  add(input, "keyup", (e) => saveNote());
  add(backupBtn, "click", (_) => backupNotes());
  add(restoreBtn, "click", (_) => showFileInputDiv(true));
  add(closeFileInputBtn, "click", (_) => showFileInputDiv(false));
  add(deleteAllBtn, "click", (_) => deleteAllNotes());
  add(fileInput, "change", (e) => getBackupFromFile(e));
  add(searchBox, "keyup", (e) => search(e.target.value));
  /*Tasks Running As Soon As content is loaded*/
  showFirstPage(false);
});
const newNote=()=>{
  textarea.value="";
  textarea.setAttribute('note-id','');
  input.value="";
  showFirstPage(true);
}
const showFileInputDiv = (truth) => {
  if (truth) {
    css(fileInputDiv, { display: "block" });
    css(buttonsDiv, { display: "none" });
    return;
  }
  css(fileInputDiv, { display: "none" });
  fileInput.value = "";
  css(buttonsDiv, { display: "block" });
};
const showFirstPage = (truth) => {
  if (truth) {
    // fillTextarea();
    firstPage.style.display = "grid";
    secondPage.style.display = "none";
  } else {
    notes = getNotes();
    showNotes(notes);
    firstPage.style.display = "none";
    secondPage.style.display = "grid";
  }
};
const saveNote = async () => {
  let body = textarea.value;
  let title = input.value;
  let id = textarea.getAttribute('note-id');
  if(id.trim()==""){
    id=randomId();
    textarea.setAttribute('note-id',id);
  }
  console.log(id);
  let key = `Notes ${id}`;
  if (body.trim() == "" && title.trim() == "") {
    deleteNote(key);
    return
  }
  let data = (await getNote(key)) ? await getNote(key) : {};
  data[key]={title,body,url};
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
const fillTextarea = (id) => {
  let key = `Notes ${id}`;
    chrome.storage.sync.get(key, (data) => {
      console.log(data);
      if (data[key]) {
        textarea.value = data[key].body;
        textarea.setAttribute('note-id',id);
        input.value = data[key].title;
      }
    });
  
};
const getNotes = () => {
  count = 0;
  chrome.storage.sync.get(null, (data) => {
    console.log(data);
    notes = [];
    Object.keys(data).forEach((key) => {
      if (/Notes (.)+/.test(key)) {
        count++;
        let note = {
          id: /Notes (.+)/.exec(key)[1],
          url: data[key].url,
          title: data[key].title,
          body: data[key].body,
        };
        notes.push(note);
      }
    });
    showNotes(notes);
    // fillTextarea();
  });
  return notes;
};
const search = (word) => {
  let reg = new RegExp(word, "i");
  tempNotes = [];
  if (word.trim() != "") {
    notes.forEach(({ url, title, body }) => {
      if (reg.test(url) || reg.test(title) || reg.test(body)) {
        tempNotes.push({ url, title, body });
      }
    });
    showNotes(tempNotes);
  } else {
    showNotes(notes);
  }
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
  const countArea = select("h3 small");
  countArea.innerText = count;
  noteCards.innerHTML = "";
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    let html = htmlParser
      .parseFromString(
        /*html*/ `
              <div class="card">
                  <div class="card-header">${note.url}<span><button note-id="${note.id}">Edit</button> <button id="${note.id}">Del</button></span></div>
                  <div class="card-title">${note.title}</div>
                  <pre class="card-body">${note.body}</pre>
              </div>
          `,
        "text/html"
      )
      .querySelector(".card");
    html.querySelector("button[id]").addEventListener("click", (e) => {
      if (confirm("Do you want to delete  this note?")) {
        deleteNote(`Notes ${e.target.id}`);
      }
    });
    html.querySelector("button[note-id]").addEventListener("click", (e) => {
       fillTextarea(e.target.getAttribute('note-id'));
       showFirstPage(true);
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
  select("[download]").remove();
};
const reader = new FileReader();
const getBackupFromFile = (e) => {
  let file = e.target.files[0];
  if (
    file.type == "application/json" &&
    /^NotesBackup-[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+.json$/.test(
      e.target.files[0].name
    )
  ) {
    reader.readAsText(file, "UTF-8");
    reader.onloadend = (e) => {
      console.log(e.target.result);
      let isValid = true;
      ["url", "title", "body"].forEach((x) => {
        if (!e.target.result.includes(x)) {
          isValid = false;
        }
      });
      if (isValid) {
        if (confirm("Are you sure you want to use this backup?")) {
          notes = JSON.parse(e.target.result);
          if (notes[0].url && notes[0].body && notes[0].title) {
            notes.forEach((note) => {
              const { id,url, body, title } = note;
              let data = {};
              data[`Notes ${id}`] = {url, title, body };
              chrome.storage.sync.set(data);
            });
            showFileInputDiv(false);
            getNotes();
          }
        }
      }
    };
  }
};
