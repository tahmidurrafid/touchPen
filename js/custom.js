'use strict';

$(document).ready(function(){

    $("#works, #about, #contact").hide();

    $("#nav a").click(function(e){
        e.preventDefault();        
        let id = $(this).attr("href");
        $("#home, #works, #about, #contact").hide();
        $(id).show();
    });

    $(window).load(function(){

        let canvas = document.getElementById("stars");
        window.addEventListener('resize', resizeCanvas, false);
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();

        var arr = [0 , 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, 1, 9/8, 5/4, 11/8, 3/2, 13/8, 7/4, 15/8 ];
        var arr2 = ["2r" , "r/8", "r/4", "3r/8", "r/2", "5r/8", "3r/4", "7r/8", 
         "r", "9r/8", "5r/4", "11r/8", "3r/2", "13r/8", "7r/4", "15r/8" ];

        var ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(300, 150, 100, 0, 2 * Math.PI);
        ctx.stroke();        
        ctx.beginPath();
        ctx.arc(700, 450, 100, 0, 2 * Math.PI);
        ctx.stroke();

        var toPut = [];

        for(var i = 0; i < arr.length; i++){
            let init = 1/2;
            ctx.font = "20px Arial";
            var thisX, thisY;

            let x = 300 + 100* Math.cos(Math.PI*(arr[i] + init));
            let y = 150 + 100* Math.sin(Math.PI*(arr[i] + init));
            thisY = y;
            ctx.beginPath();
            ctx.moveTo(300, 150);
            ctx.lineTo(x , y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(1000 , y);
            ctx.stroke();
            ctx.fillStyle = "red";
            ctx.fillText(arr2[i] + "", x, y);



            init = 1 + 11/8;

            x = 700 + 100* Math.cos(Math.PI*(arr[i] + init));
            y = 450 + 100* Math.sin(Math.PI*(arr[i] + init)); 
            thisX = x;
            ctx.beginPath();
            ctx.moveTo(700, 450);           
            ctx.lineTo(x , y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x , 0);
            ctx.stroke();

            ctx.fillText( arr2[ (i+11)%arr2.length], x - 10, y);            
            // ctx.fillText( ( (arr[i] + 11/8) >= 2 ? (arr[i] + 11/8) - 2 : (arr[i] + 11/8) )  + "", 
            //     x - 10, y);            
            toPut.push({
                x : thisX,
                y : thisY
            });
        }
        for(var i = 0; i < toPut.length; i++){
            ctx.beginPath();
            ctx.arc(toPut[i].x, toPut[i].y, 4, 0, 2 * Math.PI);
            ctx.stroke();    
        }
    })
})