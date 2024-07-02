const echarts = require('echarts');

// Implement updateView to render a visualization.
// This function is called whenever search results are updated or the visualization format changes. It handles visualization rendering
// 'data' will be the data object returned from formatData or from the search containing search result data
// 'config' will be the configuration property object containing visualization format information.

const _updateView = function (data, config) {
  this.scopedVariables['_data'] = data;
  if (!data || !data.rows || data.rows.length < 1) {
    return;
  }
  this._initializeMQTT(data, config);
  var configDataType = config[this.getPropertyNamespaceInfo().propertyNamespace + "dataType"];
  var myChart = echarts.getInstanceByDom(this.el);
  if (myChart != null && this.myRingChart1 != '' &&
    myChart != undefined) {
    myChart.dispose() //Solve the error reported by echarts dom already loaded
  }
  myChart = echarts.init(this.el);
  var option = {};
  if (configDataType == "Custom") {
    option = this._buildCustomOption(data, config);
  } else if (configDataType == "Dynamic") {
    option = this._buildDynamicOption(data, config);
  } else if (configDataType == "Boxplot") {
    option = this._buildBoxplotOption(data, config);
  } else if (configDataType == "SimpleBoxplot") {
    option = this._buildSimpleBoxplotOption(data, config);
  }
  // tokens might not yet be replaced in the option. In this case we
  // don't want the echart to be shown yet, as it would result in an error.
  // Once the token is replaced this method is called again, option is parsed
  // and echart is shown to the user.
  if (option == null) {
    return;
  }
  var xAxisDataHook = config[this.getPropertyNamespaceInfo().propertyNamespace + "xAxisDataHook"];
  var yAxisDataHook = config[this.getPropertyNamespaceInfo().propertyNamespace + "yAxisDataHook"];
  var jsHook = config[this.getPropertyNamespaceInfo().propertyNamespace + "jsHook"];
  var clickHook = config[this.getPropertyNamespaceInfo().propertyNamespace + "clickHook"];
  var annotationSeriesName = config[this.getPropertyNamespaceInfo().propertyNamespace + "annotationSeriesName"];

  if (xAxisDataHook != null) {
    option.xAxis.data = this.selfModifiyingOptionWithReturn(data, config, option, xAxisDataHook);
    console.log("Using option 'xAxisDataHook' is deprecated. Please use option 'jsHook' instead.")
  }
  if (yAxisDataHook != null) {
    option.yAxis.data = this.selfModifiyingOptionWithReturn(data, config, option, yAxisDataHook);
    console.log("Using option 'yAxisDataHook' is deprecated. Please use option 'jsHook' instead.")
  }
  if (jsHook != null) {
    this.selfModifiyingOption(data, config, option, jsHook);
  }
  if (clickHook != null) {
    myChart.on('click', onChartClick);
  }
  if (annotationSeriesName != null) {
    this._handleAnnotation(data, config, option, annotationSeriesName, myChart);
  }

  console.log(option);
  myChart.setOption(option);
  this.scopedVariables['_myChart'] = myChart;
  this.scopedVariables['_option'] = option;

  var splunk = this;

  // Function called by click on chart if option clickHook is enabled
  // Used to call the Javascript Code provided by the option clickHook to
  // set tokens for drill down
  function onChartClick(params) {
    this.evalHook = eval("(function a(params, data, config, option, event, splunk) {" + clickHook + "})");
    this.evalHook(params, data, config, option, params.event, splunk);
  }
}

module.exports = _updateView;