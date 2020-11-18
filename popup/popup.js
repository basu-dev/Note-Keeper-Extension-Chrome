(function(d){
  

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
  newNoteBtn,
  url;
/*generic functions*/
const select = (sel) => d.querySelector(sel);
const add = (element, eventtype, cb) => element.addEventListener(eventtype, cb);
const css = (element, style) =>
  Object.keys(style).forEach((key) => (element.style[key] = style[key]))

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
  newNoteBtn = select(".top-right");
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    url = new URL(tabs[0].url).origin;
  });

  /*Adding Event Listners*/
  add(firstPageCloseBtn, "click", (_) => showFirstPage(false));
  add(secondPageCloseBtn, "click", (_) => newNote());
  add(newNoteBtn, "click", (_) => newNote());
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
    loadNotes();
    firstPage.style.display = "none";
    secondPage.style.display = "grid";
  }
};
const saveNote = async () => {
  let body = textarea.value;
  let title = input.value;
  let id = textarea.getAttribute('note-id');
  if(id.trim()==""){
    id=Date.now();
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
    undefined
  });
};
const getNote = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => {
      resolve(data);
    });
  });
};
const fillTextarea = async (id) => {
  let { body, title } = notes.filter((n) => n.id == id)[0];
  textarea.value = body;
  textarea.setAttribute("note-id", id);
  input.value = title;
};
const loadNotes = async ()=>showNotes(await getNotes())
const getNotes = () => {
  return new Promise((resolve)=>{
    count = 0;
    chrome.storage.sync.get(null, (data) => {
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
          notes.unshift(note);
        }
      });
      resolve(notes);
    });
  })
};
const search = (word) => {
  let reg = new RegExp(word, "i");
  tempNotes = [];
  if (word.trim() != "") {
    notes.forEach(({ id,url, title, body }) => {
      if (reg.test(url) || reg.test(title) || reg.test(body)) {
        tempNotes.push({ id,url, title, body });
      }
    });
    showNotes(tempNotes);
  } else {
    showNotes(notes);
  }
};
const deleteNote = (key) => {
  if (/^Notes .+$/.test(key)) {
    chrome.storage.sync.remove(key, (_) => {loadNotes();
    notifier("Note Deleted Successfully!")
    });
  }
};
const deleteAllNotes = (_) => {
  if (confirm("Do You Want To Delete All Notes?")) {
    chrome.storage.sync.get(null, (data) => {
      Object.keys(data).forEach((key) => deleteNote(key));
      loadNotes();
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
                  <div class="card-header"><a href="${note.url}">${note.url}</a><span><small></small><button note-id="${note.id}">Edit</button> <button id="${note.id}"><img src="../assets/delete.svg" ></button></span></div>
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
    let time = getAppropriateTime(parseInt(note.id));
    html.querySelector('small').innerText=time;
    // console.log(time);
    const timeSection=html.querySelector('div');
    noteCards.appendChild(html);
  }
};
const getAppropriateTime=(time)=>{
  const date = new Date(time);
  const diff = Date.now() - time;
  const DAY = 86400000;
  if(diff < DAY && diff> 0) return /([\d]+:[\d]+)/.exec(date.toTimeString())[0]
  else if(diff < 7*DAY){
    const [,day,time]=/([\D]+) \D+ .+ (\d+:\d+)/.exec(date)
    return `${day}, ${time}`;
  }
  else if(diff < 364*DAY){
    const [,day,month]=/([\D]+) ([\D]+ [\d]+)/.exec(date);
    return `${day}, ${month}`
  }
  else {
    const [,month,year]=/[\D]+ ([\D]+ [\d]+) ([\d]+)/.exec(date);
    return `${month}, ${year}`
  }
}
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
let notTimeout;
const notifier=(msg,type)=>{
  const notif = select('.notifier');
  notif.innerText=msg;
  const className='notifier-shown';
  let colorClass='a'
  if(type && type=='danger') colorClass='notifier-danger'
  else if(type && type == 'warn') colorClass='notifier-warn'
  notif.classList.add(colorClass);
  notif.classList.add(className);
  notTimeout=setTimeout(_=>{
    notif.classList.remove(className);
    setTimeout(_=>notif.classList.remove(colorClass));
  },3000)
}
const reader = new FileReader();
const getBackupFromFile = (e) => {
  let file = e.target.files[0];
  if (
    file.type == "application/json" &&
    /^NotesBackup-[\d]+-[\d]+-[\d]+-[\d]+-[\d]+-[\d]+.json$/.test(
      e.target.files[0].name
    )
  ) {
    reader.readAsText(file, "UTF-8");
    reader.onloadend = (e) => {
      console.log(e.target.result);
      let isValid = true;
      ["url", "title", "body","id"].forEach((x) => {
        if (!e.target.result.includes(x)) {
          isValid =false;
        }
      });
      if (isValid) {
        if (confirm("Are you sure you want to use this backup?")) {
          notes = JSON.parse(e.target.result);
          window.notes= notes[0];
          console.log(notes[0].url && notes[0].body && notes[0].title && notes[0].id);
          if (!(!notes[0].url && !notes[0].body && !notes[0].title && !notes[0].id)) {
            notes.forEach((note) => {
              const { id,url, body, title } = note;
              let data = {};
              data[`Notes ${id}`] = {url, title, body };
              chrome.storage.sync.set(data);
              notifier("Notes Restored Successfully!")
            });
            showFileInputDiv(false);
            loadNotes();
          }else{
            notifier("Currupted Invalid File",'warn');
          }
        }
      }else{
        notifier("Invalid File 2",'warn');
      }
    };
  }else{
    notifier("Invalid File",'warn');
  }
};
})(document);