import * as d3 from 'd3'
import { DateTime } from "luxon"

//@ts-ignore
function drawChart(el, data: any[], L, s) {
    
    // Setup
    var margin = { top: 20, right: 0, bottom: 30, left: 30 },
      width = 600 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom
    
    d3.select(el).selectAll("svg").remove()
    
    var svg = d3
      .select(el)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  
    // X Scale
    var xDomain = [
      d3.min(data.map((d) => d.date)),
      DateTime.fromJSDate(d3.max(data.map((d) => d.date)))
        .plus({ days: 1 })
        .toJSDate(),
    ]
    var x = d3.scaleTime().domain(xDomain).range([0, width])
  
    let mintStart = DateTime.fromJSDate(xDomain[0]).toSeconds()
    let totalTime = DateTime.fromJSDate(xDomain[1]).toSeconds() - mintStart
  
    // Logistic function
    let STEPS = 10
    let step = totalTime / STEPS;
    let SECONDS_PER_DAY = 60 * 60 * 24;
    var logistic: any[] = d3.range(0, STEPS + 1).map(function (t: number) {
      var value = [
        DateTime.fromSeconds(mintStart + t * step).toJSDate(),
        (2 * L) / (1 + Math.exp(-s * (t / (SECONDS_PER_DAY / step)))) - L,
      ];
      return value
    })
  
    // Y Scale
    var yDomain = [
      0,
      d3.max([...logistic.map((d) => d[1]), ...data.map((d) => d.total)]) * 1.2,
    ]
    var y = d3.scaleLinear().domain(yDomain).range([height, 0])
  
    // Axes
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(6));
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
      .append("text")
      .style("fill", "currentColor")
      .attr("transform", "rotate(-90)")
      .attr("y", 5)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("# Minted via GOO")
  
    // Logistic line
    svg
      .append("path")
      .datum(logistic)
      .attr("d", d3.line()
        .curve(d3.curveBasis)
        .x((d: any) => x(d[0]))
        .y((d: any) => y(d[1]))
      )
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none")
  
    // Mint line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#8ef42e")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .curve(d3.curveStepAfter)
        .y((d: any) => y(d.total))
        .x((d: any) => x(d.date))
      )
  
    // Blinking circle
    let lastX = x(data[data.length - 1].date)
    let lastY = y(data[data.length - 1].total)
    svg
      .append("g")
      .append("circle")
      .attr("cx", lastX)
      .attr("cy", lastY)
      .attr("r", 4)
      .attr("fill", "#8ef42e")
      .attr("class", "animate-ping")
      .style("transform-origin", `${lastX}px ${lastY}px`)
  }

  export {
      drawChart
  }