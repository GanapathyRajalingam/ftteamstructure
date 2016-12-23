


// load the external data
d3.json("https://ganapathyrajalingam.github.io/ftteamstructure/team.json", function(error, treeData) {
  root = treeData;
  console.log( root.teamListDetails[0]);
  console.log(error);
  makeChart(root.teamListDetails);
});


function makeChart(treeData) {
    
    console.log(" read team.json ")

        console.log('mycollapsibletree makechart called ');

                      // Calculate total nodes, max label length
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
               //var treeData = this.data;
				console.log(treeData);

			   //treeData = JSON.parse(treeData);
			   
               var root = treeData[0];
				console.log(root);
               var margin = {top: 5, right: 20, bottom: 5, left: 20};
            //       viewerWidth = 960 - margin.right - margin.left,
            //       viewerHeight = 800 - margin.top - margin.bottom;
               // size of the diagram
              var viewerWidth =  $(document).width();
               var viewerHeight = $(document).height();

               var tree = d3.layout.tree()
                   .size([viewerHeight, viewerWidth]);

               // define a d3 diagonal projection for use by the node paths later on.
               var diagonal = d3.svg.diagonal()
                   .projection(function(d) {
                      console.log( "diagonal fn called ");
                      console.log(d.y);
                      console.log(d.x);
                       return [d.y, d.x];
                   });


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
                     console.log( vfntest[0].name); }
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
                   return d[0].children && d[0].children.length > 0 ? d[0].children : null;
                 } else {

                   return d.children && d.children.length > 0 ? d.children : null;

                 }
               });



               function sortTree() {
                 console.log("sort tree called");

                 tree.sort(function(a, b) {
                   console.log(b.name.toLowerCase());
                   console.log(a.name.toLowerCase());
                   return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
                 });
               }
               // Sort the tree initially incase the JSON isn't in a sorted order.
               sortTree();

               function zoom() {
                 console.log("zoom fn called ");
                 svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
               }


               // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
               var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 1.2]).on("zoom", zoom);


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
                                  selectedNode = d;
                                  updateTempConnector();
                              };
                              var outCircle = function(d) {
                                  selectedNode = null;
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

               // Helper functions for collapsing and expanding nodes.

               function collapse(d) {
                 console.log("collapse fn called ");
                   if (d.children) {
                       d._children = d.children;
                       d._children.forEach(collapse);
                       d.children = null;
                       console.log(d);
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
                  console.log("about to call select all nodes ");
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
                       .on('click', click);

                   nodeEnter.append("circle")
                       .attr('class', 'nodeCircle')
                       .attr("r", 0)
                       .style("fill", function(d) {
                         console.log("node circle");
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
                       });

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
                       .style("stroke", function(d) { return d.target.level; })
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



               // define the baseSvg, attaching a class for styling and the zoomListener
               var baseSvg = d3.select("#tree-container").append("svg")
               .attr("width", viewerWidth)
               .attr("height", viewerHeight)
               .attr("class", "overlay")
               .call(zoomListener);

               // Append a group which holds all nodes and which the zoom Listener can act upon.
               var svgGroup = baseSvg.append("g");

               // Define the root
               root = treeData[0];
               root.x0 = viewerHeight / 2;
               root.y0 = 10;

               // Layout the tree initially and center on the root node.
               update(root);
               centerNode(root);
	
	
};