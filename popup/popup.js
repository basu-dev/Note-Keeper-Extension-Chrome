let d = document;
let notes = [];
document.addEventListener('DOMContentLoaded',()=>{
    getNotes();
    let textarea = d.querySelector('textarea');
    let key = "";
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        key = "Notes "+getUrlOrigin(tabs[0].url);
        chrome.storage.sync.get(key,(data)=>{
            if(data[key]){
                textarea.value = data[key];
            }
        })
      });
    textarea.addEventListener('keyup',(e)=>{
        console.log(key);
        console.log(e.target.value);
        let data={};
        data[key]=e.target.value;
        chrome.storage.sync.set(data,(res)=>{
            console.log(res);
        })
    });
});
const getUrlOrigin=(string)=>{
    let url = new URL(string);
    return url.origin;
}  
const getNotes=()=>{
    chrome.storage.sync.get(null,(data)=>{
        Object.keys(data).forEach(key=>{
            let note={
                url:/Notes (.+)/.exec(key)[1],
                note:data[key]
            };
            notes.push(note);
        });
        showNotes(notes);
    });
    return notes;
}
const deleteAllNotes =_=>{
    chrome.storage.sync.get(null,(data)=>{
        Object.keys(data).forEach(key=>deleteNote(key));
    })
}
const deleteNote = (key)=>{
    if(/^Notes .+$/.test(key)){
        chrome.storage.sync.remove(key,(data)=>{
            console.log("deleting",data);
        });
    }
}
const htmlParser = new DOMParser();
const showNotes = (notes)=>{
    let tableBody = d.querySelector('.cards');
    console.log("showing notes",notes[0]);
    console.log(notes.length);
    for(let i = 0; i<notes.length;i++){
        let note = notes[i];
        let html = htmlParser.parseFromString(
            /*html*/`
            <div class="card">
                <div class="card-title">${note.url}<span><button>Del</button></span></div>
                <div class="card-body">${note.note}</div>
            </div>
        `,"text/html");
        html = html.querySelector('.card');
        console.log(html);
        tableBody.appendChild(html);
    }
}