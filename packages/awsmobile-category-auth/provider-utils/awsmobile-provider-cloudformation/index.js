
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var getWhen = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-when-function').getWhen;
var getProjectDetails = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-project-details').getProjectDetails;
var getDefaults = require('../get-defaults')
var servicedMetadata;
var supportedServices;
var cfnFilename;

function serviceWalkthrough(service, context) {

	const defaults = getDefaults.getAllDefaults(getProjectDetails());

	console.log(defaults)

	let inputs = serviceMetadata.inputs;
	let questions = [];
	for(let i = 0; i < inputs.length; i++) {
		// Can have a cool question builder function here based on input json - will iterate on this
		// Can also have some validations here based on the input json
		//Uncool implementation here 

		let question = {
			name: inputs[i].key,
			message: inputs[i].question,
			when: getWhen(inputs[i]),
			default: defaults[inputs[i].key]
		}

		if(inputs[i].type && inputs[i].type == "list") {
			question = Object.assign({
				type: 'list',
				choices: inputs[i].options
			}, question);
		} else if (inputs[i].type && inputs[i].type === 'multiselect') {
			question = Object.assign({
				type: 'checkbox',
				choices: inputs[i].options
			}, question)
		} else {
			question = Object.assign({
				type: 'input',
			}, question);
		}
		questions.push(question);
	}

	return inquirer.prompt(questions);
}


function copyCfnTemplate(context, category, options) {

	const {awsmobile} = context;
	let targetDir = awsmobile.pathManager.getBackendDirPath();
	let pluginDir = __dirname;

	console.log(cfnFilename)

	const copyJobs = [
		{
			dir: pluginDir, 
			template: 'cloudformation-templates/' + cfnFilename, 
			target: targetDir + '/' + category + '/' + options.resourceName + '/' +  options.resourceName + '-' + 'cloudformation-template.yml'
		}
	];



	// copy over the files
  	return context.awsmobile.copyBatch(context, copyJobs, options);
}

function addResource(context, category, service, configure) {
	
	let answers = {};

	serviceMetadata = JSON.parse(fs.readFileSync(__dirname + `/../supported-services${configure}.json`))[service];
	supportedServices = Object.keys(serviceMetadata);
	cfnFilename = serviceMetadata.cfnFilename;

	return serviceWalkthrough(service, context)
		.then((result) => {


			if (configure) {
				result.authSelections.forEach((i) => {
					answers = Object.assign(answers, getDefaults.functionMap[i](result.resourceName))
				})
			}

			answers = Object.assign(answers, result)

			// console.log(answers)

			copyCfnTemplate(context, category, answers)
		})
		.then(() => {
			return answers.resourceName
		});
}

function createResource(context, category, resourceName) {
	let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
	let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
	let files = fs.readdirSync(resourceDir);

	// Fetch all the Cloudformation templates (can be json or yml)

	let cfnFiles = files.filter(function(file){
    	return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
	});

	return new CloudFormation(context)
		.then((cfnItem) => {
			return cfnItem.createResources(resourceDir, cfnFiles, category, resourceName);
		});
}

function deleteResource(context, category, resourceName) {
	let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
	let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
	let files = fs.readdirSync(resourceDir);

	// Fetch all the Cloudformation templates (can be json or yml)

	let cfnFiles = files.filter(function(file){
    	return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
	});

	return new CloudFormation(context)
		.then((cfnItem) => {
			return cfnItem.deleteResources(resourceDir, cfnFiles, category, resourceName);
		});
}


module.exports = {addResource, createResource, deleteResource}; 