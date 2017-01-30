
var root;
var treeDatabkup;
var tree;
var finalCsvArray = [[]];
var nameArr = [];
var parentArr = [];
var roleArr = [];
var milestonesArr = [];
var jarray =[];
var displaySunBurstFlag = 0;
var jsonfileloaded = 0;

              var totalNodes = 0;
               var maxLabelLength = 0;
               // variables for drag/drop
               var selectedNode = null;
               var draggingNode = null;
               // panning variables
               var panSpeed = 200;
               var panBoundary = 20; // Within 20px from edges will pan when dragging.
               // Misc. variables
               var i = 0;
               var duration = 750;
              var viewerWidth =  $(document).width();
               var viewerHeight = $(document).height();


               // **************** SunBurst chart related ***********************************
               var partition = d3.layout.partition()
                    .sort(null)
                    .value(function(d){ return 1; });

                    var radius = Math.min(viewerWidth, viewerHeight) / 2;

                    var color = d3.scale.category20c();

                    var sx = d3.scale.linear()
                        .range([0, 2 * Math.PI]);

                    var sy = d3.scale.sqrt()
                        .range([0, radius]);

                    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, sx(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, sx(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, sy(d.y)); })
        .outerRadius(function(d) { return Math.max(0, sy(d.y + d.dy)); });

        var SunBurstNode;

               // **************** SunBurst chart related ***********************************

               var tooltipdiv = d3.select("body").append("div")
               .attr("class", "tooltip")//add the tooltip class
               .style("position", "absolute")
               .style("z-index", "10")
               .style("visibility", "hidden");

			                  tree = d3.layout.tree()
                   .size([viewerHeight, viewerWidth]);

               // define a d3 diagonal projection for use by the node paths later on.
               var diagonal = d3.svg.diagonal()
                   .projection(function(d) {
                       return [d.y, d.x];
                   });


               function sortTree() {
                // console.log("sort tree called");

                 tree.sort(function(a, b) {
                //   console.log(b.name.toLowerCase());
                //   console.log(a.name.toLowerCase());
                   return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
                 });
               }

			function zoom() {
                // console.log("zoom fn called ");
                 svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
               }

               // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
               var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 2]).on("zoom", zoom);

			                  // define the baseSvg, attaching a class for styling and the zoomListener
               var baseSvg = d3.select("#tree-container").append("svg")
               .attr("width", viewerWidth)
               .attr("height", viewerHeight)
               .attr("class", "overlay")
               .call(zoomListener);

               // Append a group which holds all nodes and which the zoom Listener can act upon.
               var svgGroup = baseSvg.append("g");

