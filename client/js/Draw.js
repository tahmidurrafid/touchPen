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
        grid : {row : 12, col : 1}
    };
    this.server = true;
    this.tool = "pencil";
    this.undos = [];
    this.redos = [];
    this.select = {
        from : {x:0, y:0},
        to : {x : -1, y:-1}
    };
    this.selected = [];

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

    this.revTransform = function(point){
        return {
            x : (point.x + this.init.x*(this.zoom) )/(this.zoom),
            y : (point.y + this.init.y*(this.zoom) )/(this.zoom)
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
        if(this.server){
            let gap = (this.datas.dim.width)/(this.datas.grid.row + 1);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#aaa";
            for(let i = 1; i <= this.datas.grid.row; i++){
                ctx.beginPath();
                let from = this.transform({x : 0, y : gap*i});            
                let to = this.transform({x : this.datas.dim.width, y : gap*i});            
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
            gap = (this.datas.dim.height)/(this.datas.grid.col + 1);
            for(let i = 1; i <= this.datas.grid.col; i++){
                ctx.beginPath();
                let from = this.transform({x : gap*i, y : 0});            
                let to = this.transform({x : gap*i , y : this.datas.dim.height});            
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }    
        }

        for(var i = 0; i < this.datas.path.length; i++){
            this.setStrokeWidth(this.datas.path[i].width);
            this.setStrokeColor(this.datas.path[i].color);
            console.log(this.tool == "select" , this.selected.length > i , this.selected[i]);
            if(this.tool == "select" && this.selected.length > i && this.selected[i]){
                ctx.save();
                ctx.setLineDash([10*this.res, 10*this.res]);
                console.log("aise re")
            }
            ctx.beginPath();
            var point = this.transform(this.datas.path[i].arr[0]);
            ctx.moveTo(point.x, point.y);
            for(var j = 1; j < this.datas.path[i].arr.length; j++){
                var point = this.transform(this.datas.path[i].arr[j]);                    
                ctx.lineTo(point.x , point.y );
            }
            ctx.stroke();
            if(this.tool == "select" && this.selected.length > i && this.selected[i]){
                ctx.restore();                
            }

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
        if(this.select.to.x != -1 && this.tool == "select"){
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1*this.res;
            ctx.setLineDash([10*this.res, 10*this.res]);
            ctx.rect(this.select.from.x * this.res, this.select.from.y * this.res, 
                        (this.select.to.x - this.select.from.x) * this.res, 
                        (this.select.to.y - this.select.from.y) * this.res);            
            ctx.stroke();
            ctx.restore();
        }
    }
    
}

function max(a, b){ return a > b ? a : b;}
function min(a, b){ return a < b ? a : b;}


function memorySizeOf(obj) {
    var bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
};