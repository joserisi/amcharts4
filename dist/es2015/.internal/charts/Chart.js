/**
 * [[Chart]] class provides base functionality for all chart types to inherit.
 */
import * as tslib_1 from "tslib";
/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Component } from "../core/Component";
import { MutableValueDisposer } from "../core/utils/Disposer";
import { ListTemplate, ListDisposer } from "../core/utils/List";
import { Container } from "../core/Container";
import { Label } from "../core/elements/Label";
import { DataItem } from "../core/DataItem";
import { percent } from "../core/utils/Percent";
import * as $iter from "../core/utils/Iterator";
import * as $type from "../core/utils/Type";
/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */
/**
 * Defines a [[DataItem]] for [[Chart]].
 *
 * @see {@link DataItem}
 */
var ChartDataItem = /** @class */ (function (_super) {
    tslib_1.__extends(ChartDataItem, _super);
    /**
     * Constructor
     */
    function ChartDataItem() {
        var _this = _super.call(this) || this;
        _this.className = "ChartDataItem";
        _this.applyTheme();
        return _this;
    }
    return ChartDataItem;
}(DataItem));
export { ChartDataItem };
/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */
/**
 * A base class for all Charts.
 *
 * @see {@link IChartEvents} for a list of available Events
 * @see {@link IChartAdapters} for a list of available Adapters
 */