loadJsonData();


               // Helper functions for collapsing and expanding nodes.

               function collapse(d) {
                 console.log("collapse fn called ");
                   if (d.children) {
                       d._children = d.children;
                       d._children.forEach(collapse);
                       d.children = null;
                //       console.log(d);
                   }
               }


               function expand(d) {
                 console.log("expand fn called");
                   if (d._children) {
                       d.children = d._children;
                       d.children.forEach(expand);
                       d._children = null;
                   }
               }


                              // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

                              function centerNode(source) {
                                console.log("CenterNode fn called ");
                                console.log(viewerWidth);
                                console.log(viewerHeight);
                                  scale = zoomListener.scale();
                                  x = -source.y0;
                                  y = -source.x0;
                                  x = x * scale + viewerWidth / 2;
                                  y = y * scale + viewerHeight / 2;
                                  console.log(x);
                                  console.log(y);
                                  d3.select('g').transition()
                                      .duration(duration)
                                      .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
                                  zoomListener.scale(scale);
                                  zoomListener.translate([x, y]);
                              }


               // Function to update the temporary connector indicating dragging affiliation
               var updateTempConnector = function() {
                 console.log("update Temp Connector called");
                 console.log(root);
                   var dataTemp = [];
                   if (draggingNode !== null && selectedNode !== null) {
                       // have to flip the source coordinates since we did this for the existing connectors on the original tree
                       dataTemp = [{
                           source: {
                               x: selectedNode.y0,
                               y: selectedNode.x0
                           },
                           target: {
                               x: draggingNode.y0,
                               y: draggingNode.x0
                           }
                       }];
                   }
                   var link = svgGroup.selectAll(".templink").data(dataTemp);

                   link.enter().append("path")
                       .attr("class", "templink")
                       .attr("d", d3.svg.diagonal())
                       .attr('pointer-events', 'none');

                   link.attr("d", d3.svg.diagonal());
                  console.log(link);
                   link.exit().remove();
               };

               // Toggle children on click.
               function toggleChildren(d) {
                 if (d.children) {
                   d._children = d.children;
                   d.children = null;
                 } else if (d._children) {
                   d.children = d._children;
                   d._children = null;
                 }
                 return d;
               }

               function click(d) {
                 if (d3.event.defaultPrevented) return; // click suppressed
                 d = toggleChildren(d);
                 update(d);
                 centerNode(d);
               }

                             function pan(domNode, direction) {
                                console.log(" pan fn called");
                                  var speed = panSpeed;
                                  if (panTimer) {
                                      clearTimeout(panTimer);
                                      translateCoords = d3.transform(svgGroup.attr("transform"));
                                      if (direction == 'left' || direction == 'right') {
                                          translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                                          translateY = translateCoords.translate[1];
                                      } else if (direction == 'up' || direction == 'down') {
                                          translateX = translateCoords.translate[0];
                                          translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
                                      }
                                      scaleX = translateCoords.scale[0];
                                      scaleY = translateCoords.scale[1];
                                      scale = zoomListener.scale();
                                      svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
                                      d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
                                      zoomListener.scale(zoomListener.scale());
                                      zoomListener.translate([translateX, translateY]);
                                      panTimer = setTimeout(function() {
                                          pan(domNode, speed, direction);
                                      }, 50);
                                  }
                              }



                              var overCircle = function(d) {
                                console.log("overCircle");

                                  selectedNode = d;
                                  tooltip.style("visibility", "visible")
                                        .text('SOURCE : ' + d.name );
                                  updateTempConnector();
                              };
                              var outCircle = function(d) {
                                console.log("outCircle");
                                  selectedNode = null;
                                  d3.select(this).select("text.hover").remove();
                                  tooltip.style("visibility", "hidden");
                                  updateTempConnector();
                              };



                                             function initiateDrag(d, domNode) {
                                               console.log("initdrag called ");
                                                 draggingNode = d;
                                                 d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
                                                 d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
                                                 d3.select(domNode).attr('class', 'node activeDrag');

                                                 svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
                                                     if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
                                                     else return -1; // a is the hovered element, bring "a" to the front
                                                 });
                                                 // if nodes has children, remove the links and nodes
                                                 if (nodes.length > 1) {
                                                     // remove link paths
                                                     links = tree.links(nodes);
                                                     nodePaths = svgGroup.selectAll("path.link")
                                                         .data(links, function(d) {
                                                             return d.target.id;
                                                         }).remove();
                                                     // remove child nodes
                                                     nodesExit = svgGroup.selectAll("g.node")
                                                         .data(nodes, function(d) {
                                                             return d.id;
                                                         }).filter(function(d, i) {
                                                             if (d.id == draggingNode.id) {
                                                                 return false;
                                                             }
                                                             return true;
                                                         }).remove();
                                                 }

                                                 // remove parent link
                                                 parentLink = tree.links(tree.nodes(draggingNode.parent));
                                                 svgGroup.selectAll('path.link').filter(function(d, i) {
                                                     if (d.target.id == draggingNode.id) {
                                                         return true;
                                                     }
                                                     return false;
                                                 }).remove();

                                                 dragStarted = null;
                                             }

                                             // Define the drag listeners for drag/drop behaviour of nodes.
                                             dragListener = d3.behavior.drag()
                                                 .on("dragstart", function(d) {
                                                     if (d == root) {
                                                         return;
                                                     }
                                                     dragStarted = true;
                                                     nodes = tree.nodes(d);
                                                     d3.event.sourceEvent.stopPropagation();
                                                     // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
                                                 })
                                                 .on("drag", function(d) {
                                                     if (d == root) {
                                                         return;
                                                     }
                                                     if (dragStarted) {
                                                         domNode = this;
                                                         initiateDrag(d, domNode);
                                                     }

                                                     // get coords of mouseEvent relative to svg container to allow for panning
                                                     relCoords = d3.mouse($('svg').get(0));
                                                     if (relCoords[0] < panBoundary) {
                                                         panTimer = true;
                                                         pan(this, 'left');
                                                     } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                                                         panTimer = true;
                                                         pan(this, 'right');
                                                     } else if (relCoords[1] < panBoundary) {
                                                         panTimer = true;
                                                         pan(this, 'up');
                                                     } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                                                         panTimer = true;
                                                         pan(this, 'down');
                                                     } else {
                                                         try {
                                                             clearTimeout(panTimer);
                                                         } catch (e) {

                                                         }
                                                     }

                                                     d.x0 += d3.event.dy;
                                                     d.y0 += d3.event.dx;
                                                     var node = d3.select(this);
                                                     node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
                                                     updateTempConnector();
                                                 }).on("dragend", function(d) {
                                                     if (d == root) {
                                                         return;
                                                     }
                                                     domNode = this;
                                                     if (selectedNode) {
                                                         // now remove the element from the parent, and insert it into the new elements children
                                                         var index = draggingNode.parent.children.indexOf(draggingNode);
                                                         if (index > -1) {
                                                             draggingNode.parent.children.splice(index, 1);
                                                         }
                                                         if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                                                             if (typeof selectedNode.children !== 'undefined') {
                                                                 selectedNode.children.push(draggingNode);
                                                             } else {
                                                                 selectedNode._children.push(draggingNode);
                                                             }
                                                         } else {
                                                             selectedNode.children = [];
                                                             selectedNode.children.push(draggingNode);
                                                         }
                                                         // Make sure that the node being added to is expanded so user can see added node is correctly moved
                                                         expand(selectedNode);
                                                         sortTree();
                                                         endDrag();
                                                     } else {
                                                         endDrag();
                                                     }
                                                 });

                                             function endDrag() {
                                                 selectedNode = null;
                                                 d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
                                                 d3.select(domNode).attr('class', 'node');
                                                 // now restore the mouseover event or we won't be able to drag a 2nd time
                                                 d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
                                                 updateTempConnector();
                                                 if (draggingNode !== null) {
                                                     update(root);
                                                     centerNode(draggingNode);
                                                     draggingNode = null;
                                                 }
                                             }

