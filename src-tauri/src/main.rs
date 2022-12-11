#[allow(unused)]
use nfd::Response;
use tauri::Manager;
use serde::Serialize;
use std::error::Error;
use std::ffi::OsStr;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::env;
use chrono::{DateTime, Duration, Local};
use run_script::ScriptOptions;
use regex::Regex;
use lazy_static::lazy_static;
use opener::open;
use std::fs::File;
use serde_json::{Number, Value};

pub struct Configurations{
    pub no_hidden: bool,
    pub apparent: bool,
    pub no_empty_dir: bool,
    pub depth: bool,
    pub max_depth: u64,
    pub regex: bool,
    pub re: String,
    pub aggr: bool,
    pub aggr_max: u64
}

#[derive(Serialize)]
pub struct DiskItem {
    pub name: String,
    pub path: String,
    pub depth: u64,
    pub disk_size: u64,
    pub last_accessed: String,
    pub last_modified: String,
    pub creation_time: String,
    pub num_contained_items: u64,
    pub fraction: Option<String>, 
    pub children: Option<Vec<DiskItem>>,
    pub err: Option<String>,
}

#[derive(Serialize)]
pub struct ScriptOut{
    pub code: i32,
    pub output: String,
    pub error: String,
}

impl DiskItem {
    // Get metadata of the specified item
    pub fn calc_meta_data(path:&Path) -> Result<(String, String, String), Box<dyn Error>>{
        let creation_time = DateTime::checked_sub_signed(Local::now(), 
            Duration::seconds(path.metadata()?.created()?.elapsed()?.as_secs() as i64))
            .unwrap().to_string()[..19].to_string();
        let last_accessed = DateTime::checked_sub_signed(Local::now(), 
            Duration::seconds(path.metadata()?.accessed()?.elapsed()?.as_secs() as i64))
                .unwrap().to_string()[..19].to_string();
        let last_modified = DateTime::checked_sub_signed(Local::now(), 
            Duration::seconds(path.metadata()?.modified()?.elapsed()?.as_secs() as i64))
                .unwrap().to_string()[..19].to_string();
        Ok((creation_time, last_accessed, last_modified))
    }

    // Handle the exclusion 
    pub fn exclude(path: &Path, name: &str, configurations: &Configurations)
         -> Result<bool, Box<dyn Error>> {
            if(configurations.regex){
                let re: Regex = Regex::new(&configurations.re.to_string()).unwrap();

                // lazy_static!{
                //     static ref RE: Regex = Regex::new(r"^\.\w*").unwrap();
                // }
                if (re.is_match(name)){
                return Ok(true);
                }
            }

            if(configurations.no_hidden){
                if (name.starts_with(".")){
                return Ok(true);
                }
            }
            
            if(configurations.no_empty_dir){
                if(path.is_file()){
                    return Ok(false);
                }else{
                    let sub = fs::read_dir(path)?.into_iter().count();
                    if(sub == 0){
                    return Ok(true);
                    }
                }
            }
            Ok(false)
    }
    
