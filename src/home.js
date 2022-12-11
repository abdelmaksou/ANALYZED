// // ============================================ NESTED PIE CHART ================================================

// function init_code_hierarchy_plot(element_id,data,count_function,color_function,title_function,legend_function)
// {
//     var plot = document.getElementById(element_id);

//     while (plot.hasChildNodes())
//     {
//         plot.removeChild(plot.firstChild);
//     }

//     var height = plot.offsetHeight - 65;
//     var width = plot.offsetWidth - 49;
//     height = Math.min(height, width);
//     width = height;
//     var x_margin = 40;
//     var y_margin = 40;
    
//     //var max_depth=5;
    
//     var data_slices = [];
//     var max_level = 3;

//     var svg = d3.select("#"+element_id).append("svg")
//         .attr("width", width)
//         .attr("height", height)
//         .append("g")
//         .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");
          
//     function process_data(data,level,start_deg,stop_deg)
//     {
//         var name = data[0];
//         var total = count_function(data);
//         var children = data[2];
//         var current_deg = start_deg;
//         if (level > max_level)
//         {
//             return;
//         }
//         if (start_deg == stop_deg)
//         {
//             return;
//         }
//         data_slices.push([start_deg,stop_deg,name,level,data[1]]);
//         for (var key in children)
//         {
//             child = children[key];
//             var inc_deg = (stop_deg-start_deg)/total*count_function(child);
//             var child_start_deg = current_deg;
//             current_deg+=inc_deg;
//             var child_stop_deg = current_deg;
//             var span_deg = child_stop_deg-child_start_deg;
//             process_data(child,level+1,child_start_deg,child_stop_deg);
//         }
//     }
    
//     process_data(data,0,0,360./180.0*Math.PI);

//     var ref = data_slices[0];
//     var next_ref = ref;
//     var last_refs = [];

//     var thickness = width/2.0/(max_level+2)*1.1;
        
//     var arc = d3.svg.arc()
//     .startAngle(function(d) { if(d[3]==0){return d[0];}return d[0]+0.01; })
//     .endAngle(function(d) { if(d[3]==0){return d[1];}return d[1]-0.01; })
//     .innerRadius(function(d) { return 1.1*d[3]*thickness; })
//     .outerRadius(function(d) { return (1.1*d[3]+1)*thickness; });    

//     var slices = svg.selectAll(".form")
//         .data(function(d) { return data_slices; })
//         .enter()
//         .append("g");
//         slices.append("path")
//         .attr("d", arc)
//         .attr("id",function(d,i){return element_id+i;})
//         .style("fill", function(d) { return color_function(d);})
//         .attr("class","form");
//     slices.on("click",animate);

//     if (title_function != undefined)
//     {
//         slices.append("svg:title")
//               .text(title_function);
//     }
//     if (legend_function != undefined)
//     {
//         slices.on("mouseover",update_legend)
//               .on("mouseout",remove_legend);
//         var legend = d3.select("#"+element_id+"_legend")
//         legend.html("<h2>"+data[0]+"&nbsp;</h2><p>"+formatBytes(data[1])+"</p>");
//         legend.transition().duration(200).style("opacity","1");
            
//         function update_legend(d)
//         {
//             legend.html(legend_function(d));
//             legend.transition().duration(200).style("opacity","1");
//         }
        
//         function remove_legend(d)
//         {
//             legend.transition().duration(1000).style("opacity","0");
//             legend.html("<h2>"+data[0]+"&nbsp;</h2><p>"+formatBytes(data[1])+"</p>");
//             legend.transition().duration(200).style("opacity","1");
//         }
//     }
//     function get_start_angle(d,ref)
//     {
//         if (ref)
//         {
//             var ref_span = ref[1]-ref[0];
//             return (d[0]-ref[0])/ref_span*Math.PI*2.0
//         }
//         else
//         {
//             return d[0];
//         }
//     }
    
