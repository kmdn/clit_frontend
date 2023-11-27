/**
 * IDs for the input and the output component/node of the Cytoscape graph
 */
const componentIdInput = "input";
const componentIdOutput = "output";

/**
 * JSON keys for pipeline configuration
 */
const keyNameId = "id";
const keyNamePipelineConfigType = "pipelineConfigType";
const keyNameComponents = "components";
const keyNameStartComponents = "startComponents";
const keyNameEndComponents = "endComponents";
const keyNameConnections = "connections";

/**
 * JSON keys for experiment task (result)
 */
const keyNameExperimentTasks = "experimentTasks";
const keyNameExperimentId = "experimentId";
const keyNameTaskId = "taskId";
const keyNameDocuments = "documents";
const keyNamePipelineConfig = "pipelineConfig";
const keyNameCurrentComponent = "currentComponent";
const keyNameState = "state";
const keyNameErrorMessage = "errorMessage";

/**
 * JSON keys for annotated documents
 */
const keyNameComponentId = "componentId";
const keyNameText = "text";
const keyNameMentions = "mentions";
const keyNamePipelineType = "pipelineType";
const keyNameOriginalMention = "originalMention";
const keyNameOffset = "offset";
const keyNameDisambiguated = "disambiguated";
const keyNamePossibleAssignments = "possibleAssignments";
const keyNameAssignment = "assignment";

/**
 * Pipeline configuration types
 */
const enumNamePipelineConfigTypeStandard = "standard";
const enumNamePipelineConfigTypeCustom = "custom";
const enumNamePipelineConfigTypeComplex = "complex";

/**
 * Experiment task states
 */
const enumNameStateBuild = "BUILD";
const enumNameStateDone = "DONE";
const enumNameStateFailed = "FAILED";

/**
 * Experiment task types
 */
const PipelineType = {
		MD: "MD",
		CG: "CG",
		ED: "ED",
		MD_CG: "MD_CG",
		CG_ED: "CG_ED",
		FULL: "FULL"
};


/**
 * Maps the names of the node types (e.g. mention detector, splitter) to their ID
 * abbreviation (e.g. MD, SP)
 */
const typeNameToTypeIdMap = {
		"md" : "MD",
		"cg" : "CG",
		"ed" : "ED",
		"cg_ed" : "CG_ED",
		"combiner" : "CO",
		"splitter" : "SP",
		"translator" : "TR",
		"filter" : "FI"
};

const typeIdToTypeNameMap = {
		"MD" : "md",
		"CG" : "cg",
		"ED" : "ed",
		"CG_ED" : "cg_ed",
		"CO" : "combiner",
		"SP" : "splitter",
		"TR" : "translator",
		"FI" : "filter"
};

const typeNameToTypeStringMap = {
		"md" : "Mention Detector",
		"cg" : "Candidate Generator",
		"cg_ed" : "Candidate Generator Disambiguator (combined)",
		"ed" : "Entity Disambiguator",
		"combiner" : "Combiner",
		"splitter" : "Splitter",
		"translator" : "Translator",
		"filter" : "Filter"
};

const linkingComponentTypes = [
	"md",
	"cg",
	"cg_ed",
	"ed"
];

const interComponentProcessorTypes = [
	"combiner",
	"splitter",
	"translator",
	"filter"
];

/**
 * Value for custom IP address based components
 */
const customVal = "Other (IP-based)";
const defaultCustomVal = "http://host.docker.internal:5001";

/**
 * Defines colors for the component types
 */
const typeToColorMap = {
		"input": "black",
		"output" : "black",
		"md" : "#9ccc65",
		"cg" : "#9ccc65",
		"ed" : "#9ccc65",
		"cg_ed" : "#9ccc65",
		"splitter" : "#fbc02d",
		"combiner" : "#fbc02d",
		"translator" : "grey",
		"filter" : "grey",
		"default" : "yellow"
};

/**
 * Default example of a complex pipeline. Defined in pipelines.js.
 */
const defaultExamplePipeline = "md_combined_cged";

/**
 * Cytoscape layout configuration
 */
var cyLayoutConfig = {
		name: 'klay',
		klay: {
			spacing: 50
		},
		nodeDimensionsIncludeLabels: true,
		padding: 20
		//padding: 40
	};

/**
 * Linker index
 */
var linkerIndex = 1;

/**
 * List of current pipeline configurations in the experiment
 */
var pipelineConfigs = {};

/**
 * List of current pipeline configuration graphs in the experiment
 */
var pipelineCyGraphs = {};

/**
 * Holds a variable for the last focused pipeline graph. Used for key bindings.
 */
var lastFocusedPipeline = 1;



function setup() {
	// Initialize multiselects
	$('#experimentType').multiselect();
	$('#matching').multiselect();
	$('#datasets').multiselect();
	$('#knowledgeBases').multiselect();

	// Initialize buttons
	$("#addStandardLinker").on("click", function () {
		addStandardLinker();
	});

	$("#addSimplePipeline").on("click", function () {
		addSimplePipeline();
	});

	$("#addComplexPipeline").on("click", function () {
		addComplexPipeline();
	});

	$('#submit').click( function() {
		submitExperiment();
	});

	// fill dropdowns
	fillExamplePipelinesDropdown(examplePipelineConfigs);
	fillExampleTextsDropdown(exampleInputTexts);
	fillDatasetsDropdown();

	// make the name of an uploaded file appear on select
	$(".custom-file-input").on("change", function() {
	  var fileName = $(this).val().split("\\").pop();
	  $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
	});

}


/**
 * Show the form elements to write a text into a text box.
 * Hide the file upload.
 */
function showTextFieldInput() {
	$("#textFieldDiv").show();
	$("#fileUploadDiv").hide();
}


/**
 * Show the form elements to upload a file as input.
 * Hide the text box.
 */
function showFileUploadInput() {
	$("#fileUploadDiv").show();
	$("#textFieldDiv").hide();
}


function showComponentDetails(pipelineConfig, cy, componentId, componentType) {
	var component = pipelineConfig[keyNameComponents][componentType].find(x => x.id == componentId);
	
	var detailsView = getComponentDetailsViewDiv(pipelineConfig.id);
	detailsView.find("h5").text(typeNameToTypeStringMap[componentType]);
	detailsView.find("p").text(componentId);
	
	// show dropdowns for value, dependency and target selection
	fillComponentValueDropdown(pipelineConfig, cy, componentId, componentType, component.value);
	fillComponentDependenciesDropdown(pipelineConfig, cy, componentId);
	fillComponentTargetsDropdown(pipelineConfig, cy, componentId);
	
	// update delete button
	detailsView.find(".btn-delete-component").off("click").click(function() {
		deleteComponent(pipelineConfig, cy, componentId);
	});
}

function getComponentDependencies(pipelineConfig, componentId) {
	var dependencies = [];
	$.each(pipelineConfig[keyNameConnections], function(index, connection) {
		if (connection.target == componentId) {
			dependencies.push(connection.source);
		}
	});
	if (pipelineConfig[keyNameStartComponents].indexOf(componentId) > -1) {
		dependencies.push(componentIdInput);
	}
	return dependencies;
}

