<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html ng-app="pipelineConfig">
<head>
<meta charset="UTF-8">
<title>Combining Linking Techniques (CLiT)</title>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>

<!-- Bootstrap -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="css/bootstrap-multiselect.css">
<script src="js/bootstrap-multiselect.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">

<!-- Cytoscape -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.17.1/cytoscape.min.js"></script>
<script src="https://unpkg.com/klayjs@0.4.1/klay.js"></script>
<script src="js/cytoscape-klay.js"></script>

<!-- Mousetrap -->
<script src="js/mousetrap.min.js"></script>


<link rel="stylesheet" href="css/style.css">
<script src="js/pipelines.js"></script>
<script src="js/texts.js"></script>
<script src="js/script.js"></script>
</head>

<body class="container">

	<nav class="navbar navbar-default" role="navigation">
		<div class="container-fluid">
		</div>
	</nav>

	<h1>CLiT Experiment Configuration</h1>

	<form>
		<fieldset>

			<legend>New Experiment</legend>

			<div class="form-group row" id="textFieldDiv">
				<div class="col-md-4">
					<label class="control-label">Input</label><br />
				</div>
				<div class="col-md-8">
					<ul class="nav nav-tabs" id="myTab" role="tablist">
						<li class="nav-item" role="presentation">
							<a class="nav-link active" id="input-text-tab" data-toggle="tab" href="#input-text" role="tab" 
								aria-controls="input-text" aria-selected="true">Text</a>
						</li>
						<li class="nav-item" role="presentation">
							<a class="nav-link" id="input-dataset-tab" data-toggle="tab" href="#input-dataset" role="tab"
								aria-controls="input-dataset" aria-selected="false">Dataset</a>
						</li>
						<li class="nav-item" role="presentation">
							<a class="nav-link" id="input-file-tab" data-toggle="tab" href="#input-file" role="tab"
								aria-controls="input-file" aria-selected="false">Upload File</a>
						</li>
					</ul>
					<div class="tab-content" id="myTabContent">
						<div class="tab-pane active" id="input-text" role="tabpanel" aria-labelledby="input-text-tab">
							<textarea class="form-control" id="inputText">Napoleon was the emperor of the First French Empire.</textarea>
							<button class="btn btn-outline-dark btn-sm me-md-2 dropdown-toggle" type="button"
								data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
								style="margin-top: 10px;">Load example</button>
							<div id="exampleTextDropdown" class="dropdown-menu"></div>
						</div>
						<div class="tab-pane" id="input-dataset" role="tabpanel" aria-labelledby="input-dataset-tab">
							<select id="datasetDropdown" multiple="multiple"></select>
						</div>
						<div class="tab-pane" id="input-file" role="tabpanel" aria-labelledby="input-file-tab">
							<div class="col-md-12">
								<label class="custom-file-label" for="inputFileUpload">Choose file</label>
								<input type="file" class="custom-file-input" id="inputFileUpload" />
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- 
			<div class="form-group row">
				<label class="col-md-4 control-label" for="type">Experiment Type</label>
				<div class="col-md-4">
					<select id="experimentType">
						<option value="A2KB">A2KB</option>
						<option value="C2KB">C2KB</option>
						<option value="D2KB">D2KB</option>
						<option value="ERec">Entity Recognition</option>
						<option value="ETyping">Entity Typing</option>
						<option value="OKE_Task1">OKE Challenge 2015 - Task 1</option>
						<option value="OKE_Task2">OKE Challenge 2015 - Task 2</option>
						<option value="RT2KB">RT2KB</option>
						<option value="RE">RE</option>
						<option value="OKE2018Task4">OKE2018Task4</option>
					</select>
				</div>
			</div>
			
			<div class="form-group row">
				<label class="col-md-4 control-label" for="matching">Matching</label>
				<div class="col-md-4">
					<select id="matching">
						<option value="WEAK_ANNOTATION_MATCH" selected="selected">Weak annotation match</option>
						<option value="STRONG_ANNOTATION_MATCH">Strong annotation match</option>
					</select>
				</div>
			</div>
			-->

			<div class="row">
				<div class="col-md-12 col-md-offset-2">
					<hr>
				</div>
			</div>

			<div class="form-group row">
				<label class="col-md-12 control-label" for="linker">Linker</label>
			</div>
			<div class="form-group">
				<div id="linker"></div>
				<button id="addStandardLinker" class="btn btn-primary" type="button">Add Standard Linker</button>
				<button id="addSimplePipeline" class="btn btn-primary" type="button">Add Linker Pipeline</button>
				<div class="btn-group" role="group">
					<button id="addComplexPipeline" class="btn btn-primary" type="button">Add Complex Linker Pipeline</button>
					<div class="btn-group" role="group">
						<button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle"
							data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Add Example</button>
						<div id="examplePipelineDropdown" class="dropdown-menu" aria-labelledby="btnGroupDrop1">
						</div>
					</div>
				</div>
				<!--
				<button id="addComplexPipeline" class="btn btn-primary" type="button">Add Complex Linker Pipeline</button>
				<div class="btn-group">
					<button type="button" class="btn btn-success">Add Example Pipeline</button>
					<button type="button" class="btn btn-success dropdown-toggle dropdown-toggle-split"
						data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<span class="sr-only">Toggle Dropdown</span>
					</button>
					<div id="examplePipelineDropdown" class="dropdown-menu"></div>
				</div>
				-->
			</div>

			<!--
			<div class="row">
				<div class="col-md-8 col-md-offset-2">
					<hr>
				</div>
			</div>

			<div class="form-group row">
				<label class="col-md-4 control-label" for="knowledge-base">Knowledge Base</label>
				<div class="col-md-4">
					<select id="knowledgeBases" multiple="multiple">
						<option value="Wikipedia">Wikipedia</option>
						<option value="Wikidata">Wikidata</option>
						<option value="DBpedia">DBpedia</option>
						<option value="YAGO">YAGO</option>
					</select>
				</div>
			</div>
			-->

			<div class="row">
				<div class="col-md-12 col-md-offset-2">
					<hr>
				</div>
			</div>

			<div id="global-error-message" class="form-group" style="display: none; text-align: left;">
				<div class="alert alert-danger"></div>
			</div>

			<div class="form-group">
				<label class="col-md-4 control-label" for="submit"></label>
				<div id="submitField" class="col-md-8">
					<input type="button" id="submit" name="singlebutton" class="btn btn-primary" value="Run Experiment">
				</div>
			</div>
		</fieldset>
	</form>
	
	<pre id="result"></pre>
	
	<script type="text/javascript">
		$(document).ready(function() {
			setup();
		});
	</script>
	

</body>
</html>

