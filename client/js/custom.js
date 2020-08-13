'use strict';

$(document).ready(function(){
    $(window).load(function(){
        async function startToWait(){
            var url = "my.json"
            let response = await fetch(url);
        
            if (response.ok) { 
                let json = await response.json();
                processData(json);
            }
            startToWait();
        }
        async function sendData(data){
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

        let canvas = document.getElementById("stars");
        var ctx = canvas.getContext("2d");
        let draw = new Draw(canvas, ctx);
        draw.server = false;
//        draw.res = window.devicePixelRatio;
        draw.res = 1;
        ctx.lineCap = "round";
        startToWait();

        function processData(data){
            if(data.type == "datas"){
                draw.datas = data.data;
                draw.redraw();
                if(canvas.width != draw.datas.dim.width || canvas.height != draw.datas.dim.height ){
                    resizeCanvas();
                }
            }else if(data.type == "point"){
                draw.datas.points.arr.push( data.data );
                draw.datas.points.color = data.data.color;
                draw.datas.points.width = data.data.width;
                var point = draw.transform(data.data.point);
                if(draw.datas.points.arr.length == 1){                                        
                    ctx.beginPath();
                    ctx.lineWidth = draw.datas.points.width;
                    ctx.strokeStyle = draw.datas.points.color;
                    ctx.moveTo(point.x, point.y);
                }
                ctx.lineTo(point.x, point.y);
                ctx.stroke();                
            }else if(data.type == "pushToPath"){
                draw.datas.path.push( JSON.parse(JSON.stringify(draw.datas.points)) );
                draw.datas.points.arr = [];                
            }else if(data.type = "clearPoints"){
                draw.datas.points.arr = [];                                
                draw.redraw();
            }
        }

        window.addEventListener('resize', resizeCanvas, false);
        function resizeCanvas() {
            canvas.width = draw.datas.dim.width * draw.res;
            canvas.height = draw.datas.dim.height * draw.res;
            draw.redraw();
        }
        resizeCanvas();
        sendData({type : "datas"});        
    })
})
