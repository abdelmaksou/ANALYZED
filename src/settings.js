var property;
var property_btn;

function save_config() {
    console.log(property.N.elements);   
    var return_data = [];
    for (var i = 0; i < property.N.elements.length  ; i++) {
        let key = property.N.elements[i].id;
        let val = property.N.elements[i].value;
        return_data.push({id: key, value: val })
    }
    console.log(return_data)
}

function update_prefernces() {
    webix.ready(function() {
        property = webix.ui({
            container: "content",
            view:"property", id:"sets",
            autoheight: true,
            autowidth: true,
            elements:[
                { label:"Show hidden files", type:"checkbox", id: "no_hidden"},
                { label:"Scan Empty directories", type:"checkbox", id:"no_empty_dir"},
                { label:"Use apparent size", type:"checkbox", id:"apparent"},
                { label:"Use certain depth in scan", type:"checkbox", id:"depth_f"},
                { label:"Custom depth of scan", type:"text", id:"depth_value"},
                { label:"Exclude certain patterns during scan", type:"checkbox", id:"regex_f"},
                { label:"Pattern to exclude", type:"text", id:"regex_value"},
                { label:"Aggregate files", type:"checkbox", id:"aggr_f"},
                { label:"Upper bound of aggregated file size", type:"text", id:"aggr_value"},
            ]
        });
            //
        document.querySelectorAll("checkbox").forEach(x => x.value = false);
        property_btn = webix.ui({
            container:"content-btns",
            view:"toolbar", 
            autoheight: true,
            rows: [{
                cols:[
                    { gravity:2 },
                    { view:"button", value:"Save Config", click:function(){
                        save_config();
                    }}
                ]
            }]
        });
    });   
}

var data_table;
var data_table_btn;

var table_data = [];

function save_config(){
    console.log("Saving here")
    webix.toCSV($$("d1"), {
        // download: false,
        // href: "./",
        filename: "data"
    });
}

function parse_table_data() {
    Papa.parse("./data.csv", {
        download: true,
        step: function(row) {
            let obj = {alias:row.data[0], cmd:row.data[1]}; 
            table_data.push(obj);
            console.log("Row:", obj);
        },
        complete: function() {
            construct_data_table(table_data);
        }
    });
}

async function construct_data_table(dt) {
    webix.ready(function(){
        data_table = webix.ui({
        container:"content",
        view:"datatable",
        id:"d1",
        columns:[
            { id:"index", header:"#", sort:"int", fillspace: 1 },
            { id: "alias", header:"Command Name", editor:"text", sort:"string", fillspace: 5 },
            { id: "cmd", header:"Command Script", editor:"text", sort:"string", fillspace: 5 },
        ],
        select:"row",
        editable:true,
        editaction:"dblclick",
        autoheight:true,
        data: dt,
        on:{
            "data->onStoreUpdated":function(){
            this.data.each(function(obj, i){
                obj.index = i+1;
            })
            }
        },
        });
        data_table_btn = webix.ui({
        container:"content-btns",
        view:"toolbar", 
        autoheight: true,
        rows: [{cols:[{view:"text", label: "New Command Alias", id: "new-alias"}, {view:"text", label: "New Command script", id: "new-cmd"}]},{
        cols:[
            { gravity:2 },
            { view:"button", value:"Add Command", click:function(){
                var table = $$("d1");
                var ndx = table.getIndexById( table.getSelectedId());
                addAbove(ndx)
            }},
            { view:"button", value:"Remove Selected", click:function(){
            $$("d1").remove($$("d1").getSelectedId());
            }},
            { view:"button", value:"Save Config", click:function(){
                save_config();
            }}
        ]}]
        });
    });
}
    
    
function addAbove(ndx) {
    console.log('index to add new item above: ' + ndx);
    var newId = $$("d1").add({alias: document.querySelectorAll("input")[4].value, cmd: document.querySelectorAll("input")[5].value}, ndx);
    console.log('id of new item above: ' + newId);
    $$("d1").refresh();
}



if (window.addEventListener) {
    window.addEventListener("load", function() {
        document
            .querySelector("#new-config")
            .addEventListener("click", function() {
                if (property != null){
                    property.destructor();
                }
                if (data_table != null){
                    data_table.destructor();
                }
                if (property_btn != null){
                    property_btn.destructor();
                }
                if (data_table_btn != null){
                    data_table_btn.destructor();
                }
                parse_table_data();
            });
        document
            .querySelector("#preferences")
            .addEventListener("click", function() {
                if (property != null){
                    property.destructor();
                }
                if (data_table != null){
                    data_table.destructor();
                }
                if (property_btn != null){
                    property_btn.destructor();
                }
                if (data_table_btn != null){
                    data_table_btn.destructor();
                }
                update_prefernces();
            });

    })
}