function getComponentTargets(pipelineConfig, componentId) {
	var targets = [];
	$.each(pipelineConfig[keyNameConnections], function(index, connection) {
		if (connection.source == componentId) {
			targets.push(connection.target);
		}
	});
	if (pipelineConfig[keyNameEndComponents].indexOf(componentId) > -1) {
		targets.push(componentIdOutput);
	}
	return targets;
}

/**
 * Return possible component values (i.e. linkers for MD, CG, CG_ED, ED, and various values for the
 * inter-component processors (ICP))
 */
function getPossibleComponentValues(pipelineConfig, componentType, callback) {
	var possibleValues = [];
	if (isLinkingComponent(componentType)) {
		getLinkers(componentType, callback);
	} else if (isInterComponentProcessor(componentType)) {
		getICPs(componentType, callback);
	}
	return possibleValues;
}


/**
 * Request datasets from the back-end.
 */
function getDatasets(callback) {
	var url = "datasets";
	$.ajax({
		type : "GET",
		url: url,
		success : function(data) {
			callback(data);
		},
		error : function(error) {
			console.log(error);
		}
	});
}

/**
 * Request linkers from the back-end for a given task type.
 */
function getLinkers(pipelineType, callback) {
	var url = "linkers";
	if (typeof pipelineType !== undefined) {
		url += "?pipelineType=" + pipelineType;
	}
	$.ajax({
		type : "GET",
		url: url,
		success : function(data) {
			callback(data);
		},
		error : function() {}
	});
}

/**
 * Request inter-component processors (ICP) from the back-end for a given ICP type.
 */
function getICPs(icpType, callback) {
	var url = "icps";
	if (typeof icpType !== undefined) {
		url += "?icpType=" + icpType;
	}
	$.ajax({
		type : "GET",
		url: url,
		success : function(data) {
			callback(data);
		},
		error : function() {}
	});
}


/**
 * Return possible component dependencies for dropdown selection
 */ 
function getPossibleComponentDependencies(pipelineConfig, componentId) {
	var possibleDependencies = [];
	possibleDependencies.push(componentIdInput);
	// TODO filter to valid ones
	$.each(pipelineConfig[keyNameComponents], function(key, componentList) {
		$.each(componentList, function(index, component) {
			if (component.id != componentId) {
				possibleDependencies.push(component.id);
			}
		});
	});
	return possibleDependencies;
}

/**
 * Return possible component targets for dropdown selection
 */ 
function getPossibleComponentTargets(pipelineConfig, componentId) {
	var possibleTargets =[];
	// TODO filter to valid ones
	$.each(pipelineConfig[keyNameComponents], function(key, componentList) {
		$.each(componentList, function(index, component) {
			if (component.id != componentId) {
				possibleTargets.push(component.id);
			}
		});
	});
	possibleTargets.push(componentIdOutput);
	return possibleTargets;
}

/**
 * Generates the HTML of the dropdown menu for adding new components to a complex pipeline
 */
function fillAddComponentDropdown(pipelineConfig, cy) {
	var pipelineDiv = getPipelineDiv(pipelineConfig.id);
	var dropdown = pipelineDiv.find(".dropdown-add-component > div");
	dropdown.empty();
	
	// components
	$.each(linkingComponentTypes, function(i, nodeType) {
		dropdown.append($("<a></a>").attr("class", "dropdown-item").attr("href", "#")
				.attr("data-type", nodeType).text(typeNameToTypeStringMap[nodeType]));
	});
	
	dropdown.append($("<div></div>").attr("class", "dropdown-divider"));
	
	// inter-component processors
	$.each(interComponentProcessorTypes, function(i, nodeType) {
		dropdown.append($("<a></a>").attr("class", "dropdown-item").attr("href", "#")
				.attr("data-type", nodeType).text(typeNameToTypeStringMap[nodeType]));
	});
	
	// event handler
	var dropdownElements = pipelineDiv.find(".dropdown-add-component > div > a");
	dropdownElements.off("click");
	dropdownElements.on("click", function() {
		var componentType = $(this).data("type");
		var componentId = getFreeComponentId(pipelineConfig, componentType);
		var componentValue = getComponentDefault(componentType);
		addComponent(pipelineConfig, cy, componentId, componentType, componentValue);
	});
}

/**
 * Generates the HTML of the dropdown menu for choosing the value of a component of a complex
 * pipeline
 */
function fillComponentValueDropdown(pipelineConfig, cy, componentId, componentType, componentValue) {
	getPossibleComponentValues(pipelineConfig, componentType, function(possibleComponentValues) {
		// add additional option for custom IP address based APIs
		possibleComponentValues.push(customVal);

		// add options to the dropdown
		var dropdown = getPipelineDiv(pipelineConfig.id).find(".dropdown-component-value");
		dropdown.empty();
		$.each(possibleComponentValues, function(index, entry) {
			var option = $("<option></option>").attr("value", entry).text(entry);
			dropdown.append(option);
		});

		// update the selected value in the dropdown list and show/hide the input field for custom values
		if (componentValue == customVal) {
			// if the current value is the default label for a custom value Val (customVal = "Other"), custom value was
			// selected, but no input entered,
			// select the custom value in the dropdown list
			dropdown.val(customVal);
			// show field for custom component API and the input form with the default value (or empty)
			enableCustomComponentForm(pipelineConfig, cy, componentId, componentType, defaultCustomVal);
		} else if ($.inArray(componentValue, possibleComponentValues) == -1) {
			// if the current value is not "Other" or part of the predefined possible values, previously a custom value was
			// selected for this component and value entered,
			// select the custom value in the dropdown list
			dropdown.val(customVal);
			// show the field for custom component API with the entered value
			enableCustomComponentForm(pipelineConfig, cy, componentId, componentType, componentValue);
		} else {
			// select the value in the dropdown list
			dropdown.val(componentValue);
			// hide the field for custom component API
			disableCustomComponentForm();
		}

		dropdown.multiselect('rebuild');
		dropdown.off("change"); // remove old event handler
		dropdown.change(function() {
			var value = $(this).val();

			// handle custom IP address based APIs
			if (value == customVal) {
				enableCustomComponentForm(pipelineConfig, cy, componentId, componentType, defaultCustomVal);
				setComponentValue(pipelineConfig, cy, componentId, componentType, defaultCustomVal);
			} else {
				disableCustomComponentForm();
				setComponentValue(pipelineConfig, cy, componentId, componentType, value);
			}

		});
	});
}

/**
 * Fill the component dependency multiselect dropdown with possible dependencies and select the
 * currently active ones
 */
function fillComponentDependenciesDropdown(pipelineConfig, cy, componentId) {
	var componentDependencies = getComponentDependencies(pipelineConfig, componentId);
	var possibleComponentDependencies = getPossibleComponentDependencies(pipelineConfig, componentId);
	var dropdown = getPipelineDiv(pipelineConfig.id).find(".dropdown-component-dependencies");
	dropdown.empty();
	$.each(possibleComponentDependencies, function(index, entry) {
		var option = $("<option></option>").attr("value", entry).text(entry);
		if (componentDependencies.indexOf(entry) > -1) {
			option.prop("selected", "selected");
		}
		dropdown.append(option);
	});
	dropdown.multiselect('rebuild');
	dropdown.off("change"); // remove old event handler
	dropdown.change(function() {
		var value = $(this).val();
		setComponentDependencies(pipelineConfig, cy, componentId, value);
	});
}

