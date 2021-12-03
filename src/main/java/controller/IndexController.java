package controller;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.json.simple.JSONObject;
import org.json.simple.parser.ParseException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import com.fasterxml.jackson.core.JsonProcessingException;

import dataset.DatasetStore;
import experiment.Experiment;
import experiment.ExperimentBuilder;
import experiment.ExperimentSettings;
import experiment.ExperimentStore;
import experiment.Experimenter;
import structure.config.constants.EnumPipelineType;

@Controller
public class IndexController {

	/**
	 * Counts the number of experiments to assign IDs to the experiment results.
	 */
	private ExperimentStore experimentStore = new ExperimentStore();

	/**
	 * Displays index.jsp.
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String home(Locale locale, Model model) {
		System.out.println("Home Page Requested, locale = " + locale);
		return "index";
	}

	/**
	 * Main method for executing experiments. Calls the experiment builder, which
	 * again calls the pipeline builder.
	 */
	@RequestMapping("/execute")
	public @ResponseBody Experiment execute(@RequestParam(value = "experimentData") String experimentData) {
		System.out.println("Got request with experimentData=" + experimentData);
		final Experiment experiment = new ExperimentBuilder(experimentData).buildExperiment();
		final Experiment result = new Experimenter(experiment).run();
		return result;
	}

	/**
	 * Handles GET requests for experiment results. Returned is not directly the
	 * result, but only the ID of the experiment. The JavaScript of the HTML page
	 * requests the result as JSON and builds the HTML to display it. If no
	 * experiment ID is provided in the request, the result of the last experiment
	 * is returned.
	 * 
	 * @param id ID of the experiment (optional)
	 * @return HTML page to display an experiment result
	 */
	@RequestMapping(value = "/result", method = RequestMethod.GET)
	public @ResponseBody ModelAndView result(@RequestParam(value = "id", required = false) String id) {
		if (id == null) {
			int lastExperimentId = experimentStore.getLastExperimentId();
			System.out.println("Show last experiment result (ID " + lastExperimentId + ")");
			return new ModelAndView("result", "experimentId", lastExperimentId);
		} else {
			System.out.println("Show experiment result with ID " + id);
			return new ModelAndView("result", "experimentId", id);
		}
	}

	/**
	 * Handles POST requests for experiment results. Returns the result as JSON. Is
	 * called by the JavaScript of result.jsp.
	 * 
	 * @param id ID of the experiment
	 * @return Experiment result as JSON
	 */
	@RequestMapping("/result")
	public @ResponseBody JSONObject getResult(@RequestParam(value = "id", required = true) String id) {
		return getResultJson(id);
	}

	/**
	 * Handles GET requests for experiment results. Returns the result as JSON. Is
	 * called when clicking on the button "Download JSON". This method was required
	 * because calling just getResult() (/result) with POST, it was not possible to
	 * display the result on a blank new tab (without own URL). Another solution
	 * would be content negotiation and the reuse of result() (/result) with GET.
	 * 
	 * @param id ID of the experiment
	 * @return Experiment result as JSON
	 * @throws JsonProcessingException
	 */
	@RequestMapping(value = "/resultjson", method = RequestMethod.GET)
	public @ResponseBody JSONObject resultJson(@RequestParam(value = "id", required = false) String id) {
		if (id == null) {
			int lastExperimentId = experimentStore.getLastExperimentId();
			System.out.println("Return JSON of last experiment result (ID " + lastExperimentId + ")");
			return getResultJson(String.valueOf(lastExperimentId));
		} else {
			System.out.println("Return JSON of experiment result with ID " + id);
			return getResultJson(String.valueOf(id));
		}
	}

	/**
	 * Parses the given experiment ID and asks the ExperimentStore for the
	 * experiment result.
	 * 
	 * @param id ID of experiment
	 * @return List of experiment results
	 */
	private JSONObject getResultJson(String id) {
		ExperimentStore experimentStore = new ExperimentStore();
		JSONObject results = new JSONObject();
		int idInt;

		// Parse ID
		try {
			idInt = Integer.parseInt(id);
			System.out.println("JSON result requested for experiment " + id);
		} catch (NumberFormatException ex) {
			System.out.println("Non-integer experiment task ID: " + id);
			results = experimentStore.createErrorResult(0, "Non-integer experiment task ID: " + id);
			ex.printStackTrace();
			return results;
		}

		// Load experiment
		try {
			results = experimentStore.readExperimentResultAsJson(idInt);
		} catch (FileNotFoundException e) {
			results = experimentStore.createErrorResult(idInt, "Experiment with ID '" + id + "' doesn't exist");
			e.printStackTrace();
		} catch (IOException | ParseException e) {
			results = experimentStore.createErrorResult(idInt, e.getMessage());
			e.printStackTrace();
		}

		return results;
	}

	/**
	 * Returns a list of available datasets.
	 */
	@RequestMapping("/datasets")
	public @ResponseBody List<String> getDatasets() {
		final List<String> datasets = new DatasetStore().getDatasets();
		Collections.sort(datasets);
		return datasets;
	}

	/**
	 * Returns a list of available linkers.
	 * 
	 * @param experimentTypeString
	 * @return
	 */
	@RequestMapping("/linkers")
	public @ResponseBody List<String> getLinkers(
			@RequestParam(value = "pipelineType", required = false) String experimentTypeString) {
		EnumPipelineType pipelineType = EnumPipelineType.FULL; // default
		try {
			pipelineType = EnumPipelineType.getByName(experimentTypeString);
		} catch (IllegalArgumentException e) {
			System.out.println(
					"Warning: Invalid task type '" + experimentTypeString + "', return linkers for default: 'FULL'");
		}
		final List<String> linkers = ExperimentSettings.getLinkerForExperimentType(pipelineType);
		Collections.sort(linkers);
		return linkers;
	}

	/**
	 * Returns a list of available inter-component processors or possible values for
	 * a specific inter-component processor type.
	 * 
	 * @param icpTypeString
	 * @return list of items
	 */
	@RequestMapping("/icps")
	public @ResponseBody List<String> getICPs(@RequestParam(value = "icpType", required = false) String icpTypeString) {
		// Grab values from Agnos and populate front-end options with them!
		final List<String> icps = new ArrayList<>();
		if (icpTypeString.equals("combiner")) {
			// Collections.addAll(icps, "Intersection", "Union");
			icps.addAll(ExperimentSettings.getCombinerNames());
		} else if (icpTypeString.equals("splitter")) {
			icps.addAll(ExperimentSettings.getSplitterNames());
			// Collections.addAll(icps, "Copy");
		} else if (icpTypeString.equals("filter")) {
			icps.addAll(ExperimentSettings.getFilterNames());
			// Collections.addAll(icps);
		} else if (icpTypeString.equals("translator")) {
			icps.addAll(ExperimentSettings.getTranslatorNames());
			// Collections.addAll(icps, "DBpedia2Wikidata");
		} else {
			// didn't define any/defined an incorrect one, so output all possibilities
			icps.addAll(ExperimentSettings.getCombinerNames());
			icps.addAll(ExperimentSettings.getSplitterNames());
			icps.addAll(ExperimentSettings.getFilterNames());
			icps.addAll(ExperimentSettings.getTranslatorNames());
		}
		Collections.sort(icps);
		return icps;
	}

}
