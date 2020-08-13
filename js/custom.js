'use strict';

let draw;
let reqestPending = false;
let pageNo = 1;
let pages = [];

function sendData(data) {
    if(typeof Android !== "undefined" && Android !== null) {
        Android.storeInQueue(JSON.stringify(data));
    }
}

function getData(data){
    console.log(data + " - from javascript")
    data = JSON.parse(data);
    if(data.type == "ip"){
        $(".connectPC .address").html(data.data);
    }else if(data.type == "datas"){
        if(draw.datas.points.arr.length == 0){
            sendData({type : "datas", data : draw.datas});
        }else{
            reqestPending = true;
        }
    }
}

$(document).ready(function(){
    $(window).load(function(){
        let canvas = document.getElementById("stars");
        var ctx = canvas.getContext("2d");
        var strokeWidth = 1;
        var strokeColor = "#000";
        let tool = "pencil";
        draw = new Draw(canvas, ctx);
        draw.server = true;
        draw.res = window.devicePixelRatio;

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
            // sendData({type : "point", 
            //     data :{
            //         color : draw.datas.points.color, 
            //         width : draw.datas.points.width, 
            //         point : draw.revTransform({x : x, y : y}) }
            // });

            prevPoint = {x : x, y : y};
            if(tool == "pencil"){
                ctx.beginPath();
                ctx.lineCap = "round";            
                ctx.moveTo(x*draw.res, y*draw.res);
            }
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchend' : function(e){
            if(draw.datas.points.arr.length && tool == "pencil"){
                draw.pushUndo();
                let data = JSON.parse(JSON.stringify(draw.datas.points));
                draw.datas.path.push(JSON.parse(JSON.stringify(draw.datas.points)));
                sendData({type : "pushToPath", data : data});                
            }
            draw.datas.points.arr = [];
            if(reqestPending){
                sendData({type : "datas", data : draw.datas});
                reqestPending = false;
            }
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchmove' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            end = e.originalEvent.touches;
            if(e.originalEvent.touches.length == 1){
                if(tool == "pencil"){
                    if(draw.datas.points.arr.length){
                        draw.datas.points.arr.push(draw.revTransform({x : x, y : y}));
                        ctx.lineTo(x * draw.res, y * draw.res);
                        ctx.stroke();
                        // sendData({type : "point", 
                        // data :{
                        //     color : draw.datas.points.color, 
                        //     width : draw.datas.points.width, 
                        //     point : draw.revTransform({x : x, y : y}) }
                        // });
        
                    }
                }else if(tool = "eraser"){
                    let curPoint = {x : x , y : y};
                    for(let i = 0; i < draw.datas.path.length; i++){
                        let from =  draw.transform(draw.datas.path[i].arr[0], false);
                        for(let j = 1; j < draw.datas.path[i].arr.length; j++){
                            let to = draw.transform(draw.datas.path[i].arr[j], false);
                            if(draw.intersect(from, to, prevPoint, curPoint)){
                                draw.datas.path.splice(i, 1);
                                draw.redraw();
                                sendData({type : "datas", data : draw.datas});
                                break;
                            }
                            from = to;
                        }
                    }
                    prevPoint = curPoint;
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
            tool = "pencil";
            $("#nav .selected").removeClass("selected");
            $("#nav .pencil").addClass("selected");
        })
        $("#nav .eraser").on("click", function(){
            tool = "eraser";
            $("#nav .selected").removeClass("selected");
            $("#nav .eraser").addClass("selected");
        })
        $("#nav .pencil-more").on("click", function(){
            tool = "pencil";
            $("#nav .selected").removeClass("selected");
            $("#nav .pencil-more").addClass("selected");
            $("#nav .pencil-more").parent().addClass("selected");
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
            sendData({type : "datas", data : draw.datas});            
        })
        $("#nav .redo").on("click", function(){
            draw.performRedo();
            sendData({type : "datas", data : draw.datas});            
        })

        $(".connectPC .button").on("click", function(){
            $(".connectPC").hide();
        })

        $("#nav .more").on("click", function(){
            $("#nav .selected").removeClass("selected");
            $(this).addClass("selected");
            $(this).parent().addClass("selected");
        })

        $("#nav .clear").on("click", function(){
            draw.datas.path = [];
            draw.datas.points.arr = [];
            draw.redraw();
            sendData({type : "datas", data : draw.datas});            
        })
        $("#nav .settings").on("click", function(){
            
        })
        $("#nav .next").on("click", function(){
            pages[pageNo-1] = JSON.parse(JSON.stringify(draw.datas));
            pageNo++;
            if(pages.length >= pageNo){
                draw.datas.path = [];
                draw.datas.points.arr = [];    
            }else{
                draw.datas = pages[pageNo-1];
            }
            draw.redraw();
            sendData({type : "datas", data : draw.datas});            
        })

        $("#nav .prev").on("click", function(){
            if(pageNo == 1) return;
            pages[pageNo-1] = JSON.parse(JSON.stringify(draw.datas));
            pageNo--;
            draw.datas = pages[pageNo-1];
            draw.redraw();
            sendData({type : "datas", data : draw.datas});            
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