/**
 * Fill the component target multiselect dropdown with possible targets and select the
 * currently active ones
 */
function fillComponentTargetsDropdown(pipelineConfig, cy, componentId) {
	var componentTargets = getComponentTargets(pipelineConfig, componentId);
	var possibleComponentTargets = getPossibleComponentTargets(pipelineConfig, componentId);
	var dropdown = getPipelineDiv(pipelineConfig.id).find(".dropdown-component-targets");
	dropdown.empty();
	$.each(possibleComponentTargets, function(index, entry) {
		var option = $("<option></option>").attr("value", entry).text(entry);
		if (componentTargets.indexOf(entry) > -1) {
			option.prop("selected", "selected");
		}
		dropdown.append(option);
	});
	dropdown.multiselect('rebuild');
	dropdown.off("change"); // remove old event handler
	dropdown.change(function() {
		var value = $(this).val();
		setComponentTargets(pipelineConfig, cy, componentId, value);
	});
}


/**
 * Fill the dropdown list with the example texts
 */
function fillExampleTextsDropdown(exampleInputTexts) {
	var dropdown = $("#exampleTextDropdown");
	dropdown.empty();
	$.each(exampleInputTexts, function(index, entry) {
		var exampleId = entry["id"];
		var displayName = entry["displayName"];
		var option = $("<a></a>").addClass("dropdown-item").attr("value", exampleId).text(displayName);
		dropdown.off("click"); // remove old event handler
		option.click(function() {
			var exampleId = $(this).attr("value");
			var exampleText = getExampleTextById(exampleId);
			loadExampleText(exampleText);
		});
		dropdown.append(option);
	});
}


/**
 * Fill the dropdown list with the example pipelines
 */
function fillExamplePipelinesDropdown(examplePipelineConfigs) {
	var dropdown = $("#examplePipelineDropdown");
	dropdown.empty();
	$.each(examplePipelineConfigs, function(index, entry) {
		var exampleId = entry["exampleId"];
		var displayName = entry["displayName"];
		var option = $("<a></a>").addClass("dropdown-item").attr("value", exampleId).text(displayName);
		dropdown.off("click"); // remove old event handler
		option.click(function() {
			var exampleId = $(this).attr("value");
			var pipelineConfig = getSamplePipelineConfigById(exampleId);
			addComplexPipeline(pipelineConfig);
		});
		dropdown.append(option);
	});
}


/**
 * Show input form for custom IP address based API definitions
 */
function enableCustomComponentForm(pipelineConfig, cy, componentId, componentType, componentValue) {
	$("#customComponentInput").show();

	// method might be called after a value was defined already previously
	if (componentValue != null) {
		$("#customComponentIP").val(componentValue);
	}

	// add event handler to update the pipeline config immediately when an IP is entered
	$("#customComponentIP").off("input"); // first remove existing event handlers
	$("#customComponentIP").on("input", function() {
		var ip = $(this).val();

		// if the input is deleted, use the default custom label again, otherwise the node in the graph has no label
		if (ip == null || ip == "") {
			setComponentValue(pipelineConfig, cy, componentId, componentType, customVal);
		} else {
			setComponentValue(pipelineConfig, cy, componentId, componentType, ip);
		}
	});
}


/**
 * Hide input form for custom IP address based API definitions
 */
function disableCustomComponentForm() {
	$("#customComponentInput").hide();
	$("#customComponentIP").val(""); // remove input text
	$("#customComponentIP").off("input"); // remove event handler
}


/**
 * Load an example text into the input text field
 */
function loadExampleText(textObj) {
	var text = textObj["text"];
	var inputField = $("#inputText").text(text);
}


/**
 * Return the text with a certain example ID
 */
function getExampleTextById(exampleId) {
	var text = null;
	$.each(exampleInputTexts, function(index, entry) {
		if (entry["id"] == exampleId) {
			exampleText = $.extend(true, {}, entry); // deep copy
		}
	});
	return exampleText;
}


/**
 * Return the example pipeline config with a certain example ID
 */
function getSamplePipelineConfigById(exampleId) {
	var pipelineConfig = null;
	$.each(examplePipelineConfigs, function(index, entry) {
		if (entry["exampleId"] == exampleId) {
			// var pipelineConfig = Object.assign({}, entry); // shallow copy
			pipelineConfig = $.extend(true, {}, entry); // deep copy
		}
	});
	return pipelineConfig;
}


/**
 * Add a standard linker.
 * Generates the HTML and adds the event handlers.
 */
function addStandardLinker() {
	hideGlobalErrorMessage();
	var newRow = $('<div class="standard-linker card col-md-12 text-center" linker-id="' + linkerIndex + '">');
	var cols = buildStandardLinkerConfigHtml(linkerIndex);
	newRow.append(cols);
	$("#linker").append(newRow);

	fillLinkerDropdown(newRow, ".dropdown-linker");
 	$(".dropdown-linker").change(function () {
        var end = this.value;
        if (end == customVal) {
			$("#customStandardLinker").show();
			$("#customStandardLinkerIP").val(defaultCustomVal);
		
			// add event handler to update the pipeline config immediately when an IP is entered
			$("#customStandardLinkerIP").off("input"); // first remove existing event handlers
			$("#customStandardLinkerIP").on("input", function() {
				var ip = $(this).val();
		
				// if the input is deleted, use the default custom label again, otherwise the node in the graph has no label
/*				if (ip == null || ip == "") {
*/					//var component = pipelineConfig[keyNameComponents][componentType].find(x => x.id === componentId);
					//component.value = componentValue;
				const linkerConfigs = getStandardLinkerFormData();
				linkerConfigs[(linkerIndex-2)+""].linker = ip;

				
				/*} else {
					setComponentValue(pipelineConfig, cy, componentId, componentType, ip);
				}*/
			});
		}else {
			$("#customStandardLinker").hide();
		}

    });
    
	$(".remove-pipeline").on("click", function (event) {
		$(this).closest(".standard-linker").remove();
	});

	linkerIndex += 1;
}


/**
 * Add a simple pipeline build of a MD and a combined CG-ED to the experiment.
 * Generates the HTML and adds the event handlers.
 */
function addSimplePipeline() {
	hideGlobalErrorMessage();
	var newRow = $('<div class="custom-linker card col-md-12 text-center" linker-id="' + linkerIndex + '">');
	var cols = buildSimplePipelineConfigHtml(linkerIndex);
	newRow.append(cols);
	$("#linker").append(newRow);

	fillLinkerDropdown(newRow, ".dropdown-linker-md", "md");
	fillLinkerDropdown(newRow, ".dropdown-linker-cg-ed", "cg_ed");

	$(".remove-pipeline").on("click", function (event) {
		$(this).closest(".custom-linker").remove();
	});

	linkerIndex += 1;
}


/**
 * Add a complex pipeline to the experiment.
 * Generates the HTML and adds the event handlers.
 * Optional argument is a pipeline configuration JSON.
 */
