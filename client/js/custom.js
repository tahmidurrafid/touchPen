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
        window.addEventListener('resize', resizeCanvas, false);

        var ctx = canvas.getContext("2d");

        ctx.lineCap = "round";
        ctx.lineWidth = datas.lineWidth;

        function resizeCanvas() {
            canvas.width = datas.dim.width*res;
            canvas.height = datas.dim.height*res;
        }

        resizeCanvas();

        startToWait();
        function processData(data){
            if(data.type == "path"){
                datas.path = data.path;
                redraw();
            }
        }
    })
})