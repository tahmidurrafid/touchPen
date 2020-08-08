'use strict';

$(document).ready(function(){
    $(window).load(function(){
        var datas = {
            path : [],
            points : [],
            lineWidth : 3,
            dim : {width : 1000, height : 1000},
        };
        
        function distance(point1, point2){
            return Math.sqrt( (point2.pageX- point1.pageX)*(point2.pageX- point1.pageX) + 
                                (point2.pageY- point1.pageY)*(point2.pageY- point1.pageY) );
        }
        
        async function startToWait(){
            var url = "my.json"
            let response = await fetch(url);
        
            if (response.ok) { 
                let json = await response.json();
                processData(json);
            }
            startToWait();
        }
        
        async function sendJson(data){
            const rawResponse = await fetch('/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const content = await rawResponse.json();
        }
        
        var res = 1;
        let canvas = document.getElementById("stars");
        window.addEventListener('resize', resizeCanvas, false);

        var ctx = canvas.getContext("2d");

        ctx.lineCap = "round";
        ctx.lineWidth = datas.lineWidth;
        var zoom = 1;

        function resizeCanvas() {
            canvas.width = datas.dim.width*res;
            canvas.height = datas.dim.height*res;
        }

        resizeCanvas();

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
            for(var i = 0; i < datas.path.length; i++){
                ctx.beginPath();
                var point = transform(datas.path[i][0]);
                ctx.moveTo(point.x, point.y);
                for(var j = 1; j < datas.path[i].length; j++){
                    var point = transform(datas.path[i][j]);                    
                    ctx.lineTo(point.x , point.y );
                }
                ctx.stroke();
            }
        }

        startToWait();
        function processData(data){
            if(data.type == "path"){
                datas.path = data.path;
                redraw();
            }
        }
    })
})