//     function get_stop_angle(d,ref)
//     {
//         if (ref)
//         {
//             var ref_span = ref[1]-ref[0];
//             return (d[1]-ref[0])/ref_span*Math.PI*2.0
//         }
//         else
//         {
//             return d[0];
//         }
//     }
    
//     function get_level(d,ref)
//     {
//         if (ref)
//         {
//             return d[3]-ref[3];
//         }
//         else
//         {
//             return d[3];
//         }
//     }
    
//     function rebaseTween(new_ref)
//     {
//         return function(d)
//         {
//             var level = d3.interpolate(get_level(d,ref),get_level(d,new_ref));
//             var start_deg = d3.interpolate(get_start_angle(d,ref),get_start_angle(d,new_ref));
//             var stop_deg = d3.interpolate(get_stop_angle(d,ref),get_stop_angle(d,new_ref));
//             var opacity = d3.interpolate(100,0);
//             return function(t)
//             {
//                 return arc([start_deg(t),stop_deg(t),d[2],level(t)]);
//             }
//         }
//     }
    
//     var animating = false;
    
//     function animate(d) {
//         if (animating)
//         {
//             return;
//         }
//         animating = true;
//         var revert = false;
//         var new_ref;
//         if (d == ref && last_refs.length > 0)
//         {
//             revert = true;
//             last_ref = last_refs.pop();
//         }
//         if (revert)
//         {
//             d = last_ref;
//             new_ref = ref;
//             svg.selectAll(".form")
//             .filter(
//                 function (b)
//                 {
//                     if (b[0] >= last_ref[0] && b[1] <= last_ref[1]  && b[3] >= last_ref[3])
//                     {
//                         return true;
//                     }
//                     return false;
//                 }
//             )
//             .transition().duration(1000).style("opacity","1").attr("pointer-events","all");
//         }
//         else
//         {
//             new_ref = d;
//             svg.selectAll(".form")
//             .filter(
//                 function (b)
//                 {
//                     if (b[0] < d[0] || b[1] > d[1] || b[3] < d[3])
//                     {
//                         return true;
//                     }
//                     return false;
//                 }
//             )
//             .transition().duration(1000).style("opacity","0").attr("pointer-events","none");
//         }
//         svg.selectAll(".form")
//         .filter(
//             function (b)
//             {
//                 if (b[0] >= new_ref[0] && b[1] <= new_ref[1] && b[3] >= new_ref[3])
//                 {
//                     return true;
//                 }
//                 return false;
//             }
//         )
//         .transition().duration(1000).attrTween("d",rebaseTween(d));
//         setTimeout(function(){
//             animating = false;
//             if (! revert)
//             {
//                 last_refs.push(ref);
//                 ref = d;
//             }
//             else
//             {
//                 ref = d;
//             }
//             },1000);
//     };    

// }

// function formatBytes(bytes,decimals) {
//     if(bytes == 0) return '0 Bytes';
//     var k = 1024,
//         dm = decimals || 2,
//         sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
//         i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
//  }
 

// function init_plots()
// {
    
//     function count_function(d)
//     {
//         return d[1];
//     }
    
//     function label_function(d)
//     {
//         return d[2]+": "+formatBytes(d[4]);
//     }
    
//     function legend_function(d)
//     {
//         return "<h2>"+d[2]+"&nbsp;</h2><p>"+formatBytes(d[4])+"</p>"
//     }
    
//     var color = d3.scale.category20c();

//     function color_function(d)
//     {
//         return color(d[2]);
//     }
//     d3.select(self.frameElement).style("height", "800px");
//     init_code_hierarchy_plot("code_hierarchy",code_hierarchy_data,count_function,color_function,label_function,legend_function);
// }

// window.onload = init_plots;
// window.onresize = init_plots;

// // ================================================== DATA ======================================================


// let bottom_data;
// let path;
// let code_hierarchy_data;

// async function get_pie() {
//     var json = await invoke("generate_pie", { path: path});
//     code_hierarchy_data = JSON.parse(json);
// }

