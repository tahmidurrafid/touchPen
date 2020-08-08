'use strict';

function distance(point1, point2){
    return Math.sqrt( (point2.pageX- point1.pageX)*(point2.pageX- point1.pageX) + 
                        (point2.pageY- point1.pageY)*(point2.pageY- point1.pageY) );
}

$(document).ready(function(){
    $(window).load(function(){
        var res = 2;
        let canvas = document.getElementById("stars");
        window.addEventListener('resize', resizeCanvas, false);
        function resizeCanvas() {
            canvas.width = window.innerWidth*res;
            canvas.height = window.innerHeight*res;
        }

        resizeCanvas();
        var ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        var pressed = false;
        var fingers = 0;
        var path = [];
        var points = [];
        ctx.lineWidth = 3;
        var zoom = 1;
        var dim = {width : 1000, height : 10000}

        var init = {x : 0, y : 0};

        function transform(point){
            return {
                x : (point.x - init.x)*zoom*res,
                y : (point.y - init.y)*zoom*res
            }
        }
        function revTransform(point){
            return {
                x : (point.x + init.x*(zoom) )/(zoom),
                y : (point.y + init.y*(zoom) )/(zoom)
            }
        }

        function redraw(){
            ctx.clearRect(0, 0 , canvas.width, canvas.height);
            for(var i = 0; i < path.length; i++){
                ctx.beginPath();
                var point = transform(path[i][0]);
                ctx.moveTo(point.x, point.y);
                for(var j = 1; j < path[i].length; j++){
                    var point = transform(path[i][j]);                    
                    ctx.lineTo(point.x , point.y );
                }
                ctx.stroke();
            }
        }

        var start, end;
        $('#stars').on({ 'touchstart' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            pressed = true;
            points.push(revTransform({x : x, y : y}));
            start = e.originalEvent.touches;
            ctx.beginPath();
            ctx.moveTo(x*res, y*res);
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchend' : function(e){
            pressed = false;
            if(points.length)
                path.push(points);
            points = [];
            fingers--;
            e.preventDefault();
        }});
        
        $('#stars').on({ 'touchmove' : function(e){
            var x = e.originalEvent.touches[0].pageX;
            var y = e.originalEvent.touches[0].pageY;
            end = e.originalEvent.touches;            
            if(e.originalEvent.touches.length == 1){
                if(points.length){
                    points.push(revTransform({x : x, y : y}));
                    ctx.lineTo(x * res, y * res);
                    ctx.stroke();
                }
            }else{
                points = [];

                var move = {
                    x : ((end[1].pageX + end[0].pageX) - (start[0].pageX + start[1].pageX) )/2,
                    y : ((end[1].pageY + end[0].pageY) - (start[0].pageY + start[1].pageY) )/2
                }
                move.x = move.x/zoom;
                move.y = move.y/zoom;
                init.x -= move.x, init.y -= move.y;
                var times = distance(end[0], end[1])/ distance(start[0], start[1]);
                zoom = zoom*times;
                //$(".data").html(zoom + " , ( " + move.x + ", " + move.y + ") s");
                redraw();
                start = end;
            }
            e.preventDefault();            
        } });
        
        $("#stars").mousedown(function(e){
            pressed = true;
            points.push({x : e.pageX, y : e.pageY});
        })
        
        $("#stars").mouseup(function(){
            pressed = false;
            path.push(points);
            points = [];
        })

        $("#stars").mousemove(function(e){
            if(pressed){
                points.push({x : e.pageX, y : e.pageY});
                redraw();
            }
        })

    })
})