function addComplexPipeline(pipelineConfig) {
	hideGlobalErrorMessage();
	var newRow = $('<div class="complex-pipeline card col-md-12 text-center" linker-id="' + linkerIndex + '">');
	var cols = buildComplexPipelineConfigHtml(linkerIndex);
	newRow.append(cols);
	$("#linker").append(newRow);

	// Use first from examples as default pipeline config
	if (pipelineConfig == null) {
		var pipelineConfig = getSamplePipelineConfigById(defaultExamplePipeline);
	}

	// Assign the current index to this pipeline
	pipelineConfig.id = linkerIndex;

	// Initialize Cytoscape
	var pipelineGraph = generatePipelineGraph(pipelineConfig);
	var divId = "cy" + linkerIndex;
	var cy = cytoscape({
		container: document.getElementById(divId),
		elements: pipelineGraph,
		layout: cyLayoutConfig,
		minZoom: 0.2,
		maxZoom: 5,
		//userZoomingEnabled: false,
		//userPanningEnabled: false,
		wheelSensitivity: 0.2,
		style: [{
			selector: 'node',
			style: {
				'background-color': function(ele){ return getComponentColor(ele.data('type')) },
				'label': 'data(label)',
				'text-wrap': 'wrap',
				'text-valign': 'bottom',
				'text-margin-y': '5px',
			}
		},
		{
			selector: 'edge',
			style: {
				'curve-style': 'bezier',
				'target-arrow-shape': 'triangle'
			}
		},
		{
			selector: 'node:selected',
			style: {
				'background-color': "red",
			}
		}]
	});

	// Bind tap/click event to nodes and edges
	cy.on('tap', function(event){
		if (event.target === cy){
			// ignore tap on background
			hideComponentDetailsView(pipelineConfig.id);
		} else if (event.target.isEdge()) {
			// ignore tap on edge
			hideComponentDetailsView(pipelineConfig.id);
		} else {
			var componentId = event.target.data('id');
			var componentType = event.target.data('type');
			if (componentId == componentIdInput || componentId == componentIdOutput) {
				// ignore tap on start or end node
				hideComponentDetailsView(pipelineConfig.id);
			} else {
				showComponentDetails(pipelineConfig, cy, componentId, componentType);
				showComponentDetailsView(pipelineConfig.id);
				// save pipeline id and node id for key bindings
				lastFocusedPipeline = pipelineConfig['id'];
				cy.focusedNode = componentId;
			}
		}
	});

	// Bind key 'del' for removing nodes
	Mousetrap.bind('del', function(e, combo) {
		// Get the last focused pipeline (config and cy graph). Simply using
		// the variables 'cy' and 'pipelineConfig' doesn't work here. Mousetrap
		// always refers to the last 'cy'/'pipelineConfig'.
		currentCy = pipelineCyGraphs[lastFocusedPipeline];
		currentPipelineConfig = pipelineConfigs[lastFocusedPipeline]
		if (currentCy.focusedNode != null) {
			deleteComponent(currentPipelineConfig, currentCy, currentCy.focusedNode);
		}
	});

	fillAddComponentDropdown(pipelineConfig, cy);

	// Add pipeline config and Cytoscape graph to global dictionary
	pipelineConfigs[linkerIndex] = pipelineConfig;
	pipelineCyGraphs[linkerIndex] = cy;

	// Initialize delete button for this pipeline
	$(".remove-pipeline").on("click", function (event) {
		var pipelineDiv = $(this).closest(".complex-pipeline");
		var pipelineId = parseInt(pipelineDiv.attr('linker-id'));
		pipelineDiv.remove();
		delete pipelineConfigs[pipelineId];
		delete pipelineCyGraphs[pipelineId];
		//console.log("Removed complex pipeline " + pipelineId);
	});

	// Initialize clone button for this pipeline
	$(".clone-pipeline").on("click", function (event) {
		var pipelineDiv = $(this).closest(".complex-pipeline");
		var pipelineId = parseInt(pipelineDiv.attr('linker-id'));
		clonePipeline(pipelineId);
		//console.log("Cloned complex pipeline " + pipelineId);
	});

	linkerIndex += 1;
}


/**
 * Creates a copy of a complex pipeline.
 */
function clonePipeline(pipelineId) {
	var pipelineConfig = $.extend(true, {}, pipelineConfigs[pipelineId]); // deep copy
	pipelineConfig["id"] = linkerIndex;
	addComplexPipeline(pipelineConfig);
}


/**
 * Get form data about standard linkers.
 */
function getStandardLinkerFormData() {
	linkerConfigs = [];
	$('.standard-linker').each(function(index, linker) {
		var linkerId = parseInt($(linker).attr('linker-id'));
		var linkerName = $(linker).find('select.dropdown-linker option:selected').val();
		if ($("#customStandardLinkerIP").is(":visible")) {
			linkerName = $("#customStandardLinkerIP").val()
		}
		linkerConfig = {
				'id' : linkerId,
				'pipelineConfigType' : 'standard',
				'linker' : linkerName};
		linkerConfigs.push(linkerConfig);
	});
	return linkerConfigs;
}


/**
 * Get form data about custom linker pipelines.
 */
function getLinkerPipelineFormData() {
	linkerConfigs = [];
	$('.custom-linker').each(function(index, linker) {
		var linkerId = parseInt($(linker).attr('linker-id'));
		var mentionDetector= $(linker).find('select.dropdown-linker-md option:selected').val();
		var candidateGeneratorDisambiguator = $(this).find('select.dropdown-linker-cg-ed option:selected').val();
		linkerConfig = {
				'id' : linkerId,
				'pipelineConfigType' : 'custom',
				'mentionDetector' : mentionDetector,
				'candidateGeneratorDisambiguator' : candidateGeneratorDisambiguator};
		linkerConfigs.push(linkerConfig);
	});
	return linkerConfigs;
}


/**
 * Get form data about complex linker pipelines.
 */
function getComplexPipelineFormData() {
	linkerConfigs = [];
	//$('.complex-pipeline').each(function(index, pipeline) {
	$.each(pipelineConfigs, function(index, pipelineConfig) {
		//var linkerConfig = generatePipelineConfigJson(pipelineConfig);
		var linkerConfig = pipelineConfig;
		linkerConfigs.push(linkerConfig);
	});
	return linkerConfigs;
}


/**
 * Get form data about linkers and pipelines.
 */
function getLinkerConfigFormData() {
	var linkerConfigs = [];
	linkerConfigs.push(...getStandardLinkerFormData()); // spread syntax "..."
	linkerConfigs.push(...getLinkerPipelineFormData());
	linkerConfigs.push(...getComplexPipelineFormData());
	return linkerConfigs;
}


/**
 * Read content of an uploaded input file and return an array with the texts.
 * The file is expected to have one input text per line.
 * Loading the file contents is done asynchronously. Hence, a Promise object is returned.
 * https://stackoverflow.com/questions/31746837/
 */
function readInputFile(file) {
	var fileReader = new FileReader();
	return new Promise((resolve, reject) => {
		fileReader.onload = function(fileLoadedEvent){
			var fileContent = fileLoadedEvent.target.result;
			// TODO try the split and catch with reject()
			var inputTexts = fileContent.split('\n');
			resolve(inputTexts);
		};
		fileReader.onerror = error => reject(error)
		fileReader.readAsText(file)
	})
}


/**
 * Sends an experiment request.
 */