    pub fn from_analyze(
        path: &Path,
        root_dev: u64,
        configurations: &Configurations,
        own_depth: u64
    ) -> Result<Self, Box<dyn Error>> {
        let name = path
            .file_name()
            .unwrap_or(&OsStr::new("."))
            .to_string_lossy()
            .to_string();

        match DiskItem::exclude(path, &name[..], &configurations){
            Ok(ex) =>{
                if(ex){
                    return Err("excluded".into());
                }
            },
            Err(_) =>{
                return Err("Error".into());
            }
        }

        let last_accessed: String;
        let creation_time: String;
        let last_modified: String;

        // Handle any error 
        match DiskItem::calc_meta_data(&path){
            Ok((a, b, c)) =>{
                creation_time = a;
                last_accessed = b; 
                last_modified = c;
            },
            Err(_) =>{
                last_accessed = String::from("Unknown");
                last_modified = String::from("Unknown");
                creation_time = String::from("Unknown");
            }
        }

        let file_info = FileInfo::from_path(path, configurations.apparent)?;

        match file_info {
            FileInfo::Directory { volume_id } => {
                if volume_id != root_dev {
                    return Err("Filesystem boundary crossed".into());
                }

                // Get first level children
                let sub_entries = fs::read_dir(path)?
                    .filter_map(Result::ok)
                    .collect::<Vec<_>>();

                // Handle the aggregation preference
                let mut children: Vec<DiskItem> = Vec::new();
                let mut aggr_size: u64 = 0;
                if(configurations.aggr){
                    for entry in &sub_entries{
                        if(entry.metadata().is_ok() && entry.metadata().unwrap().is_file()
                            && entry.metadata().unwrap().len() <= configurations.aggr_max){
                            let en = DiskItem::from_analyze(&entry.path(),
                            root_dev, &configurations, own_depth+1)?;
                            aggr_size += en.disk_size;
                            children.push(en);
                        }
                    }
                }
                
                // Recursive call to generate the file-system tree
                let mut sub_items = sub_entries
                .iter().filter(|entry| (entry.metadata().is_ok() && 
                entry.metadata().unwrap().is_dir()) || !configurations.aggr || 
                entry.metadata().unwrap().len() > configurations.aggr_max)
                .filter_map(|entry| {
                    DiskItem::from_analyze(&entry.path(), root_dev, &configurations,
                    own_depth+1).ok()}).collect::<Vec<_>>();
                    
                // Create the pseudo-dir if so
                if(configurations.aggr && aggr_size > 0){
                    sub_items.push(DiskItem{
                         name: ("<aggregated>".to_string()), 
                         path: (path.to_string_lossy().to_string() + "/<aggregated>"), 
                         depth: (own_depth + 1), 
                         disk_size: (aggr_size), 
                         last_accessed: ("".into()), 
                         last_modified: ("".into()), 
                         creation_time: ("".into()), 
                         num_contained_items: (children.iter().count() as u64), 
                         fraction: (None), 
                         children: (Some(children)), 
                         err: (None) });
                }
                    
                sub_items.sort_unstable_by(|a, b| a.disk_size.cmp(&b.disk_size).reverse());
                let x: u64 = sub_items.iter().map(|di| di.num_contained_items).sum();
                let y = sub_items.iter().count() as u64;
                let s: u64 = sub_items.iter().map(|di| di.disk_size).sum();
                Ok(DiskItem {
                    name,
                    path: path.to_string_lossy().to_string(),
                    depth: own_depth,
                    last_accessed,
                    last_modified,
                    creation_time,
                    num_contained_items: x + y,
                    disk_size:  s + 4096,
                    children: Some(sub_items),
                    fraction: None,
                    err: None
                })
            }
            FileInfo::File { size, .. } => Ok(DiskItem {
                name,
                path: path.to_string_lossy().to_string(),
                depth: own_depth,
                last_accessed,
                last_modified,
                creation_time,
                num_contained_items: 0,
                disk_size: size,
                children: None,
                fraction: None,
                err: None
            }),
        }
    }
}

pub enum FileInfo {
    File { size: u64, volume_id: u64 },
    Directory { volume_id: u64 },
}

impl FileInfo {
    pub fn from_path(path: &Path, apparent: bool) -> Result<Self, Box<dyn Error>> {
        use std::os::unix::fs::MetadataExt;

        let md = path.symlink_metadata()?;
        if md.is_dir() {
            Ok(FileInfo::Directory {
                volume_id: md.dev(),
            })
        } else {
            let size = if apparent {
                md.blocks() * 512
            } else {
                md.len()
            };
            Ok(FileInfo::File {
                size,
                volume_id: md.dev(),
            })
        }
    }
}

// Run the given script
impl ScriptOut{
     pub fn run(script: &str) -> ScriptOut{
        let options = ScriptOptions::new();
        let args = vec![];

        // run the script and get the script execution output
        let (code, output, error) = run_script::run(
            script,
            &args,
            &options,
        )
        .unwrap();

        ScriptOut{code, output, error}
    } 
}

// Run the passed script and return the output
pub fn run_script(script: &str) -> String{
    let script_out = ScriptOut::run(script);
    let result = serde_json::to_string(&script_out);
    result.unwrap()
}


// File manipulation
#[tauri::command]
fn delete(path: &str){
    run_script(("rm -rf ".to_string() + path).as_str());
}

pub fn make_dir(path: &str){
    run_script(("mkdir ".to_string() + path).as_str());
}

pub fn rename(old: &str, new: &str){
    run_script(format!("mv -f {} {}/{}", old, &old[..old.rfind("/").unwrap()], new).as_str());
}

#[tauri::command]
fn open_any(path: &str){
    open(path);
}

// Update preferences 
fn update_conf() -> Configurations{
    
    let text = std::fs::read_to_string("../src/config/config.json").unwrap();
    let mut parsed = serde_json::from_str::<Value>(&text).unwrap();
    
    let no_hidden = &parsed["no_hidden"];
    let no_empty_dir = &parsed["no_empty_dir"];
    let apparent = &parsed["apparent"];
    let depth = &parsed["depth_f"];
    let max_depth = &parsed["depth_value"];
    let regex = &parsed["regex_f"];
    let re = &parsed["regex_value"];
    let aggr = &parsed["aggr_f"];
    let aggr_max = &parsed["aggr_value"];

    // let no_hidden = &parsed["no_hidden"];
    // let no_empty_dir = &parsed["no_empty_dir"];
    // let depth = &parsed["depth_f"];
    // let max_depth = &parsed["depth_value"];
    // let regex = &parsed["regex_f"];
    // let re = &parsed["regex_value"];
    // let aggr = &parsed["aggr_f"];
    // let aggr_max = &parsed["aggr_value"];
    // let apparent = &parsed["apparent"];
    
    Configurations{
        no_hidden: no_hidden.as_bool().unwrap_or(false),
        no_empty_dir: no_empty_dir.as_bool().unwrap_or(false),
        depth: depth.as_bool().unwrap_or(false),
        max_depth: max_depth.as_u64().unwrap_or(10),
        regex: regex.as_bool().unwrap_or(false),
        re: re.as_str().unwrap().to_string(),
        aggr: aggr.as_bool().unwrap_or(false),
        aggr_max: aggr_max.as_u64().unwrap_or(1e10 as u64),
        apparent: apparent.as_bool().unwrap_or(false)
        }
}