/*
               function click(d) {
                 if (d.children) {
                   d._children = d.children;
                   d.children = null;
                 } else {
                   d.children = d._children;
                   d._children = null;
                 }
                 console.log("click fn called ");

                   update(d);
               }
*/

               function update(source) {
                 console.log(" updaye fn called ");
                   // Compute the new height, function counts total children of root node and sets tree height accordingly.
                   // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
                   // This makes the layout more consistent.

                   var levelWidth = [1];
                   var childCount = function(level, n) {
                    console.log(n);
                     if ( level == 0) {
                       var child = n.children;
                     }
                     else {
                       var child = n.children;
                     }

                       if (child && child.length > 0) {
                           if (levelWidth.length <= level + 1) levelWidth.push(0);

                           levelWidth[level + 1] += child.length;
                           child.forEach(function(d) {
                               childCount(level + 1, d);
                           });
                       }
                   };
                   childCount(0, root);
                   console.log("child level width");
                   console.log(levelWidth);
                   var newHeight = d3.max(levelWidth) * 30; // 25 pixels per line
                   tree = tree.size([newHeight, viewerWidth]);
                  console.log("tree");
                  console.log(tree);
                   // Compute the new tree layout.
                   var nodes = tree.nodes(root).reverse();
                   //links = d3.layout.tree().size([newHeight, viewerWidth]).links(nodes);
                       links = tree.links(nodes);
                       console.log(nodes);
                       console.log(links);

                   // Set widths between levels based on maxLabelLength.
                   nodes.forEach(function(d) {
                       d.y = (d.depth * (maxLabelLength * 200)); //maxLabelLength * 10px
                       // alternatively to keep a fixed scale one can set a fixed depth per level
                       // Normalize for fixed-depth by commenting out below line
                       // d.y = (d.depth * 500); //500px per level.
                   });

                   // Update the nodes�
                  //console.log("about to call select all nodes ");
                   node = svgGroup.selectAll("g.node")
                       .data(nodes, function(d) {
                         console.log("select all nodes");
                         console.log(d);
                           return d.id || (d.id = ++i);
                       });

                   // Enter any new nodes at the parent's previous position.
                   var nodeEnter = node.enter().append("g")
                       .call(dragListener)
                       .attr("class", "node")
                       .attr("transform", function(d) {
                           return "translate(" + source.y0 + "," + source.x0 + ")";
                       })
                       .on('click', click)
                       .attr('pointer-events', 'mouseover')
                       .on("mouseover", function(d) {
                         var xPosition = d3.event.pageX + 5;
                         var yPosition = d3.event.pageY + 5;
                         var yourImagePath = "https://ganapathyrajalingam.github.io/ftteamstructure/Novation.jpg";
                         var string = "<img src= " +  yourImagePath  + " height='100' width='100' />";

                         d3.select("#tooltip")
                           .style("left", xPosition + "px")
                           .style("top", yPosition + "px");
                         d3.select("#tooltip #heading")
                           .text("Name : " + d.name);
                           //.html('<a href= "http://google.com">' + d.name + "</a>" + "<br/");
                         d3.select("#tooltip #milestones")
                           .text("MileStones : " + d.milestones);
                           d3.select("#tooltip #role")
                             .text("Role : " + d.role);
                         d3.select("#tooltip #profile")
                           //.text("£" + d.type );
                           .html ( string)
                           .style("left", (d3.event.pageX + 10) + "px")
                           .style("top", (d3.event.pageY + 50) + "px")
                           .style("font-color", "white");
                         d3.select("#tooltip").classed("hidden", false);

                       })
                       .on("mouseout", function(d) {
                         console.log("outcircle");
                         d3.select("#tooltip").classed("hidden", true);
                       });

                   nodeEnter.append("circle")  // change dis to path and handle the circle reference everywhere .. then diferent shapes will be enabled
                       .attr('class', 'nodeCircle')    // based on the d.shape and d3.svg.symbol
                       .attr("r", 0)
					   .attr("d", d3.svg.symbol()
								.size(200)
								.type(function(d) {  return d.shape;}))
					   .style("stroke", function(d) { return d.type; })
                       .style("fill", function(d) {
                         console.log("node circle");
						 //console.log(d.shape);
                         console.log(d);
                           return d._children ? "lightsteelblue" : "blue";
                       });

                   nodeEnter.append("text")
                       .attr("x", function(d) {
                           return d.children || d._children ? -10 : 10;
                       })
                       .attr("dy", ".35em")
                       .attr('class', 'nodeText')
                       .attr("text-anchor", function(d) {
                           return d.children || d._children ? "end" : "start";
                       })
                       .text(function(d) {
                           return d.name;
                       })
                       .style("fill-opacity", 0);

                   // phantom node to give us mouseover in a radius around it
                   nodeEnter.append("circle")
                       .attr('class', 'ghostCircle')
                       .attr("r", 10)
                       .attr("opacity", 0.2) // change this to zero to hide the target area
                   .style("fill", "red")
                       .attr('pointer-events', 'mouseover')
                       .on("mouseover", function(node) {
                           overCircle(node);
                       })
                       .on("mouseout", function(node) {
                           outCircle(node);
                       })
                          ;

                   // Update the text to reflect whether node has children or not.
                   node.select('text')
                       .attr("x", function(d) {
                           return d.children || d._children ? -10 : 10;
                       })
                       .attr("text-anchor", function(d) {
                           return d.children || d._children ? "end" : "start";
                       })
                       .text(function(d) {
                           return d.name;
                       });

                   // Change the circle fill depending on whether it has children and is collapsed
                   node.select("circle.nodeCircle")
                       .attr("r", 4.5)
                       .style("fill", function(d) {
                           return d._children ? "lightsteelblue" : "#fff";
                       });

                   // Transition nodes to their new position.
                   var nodeUpdate = node.transition()
                       .duration(duration)
                       .attr("transform", function(d) {
                           return "translate(" + d.y + "," + d.x + ")";
                       });

                   // Fade the text in
                   nodeUpdate.select("text")
                       .style("fill-opacity", 1);

                   // Transition exiting nodes to the parent's new position.
                   var nodeExit = node.exit().transition()
                       .duration(duration)
                       .attr("transform", function(d) {
                           return "translate(" + source.y + "," + source.x + ")";
                       })
                       .remove();

                   nodeExit.select("circle")
                       .attr("r", 0);

                   nodeExit.select("text")
                       .style("fill-opacity", 0);

                   // Update the links�
                   var link = svgGroup.selectAll("path.link")
                       .data(links, function(d) {
                          console.log("updating links");
                          console.log(d.target_id);
                           return d.target.id;
                       });

                   // Enter any new links at the parent's previous position.
                   link.enter().insert("path", "g")
                       .attr("class", "link")
                       .style("stroke", function(d) { return d.target.type; })
                       .attr("d", function(d) {
                           var o = {
                               x: source.x0,
                               y: source.y0
                           };
                           return diagonal({
                               source: o,
                               target: o
                           });
                       });

                   // Transition links to their new position.
                   link.transition()
                       .duration(duration)
                       .attr("d", diagonal);

                   // Transition exiting nodes to the parent's new position.
                   link.exit().transition()
                       .duration(duration)
                       .attr("d", function(d) {
                           var o = {
                               x: source.x,
                               y: source.y
                           };
                           return diagonal({
                               source: o,
                               target: o
                           });
                       })
                       .remove();

                   // Stash the old positions for transition.
                   nodes.forEach(function(d) {
                       d.x0 = d.x;
                       d.y0 = d.y;
                   });
               }