function sendExperimentRequest(data) {
	$.ajax({
		type : "POST",
		url: "execute",
		data : { 'experimentData' : JSON.stringify(data) },
		success : function(experimentResult) {
			//document.getElementById("result").innerHTML = JSON.stringify(data, undefined, 2);
			//console.log(data);
			var noErrors = true;
			var experimentTasks = experimentResult[keyNameExperimentTasks];
			$.each(experimentTasks, function(index, result) {
				if (result.state == enumNameStateFailed) {
					showErrorMessage(result.taskId, result.errorMessage);
					noErrors = false;
				}
			});

			// TODO Open also if at least one of the experiment tasks was executed successfully?
			if (noErrors) {
				var win = window.open("result", '_blank');
			}
		},
		error : function(data) {
			console.log(data);
			showGlobalErrorMessage(data.responseText);
		}
	});
}


/**
 * Read the pipeline configurations (all, the standard linkers, simple pipelines and complex pipelines) and send them to
 * the back-end.
 */
function submitExperiment() {
	hideAllErrorMessages();

	// collect the data from the form
	var data = {};

	// task type
	data.pipelineType = $('#experimentType option:selected').val();

	// matching
	data.matching = $('#matching option:selected').val();

	// linkers and pipeline configurations
	data.linkerConfigs = getLinkerConfigFormData();

	// knowledge bases
	data.knowledgeBases = []
	$('#knowledgeBases option:selected').each(function() {
		data.knowledgeBases.push($(this).val());
	});

	// input texts, either from the text file or input the file
	// Note: This must be the last, as reading the input file is an asynchronous function after
	// which the request is sent
	if ($('#input-text').hasClass('active')) {
		// Option 1: Text
		data.inputTexts = [$('#inputText').val()];
		sendExperimentRequest(data); // send request
	} else if ($('#input-dataset').hasClass('active')) {
		// Option 2: Dataset
		data.datasets = []
		$('#datasetDropdown option:selected').each(function() {
			data.datasets.push($(this).val());
		});
		sendExperimentRequest(data); // send request
	} else if ($('#input-file').hasClass('active')) {
		// Option 3: Upload file
		var file = $('#inputFileUpload').prop('files')[0];
		readInputFile(file).then(function(content) { // asynchronous (using a Promise object)
			data.inputTexts = content;
			sendExperimentRequest(data); // send request
		}).catch(function(error) {
			showGlobalErrorMessage("Could not read file: " + error);
		});
	} else {
		console.log("Error handling the input");
	}
}


/**
 * Add a new component
 */
function addComponent(pipelineConfig, cy, componentId, componentType, componentValue) {
	var component = {id: componentId, value: componentValue, new: true};
	var components = pipelineConfig[keyNameComponents][componentType];
	if (components == null) {
		pipelineConfig[keyNameComponents][componentType] = [];
		components = pipelineConfig[keyNameComponents][componentType];
	}
	components.push(component);
	console.log("Added node " + componentId);
	updatePipelineGraph(cy, pipelineConfig);
}

/**
 * Update the value of a component
 */
function setComponentValue(pipelineConfig, cy, componentId, componentType, componentValue) {
	var component = pipelineConfig[keyNameComponents][componentType].find(x => x.id === componentId);
	component.value = componentValue;
	updatePipelineGraph(cy, pipelineConfig);
}

/**
 * Update the dependencies of a component
 */
function setComponentDependencies(pipelineConfig, cy, componentId, componentDependencies) {
	// remove property "new"
	var componentType = getComponentTypeById(componentId);
	delete pipelineConfig[keyNameComponents][componentType].find(x => x.id == componentId).new;
	
	// delete all existing connections
	pipelineConfig[keyNameConnections] = pipelineConfig[keyNameConnections].filter(function(obj) {
		return obj.target != componentId;
	});
	
	// delete from start components
	pipelineConfig[keyNameStartComponents] = pipelineConfig[keyNameStartComponents].filter(function(obj) {
		return obj != componentId;
	});
	
	// add all new
	$.each(componentDependencies, function(index, componentDependency) {
		if (componentDependency === componentIdInput) {
			pipelineConfig[keyNameStartComponents].push(componentId);
		} else {
			var connection = {source: componentDependency, target: componentId};
			pipelineConfig[keyNameConnections].push(connection);
		}
	});
	
	updatePipelineGraph(cy, pipelineConfig);
	updatePipelineGraphLayout(cy);
}

/**
 * Update the targets of a component
 */
function setComponentTargets(pipelineConfig, cy, componentId, componentTargets) {
	// delete all existing connections
	pipelineConfig[keyNameConnections] = pipelineConfig[keyNameConnections].filter(function(obj) {
		return obj.source != componentId;
	});
	
	// delete from end components
	pipelineConfig[keyNameEndComponents] = pipelineConfig[keyNameEndComponents].filter(function(obj) {
		return obj != componentId;
	});
	
	// add all new
	$.each(componentTargets, function(index, componentTarget) {
		if (componentTarget === componentIdOutput) {
			pipelineConfig[keyNameEndComponents].push(componentId);
		} else {
			var connection = {source: componentId, target: componentTarget};
			pipelineConfig[keyNameConnections].push(connection);
		}
	});
	
	updatePipelineGraph(cy, pipelineConfig);
	updatePipelineGraphLayout(cy);
}

/**
 * Delete pipeline component and update Cytoscape graph
 */
function deleteComponent(pipelineConfig, cy, componentId) {
	var componentType = getComponentTypeById(componentId);
	
	// delete component
	var componentList = pipelineConfig[keyNameComponents][componentType];
	pipelineConfig[keyNameComponents][componentType] = componentList.filter(function(obj) {
		return obj.id != componentId;
	});
	
	// delete edges
	var connectionList = pipelineConfig[keyNameConnections];
	pipelineConfig[keyNameConnections] = connectionList.filter(function(obj) {
		return obj.source != componentId && obj.target !== componentId;
	});
	
	// delete from start and end components list
	$.each([keyNameStartComponents, keyNameEndComponents], function(index, listName) {
		var componentsList = pipelineConfig[listName];
		pipelineConfig[listName] = componentsList.filter(function(obj) {
			return obj != componentId;
		});
	});

	console.log("Deleted node " + componentId);
	updatePipelineGraph(cy, pipelineConfig);
	hideComponentDetailsView(pipelineConfig.id);
	hideAllErrorMessages();
}


/**
 * Update the Cytoscape canvas and redraw the graph completely from global variable
 * <tt>pipelineConfig</tt>
 */
function updatePipelineGraph(cy, pipelineConfig) {
	var pipelineGraph = generatePipelineGraph(pipelineConfig);
	cy.json({ elements: pipelineGraph});
}

/**
 * Updates the layout of the Cytoscape graph
 */
function updatePipelineGraphLayout(cy) {
	cy.layout(cyLayoutConfig).run();
}

/** 
 * Generates the Cytoscape pipeline graph from the pipelineConfig
 */
