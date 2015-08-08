
import Utils from '../Utils/Utils.js'

class XDataBridgeBase{
    constructor(options){
        this.data = options.data || [];
        this.range = options.range || [0,0]
        this.gap = options.gap ||0;
        this.direction = options.direction || 'end'
        this.xAxis = new Array(this.data.length);
        this.scaleRange = options.scaleRange || [0.01,50]
        this.scale = 1;
        this.isInit = false;

        this.tickCount = options.tickCount;
        this.ncieTick = options.ncieTick || false;
    }


    getItemWidth(){
        return this.itemWidth;
    }

    initItemWidth(){
        throw new Error('subClass of XDataBridge should implement initItemWidth')
    }

    addLast(arr){
        if(!Utils.Type.isArray(arr)){ arr = [arr] }

        var space = this.itemWidth + this.gap;
        var maxX = this.xAxis[this.xAxis.length -1];
        for(var i = 0;i<arr.length;i++){
            this.data.push(arr[i])
            this.xAxis.push(maxX+space*(i+1));
        }
        return this;
    }

    addFirst(arr){
        if(!Utils.Type.isArray(arr)){arr=[arr]}

        var space = this.itemWidth + this.gap;
        var minX = this.xAxis[0];
        for(var i = 0;i<arr.length;i++){
            this.data.unshift(arr[i])
            this.xAxis.unshift(minX-space*(i+1))
        }
        return this;
    }

    //value 指canvas上的x坐标，range中一个值
    getIndexByValue(value){
        var axisData = this.xAxis;
        if(axisData.length == 0){
            throw new Error('调用getIndexByValue时，xAxis不能为空')
        }
        var space = this.itemWidth+this.gap;
        return Utils.Algorithms.binarySearch(axisData,value,function(value,curElem){
            if(curElem >= value-space && curElem <= value){
                return 0
            }else if(curElem+space < value){
                return -1
            }else{
                return 1
            }
        })
    }


    getXAxis(){
        if(!this.isInit){
            this.buildAxis();
            this.isInit = true;
        }
        var [beginIdx,endIdx] = this.viewRange
        return this.xAxis.slice(beginIdx,endIdx);
    }

    getDataByIndex(index){
        return this.data[index]
    }

    buildAxis(){
        this.initItemWidth();
        this._originItemWidth = this.itemWidth;
        var range = this.range
        var begin = range[0],
            offset = 0,
            space = this.itemWidth + this.gap;
        var data = this.data;

        if(!this.isInit) {
            if (this.displayCount < data.length && this.direction == 'end') {
                offset = (data.length - this.displayCount) * space
            }
        }

        var realOffset = begin-offset;

        this._updateXAxis(function(item,idx){
            return space*idx + realOffset;
        })

        //this.linearScale = Utils.Math.LineScale(this.range,this.range)

        return this;
    }

    getTicks(){
        var tickInfo = Utils.Math.LineScale(this.range,this.range)
            .ticks(this.tickCount,this.ncieTick)

        var start = tickInfo.start,
            end   = tickInfo.end,
            step  = tickInfo.step;

        var ticks =[];
        var data = this;data
        for(var i = start;i<=end;i+=step){
            var index = this.getIndexByValue(i);
            ticks.push({
                domainValue:data[index],
                rangeValue:i
            })
        }
    }

    _updateXAxis(fn){
        var xAxis = this.xAxis;
        var [bRange,eRange] = this.range
        var space = this.itemWidth + this.gap;
        var beginIdx=undefined,endIdx= undefined;
        for(var i = 0;i<xAxis.length;i++){
            xAxis[i] = fn(xAxis[i],i)
            if(beginIdx===undefined && xAxis[i] + space >= bRange){
                beginIdx = i;
            }
            if(endIdx === undefined && xAxis[i] >= eRange){
                endIdx = i;
            }
        }
        //beginIdx = beginIdx === undefined?0:beginIdx
        endIdx = endIdx === undefined?xAxis.length:endIdx
        this.viewRange=[beginIdx,endIdx];
    }

    getData(){
        var [beginIdx,endIdx] = this.viewRange;
        return this.data.slice(beginIdx,endIdx)
    }

    getViewRange(){
        return this.viewRange;
    }

    setScale(factor,val){

        var scale = this.scale * factor;
        if(scale > this.scaleRange[1] || scale<this.scaleRange[0]){
            return this;
        }
        this.scale = scale;

        var axisData = this.xAxis
        var len = axisData.length

        var maxX = axisData[len-1],
            minX = axisData[0];

        var oItemWidth = this.itemWidth;

        var index = -1;
        if(val >= maxX){
            index = Math.round(val - maxX)/oItemWidth
        }else if(val <= minX ){
            index = Math.round(val - minX)/oItemWidth
        }else{
            index = this.getIndexByValue(val)
        }

        this.itemWidth = this._originItemWidth * this.scale
        var itemWidth = this.itemWidth;

        var spaceDiff = itemWidth - oItemWidth

        this._updateXAxis(function(item,idx){
            return item + spaceDiff*(idx - index)
        })
        return this;
    }

    setTranslation(x){

        this._updateXAxis(function(item,idx){
            return item + x;
        })
        return this;
    }
}

export class XDataBridgeWithItemWidth extends XDataBridgeBase{

    constructor(options){
        super(options)
        if(!('itemWidth' in options)){
            throw new Error('need itemWidth')
        }
        this.itemWidth = options.itemWidth;
    }

    initItemWidth(){
        var gap = this.gap;
        var range = this.range;
        var itemWidth = this.itemWidth;
        if(range[0]>=range[1]){
            throw new Error('区间(Range)开始数值，应小于结束数值')
        }
        var len = range[1]-range[0]
        var divObj = Utils.Math.integerDivide(len+gap,itemWidth+gap)
        var count = divObj.div//能够显示的数据个数
        this.displayCount = count;
        var rem = divObj.rem
        itemWidth +=  rem/count;
        this.itemWidth = itemWidth
    }
}

export class XDataBridgeWithFixedCount extends XDataBridgeBase{
    constructor(options){
        options.direction  = options.direction || 'normal'
        super(options)
        if(!('fixedCount' in options)){
            throw new Error('need fixedCount')
        }
        this.fixedCount = options.fixedCount;
    }

    initItemWidth(){
        var gap = this.gap;
        var range = this.range;
        var totalWidth = range[1]-range[0]
        var space = totalWidth / this.fixedCount;

        if(space < gap){
            throw new Error('gap too big，itemWidth will be zero or negative')
        }

        this.itemWidth = space-gap;
    }
}