// window.addEventListener("DOMContentLoaded", () => {
//     bottom_data = input_path = document.querySelector("#bottom-data");
//     // retrieve the path from the start window
//     window.__TAURI__.event.listen('started', (event) => {
//         path = (event.payload.text);
//         get_pie().then(init_plots);
//     });
// });


// ======================================================================================================================

// ========================================== Preparing the Pie Chart ===================================================

const { invoke } = window.__TAURI__.tauri;
var appWindow = window.__TAURI__.window.appWindow;


let svg, root;

const format = d3.format(',d');
const width = 472;
const radius = width / 6;

function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
 }

const arc = d3
  .arc()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) =>
    Math.min((d.x1 - d.x0) / 2, 0.005)
  )
  .padRadius(radius * 1.5)
  .innerRadius((d) => d.y0 * radius)
  .outerRadius((d) =>
    Math.max(d.y0 * radius, d.y1 * radius - 1)
  );

const partition = (data) => {
  const root = d3
    .hierarchy(data)
    .sum((d) => (d.children)? 0 : d.value)
    .sort((a, b) => d3.descending(a.value, b.value));
  return d3
    .partition()
    .size([2 * Math.PI, root.height + 1])(root);
};

const { require } = new observablehq.Library();

function init_pie(data) {

    root = partition(data);
    const color = d3
        .scaleOrdinal()
        .range(d3.schemeSet3);
  
    root.each((d) => (d.current = d));
  
    svg = d3
      .select('#partitionSVG')
      .style('width', '100%')
      .style('height', '100%')
      .style('font', '1vh Source Code Pro');
  
    const g = svg
      .append('g')
      .attr(
        'transform',
        `translate(${width / 2},${width / 2})`
      );
  
    const path = g
      .append('g')
      .attr('pointer-events', 'all')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', (d) => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr('fill-opacity', (d) =>
        arcVisible(d.current)
          ? d.children
            ? 1
            : 0.8
          : 0
      )
      .attr('d', (d) => arc(d.current));
  
    path
      .filter((d) => d.children)
      .style('cursor', 'pointer')
      .on('click', (d) => {
        clicked(d);
        var setTimeoutConst = setTimeout(function(){
          legend.textContent = d.data.name + "\r\n" + formatBytes(d.data.value);
          if(fstree != null) {
            click_this(fstree, d.data.name, d.data.path);
          }
        }, 700);
      });
    
    const path_half = path;
  
    path.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => d.data.name)
          .reverse()
          .join('/')}\n${formatBytes(d.value)}`
    );
  
    const label = g
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .attr('fill', 'black')
      .attr('dy', '0.35em')
      .attr(
        'fill-opacity',
        (d) => +labelVisible(d.current)
      )
      .attr('transform', (d) =>
        labelTransform(d.current)
      )
      .text((d) => (d.data.name.length > 9)? d.data.name.substring(0,7) + ".." : d.data.name);
  
    const parent = g
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', (d) => {
        clicked(d);
        var setTimeoutConst = setTimeout(function(){
          legend.textContent = d.data.name + "\r\n" + formatBytes(d.data.value);
          if(fstree != null) {
            unclick_this(fstree, d.data.name, d.data.path);
          }
        }, 700);
      });
  
    function clicked(p) {

      //console.log(parent);
      parent.datum(p.parent || root);
      //console.log(parent);
  
      root.each(
        (d) =>
          (d.target = {
            x0:
              Math.max(
                0,
                Math.min(
                  1,
                  (d.x0 - p.x0) / (p.x1 - p.x0)
                )
              ) *
              2 *
              Math.PI,
            x1:
              Math.max(
                0,
                Math.min(
                  1,
                  (d.x1 - p.x0) / (p.x1 - p.x0)
                )
              ) *
              2 *
              Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          })
      );
  
      const t = g.transition().duration(750);
  
      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path
        .transition(t)
        .tween('data', (d) => {
          const i = d3.interpolate(
            d.current,
            d.target
          );
          return (t) => (d.current = i(t));
        })
        .filter(function (d) {
          return (
            +this.getAttribute('fill-opacity') ||
            arcVisible(d.target)
          );
        })
        .attr('fill-opacity', (d) =>
          arcVisible(d.target)
            ? d.children
              ? 1
              : 0.8
            : 0
        )
        .attrTween('d', (d) => () =>
          arc(d.current)
        );
  
      label
        .filter(function (d) {
          return (
            +this.getAttribute('fill-opacity') ||
            labelVisible(d.target)
          );
        })
        .transition(t)
        .attr(
          'fill-opacity',
          (d) => +labelVisible(d.target)
        )
        .attrTween('transform', (d) => () =>
          labelTransform(d.current)
        );
    }

    var bottom_data = document.querySelector("#bottom-data");
    var legend = document.querySelector("#code_hierarchy_legend");
    legend.textContent = data.name + "\r\n" + formatBytes(data.value);


    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }
  
    function labelVisible(d) {
      return (
        d.y1 <= 3 &&
        d.y0 >= 1 &&
        (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
      );
    }
  
    function labelTransform(d) {
      const x =
        (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${
        x - 90
      }) translate(${y},0) rotate(${
        x < 180 ? 0 : 180
      })`;
    }
  
  //return [g, path, path_out, parent, root, label];
  //return svg;
}