function generatePipelineGraph(pipelineConfig) {
	
	var pipelineGraph = [];
	var edgeId = 1;
	
	// add start and end node
	pipelineGraph.push({data: {id: componentIdInput, type: "input", label: "Input"}});
	pipelineGraph.push({data: {id: componentIdOutput, type: "output", label: "Output"}});
	
	// read pipeline config and add nodes to the graph
	$.each(pipelineConfig[keyNameComponents], function(key, componentList) {
		$.each(componentList, function(index, component) {
			if (component.value == null) {
				var label = "<none>\n(" + component.id + ")"; // with brackets
				//var label = "<none>\n" + component.id;
			} else {
				var label = component.value + "\n(" + component.id + ")"; // with brackets
				//var label = component.value + "\n" + component.id;
			}
			var node = {data: {id: component.id, type: key, label: label}};
//			if (component.new) {
//				node.data.position = {x: 120, y: 120};
//			}
			pipelineGraph.push(node);
		});
	});
	
	// read pipeline config and add edges to the graph
	$.each(pipelineConfig[keyNameConnections], function(index, connection) {
		var edge = {data: {id: 'e' + edgeId, source: connection.source, target: connection.target}};
		pipelineGraph.push(edge);
		edgeId++;
	});
	
	// add connections to start node
	$.each(pipelineConfig[keyNameStartComponents], function(index, componentId) {
		var edge = {data : {id : 'e' + edgeId, source: componentIdInput, target: componentId}};
		pipelineGraph.push(edge);
		edgeId++;
	});
	
	// add connections to end node
	$.each(pipelineConfig[keyNameEndComponents], function(index, componentId) {
		var edge = {data : {id : 'e' + edgeId, source: componentId, target: componentIdOutput}};
		pipelineGraph.push(edge);
		edgeId++;
	});
	
	return pipelineGraph;
}

function generatePipelineConfigJson(pipelineConfig) {
	var pipelineConfig2 = {};
	// add ID and type
	//var linkerId = parseInt($(linker).attr('linker-id'));
	pipelineConfig2[keyNameId] = pipelineConfig[keyNameId];
	pipelineConfig2[keyNamePipelineConfigType] = pipelineConfig[keyNamePipelineConfigType];
	// add components
	$.each(Object.keys(typeNameToTypeStringMap), function(indexComponentType, componentType) {
		if (componentType in pipelineConfig[keyNameComponents]) {
			pipelineConfig2[componentType] = [];
			$.each(pipelineConfig[keyNameComponents][componentType], function(indexComponent, component) {
				var newComponent = {};
				newComponent[component[keyNameId]] = component["value"];
				pipelineConfig2[componentType].push(newComponent);
			});
		}
	});
	// add connections
	pipelineConfig2[keyNameConnections] = [];
	$.each(pipelineConfig[keyNameConnections], function(indexConnection, connection) {
		var newConnection = {};
		newConnection[connection["source"]] = connection["target"];
		pipelineConfig2[keyNameConnections].push(newConnection);
	});
	return pipelineConfig2;
}




/**
 * Returns the next free ID for a given node type
**/
function getFreeComponentId(pipelineConfig, componentType) {
	var typePrefix = typeNameToTypeIdMap[componentType];
	var components = pipelineConfig[keyNameComponents][componentType];
	if (components == null) {
		var freeIdNr = 1;
	} else {
//	var nodes = cy.$('node[id ^= "' + typePrefix + '"]');
		var lastId = 0;
		if (components.length > 0) {
			$.each(components, function(index, component) {
				//var idNr = parseInt(component.id.substring(2)); // assuming ID format XXnn, e.g. MD1, CG24, ED8
				var idNr = parseInt(component.id.substring(component.id.search(/\d/), component.id.length));
				if (idNr > lastId) {
					lastId = idNr;
				}
			});
		}
		var freeIdNr = lastId + 1;
	}
	var freeId = typePrefix + freeIdNr.toString();
	return freeId;
}

/**
 * Returns a default value for a given component type
 */
function getComponentDefault(componentType) {
//	return typeIdToDefaultValueMap[componentType];
	return null;
}

/**
 * Return Cytoscape node color for a given component type
 */
function getComponentColor(type) {
	var color = typeToColorMap[type];
	if (color == null) {
		console.log("No color defined for type '" + type + "'");
		color = typeToColorMap["default"];
	}
	return color;
}

/**
 * Get the type of an component by it's id (MD1 is type "md", SP3 is type "splitter")
 */
function getComponentTypeById(componentId) {
	return typeIdToTypeNameMap[componentId.substring(0, componentId.search(/\d/))];
}

/**
 * Returns the pipeline HTML div of a given complex pipeline
 */
function getPipelineDiv(pipelineId) {
	return $("div[linker-id='" + pipelineId + "']");
}

/**
 * Returns the details view HTML div element of a given complex pipeline
 */
function getComponentDetailsViewDiv(pipelineId) {
	return getPipelineDiv(pipelineId).find("#detailsView");
}

/**
 * Show the component details view
 */
function showComponentDetailsView(pipelineId) {
	getComponentDetailsViewDiv(pipelineId).show();
}

/**
 * Hide the component details view
 */
function hideComponentDetailsView(pipelineId) {
	getComponentDetailsViewDiv(pipelineId).hide();
}

/**
 * Show error message when the pipeline of a task is not valid
 */
function showErrorMessage(pipelineId, errorMessage) {
	if (pipelineId == -1) {
		var errorDiv = $("#global-error-message");
	} else {
		var errorDiv = getPipelineDiv(pipelineId).find(".error-message");
	}
	errorDiv.children("div").html("<strong>Error:</strong> " + errorMessage);
	errorDiv.show();
}

/**
 * Show global error message
 */
function showGlobalErrorMessage(errorMessage) {
	showErrorMessage(-1, errorMessage);
}

/**
 * Hide all error messages
 */
function hideAllErrorMessages() {
	hideGlobalErrorMessage();
	$(".error-message").hide();
}

/**
 * Hide global error message
 */
function hideGlobalErrorMessage() {
	$("#global-error-message").hide();
}

/**
 * Check if <tt>type</tt> is a linking component
 */
function isLinkingComponent(type) {
	return linkingComponentTypes.indexOf(type) > -1;
}

/**
 * Check if <tt>type</tt> is a inter-component processor
 */
function isInterComponentProcessor(type) {
	return interComponentProcessorTypes.indexOf(type) > -1;
}


/**
 * Fill the dropdown list with the linkers.
 */
function fillLinkerDropdown(linkerBox, htmlClass, pipelineType) {
	getLinkers(pipelineType, function(linkers) {
		linkers.push(customVal);
		var dropdown = $(linkerBox).find(htmlClass);
		dropdown.empty();
		$.each(linkers, function(i, linker) {
			dropdown.append($("<option></option>")
					.attr("value", linker).text(linker));
		});
		dropdown.multiselect();
	});
}

/**
 * Fill the dropdown list with the datasets.
 */
function fillDatasetsDropdown() {
	getDatasets(function(datasets) {
		var dropdown = $("#datasetDropdown");
		dropdown.empty();
		$.each(datasets, function(i, dataset) {
			// replace file extension and underscores
			var datasetName = dataset.replace(/\.[^/.]+$/, "").replaceAll("_", " ");
			dropdown.append($("<option></option>")
					.attr("value", dataset).text(datasetName));
		});
		dropdown.multiselect({
			buttonWidth: '100%'
		});
	});
}






// Results


/**
 * Request the experiment result as JSON. Build HTML to display it.
 * @param experimentId ID of the experiment
 * @returns
 */
