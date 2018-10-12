const Svg = require('svgutils').Svg
const jsonfile = require('jsonfile')

const output = {
  points: [],
}

Svg.fromSvgDocument('./images/globe-2.svg', function(error, svg) {
  // data is sourced from an svg containing 1 layer.
  const data = svg.elements[0].childs[0].childs
  // console.log(data)
  for (let i = 0; i < data.length; i++) {
    output.points.push({
      x: data[i].cx,
      y: data[i].cy,
    })
  }

  jsonfile.writeFile('./points.json', output, { spaces: 2 }, error => {
    console.error(error)
  })
})