function loadJsonData(){
// load the external data
    if ( jsonfileloaded == 0 ){
d3.json("https://ganapathyrajalingam.github.io/ftteamstructure/team.json", function(error, treeData1) {
  treeDatabkup = treeData1;
  console.log( treeDatabkup.teamListDetails[0]);
  console.log(error);
  makeChart(treeDatabkup.teamListDetails[0]);
  //  makeSunBurstChart(treeDatabkup.teamListDetails[0]);  
    jsonfileloaded = 1;
  
});
    } else {
        console.log(" json file already loaded so use the root in memory");
        makeSunBurstChart(treeDatabkup.teamListDetails[0]);      
    }
}


function makeChart(treeData) {

    console.log(" read team.json ")

        console.log('mycollapsibletree makechart called ');

                      // Calculate total nodes, max label length

               //var treeData = this.data;
				console.log(treeData);

			   //treeData = JSON.parse(treeData);

               root = treeData;
				console.log(root);
               var margin = {top: 5, right: 20, bottom: 5, left: 20};
            //       viewerWidth = 960 - margin.right - margin.left,
            //       viewerHeight = 800 - margin.top - margin.bottom;
               // size of the diagram

          /*
                   var svg = d3.select("#tree-container").append("svg")
                       .attr("width", viewerWidth )
                       .attr("height", viewerHeight )
                       .attr("class", "overlay")
                     .append("g")
                       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
*/
               // A recursive helper function for performing some setup by walking through all nodes

               function visit(parent, visitFn, childrenFn) {
                 console.log("visit master fn called");
                 console.log(parent);
                   if (!parent) return;

                   var vfntest = visitFn(parent);
                   if ( vfntest) {
                     console.log(" visit fn called ");
                     console.log(totalNodes);
                     if ( totalNodes == 1 ){
                       console.log("totalnodes = 0");
                     console.log( vfntest.name); }
                     else {
                       console.log( vfntest.name);
                     }
                   }

                   var children = childrenFn(parent);
                   if (children) {
                     if ( totalNodes ==1 ) {
                       var count = children.length;
                       console.log(count);
                       for (var i = 0; i < count; i++)
                       {
                          console.log(" inside for loop");
                           visit(children[i], visitFn, childrenFn);
                       }
                     } else {
                       var count = children.length;
                       console.log(count);
                       for (var i = 0; i < count; i++)
                       {
                          console.log(" inside for loop");
                           visit(children[i], visitFn, childrenFn);
                       }
                     }
                   }
               }

               // Call visit function to establish maxLabelLength
               visit(treeData, function(d) {
                  console.log("visit fn to chk maxLabelLength called");
                  console.log(totalNodes);
                  if ( totalNodes == 0 ) {
                    console.log("totalnodes = 0");
                  console.log(d.length);
                   totalNodes++;
                   maxLabelLength = Math.max(d.length, maxLabelLength);
                   return d;
                 } else
                 {
                    if ( d.children )
                    {
                   console.log(d.children.length);
                    totalNodes++;
                    maxLabelLength = Math.max(d.children.length, maxLabelLength);
                    return d;
                  }
                  else {
                    console.log("leaf node");
                     totalNodes++;
                     maxLabelLength = 1;
                     return d;
                  }
                 }
                  //maxLabelLength = 4;
                  return d;
               },
               function(d) {
                 console.log("children fn called ");
                 console.log(d);
                 if ( totalNodes == 1 ) {
                   return d.children && d.children.length > 0 ? d.children : null;
                 } else {

                   return d.children && d.children.length > 0 ? d.children : null;

                 }
               });

               // Sort the tree initially incase the JSON isn't in a sorted order.
               sortTree();

               // Define the root
               root = treeData;
               root.x0 = viewerHeight / 3;

               root.y0 = 10;

               // Layout the tree initially and center on the root node.
               update(root);
               centerNode(root);

};

