'use strict';

function distance(point1, point2){
    return Math.sqrt( (point2.pageX- point1.pageX)*(point2.pageX- point1.pageX) + 
                        (point2.pageY- point1.pageY)*(point2.pageY- point1.pageY) );
}


async function startToWait(){
    var url = "my.json"
    let response = await fetch(url);

    if (response.ok) { 
        let json = await response.text();
        console.log(json);
    } else {

    }
    startToWait();
}

async function sendJson(){
    const rawResponse = await fetch('/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file: "kono file nai",
            points: [{x : 0, y : 1}, {x : 0, y : 1}, {x : 0, y : 1}],
        })
    });
    const content = await rawResponse.json();

    console.log(content);
}

$(document).ready(function(){
    $(window).load(function(){
        //startToWait();
        sendJson();
        var res = 1;
        let canvas = document.getElementById("stars");
        window.addEventListener('resize', resizeCanvas, false);

        var ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        var pressed = false;
        var fingers = 0;
        var path = [];
        var points = [];
        ctx.lineWidth = 3;
        var zoom = 1;
        var dim = {width : 1000, height : 1000}

        function resizeCanvas() {
            canvas.width = dim.width*res;
            canvas.height = dim.height*res;
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

    })
})