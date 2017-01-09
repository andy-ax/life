function fn () {
    //TODO 游戏规则 周围有3个细胞为生 -> 生
    //TODO         周围有2个细胞为生 -> 不变
    //TODO         其他情况均为死
    var dom = {
        canvas: document.getElementById('canvas'),
        refresh: document.getElementById('start'),
        end: document.getElementById('end'),
        clear: document.getElementById('clear'),
        timeText: document.getElementById('time'),
        tSet: document.getElementById('tSet'),
        widthText: document.getElementById('ceilWidth'),
        wSet: document.getElementById('wSet'),
        styleText: document.getElementById('ceilStyle'),
        sSet: document.getElementById('sSet'),
    };
    let context = dom.canvas.getContext('2d');
    let width = 5;
    let height = 5;
    const cWidth = dom.canvas.width;
    const cHeight = dom.canvas.height;
    let nWidth = Math.floor(cWidth/width);
    let nHeight = Math.floor(cHeight/height);

    let lifeCeil = [];

    function main() {
        var start = false;
        var mouseDown = false;
        lifeCeil = Init.empty();
        var rule = GameRule.Basic;
        var type = 1;
        Process.setRule(rule);

        dom.canvas.addEventListener('mousedown', generate, true);
        dom.canvas.addEventListener('mousemove', generate, true);
        dom.canvas.addEventListener('mouseleave', generate, true);
        dom.canvas.addEventListener('mouseup', generate, true);

        dom.tSet.addEventListener('click', function () {
            var value = parseInt(dom.timeText.value);

            Tick.configTick(value);
        });

        dom.wSet.addEventListener('click', function () {
            var value = parseInt(dom.widthText.value);

            width = height = value;
            nWidth = Math.floor(cWidth/width);
            nHeight = Math.floor(cHeight/height);

            lifeCeil = Init.empty();
            Draw.clearRect();
        });

        dom.sSet.addEventListener('click', function () {
            var value = parseFloat(dom.styleText.value);

            if (value <= rule.num && value >= 0 && value%1 === 0) {
                type = value;
            }
        });

        dom.refresh.addEventListener('click', function () {
            Tick.stopTick();
            lifeCeil = Init.random(rule.num);
            Tick.startTick();
            dom.end.value = '暂停';
            start = true;
        });

        dom.end.addEventListener('click', function () {
            if (start) {
                dom.end.value = '开始';
                start = false;

                Tick.stopTick();
            } else {
                dom.end.value = '暂停';
                start = true;

                Tick.startTick();
            }
        });

        dom.clear.addEventListener('click', function () {
            lifeCeil = Init.empty();
            Draw.clearRect();
        });

        function generate(e) {
            if (e.type === 'mousedown') {
                mouseDown = true;
                Draw.makeCeil(e.layerX, e.layerY, type);
            } else if (e.type === 'mouseleave' || e.type === 'mouseup') {
                mouseDown = false;
            } else {
                if (mouseDown) {
                    Draw.makeCeil(e.layerX, e.layerY, type);
                }
            }
        }

        Tick.setTickCb(function (next) {
            Draw.clearRect();
            lifeCeil = Process.eachCeil();
            next();
        });
    }

    var Draw = (function () {
        var color = ['rgba(0,0,0,1)','rgba(0,255,18,1)','rgba(131,118,170,1)'];
        var drawRect = function (x, y, type) {
            context.fillStyle = color[type];
            context.fillRect(x * width, y * height, width, height);
        };
        var clearRect = function () {
            context.fillStyle = 'rgba(0,0,0,1)';
            context.fillRect(0, 0, cWidth, cHeight);
        };
        var makeCeil = function (x, y, type) {
            var x0 = Math.floor(x/width);
            var y0 = Math.floor(y/height);

            lifeCeil[x0][y0] = type;
            drawRect(x0,y0,type);
        };
        return {
            drawRect: drawRect,
            clearRect: clearRect,
            makeCeil: makeCeil
        }
    })();

    var Init = (function () {
        var full = function () {
            var arr = [];
            init(arr,nWidth,nHeight,function (i, j, arr) {
                arr[i][j] = 1;
            });
            return arr;
        };
        var empty = function () {
            var arr = [];
            init(arr,nWidth,nHeight,function (i, j, arr) {
                arr[i][j] = 0;
            });
            return arr;
        };
        var random = function (num) {
            var arr = [];
            init(arr,nWidth,nHeight,function (i, j, arr) {
                arr[i][j] = Math.floor(Math.random() * (num + 1));
            });
            return arr;
        };
        function init (arr,w,h,cb) {
            for(var i = 0,xlen = w; i < xlen; i++) {
                arr[i] = [];
                for(var j = 0,ylen = h; j < ylen; j++) {
                    cb(i,j,arr);
                }
            }
        }
        return {
            full: full,
            empty: empty,
            random: random
        }
    })();

    var Tick = (function () {
        var cb = function (next) {
            next();
        };
        var next = function () {
            time_id = setTimeout(timeFunc,tickSpace);
        };
        var timeFunc = function () {
            cb(next);
        };
        var tickSpace = 60;
        var time_id;

        var startTick = function () {
            time_id = setTimeout(timeFunc,tickSpace);
        };
        var stopTick = function () {
            clearTimeout(time_id);
        };
        var setTickCb = function (callback) {
            cb = callback;
        };
        var configTick = function (time) {
            tickSpace = time;
        };
        return {
            startTick: startTick,
            stopTick: stopTick,
            setTickCb: setTickCb,
            configTick: configTick
        }
    })();

    var GameRule = (function () {
        function Basic (oldArr, newArr) {
            this.count = 0;
            this.oldArr = oldArr;
            this.newArr = newArr;
        }
        Basic.prototype = {
            jude(ceil){
                if (ceil === 1) this.count++;
            },
            genre(x, y){
                if (this.count === 3) {
                    this.newArr[x][y] = 1;
                } else if (this.count === 2) {
                    this.newArr[x][y] = this.oldArr[x][y];
                }

                if (this.newArr[x][y] === 1) {
                    Draw.drawRect(x,y,1);
                }
            }
        };
        Basic.num = 1;
        
        function Predator(oldArr, newArr) {
            this.producerCount = 0;
            this.predatorCount = 0;
            this.oldArr = oldArr;
            this.newArr = newArr;
        }
        Predator.prototype = {
            jude(ceil){
                if (ceil === 1) {
                    this.producerCount++;
                } else if (ceil === 2) {
                    this.predatorCount++;
                }
            },
            genre(x, y){
                var space = 8 - this.predatorCount - this.producerCount;
                var ceil = this.oldArr[x][y];

                if (ceil === 1) {
                    if (space > 2 && space < 6) {
                        if (this.predatorCount > 0) {
                            this.newArr[x][y] = 2;
                        } else if (this.producerCount > 0) {
                            this.newArr[x][y] = 1;
                        }
                    }
                } else {
                    if (ceil === 0) {
                        if (space > 4 && space < 6) {
                            this.newArr[x][y] = 1;
                        } else if (space === 3) {
                        }
                    } else {
                        if (this.producerCount > 0) {
                            this.newArr[x][y] = 2;
                        }
                    }
                }

                if (this.newArr[x][y] === 1) {
                    Draw.drawRect(x,y,1);
                } else if (this.newArr[x][y] === 2) {
                    Draw.drawRect(x,y,2);
                }
            }
        };
        Predator.num = 2;

        return {
            Basic: Basic,
            Predator: Predator
        }
    })();

    var Process = (function () {
        var Rule = null;

        function judgeLife (x, y, oldArr, newArr) {
            var arr = oldArr;
            var rule = new Rule(oldArr,newArr);

            if (x > 0 && y > 0) rule.jude(arr[x-1][y-1]);
            if (y > 0) rule.jude(arr[x][y-1]);
            if (x < nWidth - 1 && y > 0) rule.jude(arr[x+1][y-1]);
            if (x > 0) rule.jude(arr[x-1][y]);
            if (x < nWidth - 1) rule.jude(arr[x+1][y]);
            if (x > 0 && y < nHeight) rule.jude(arr[x-1][y+1]);
            if (y < nHeight) rule.jude(arr[x][y+1]);
            if (x < nWidth - 1 && y < nHeight) rule.jude(arr[x+1][y+1]);

            rule.genre(x,y);
        }

        var setRule = function (rule) {
            Rule = rule;
        };

        var eachCeil = function () {
            var newArr = Init.empty();
            for(var i = 0,xlen = nWidth; i < xlen; i++) {
                for(var j = 0,ylen = nHeight; j < ylen; j++) {
                    judgeLife(i,j,lifeCeil,newArr);
                }
            }
            return newArr;
        };
        return {
            setRule: setRule,
            eachCeil: eachCeil
        }
    })();

    main();
}

window.addEventListener('load',fn,true);