function addNode(){
	console.log( " AddNode called ");
	var nodeVal = document.getElementById("nodeName").value;
	console.log(nodeVal);
	var parentNode = document.getElementById("parentNode").value;
	console.log(parentNode);
	console.log(tree);

	var currentNode = tree.nodes(parentNode);
	console.log(currentNode);
	var temp = d3.select(currentNode);
	console.log(temp);

	  // Add a new datum to a random parent.
  var newData = {name: nodeVal};

  root.children.push(newData);
  updateTempConnector();
  console.log("root");
  console.log(root);
  console.log("treeDatabkup");
  console.log(treeDatabkup);

  //if (parent.children) parent.children.push(d); else parent.children = [d];
  update(root);
  //root.push(d);
}

// Try this for loading CSV and converting to JSON
// https://github.com/Keyang/node-csvtojson#menu

//var csv is the CSV file with headers
function csvJSON(csv){
  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(",");

  for(var i=1;i<lines.length;i++){
	  var obj = {};
	  var currentline=lines[i].split(",");
	  for(var j=0;j<headers.length;j++){
		  obj[headers[j]] = currentline[j];
	  }
	  result.push(obj);
  }

  //return result; //JavaScript object
  return JSON.stringify(result); //JSON
}

function downloadCsv() {
//            console.log(root);
            var data = root;
            console.log(data);
            var csvContent = "data:text/csv;charset=utf-8,";
            var csvArray = [];

            var parentStr;
            var currObj = data;
            var i=0;
            var k=0;
            var x=0;
            var y=0;
                for (var key in data) {
                  if( k==0){  // remove this condn to handle multiple fields in the object apart from "NAME"
//                  console.log(key);
//                  console.log(data.hasOwnProperty(key));
                  if (data.hasOwnProperty(key)) {
                      //csvArray[i] = (data[key]);
                      nameArr.push("ChildNodes");
                      parentArr.push("ParentNodes");
                      roleArr.push("Role");
                      milestonesArr.push("MileStones");
                      parentStr = "";
                      x=0;
                     csvContent = recursivefnforTreetoArray(data, key, csvArray,csvContent, nameArr, parentArr, parentStr, x,roleArr, milestonesArr );
                  }
                  //csvContent += "\n";
                  csvContent += nameArr.join(",");
                  csvContent +=  ",\r\n,";
                  csvContent += parentArr.join(",");
                  csvContent +=  ",\r\n,";
                  console.log("csvContent");
                  console.log(csvContent);
                  console.log("node ");
                  console.log(nameArr);
                  console.log("Parent Arr");
                  console.log(parentArr);
                  i++;
                }
                k++;
                }


            csvContent += nameArr.join(",");
            csvContent +=  ",\r\n,";
            csvContent += parentArr.join(",");
            csvContent +=  ",\r\n,";

            //var encodedUri = encodeURI(csvContent);
            //var link = document.createElement("a");
            //link.setAttribute("href", encodedUri);
            //link.setAttribute("download", "team.csv");

            //link.click();
        }

