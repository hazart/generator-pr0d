/*jshint latedef:false */
var path = require('path'),
	util = require('util'),
	grunt = require('grunt'),
	ScriptBase = require('../script-base.js'),
	generatorUtil = require('../util.js'),
	ModelGenerator = require('../model/index.js');

grunt.util._.mixin( require('underscore.inflections') );

module.exports = Generator;

function Generator() {
	ScriptBase.apply(this, arguments);
}

util.inherits(Generator, ScriptBase);

Generator.prototype.askFor = function askFor (argument) {
	var cb = this.async(),
		self = this;

	// a bit verbose prompt configuration, maybe we can improve that
	// demonstration purpose. Also, probably better to have this in other generator, whose responsability is to ask
	// and fetch all realated bootstrap stuff, that we hook from this generator.
	var prompts = [{
		name: 'model',
		message: 'Would you like to create associate model (' + this.name + ')?',
		default: 'y/N'
	},
	{	name: 'tpl',
		message: 'Would you like to create associate template (' + this.name + ')?',
		default: 'Y/n'
	},
	{
		name: 'styl',
		message: 'Would you like to create associate stylus file (' + this.name + ')?',
		default: 'Y/n'
	},
	{
		name: 'module',
		message: 'Would you like to create associate require module (' + this.name + ')?',
		default: 'Y/n'
	}];
  
	this.prompt(prompts, function(e, props) {
		if(e) { return self.emit('error', e); }
		
		// manually deal with the response, get back and store the results.
		// We change a bit this way of doing to automatically do this in the self.prompt() method.
		self.model = false;
		if( props.model != "y/N" ) {
			if( props.model == "y" ) {
				self.model = self.name;
			} else if( !(/n/i).test(props.model) ) {
				self.model = props.model;
			}
		}
		
		self.tpl = self.name;
		if( props.tpl != "Y/n" ) {
			if( props.tpl == "n" ) {
				self.tpl = false;
			} else {
				self.tpl = props.tpl;
			}
		}
		
		self.styl = self.name;
		if( props.styl != "Y/n" ) {
			if( props.styl == "n" ) {
				self.styl = false;
			} else {
				self.styl = props.styl;
			}
		}

		self.module = self.name;
		if( props.module != "Y/n" ) {
			if( props.module == "n" ) {
				self.module = false;
			} else {
				self.module = props.module;
			}
		}
		
		// we're done, go through next step
		cb();
	});
};

Generator.prototype.createViewFiles = function createCollectionFiles() {
	a = this.name.split("/");
	if (a.length > 1) {
		n = a.pop();
		this.fileName = n;
		this.folder = a.join('/');
	} else {
		this.fileName = this.folder = this.name;
	}

	this.template('view.coffee', 'src/views/' + this.folder + "/" + this.fileName + '_view.coffee');
	
	if( this.model ) {
		mg = new ModelGenerator(this.options);
		mg.name = this.fileName;
		mg.createModelFiles();
	}
	
	if( this.styl ) {
		this.template('view.styl', path.join('src/views', this.folder, this.fileName + '.styl'));
	}
	
	if( this.tpl ) {
		this.template('view.jade', path.join('src/views', this.folder, this.fileName + '.jade'));
	}

	if( this.module ) {
		var file = 'Gruntfile.coffee';
		var body = grunt.file.read(file);

		body = generatorUtil.rewrite({
			needle: '# view modules',
			haystack: body,
			splicable: [
				'						{ name: \'views/'+this.folder+'/'+this.fileName+'_view\', exclude: [\'config\', \'app\', \'vendors\'] }' 
			]
		});
		grunt.file.write(file, body);
	}
};