function getExperimentResult(experimentId) {
	$.ajax({
		type : "POST",
		url : "result",
		data : {
			'id' : experimentId
		},
		success : function(data) {
			//document.getElementById("json").innerHTML = JSON.stringify(data, undefined, 2);
			//console.log(data);
			buildResultHtml(data);
		}
	});
}


function showResult(experimentId) {
	//getLasteResult();
	getExperimentResult(experimentId);
}


/**
 * Returns true if from a given task type it can be concluded that document is disambiguated.
 */
function isDisambiguated(pipelineType) {
	return (pipelineType == PipelineType.ED || pipelineType == PipelineType.CG_ED || pipelineType == PipelineType.FULL);
}


/**
 * Determines the HTML class of a mention for a given task type.
 */
function getMentionHtmlClassByPipelineType(pipelineType) {
	if (pipelineType == PipelineType.MD) {
		return "mention";
	} else if (pipelineType == PipelineType.CG || pipelineType == PipelineType.MD_CG) {
		return "mention possible-mention";
	} else if (pipelineType == PipelineType.ED || pipelineType == PipelineType.CG_ED || pipelineType == PipelineType.FULL) {
		return "mention disambiguated-mention";
	} else {
		console.log("Invalid pipeline type: " + pipelineType);
		return "mention";
	}
}


/**
 * Build HTML of the title of an experiment task.
 */
function buildResultTitleHtml(experimentTaskResult) {
	var html = $("<h5>").addClass("card-title");
	
	var pipelineConfig = experimentTaskResult[keyNamePipelineConfig];
	var pipelineConfigType = pipelineConfig[keyNamePipelineConfigType];
	var linkerId = experimentTaskResult[keyNameTaskId];

	if (pipelineConfigType == enumNamePipelineConfigTypeStandard) {
		var linkerName = pipelineConfig["linker"];
		html.append(linkerId + ": " + linkerName);
	} else if (pipelineConfigType == enumNamePipelineConfigTypeCustom) {
		var mentionDetector = pipelineConfig["mentionDetector"];
		var candidateGeneratorDisambiguator = pipelineConfig["candidateGeneratorDisambiguator"];
		html.append(linkerId + ": " + mentionDetector + " (MD) + " + candidateGeneratorDisambiguator + " (CG+ED)");
	} else {
		html.append(linkerId + ": Complex Pipeline");
	}
	
	return html;
}


/**
 * Build HTML of a mention span.
 */
function buildMentionHtml(mentionHtmlClass, spanId, componentId, documentId, experimentId) {
	// use of data-bracket possibly for URL, but would be text only, as the CSS-after-selector
	// can't contain HTML, only text
	return '<span class="' + mentionHtmlClass + '" data-bracket="" span-id="' + spanId + '" component-id="' +
			componentId + '" document-id="' + documentId + '" experiment-id="' + experimentId + '">';
}


/**
 * Sorts a list of mentions by their character length.
 */
function sortMentionsByCharacterLength(mentions) {
	return mentions.sort(function(a,b) {
		var x = a[keyNameOffset] - b[keyNameOffset]; // ascending: a - b
		return x == 0 ? b[keyNameOriginalMention].length - a[keyNameOriginalMention].length : x; // descending: b - a
	});
}


/**
 * Builds the HTML of experiment results.
 */
function buildResultHtml(experimentResult) {

	// Note: For the annotation (i.e. technically the tooltips), a mapping of spans to URLs is needed. This is
	// implemented in stacked maps. Map1 contains for each experiment a map (Map2), that contains for each document a
	// map (Map3), that contains another map (Map4) for each intermediate result, that contains a list of URLs for each
	// span.

	// Map1 containing a map of documents (i.e. input text) for each experiment
	var experimentToDocumentMap1 = {};

	var experimentTasks = experimentResult[keyNameExperimentTasks];

	// iterate the experiments
	$.each(experimentTasks, function(experimentId, experiment) {

		var experimentHtml = $("<div>").addClass("card").addClass("col-md-8");
		var cardBody = $("<div>").addClass("card-body");
		var cardText = $("<div>").addClass("card-text");

		// all documents, i.e. a collection of a collection of documents: for each input text there is a collection of
		// another collection documents, where the second collection has one document for each intermediate result
		var documentCollection = experiment[keyNameDocuments];

		// Map2 containing a map of intermediate results for each document (i.e. input text)
		// e.g. {1 : {"MD1" : {1 : ["url1", "url2"], 2 : [...]}, "ED3" : {1 : [...]}}, ...}
		var documentToIntermediateResultMap2 = {};

		// iterate the documents
		$.each(documentCollection, function(documentId, documents) {

			var annotatedTextHtml = "";

			// add separating line and heading if there are multiple documents
			if (documentCollection.length > 1) {
				annotatedTextHtml += "<hr>";
				var displayDocumentId = documentId + 1;
				annotatedTextHtml += "<h5>Document " + displayDocumentId + "</h5>";
			}

			// Map3 of a specific document (input text), containing a map of spans for each intermediate result
			// e.g. {"MD1" : {1 : ["url1", "url2"], 2 : [...]}, "ED3" : {1 : [...]}}
			var intermediateResultToSpanMap3 = {};

			// iterate intermediate results
			$.each(documents, function(index, doc) {
				var componentId = doc[keyNameComponentId];

				// Map4 of (a specific document and) a specific intermediate result, containing an array for each span
				// e.g. {0: ["url0", "url1"], 1: ["url1", "url2"], 2: ["url3"], 3: []};
				var spanToMentionMap4 = {};

				var text = doc[keyNameText];
				var mentions = doc[keyNameMentions];
				var pipelineType = doc[keyNamePipelineType];
				var spanId = 0;

				// sort the mentions that have the same offset by descending character length
				// otherwise the span elements for hover are not set correctly
				mentions = sortMentionsByCharacterLength(mentions);

				// add heading if there are intermediate results
				if (documents.length > 1) {
					annotatedTextHtml += "<h6>" + componentId + "</h6>";
				}

				// add annotated text
				annotatedTextHtml += "<p>";
				$.each(text.split(""), function(index, character) { // split by each character

					// check for each mention if it starts or ends at this character
					$.each(mentions, function(i, mention) {
						var originalMention = mention[keyNameOriginalMention];
						var mentionStartPos = mention[keyNameOffset];
						var mentionEndPos = mentionStartPos + originalMention.length;

						// does the mention start here?
						if (mentionStartPos == index) {
							mention[keyNameDisambiguated] = isDisambiguated(pipelineType);
							var mentionHtmlClass = getMentionHtmlClassByPipelineType(pipelineType);
							annotatedTextHtml += buildMentionHtml(mentionHtmlClass, spanId, componentId, documentId,
									experimentId);
							spanToMentionMap4[spanId] = mention;
							spanId++;
						}

						// does the mention end here?
						if (mentionEndPos == index) {
							annotatedTextHtml += '</span>';
						}
					});

					annotatedTextHtml += character;
				});

				annotatedTextHtml += "</p>";

				// add to tooltips map
				intermediateResultToSpanMap3[componentId] = spanToMentionMap4;
			});

			cardText.append(annotatedTextHtml);

			// add to tooltips map
			documentToIntermediateResultMap2[documentId] = intermediateResultToSpanMap3;
		});

		var cardTitle = buildResultTitleHtml(experiment);
		cardBody.append(cardTitle);
		cardBody.append(cardText);
		experimentHtml.append(cardBody);
		$("#result").append(experimentHtml);

		// add to tooltips map
		experimentToDocumentMap1[experimentId] = documentToIntermediateResultMap2;
	});

	// initialize tooltips
	$(document).uitooltip({
		items: ".possible-mention, .disambiguated-mention",
		show: null, // show immediately
		hide: {
			effect: ""
		},
		// make tooltips selectable/clickable (https://stackoverflow.com/a/15014759)
		close: function(event, ui) {
			ui.tooltip.hover(
					function () {
						$(this).stop(true).fadeTo(400, 1); 
						//.fadeIn("slow"); // doesn't work because of stop()
					},
					function () {
						$(this).fadeOut("400", function(){ $(this).remove(); })
					}
			);
		},
		content: function() {
			var experimentId = $(this).attr("experiment-id");
			var documentId = $(this).attr("document-id");
			var componentId = $(this).attr("component-id");
			var spanId = $(this).attr("span-id");
			var mention = experimentToDocumentMap1[experimentId][documentId][componentId][spanId];
			var html = $("<div>");
			if (mention[keyNameDisambiguated]) {
				//TODO Why don't they have an assignment?
				//var url = mention["assignment"]
				var url = mention[keyNamePossibleAssignments][0][keyNameAssignment];
				html.append("<p><a href='" + url + "'>" + url + "</p>");
			} else {
				$.each(mention[keyNamePossibleAssignments], function(index, assignment) {
					var url = assignment[keyNameAssignment];
					html.append("<p><a href='" + url + "'>" + url + "</p>");
				});
			}
			return html;
		}
	});

	// Button for downloading the JSON of this experiment result
	$("button.json-download").on("click", function(e) {
		var experimentId = $(this).val();
		var url = "resultjson?id=" + experimentId;
		var win = window.open(url, '_blank');
	});

	// Persistent URL for this experiment result
	var id = $("#result").attr("data-id");
	var baseUrl = window.location.href.split('?')[0];
	var url = baseUrl + "?id=" + id;
	$("#result-link").attr("href", url).text(url);
}