function recursivefnforTreetoArray(data, key, csvArray, csvContent, nameArr, parentArr, parentStr, x, roleArr, milestonesArr) {
        var newArray = 0;
//        console.log("recursivefnforTreetoArray called");
//        console.log(data);
//        console.log(key);
//        console.log(data[key]);
console.log(data["role"]);
        csvArray.push(data[key]);
        nameArr.push(data[key]);
        parentArr.push(parentStr);
        roleArr.push(data["role"]);
        milestonesArr.push(data["milestones"]);
        //finalCsvArray[x].push(data[key]);
        console.log("post unshift ie prefixing ");
//        console.log(data.children);
        x++;

        for(var index=0;index<data.children.length;index++){
          var currObj = data.children[index];

          var elementArray = data.children[index][key];
//          console.log(elementArray);
          csvArray.push(elementArray);
          nameArr.push(elementArray);
          parentArr.push(data[key]);
          roleArr.push(data.children[index]["role"]);
          milestonesArr.push(data.children[index]["milestones"]);

          //finalCsvArray[x].push(data[key]);

          console.log(csvArray.join(","));
          if ( currObj.children){
            var len = currObj.children.length;
            var i = 0;
            x++;
            for ( var i=0; i < len; i++){
              console.log("calling iteratively for the child");
//              console.log(index);
//              console.log(currObj.children);
              parentStr = elementArray;
              csvContent = recursivefnforTreetoArray(currObj.children[i], key, csvArray, csvContent, nameArr, parentArr, parentStr, x, roleArr, milestonesArr);
//              console.log("i tree branch till leaf node done ");
//              console.log(i);
              //console.log(data.children[i][key] + "Processed");
              console.log(data.children.length);
            }
          }
          else{
            console.log('new array shld start');
            newArray = 1;
          }
        }
        //console.log(data.children);
        //csvContent += data.children[0].join("\n");
        if ( newArray == 1){
          console.log(csvArray);
        //  finalCsvArray[0].push(csvArray);
          //csvContent += nameArr.join(",");
          //csvContent +=  ",\r\n,";
          //csvContent += parentArr.join(",");
          //csvContent +=  ",\r\n,";
          //console.log("CSV Content ");
          //console.log(csvContent);
          //console.log("node ");
          //console.log(nameArr);
          //console.log("Parent Arr");
          //console.log(parentArr);
        }
        return csvContent;
    }


