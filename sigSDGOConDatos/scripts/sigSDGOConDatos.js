/******************************************************************
 * AUTOR:: Unbit Ltda
 * INFRAESTRUCTURA DE DATOS ESPACIALES MARÍTIMA, FLUVIAL Y COSTERA DE COLOMBIA
 * DIRECCIÓN GENERAL MARÍTIMA
* Modificado por Unbit Ltda para despliegue de informacion de datos de Series y Perfiles 

************************************************************/
require([
	"esri/Map",
	"esri/Basemap",
	"esri/views/MapView",
	"esri/layers/FeatureLayer",
	"esri/layers/GraphicsLayer",
	"esri/layers/KMLLayer",
	"esri/widgets/Sketch/SketchViewModel",
	"esri/smartMapping/statistics/uniqueValues",
	"esri/widgets/Sketch",
	'esri/geometry/Multipoint',
	'esri/symbols/PictureMarkerSymbol',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleLineSymbol',
	'esri/geometry/Point',
	'esri/PopupTemplate',
	'esri/Graphic',
	'esri/geometry/Extent',
	'esri/geometry/support/webMercatorUtils',
	'esri/intl',
	'esri/Color',
	'esri/geometry/SpatialReference',
	"esri/geometry/geometryEngine",
	"esri/rest/geometryService",
	"esri/rest/support/ProjectParameters",
	"esri/geometry/projection",
	//	"esri/core/watchUtils",
	"esri/core/reactiveUtils",
	"esri/config",
	"esri/request",
	"esri/layers/support/Field",
	"esri/widgets/LayerList",
	"esri/widgets/Expand",
	"esri/renderers/SimpleRenderer",
	"esri/widgets/CoordinateConversion"                                  
	//	"dojo/promise/all",
	//	"dojo/_base/lang",
	//	"dojo/_base/json"

], function(Map, Basemap, MapView, FeatureLayer, GraphicsLayer, KMLLayer, SketchViewModel,
	uniqueValues, Sketch, Multipoint, PictureMarkerSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Point, PopupTemplate,
	Graphic, Extent, webMercatorUtils, intl, Color, SpatialReference, geometryEngine, geometryService, ProjectParameters,
	projectionCli, reactiveUtils, esriConfig, esriRequest, Field, LayerList, Expand, SimpleRenderer,CoordinateConversion) { //,all,lang,dojoJson) {                                                                                                                        

	const graphicsLayer = new GraphicsLayer();
	const graphicsResultadoZoom = new GraphicsLayer({
		title: "graphicsResultadoZoom",
	});
	const graphicsInicial = new GraphicsLayer({
		title: "graphicsInicial",
	});
	const graphicsselect = new GraphicsLayer({
		title: "Graficos seleccionados",
	});
	const graphicsshape = new GraphicsLayer({
		title: "graphicsshape",
	});
	const graphicsshapeInter = new GraphicsLayer({
		title: "Seleccion de interseccion",
	});
	const graphicsTransectos = new GraphicsLayer({
		title: "Transectos",
	})
	const dateFormatIntlOptions = intl.convertDateFormatToIntlOptions("short-date");

	let SERVICE_SERIES_URL = "";
	let SERVICE_PERFILES_URL = "";
	let SERVICE_DMDATA_URL = "";
    let SERVICE_TRANSECTOS_URL = "";                             
	let linkmetadato = "";
	let whereinicial = "";
	let multiPointzoom = new Multipoint();
	let idsintersec = "";


    	let servidor = "idedimar";

//		let servidor = "desarrollo";


	//Produccion
	if (servidor === "idedimar") {
		SERVICE_SERIES_URL = "https://ide.dimar.mil.co/server/rest/services/CECOLDO/SIGODimar/FeatureServer/0";
		SERVICE_PERFILES_URL = "https://ide.dimar.mil.co/server/rest/services/CECOLDO/SIGODimar/FeatureServer/1";
		SERVICE_DMDATA_URL = "https://ide.dimar.mil.co/server/rest/services/CECOLDO/SIGODimar/FeatureServer/2";
		SERVICE_TRANSECTOS_URL = "https://ide.dimar.mil.co/server/rest/services/CECOLDO/SIGODimar/FeatureServer/3";
		linkmetadato = "https://cecoldo.dimar.mil.co/geonetwork/srv/spa/catalog.search#/metadata/";
		whereinicial = "(OpenData = 2 OR OpenData = 3) AND Estado = 'Terminado'";

	}
	




	//Desarrollo

	if (servidor === "desarrollo") {
		SERVICE_SERIES_URL = "https://localhost:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/0";
		SERVICE_PERFILES_URL = "https://localhost:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/1";                                                                                                         
		SERVICE_TRANSECTOS_URL = "https://localhost:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/4";
		SERVICE_DMDATA_URL = "https://localhost:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/5";
		linkmetadato = "https://cecoldo.dimar.mil.co/geonetwork/srv/spa/catalog.search#/metadata/";
		whereinicial = "(OpenData = 2 OR OpenData = 3) AND (Estado = 'Revision' OR Estado = 'Terminado') "; // AND Estado = 'Revision'";

	}



	let pasotodos = true;
	let buscaprimero = true;

	let contarinicial = true;
	let cargacombosini = true;
	let muestratabla = false;
	let wherest = "";
	let datossel = [];
	let datosfiltro = [];
	let datosall = [];
	let numsele = 0;
	let loading = null;
	let numerocombos = 10;
	let pagina;
	let whereunicos = "1=1";
	document.getElementById("applyQuery").style.display = "none";
	loading = document.getElementById("loadingImg");  //loading image. id


	//---------------------
	//Simbolos
	//---------------------
	let colorseries = new Color([0, 123, 193]);
	let colorperfiles = new Color([218, 65, 36]);
	let colorselect = new Color([255, 0, 0]);


	let highlightSymbol = {
		type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
		style: "circle",
		color: [0, 0, 255, 0.1],
		size: "30px",  // pixels
		outline: {  // autocasts as new SimpleLineSymbol()
			color: [255, 0, 0, 0.8],
			width: 3  // points
		}
	};

	let outSpatialReference = new SpatialReference({
		wkid: 4623 //Sphere_Sinusoidal
	});
	//	let multiPointgra = new Multipoint(outSpatialReference);
	//	let multiPointgraIni = new Multipoint(outSpatialReference);






	let symbolseries = {
		type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
		style: "circle",
		color: colorseries,
		size: "6px",  // pixels
		outline: {  // autocasts as new SimpleLineSymbol()
			color: colorseries,
			width: 0  // points
		}
	};

	let seriesRenderer = {
		type: "simple",  // autocasts as new SimpleRenderer()
		symbol: {
			type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
			style: "circle",
			color: colorseries,
			size: "6px",  // pixels
			outline: {  // autocasts as new SimpleLineSymbol()
				color: colorseries,
				width: 0  // points
			}
		}
	};

	let symbolperfiles = {
		type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
		style: "circle",
		color: colorperfiles,
		size: "6px",  // pixels
		outline: {  // autocasts as new SimpleLineSymbol()
			color: colorperfiles,
			width: 0  // points
		}
	};

	let perfilesRenderer = {
		type: "simple",  // autocasts as new SimpleRenderer()
		symbol: {
			type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
			style: "circle",
			color: colorperfiles,
			size: "6px",  // pixels
			outline: {  // autocasts as new SimpleLineSymbol()
				color: colorperfiles,
				width: 0  // points
			}
		}
	};

	let symbolseriesfiltro = {
		type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
		style: "circle",
		color: colorseries,
		size: "6px",  // pixels
		outline: {  // autocasts as new SimpleLineSymbol()
			color: colorseries,
			width: 0  // points
		}
	};

	let symbolperfilesfiltro = {
		type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
		style: "circle",
		color: colorperfiles,
		size: "6px",  // pixels
		outline: {  // autocasts as new SimpleLineSymbol()
			color: colorperfiles,
			width: 0  // points
		}
	};



	var basemapDimar = new Basemap({
		portalItem: {
			id: "d98286de41df4f80bd5948e96c8815f6" // WGS84 Streets Vector webmap Dimar
		}
	});

	var map = new Map({
		basemap: basemapDimar,
		layers: [graphicsLayer]
	});
	var view = new MapView({
		container: "viewDiv",
		map: map,
		center: [-79, 9],
		zoom: 5
	});

	map.add(graphicsInicial);
	map.add(graphicsResultadoZoom);
	map.add(graphicsselect);
	map.add(graphicsshapeInter);
	map.add(graphicsTransectos);
	esriConfig.request.trustedServers.push("https://ide.dimar.mil.co");


	view.when(() => {
		const sketch = new Sketch({
			layer: graphicsLayer,
			point: false,
			view: view,
			container: sketchDiv,
			// graphic will be selected as soon as it is created
			creationMode: "single"
		});

		sketch.visibleElements = {
			createTools: {
				point: false,
				circle: false,
				polyline: false,
				polygon: false
			},
			selectionTools: {
				"lasso-selection": false
			},
			settingsMenu: false
		}

		sketch.on("create", function(event) {
			// check if the create event's state has changed to complete indicating
			// the graphic create operation is completed.
			if (event.state === "complete") {
				let latLonExtent = new Extent();

				latLonExtent = webMercatorUtils.webMercatorToGeographic(event.graphic.geometry.extent);
				let xMin = latLonExtent.xmin;
				let yMin = latLonExtent.ymin;
				let xMax = latLonExtent.xmax;
				let yMax = latLonExtent.ymax;

				coordxmax.value = xMax;
				coordymax.value = yMax;
				coordxmin.value = xMin;
				coordymin.value = yMin;

			}
		});

		sketch.on("update", function(event) {
			// check if the create event's state has changed to complete indicating
			// the graphic create operation is completed.
			if (event.state === "complete") {
				let latLonExtent = new Extent();

				latLonExtent = webMercatorUtils.webMercatorToGeographic(event.graphics[0].geometry.extent);
				let xMin = latLonExtent.xmin;
				let yMin = latLonExtent.ymin;
				let xMax = latLonExtent.xmax;
				let yMax = latLonExtent.ymax;

				coordxmax.value = xMax;
				coordymax.value = yMax;
				coordxmin.value = xMin;
				coordymin.value = yMin;

			}
		});

		view.ui.add(sketch);

	});
	const layerList = new LayerList({
		view: view,
		icon: "layers",
		visibilityAppearance: "checkbox",
		listItemCreatedFunction: async function(event) {

			// The event object contains properties of the
			// layer in the LayerList widget.
			
			let item = event.item;

			// Wait for the layer to load and the item title to become available
			await item.layer.when();

			if (item.title === "graphicsResultadoZoom" || item.title === "" || item.title === "graphicsInicial") {
				// open the list item in the LayerList
				item.hidden = true;
			} else {
				// open the list item in the LayerList
				item.open = true;
				// set an action for zooming to the full extent of the layer
				item.actionsSections = [[{
					title: "Go to full extent",
					className: "esri-icon-zoom-out-fixed",
					id: "full-extent"
				}]];
			}
		}
	});

	const bgExpand = new Expand({
		view: view,
		content: layerList
	});

	// Add widget to the top right corner of the view
	view.ui.add(bgExpand, "top-left");
	
	const ccWidget = new CoordinateConversion({
          view: view
        });

       view.ui.add(ccWidget, "bottom-left");
	//	});

	// Display the loading indicator when the view is updating

	reactiveUtils.when(
		// getValue function
		() => view.updating === true,
		// Callback function
		() => {
			loadingImg.style.display = "inherit";
		}
	);

	// Hide the loading indicator when the view stops updating

	reactiveUtils.when(
		// getValue function
		() => view.updating === false,
		// Callback function
		() => {
			loadingImg.style.display = "none"
		}
	);

let valorTemporalcondatos = sessionStorage.getItem('terminosok');
console.log(valorTemporalcondatos);

	// ventana modal de aceptacion de terminos
	const modal = document.getElementById("example-modal");
	modal.closeButtonDisabled = true;
	modal.escapeDisabled = true;
	modal.outsideCloseDisabled = true;
	modal.onCalciteModalClose = function() { cerrarmodal() };
	modal.onCalciteModalBeforeClose = function() { cerrarmodal() };
	const ckbtnaceptar = document.getElementById("ckbtnaceptarcondatos")
	ckbtnaceptar.onchange = function() { aceptaterminos() };
	const ckbtnAreashp = document.getElementById("chkAreshp");
	ckbtnAreashp.onchange = cambiacombo;
	modal.open = true;
	const btncontinuar = document.getElementById("btncontinuar");
	btncontinuar.disabled = true;
	btncontinuar.addEventListener("click", function() {
        sessionStorage.setItem('terminosok', 'true');
		modal.open = false;
	});

if (valorTemporalcondatos == 'true'){
	modal.open = false;
}

	function cerrarmodal() {
		window.location.replace("https://cecoldo.dimar.mil.co");
	}

	function aceptaterminos() {
		if (ckbtnaceptar.checked) {
			btncontinuar.disabled = false;
		}
		else {
			btncontinuar.disabled = true;
		}
	}

	function showLoading() {
		loadingImg.style.display = "inherit";
		//document.getElementById("applyQuery").style.display = "none";

	}

	function hideLoading() {
		loadingImg.style.display = "none"
		//document.getElementById("applyQuery").style.display = "inherit";
	}

	const listNode = document.getElementById("articulosRel");
	var featureLayer = new FeatureLayer({
		//  url: "https://laptop-lpo3eh7r:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/5",
		url: SERVICE_DMDATA_URL,

		outFields: ["*"], // Return all fields so it can be queried client-side
		visible: false,
		popupTemplate: {
			// Enable a popup
			title: "{ID_CONJUNTO_DATOS}", // Show attribute value
			//"Autor: {AUTORES}; año de publicación: {AÑO}; Palabras claves de tema: {DISCIPLINA}, link Cecoldo: {LINK}"
			content: [{
				type: "fields",
				fieldInfos: [{
					fieldName: "ID_CONJUNTO_DATOS",
					label: "Conjunto de datos:"
				}, {
					fieldName: "Tipo_Datos",
					label: "Tipo_Datos:"
				}, {
					fieldName: "Parameters",
					label: "Parametros:"
				}, {
					fieldName: "DISCIPLINA",
					label: "Palabras claves de tema:"
				}, {
					fieldName: "GeoNetworkID",
					label: "link Cecoldo:"
				}]
			}]
		}
	});

	var featureLayerseries = new FeatureLayer({
		//   url: "https://laptop-lpo3eh7r:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/0",
		url: SERVICE_SERIES_URL,
		outFields: ["*"], // Return all fields so it can be queried client-side
		renderer: seriesRenderer,
		title: "Series",
		visible: false
	});
	var featureLayerperfiles = new FeatureLayer({
		//  url: "https://laptop-lpo3eh7r:6443/arcgis/rest/services/Dimar/datosdimar/FeatureServer/1",
		url: SERVICE_PERFILES_URL,
		outFields: ["*"], // Return all fields so it can be queried client-side
		renderer: perfilesRenderer,
		title: "Perfiles",
		visible: false
	});

	var featureLayertransectos = new FeatureLayer({
		url: SERVICE_TRANSECTOS_URL,
		//	url: SERVICE_PERFILES_URL,
		outFields: ["*"], // Return all fields so it can be queried client-side
		title: "Transectos",
		visible: false
	});
	map.add(featureLayerseries);
	map.add(featureLayerperfiles);


	// Carga los datos inicales de datos pagos

	cargadatosDB(whereinicial);
	featureLayer.definitionExpression = whereinicial;
	queryCount(whereinicial,false);                                                 
                                
	//	cargadatosIniciales(whereinicial);
	buscaprimero = false;

	//Add elements not spatial
	view.ui.add([atributesButton], "top-left");
	view.ui.add([queryDiv], "top-left");
	view.ui.add([spatialButton], "top-left");
	view.ui.add([queryLocDiv], "top-left");
	view.ui.add([resumen]);
	view.ui.add([List]);
	view.ui.add([btn_export], "bottom-right", "index: 0");
	//view.ui.add([btn_export], "bottom-right", "index: 0");
	view.ui.add({
		component: "btn_export",
		position: "bottom-trailing"
	})
	// resumen.ui.add(btn_export);


	btn_export.style.display = "none";
	applySolicitar.style.display = "none";







	//variables de combos
	let cbtipodato = document.getElementById("tipodatos");
	let cbtipodisciplina = document.getElementById("tipodisciplina");
	let cbtipoparametros = document.getElementById("tipoparametros");
	let cbtipoplataforma = document.getElementById("tipoplataforma");
	let cbtipopropietarios = document.getElementById("tipopropietarios");
	let cbtipoproyectos = document.getElementById("tipoproyectos");
	let cbtipopais = document.getElementById("tipopais");
	let cbtipoestacion = document.getElementById("tipoestacion");
	let cbtipofechaini = document.getElementById("tipofechaini");
	let cbtipofechafin = document.getElementById("tipofechafin");
	let ListResult = document.getElementById("List");
	//dinamic text
	let count = document.querySelector('#count');
	let counttotal = document.querySelector('#counttotal');
	let countDatos = document.querySelector('#countdatos');
	let countDatostotal = document.querySelector('#countdatostotal');
	let Numselected = document.querySelector('#numselected');
	let LabelCount = document.querySelector('#text-count');


	let LabelCounttotal = document.querySelector('#text-counttotal');
	let LabelCountDatos = document.querySelector('#text-countdatos');
	let LabelCountDatostotal = document.querySelector('#text-countdatostotal');
	let chkselall = document.getElementById("chkselall");
	//		chkselall.style.display = "none";  //desactivado temporalmente
	let coordxmax = document.getElementById("CoorXmax");
	let coordymax = document.getElementById("CoorYmax");
	let coordxmin = document.getElementById("CoorXmin");
	let coordymin = document.getElementById("CoorYmin");
    let wherecombos = "";                  
	chkselall.onchange = function() { seleccionatodo() };
	Numselected.textContent = 0;


	function armaquery(page) {
		numerocombos = 10;
		wherest = whereinicial + " AND ";
		if (cbtipodato.value != "Todos") {
			wherest = wherest + "Tipo_Datos = '" + cbtipodato.value + "' AND ";
		}
		if (cbtipodisciplina.value != "Todos") {
			wherest = wherest + "Disciplina = '" + cbtipodisciplina.value + "' AND ";
		}
		if (cbtipoparametros.value != "Todos") {
			wherest = wherest + "Parameters = '" + cbtipoparametros.value + "' AND ";
		}
		if (cbtipoplataforma.value != "Todos") {
			wherest = wherest + "Plataforma = '" + cbtipoplataforma.value + "' AND ";
		}
		if (cbtipopropietarios.value != "Todos") {
			wherest = wherest + "Institucion_propietaria like '%" + cbtipopropietarios.value + "%' AND ";
		}
		if (cbtipoproyectos.value != "Todos") {
			wherest = wherest + "Proyecto = '" + cbtipoproyectos.value + "' AND ";
		}
		if (cbtipopais.value != "Todos") {
			wherest = wherest + "Pais = '" + cbtipopais.value + "' AND ";
		}
		if (cbtipoestacion.value != "Todos") {
			wherest = wherest + "Estacion = '" + cbtipoestacion.value + "' AND ";
		}
		if (cbtipofechaini.value != "Todos") {
			var fechaini = new Date();
			fechaini = cbtipofechaini.value;

			wherest = wherest + "FechaIni >= DATE '" + fechaini + "' AND ";
		}
		if (cbtipofechafin.value != "Todos") {

			var myArray = cbtipofechafin.value.split("/");
			var ano = myArray[2];
			var mes = myArray[1];
			var day = myArray[0];
			//			var dayplus = parseInt(day, 10) + 1;
			var dayplus = parseInt(day, 10);
			//	var fechastr = ano + "/" + mes + "/" + dayplus + " 00:00:01";
			var fechastr = dayplus + "/" + mes + "/" + ano + " 00:00:01";

			var fechafin = new Date(fechastr);


			//  fechafin = cbtipofechafin.value;

			//			wherest = wherest + "FechaFin <= DATE '" + ano + "/" + mes + "/" + dayplus + "' AND ";
			wherest = wherest + "FechaFin <= DATE '" + dayplus + "/" + mes + "/" + ano + "' AND ";
		}

		if (document.getElementById("chkAreGeo").checked) {
			if (document.getElementById("CoorXmin").value == "" || document.getElementById("CoorYmin").value == "" ||
				document.getElementById("CoorXmax").value == "" || document.getElementById("CoorYmax").value == "") {
				alert("Los datos de coordenadas no deben estas vacios...");
				return
			}
			else {
				wherest = wherest + "XLocation >= " + document.getElementById("CoorXmin").value + " AND "; //measurement
				wherest = wherest + "XLocation <= " + document.getElementById("CoorXmax").value + " AND ";
				wherest = wherest + "YLocation >= " + document.getElementById("CoorYmin").value + " AND ";
				wherest = wherest + "YLocation <= " + document.getElementById("CoorYmax").value + " AND ";
			}
		}

		if (document.getElementById("chkAreshp").checked) {
			document.getElementById("inFile").style.display = "block";
		}
		else {
			//			document.getElementById("inFile").style.display = "none";
		}



		if (wherest.length > 4) {
			wherest = wherest.substring(0, wherest.length - 4);
		} else {
			if (pasotodos) {
				alert('No hay criterios de busqueda. se mostraran todos los datos. verifique');
				pasotodos = false;
			}
			wherest = whereinicial;
		}



		if (document.getElementById("chkAreshp").checked && idsintersec.length > 0) {
			wherest = wherest + " AND ID_CONJUNTO_DATOS in " + "(" + idsintersec.slice(0, -1) + ")";
		}

        return wherest;
  
  

	}



	function cargatablaDMDATA(expression, page) {
		featureLayer.definitionExpression = expression;

		featureLayer.queryFeatures({
			start: page,
			num: 20,
			//			outFields: ["*"],
			outFields: ["OBJECTID, ID_CONJUNTO_DATOS, GeoNetworkID, XLocation, YLocation, Tipo_Datos, Disciplina, Parameters, Plataforma, Institucion_propietaria, Proyecto, Pais, Estacion, FechaIni, FechaFin, Tarifa, Periocidad, Metodo_Medicion, Cantidad_datos"],
			returnGeometry: false,
			returnDistinctValues: true,
			where: expression,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(createtablaresultados, function(error) {
			console.error(error);
		});

		queryCount(expression);
		LabelCount.textContent = 'Ubicaciones geográficas (filtro):';
	}



	function createtablaresultados(results) {

		var idlibres = "";
		idlibres.length = 0;

		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}

		this.items = [];

		var multiPoint = new Multipoint(map.spatialreference);

		var numResults = results.features.length;
        var numDatos = 0;

		if (numResults > 0) {
			btn_export.style.display = "inherit";
		}
		else {
			btn_export.style.display = "none";
			List.style.display = "none";
		}

		if (numsele > 0) {
			applySolicitar.style.display = "inherit";
			//			btn_export.style.display = "inherit";
		}
		else {
			applySolicitar.style.display = "none";
			//			btn_export.style.display = "none";
		}

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["GeoNetworkID"] = results.features[j].attributes.GeoNetworkID;
			attr["Tipo_Datos"] = results.features[j].attributes.Tipo_Datos;
			attr["Parameters"] = results.features[j].attributes.Parameters;
			attr["XLocation"] = results.features[j].attributes.XLocation;
			attr["YLocation"] = results.features[j].attributes.YLocation;
			attr["Pais"] = results.features[j].attributes.Pais;
			attr["Institucion_propietaria"] = results.features[j].attributes.Institucion_propietaria;
			attr["Proyecto"] = results.features[j].attributes.Proyecto;
			attr["Plataforma"] = results.features[j].attributes.Plataforma;
			attr["Tarifa"] = results.features[j].attributes.Tarifa;
			attr["Periocidad"] = results.features[j].attributes.Periocidad;
			attr["Disciplina"] = results.features[j].attributes.Disciplina;
			attr["Metodo_Medicion"] = results.features[j].attributes.Metodo_Medicion;
			attr["FechaIni"] = results.features[j].attributes.FechaIni;
			attr["FechaFin"] = results.features[j].attributes.FechaFin;
			attr["CantidadDatos"] = results.features[j].attributes.Cantidad_datos;



			if (results.features[j].attributes.Tipo_Datos == "Serie") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			}
			else if (results.features[j].attributes.Tipo_Datos == "Perfil") {
			//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;

			} else if (results.features[j].attributes.Tipo_Datos == "Mediciones discretas") {

				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;

			} else if (results.features[j].attributes.Tipo_Datos == "Series de Perfil" || results.features[j].attributes.Tipo_Datos == "Series de perfil") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			} else {
				var DatoSymbol = symbolperfiles;
			}

			//       	 var DatoSymbol = new esri.symbol.PictureMarkerSymbol('/sigSDGO/images/logoDimar.png', 22, 22);
			//	 var DatoSymbol = this.marker
			var Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))


			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "Conjunto de datos: {ID_CONJUNTO_DATOS}";
			var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
			pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
				"<ul><li>Disciplina: {Disciplina}</li>" +
				"<li>Parámetros: {Parameters} </li>" +
				"<li>Plataforma: {Plataforma}</li>" +
				"<li>Propietario: {Institucion_propietaria}</li>" +
				"<li>Proyecto: {Proyecto}</li>" +
				"<li>País de Muestreo: {Pais}</li>" +
                "<li>Localización: {XLocation},{YLocation}</li>" +                                       
				"<a href= " + linkmetadatoref + "  target='_blank'>Ver metadato.</a>" +
				"<ul>";
			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);



			pintardatosunicos("ID_CONJUNTO_DATOS = " + results.features[j].attributes.ID_CONJUNTO_DATOS);

			//	graphicsResultadoZoom.add(pointGraphic);
			multiPoint.addPoint(pointGraphic.geometry);

		}

		

		CreateListunique(graphicsResultadoZoom);
		view.goTo(multiPoint.extent);



	}



	function cargadatosdescarga(expression) {
		featureLayer.definitionExpression = expression;

		featureLayer.queryFeatures({
			//			outFields: ["*"],
			outFields: ["OBJECTID, ID_CONJUNTO_DATOS, GeoNetworkID, XLocation, YLocation, Tipo_Datos, Disciplina, Parameters, Plataforma, Institucion_propietaria, Proyecto, Pais, Estacion, FechaIni, FechaFin, Tarifa, Periocidad, Metodo_Medicion, Cantidad_datos"],
			returnGeometry: true,
			returnDistinctValues: true,
			where: expression,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(createresultadosdescarga, function(error) {
			console.error(error);
		});
		queryCount(expression,false);
		LabelCount.textContent = 'Ubicaciones geográficas (filtro):';
		LabelCountDatos.textContent = 'Cantidad de datos (filtro):';
	}
	function createresultadosdescarga(results) {

		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}

		//	  if (graphicsInicial.graphics.length > 0) {
		//			graphicsInicial.removeAll();
		//		}


		var numResults = results.features.length;
		var numDatos = 0;
		var multiPointgra = new Multipoint(map.spatialreference);

		attr = {};
		datosfiltro = [];
		datosfiltro.push(["OBJECTID", "ID_CONJUNTO_DATOS", "Link metadato", "Tipo de Dato", "Parámetros",
			"Coordenada X", "Coordenada Y", "País de Muestreo", "Institución Propietaria", "Proyecto o Iniciativa", "Plataforma", "Tarifa", "Periodicidad", "Disciplina", "Método de Medición"])

		for (var j = 0; j < numResults; j++) {

			datosall.push(parseInt(results.features[j].attributes.ID_CONJUNTO_DATOS));
			var linkmetadatostr = linkmetadato + results.features[j].attributes.GeoNetworkID;
			datosfiltro.push([
				results.features[j].attributes.OBJECTID,
				results.features[j].attributes.ID_CONJUNTO_DATOS,
				linkmetadatostr,
				results.features[j].attributes.Tipo_Datos,
				results.features[j].attributes.Parameters,
				results.features[j].attributes.XLocation,
				results.features[j].attributes.YLocation,
				results.features[j].attributes.Pais,
				results.features[j].attributes.Institucion_propietaria,
				results.features[j].attributes.Proyecto,
				results.features[j].attributes.Plataforma,
				results.features[j].attributes.Tarifa,
				results.features[j].attributes.Periocidad,
				results.features[j].attributes.Disciplina,
				results.features[j].attributes.Metodo_Medicion])
			//			if (results.features[j].attributes.Tipo_Datos == "Serie") {
			//				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			//			}
			//			else {
			//				var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
			//
			//			}

			if (results.features[j].attributes.Tipo_Datos == "Serie") {
				var DatoSymbol = symbolseriesfiltro
			}
			else {
				var DatoSymbol = symbolperfilesfiltro

			}
			if (isNumber(results.features[j].attributes.Cantidad_datos)) {
				numDatos = numDatos + results.features[j].attributes.Cantidad_datos;
			}
			//			console.log("filtro= " + numDatos);

			let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))
			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "";
			pointInfoTemplate.content = "";
			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);
			graphicsResultadoZoom.add(pointGraphic);
			multiPointgra.addPoint(pointGraphic.geometry);

		}
		countDatos.textContent = numDatos;
		view.goTo(multiPointgra.extent);
		if (muestratabla) {
			//	CreateList(graphicsResultadoZoom);
			CreateListunique(graphicsResultadoZoom);
			btn_export.style.display = "inherit";
   
		}
        else {
			btn_export.style.display = "none";
		}

	}

	function cargadatosDB(wherest) {


		let url = "consultaDMDATA?sqlwhere=" + wherest;

		esriRequest(url, {
			responseType: "json"
		}).then(createresultadosinicialesDB, function(error) {
			console.error(error);
		});


	};

	function cargadatosIniciales(expression) {
		featureLayer.definitionExpression = expression;


		if (document.getElementById("chkAreshp").checked) {

			featureLayer.queryFeatures({
				outFields: ["ID_CONJUNTO_DATOS", "Parameters", "GeoNetworkID", "Tipo_Datos", "FechaIni", "FechaFin", "Pais", "Institucion_propietaria", "XLocation", "YLocation", "Proyecto", "Plataforma",  "Cantidad_datos"],
				returnGeometry: false,
				returnDistinctValues: true,
				where: expression,
				orderByFields: ["ID_CONJUNTO_DATOS"]
			}).then(createresultadosinicialesshp, function(error) {
				console.error(error);
			});

		} else {

			featureLayer.queryFeatures({
				outFields: ["ID_CONJUNTO_DATOS", "Parameters", "GeoNetworkID", "Tipo_Datos", "FechaIni", "FechaFin", "Pais", "Institucion_propietaria", "XLocation", "YLocation", "Proyecto", "Plataforma",  "Cantidad_datos"],
				returnGeometry: false,
				returnDistinctValues: true,
				where: expression,
				orderByFields: ["ID_CONJUNTO_DATOS"]
			}).then(createresultadosiniciales, function(error) {
				console.error(error);
			});
		}
	}

	function createresultadosiniciales(results) {

		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsshapeInter.graphics.length > 0) {
			graphicsshapeInter.removeAll();
		}
		if (graphicsTransectos.graphics.length > 0) {
			graphicsTransectos.removeAll();
		}



		var numResults = results.features.length;
		var numDatos = 0;

		var multiPointgraIni = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["GeoNetworkID"] = results.features[j].attributes.GeoNetworkID;
			attr["Tipo_Datos"] = results.features[j].attributes.Tipo_Datos;
			attr["Parameters"] = results.features[j].attributes.Parameters;
			attr["XLocation"] = results.features[j].attributes.XLocation;
			attr["YLocation"] = results.features[j].attributes.YLocation;
			attr["Pais"] = results.features[j].attributes.Pais;
			attr["Institucion_propietaria"] = results.features[j].attributes.Institucion_propietaria;
			attr["Proyecto"] = results.features[j].attributes.Proyecto;
			attr["Plataforma"] = results.features[j].attributes.Plataforma;
			attr["Tarifa"] = results.features[j].attributes.Tarifa;
			attr["Periocidad"] = results.features[j].attributes.Periocidad;
			attr["Disciplina"] = results.features[j].attributes.Disciplina;
			attr["Metodo_Medicion"] = results.features[j].attributes.Metodo_Medicion;
			attr["FechaIni"] = results.features[j].attributes.FechaIni;
			attr["FechaFin"] = results.features[j].attributes.FechaFin;
			attr["CantidadDatos"] = results.features[j].attributes.Cantidad_datos;
			if (isNumber(results.features[j].attributes.Cantidad_datos)) {
				numDatos = numDatos + results.features[j].attributes.Cantidad_datos;
			}
			//			console.log("inicial= " + numDatos);
			if (results.features[j].attributes.Tipo_Datos == "Serie") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			}
			else if (results.features[j].attributes.Tipo_Datos == "Perfil") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;

			} else if (results.features[j].attributes.Tipo_Datos == "Mediciones discretas") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;
			} else if (results.features[j].attributes.Tipo_Datos == "Series de Perfil" || results.features[j].attributes.Tipo_Datos == "Series de perfil") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			} else if (results.features[j].attributes.Tipo_Datos == "Transectos") {
				generatransectosDB(results.features[j].attributes.ID_CONJUNTO_DATOS);
//				generatransectos(results.features[j].attributes.ID_CONJUNTO_DATOS);
			} else {
				var DatoSymbol = symbolperfiles;
			}

			let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))
			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "Datos Abiertos: {ID_CONJUNTO_DATOS}";
			var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
			pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
				"<ul><li>Disciplina: {Disciplina}</li>" +
				"<li>Parámetros: {Parameters} </li>" +
				"<li>Plataforma: {Plataforma}</li>" +
				"<li>Propietario: {Institucion_propietaria}</li>" +
				"<li>Proyecto: {Proyecto}</li>" +
				"<li>País de Muestreo: {Pais}</li>" +
				"<li>Localización: {XLocation},{YLocation}</li>" +                                                       
				"<a href= " + linkmetadatoref + "  target='_blank'>Ver metadato.</a>" +
				//      "<a href= {GeoNetworkID}  target='_blank'>Ver Medadato.</a>"
				"<ul>";
			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);

			if (results.features[j].attributes.Tipo_Datos != "Transectos") {
				graphicsInicial.add(pointGraphic);
			}
			multiPointgraIni.addPoint(pointGraphic.geometry);



		}


		if (contarinicial) {
			//			queryCount(whereinicial);
			countDatostotal.textContent = numDatos;
			counttotal.textContent = numResults;
			contarinicial = false;
		} else {
			countDatos.textContent = numDatos;
			if (multiPointgraIni.points.length > 0) {
				view.goTo(multiPointgraIni.extent);
			}

		}

		//		view.goTo(multiPointgraIni.extent);
		if (muestratabla) {
			//	CreateList(graphicsInicial);
			CreateListunique(graphicsResultadoZoom,wherecombos,0);
			btn_export.style.display = "inherit";
		} else {
			btn_export.style.display = "none";
		}

	}

	async function createresultadosinicialesshp(results) {

		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsshapeInter.graphics.length > 0) {
			graphicsshapeInter.removeAll();
		}

		if (graphicsTransectos.graphics.length > 0) {
			graphicsTransectos.removeAll();
		}

		idsintersec = "";

		var numResults = results.features.length;
		var numDatos = 0;

		var multiPointgraIni = new Multipoint();


		//				 var featuresset = await getfeatureset();

		layershape = "";
		const layersall = map.layers;
		for (var j = 0; j < layersall.length; j++) {

			if (layersall.items[j].title == "Archivo Shape File") {
				layershape = layersall.items[j];
			}
		}

		var outSpatialReference = new SpatialReference({
			wkid: 4623, //Sphere_Sinusoidal
		});

		var query = layershape.createQuery();
		query.returnGeometry = true;
		query.outFields = ["*"];

		var poligonos = await layershape.queryFeatures(query);


		poligonos.features.forEach(function(feature) {
			const params = new ProjectParameters({
				geometries: [feature.geometry],
				outSpatialReference: outSpatialReference
			});
			const url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
			geometryService.project(url, params).then(function(response) {
				var poligonoproyectado = response;


				var numResults = results.features.length;
				var numDatos = 0;

				var multiPointgraIni = new Multipoint();
                var numselectinter = 0;           

				for (var j = 0; j < numResults; j++) {

					attr = {};

					let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))

					var doesContain = poligonoproyectado[0].contains(Datopoint);
					if (poligonoproyectado[0].contains(Datopoint)) {
						idsintersec = idsintersec + results.features[j].attributes.ID_CONJUNTO_DATOS + ",";
						attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
						attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.ID_CONJUNTO_DATOS;
						attr["GeoNetworkID"] = results.features[j].attributes.GeoNetworkID;
						attr["Tipo_Datos"] = results.features[j].attributes.Tipo_Datos;
						attr["Parameters"] = results.features[j].attributes.Parameters;
						attr["XLocation"] = results.features[j].attributes.XLocation;
						attr["YLocation"] = results.features[j].attributes.YLocation;
						attr["Pais"] = results.features[j].attributes.Pais;
						attr["Institucion_propietaria"] = results.features[j].attributes.Institucion_propietaria;
						attr["Proyecto"] = results.features[j].attributes.Proyecto;
						attr["Plataforma"] = results.features[j].attributes.Plataforma;
						attr["Tarifa"] = results.features[j].attributes.Tarifa;
						attr["Periocidad"] = results.features[j].attributes.Periocidad;
						attr["Disciplina"] = results.features[j].attributes.Disciplina;
						attr["Metodo_Medicion"] = results.features[j].attributes.Metodo_Medicion;
						attr["FechaIni"] = results.features[j].attributes.FechaIni;
						attr["FechaFin"] = results.features[j].attributes.FechaFin;
						attr["CantidadDatos"] = results.features[j].attributes.Cantidad_datos;
						if (isNumber(results.features[j].attributes.Cantidad_datos)) {
							numDatos = numDatos + results.features[j].attributes.Cantidad_datos;
						}
						//			console.log("inicial= " + numDatos);
						if (results.features[j].attributes.Tipo_Datos == "Serie") {
							var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
						}
						else if (results.features[j].attributes.Tipo_Datos == "Perfil") {
						//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				         var DatoSymbol = symbolperfiles;

						} else if (results.features[j].attributes.Tipo_Datos == "Mediciones discretas") {
						//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				         var DatoSymbol = symbolperfiles;;
						} else if (results.features[j].attributes.Tipo_Datos == "Series de Perfil" || results.features[j].attributes.Tipo_Datos == "Series de perfil") {
							var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
						} else if (results.features[j].attributes.Tipo_Datos == "Transectos") {
							generatransectos(results.features[j].attributes.ID_CONJUNTO_DATOS);
						} else {
							var DatoSymbol = symbolperfiles;
						}

						let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))
						var pointInfoTemplate = new PopupTemplate("Datos");
						pointInfoTemplate.title = "Datos Abiertos: {ID_CONJUNTO_DATOS}";
						var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
						pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
							"<ul><li>Disciplina: {Disciplina}</li>" +
							"<li>Parámetros: {Parameters} </li>" +
							"<li>Plataforma: {Plataforma}</li>" +
							"<li>Propietario: {Institucion_propietaria}</li>" +
							"<li>Proyecto: {Proyecto}</li>" +
							"<li>País de Muestreo: {Pais}</li>" +
							"<li>Localización: {XLocation},{YLocation}</li>" +
							"<a href= " + linkmetadatoref + "  target='_blank'>Ver metadato.</a>" +
							//      "<a href= {GeoNetworkID}  target='_blank'>Ver Medadato.</a>"
							"<ul>";





						var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);

						if (results.features[j].attributes.Tipo_Datos != "Transectos") {
							graphicsshapeInter.add(pointGraphic);
						}
						multiPointgraIni.addPoint(pointGraphic.geometry);



                    numselectinter = numselectinter + 1;
					} // del if (poligonoproyectado[0].contains(Datopoint)) 




				}   // del for (var j = 0; j < numResults; j++)


			count.textContent = numselectinter    //numFeatures;


			document.getElementById("tablePager")
				.setAttribute("total-items", numselectinter);                                              

				if (contarinicial) {
					//			queryCount(whereinicial);
					countDatostotal.textContent = numDatos;
					counttotal.textContent = numResults;
					contarinicial = false;
				} else {
					countDatos.textContent = numDatos;
					if (multiPointgraIni.points.length > 0) {
						view.goTo(multiPointgraIni.extent);
					}

				}

				//		view.goTo(multiPointgraIni.extent);
				if (muestratabla) {
					//	CreateList(graphicsInicial);
					queryCount(wherest);
					//            pagina = page;
                   CreateListuniqueInter(graphicsshapeInter,wherecombos,0);
					btn_export.style.display = "inherit";


				} else {
					btn_export.style.display = "none";
				}







			});

		});

	}  //de la funtion


	async function getfeatureset() {
		var result = await new Promise(function(resolve) {
			const interval = setInterval(function() {
				if (typeof features !== 'undefined') {
					clearInterval(interval);
					layershape = "";
					const layersall = map.layers;
					for (var j = 0; j < layersall.length; j++) {
						if (layersall.items[j].title == "Archivo Shape File") {
							layershape = layersall.items[j];
						}
					}
					var query = layershape.createQuery();
					query.returnGeometry = true;
					query.outFields = ["*"];

					layershape.queryFeatures(query).then(function(result) {

						features = result.featuresset;
					});
				}
			}, 250);
		});
		return result;
	}

	function createresultadosinicialesDB(results) {

		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}

		var numResults = results.data.length;
		var numDatos = 0;

		var multiPointgraIni = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.data[j].objectid;
			attr["ID_CONJUNTO_DATOS"] = results.data[j].idConjuntoDatos;
			attr["GeoNetworkID"] = results.data[j].geoNetworkID;
			attr["Tipo_Datos"] = results.data[j].Tipo_Datos;
			attr["Parameters"] = results.data[j].Parameters;
			attr["XLocation"] = results.data[j].XLocation;
			attr["YLocation"] = results.data[j].YLocation;
			attr["Pais"] = results.data[j].pais;
			attr["Institucion_propietaria"] = results.data[j].institucion_propietaria;
			attr["Proyecto"] = results.data[j].proyecto;
			attr["Plataforma"] = results.data[j].plataforma;
			attr["Tarifa"] = results.data[j].tarifa;
			attr["Periocidad"] = results.data[j].Periocidad;
			attr["Disciplina"] = results.data[j].disciplina;
			attr["Metodo_Medicion"] = results.data[j].metotipo_Datosdo_Medicion;
			attr["FechaIni"] = results.data[j].fechaIni;
			attr["FechaFin"] = results.data[j].fechafin;
			attr["CantidadDatos"] = results.data[j].cantidad_datos;
			if (isNumber(results.data[j].cantidad_datos)) {
				numDatos = numDatos + results.data[j].cantidad_datos;
			}
			//			console.log("inicial= " + numDatos);
			if (results.data[j].tipo_Datos == "Serie") {
				var DatoSymbol = symbolseries
			}
			else {
				var DatoSymbol = symbolperfiles

			}

			let Datopoint = new Point(results.data[j].XLocation, results.data[j].YLocation, new SpatialReference({ wkid: 4326 }))
			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "Datos Abiertos: {ID_CONJUNTO_DATOS}";
			var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
			pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
				"<ul><li>Disciplina: {Disciplina}</li>" +
				"<li>Parámetros: {Parameters} </li>" +
				"<li>Plataforma: {Plataforma}</li>" +
				"<li>Propietario: {Institucion_propietaria}</li>" +
				"<li>Proyecto: {Proyecto}</li>" +
				"<li>País de Muestreo: {Pais}</li>" +
				"<li>Localización: {XLocation},{YLocation}</li>" +                                                       
				"<a href= " + linkmetadatoref + "  target='_blank'>Ver metadato.</a>" +
				//      "<a href= {GeoNetworkID}  target='_blank'>Ver Medadato.</a>"
				"<ul>";
			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);


			// Revisa la interseccon con el shape file del usuario

			//			const layershape = featureCollection.layers.map((layer) => {
			//				if (layer.title = "Archivo Shape File"){
			//					return layer
			//				}
			//				
			//				});
			//			
			//			if (layershape.featureSet.features.length > 0 &&
			//			    dijit.byId("chkAreshp").get("checked") ) 
			//               {
			//					console.log("Entro interseccion");	
			//				}
			//			 else {
			//				   console.log("Entro interseccion");	
			//				}




			graphicsInicial.add(pointGraphic);
			multiPointgraIni.addPoint(pointGraphic.geometry);




		}


		if (contarinicial) {
			//			queryCount(whereinicial);
			countDatostotal.textContent = numDatos;
			counttotal.textContent = numResults;
			contarinicial = false;
		} else {
			countDatos.textContent = numDatos;
			if (multiPointgraIni.points.length > 0) {
				view.goTo(multiPointgraIni.extent);
			}
		}

		//		view.goTo(multiPointgraIni.extent);
		if (muestratabla) {
			//	CreateList(graphicsInicial);
			CreateListunique(graphicsInicial,wherecombos);
			btn_export.style.display = "inherit"; 
		} 
        else {
			btn_export.style.display = "none";
		}

	}
	function datosseleccionado(expression) {
		featureLayer.definitionExpression = expression;

		featureLayer.queryFeatures({
			//			outFields: ["*"],
			outFields: ["OBJECTID, ID_CONJUNTO_DATOS, GeoNetworkID, XLocation, YLocation, Tipo_Datos, Disciplina, Parameters, Plataforma, Institucion_propietaria, Proyecto, Pais, Estacion, FechaIni, FechaFin, Tarifa, Periocidad, Metodo_Medicion, Cantidad_datos"],
			returnGeometry: false,
			where: expression,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(resultadosseleccionado, function(error1) {
			console.error(error1);
		});
		//      queryCount();
		//      LabelCount.textContent = 'Ubicaciones geográficas:';
	}


	function resultadosseleccionado(results) {

		//		if (graphicsInicial.graphics.length > 0) {
		//			graphicsInicial.removeAll();
		//		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}

		var numResults = results.features.length;
		var numDatos = 0;

		var multiPointgraIni = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["GeoNetworkID"] = results.features[j].attributes.GeoNetworkID;
			attr["Tipo_Datos"] = results.features[j].attributes.Tipo_Datos;
			attr["Parameters"] = results.features[j].attributes.Parameters;
			attr["XLocation"] = results.features[j].attributes.XLocation;
			attr["YLocation"] = results.features[j].attributes.YLocation;
			attr["Pais"] = results.features[j].attributes.Pais;
			attr["Institucion_propietaria"] = results.features[j].attributes.Institucion_propietaria;
			attr["Proyecto"] = results.features[j].attributes.Proyecto;
			attr["Plataforma"] = results.features[j].attributes.Plataforma;
			attr["Tarifa"] = results.features[j].attributes.Tarifa;
			attr["Periocidad"] = results.features[j].attributes.Periocidad;
			attr["Disciplina"] = results.features[j].attributes.Disciplina;
			attr["Metodo_Medicion"] = results.features[j].attributes.Metodo_Medicion;
			attr["FechaIni"] = results.features[j].attributes.FechaIni;
			attr["FechaFin"] = results.features[j].attributes.FechaFin;
			attr["CantidadDatos"] = results.features[j].attributes.Cantidad_datos;
			if (isNumber(results.features[j].attributes.Cantidad_datos)) {
				numDatos = numDatos + results.features[j].attributes.Cantidad_datos;
			}
			//			console.log("inicial= " + numDatos);
			if (results.features[j].attributes.Tipo_Datos == "Serie") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			}
			else if (results.features[j].attributes.Tipo_Datos == "Perfil") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;

			} else if (results.features[j].attributes.Tipo_Datos == "Mediciones discretas") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;
			} else if (results.features[j].attributes.Tipo_Datos == "Series de Perfil" || results.features[j].attributes.Tipo_Datos == "Series de perfil") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			} else {
				var DatoSymbol = symbolperfiles;
			}

			let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))
			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "Datos Abiertos: {ID_CONJUNTO_DATOS}";
			var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
			pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
				"<ul><li>Disciplina: {Disciplina}</li>" +
				"<li>Parámetros: {Parameters} </li>" +
				"<li>Plataforma: {Plataforma}</li>" +
				"<li>Propietario: {Institucion_propietaria}</li>" +
				"<li>Proyecto: {Proyecto}</li>" +
				"<li>País de Muestreo: {Pais}</li>" +
				"<li>Localización: {XLocation},{YLocation}</li>" +
				"<a href= " + linkmetadatoref + "  target='_blank'>Ver Metadato.</a>" +
				//      "<a href= {GeoNetworkID}  target='_blank'>Ver Medadato.</a>"
				"<ul>";

			var pointGraphicsel = new Graphic(Datopoint, highlightSymbol, attr, pointInfoTemplate);
			//			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);
			graphicsselect.add(pointGraphicsel);
			//			ggraphicsResultadoZoom.add(pointGraphic);
			multiPointgraIni.addPoint(pointGraphicsel.geometry);

		}

		if (multiPointgraIni.points.length > 0) {
			view.goTo(multiPointgraIni.extent);
             view.zoom = 5;    
		}
	}


	function pintardatosunicos(expression) {
		featureLayer.definitionExpression = expression;

		featureLayer.queryFeatures({
			//			outFields: ["*"],
			outFields: ["OBJECTID, ID_CONJUNTO_DATOS, GeoNetworkID, XLocation, YLocation, Tipo_Datos, Disciplina, Parameters, Plataforma, Institucion_propietaria, Proyecto, Pais, Estacion, FechaIni, FechaFin, Tarifa, Periocidad, Metodo_Medicion, CantidadDatos"],
			returnGeometry: false,
			where: expression,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(resultadospintarunicos, function(error1) {
			console.error(error);
		});
		//      queryCount();
		//      LabelCount.textContent = 'Ubicaciones geográficas:';
	}


	function resultadospintarunicos(results) {

		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		//		if (graphicsselect.graphics.length > 0) {
		//			graphicsselect.removeAll();
		//		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}

		var numResults = results.features.length;
		var numDatos = 0;

		//		var multiPointgraIni = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["GeoNetworkID"] = results.features[j].attributes.GeoNetworkID;
			attr["Tipo_Datos"] = results.features[j].attributes.Tipo_Datos;
			attr["Parameters"] = results.features[j].attributes.Parameters;
			attr["XLocation"] = results.features[j].attributes.XLocation;
			attr["YLocation"] = results.features[j].attributes.YLocation;
			attr["Pais"] = results.features[j].attributes.Pais;
			attr["Institucion_propietaria"] = results.features[j].attributes.Institucion_propietaria;
			attr["Proyecto"] = results.features[j].attributes.Proyecto;
			attr["Plataforma"] = results.features[j].attributes.Plataforma;
			attr["Tarifa"] = results.features[j].attributes.Tarifa;
			attr["Periocidad"] = results.features[j].attributes.Periocidad;
			attr["Disciplina"] = results.features[j].attributes.Disciplina;
			attr["Metodo_Medicion"] = results.features[j].attributes.Metodo_Medicion;
			attr["FechaIni"] = results.features[j].attributes.FechaIni;
			attr["FechaFin"] = results.features[j].attributes.FechaFin;
			attr["CantidadDatos"] = results.features[j].attributes.Cantidad_datos;
			if (isNumber(results.features[j].attributes.Cantidad_datos)) {
				numDatos = numDatos + results.features[j].attributes.Cantidad_datos;
			}
			//			console.log("inicial= " + numDatos);
			if (results.features[j].attributes.Tipo_Datos == "Serie") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			}
			else if (results.features[j].attributes.Tipo_Datos == "Perfil") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;

			} else if (results.features[j].attributes.Tipo_Datos == "Mediciones discretas") {
				//	var DatoSymbol = new PictureMarkerSymbol('images/Perfil.png', 22, 22);
				var DatoSymbol = symbolperfiles;
			} else if (results.features[j].attributes.Tipo_Datos == "Series de Perfil" || results.features[j].attributes.Tipo_Datos == "Series de perfil") {
				var DatoSymbol = new PictureMarkerSymbol('images/Serie.png', 22, 22);
			} else {
				var DatoSymbol = symbolperfiles;
			}

			let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))
			var pointInfoTemplate = new PopupTemplate("Datos");
			pointInfoTemplate.title = "Datos Abiertos: {ID_CONJUNTO_DATOS}";
			var linkmetadatoref = linkmetadato + "{GeoNetworkID}"
			pointInfoTemplate.content = "<p>Tipo de dato: <b>{Tipo_Datos}</b> </p>" +
				"<ul><li>Disciplina: {Disciplina}</li>" +
				"<li>Parámetros: {Parameters} </li>" +
				"<li>Plataforma: {Plataforma}</li>" +
				"<li>Propietario: {Institucion_propietaria}</li>" +
				"<li>Proyecto: {Proyecto}</li>" +
				"<li>País de Muestreo: {Pais}</li>" +
				"<li>Localización: {XLocation},{YLocation}</li>" +                                                       
				"<a href= " + linkmetadatoref + "  target='_blank'>Ver Metadato.</a>" +
				//      "<a href= {GeoNetworkID}  target='_blank'>Ver Medadato.</a>"
				"<ul>";

			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);
			//			var pointGraphic = new Graphic(Datopoint, DatoSymbol, attr, pointInfoTemplate);
			graphicsResultadoZoom.add(pointGraphic);
			multiPointzoom.addPoint(pointGraphic.geometry)
			//			multiPointgraIni.addPoint(pointGraphic.geometry);

		}

		//	view.goTo(multiPointgraIni.extent);
	}



	function pintardatosunicosInter(expression) {
		featureLayer.definitionExpression = expression;

		featureLayer.queryFeatures({
			//			outFields: ["*"],
			outFields: ["OBJECTID, ID_CONJUNTO_DATOS, GeoNetworkID, XLocation, YLocation, Tipo_Datos, Disciplina, Parameters, Plataforma, Institucion_propietaria, Proyecto, Pais, Estacion, FechaIni, FechaFin, Tarifa, Periocidad, Metodo_Medicion, Cantidad_datos"],
			returnGeometry: false,
			where: expression,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(resultadospintarunicosInter, function(error1) {
			console.error(error);
		});
		//      queryCount();
		//      LabelCount.textContent = 'Ubicaciones geográficas:';
	}


	// ************************************************************************

	// ************************************************************************
	document
		.getElementById("tablePager")
		.addEventListener("calcitePaginationChange", (event) => {
			let page;
			if (event.target.startItem === 1) {
				page = 0;
			} else {
				page = event.target.startItem;
				pagina = page;
			}

                             
   			let wherecombos = armaquery();
            CreateListunique(graphicsInicial,wherecombos,page);                                                            
			if (chkselall.checked) {
				prendechecks();
			}
			else {
				//   llenaselecionados();
			}

//			applyQuery(page);

		});


	function prendechecks() {
		let checkboxes = document.getElementsByName('seleccionado');
		for (var checkbox of checkboxes) {
			if (checkbox.checked) {
				
			}else {
			checkbox.checked = true;
			cuentaseleccionados(checkbox.id) ;	
			}
 
		}

	}

	function apagachecks() {
		let checkboxes = document.getElementsByName('seleccionado');
		for (var checkbox of checkboxes) {
			checkbox.checked = false;
			cuentaseleccionados(checkbox.id) ;
		}

	}

	function llenaselecionados() {

		let checkboxes = document.getElementsByName('seleccionado');
		for (var checkbox of checkboxes) {
			if (checkbox.checked) {
				existe = verificaseleccionado(checkbox.id);
				if (existe.length > 0) {

				} else {
					datossel.push(checkbox.id);
				}
			}
			else {
				existe = verificaseleccionado(checkbox.id);
				if (existe.length > 0) {
					datossel = arrayRemove(datossel, checkbox.id)
				} else {

				}
			}
		}

	}

	function cuentaseleccionados(idcheck) {

		let checksel = document.getElementById(idcheck);

		if (checksel.checked) {
			datossel.push(checksel.id);
			numsele = numsele + 1;
		}
		else {
			numsele = numsele - 1;
			datossel = arrayRemove(datossel, checksel.id)
		}

		Numselected.textContent = numsele;

		if (numsele > 0) {
			applySolicitar.style.display = "inherit";
			//			btn_export.style.display = "inherit";
		}
		else {
			applySolicitar.style.display = "none";
			//			btn_export.style.display = "none";
		}

	}

	function seleccionatodo() {
		if (chkselall.checked) {
			
			prendechecks();
			Object.assign(datossel, datosall);
			numsele = datossel.length;
			applySolicitar.style.display = "inherit";
			btn_export.style.display = "inherit";
		} else {
			datossel.length = 0;
			apagachecks();
			numsele = 0;
			applySolicitar.style.display = "none";
			btn_export.style.display = "none";
		}
		Numselected.textContent = numsele;
	}
	function verificaseleccionado(id) {

		return datossel.filter(function(obj) {
			if (parseInt(obj) === parseInt(id)) {
				return true;
			}
			return false;
		});

	}

	function arrayRemove(arr, value) {

		return arr.filter(function(ele) {
			return ele != value;
		});
	}

	function llenacombosBD(primero) {
		numerocombos = 10;
		showLoading();
		let valant = cbtipodato.value;
		//Llena combo con valore unicos de tipo datos Series o Perfiles
		datoscomboDB(featureLayer, "tipodatos", "tipo_Datos", "1=1 and tipo_Datos is not null", false, primero, cbtipodato.value);
		//Llena combo con valore unicos de Disciplina
		datoscomboDB(featureLayer, "tipodisciplina", "disciplina", "1=1 and disciplina is not null", false, primero, cbtipodisciplina.value);

		//Llena combo con valore unicos de Parametros
		datoscomboDB(featureLayer, "tipoparametros", "parameters", "1=1 and parameters is not null and parameters <> '' ", false, primero, cbtipoparametros.value);
		//Llena combo con valore unicos de Plataforma
		datoscomboDB(featureLayer, "tipoplataforma", "plataforma", "1=1 and plataforma is not null", false, primero, cbtipoproyectos.value);

		//Llena combo con valore unicos de Institucion Propietaria de los datos
		datoscomboDB(featureLayer, "tipopropietarios", "institucion_propietaria", "1=1 and institucion_propietaria is not null", false, primero, cbtipopropietarios.value);

		//Llena combo con valore unicos de proyecto
		datoscomboDB(featureLayer, "tipoproyectos", "proyecto", "1=1 and proyecto is not null", false, primero, cbtipoproyectos.value);

		//Llena combo con valore unicos de Pais
		datoscomboDB(featureLayer, "tipopais", "pais", "1=1 and pais is not null", false, primero, cbtipopais.value);

		//Llena combo con valore unicos de Estacion
		datoscomboDB(featureLayer, "tipoestacion", "estacion", "1=1 and estacion is not null", false, primero, cbtipoestacion.value);

		//Llena combo con valore unicos de Fecha Inicio de datos
		datoscomboDB(featureLayer, "tipofechaini", "fechaIni", "1=1 and fechaIni is not null", true, primero, cbtipofechaini.value);

		//Llena combo con valore unicos de Fecha Inicio de datos
		datoscomboDB(featureLayer, "tipofechafin", "fechafin", "1=1 and fechafin is not null", true, primero, cbtipofechafin.value);


		//Si es Perfil se deshabilita la seleccion de estacion
		if (valant == "Perfil") {
			document.getElementById("tipoestacion").disabled = true;
		} else {
			document.getElementById("tipoestacion").disabled = false;
		}

	}

	function llenacombos(primero) {
		numerocombos = 10;
		//		showLoading();                 
		let valant = cbtipodato.value;
		//Llena combo con valore unicos de tipo datos Series o Perfiles
		datoscombo(featureLayer, "tipodatos", "Tipo_Datos", "1=1 and Tipo_Datos is not null", false, primero, cbtipodato.value);
		//Llena combo con valore unicos de Disciplina
		datoscombo(featureLayer, "tipodisciplina", "Disciplina", "1=1 and Disciplina is not null", false, primero, cbtipodisciplina.value);
		//Llena combo con valore unicos de Parametros
		datoscombo(featureLayer, "tipoparametros", "Parameters", "1=1 and Parameters is not null and Parameters <> '' ", false, primero, cbtipoparametros.value);
		//Llena combo con valore unicos de Plataforma
		datoscombo(featureLayer, "tipoplataforma", "Plataforma", "1=1 and Plataforma is not null", false, primero, cbtipoplataforma.value);
		//Llena combo con valore unicos de Institucion Propietaria de los datos
		datoscombo(featureLayer, "tipopropietarios", "Institucion_propietaria", "1=1 and Institucion_propietaria is not null", false, primero, cbtipopropietarios.value);
		//Llena combo con valore unicos de proyecto
		datoscombo(featureLayer, "tipoproyectos", "Proyecto", "1=1 and Proyecto is not null", false, primero, cbtipoproyectos.value);
		//Llena combo con valore unicos de Pais
		datoscombo(featureLayer, "tipopais", "Pais", "1=1 and Pais is not null", false, primero, cbtipopais.value);
		//Llena combo con valore unicos de Estacion
		datoscombo(featureLayer, "tipoestacion", "Estacion", "1=1 and Estacion is not null", false, primero, cbtipoestacion.value);
		//Llena combo con valore unicos de Fecha Inicio de datos
		datoscombo(featureLayer, "tipofechaini", "FechaIni", "1=1 and FechaIni is not null", true, primero, cbtipofechaini.value);
		//Llena combo con valore unicos de Fecha Inicio de datos
		datoscombo(featureLayer, "tipofechafin", "FechaFin", "1=1 and FechaFin is not null", true, primero, cbtipofechafin.value);

		//Si es Perfil se deshabilita la seleccion de estacion
		if (valant == "Perfil") {
			document.getElementById("tipoestacion").disabled = true;
		} else {
			document.getElementById("tipoestacion").disabled = false;
		}

	}

	//Llena combo con valore unicos de tipo datos Series o Perfiles

	//	datoscombo(featureLayer, "tipodatos", "Tipo_Datos", "1=1 and Tipo_Datos is not null", false, true);
	//	document.getElementById("tipodatos").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Disciplina
	//	datoscombo(featureLayer, "tipodisciplina", "Disciplina", "1=1 and Disciplina is not null", false, true);
	//	document.getElementById("tipodisciplina").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Parametros
	//	datoscombo(featureLayer, "tipoparametros", "Parameters", "1=1 and Parameters is not null and Parameters <> '' ", false, true);
	//	document.getElementById("tipoparametros").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Plataforma
	//	datoscombo(featureLayer, "tipoplataforma", "Plataforma", "1=1 and Plataforma is not null", false, true);
	//	document.getElementById("tipoplataforma").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Institucion Propietaria de los datos
	//	datoscombo(featureLayer, "tipopropietarios", "Institucion_propietaria", "1=1 and Institucion_propietaria is not null", false, true);
	//	document.getElementById("tipopropietarios").onchange = cambiacombo;
	//	//Llena combo con valore unicos de proyecto
	//	datoscombo(featureLayer, "tipoproyectos", "Proyecto", "1=1 and Proyecto is not null", false, true);
	//	document.getElementById("tipoproyectos").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Pais
	//	datoscombo(featureLayer, "tipopais", "Pais", "1=1 and Pais is not null", false, true);
	//	document.getElementById("tipopais").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Estacion
	//	datoscombo(featureLayer, "tipoestacion", "Estacion", "1=1 and Estacion is not null", false, true);
	//	document.getElementById("tipoestacion").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Fecha Inicio de datos
	//	datoscombo(featureLayer, "tipofechaini", "FechaIni", "1=1 and FechaIni is not null", true, true);
	//	document.getElementById("tipofechaini").onchange = cambiacombo;
	//	//Llena combo con valore unicos de Fecha Inicio de datos
	//	datoscombo(featureLayer, "tipofechafin", "FechaFin", "1=1 and FechaFin is not null", true, true);
	//	document.getElementById("tipofechafin").onchange = cambiacombo;
	//	
	//	



	//Cambios con sertvlet 240524

	datoscomboDB(featureLayer, "tipodatos", "tipo_Datos", "1=1 and tipo_Datos is not null", false, true);
	document.getElementById("tipodatos").onchange = cambiacombo;
	//Llena combo con valore unicos de Disciplina
	datoscomboDB(featureLayer, "tipodisciplina", "disciplina", "1=1 and disciplina is not null", false, true);
	document.getElementById("tipodisciplina").onchange = cambiacombo;
	//Llena combo con valore unicos de Parametros
	datoscomboDB(featureLayer, "tipoparametros", "parameters", "1=1 and parameters is not null and Parameters <> '' ", false, true);
	document.getElementById("tipoparametros").onchange = cambiacombo;
	//Llena combo con valore unicos de Plataforma
	datoscomboDB(featureLayer, "tipoplataforma", "plataforma", "1=1 and plataforma is not null", false, true);
	document.getElementById("tipoplataforma").onchange = cambiacombo;
	//Llena combo con valore unicos de Institucion Propietaria de los datos
	datoscomboDB(featureLayer, "tipopropietarios", "institucion_propietaria", "1=1 and institucion_propietaria is not null", false, true);
	document.getElementById("tipopropietarios").onchange = cambiacombo;
	//Llena combo con valore unicos de proyecto
	datoscomboDB(featureLayer, "tipoproyectos", "proyecto", "1=1 and proyecto is not null", false, true);
	document.getElementById("tipoproyectos").onchange = cambiacombo;
	//Llena combo con valore unicos de Pais
	datoscomboDB(featureLayer, "tipopais", "pais", "1=1 and pais is not null", false, true);
	document.getElementById("tipopais").onchange = cambiacombo;
	//Llena combo con valore unicos de Estacion
	datoscomboDB(featureLayer, "tipoestacion", "estacion", "1=1 and estacion is not null", false, true);
	document.getElementById("tipoestacion").onchange = cambiacombo;
	//Llena combo con valore unicos de Fecha Inicio de datos
	datoscomboDB(featureLayer, "tipofechaini", "fechaIni", "1=1 and fechaIni is not null", true, true);
	document.getElementById("tipofechaini").onchange = cambiacombo;
	//Llena combo con valore unicos de Fecha Inicio de datos
	datoscomboDB(featureLayer, "tipofechafin", "fechafin", "1=1 and fechafin is not null", true, true);
	document.getElementById("tipofechafin").onchange = cambiacombo;



	function cambiacombo(evt) {
		let value = evt.target.value;
        ListResult.style.display = "none";
		applySolicitar.style.display = "none";
		btn_export.style.display = "none";
		numsele = 0;
		Numselected.textContent = numsele;
		datossel.length = 0;
		//   cargadatosdescarga("OpenData = 0 OR OpenData = 1");
		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}
		pagina = 0;
		whereunicos = whereinicial;
		//		cargadatosIniciales(whereinicial);
		buscaprimero = false;
		muestratabla = false;
	//		llenacombos(true);
		llenacombosBD(true);

	}



	function selectItemByValue(combo, value) {

		let elmnt = document.getElementById(combo)
		if (value != null) {
			for (var i = 0; i < elmnt.options.length; i++) {
				if (elmnt.options[i].value.toUpperCase() === value.toUpperCase()) {
					elmnt.selectedIndex = i;
					break;
				}
			}
		}
	}

	function cambiatipodatos(evt) {
		let value = evt.target.value;
		if (value != "Todos") {
			datoscombo(featureLayer, "tipodisciplina", "Disciplina", "Tipo_Datos ='" + value + "' and Disciplina is not null");
		} else {
			datoscombo(featureLayer, "tipodisciplina", "Disciplina", "1=1 and Disciplina is not null", false, false);
		}


	}

	function cambiatipodisciplina(evt) {
		let value = evt.target.value;
		if (value != "Todos") {
			if (cbtipodato.value != "Todos") {
				datoscombo(featureLayer, "tipoparametros", "Parameters", "Tipo_Datos ='" + cbtipodato.value + "' and  Disciplina ='" + value + "' and Parameters is not null");
			} else {
				datoscombo(featureLayer, "tipoparametros", "Parameters", " Disciplina ='" + value + "' and Parameters is not null");
			}
		} else {

			datoscombo(featureLayer, "tipoparametros", "Parameters", "1=1 and Parameters is not null");

		}
	}

	function cambiatipoparametros(evt) {
		let value = evt.target.value;
		if (value != "Todos") {
			datoscombo(featureLayer, "tipoplataforma", "Plataforma", "Parameters ='" + value + "' and Plataforma is not null");
		} else {
			datoscombo(featureLayer, "tipoplataforma", "Plataforma", "1=1 and Plataforma is not null");
		}
	}




	// layer to draw geometry query create and update  
	const sketchLayer = new GraphicsLayer();
	view.map.add(sketchLayer);
	let sketchGeometry = null;
	var sketchViewModel = new SketchViewModel({
		layer: sketchLayer,
		defaultUpdateOptions: {
			tool: "reshape",
			toggleToolOnClick: false
		},
		view: view,
		defaultCreateOptions: {
			hasZ: false
		}
	});
	sketchViewModel.on("create", function(event) {
		if (event.state === "complete") {
			sketchGeometry = event.graphic.geometry;
			//runQuery();
		}
	});





	sketchViewModel.on("update", function(event) {
		if (event.state === "complete") {
			sketchGeometry = event.graphics[0].geometry;
			//runQuery();
		}
	});

	// atribute query 
	document.getElementById("applyQuery")
		.addEventListener("click", Consultaini);

	function Consultaini() {
		buscaprimero = true;
		chkselall.checked = false;
		datossel.length = 0;
		datosall.length = 0
		numsele = 0;
		//	if (graphicsInicial.graphics.length > 0) {
		//			graphicsInicial.removeAll();
		//		}
		wherecombos = "";
		wherecombos = armaquery();
//		applyQuery()
        muestratabla = true;
        cargadatosIniciales(wherecombos);
        queryCount(wherecombos,true);
//         if (document.getElementById("chkAreshp").checked ){
//				         CreateListuniqueInter(graphicsshapeInter,wherecombos,0);
//			          } else {
//				         CreateListunique(graphicsResultadoZoom,wherecombos,0);
//			          }
//		
       
		ListResult.style.display = "block";
		//setFeatureLayerFilter(NombreArticulo.value);
	}

	function applyQuery(page) {

		muestratabla = true;
		armaquery(page);
		ListResult.style.display = "block";
		//setFeatureLayerFilter(NombreArticulo.value);
	}
	document.getElementById("clearQuery")
		.addEventListener("click", clearQuery);

	document.getElementById("applySolicitar")
		.addEventListener("click", solicita1);


	function solicitar() {

		// pasalista();     
		var params = datossel;
		var url = "/datosDimar/pages/solicitudes/solicitudResumen.xhtml?lista=" + params;

		alert(url);
		var xmlHttpReq = false;

		// Création du conteneur XML pour Mozilla/Safari
		if (window.XMLHttpRequest) {
			xmlHttpReq = new XMLHttpRequest();
		}
		// Création du conteneur XML pour IE
		else if (window.ActiveXObject) {
			xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlHttpReq.open('POST', url, true);
		xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xmlHttpReq.onreadystatechange = function() {
			if (xmlHttpReq.readyState == 4) {
				//   updatepage(xmlHttpReq.responseText);
				updatepage(url);
			}
		}
		xmlHttpReq.send(params);
		// this.location.href = url;

	}


	function updatepage(url) {
		window.open(url, '_blank');
	}

	function clearQuery() {
		featureLayer.definitionExpression = whereinicial;
		//  setFeatureLayerFilter('1=1');
		//  view.center(-74,4);
		ListResult.style.display = "none";
		applySolicitar.style.display = "none";
		btn_export.style.display = "none";
		numsele = 0;
		Numselected.textContent = numsele;
		datossel.length = 0;
		//     cargadatosdescarga("OpenData = 2 OR OpenData = 3");
		if (graphicsInicial.graphics.length > 0) {
			graphicsInicial.removeAll();
		}
		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}



		pagina = 0;
		whereunicos = whereinicial;
		//		cargadatosIniciales(whereinicial);
		buscaprimero = false;
		muestratabla = false;
		//		llenacombos(false);   /pruebas
		llenacombosBD(true);
		queryCount(whereinicial,false);

		view.center = [-79, 9];
		view.zoom = 5;
		limpiageo();


	}

	function limpiageo() {
		document.getElementById("CoorXmin").value = "";
		document.getElementById("CoorYmin").value = "";
		document.getElementById("CoorXmax").value = "";
		document.getElementById("CoorYmax").value = "";
		document.getElementById("chkAreGeo").checked = false;
		document.getElementById("chkAreshp").checked = false;

	}

	function queryCount(query,unicos) {
		if (query == null) {
			query = "1=1";
		}
		if (unicos == null) {
			unicos = false;
		}
		featureLayer.queryFeatures({
			//			outFields: ["*"],
			outFields: ["ID_CONJUNTO_DATOS"],
			returnGeometry: false,
			returnDistinctValues: unicos,
			where: query,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(function(numFeatures) {

			//featureLayer.queryFeatureCount()
			count.textContent = numFeatures.features.length    //numFeatures;
			if (contarinicial) {
				counttotal.textContent = numFeatures.features.length;
				count.textContent = numFeatures.features.length 
				//				contarinicial = false;
			}

			document.getElementById("tablePager")
				.setAttribute("total-items", numFeatures.features.length);
		});
	}

//	featureLayer.definitionExpression = whereinicial;
//	queryCount(whereinicial);


	//atribute filter 
	function setFeatureLayerFilter(expression) {
		featureLayer.definitionExpression = expression;

		featureLayer.visible = true;

		featureLayer.queryExtent().then(function(extentresult) {
			//view.extent = extentresult.extent;
			//view.goTo(view.center);
			if (extentresult.count === 0) {
				alert('No se encuentran resultados para esta consulta');
				ListResult.style.display = "none";
			} else {
				view.goTo(extentresult.extent);
			}
		});


	}

	//create list 

	let graphics;
	function CreateListunique(layergraphics,wherecombos,pagina) {

		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}

		//		multiPointzoom = new Multipoint();
		graphics = layergraphics.graphics;
		featureLayer.definitionExpression = wherecombos;

		// para exportar datos del filtro		
		datosfiltro = [];
		datosfiltro.push(["ID_CONJUNTO_DATOS", "Link metadato", "Tipo de Dato", "Parámetros",
			 "País de Muestreo", "Institución Propietaria", "Proyecto o Iniciativa", "Plataforma", "Tarifa", "Periodicidad", "Disciplina", "Método de Medición"])	                                                                                                                                                        

		featureLayer.queryFeatures({
			start: pagina,
			num: 20,
			outFields: ["ID_CONJUNTO_DATOS", "Parameters", "GeoNetworkID", "Tipo_Datos", "FechaIni", "FechaFin", "Pais", "Institucion_propietaria", "Proyecto", "Plataforma", "Tarifa", "Periocidad", "Disciplina", "Metodo_Medicion"],
			returnGeometry: true,
			returnDistinctValues: true,
			where: wherecombos,
			orderByFields: ["ID_CONJUNTO_DATOS"]
		}).then(function(response) {
			if (response.features.length > 0) {
				const fragment = document.createDocumentFragment();
				let querybyID = "("
				response.features.forEach(function(result, index) {
					const attributes = result.attributes;
//					let id = String(attributes.OBJECTID);
					let idConjunto = String(attributes.ID_CONJUNTO_DATOS);
					let geonetwork = String(attributes.GeoNetworkID);
					let tipodato = String(attributes.Tipo_Datos);
					let fechainicial = intl.formatDate(attributes.FechaIni, dateFormatIntlOptions);
					let fechafinal = intl.formatDate(attributes.FechaFin, dateFormatIntlOptions);
//					let XLocation = String(attributes.XLocation);
//					let YLocation = String(attributes.YLocation);

					//				let fechainicial = "01/01/2022"; //intl.formatDate(attributes.FechaIni, dateFormatIntlOptions);
					//				let fechafinal = "01/01/2022"; //intl.formatDate(attributes.FechaFin, dateFormatIntlOptions);
					querybyID += idConjunto + ",";


					var linkmetadatostr = linkmetadato + attributes.GeoNetworkID;
					datosfiltro.push([
//						id,
						idConjunto,
						linkmetadatostr,
						tipodato,
						attributes.Parameters,
//						attributes.XLocation,
//						attributes.YLocation,
						attributes.Pais,
						attributes.Institucion_propietaria,
						attributes.Proyecto,
						attributes.Plataforma,
						attributes.Tarifa,
						attributes.Periocidad,
						attributes.Disciplina,
						attributes.Metodo_Medicion])

					var whereid = "ID_CONJUNTO_DATOS =" + idConjunto
//					pintardatosunicos(whereid);

					const li = document.createElement("li");
					li.classList.add("panel-result");
					li.tabIndex = 0;
					//			li.setAttribute("data-result-id", index);
					li.setAttribute("id_conjunto", idConjunto);

					let table = document.createElement("table");
					let rowCount = table.rows.length;
					let row = table.insertRow(rowCount);
					let cell1 = row.insertCell(0);
					let cell2 = row.insertCell(1);

					let chkinput = document.createElement("INPUT");
					chkinput.setAttribute("type", "checkbox");
					chkinput.type = 'checkbox';
					chkinput.name = 'seleccionado';
					chkinput.id = idConjunto;
					//            chkinput.addEventListener('onclick','verificaseleccionado(1)');
					//         chkinput.addEventListener("onclick", function () {alert('More then one way to skin a cat')});
					//    chkinput.onclick=verificaseleccionado(1);
					chkinput.onchange = function() { cuentaseleccionados(idConjunto) };


					// chkinput.onclick = "verificaseleccionado(1)";
					let verifica = verificaseleccionado(idConjunto);
					if (verifica.length > 0) {
						chkinput.checked = true;
					}


					cell1.appendChild(chkinput);
					//         li.appendChild(chkinput);

					let title = document.createElement("p");
					title.setAttribute("class", "title-list no-margin");
					title.textContent = attributes.Tipo_Datos + " " + idConjunto;
					//   li.appendChild(title);
					cell2.appendChild(title);

					li.appendChild(row);

					let Parameters = document.createElement("p");
					Parameters.setAttribute("class", "author-list no-margin");
					Parameters.textContent = attributes.Parameters;
					li.appendChild(Parameters);

					let Texto2 = document.createElement("p");
					Texto2.setAttribute("class", "author-list no-margin");
					Texto2.textContent = attributes.Pais + ". " + attributes.Institucion_propietaria + ". " + attributes.Proyecto + ". " + attributes.Plataforma + ". ";
					li.appendChild(Texto2);

					let Texto3 = document.createElement("p");
					Texto3.setAttribute("class", "author-list no-margin");
					Texto3.textContent = fechainicial + " - " + fechafinal;
					li.appendChild(Texto3);

//					let Texto4 = document.createElement("p");
//					Texto4.setAttribute("class", "author-list no-margin");
//					Texto4.textContent = "Localización:" + XLocation + ", " + YLocation;
//					li.appendChild(Texto4);


					let link = document.createElement("a");
					link.setAttribute("class", "link-list");
					link.setAttribute("href", linkmetadato + attributes.GeoNetworkID);
					link.setAttribute("target", "_blank");
					link.textContent = "Ver metadato.";
					li.appendChild(link);
					fragment.appendChild(li);
					li.addEventListener("click", onListClickHandler);


				});
				let queryID = querybyID.slice(0, -1) + ")"
				// Empty the current list
				listNode.innerHTML = "";
				listNode.appendChild(fragment);


//				     view.goTo(multiPointzoom.extent);
//                  view.goTo(response.extent)
				return queryID;
			} else {
				ListResult.style.display = "none";
		applySolicitar.style.display = "none";
		btn_export.style.display = "none";
		numsele = 0;
		Numselected.textContent = numsele;
		datossel.length = 0;
           alert("No hay registros con el filtro seleccionado.. Por favor Verifique");
                                                                                   
			}



		});

	}




	async function CreateListuniqueInter(layergraphics,wherecombos,pagina) {

		if (graphicsResultadoZoom.graphics.length > 0) {
			graphicsResultadoZoom.removeAll();
		}
		if (graphicsselect.graphics.length > 0) {
			graphicsselect.removeAll();
		}


		if (document.getElementById("chkAreshp").checked) {
			//				 var featuresset = await getfeatureset();



			layershape = "";
			const layersall = map.layers;
			for (var j = 0; j < layersall.length; j++) {

				if (layersall.items[j].title == "Archivo Shape File") {
					layershape = layersall.items[j];
				}
			}

			var query = layershape.createQuery();
			query.returnGeometry = true;
			query.outFields = ["*"];

			var poligonos = await layershape.queryFeatures(query);


		}

		graphics = layergraphics.graphics;
		var queryIDinter = "";
		var querybyIDinter = "("
		var id = "";
		var attributes;

		if (graphics.length > 0) {

			for (var k = 0; k < graphics.length; k++) {
				attributes = graphics.items[k].attributes;
				if (attributes.ID_CONJUNTO_DATOS === undefined) {

				} else {
					id = String(attributes.ID_CONJUNTO_DATOS);
					querybyIDinter += id + ",";
				}

			}

			queryIDinter = querybyIDinter.slice(0, -1) + ") "


		let whereunicosinter = wherecombos + " AND ID_CONJUNTO_DATOS in " + queryIDinter;
		featureLayer.definitionExpression = whereunicosinter; //whereunicos;

		if (document.getElementById("chkAreshp").checked && poligonos != null) {

			poligonos.features.forEach(function(feature) {


				const params = new ProjectParameters({
					geometries: [feature.geometry],
					outSpatialReference: outSpatialReference
				});
				const url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
				geometryService.project(url, params).then(function(response) {
					var poligonopry = response;

					// para exportar datos del filtro		
					datosfiltro = [];
					datosfiltro.push(["ID_CONJUNTO_DATOS", "Link metadato", "Tipo de Dato", "Parámetros",
						 "País de Muestreo", "Institución Propietaria", "Proyecto o Iniciativa", "Plataforma", "Tarifa", "Periodicidad", "Disciplina", "Método de Medición"])

					featureLayer.queryFeatures({
						start: pagina,
						num: 20,
						outFields: ["ID_CONJUNTO_DATOS", "Parameters", "GeoNetworkID", "Tipo_Datos", "FechaIni", "FechaFin", "Pais", "Institucion_propietaria", "Proyecto", "Plataforma", "Tarifa", "Periocidad", "Disciplina", "Metodo_Medicion"],
						returnGeometry: false,
						returnDistinctValues: true,
						where: whereunicosinter, //whereunicos,
						orderByFields: ["ID_CONJUNTO_DATOS"]
					}).then(function(response) {
						if (response.features.length > 0) {
							const fragment = document.createDocumentFragment();
							let querybyID = "("
							response.features.forEach(function(result, index) {
								const attributes = result.attributes;
								//				let Datopoint = new Point(attributes.XLocation, attributes.YLocation, new SpatialReference({ wkid: 4326 }))
								//				var doesContain = poligonopry[0].contains(Datopoint);
								//			if (poligonopry[0].contains(Datopoint)){
//								let id = String(attributes.OBJECTID);
								let idConjunto = String(attributes.ID_CONJUNTO_DATOS);
								let geonetwork = String(attributes.GeoNetworkID);
								let tipodato = String(attributes.Tipo_Datos);
								let fechainicial = intl.formatDate(attributes.FechaIni, dateFormatIntlOptions);
								let fechafinal = intl.formatDate(attributes.FechaFin, dateFormatIntlOptions);
//								let XLocation = String(attributes.XLocation);
//								let YLocation = String(attributes.YLocation);
								//				let fechainicial = "01/01/2022"; //intl.formatDate(attributes.FechaIni, dateFormatIntlOptions);
								//				let fechafinal = "01/01/2022"; //intl.formatDate(attributes.FechaFin, dateFormatIntlOptions);
								querybyID += idConjunto + ",";


								var linkmetadatostr = linkmetadato + attributes.GeoNetworkID;
								datosfiltro.push([
//									id,
									idConjunto,
									linkmetadatostr,
									tipodato,
									attributes.Parameters,
//									attributes.XLocation,
//									attributes.YLocation,
									attributes.Pais,
									attributes.Institucion_propietaria,
									attributes.Proyecto,
									attributes.Plataforma,
									attributes.Tarifa,
									attributes.Periocidad,
									attributes.Disciplina,
									attributes.Metodo_Medicion])

								var whereid = "ID_CONJUNTO_DATOS =" + idConjunto
								pintardatosunicos(whereid);

								const li = document.createElement("li");
								li.classList.add("panel-result");
								li.tabIndex = 0;
								//			li.setAttribute("data-result-id", index);
								li.setAttribute("id_conjunto", idConjunto);

								let table = document.createElement("table");
								let rowCount = table.rows.length;
								let row = table.insertRow(rowCount);
								let cell1 = row.insertCell(0);
								let cell2 = row.insertCell(1);

								let chkinput = document.createElement("INPUT");
								chkinput.setAttribute("type", "checkbox");
								chkinput.type = 'checkbox';
								chkinput.name = 'seleccionado';
								chkinput.id = idConjunto;
								//            chkinput.addEventListener('onclick','verificaseleccionado(1)');
								//         chkinput.addEventListener("onclick", function () {alert('More then one way to skin a cat')});
								//    chkinput.onclick=verificaseleccionado(1);
								chkinput.onchange = function() { cuentaseleccionados(idConjunto) };


								// chkinput.onclick = "verificaseleccionado(1)";
								let verifica = verificaseleccionado(idConjunto);
								if (verifica.length > 0) {
									chkinput.checked = true;
								}


								cell1.appendChild(chkinput);
								//         li.appendChild(chkinput);

								let title = document.createElement("p");
								title.setAttribute("class", "title-list no-margin");
								title.textContent = attributes.Tipo_Datos + " " + idConjunto;
								//   li.appendChild(title);
								cell2.appendChild(title);

								li.appendChild(row);

								let Parameters = document.createElement("p");
								Parameters.setAttribute("class", "author-list no-margin");
								Parameters.textContent = attributes.Parameters;
								li.appendChild(Parameters);

								let Texto2 = document.createElement("p");
								Texto2.setAttribute("class", "author-list no-margin");
								Texto2.textContent = attributes.Pais + ". " + attributes.Institucion_propietaria + ". " + attributes.Proyecto + ". " + attributes.Plataforma + ". ";
								li.appendChild(Texto2);

								let Texto3 = document.createElement("p");
								Texto3.setAttribute("class", "author-list no-margin");
								Texto3.textContent = fechainicial + " - " + fechafinal;
								li.appendChild(Texto3);

//								let Texto4 = document.createElement("p");
//								Texto4.setAttribute("class", "author-list no-margin");
//								Texto4.textContent = "Localización:" + XLocation + ", " + YLocation;
//								li.appendChild(Texto4);

								let link = document.createElement("a");
								link.setAttribute("class", "link-list");
								link.setAttribute("href", linkmetadato + attributes.GeoNetworkID);
								link.setAttribute("target", "_blank");
								link.textContent = "Ver metadato.";
								li.appendChild(link);
								fragment.appendChild(li);
								li.addEventListener("click", onListClickHandler);
								//			}

							});
							let queryID = querybyID.slice(0, -1) + ")"
							// Empty the current list
							listNode.innerHTML = "";
							listNode.appendChild(fragment);

							//     view.goTo(multiPointzoom.extent);
							return queryID;
						} else {
				ListResult.style.display = "none";
		applySolicitar.style.display = "none";
		btn_export.style.display = "none";
		numsele = 0;
		Numselected.textContent = numsele;
		datossel.length = 0;
           alert("No hay registros con el filtro seleccionado.. Por favor Verifique");
						}
						   
					});




				}); // del project	


			});  //del  (function(feature) 


		} //if (document.getElementById("chkAreshp").checked && poligonos != null)

    }  //if (graphics.length > 0)
      else {
	     ListResult.style.display = "none";
		applySolicitar.style.display = "none";
		btn_export.style.display = "none";
		numsele = 0;
		Numselected.textContent = numsele;
		datossel.length = 0;
           alert("No hay registros con el filtro seleccionado.. Por favor Verifique");
        }        
	}  // del function			


	function CreateList(layergraphics) {
		graphics = layergraphics.graphics;

		if (graphics.length > 0) {
			const fragment = document.createDocumentFragment();
			let querybyID = "("
			graphics.forEach(function(result, index) {
				const attributes = result.attributes;
				let id = String(attributes.OBJECTID);
				let idConjunto = String(attributes.ID_CONJUNTO_DATOS);
				let geonetwork = String(attributes.GeoNetworkID);
				let tipodato = String(attributes.Tipo_Datos);
				let fechainicial = intl.formatDate(attributes.FechaIni, dateFormatIntlOptions);
				let fechafinal = intl.formatDate(attributes.FechaFin, dateFormatIntlOptions);
				let XLocation = String(attributes.XLocation);
				let YLocation = String(attributes.YLocation);
				querybyID += id + ",";

				const li = document.createElement("li");
				li.classList.add("panel-result");
				li.tabIndex = 0;
				li.setAttribute("data-result-id", index);

				let table = document.createElement("table");
				let rowCount = table.rows.length;
				let row = table.insertRow(rowCount);
				let cell1 = row.insertCell(0);
				let cell2 = row.insertCell(1);

				let chkinput = document.createElement("INPUT");
				chkinput.setAttribute("type", "checkbox");
				chkinput.type = 'checkbox';
				chkinput.name = 'seleccionado';
				chkinput.id = idConjunto;
				//            chkinput.addEventListener('onclick','verificaseleccionado(1)');
				//         chkinput.addEventListener("onclick", function () {alert('More then one way to skin a cat')});
				//    chkinput.onclick=verificaseleccionado(1);
				chkinput.onchange = function() { cuentaseleccionados(idConjunto) };


				// chkinput.onclick = "verificaseleccionado(1)";
				let verifica = verificaseleccionado(idConjunto);
				if (verifica.length > 0) {
					chkinput.checked = true;
				}


				cell1.appendChild(chkinput);
				//         li.appendChild(chkinput);

				let title = document.createElement("p");
				title.setAttribute("class", "title-list no-margin");
				title.textContent = attributes.Tipo_Datos + " " + idConjunto;
				//   li.appendChild(title);
				cell2.appendChild(title);

				li.appendChild(row);

				let Parameters = document.createElement("p");
				Parameters.setAttribute("class", "author-list no-margin");
				Parameters.textContent = attributes.Parameters;
				li.appendChild(Parameters);

				let Texto2 = document.createElement("p");
				Texto2.setAttribute("class", "author-list no-margin");
				Texto2.textContent = attributes.Pais + ". " + attributes.Institucion_propietaria + ". " + attributes.Proyecto + ". " + attributes.Plataforma + ". ";
				li.appendChild(Texto2);

				let Texto3 = document.createElement("p");
				Texto3.setAttribute("class", "author-list no-margin");
				Texto3.textContent = fechainicial + " - " + fechafinal;
				li.appendChild(Texto3);

				let Texto4 = document.createElement("p");
				Texto4.setAttribute("class", "author-list no-margin");
				Texto4.textContent = "Localización:" + XLocation + ", " + YLocation;
				li.appendChild(Texto4);

				//				let Tipo_Datos = document.createElement("p");
				//				Tipo_Datos.setAttribute("class", "author-list no-margin");
				//				Tipo_Datos.textContent = "Tipo de dato: " + attributes.Tipo_Datos;
				//				li.appendChild(Tipo_Datos);
				//
				//				let Disciplina = document.createElement("p");
				//				Disciplina.setAttribute("class", "author-list no-margin");
				//				Disciplina.textContent = "Disciplina: " + attributes.Disciplina;
				//				li.appendChild(Disciplina);
				//
				//				let Parameters = document.createElement("p");
				//				Parameters.setAttribute("class", "author-list no-margin");
				//				Parameters.textContent =  attributes.Parameters;
				//				li.appendChild(Parameters);
				//
				//
				//				let Plataforma = document.createElement("p");
				//				Plataforma.setAttribute("class", "author-list no-margin");
				//				Plataforma.textContent = "Plataforma: " + attributes.Plataforma;
				//				li.appendChild(Plataforma);
				//
				//
				//				let Propietario = document.createElement("p");
				//				Propietario.setAttribute("class", "author-list no-margin");
				//				Propietario.textContent = "Institución propietaria: " + attributes.Institucion_propietaria;
				//				li.appendChild(Propietario);
				//
				//
				//				let Proyecto = document.createElement("p");
				//				Proyecto.setAttribute("class", "author-list no-margin");
				//				Proyecto.textContent = "Proyecto: " + attributes.Proyecto;
				//				li.appendChild(Proyecto);
				//
				//
				//				let Pais = document.createElement("p");
				//				Pais.setAttribute("class", "author-list no-margin");
				//				Pais.textContent = "País de muestreo: " + attributes.Pais;
				//				li.appendChild(Pais);
				//
				//				let FechaIni = document.createElement("p");
				//				FechaIni.setAttribute("class", "author-list no-margin");
				//				FechaIni.textContent = "Fecha inicial de datos: " + fechainicial;
				//				li.appendChild(FechaIni);
				//
				//				let FechaFin = document.createElement("p");
				//				FechaFin.setAttribute("class", "author-list no-margin");
				//				FechaFin.textContent = "Fecha final de datos: " + fechafinal;
				//				li.appendChild(FechaFin);

				let link = document.createElement("a");
				link.setAttribute("class", "link-list");
				link.setAttribute("href", linkmetadato + attributes.GeoNetworkID);
				link.setAttribute("target", "_blank");
				link.textContent = "Ver metadato.";
				li.appendChild(link);
				fragment.appendChild(li);
				li.addEventListener("focus", onListClickHandler);
			});
			let queryID = querybyID.slice(0, -1) + ")"
			// Empty the current list
			listNode.innerHTML = "";
			listNode.appendChild(fragment);


			return queryID;
		} else {

		}
	}

	function getUniqueValues(values) {
		var uniqueValues = [];

		values.forEach(function(item, i) {
			if ((uniqueValues.length < 1 || uniqueValues.indexOf(item) === -1) && item !== "") {
				uniqueValues.push(item);
			}
		});
		return uniqueValues;
	}

	function onListClickHandler(event) {
		//	const target = event.target;
		const target = event.currentTarget

		const resultId = target.getAttribute("id_conjunto");
		// get the graphic corresponding to the clicked zip code
		//		const result =
		//			resultId && graphics && graphics.items[parseInt(resultId, 10)];

		var whereid = "ID_CONJUNTO_DATOS =" + resultId
		datosseleccionado(whereid)


	}
	// draw geometry buttons - use the selected geometry to sktech llamada de botonos y obtener valores de graficos a dibujar
	document
		.getElementById("point-geometry-button")
		.addEventListener("click", geometryButtonsClickHandler);
	document
		.getElementById("line-geometry-button")
		.addEventListener("click", geometryButtonsClickHandler);
	document
		.getElementById("polygon-geometry-button")
		.addEventListener("click", geometryButtonsClickHandler);

	function geometryButtonsClickHandler(event) {
		const geometryType = event.target.value;
		clearGeometry();
		sketchViewModel.create(geometryType);
	}



	document
		.getElementById("btn_export")
		.addEventListener("click", exportData);

	//  document
	//       .getElementById("btn_solicita")
	//       .addEventListener("click", solicita1);

	function solicita1() {

		if (datossel.length > 0) {
			parent.pasalista([{ name: 'lista', value: datossel }, { name: 'tipo_dato', value: "Venta" }]);
		} else {
			alert('No ha seleccionado datos a Solicitar. Verifique');
		}



	}

	function exportData() {
		rows = datosfiltro;
		csvContent = "data:text/csv;charset=utf-8,";
		/* add the column delimiter as comma(,) and each row splitted by new line character (\n) */
		rows.forEach(function(rowArray) {
			row = rowArray.join(";");
			csvContent += row + "\r\n";
		});

		/* create a hidden <a> DOM node and set its download attribute */
		//var encodedUri = encodeURI(csvContent);
		var encodedUri = encodeURIComponent(csvContent.replace(/\#/g, "#"));
		var link = document.createElement("a");
		//link.setAttribute("href", encodedUri);
		link.setAttribute("href", csvContent.replace(/\#/g, "%23"));
		link.setAttribute("download", "BusquedadatosDimar.csv");
		document.body.appendChild(link);
		link.click();
	}

	document.getElementById("applyQueryLoc")
		.addEventListener("click", LocQuery);
	function LocQuery() {
		let query = featureLayer.createQuery();
		query.geometry = sketchGeometry;
		query.spatialRelationship = "intersects";
		query.returnGeometry = true;
		query.orderByFields = "AÑO";

		featureLayer.queryFeatures(query)
			.then(CreateList, function(error) {
				console.error(error);
			})
			.then(defExpre);

		featureLayer.queryExtent(query).then(function(extentresult) {
			if (extentresult.count === 0) {
				alert('No se encuentran resultados para esta consulta');
				ListResult.style.display = "none";
				defExpre('(123456789)');
			} else {
				view.goTo(extentresult.extent);
			}
		});
	}

	function defExpre(queryID) {
		featureLayer.definitionExpression = "OBJECTID IN " + queryID;
		featureLayer.visible = true;
		queryCount("OBJECTID IN " + queryID,true);
		CalcPeriodo();
		LabelCount.textContent = 'Ubicaciones geográficas (filtro):';
		LabelCountDatos.textContent = 'Cantidad de datos (filtro):';
		ListResult.style.display = "block";
	}

	document
		.getElementById("clearQueryLoc")
		.addEventListener("click", clearGeometry);

	function clearGeometry() {
		featureLayer.definitionExpression = whereinicial;
		query = null;
		sketchGeometry = null;
		sketchViewModel.cancel();
		sketchLayer.removeAll();
		featureLayer.visible = false;
		ListResult.style.display = "none";
		queryCount(whereinicial,false);
		CalcPeriodo();
		LabelCount.textContent = 'Publicaciones Disponibles:';
	}

	queryDiv.style.display = "block";
	//bottons active querys 
	document
		.getElementById("atributesButton")
		.addEventListener("click", changeDisplayAtr);



	function changeDisplayAtr() {
		if (queryDiv.style.display === "block") {
			queryDiv.style.display = "none";
			queryLocDiv.style.display = "block";
		} else {
			queryDiv.style.display = "block";
			queryLocDiv.style.display = "none";
		}
	}
	document
		.getElementById("spatialButton")
		.addEventListener("click", changeDisplayLoc);
	// evento cuando se cambia archivo KML para seleccion

	const portalUrl = "https://www.arcgis.com";
	document.getElementById("uploadForm").addEventListener("change", (event) => {
		const fileName = event.target.value.toLowerCase();

		if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
			generateFeatureCollection(fileName);
		}
		else {
			//             document.getElementById('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
		}
	});

	//document.getElementById("fileInputKml").addEventListener("change", function(event) {
	//        var file = event.target.files[0];
	//
	//      const fileURL = URL.createObjectURL(file);
	//        if (file && file.name.endsWith(".kml")) {
	//         var infofile = {
	//          ok: false,
	//          file: null,
	//          fileName: null,
	//          fileType: null,
	//          fileurl: null
	//        };
	//        
	//          infofile.file = file = file;
	//          infofile.fileName = file.name;
	//          infofile.ok = true;
	//            infofile.fileType = "KML";
	//           infofile.fileurl = fileURL
	//
	//             return _executeKml(infofile);
	//            
	//
	//            
	//            
	//////            const fileURL = URL.createObjectURL(file);
	//////            esriConfig.kmlServiceUrl = fileURL;
	//////            const kmlLayer = new KMLLayer({
	//////                url: fileURL
	//////            });
	////
	////            map.add(layer);
	////
	////            layer.when(() => {
	////                view.goTo(kmlLayer.fullExtent);
	////            });
	//        } else if (file && file.name.endsWith(".zip")) {
	//	    const fileName = event.target.value.toLowerCase();
	//	     generateFeatureCollection(fileName);
	////		loadShapefile(file);
	//
	//	} 
	//	 else {
	//      alert("Por favor, selecciona un archivo KML válido.");
	//	}
	//
	//
	//
	//    });

	function changeDisplayLoc() {
		if (queryLocDiv.style.display === "block") {
			queryLocDiv.style.display = "none";
			queryDiv.style.display = "block";
		} else {
			queryDiv.style.display = "none";
			queryLocDiv.style.display = "block";
		}
	}

	function zoomToLayer(results) {

		view.goTo(results.extent)


	}


	function datoscombo(featureLayer, cbodiv, campo, sqlwhere, isdate, isprimero, valorant) {

		let tipodiv = document.getElementById(cbodiv);
		for (i = tipodiv.options.length - 1; i >= 0; i--) {
			tipodiv.remove(i);
		}
		uniqueValues({
			layer: featureLayer,
			field: campo,
			outFields: ["'" + campo + "'"],
			sqlWhere: sqlwhere,
			orderByFields: campo
		}).then(function(response) {
			// prints each unique value and the count of features containing that value
			let infos = response.uniqueValueInfos;
			let tipodato = document.createElement("option");
			tipodato.setAttribute("value", "Todos");
			tipodato.textContent = String("Todos");
			tipodiv.appendChild(tipodato);
			//			showLoading();
			infos.forEach(function(info) {
				let tipodato = document.createElement("option");
				if (isdate) {

					const formattedDate = intl.formatDate(info.value, dateFormatIntlOptions);


					//      const formattedDate = Intl.DateTimeFormat('en-US').format(info.value + 43200000);
					tipodato.setAttribute("value", formattedDate);
					tipodato.textContent = String(formattedDate);
					tipodiv.appendChild(tipodato);
				} else {
					tipodato.setAttribute("value", info.value);
					tipodato.textContent = String(info.value);
					tipodiv.appendChild(tipodato);
				}
				numerocombos = numerocombos - 1;
				if (numerocombos < 1) {
					document.getElementById("applyQuery").style.display = "inherit";
					hideLoading();
				} else {
					document.getElementById("applyQuery").style.display = "none";
					showLoading();
				}
			});

			if (isprimero) {
				selectItemByValue(cbodiv, valorant);

			}

		})

	}

	function datoscomboDB(featureLayer, cbodiv, campo, sqlwhere, isdate, isprimero, valorant) {

		let tipodiv = document.getElementById(cbodiv);
		for (i = tipodiv.options.length - 1; i >= 0; i--) {
			tipodiv.remove(i);
		}



		let sqlunicos = "select distinct p from Dmdataclassement p left join fetch p." + campo + " " + sqlwhere;



		//wherest
		let url = "consultaDMDATA?unicos=SI&campo=" + campo + "&sqlwhere=" + sqlwhere;

		esriRequest(url, {

		}).then(function(response) {
			// prints each unique value and the count of features containing that value
			let infos = response;
			let geoJson = response.data;
			let tipodato = document.createElement("option");
			tipodato.setAttribute("value", "Todos");
			tipodato.textContent = String("Todos");
			tipodiv.appendChild(tipodato);
			//			showLoading();
			var numResults = response.data.length;

			for (var j = 0; j < numResults; j++) {

				let tipodato = document.createElement("option");
				if (isdate) {
					//					console.error(info.value);
					var fechabien = new Date(response.data[j]).toLocaleDateString('en-GB');
//					console.log(fechabien);
					//					const formattedDate = intl.formatDate(fechabien, dateFormatIntlOptions);
					//					console.error(formattedDate);
					//const formattedDate = "01/01/2022"
					//      const formattedDate = Intl.DateTimeFormat('en-US').format(info.value + 43200000);
					tipodato.setAttribute("value", fechabien);
					tipodato.textContent = String(fechabien);
					tipodiv.appendChild(tipodato);
				} else {
					tipodato.setAttribute("value", response.data[j]);
					tipodato.textContent = String(response.data[j]);
					tipodiv.appendChild(tipodato);
				}
				numerocombos = numerocombos - 1;
				if (numerocombos < 1) {
					document.getElementById("applyQuery").style.display = "inherit";
					hideLoading();
				} else {
					document.getElementById("applyQuery").style.display = "none";
					showLoading();
				}
			};

			if (isprimero) {
				selectItemByValue(cbodiv, valorant);

			}

		})

	}


	function _executeKml(fileInfo) {
		var _self = this;
		var reader = new FileReader();
		var map = map;

		var handleError = function(pfx, error) {
			//          _self._setBusy(false);
			//          _self._setStatus(i18n.addFromFile.addFailedPattern
			//            .replace("{filename}",fileInfo.fileName));
			console.warn(pfx);
			console.error(error);
			if (error && typeof error.message === "string" && error.message.length > 0) {
				new Message({

					titleLabel: "error en la carga",
					message: "error" + "<br><br>" + error.message
				});
			}
		};

		reader.onerror = function(err) {
			handleError("FileReader::onerror", err);
		};

		reader.onload = function(event) {
			if (reader.error) {
				handleError("FileReader::error", reader.error);
				return;
			}
			var v = event.target.result;
			var url = "";
			//         var loader = new LayerLoader();
			var id = 1234567890; //loader._generateLayerId();
			var layer = new KMLLayer(url, {
				id: id,
				name: fileInfo.fileName,
				linkInfo: {
					visibility: false
				}
			});
			layer.visible = true;
			delete layer.linkInfo;

			layer._parseKml = function(fileInfo) {
				var self = this;
				//           this._fireUpdateStart();
				// Send viewFormat as necessary if this kml layer represents a
				// network link i.e., in the constructor options.linkInfo is
				// available and linkInfo has viewFormat property
				var requesesri = esriRequest({
					//  url: this.serviceUrl,
					url: "http://utility.arcgis.com/sharing/kml",
					content: {
						/*url: this._url.path + this._getQueryParameters(map),*/
						kmlString: encodeURIComponent(v),
						model: "simple",
						folders: "",
						refresh: this.loaded ? true : undefined,
						outSR: 4326 // dojoJson.toJson(this._outSR.toJson())
					},
					callbackParamName: "callback",
					load: function(response) {
						//console.warn("response",response);
						self._io = null;
						self._initLayer(response);
						loader._waitForLayer(layer).then(function(lyr) {
							var num = 0;
							lyr.name = fileInfo.fileName;
							lyr.xtnAddData = true;
							array.forEach(lyr.getLayers(), function(l) {
								if (l && l.graphics && l.graphics.length > 0) {
									num += l.graphics.length;
								}
							});
							var mapSR = map.spatialReference, outSR = lyr._outSR;
							var projOk = (mapSR && outSR) && (mapSR.equals(outSR) ||
								mapSR.isWebMercator() && outSR.wkid === 4326 ||
								outSR.isWebMercator() && mapSR.wkid === 4326);
							if (projOk) {
								map.addLayer(lyr);
							} else {
								new Message({
									titleLabel: i18n._widgetLabel,
									message: i18n.addFromFile.kmlProjectionMismatch
								});
							}
							//                  _self._setBusy(false);
							//                  _self._setStatus(i18n.addFromFile.featureCountPattern
							//                    .replace("{filename}",fileInfo.fileName)
							//                    .replace("{count}",num)
							//                  );
						}).otherwise(function(err) {
							handleError("kml-_waitForLayer.error", err);
						});
					},
					error: function(err) {
						self._io = null;
						err = lang.mixin(new Error(), err);
						err.message = "Unable to load KML: " + (err.message || "");
						self._fireUpdateEnd(err);
						self._errorHandler(err);
						handleError("Unable to load KML", err);
					}
				}, { usePost: true });
			};
			layer._parseKml(fileInfo);

		};

		try {
			reader.readAsText(fileInfo.file);
		} catch (ex) {
			handleError("FileReader::readAsText", ex);
		}
	}


	function loadShapefile(file) {
		var formData = new FormData();
		formData.append("file", file);

		esriRequest("https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/import", {
			method: "post",
			body: formData
		}).then(function(response) {
			// Procesar la respuesta
			var features = response.data.featureCollection.layers[0].featureSet.features;
			features.forEach(function(feature) {
				var geometry = Polygon.fromJSON(feature.geometry);
				var graphic = new Graphic({
					geometry: geometry,
					symbol: {
						type: "simple-fill",
						color: [227, 139, 79, 0.5],
						outline: {
							color: [255, 255, 255],
							width: 1
						}
					}
				});
				graphicsLayer.add(graphic);
			});
		}).catch(function(error) {
			console.error("Error cargando el shapefile: ", error);
		});
	}


	function generateFeatureCollection(fileName) {
		let name = fileName.split(".");
		// Chrome adds c:\fakepath to the value - we need to remove it
		name = name[0].replace("c:\\fakepath\\", "");

		//            document.getElementById('upload-status').innerHTML = '<b>Loading </b>' + name;

		// define the input params for generate see the rest doc for details
		// https://developers.arcgis.com/rest/users-groups-and-items/generate.htm
		const params = {
			'name': name,
			'targetSR': view.spatialReference,
			'maxRecordCount': 1000,
			'enforceInputFileSizeLimit': true,
			'enforceOutputJsonSizeLimit': true
		};

		// generalize features to 10 meters for better performance
		params.generalize = true;
		params.maxAllowableOffset = 10;
		params.reducePrecision = true;
		params.numberOfDigitsAfterDecimal = 0;

		const myContent = {
			'filetype': 'shapefile',
			'publishParameters': JSON.stringify(params),
			'f': 'json',
		};

		// use the REST generate operation to generate a feature collection from the zipped shapefile
		esriRequest(portalUrl + '/sharing/rest/content/features/generate', {
			query: myContent,
			body: document.getElementById('uploadForm'),
			responseType: 'json'
		})
			.then((response) => {
				const layerName = response.data.featureCollection.layers[0].layerDefinition.name;
				//               document.getElementById('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
				addShapefileToMap(response.data.featureCollection);
			})
			.catch(errorHandler);
	}

	function errorHandler(error) {
		console.log("error: " + error);
		//            document.getElementById('upload-status').innerHTML =
		//            "<p style='color:red;max-width: 500px;'>" + error.message + "</p>";
	}

	function addShapefileToMap(featureCollection) {
		// add the shapefile to the map and zoom to the feature collection extent
		// if you want to persist the feature collection when you reload browser, you could store the
		// collection in local storage by serializing the layer using featureLayer.toJson()
		// see the 'Feature Collection in Local Storage' sample for an example of how to work with local storage
		let sourceGraphics = [];

		const layers = featureCollection.layers.map((layer) => {

			const graphics = layer.featureSet.features.map((feature) => {
				return Graphic.fromJSON(feature);
			})
			sourceGraphics = sourceGraphics.concat(graphics);
			const featureLayer = new FeatureLayer({
				title: "Archivo Shape File",
				objectIdField: "FID",
				source: graphics,
				fields: layer.layerDefinition.fields.map((field) => {
					return Field.fromJSON(field);
				})
			});
			return featureLayer;
			// associate the feature with the popup on click to enable highlight and zoom to
		});
		map.addMany(layers);
		view.goTo(sourceGraphics)
			.catch((error) => {
				if (error.name != "AbortError") {
					console.error(error);
				}
			});

		document.getElementById('upload-status').innerHTML = "";
	}


	async function proyectafeature(feature, outSpatialReference1) {
		var outSpatialReference = new SpatialReference({
			wkid: 4623, //Sphere_Sinusoidal
		});
		const url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
		await geometryService.project(url, [feature.geometry], outSpatialReference).then(function(response) {

			return response
		});
	}


	async function generatransectos(conjuntodatosID) {
		{
			var wherestr = "FeatureID=" + conjuntodatosID;
			featureLayertransectos.queryFeatures({
				outFields: ["FeatureID", "XLocation", "YLocation"],
				returnGeometry: false,
				returnDistinctValues: true,
				where: wherestr
			}).then(createresultadostransectos, function(error) {
				console.error(error);
			});
		}
	}

	function createresultadostransectos(results) {
		var numResults = results.features.length;
		var numDatos = 0;

		var multiPointgratran = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
			attr["OBJECTID"] = results.features[j].attributes.OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.features[j].attributes.FeatureID;
			attr["XLocation"] = results.features[j].attributes.XLocation;
			attr["YLocation"] = results.features[j].attributes.YLocation;

			let Datopoint = new Point(results.features[j].attributes.XLocation, results.features[j].attributes.YLocation, new SpatialReference({ wkid: 4326 }))

			multiPointgratran.addPoint(Datopoint);

		}

		const hullPolygon = geometryEngine.convexHull(multiPointgratran);
		//	  var params = {
		//            points: multiPointgratran,
		//            spatialReference: { wkid: 4326 }
		//          };
		//
		//          geometryService.aggregatePoints(params).then(function(response) {
		//            var hullPolygon = response.singlePartPolygon.geometry;

		var polygonGraphic = new Graphic({
			geometry: hullPolygon,
			symbol: {
				type: "simple-fill",
				color: [227, 139, 79, 0.8],
				outline: {
					color: [255, 255, 255],
					width: 1
				}
			}
		});

		graphicsTransectos.add(polygonGraphic)

	}
	
		async function generatransectosDB(conjuntodatosID) {
		{
			var wherestr = "featureID = " + conjuntodatosID;
            let url = "consultaMEASUREMENT?sqlwhere=" + wherestr;

		esriRequest(url, {
			responseType: "json"
		}).then(createresultadostransectosDB, function(error) {
			console.error(error);
		});
		}
	}

	function createresultadostransectosDB(results) {
		var numResults = results.data.length;;

		var multiPointgratran = new Multipoint();

		for (var j = 0; j < numResults; j++) {

			attr = {};
			//    var distID = results.features[j].attributes.ID_CONJUNTO_DATOS;
//			attr["OBJECTID"] = results.data[j].OBJECTID;
			attr["ID_CONJUNTO_DATOS"] = results.data[j][0];
			attr["XLocation"] = results.data[j][1];
			attr["YLocation"] = results.data[j][2];

			let Datopoint = new Point(results.data[j][1], results.data[j][2], new SpatialReference({ wkid: 4326 }))

			multiPointgratran.addPoint(Datopoint);

		}

		const hullPolygon = geometryEngine.convexHull(multiPointgratran);
		//	  var params = {
		//            points: multiPointgratran,
		//            spatialReference: { wkid: 4326 }
		//          };
		//
		//          geometryService.aggregatePoints(params).then(function(response) {
		//            var hullPolygon = response.singlePartPolygon.geometry;

		var polygonGraphic = new Graphic({
			geometry: hullPolygon,
			symbol: {
				type: "simple-fill",
				color: [227, 139, 79, 0.8],
				outline: {
					color: [255, 255, 255],
					width: 1
				}
			}
		});

		graphicsTransectos.add(polygonGraphic)

	}

	function isNumber(value) {
		return typeof value === 'number';
	}

});