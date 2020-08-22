'use strict';

let draw;
let reqestPending = false;
let pageNo = 1;
let into;

function sendData(data, isJson = true) {
    if(typeof Android !== "undefined" && Android !== null) {
        Android.storeInQueue(isJson? JSON.stringify(data) : data);
    }
}

function runSQL(query){
    if(typeof Android !== "undefined" && Android !== null) {
        return Android.runSQL(query);
    }
    return "";
}

function runDDL(query){
    if(typeof Android !== "undefined" && Android !== null) {
        Android.runDDL(query);
    }
}



function getData(data){
    data = JSON.parse(data);
    if(data.type == "ip"){
        $(".address").html(data.data);

    }else if(data.type == "datas" && data.data){
        draw.datas = data.data;
        pageNo = parseInt(data.pageNo);
        $(".pageNo .no").html(pageNo + "");
        draw.redraw();
        sendAll();
    }else if(data.type == "datas" ){
        if(draw.datas.points.arr.length == 0){
            sendData({type : "datas", data : draw.datas});
        }else{
            reqestPending = true;
        }

    }else if(data.type == "fileList"){
        $(".openDialog .list").html("");        
        for(var i = 0; i < data.data.length; i++){
            var str = '<div class = "item"><div class = "name">' + data.data[i] + 
            '</div><div class = "options"><a href = "#" class = "open">OPEN</a><a href = "#" class = "save">DELETE</a></div></div>';
            $(".openDialog .list").append(str);
        }
    }else if(data.type = "clear"){
        draw.datas.path = [];
        draw.datas.points.arr = [];
        draw.redraw();
        sendAll();
    }
}

