const { invoke } = window.__TAURI__.tauri;
var appWindow = window.__TAURI__.window.appWindow;


let input_path;

// open folder and retrieve its path
async function open_folder() {
  var path = await invoke("openf");
  input_path.value = path;
}

// sends the path to the home window and starts it
async function start_to_home() {
  invoke('start_to_home', {path: input_path.value});
}

window.addEventListener("DOMContentLoaded", () => {
  input_path = document.querySelector("#input");
  document
    .querySelector("#search")
    .addEventListener("click", () => open_folder());
  document
    .querySelector("#start")
    .addEventListener("click", () => { 
      start_to_home();
    });
  document
    .querySelector("#home")
    .addEventListener("click", () => { 
      input_path.value = "/home/";
      start_to_home();
    });
});