function buildStandardLinkerConfigHtml(linkerIndex) {
	var configHtml = $([
		'<div class="card-body" style="padding-right: 2cm;">',
		'	<div style="position: absolute; top: 10px; right: 10px;">',
		'		<button type="button" class="btn btn-danger remove-pipeline" aria-label="Remove">',
		'			<svg class="bi" width="20" height="20" fill="currentColor"><use xlink:href="fonts/bootstrap-icons.svg#x-lg"/></svg>',
		'		</button>',
		'	</div>',
		'	<h5 class="card-title">' + linkerIndex + ': Standard Linker</h5>',
		'	<div class="card-text form-group row">',
		'		<div class="col-md-12">',
		'			<select class="dropdown-linker" name="linker">',
		'			</select>',
		'		</div>',
		'	</div>',
		'   <div class="form-group" id="customStandardLinker" style="display: none;">',
		'		<input type="text" class="form-control" id="customStandardLinkerIP" placeholder="Enter IP address">',
		'	</div>',
		'	<div class="form-group error-message" style="display: none; text-align: left;">',
		'		<div class="alert alert-danger"></div>',
		'	</div>',
		'</div>'
	].join("\n"));
	
	return configHtml;
}


function buildSimplePipelineConfigHtml(linkerIndex) {
	var configHtml = $([
		'<div class="card-body" style="padding-right: 2cm;">',
		'	<div style="position: absolute; top: 10px; right: 10px;">',
		'		<button type="button" class="btn btn-danger remove-pipeline" aria-label="Remove">',
		'			<svg class="bi" width="20" height="20" fill="currentColor"><use xlink:href="fonts/bootstrap-icons.svg#x-lg"/></svg>',
		'		</button>',
		'	</div>',
		'	<h5 class="card-title">' + linkerIndex + ': Simple Pipeline</h5>',
		'	<div class="card-text form-group row">',
		'		<label class="col-md-4 control-label" for="linker-md">Mention Detection</label>',
		'		<div class="col-md-8">',
		'			<select class="dropdown-linker-md">',
		'			</select>',
		'		</div>',
		'	</div>',
		'	<div class="form-group row">',
		'		<label class="col-md-4 control-label" for="linker-cg-ed">Candidate Generation + Entity Disambiguation</label>',
		'		<div class="col-md-8">',
		'			<select class="dropdown-linker-cg-ed">',
		'			</select>',
		'		</div>',
		'	</div>',
		'	<div class="form-group error-message" style="display: none; text-align: left;">',
		'		<div class="alert alert-danger"></div>',
		'	</div>',
		'</div>'
	].join("\n"));

	return configHtml;
}


function buildComplexPipelineConfigHtml(linkerIndex) {
	var configHtml = $([
		'<div class="card-body">',
		'	<div style="position: absolute; top: 10px; right: 10px;">',
		'		<button type="button" class="btn btn-default clone-pipeline" aria-label="Clone">',
		'			<svg class="bi" width="20" height="20" fill="currentColor"><use xlink:href="fonts/bootstrap-icons.svg#back"/></svg>',
		'		</button>',
		'		<button type="button" class="btn btn-danger remove-pipeline" aria-label="Remove">',
		'			<svg class="bi" width="20" height="20" fill="currentColor"><use xlink:href="fonts/bootstrap-icons.svg#x-lg"/></svg>',
		'		</button>',
		'	</div>',
		'	<h5 class="card-title">' + linkerIndex + ': Complex Pipeline</h5>',
		'	<div class="form-group row">',
		'		<div id="graphView" class="col-8">',
		'			<div id="cy' + linkerIndex + '" class="my-cy"></div>',
		'		</div>',
		'		<div class="col-4">',
		'			<div id="detailsView" style="display: none; text-align: left">',
		'				<h5>Component</h5>',
		'				<div class="form-group">',
		'					<p>ID</p>',
		'				</div>',
		'				<div class="form-group">',
		'					<select class="dropdown-component-value"></select><br>',
		'				</div>',
		'				<div class="form-group" id="customComponentInput" style="display: none;">',
		'					<input type="text" class="form-control" id="customComponentIP" placeholder="Enter IP address">',
		'				</div>',
		'				<div class="form-group">',
		'					<label>Sources</label>',
		'					<select class="dropdown-component-dependencies" multiple="multiple"></select><br>',
		'				</div>',
		'				<div class="form-group">',
		'					<label>Targets</label>',
		'					<select class="dropdown-component-targets" multiple="multiple"></select>',
		'				</div>',
		'				<div class="form-group" style="text-align: center">',
		'					<input type="button" class="btn btn-danger btn-delete-component" value="Delete">',
		'				</div>',
		'				<hr>',
		'			</div>',
		'			<div class="dropdown dropdown-add-component">',
		'				<button class="btn dropdown-toggle" type="button"',
		'					id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true"',
		'					aria-expanded="false">Add component</button>',
		'				<div class="dropdown-menu" aria-labelledby="dropdownMenuButton"></div>',
		'			</div>',
		'		</div>',
		'	</div>',
		'	<div class="form-group error-message" style="display: none; text-align: left;">',
		'		<div class="alert alert-danger"></div>',
		'	</div>',
		'</div>'
		].join("\n"));
	
	return configHtml;
}