var Chart = /** @class */ (function (_super) {
    tslib_1.__extends(Chart, _super);
    /**
     * Constructor
     */
    function Chart() {
        var _this = 
        // Init
        _super.call(this) || this;
        /**
         * A reference to chart's [[Legend]].
         * @ignore
         */
        _this._legend = new MutableValueDisposer();
        _this.className = "Chart";
        // Create a list of titles
        var template = new Label();
        _this.titles = new ListTemplate(template);
        _this._disposers.push(new ListDisposer(_this.titles));
        _this._disposers.push(template);
        // Chart component is also a container. it holds _chartAndLegendCont and titles
        _this.width = percent(100);
        _this.height = percent(100);
        _this.layout = "vertical";
        // Chart and legend
        var chartAndLegendContainer = _this.createChild(Container);
        chartAndLegendContainer.shouldClone = false;
        chartAndLegendContainer.layout = "vertical";
        chartAndLegendContainer.width = percent(100);
        chartAndLegendContainer.height = percent(100);
        _this.chartAndLegendContainer = chartAndLegendContainer;
        // Chart container holds all the elements of a chart, extept titles and legend
        var chartContainer = chartAndLegendContainer.createChild(Container);
        chartContainer.shouldClone = false;
        chartContainer.width = percent(100);
        chartContainer.height = percent(100);
        _this.chartContainer = chartContainer;
        _this.showOnInit = true;
        _this._disposers.push(_this._legend);
        // Add title list events to apply certain formatting options and to make
        // the chart reference them as accessible screen reader labels
        _this.titles.events.on("inserted", function (label) {
            _this.processTitle(label);
            _this.updateReaderTitleReferences();
        }, _this, false);
        _this.titles.events.on("removed", function (label) {
            _this.updateReaderTitleReferences();
        }, _this, false);
        // Accessibility
        // It seems we can't set focusable on the whole chart because it seems to
        // mess up the whole focus event system - getting a focus on an inside
        // object also trigger focus on parent
        //this.focusable = true;
        _this.role = "region";
        _this.defaultState.transitionDuration = 1;
        // Apply theme
        _this.applyTheme();
        return _this;
    }
    /**
     * Sets defaults that instantiate some objects that rely on parent, so they
     * cannot be set in constructor.
     */
    Chart.prototype.applyInternalDefaults = function () {
        _super.prototype.applyInternalDefaults.call(this);
        if (!$type.hasValue(this.readerTitle)) {
            this.readerTitle = this.language.translate("Chart");
        }
    };
    /**
     * Initiates drawing of the chart.
     *
     * @ignore Exclude from docs
     */
    Chart.prototype.draw = function () {
        this.fixLayout();
        _super.prototype.draw.call(this);
    };
    /**
     * Updates legend's hierarchy based on the position.
     */
    Chart.prototype.fixLayout = function () {
        var legend = this.legend;
        if (legend) {
            var chartAndLegendContainer = this.chartAndLegendContainer;
            var chartContainer = this.chartContainer;
            chartContainer.x = undefined;
            chartContainer.y = undefined;
            legend.x = undefined;
            legend.y = undefined;
            switch (legend.position) {
                case "left":
                    chartAndLegendContainer.layout = "horizontal";
                    if (!$type.isNumber(legend.width)) {
                        legend.width = 200;
                    }
                    //legend.maxWidth = legend.width;
                    legend.toBack();
                    break;
                case "right":
                    chartAndLegendContainer.layout = "horizontal";
                    if (!$type.isNumber(legend.width)) {
                        legend.width = 200;
                    }
                    //legend.maxWidth = legend.width;
                    legend.toFront();
                    break;
                case "top":
                    chartAndLegendContainer.layout = "vertical";
                    legend.maxWidth = undefined;
                    legend.width = percent(100);
                    legend.toBack();
                    break;
                case "bottom":
                    chartAndLegendContainer.layout = "vertical";
                    legend.maxWidth = undefined;
                    legend.width = percent(100);
                    legend.toFront();
            }
        }
    };
    /**
     * Setups the legend to use the chart's data.
     */
    Chart.prototype.feedLegend = function () {
        // Nothing here. This method is provided only as a "placeholder" for
        // extending classes to override
    };
    /**
     * Adds a new title to the chart when it is inserted into chart's titles
     * list.
     * @param event  An event object which is triggered when inserting into titles list
     * @return Label object
     */
    Chart.prototype.processTitle = function (event) {
        var title = event.newValue;
        title.parent = this;
        title.toBack();
        title.shouldClone = false;
        title.align = "center";
        // Need to explicitly apply the `id` attribute so it can be referenced by
        // `aria-labelledby`
        title.uidAttr();
        return title;
    };
    /**
     * Checks if chart has any title elements. If it does, we will use them in an
     * `aria-labelledby` attribute so that screen readers can use them to properly
     * describe the chart when it is focused or hovered.
     *
     * @ignore Exclude from docs
     */
    Chart.prototype.updateReaderTitleReferences = function () {
        if (this.titles.length) {
            var titleIds_1 = [];
            $iter.each(this.titles.iterator(), function (title) {
                titleIds_1.push(title.uid);
            });
            this.setSVGAttribute({ "aria-labelledby": titleIds_1.join(" ") });
        }
        else {
            this.removeSVGAttribute("aria-labelledby");
        }
    };
    Object.defineProperty(Chart.prototype, "legend", {
        /**
         * @return Legend
         */
        get: function () {
            return this._legend.get();
        },
        /**
         * Holds the instance of chart's [[Leged]].
         *
         * @see {@link https://www.amcharts.com/docs/v4/concepts/legend/} for more information about legends
         * @param Legend
         */
        set: function (legend) {
            this.setLegend(legend);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Prepares the legend instance for use in this chart.
     *
     * @param legend  Legend
     */
    Chart.prototype.setLegend = function (legend) {
        var _this = this;
        if (this._legend.get() !== legend) {
            if (legend) {
                // Set legend options
                legend.parent = this.chartAndLegendContainer;
                this._legend.set(legend, legend.events.on("propertychanged", function (event) {
                    if (event.property == "position" || event.property == "width") {
                        _this.fixLayout();
                    }
                }, undefined, false));
            }
            else {
                this._legend.reset();
            }
            this.feedLegend();
        }
    };
    /**
     * Processes JSON-based config before it is applied to the object.
     *
     * @ignore Exclude from docs
     * @param config  Config
     */
    Chart.prototype.processConfig = function (config) {
        if (config) {
            // Set up legend
            if ($type.hasValue(config.legend) && !$type.hasValue(config.legend.type)) {
                config.legend.type = "Legend";
            }
        }
        _super.prototype.processConfig.call(this, config);
    };
    /**
     * Copies all properties from another instance of [[Series]].
     *
     * @param source  Source series
     */
    Chart.prototype.copyFrom = function (source) {
        this.titles.copyFrom(source.titles);
        if (source.legend) {
            this.legend = source.legend.clone();
        }
        _super.prototype.copyFrom.call(this, source);
    };
    return Chart;
}(Component));
export { Chart };
//# sourceMappingURL=Chart.js.map