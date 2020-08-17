'use strict';

let draw;
let reqestPending = false;
let pageNo = 1;
let pages = [];
let dataChanged = false;
let into;

function sendData(data, isJson = true) {
    if(typeof Android !== "undefined" && Android !== null) {
        Android.storeInQueue(isJson? JSON.stringify(data) : data);
    }
}

function getData(data){
    data = JSON.parse(data);
    if(data.type == "ip"){
        $(".address").html(data.data);
    }else if(data.type == "datas" && data.data){
        draw.datas = data.data;
        draw.redraw();
    }else if(data.type == "datas" ){
        if(draw.datas.points.arr.length == 0){
            sendData({type : "datas", data : draw.datas});
        }else{
            reqestPending = true;
        }
    }else if(data.type == "fileList"){
        for(var i = 0; i < data.data.length; i++){
            $(".openDialog .list").html("");
            var str = '<div class = "item"><div class = "name">' + data.data[i] + 
            '</div><div class = "options"><a href = "#" class = "open">OPEN</a><a href = "#" class = "save">DELETE</a></div></div>';
            $(".openDialog .list").append(str);
        }
    }
}

function sendAll(saveOnly = false)
{
    if(saveOnly){
        sendData("saveOnly " + pageNo, false);
    }else{
        sendData("save " + pageNo, false);
    }
    sendData({type : "datas", pageNo : pageNo, data : draw.datas});
    dataChanged = false;
}

function checkNumber(a, b){
    let val = parseInt(a);
    if(isNaN(val) || val < 0) return b;
    return val; 
}

function insideRect(p1, p2, p){
    return (p.x <= max(p1.x, p2.x)) && (p.x >= min(p1.x, p2.x) ) &&
        (p.y <= max(p1.y, p2.y)) && (p.y >= min(p1.y, p2.y) );
}

