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

        let canvas = document.getElementById("stars");
        var ctx = canvas.getContext("2d");
        let draw = new Draw(canvas, ctx);
//        draw.res = window.devicePixelRatio;
        draw.res = 1;
        ctx.lineCap = "round";
        startToWait();

        function processData(data){
            if(data.type == "path"){
                draw.datas = data.data;
                redraw();
                if(canvas.width != draw.datas.dim.width || canvas.height != draw.datas.dim.height ){
                    resizeCanvas();
                }
            }
        }

        window.addEventListener('resize', resizeCanvas, false);
        function resizeCanvas() {
            canvas.width = draw.datas.dim.width * draw.res;
            canvas.height = draw.datas.dim.height * draw.res;
            draw.redraw();
        }
        resizeCanvas();
    })
})
