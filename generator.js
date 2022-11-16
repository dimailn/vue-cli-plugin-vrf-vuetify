const fs = require('fs')
const { exec } = require("child_process")

const {parse, print} = require("recast")


const injectAdapter = (text) => {
  const ast = parse(text)

  const {program: {body}} = ast

  console.log(JSON.stringify(body))

  const expressionStatement = body.find(({expression}) => expression && expression.type === 'CallExpression' && expression.arguments[0].name === 'Vrf')

  if(!expressionStatement) {
    console.error("Vrf is not installed")
    return
  }

  const {expression} = expressionStatement

  const VRF_OBJECT = {
    "type":"ObjectExpression",
    "properties":[
      {
          "type":"Property",
          "key":{
            "type":"Identifier",
            "name":"adapters",
          },
          "computed":false,
          "value":{
            "type":"ArrayExpression",
            "elements":[
            ]
          },
          "kind":"init",
          "method":false,
          "shorthand":false
      }
    ]
  }


  if (expression.arguments.length === 1) {
    expression.arguments.push(VRF_OBJECT)
  }

  const property = expression.arguments[1].properties.find(property => property.key.name === 'adapters')

  if(!property.value.elements.some(element => element.name === 'VrfVuetify')){
    property.value.elements.push(
      {
        "type":"Identifier",
        "name":"VrfVuetify"
      }
    )
  }

  return print(ast).code
}


const VRF_FILE_PATH = "src/plugins/vrf.js"

module.exports = (api) => {
  api.extendPackage({
    dependencies: {
      'vrf-vuetify': "^0.41.0"
    }
  })
  api.injectImports(VRF_FILE_PATH, "import VrfVuetify from 'vrf-vuetify'")

  api.onCreateComplete(() => {
    fs.writeFileSync(VRF_FILE_PATH, injectAdapter(fs.readFileSync(VRF_FILE_PATH, 'utf8')))

    exec(`npx eslint --fix --rule 'array-bracket-newline: [2,always]' --rule 'array-element-newline: [2, {"minItems":0,"multiline": true}]' --rule 'indent: [2,2]' ${VRF_FILE_PATH}`)
  })
}