$(document).ready(function(){
    $(window).load(function(){
        let canvas = document.getElementById("stars");
        var ctx = canvas.getContext("2d");
        var strokeWidth = 1;
        var strokeColor = "#000";
        draw = new Draw(canvas, ctx);
        draw.server = true;
        draw.res = window.devicePixelRatio;
        var moving = false;
        var start, end;
        var prevPoint = {x : 0, y : 0};

        $('#stars').on({ 'touchstart' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            start = e.originalEvent.touches;
            draw.setStrokeWidth(strokeWidth);
            draw.setStrokeColor(strokeColor);
            draw.datas.points.arr.push(draw.revTransform({x : x, y : y}));            
            draw.datas.points.width = strokeWidth;
            draw.datas.points.color = strokeColor;

            prevPoint = {x : x, y : y};
            if(draw.tool == "pencil"){
                ctx.beginPath();
                ctx.lineCap = "round";
                ctx.moveTo(x*draw.res, y*draw.res);
            }else if(draw.tool == "select"){
                if( (draw.selected.length && 
                insideRect(draw.select.from, draw.select.to, {x : x, y : y})) ||
                e.originalEvent.touches.length > 1){
                    draw.pushUndo();
                    draw.moveFrom = {x : x, y : y};
                    moving = true;
                }else{
                    draw.select.from.x = draw.select.to.x = x;
                    draw.select.from.y = draw.select.to.y = y;
                    moving = false;
                    draw.selected = [];
                }
            }
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchend' : function(e){
            if(draw.datas.points.arr.length && draw.tool == "pencil"){
                draw.pushUndo();
                let data = JSON.parse(JSON.stringify(draw.datas.points));
                draw.datas.path.push(JSON.parse(JSON.stringify(draw.datas.points)));
                sendData({type : "pushToPath", data : data}); 
                dataChanged = true;
            }
            draw.datas.points.arr = [];
            if(draw.tool == "select" && !moving){
                draw.selected = [];
                let from = draw.revTransform(draw.select.from);
                let to = draw.revTransform(draw.select.to);
                console.log(from, to, draw.datas);
                for(let i = 0; i < draw.datas.path.length; i++){
                    let inside = false;
                    for(let j = 0; j < draw.datas.path[i].arr.length; j++){
                        if(insideRect(from, to ,draw.datas.path[i].arr[j])){
                            inside = true;                            
                            break;
                        }
                    }
                    draw.selected.push(inside);
                }
                draw.redraw();
            }
            if(reqestPending){
                sendAll();
                reqestPending = false;
            }
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchmove' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            end = e.originalEvent.touches;
            if(e.originalEvent.touches.length == 1){
                if(draw.tool == "pencil"){
                    if(draw.datas.points.arr.length){
                        draw.datas.points.arr.push(draw.revTransform({x : x, y : y}));
                        ctx.lineTo(x * draw.res, y * draw.res);
                        ctx.stroke();

                    }
                }else if(draw.tool == "eraser"){
                    let curPoint = {x : x , y : y};
                    for(let i = 0; i < draw.datas.path.length; i++){
                        let from =  draw.transform(draw.datas.path[i].arr[0], false);
                        for(let j = 1; j < draw.datas.path[i].arr.length; j++){
                            let to = draw.transform(draw.datas.path[i].arr[j], false);
                            if(draw.intersect(from, to, prevPoint, curPoint)){
                                draw.datas.path.splice(i, 1);
                                draw.redraw();
                                sendAll();
                                break;
                            }
                            from = to;
                        }
                    }
                    prevPoint = curPoint;
                }else if(draw.tool == "select"){
                    if(!moving){
                        draw.select.to.x = x;
                        draw.select.to.y = y;
                    }else{
                        let move = {x : (x - draw.moveFrom.x)/draw.zoom , y : (y - draw.moveFrom.y)/draw.zoom };
                        for(var i = 0; i < draw.datas.path.length; i++){
                            if(draw.selected[i]){
                                for(var j = 0; j < draw.datas.path[i].arr.length; j++){
                                    draw.datas.path[i].arr[j].x += move.x;
                                    draw.datas.path[i].arr[j].y += move.y;
                                }
                            }
                        }
                        draw.moveFrom = {x : x, y : y};
                        draw.select.from.x += move.x*draw.zoom;
                        draw.select.to.x += move.x*draw.zoom;
                        draw.select.from.y += move.y*draw.zoom;
                        draw.select.to.y += move.y*draw.zoom;
                    }
                    draw.redraw();
                }
            }else{
                draw.datas.points.arr = [];

                var move = {
                    x : ((end[1].pageX + end[0].pageX) - (start[0].pageX + start[1].pageX) )/2,
                    y : ((end[1].pageY + end[0].pageY) - (start[0].pageY + start[1].pageY) )/2
                }
                var center1 = {
                    x : ((start[1].pageX + start[0].pageX))/(2),
                    y : ((start[1].pageY + start[0].pageY))/(2)
                }
                var center2 = {
                    x : ((end[1].pageX + end[0].pageX))/(2),
                    y : ((end[1].pageY + end[0].pageY))/(2)
                }
                move.x = move.x/draw.zoom;
                move.y = move.y/draw.zoom;

                var times = draw.distance(end[0], end[1])/ draw.distance(start[0], start[1]);
                let z1 = draw.zoom;
                draw.zoom = draw.zoom*times;
                let z2 = draw.zoom;

                draw.init.x = draw.init.x + center1.x/z1 - center2.x/z2;
                draw.init.y = draw.init.y + center1.y/z1 - center2.y/z2;

                draw.redraw(ctx, canvas);
                start = end;
            }
            e.preventDefault();
        }});

        $("#nav .pencil").on("click", function(){
            draw.tool = "pencil";
            $(".selectOption").removeClass("show");
            draw.redraw();
        })

        $("#nav .eraser").on("click", function(){
            draw.tool = "eraser";
            $(".selectOption").removeClass("show");
            draw.redraw();
        })

        $("#nav .pencil-more").on("click", function(){
            $("#nav .pencil-more").toggleClass("selected");
            $("#nav .pencil-more").parent().toggleClass("selected");
        })

        $("#nav .pencil-sub .color").on('click' , function(e){
            $("#nav .pencil-sub .color").removeClass("taken");
            $(this).addClass("taken");
            strokeColor = $(this).attr("data-color");
        });

        var sliderPrev = 0;        
        $("#nav .pencil-sub .slider").on({ 'touchstart' : function(e){
            sliderPrev = e.originalEvent.touches[0].pageX;
        } });

        $("#nav .pencil-sub .slider").on({ 'touchmove' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            strokeWidth = strokeWidth + (x - sliderPrev)/50;
            if(strokeWidth > 10) strokeWidth = 10;
            if(strokeWidth < 1) strokeWidth = 1;
            strokeWidth = Math.round(strokeWidth*10)/10;
            $(".pencil-sub .slider .vert").css("left", (strokeWidth*10) + "%" );
            $(".pencil-sub .stroke").html(strokeWidth + "");
            sliderPrev = x;
        }});

        $("#nav .undo").on("click", function(){
            draw.performUndo();            
            sendAll();            
        })
        $("#nav .redo").on("click", function(){
            draw.performRedo();
            sendAll();
        })

        $(".connectPC .button").on("click", function(){
            $(".connectPC").hide();
        })

        $("#nav .more").on("click", function(){
            $(this).toggleClass("selected");
            $(this).parent().toggleClass("selected");
        })

        $("#nav .clear").on("click", function(){
            draw.pushUndo();
            draw.datas.path = [];
            draw.datas.points.arr = [];
            draw.redraw();
            sendAll();            
        })
        $("#nav .select").on("click", function(){
            draw.tool = "select"
            draw.selected = [];
            moving = false;
            draw.select.to.x = -1;
            $(".selectOption").addClass("show");
        })

        $(".major").on("click", function(){
            $(".major.selected").removeClass("selected");
            $(this).addClass("selected");
        })


        $(".selectOption .copy").on("click", function(){
            draw.clipBoard = [];
            for(let i = draw.selected.length-1; i >= 0; i--){
                if(draw.selected[i]){
                    draw.clipBoard.push(JSON.parse(JSON.stringify(draw.datas.path[i])));
                }
            }
        })
        $(".selectOption .cut").on("click", function(){
            draw.clipBoard = [];
            draw.pushUndo();
            for(let i = draw.selected.length-1; i >= 0; i--){
                if(draw.selected[i]){
                    draw.clipBoard.push(JSON.parse(JSON.stringify(draw.datas.path[i])));
                    draw.datas.path.splice(i, 1);
                }
            }
            draw.selected = [];
            draw.redraw();
            sendAll();
        })
        $(".selectOption .paste").on("click", function(){
            if(draw.clipBoard.length){
                draw.pushUndo();
                var mn = {x : 1000000000, y : 1000000000};
                var mx = {x : -1000000000, y : -1000000000};
                for(let i = 0; i < draw.clipBoard.length; i++){
                    for(let j = 0; j < draw.clipBoard[i].arr.length; j++){
                        let point = draw.clipBoard[i].arr[j];
                        mn.x = min(mn.x, point.x), mn.y = min(mn.y, point.y);
                        mx.x = max(mx.x, point.x), mx.y = max(mx.y, point.y);
                    }
                }
                for(let i = 0; i < draw.clipBoard.length; i++){
                    for(let j = 0; j < draw.clipBoard[i].arr.length; j++){
                        let point = draw.clipBoard[i].arr[j];
                        point.x -= mn.x - draw.init.x-200, point.y -= mn.y - draw.init.y-50;
                    }
                }
                draw.selected = [];
                for(var i = 0; i < draw.datas.path.length; i++) draw.selected.push(false);
                for(let i = 0; i < draw.clipBoard.length; i++){
                    draw.datas.path.push(draw.clipBoard[i]);
                    draw.selected.push(true);
                }
                mx.x = (mx.x - mn.x) + draw.init.x+200, mx.y = (mx.y - mn.y) + draw.init.y+50;
                mn.x = draw.init.x+200, mn.y = draw.init.y+50;
                draw.select.from = draw.transform(mn, false);
                draw.select.to = draw.transform(mx, false);
                draw.redraw();
                sendAll();
            }
        })

        $("#nav .settings").on("click", function(){
            $(".settings.popup").show();
            $(".dimWidth").val(draw.datas.dim.width);
            $(".dimHeight").val(draw.datas.dim.height);
            $(".gridRow").val(draw.datas.grid.row);
            $(".gridCol").val(draw.datas.grid.col);
        });

        $(".settings.popup .button a").on("click", function(){
            $(".settings.popup").hide();
            draw.datas.dim.width = checkNumber($(".dimWidth").val(), draw.datas.dim.width);
            draw.datas.dim.height = checkNumber( $(".dimHeight").val(), draw.datas.dim.height);
            draw.datas.grid.row = checkNumber( $(".gridRow").val(), draw.datas.grid.row );
            draw.datas.grid.col = checkNumber( $(".gridCol").val(), draw.datas.grid.col );
            draw.redraw();
            sendAll();            
        })

        $("#nav .next").on("click", function(){
            pages[pageNo-1] = JSON.parse(JSON.stringify(draw.datas));
            pageNo++;
            if(pages.length >= pageNo){
                draw.datas = pages[pageNo-1];
            }else{
                draw.datas.path = [];
                draw.datas.points.arr = [];                    
            }
            draw.redraw();
            draw.undos = [];
            draw.redos = [];
            sendAll();            
        })

        $("#nav .prev").on("click", function(){
            if(pageNo == 1) return;
            pages[pageNo-1] = JSON.parse(JSON.stringify(draw.datas));
            pageNo--;
            draw.datas = pages[pageNo-1];
            draw.redraw();
            draw.undos = [];
            draw.redos = [];
            sendAll();
        })

        $("#nav .save").on("click", function(){
            $(".saveDialog").show();
        })
        $("#nav .open").on("click", function(){
            sendData("fileList", false);
            $(".openDialog").show();
        })

        $(".saveDialog .button").on("click", function(){
            let name = $(".saveDialog .name input").val().trim();
            if(name.trim() == ""){
                $(".saveDialog .message").html("File name can not be empty!")
            }else{
                sendData("compile " + name , false);
            }
        })

        $(".openDialog").on("click", function(){
            var name = $(this).closest(".item").find(".name").html();
            console.log("name");
        })

        $("a").on("click", function(e){
            e.preventDefault();
        })
        function resizeCanvas() {
            canvas.width = window.innerWidth * draw.res;
            canvas.height = window.innerHeight * draw.res;
            draw.redraw();
            let height = $("#nav>div").height();
            $("#nav>div").width(height + "px");
        }
        window.addEventListener('resize', resizeCanvas, false);        
        resizeCanvas();
    })
})

setInterval(function(){
    if(dataChanged)
        sendAll(true);
}, 5000);