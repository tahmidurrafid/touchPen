let Draw = function(canvas, ctx){

    this.init = {x : 0, y : 0};
    this.zoom = 1;
    this.res = 2;
    this.datas = {
        path : [],
        points : {
            width : 3,
            color : "#000",
            arr : [],
        },
        lineWidth : 3,
        dim : {width : 1000, height : 1000},
    };
    
    this.distance = function (point1, point2){
        return Math.sqrt( (point2.pageX- point1.pageX)*(point2.pageX- point1.pageX) + 
                            (point2.pageY- point1.pageY)*(point2.pageY- point1.pageY) );
    }
    
    this.transform = function(point){
        return {
            x : (point.x - this.init.x)*this.zoom*this.res,
            y : (point.y - this.init.y)*this.zoom*this.res
        }
    }
    this.revTransform = function(point){
        return {
            x : (point.x + this.init.x*(this.zoom) )/(this.zoom),
            y : (point.y + this.init.y*(this.zoom) )/(this.zoom)
        }
    }

    this.setStrokeWidth = function(width){
        ctx.lineWidth = width* this.zoom * this.res;
    }
    this.setStrokeColor = function(color){
        ctx.strokeStyle = color;
    }
    
    this.redraw = function(){
        ctx.clearRect(0, 0 , canvas.width, canvas.height);
        for(var i = 0; i < this.datas.path.length; i++){
            this.setStrokeWidth(this.datas.path[i].width);
            this.setStrokeColor(this.datas.path[i].color);
            ctx.beginPath();
            var point = this.transform(this.datas.path[i].arr[0]);
            ctx.moveTo(point.x, point.y);
            for(var j = 1; j < this.datas.path[i].arr.length; j++){
                var point = this.transform(this.datas.path[i].arr[j]);                    
                ctx.lineTo(point.x , point.y );
            }
            ctx.stroke();
        }
        ctx.fillStyle = "#EEEEEE";        
        if(this.init.x < 0){
            var to = (-this.init.x)*(this.zoom*this.res);
            ctx.fillRect(0, 0, to, canvas.height);
        }
        if(this.init.y < 0){
            var to = (-this.init.y)*(this.zoom*this.res);
            ctx.fillRect(0, 0, canvas.width, to);
        }
        var from = this.transform({x : this.datas.dim.width, y : this.datas.dim.height});
        if( from.x < canvas.width ){
            ctx.fillRect(from.x, 0, canvas.width, canvas.height);
        }
        if( from.y < canvas.height){
            ctx.fillRect(0, from.y, canvas.width, canvas.height);
        }

        let st = (this.init.x/this.datas.dim.width);
        let en = (this.init.x + (canvas.width/(this.zoom*this.res))) /this.datas.dim.width;
        let steps = 5;
        let fontSize = 10*this.res;
        ctx.font = fontSize + "px Arial";   
        ctx.fillStyle = "#000";     
        for(let i = 0; i <= steps; i++){
            let pos = st + i*(en - st)/steps;
            pos = pos*100;
            let x = i*canvas.width/steps;
            let y = 20;
            ctx.fillText( Math.round(pos*10)/10, x, y);            
        }
        
    }
    
}
