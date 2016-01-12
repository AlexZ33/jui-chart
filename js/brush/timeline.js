jui.define("chart.brush.timeline", [ "util.base" ], function(_) {

    /**
     * @class chart.brush.timeline
     * @extends chart.brush.core
     */
    var TimelineBrush = function() {
        var g, padding, domains, height, width, ticks;
        var keyToIndex = {}, cacheRect = [], cacheRectIndex = null;

        this.setActiveRect = function(target) {
            for (var k = 0; k < cacheRect.length; k++) {
                var r1 = cacheRect[k].r1,
                    r2 = cacheRect[k].r2,
                    isTarget = r2.element == target;

                r1.attr({
                    "fill": (isTarget) ? "#9262cf" : "#4dbfd9"
                })

                r2.attr({
                    "fill": (isTarget) ? "#A75CFF" : "#DEC2FF",
                    "stroke": (isTarget) ? "#caa4f5" : "#caa4f5",
                    "fill-opacity": (isTarget) ? 0.15 : 0,
                    "stroke-width": (isTarget) ? 1 : 0
                });

                if (isTarget) {
                    cacheRectIndex = k;
                }
            }
        }

        this.drawBefore = function() {
            g = this.svg.group();
            padding = this.chart.get("padding");
            domains = this.axis.y.domain();
            height = this.axis.y.rangeBand();
            width = this.axis.x.rangeBand();
            ticks = this.axis.x.ticks(this.axis.get("x").step);

            // ������ Ű�� �ε��� ���� ��ü
            for(var i = 0; i < domains.length; i++) {
                keyToIndex[domains[i]] = i;
            }
        }

        /*
         xview_popup_timeline_content_bar_color: "#4dbfd9",
         xview_popup_timeline_content_select_bar_color: "#9262cf",
         xview_popup_timeline_content_select_layer_color: "rgba(167, 92, 255, 0.15)",
         xview_popup_timeline_content_select_layer_stroke_color: "#caa4f5",
         xview_popup_timeline_content_hover_layer_color: "rgba(222, 194, 255, 0.15)",
         xview_popup_timeline_content_hover_layer_stroke_color: "#caa4f5",
         xview_popup_timeline_text_color: "#000000",

         ���ἱ�� 1px
         ����� 7px
         */

        this.drawGrid = function() {
            for(var i = -1; i < ticks.length; i++) {
                var x = (i == -1) ? this.axis.x(0) - padding.left : this.axis.x(ticks[i]);

                for (var j = 0; j < domains.length; j++) {
                    var domain = domains[j],
                        y = this.axis.y(j) - height / 2;

                    if(i < ticks.length - 1) {
                        var fill = (j == 0) ? this.chart.color("linear(top) #f9f9f9,1 #e9e9e9") : ((j % 2) ? "#fafafa" : "#f1f0f3");

                        var bg = this.svg.rect({
                            width: (i == -1) ? padding.left : width,
                            height: height,
                            fill: fill,
                            x: x,
                            y: y
                        });

                        g.append(bg);
                    }

                    if(i == -1) {
                        var txt = this.chart.text({
                            "text-anchor": "end",
                            dx: padding.left - 5,
                            dy: 12,
                            "font-size": 11,
                            "font-weight": 700
                        })
                        .text(domain)
                        .translate(x, y);

                        g.append(txt);
                    }
                }
            }
        }

        this.drawLine = function() {
            var y = this.axis.y(0) - height / 2,
                format = this.axis.get("x").format;

            for(var i = 0; i < ticks.length; i++) {
                var x = this.axis.x(ticks[i]);

                if(i < ticks.length - 1) {
                    var vline = this.svg.line({
                        stroke: "#c9c9c9",
                        "stroke-width": 1,
                        x1: x,
                        x2: x,
                        y1: y,
                        y2: y + this.axis.area("height")
                    });

                    g.append(vline);
                }

                if(i > 0) {
                    var txt = this.chart.text({
                        "text-anchor": "end",
                        dx: -5,
                        dy: 12,
                        "font-size": 10
                    })
                    .translate(x, y);

                    if (_.typeCheck("function", format)) {
                        txt.text(format.apply(this.chart, [ticks[i], i]));
                    } else {
                        txt.text(ticks[i]);
                    }

                    g.append(txt);
                }
            }

            var hline = this.svg.line({
                stroke: "#d2d2d2",
                "stroke-width": 1,
                x1: this.axis.x(0) - padding.left,
                x2: this.axis.area("width"),
                y1: y + height,
                y2: y + height
            });

            g.append(hline);
        }

        this.drawData = function() {
            var bg_height = this.axis.area("height"),
                evt_type = this.brush.activeEvent,
                act_index = this.brush.active;

            for(var i = 0, len = this.axis.data.length; i < len; i++) {
                var d = this.axis.data[i],
                    x1 = this.axis.x(this.getValue(d, "stime", 0)),
                    x2 = this.axis.x(this.getValue(d, "etime", this.axis.x.max())),
                    y = this.axis.y(keyToIndex[this.getValue(d, "type")]),
                    h = 7;

                var r1 = this.svg.rect({
                    width: x2 - x1,
                    height: h,
                    fill: "#4dbfd9",
                    x: x1,
                    y: y - h / 2
                });

                var r2 = this.svg.rect({
                    width: x2 - x1,
                    height: bg_height,
                    "fill-opacity": 0,
                    "stroke-width": 0,
                    x: x1,
                    cursor: (evt_type != null) ? "pointer" : "default"
                }).on("mouseover", function(e) {
                    for(var k = 0; k < cacheRect.length; k++) {
                        var r2 = cacheRect[k].r2,
                            isTarget = r2.element == e.target;

                        r2.attr({
                            "fill": (isTarget && cacheRectIndex == k) ? "#A75CFF" : "#DEC2FF",
                            "stroke": (isTarget && cacheRectIndex == k) ? "#caa4f5" : "#caa4f5",
                            "fill-opacity": (isTarget || cacheRectIndex == k) ? 0.15 : 0,
                            "stroke-width": (isTarget || cacheRectIndex == k) ? 1 : 0
                        });
                    }
                });

                if(i < len - 1) {
                    var dd = this.axis.data[i + 1],
                        xx1 = this.axis.x(this.getValue(dd, "stime", 0)),
                        yy = this.axis.y(keyToIndex[this.getValue(dd, "type")]);

                    var l = this.svg.line({
                        x1: x2,
                        y1: y,
                        x2: xx1,
                        y2: yy,
                        stroke: "#4dbfd9",
                        "stroke-width": 1
                    });

                    g.append(l);
                }

                g.append(r1);
                g.append(r2);

                // ���콺 ���� ȿ�� ������Ʈ
                cacheRect[i] = {
                    r1: r1,
                    r2: r2
                };

                // ��Ƽ�� �̺�Ʈ ����
                if(_.typeCheck("string", evt_type)) {
                    var self = this;

                    r2.on(evt_type, function (e) {
                        self.setActiveRect(e.target);
                    });
                }
            }

            // ��Ƽ�� ��� ȿ�� ����
            if(_.typeCheck("integer", act_index)) {
                cacheRectIndex = act_index;
                this.setActiveRect(cacheRect[cacheRectIndex].r2.element);
            }
        }

        this.draw = function() {
            //console.log(this.axis.y.min(), this.axis.y.max(), this.axis.y.ticks(10));
            //console.log(this.axis.x.domain());
            //console.log(this.axis.get("x").domain);

            this.drawGrid();
            this.drawLine();
            this.drawData();

            return g;
        }
    }

    TimelineBrush.setup = function() {
        return {
            active: null,
            activeEvent: null,
            clip : false
        };
    }

    return TimelineBrush;
}, "chart.brush.core");