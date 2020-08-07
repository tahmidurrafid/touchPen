'use strict';

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

        var pressed = false;
        var path = [];
        var points = [];
        ctx.lineWidth = 3;
        var zoom = 1;
        var dim = {width : 1000, height : 10000}

        var start = {x : 0, y : 0};

        function redraw(){
            ctx.clearRect(0, 0 , canvas.width, canvas.height);
            for(var i = 0; i < path.length; i++){
                ctx.beginPath();
                ctx.moveTo(path[i][0].x, path[i][0].y);
                for(var j = 1; j < path[i].length; j++){
                    ctx.lineTo(path[i][j].x, path[i][j].y);
                }
                ctx.stroke();
            }
        }

        $('#stars').on({ 'touchstart' : function(e){
            var x = e.originalEvent.touches[0].pageX * res;
            var y = e.originalEvent.touches[0].pageY * res;
            pressed = true;
            points.push({x : x, y : y});

            ctx.beginPath();
            ctx.moveTo(x, y);
            e.preventDefault();
        } });
        
        $('#stars').on({ 'touchend' : function(e){
            pressed = false;
            path.push(points);
            points = [];
            e.preventDefault();
        } });
        
        $('#stars').on({ 'touchmove' : function(e){
            var x = e.originalEvent.touches[0].pageX * res;
            var y = e.originalEvent.touches[0].pageY * res;
            if(pressed){
                points.push({x : x, y : y});
                ctx.lineTo(x, y);
                ctx.stroke();
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