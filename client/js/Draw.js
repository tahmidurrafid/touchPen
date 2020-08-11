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
    
    this.undos = [];
    this.redos = [];

    this.distance = function (point1, point2){
        return Math.sqrt( (point2.pageX- point1.pageX)*(point2.pageX- point1.pageX) + 
                            (point2.pageY- point1.pageY)*(point2.pageY- point1.pageY) );
    }
    
    this.transform = function(point, usingRes = true){
        return {
            x : (point.x - this.init.x)*this.zoom* (usingRes ? this.res : 1),
            y : (point.y - this.init.y)*this.zoom* (usingRes ? this.res : 1)
        }
    }

    this.intersect = function(p1, p2, p3, p4){
        var m1 = Infinity, m2 = Infinity;
        if(p1.x != p2.x) m1 = (p2.y - p1.y)/(p2.x - p1.x);
        if(p3.x != p4.x) m2 = (p4.y - p3.y)/(p4.x - p3.x);
        if(m1 == m2) return false;
        if(m1 == Infinity || m2 == Infinity){
            return false;
        }
        var x = ((p1.y - p3.y) - (p1.x*m1 - p3.x*m2) )/(m2-m1);
        
        if( (x >= min(p1.x, p2.x) && x <= max(p1.x, p2.x)) && 
        (x >= min(p3.x, p4.x) && x <= max(p3.x, p4.x)) ) return true;
        else return false;
    }

    this.revTransform = function(point){
        return {
            x : (point.x + this.init.x*(this.zoom) )/(this.zoom),
            y : (point.y + this.init.y*(this.zoom) )/(this.zoom)
        }
    }

    this.pushUndo = function(){
        let toPush =  JSON.parse(JSON.stringify(this.datas));
        toPush.points.arr = [];
        this.undos.push(toPush);
        if(this.undos.length > 10){
            this.undos.shift();
        }
        this.redos = [];
    }

    this.performUndo = function(){
        if(this.undos.length){
            let toPush =  JSON.parse(JSON.stringify(this.datas));
            toPush.points.arr = [];
            this.redos.push(toPush);
            this.datas = this.undos.pop();
            this.redraw();
        }

    }

    this.performRedo = function(){
        if(this.redos.length){
            let toPush =  JSON.parse(JSON.stringify(this.datas));
            toPush.points.arr = [];
            this.undos.push(toPush);
            this.datas = this.redos.pop();
            this.redraw();
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

function max(a, b){ return a > b ? a : b;}
function min(a, b){ return a < b ? a : b;}
