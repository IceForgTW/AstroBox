/*
 *  (c) Daniel Arroyo. 3DaGoGo, Inc. (daniel@3dagogo.com)
 *
 *  Distributed under the GNU Affero General Public License http://www.gnu.org/licenses/agpl.html
 */

 // work around a stupid iOS6 bug where ajax requests get cached and only work once, as described at
// http://stackoverflow.com/questions/12506897/is-safari-on-ios-6-caching-ajax-results
$.ajaxSetup({
    type: 'POST',
    headers: { "cache-control": "no-cache" }
});

// send the current UI API key with any request
$.ajaxSetup({
    headers: {"X-Api-Key": UI_API_KEY}
});

var StepView = Backbone.View.extend({
	setup_view: null,
	events: {
		"submit form": "_onSubmit"
	},
	initialize: function(params) 
	{
		this.setup_view = params.setup_view;
	},
	onHide: function() {},
	onShow: function() {},
	onSubmit: function(data) {},
	_onSubmit: function(e)
	{
		e.preventDefault();
		var serializedData = $(e.currentTarget).serializeArray();
		var data = {};
		_.each(serializedData, function(item) {
			data[item.name] = item.value;
		});

		this.onSubmit(data);
	}
});

/**************
* Welcome
***************/

var StepWelcome = StepView.extend({
	el: "#step-welcome"
});

/**************
* Name
***************/

var StepName = StepView.extend({
	el: "#step-name",
	default: 'astrobox',
	constructor: function()
	{
		this.events["keyup input"] = "onNameChanged";
		this.events["click .submit-action"] = "onSubmitClicked";
		StepView.apply(this, arguments);
	},
	initialize: function()
	{
		this.$el.find('input#astrobox-name').val(this.default);
		this.$el.find('.hotspot-name').text(this.default);
		this.$el.find('.astrobox-url').text(this.default);		
	},
	onShow: function()
	{
		this.$el.find('input').focus();
	},
	onNameChanged: function(e) 
	{
		var name = $(e.target).val();

		if (/^[A-Za-z0-9\-_]+$/.test(name)) {
			this.$el.find('.hotspot-name').text(name);
			this.$el.find('.astrobox-url').text(name);
		} else if (name) {
			$(e.target).val( $(e.target).val().slice(0, -1) );
		} else {
			this.$el.find('.hotspot-name').text('');
			this.$el.find('.astrobox-url').text('');
		}
	},
	onSubmit: function(data)
	{
		if (data.name != this.default) {
			this.$el.find('.loading-button').addClass('loading');
			$.ajax({
				url: API_BASEURL + 'setup/name',
				method: 'post',
				data: data,
				success: _.bind(function() {
					location.href = this.$el.find('.submit-action').attr('href');
				}, this),
				error: function(xhr) {
					if (xhr.status == 400) {
						message = xhr.responseText;
					} else {
						message = "There was an error saving your name";
					}
					noty({text: message, timeout: 3000});
				},
				complete: _.bind(function() {
					this.$el.find('.loading-button').removeClass('loading');
				}, this)
			});
		} else {
			location.href = this.$el.find('.submit-action').attr('href');
		}
	},
	onSubmitClicked: function()
	{
		this.$el.find('form').submit();
		return false;
	}
});

/**************
* Internet
***************/

var StepInternet = StepView.extend({
	el: "#step-internet",
	onShow: function()
	{
		this.$el.addClass('checking');
		$.ajax({
			url: API_BASEURL + 'setup/internet',
			method: 'GET',
			success: _.bind(function() {
				this.$el.addClass('success');
			}, this),
			error: _.bind(function() {
				this.$el.addClass('settings');
			}, this),
			complete: _.bind(function() {
				this.$el.removeClass('checking');
			}, this)
		})
	}
});

/**************
* Astroprint
***************/

var StepAstroprint = StepView.extend({
	el: "#step-astroprint",
	onShow: function()
	{
		this.$el.find('#email').focus();
	},
});

/**************
* Printer
***************/

var StepPrinter = StepView.extend({
	el: "#step-printer"
});

/**************
* Share
***************/

var StepShare = StepView.extend({
	el: "#step-share",
	constructor: function() 
	{
	    this.events["click .share-button.facebook"] = "onFacebookClicked";
	    this.events["click .share-button.twitter"] = "onTwitterClicked";
	    this.events["click .setup-done"] = "onSetupDone";
	    StepView.apply(this, arguments);
  	},
	onFacebookClicked: function(e)
	{
		e.preventDefault();
		window.open('https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.astroprint.com','facebook','width=740,height=280,left=300,top=300');
		this.$el.find('a.button.setup-done').show();
		this.$el.find('a.setup-done').addClass('hide');
	},
	onTwitterClicked: function(e)
	{
		e.preventDefault();
		window.open('https://twitter.com/share?url=http%3A%2F%2Fwww.astroprint.com&text=I+just+setup+my+AstroBox+and+%40AstroPrint3D+for+easy+%233DPrinting.+Get+yours+at','twitter','width=740,height=280,left=300,top=300');
		this.$el.find('a.button.setup-done').show();
		this.$el.find('a.setup-done').addClass('hide');
	},
	onSetupDone: function(e)
	{
		e.preventDefault();
		location.href = "/";
	}
});

var SetupView = Backbone.View.extend({
	steps: null,
	current_step: 'welcome',
	router: null,
	initialize: function()
	{
		this.steps = {
			'welcome': new StepWelcome({'setup_view': this}),
			'name': new StepName({'setup_view': this}),
			'internet': new StepInternet({'setup_view': this}),
			'astroprint': new StepAstroprint({'setup_view': this}),
			'printer': new StepPrinter({'setup_view': this}),
			'share': new StepShare({'setup_view': this})
		};

		this.router = new SetupRouter({'setup_view': this});
	},
	setStep: function(step)
	{
		if (this.steps[step] != undefined) {
			this.steps[this.current_step].$el.addClass('hide');
			this.steps[this.current_step].onHide();
			this.steps[step].$el.removeClass('hide');
			this.steps[step].onShow();
			this.current_step = step;
		}
	}
});

var SetupRouter = Backbone.Router.extend({
	setup_view: null,
	routes: {
		"": "setStep",
		":step": "setStep"
	},
	initialize: function(params)
	{
		this.setup_view = params.setup_view;
	},
	setStep: function(step) 
	{
		this.setup_view.setStep(step || 'welcome');
	}
});

var setup_view = new SetupView();

Backbone.history.start();