// Function to calculate the size percentage, level, handle the max_depth preference
fn fraction(item: &mut DiskItem, max_depth: u64, f_depth: bool){
    if(item.depth == max_depth && item.children.as_ref().is_some() && f_depth){
        item.children.as_mut().unwrap().clear();
        return;
    }
    let mut children = &mut item.children;
    if (children.is_some()){
        for mut child in children.iter_mut(){
            for mut c in child.iter_mut(){
                c.fraction = Some(format!("{:.2}", 100.0 * (c.disk_size as f64 / item.disk_size as f64)));
                fraction(&mut c, max_depth, f_depth);
            }
        }
    }
}


fn get_data(dir : &str) -> String {
    // Update the preferences first
    let configurations = update_conf();
    let root = PathBuf::from(dir);
    let file_info: FileInfo;

    // Get initial info about the passed path
    match FileInfo::from_path(&root, configurations.apparent){
        Ok(o)=>{
            file_info = o;
        },
        Err(_) =>{
            return String::from("Error");
        }
    }

    // Make sure that the passed path is a dir
    // Start scanning the file-system
    let mut analysed = match file_info{
        FileInfo::Directory { volume_id } => {
            match DiskItem::from_analyze(&root, volume_id, 
                &configurations, 0){
                Ok(o) => o,
                Err(e) =>{
                    let mssg:String;
                    if (e.to_string() == "Root is excluded".to_string()){
                        mssg = String::from("Root is excluded");
                    }else if (e.to_string() == "Filesystem boundary crossed".to_string()){
                        mssg = String::from("Filesystem boundary crossed");
                    }else{
                        mssg = String::from("");
                    } 
                    DiskItem{ name: ("Error".into()), path: ("".into()), disk_size: (0), 
                    depth: (0), last_accessed: ("".into()), last_modified: ("".into()), 
                    creation_time: ("".into()), num_contained_items: (0), fraction: (None), 
                    children: (None), err: (Some(mssg))}
                }
            }
        },
        _ => {
            DiskItem { name: ("Error".into()), path: ("".into()), depth: (0), 
                disk_size: (0), last_accessed: ("".into()), last_modified: ("".into()), 
                creation_time: ("".into()), num_contained_items: (0), fraction: (None), 
                children: (None), err: (Some(String::from("Target is not a directory!")))}
        }
    };

    // Calculate the size percentage of each item of its parent's size
    analysed.fraction = Some("100.0".into());
    fraction(&mut analysed, configurations.max_depth, configurations.depth);

    // Generate the JSON file
    let serialized = serde_json::to_string_pretty(&analysed);
    return serialized.unwrap();
}

#[tauri::command]
fn generate_file_system_data(path: &str) -> String {
    let json = get_data(path);
    return json;
}

// struct for communication between windows
#[derive(Debug, Clone, Serialize)]
struct Payload {
    text: String,
}

#[tauri::command]
async fn start_to_home(window: tauri::Window, path: String){
  // Close start screen
  if let Some(start) = window.get_window("start") {
    // send path to the home window
    start.emit("started", Payload { text: path}).expect("Could not send");
    // Show home window
    window.get_window("home").unwrap().show().unwrap();
    // wait half second for the screen to be ready
    //std::thread::sleep(std::time::Duration::from_millis(500));
    start.close().unwrap();
  }
}

#[tauri::command]
async fn open_settings(app: tauri::AppHandle){
    let _settings = tauri::WindowBuilder::new(&app, "settings", tauri::WindowUrl::App("settings.html".into()))
        .title("Settings - Analyzed")
        .resizable(false)
        .inner_size(1100.0, 700.0)
        .center()
        //.visible(false)
        .fullscreen(false)
        .build()
        .unwrap();
}

#[tauri::command]
fn openf() -> String {
    let file_path;
    let result = nfd::open_pick_folder(None).unwrap_or(Response::Cancel);

    match result {
        Response::Okay(f) => {file_path = f.clone();},
        Response::Cancel => {file_path = String::from("No Folder is Selected");},
        _ => { file_path =  String::from("Error Selecting a Folder"); },
    }

    return file_path;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![openf, start_to_home, generate_file_system_data, open_settings, open_any, delete])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