function sendAll(saveOnly = false)
{
    var command = saveOnly? "saveOnly" : "save";
    sendData({type : "datas", pageNo : pageNo + "", data : draw.datas, command : command});
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

var queries = {
    workingTable : function(name){
        return "CREATE TABLE IF NOT EXISTS " + name + " ( " +
        "PAGE_NO INTEGER PRIMARY KEY, " +
        "WIDTH INTEGER, " +
        "HEIGHT INTEGER );";
    },
    pathTable : function(name){
        return "CREATE TABLE IF NOT EXISTS " + name + " ( " +
        "PAGE_NO INTEGER, " +
        "PATH_NO INTEGER, " +
        "WIDTH REAL, " +
        "COLOR TEXT, " +
        "PATH TEXT, " +
        "PRIMARY KEY ( PAGE_NO, PATH_NO) );";
    },
    blankPage : function(name){
        return "INSERT INTO " + name + " VALUES( " + pageNo + ", " + draw.datas.dim.width + 
                ", " + draw.datas.dim.height + "); ";
    },
    pushPath : function(path){
        return "INSERT INTO WORKINGPATH VALUES( " + 
            pageNo + ", " + draw.datas.path.length + ", " + 
            path.width + ", '" + path.color + "', '" + JSON.stringify(path.arr) + "'); "
    },
    deletePath : function(pathNo){
        return "DELETE FROM WORKINGPATH WHERE PATH_NO = " + pathNo + " AND PAGE_NO = " + pageNo;
    },
    shiftPath : function(from , by){
        return "UPDATE WORKINGPATH " +
            "SET PATH_NO = " + "PATH_NO - " 
            + by + " WHERE PAGE_NO = " + pageNo + " AND PATH_NO > " + from; 
    }
}

function loadPage(no){
    let datas = JSON.parse(runSQL("SELECT * FROM WORKINGPATH WHERE PAGE_NO = " + no + " ORDER BY PATH_NO") );
    for(let i = 0; i < datas.length; i++){
        draw.datas.path.push({
            width : parseFloat(datas[i].WIDTH),
            color : datas[i].COLOR,
            arr : JSON.parse(datas[i].PATH)
        });
        draw.redraw();
    }
}

$(document).ready(function(){
    $(window).load(function(){

        // runDDL("CREATE TABLE IF NOT EXISTS RHYTHM ( NAME TEXT, ROLL INTEGER);");
        // runDDL("INSERT INTO RHYTHM VALUES('Toky', 21);");

        runDDL(queries.workingTable("WORKING"));
        runDDL(queries.pathTable("WORKINGPATH"));
        console.log( runSQL("SELECT name FROM sqlite_master WHERE type='table' ") );

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
        var tZoom = 1;
        var tPos = {x : 0, y : 0};

        runDDL(queries.blankPage("WORKING"));

        console.log( JSON.parse(runSQL("SELECT * FROM WORKINGPATH")) );

        loadPage(pageNo);

        $('#stars').on({ 'touchstart' : function(e){
            if(e.cancelable)
                e.preventDefault();
            console.log("started")
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
        }});
        
        $('#stars').on({ 'touchend' : function(e){
            if(draw.datas.points.arr.length && draw.tool == "pencil"){
                draw.pushUndo();
                draw.pushPath();
            }

            draw.datas.points.arr = [];
            if(draw.tool == "select" && !moving){
                draw.selected = [];
                let from = draw.revTransform(draw.select.from);
                let to = draw.revTransform(draw.select.to);

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
            }
            draw.redraw();
            tZoom = 1;
            tPos.x = tPos.y = 0;
            if(reqestPending){
                sendAll();
                reqestPending = false;
            }
            sendAll(true);
            return true;
        }});

        $("body").on({ 'touchmove' : function(e){
            if(e.cancelable)
                e.preventDefault();
        }});
        $("body").on({ 'touchstart' : function(e){
            if(e.cancelable)
                e.preventDefault();
        }});
        
        $('#stars').on({ 'touchmove' : function(e){

            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            end = e.originalEvent.touches;
            console.log("moving");
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
                                draw.splicePath(i);
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

                let init1 = JSON.parse(JSON.stringify(draw.init));

                draw.init.x = draw.init.x + center1.x/z1 - center2.x/z2;
                draw.init.y = draw.init.y + center1.y/z1 - center2.y/z2;

                tPos = { x: center2.x - times*(center1.x - tPos.x) , 
                         y: center2.y - times*(center1.y - tPos.y) }
                tZoom = tZoom*times;

                if(draw.tool == "select" && draw.select.to.x != -1){
                    changeDim(draw.select.from, z1, z2, init1, draw.init );
                    changeDim(draw.select.to, z1, z2, init1, draw.init );
                }

                $("canvas").css("transform", "matrix(" + tZoom + ", 0, 0, " + tZoom + ", " + tPos.x + ", " + tPos.y + ")");
                start = end;
            }
            return true;
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
                    draw.splicePath(i);
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
                    draw.pushPath( draw.clipBoard[i] );
                    draw.selected.push(true);
                }
                mx.x = (mx.x - mn.x) + draw.init.x+200, mx.y = (mx.y - mn.y) + draw.init.y+50;
                mn.x = draw.init.x+200, mn.y = draw.init.y+50;
                draw.select.from = draw.transform(mn, false);
                draw.select.to = draw.transform(mx, false);
                draw.redraw();
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
            pageNo++;
            draw.datas.path = [];
            draw.datas.points.arr = [];                    
            $(".pageNo .no").html(pageNo + "");            
            sendData({command : "getPage", pageNo : pageNo});
            draw.redraw();
            draw.undos = [];
            draw.redos = [];
        })

        $("#nav .prev").on("click", function(){
            if(pageNo == 1) return;
            pageNo--;
            $(".pageNo .no").html(pageNo + "");            
            sendData({command : "getPage", pageNo : pageNo});   
            draw.redraw();
            draw.undos = [];
            draw.redos = [];
        })

        $("#nav .new").on("click", function(){
            pageNo = 1;
            $(".pageNo .no").html(pageNo + "");            
            sendData({command : "new"});   
            draw.redraw();
            draw.undos = [];
            draw.redos = [];            
        })

        $("#nav .save").on("click", function(){
            $(".saveDialog").show();
        })
        $("#nav .open").on("click", function(){
            sendData({command : "fileList"});
            $(".openDialog").show();
        })
        $("#nav .pdf").on("click", function(){
            sendData({command : "pdf"});
        })

        $(".saveDialog .button").on("click", function(){
            let name = $(".saveDialog .name input").val().trim();
            if(name.trim() == ""){
                $(".saveDialog .message").html("File name can not be empty!")
            }else{
                sendData( {command : "compile", name : name });
            }
        })

        $(".openDialog").on("click", ".open", function(){
            var name = $(this).closest(".item").find(".name").html();
            sendData({command : "open", name : name});
        })
        
        $(".closeIt").on("click", function(e){
            $(this).parent().hide();            
        })

        $(document).on("click", "a" , function(e){
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

function changeDim(point, z1, z2, init1, init2){
    let actual = { x : (point.x + init1.x*(z1) )/(z1),
                    y : (point.y + init1.y*(z1) )/(z1) } ;
    let changed = { x : (actual.x - init2.x)*z2 ,
                    y : (actual.y - init2.y)*z2 };
    point.x = changed.x;
    point.y = changed.y;
}

// function func(e){
//     e.preventDefault();
// }

// window.addEventListener("touchstart", func, {passive: false} );