var CameraView = CameraViewBase.extend({
  el: '#camera-view',
  template: _.template( $("#camera-watch-page-template").html() ),
  serverUrl: null,
  events: {
	   'hide':'onHide',
     'show':'onShow',
     'click .buttons .columns button': 'onCameraBtnClicked',
     "change input[name='camera-mode']": 'cameraModeChanged'
  },
  manageVideoStreamingEvent: function(value)
  {
    this.onHide();//re-used function
    this.videoStreamingError = value.message;
    this.render();
  },
  onCameraBtnClicked: function(e)
  {
    e.preventDefault();

    $('.icon-3d-object').hide();
    this.$('.loading-button').addClass('loading');

    this.buttonEvent()
      .fail(function(){
        $('.icon-3d-object').show();
        noty({text: "Camera error.", timeout: 3000});
      })
      .always(_.bind(function(){
        this.$('.loading-button').removeClass('loading');
      }, this))
  },
  getPhotoContainer: function()
  {
    return this.$('.camera-image');
  },
  getVideoContainer: function()
  {
    return this.$('#video-stream');
  }
});