function arcVisible(d) {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d) {
  return (
    d.y1 <= 3 &&
    d.y0 >= 1 &&
    (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
  );
}

function labelTransform(d) {
  const x =
    (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${
    x - 90
  }) translate(${y},0) rotate(${
    x < 180 ? 0 : 180
  })`;
}

function click_on_pie(p, dur) {

  let parent = svg.selectAll('circle');
  let g = svg.selectAll('g');
  let path = svg.selectAll('path');
  let label = svg.selectAll('text');

  parent.datum(p.parent || root);

  root.each(
    (d) =>
      (d.target = {
        x0:
          Math.max(
            0,
            Math.min(
              1,
              (d.x0 - p.x0) / (p.x1 - p.x0)
            )
          ) *
          2 *
          Math.PI,
        x1:
          Math.max(
            0,
            Math.min(
              1,
              (d.x1 - p.x0) / (p.x1 - p.x0)
            )
          ) *
          2 *
          Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      })
  );

  const t = g.transition().duration(dur);

  // Transition the data on all arcs, even the ones that aren’t visible,
  // so that if this transition is interrupted, entering arcs will start
  // the next transition from the desired position.
  path
    .transition(t)
    .tween('data', (d) => {
      const i = d3.interpolate(
        d.current,
        d.target
      );
      return (t) => (d.current = i(t));
    })
    .filter(function (d) {
      return (
        +this.getAttribute('fill-opacity') ||
        arcVisible(d.target)
      );
    })
    .attr('fill-opacity', (d) =>
      arcVisible(d.target)
        ? d.children
          ? 1
          : 0.8
        : 0
    )
    .attrTween('d', (d) => () =>
      arc(d.current)
    );

  label
    .filter(function (d) {
      return (
        +this.getAttribute('fill-opacity') ||
        labelVisible(d.target)
      );
    })
    .transition(t)
    .attr(
      'fill-opacity',
      (d) => +labelVisible(d.target)
    )
    .attrTween('transform', (d) => () =>
      labelTransform(d.current)
    );
}

function open_this_pie(name, path) {
  let p = svg
          .selectAll('path')
          .filter((d) => d.data.name === name && d.data.path === path);
  p.each((d) => {
    click_on_pie(d, 750);
    var setTimeoutConst = setTimeout(function(){
      document.querySelector("#code_hierarchy_legend").textContent = d.data.name + "\r\n" + formatBytes(d.data.value);
    }, 700);
  });
}

function close_this_pie(name, path) {
  // open to the desired one
  let p = svg
          .selectAll('path')
          .filter((d) => d.data.name === name && d.data.path === path);
  p.each((d) => {
    click_on_pie(d.parent, 750);
  });
}


function edit_for_pie(obj) {
  obj.value = obj.disk_size;
  delete obj.disk_size;
  if(obj.children != null) {
    if (obj.children.length === 0) {
      obj.children = null;
    } else {
      for(let i = 0 ; i < obj.children.length ; i++){
        edit_for_pie(obj.children[i])
      }
    }
  }
}

// ====================================== Preparing the Tree Table View ========================================

const { DateTime } = luxon;
var result, fstree;
let items_sort_dir = null, size_sort_dir = null;
function sort_by_size(data1, data2, prop){
  return data1[prop].length > data2[prop].length ? 1 : -1;
}

function process_size(bytes, si=false, dp=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si 
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

async function modify_data(response) {
  let cur_date = DateTime.fromFormat(response.last_modified, "yyyy-MM-dd hh:mm:ss")
  let diff = DateTime.now().diff(cur_date, 'days').days;
  if (parseInt(diff) == 0) response.last_modified = "Today";
  else if (parseInt(diff) == 1) response.last_modified == "Yesterday";
  else  response.last_modified = parseInt(diff) + ' days ago';
  response.disk_size_processed= process_size(response.disk_size);
  response.num_contained_items_processed = response.num_contained_items + ' items';
  if(response.data != null) {
    for(let i = 0 ; i < response.data.length ; i++){
      await modify_data(response.data[i]);
    }
  } 
}

// function filter_by_name(test, value, obj){ 
//   if (test.toString().toLowerCase().indexOf(value.toLowerCase()) == 0) return true;
//   return false;
// };

async function construct_tree_table(dt) {
  await modify_data(dt)
  var tree_table_data = [dt];
  webix.ready( function(){
    grida = webix.ui({
      container:"tree-table-view",
      view:"treetable",
      id: "fstree",
      headermenu:true,
      scrollX:true,
      columns:[
        { id:"value",	header:["Folder"/*,{content:"textFilter", compare:filter_by_name }*/], template:"{common.treetable()} #value#", fillspace: 5,},
        { id:"disk_size_processed",	header:["Disk Size" ,/*{content:"textFilter", compare:filter_by_name }*/], fillspace: 2, },
        { id:"num_contained_items_processed",	header:["Contents",/*{content:"textFilter", compare:filter_by_name }{content:"textFilter", compare:filter_by_name }*/],	fillspace: 3},
        { id:"last_modified",	header:["Last Modified",/*{content:"textFilter", compare:filter_by_name }*/],	fillspace: 3}
      ],
      data: tree_table_data,
      select:"row"
    })
    contexta = webix.ui({
      view:"contextmenu", id:"cm",
      data: ["Open", "Copy Path", "Delete"],
      master:$$("fstree")   // component object
    });
    contexta.attachEvent("onMenuItemClick",function(id){ // attatch context menu click
      var invoked_row = this.getContext();
      var invoked_menu_item = this.getItem(id);
      console.log(invoked_row)
      var record = grida.getItem(invoked_row.id.row);
      console.log(record)
      if (invoked_menu_item.value == "Open") {
        invoke("open_any", {path: record.path});
      }
      else if (invoked_menu_item == "Copy Path") {
        // Handle the code that copies the path
      }
      else {
        invoke("delete", {path: record.path}).then(get_data().then(init_charts));
      }
      webix.message("You have clicked an item with name " + record.value + " and chosen " + invoked_menu_item.value);
    });
    // grida.attachEvent("onSelectChange", function(id, e, node){
    //   var item = this.getItem(id);
    //   // Do something when clicking a tree item
    //   console.log(item);
    // });
    grida.attachEvent("onAfterOpen", function(id, e, node){
      var item = this.getItem(id);
      // Do something when clicking a tree item
      open_this_pie(item.value, item.path);
      fstree.select(id, false);
    });
    grida.attachEvent("onAfterSelect", function(id, e, node){
      var item = this.getItem(id);
      // creation time styling
      let cur_date = DateTime.fromFormat(item.creation_time, "yyyy-MM-dd hh:mm:ss")
      let diff = DateTime.now().diff(cur_date, 'days').days;
      if (parseInt(diff) == 0) item.creation_time = "Today";
      else if (parseInt(diff) == 1) item.creation_time == "Yesterday";
      else  item.creation_time = parseInt(diff) + ' days ago';
      // last accessed styling
      cur_date = DateTime.fromFormat(item.last_accessed, "yyyy-MM-dd hh:mm:ss")
      diff = DateTime.now().diff(cur_date, 'days').days;
      if (parseInt(diff) == 0) item.last_accessed = "Today";
      else if (parseInt(diff) == 1) item.last_accessed == "Yesterday";
      else  item.last_accessed = parseInt(diff) + ' days ago';

      let bottom_data = document.querySelector("#bottom-data");
      bottom_data.textContent = "name: " + item.value + ", fraction: " + item.fraction + ", last accessed: " + item.last_accessed + ", creation time: " + item.creation_time + ".";
    });
    grida.attachEvent("onAfterClose", function(id, e, node){
      var item = this.getItem(id);
      // Do something when clicking a tree item
      close_this_pie(item.value, item.path);
      fstree.unselect(id);
    });
    grida.attachEvent("onHeaderClick", function(header, event, target){
      if(header.column == "num_contained_items_processed") {
        this.sort({ by: "#num_contained_items#", dir: items_sort_dir, as: "int"});
        if (items_sort_dir == null || items_sort_dir == "asc") items_sort_dir = "desc"
        else items_sort_dir = "asc"
      }
      else if (header.column == "disk_size_processed") {
        this.sort({ by: "#disk_size#", dir: size_sort_dir, as: "int"});
        if (size_sort_dir == null || size_sort_dir == "asc") size_sort_dir = "desc"
        else size_sort_dir = "asc"
      }
    });
  });
  return grida
}

function edit_for_tree(obj) {
  obj.value = obj.name;
  obj.data = obj.children;
  delete obj.name;
  delete obj.children;
  if(obj.data != null) {
    if (obj.data.length === 0) {
      obj.data = null;
    } else {
      for(let i = 0 ; i < obj.data.length ; i++){
        edit_for_tree(obj.data[i])
      }
    }
  }
}

function get_item_by_name(tree, value, path){
  let table = tree.find(function(obj){
    return obj.value.toLowerCase().indexOf(value) != -1;
  });
  //console.log(table);
  let res;
  table.forEach((t) => { if(t.path === path) res = t;})
  return res;
}

function click_this(fstree, value, path) {
  var path_sep = path.split("/");
  var curr_path = "";
  var curr;
  path_sep.forEach((p) => {
    if(p.length != 0) {
      curr_path = curr_path + "/" + p;
      try {
      curr = get_item_by_name(fstree, p, curr_path);
      fstree.open(curr.id);
      } catch (err) {}
    }
  });
  fstree.select(curr.id, false);
}

function unclick_this(fstree, value, path) {
  var curr = get_item_by_name(fstree, value, path);
  // close all the first level folders
  fstree.data.eachChild(curr.id,function(obj){ fstree.close(obj.id)});
  fstree.select(curr.id);
}

if(window.addEventListener) {
  window.addEventListener('resize', function() {
    if(fstree != null){
      fstree.resize();
      //click_on_pie(parent);
      //click_on_pie(g_pie, path_pie, path_out_pie, parent_pie, root_pie, label_pie, "skins", 'd');
      //get_item_by_name(fstree, "skins", "/home/abdelmaksou/Downloads/codebase/types/skins");
      //console.log(serialize(svg));
      //downloadSVGAsPNG(svg);
      //console.log(box);
    }
  }, true);
}

// ======================================== Getting the path and data  =========================================

let data, json, pie_data, tree_data;
let desired_path;
let pie_chart;
//let g_pie, path_pie, path_out_pie, parent_pie, root_pie, label_pie;

async function get_data() {
  json = await invoke("generate_file_system_data", { path: desired_path});
  data = JSON.parse(json);
}

function init_charts() {
  pie_data = JSON.parse(JSON.stringify(data));
  tree_data = JSON.parse(JSON.stringify(data));
  edit_for_pie(pie_data); 
  if (document.getElementById("partitionSVG").innerHTML != "") {
    document.getElementById("partitionSVG").innerHTML = "";
    //console.log("pie deleted");
  }
  pie_chart = init_pie(pie_data); 
  edit_for_tree(tree_data);
  if(fstree != null) {
    fstree.destructor();
    //console.log("tree deleted");
  }
  construct_tree_table(tree_data).then((res) => fstree = res);
}

// ================================================= Navigation ===============================================

// open settings screen
async function open_settings() {
  invoke('open_settings');
}

// =============================================== TAURI INVOKES ==============================================

// open folder and retrieve its path
async function open_folder() {
  await invoke("openf").then((path) => {desired_path = path;} )
}

// ============================================== WINDOW ONLOAD ===============================================

window.addEventListener("DOMContentLoaded", () => {
    bottom_data = document.querySelector("#bottom-data");
    // retrieve the path from the start window
    window.__TAURI__.event.listen('started', (event) => {
        desired_path = (event.payload.text);
        get_data().then(init_charts);
    });
    document
      .querySelector("#config")
      .addEventListener("click", () => { 
        open_settings();
      });
    document
      .querySelector('#svg')
      .addEventListener("click", () => {
        let bottom_data = document.querySelector("#bottom-data");
        try {
          var box = document.getElementById('code_hierarchy');
          svgExport.downloadSvg(
            document.getElementById("partitionSVG"),
            "save",
            {originalWidth: box.offsetWidth - 96, originalHeight: box.offsetHeight - 32}
          );
        } catch(err) {
          bottom_data.textContent = "Error Ocurred while Saving the Chart.";
          bottom_data.style.color = "#BF2626";
          var setTimeoutConst = setTimeout(function(){
            bottom_data.textContent = "";
            bottom_data.style.color = "#000000";
          }, 1200);
        }
      });
      document
        .querySelector('#open_new')
        .addEventListener("click", () => { 
          open_folder().then(() => {get_data().then(init_charts);})
        });
      document
        .querySelector('#search')
        .addEventListener("click", () => { 
          open_folder().then(() => {get_data().then(init_charts);})
        });
      document
        .querySelector('#home')
        .addEventListener("click", () => { 
          desired_path = "/home/";
          get_data().then(init_charts);
      });
      document
        .querySelector('#retry')
        .addEventListener("click", () => { 
          get_data().then(init_charts);
      });
      document
        .querySelector('#close')
        .addEventListener("click", () => { 
          appWindow.close();
      });
      document
        .querySelector("#json")
        .addEventListener("click", () => {
          save({
            filters: [{
              name: 'Text',
              extensions: ['json', 'JSON']
            }]
          }).then(async (path) => { 
            let bottom_data = document.querySelector("#bottom-data");
            writeFile({ contents: json, path: path }, { dir: BaseDirectory.Home });
            var path_sep = path.split("/");
            var extension = path_sep[path_sep.length - 1].split(".")[1];
            if (extension != "json") {
                bottom_data.textContent = "Error Ocurred while Saving the Chart.";
                bottom_data.style.color = "#BF2626";
                var setTimeoutConst = setTimeout(function(){
                    bottom_data.textContent = "";
                    bottom_data.style.color = "#000000";
                }, 1200);
            }
            else {
                bottom_data.textContent = "Tree Data is Saved Successfully.";
                bottom_data.style.color = "#4CC366";
                var setTimeoutConst = setTimeout(function(){
                bottom_data.textContent = "";
                bottom_data.style.color = "#000000";
                }, 1200);
            }
            
        })
      });
});