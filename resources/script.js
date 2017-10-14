// Input your config
var config={
  host:"playground.qlik.com",
  prefix:"/playground/",
  port:"443",
  isSecure:true,
  rejectUnauthorized:false,
  apiKey:"CHANGE-ME",
  appname:"ca884155-3eff-4e30-a2a6-7d6c3a65d8cc"
};

var app

function authenticate() {
  Playground.authenticate(config)
}


function main() {
  require.config({
    baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
  })

  /**
   * Load the entry point for the Capabilities API family
   * See full documention: http://help.qlik.com/en-US/sense-developer/Subsystems/APIs/Content/MashupAPI/qlik-interface-interface.htm
   */

  require(['js/qlik'], function (qlik) {
    // We're now connected

    // Suppress Qlik error dialogs and handle errors how you like.
    qlik.setOnError(function (error) {
      console.log("qlik error", error)
    })

    // Open a dataset on the server.
    console.log("Connecting to appname: " + config.appname)
    app = qlik.openApp(config.appname, config)
    console.log(app)

    setupChart()
  })
}

function setupChart() {
  var hyperCubeDef = {
    qDimensions: [
      { qDef: { qFieldDefs: ["Country"] } },
    ],
    qMeasures: [
      { qDef: { qDef: "=Count(Title)" } }
    ],
    qInitialDataFetch: [{
      qTop: 0,
      qLeft: 0,
      qHeight: 3333,
      qWidth: 3
    }]
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

  function highlightFeature(feature) {
    return () => {
      window.info.update(feature.properties);
    }
  }

  function resetHighlight(feature) {
    return () => {
      window.info.update();
    };
}

  app.createCube(hyperCubeDef, function (hypercube) {
    const dataMatrix = hypercube.qHyperCube.qDataPages[0].qMatrix;
    const selectedCountries = dataMatrix.map((d) => d[0].qText.toLowerCase())
    $.getJSON("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json", (countries) => {
      const countriesLayer = L.geoJSON(countries, {
        style: (feature) => {
          const style = {
            color: "transparent",
          };
          const idx = selectedCountries.indexOf(feature.properties.name.toLowerCase());
          if (idx != -1) {
            console.log(feature);
            style.color = "green";
            feature.properties.numCommitments = 2;
          }

          return style;
        },
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: highlightFeature(feature),
            mouseout: resetHighlight(feature),
            click: () => app.field("Country").selectValues([feature.properties.name], true, true),
          });
        }
      }).addTo(window.map);
      window.countriesLayer && window.countriesLayer.remove();
      window.countriesLayer = countriesLayer;
    });
    console.log("Hypercube", hypercube.qHyperCube)

    window.grandTotal = hypercube.qHyperCube.qGrandTotalRow[0].qText;
  })
}