function displayCsv(){
  console.log("display csv called ");


for ( var i=0, l=Math.min(nameArr.length, parentArr.length); i<l; i++ ) {
  jarray[i] = [parentArr[i], [nameArr[i], [roleArr[i], [milestonesArr[i]]]]];
}
console.log(jarray);
/*
  d3.select("#csvtable").append("ol").selectAll("text")
    .data(jarray)
    .enter()
    .append("li")
    .text(function(d) {
      return d;
  });
*/

  /*d3.select("#csvtable").append("table")
  .selectAll("tr")
    // arr1 corresponds to the rows
    // bound data is not used in the td cells; only arr1.length is used
    .data(nameArr)
  .enter().append("tr")
  .selectAll("td")
    // arr2 corresponds to the columns
    .data(parentArr)
  .enter().append("td")
    .text(function(d, i, j) { return nameArr[j] + d; }); // d === arr2[i]  */

    var columns = ['Parent', 'Node', 'Role', 'MileStones'];

    var table = d3.select('#csvtable').append('table')
	var thead = table.append('thead')
	var tbody = table.append('tbody')

	thead.append('tr')
	  .selectAll('th')
	    .data(columns)
	    .enter()
	  .append('th')
	    .text(function (d) { return d })

	var rows = tbody.selectAll('tr')
	    .data(jarray)
	    .enter()
	  .append('tr')

	var cells = rows.selectAll('td')
	    .data(function(row) {
	    	return columns.map(function (column) {
	    		return {column: column, value: row[columns.indexOf(column)]};
	      })
      })
      .enter()
    .append('td')
      .text(function (d) { return d.value })

//var grid =  document.querySelector('vaadin-grid');
//grid.items = jarray;

      csvToJson();
}


function treeObjArray(newObj, name, childObj)
{
   newObj.name=name;
   newObj.children.push(childObj);
   console.log("created object ");
   console.log(newObj);
}


function csvToJson(){
  console.log(" csv to json");
  //var text = 'parent,name\n,Eve\nEve,Seth\nEve,Enos\nSeth,Noam\nSeth,Abel\nEve,Awan\nEve,Enoch\nAwan,Azura';
  var text = jarray.join("\n");

  //console.log(jarray);
  console.log(jarray.join("\n"));
  var table = d3.csvParse(text);
  console.log(" table");
  console.log(table);
  console.log(JSON.stringify(table));

//  var csvRoot = d3.stratify()
//    .id(function(d) { return d.name; })
//    .parentId(function(d) { return d.parent; })
//    (table);

    var csvRoot = d3.stratify()
      .id(function(d) { return d.ChildNodes; })
      .parentId(function(d) { return d.ParentNodes; })
      (table);

    console.log(csvRoot);

    d3.select("#jsontext #jsont")
      .text(JSON.stringify(table));

    //console.log(JSON.stringify(csvRoot));
}



