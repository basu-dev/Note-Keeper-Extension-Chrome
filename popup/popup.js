let d = document;
document.addEventListener('DOMContentLoaded',()=>{
    chrome.storage.sync.get(null,(data)=>console.log('data',data));
    let textarea = d.querySelector('textarea');
    let key = "";
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        key = "Notes"+tabs[0].url;
        chrome.storage.sync.get(key,(data)=>{
            console.log(data);
            textarea.value = data[key];
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
})