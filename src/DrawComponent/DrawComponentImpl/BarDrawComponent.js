import BaseDrawComponent from './DrawComponentBase.js'

import Constant from '../../Constant/Constant.js'
import PainterFactory from '../../Painter/PainterFactory.js'

function defaultSplitFn(item){
    if(item.close < item.open) return 'down'
    else return 'up'
}

class BarDrawComponent extends BaseDrawComponent{

    constructor(options={}){
        super(options)
        this.upBarPainter = PainterFactory(Constant.Painter.BAR);
        this.downBarPainter = PainterFactory(Constant.Painter.BAR);
        this.candleData =  options.candleData || [];
        this.upDownSplitFn = options.upDownSplitFn || defaultSplitFn;
    }

    setData(dataObj){
        this.data = dataObj.data;
        this.candleData = dataObj.candleData
        super.setData(this.data)
    }

    addFirst(dataObj){
        this.candleData  = dataObj.candleData.concat(this.candleData)
        this.data = dataObj.data.concat(this.data)
        super.addFirst(dataObj.data)
    }

    draw(){
        var yAxis = this.yBridge.getYAxis(),
            xAxis = this.xBridge.getXAxis();

        var itemWidth = this.xBridge.getItemWidth()
        var yRange = this.yBridge.getRange();
        var xRange = this.xBridge.getRange();


        var viewDomain = this.xBridge.getViewDomain();

        var candleData = this.candleData.slice(viewDomain[0],viewDomain[1]);


        var upY = [],downY = [],
            upX = [],downX = [];

        for(var i = 0;i<candleData.length;i++){
            var yItem = candleData[i];
            if(this.upDownSplitFn(yItem) === 'down'){
                downY.push(yAxis[i])
                downX.push(xAxis[i])
            }else{
                upY.push(yAxis[i])
                upX.push(xAxis[i])
            }
        }

        this.upBarPainter
            .setCtx(this.ctx)
            .setYRange(yRange)
            .setXRange(xRange)
            .setXAxis(upX)
            .setYAxis(upY)
            .setStyle(this.style.barUp)
            .setStyle({itemWidth:itemWidth})
            .render()

        this.downBarPainter
            .setCtx(this.ctx)
            .setYRange(yRange)
            .setXRange(xRange)
            .setXAxis(downX)
            .setYAxis(downY)
            .setStyle(this.style.barDown)
            .setStyle({itemWidth:itemWidth})
            .render()
    }
}

export default BarDrawComponent