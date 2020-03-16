

function plotStackedBarChart(data,svgElementId) {

    var keys = ['tscore', 'escore']
    var dkeys = ['Tech Score', 'Soft Score']

    var states = [...new Set(data.map(d => d.label))]

    padding=40
	colors = ["#987f98", "#88c488"]

	var svg = d3.select(svgElementId),
		margin = { top: 35, left: 15, bottom: 0, right: 0 },
		width = +svg.attr("width") + margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

    var legend = svg.append('g')
        .attr('class', 'legend')
		.attr("transform", "translate(" + (width -50) + ",0)");

        //.attr('transform', 'translate(' + (padding + 12) + ', 0)');
       // .attr("transform", function (d) { return "translate(" + x(d.label) + ",0)"; });

    legend.selectAll('rect')
        .data(dkeys)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', function (d, i) {
            return i * 18;
        })
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', function (d, i) {
            return colors[i];
        });

    legend.selectAll('text')
        .data(dkeys)
        .enter()
        .append('text')
        .text(function (d) {
            return d;
        })
        .attr('x', 18)
        .attr('y', function (d, i) {
            return i * 18;
        })
        .attr('text-anchor', 'start')
		.attr('alignment-baseline', 'hanging');

	var x = d3.scaleBand()
		
		.range([margin.left, width - margin.right])
		.padding(0.1)

	var y = d3.scaleLinear()
		.domain([0, 20])
		.rangeRound([height - margin.bottom, margin.top])

	//var xAxis = svg.append("g")
	//	.attr("transform", `translate(0,${height - margin.bottom})`)
	//	.attr("class", "x-axis")
	var xAxis = d3.axisBottom()
		.scale(x);


	var yAxis = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("class", "y-axis")

	var z = d3.scaleOrdinal()
		.range(["#987f98", "#88c488", "#36b9cc"])
		.domain(keys);

	data.forEach(function (d) {
		d.total = d3.sum(keys, k => +d[k])
		return d
	})

		//y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();
    //y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]);

		svg.selectAll(".y-axis").transition().duration(500)
			.call(d3.axisLeft(y).ticks(null, "s"))

		//data.sort(d3.select("#sort").property("checked")
		//	? (a, b) => b.total - a.total
		//	: (a, b) => states.indexOf(a.State) - states.indexOf(b.State))

		x.domain(data.map(d => d.label));

		svg.selectAll(".x-axis").transition().duration(500)
			.call(d3.axisBottom(x).tickSizeOuter(0))

		var group = svg.selectAll("g.layer")
			.data(d3.stack().keys(keys)(data), d => d.key)

		group.exit().remove()

		group.enter().append("g")
			.classed("layer", true)
			.attr("fill", d => z(d.key));

	var bars = svg.selectAll("g.layer").selectAll("rect")
		.data(d => d, e => e.data.label);

		bars.exit().remove()

		bars.enter().append("rect")
			.attr("width", x.bandwidth())
			.merge(bars)
			.transition().duration(500)
			.attr("x", d => x(d.data.label))
			.attr("y", d => y(d[1]))
			.attr("height", d => y(d[0]) - y(d[1]))

    var text = svg.selectAll(".text")
        
		.data(data, d => d.label);

		text.exit().remove()

		text.enter().append("text")
			.attr("class", "text")
			.attr("text-anchor", "middle")
			.merge(text)
			.transition().duration(500)
			.attr("x", d => x(d.label) + x.bandwidth() / 2)
			.attr("y", d => y(d.total) - 5)
		.text(d => Math.round(d.total * 100) / 100)

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-65)");
}