function makeSunBurstChart(sunBurstData) {

  console.log(" MakeSunBurstChart called");
  console.log(sunBurstData);
  SunBurstNode = sunBurstData;
  root = sunBurstData;
  SunBurstNode.x0 = viewerHeight / 3;
  SunBurstNode.y0 = 10;

/*var zoomListener1 = d3.behavior.zoom().scaleExtent([0.1, 2]).on("zoom", zoom);
    
    // define the baseSvg, attaching a class for styling and the zoomListener
               var baseSvg = d3.select("#sunburst-container").append("svg:svg")
               .attr("width", viewerWidth)
               .attr("height", viewerHeight)
               .attr("class", "overlay")
               .call(zoomListener1);;
               

               // Append a group which holds all nodes and which the zoom Listener can act upon.
               var svgGroup = baseSvg.append("g");
  */  
    
  var g = svgGroup.datum(SunBurstNode).selectAll("g")
      .data(partition.nodes)
    .enter().append("g");

    var path = g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .on("click", sunBurstClick)
      .on("mouseover", function(d) {
        var xPosition = d3.event.pageX + 5;
        var yPosition = d3.event.pageY + 5;
        var yourImagePath = "https://ganapathyrajalingam.github.io/ftteamstructure/Novation.jpg";
        var string = "<img src= " +  yourImagePath  + " height='100' width='100' />";
        d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px");
        d3.select("#tooltip #heading")
          .text("Name : " + d.name);
          //.html('<a href= "http://google.com">' + d.name + "</a>" + "<br/");
        d3.select("#tooltip #milestones")
          .text("MileStones : " + d.milestones);
          d3.select("#tooltip #role")
            .text("Role : " + d.role);
        d3.select("#tooltip #profile")
          //.text("£" + d.type );
          .html ( string)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY + 50) + "px")
          .style("font-color", "white");
        d3.select("#tooltip").classed("hidden", false);

      })
      .on("mouseout", function(d) {
        console.log("outcircle");
        d3.select("#tooltip").classed("hidden", true);
      })
      .each(stash);

      var text = g.append("text")
.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
.attr("x", function(d) { return sy(d.y); })
.attr("dx", "6") // margin
.attr("dy", ".35em") // vertical-align
.text(function(d) { console.log("Appending text "); return d.shortName; });

  d3.selectAll("input").on("change", function change() {
    var value = this.value === "count"
        ? function() { return 1; }
        : function(d) { return d.size; };

    path
        .data(partition.value(value).nodes)
      .transition()
        .duration(1000)
        .attrTween("d", arcTweenData);

        centerNode(SunBurstNode);
  });

  function sunBurstClick(d) {
    SunBurstNode = d;
    // fade out all text elements
text.transition().attr("opacity", 0);

    path.transition()
      .duration(1000)
      .attrTween("d", arcTweenZoom(d))
      .each("end", function(e, i) {
          // check if the animated element's data e lies within the visible angle span given in d
          if (e.x >= d.x && e.x < (d.x + d.dx)) {
            // get a selection of the associated text element
            var arcText = d3.select(this.parentNode).select("text");
            // fade in the text element and recalculate positions
            arcText.transition().duration(750)
              .attr("opacity", 1)
              .attr("transform", function() { return "rotate(" + computeTextRotation(e) + ")" })
              .attr("x", function(d) { return sy(d.y); });
          }
      });
  }

  d3.select(self.frameElement).style("height", viewerHeight + "px");

// Setup for switching data: stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}


// When switching data: interpolate the arcs in data space.
}

function arcTweenData(a, i) {
  var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  function tween(t) {
    var b = oi(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  }
  if (i == 0) {
   // If we are on the first arc, adjust the x domain to match the root node
   // at the current zoom level. (We only need to do this once.)
    var xd = d3.interpolate(x.domain(), [SunBurstNode.x, SunBurstNode.x + SunBurstNode.dx]);
    return function(t) {
      x.domain(xd(t));
      return tween(t);
    };
  } else {
    return tween;
  }
}

// When zooming: interpolate the scales.
function arcTweenZoom(d) {
  var xd = d3.interpolate(sx.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(sy.domain(), [d.y, 1]),
      yr = d3.interpolate(sy.range(), [d.y ? 20 : 0, radius]);
  return function(d, i) {
    return i
        ? function(t) { return arc(d); }
        : function(t) { sx.domain(xd(t)); sy.domain(yd(t)).range(yr(t)); return arc(d); };
  };
}

function computeTextRotation(d) {
  return (sx(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
}


function displaySunBurst(){
  console.log(" display sun burst chart");
  displaySunBurstFlag = 1;
     loadJsonData();
  //makeSunBurstChart(root);
}
