if (typeof console === undefined) console = {log:function(){}}

var ytPlayer,
    vPlayer,
    vidIndex = 0,
    isOn = false,
    videos = [],
    ytPlayerContainer = $('#yt-player-contain').hide(),
	vPlayerContainer = $('#v-player-contain').hide();

function onYouTubeIframeAPIReady() {
	console.log('onYouTubeIframeAPIReady');
    ytPlayer = new YT.Player('yt-player-contain', {
        height: '100%',
        width: '100%',
        playerVars: {
            controls:0,
            showinfo:0
        },
        events: {
            'onReady': onYTPlayerReady,
            'onStateChange': onYTPlayerStateChange
        }
    });
}

function startChannel() {
	console.log('startChannel');
	isOn = true;
    $('#playlist-view').addClass('hide');
    $('#channel-view').removeClass('hide');
    playVideo();
}

function stopChannel(startIndex) {
    isOn = false;
    $('#playlist-view').removeClass('hide');
    $('#channel-view').addClass('hide');
}

function playVideo() {
	// get video data
    var videoData = videos[vidIndex];
    var service = videoData.service;
    var id = videoData.id;
    var title = videoData.title;

    console.log('playVideo '+service+' '+id);

    // show now playing
    // if (typeof title === undefined) {
    //   $('#now-playing').hide();
    // } else {
    //   $('#now-playing').show().find('#now-playing-title').text(decodeURIComponent(title));
    // }

    // update player with new video
    if (service === 'youtube') {
      
		// hide vimeo
		vPlayerContainer.hide().empty();

		// show/load/play video
		console.log('service = youtube');
		$('#yt-player-contain').show();
		if (ytPlayer.loadVideoById) {
			ytPlayer.loadVideoById(id);
		}
    }
    else if (service === 'vimeo') {
    	console.log('service = vimeo');
		// hide youtube
		$('#yt-player-contain').hide();

		// show/load/play vimeo
		vPlayerContainer.show().html('<iframe id="v-player" src="http://player.vimeo.com/video/'+id+'?api=1&player_id=v-player&autoplay=1&title=0&byline=0&portrait=0&api=1" width="100%" height="100%" frameborder="0" webkitallowfullscreen allowfullscreen></iframe>');

		vPlayer = document.getElementById('v-player');
		var isPlaying = false;
		$f(vPlayer).addEvent('ready', function(playerID) {
			console.log('vimeo event ready')
			vPlayer = $f(playerID);
			vPlayer.addEvent('playProgress', function(playerID) {
				if (!isPlaying) {
					console.log('vimeo playProgress set isPlaying = true');
					isPlaying = true;
				}
				
			});
			vPlayer.addEvent('finish', onVideoFinish);
		});

		
		setTimeout(function() {
			if (!isPlaying && videos[vidIndex].service === 'vimeo') {
				onPlayError('Could not play video, Vimeo ID:'+id);
			}
		}, 10000);

    }
    // if service not supported error
    else {
		onPlayError('Video service "'+service+'" not recognized');
    }
}

function onPlayError(msg) {
	console.log('onPlayError');
    // throw error and try next video
    onVideoFinish();
    throw new Error(msg);
}

function onYouTubeIframeAPIReady() {
	console.log('onYouTubeIframeAPIReady');
    ytPlayer = new YT.Player('yt-player-contain', {
        height: '100%',
        width: '100%',
        playerVars: {
            controls:0,
            showinfo:0
        },
        events: {
            'onReady': onYTPlayerReady,
            'onStateChange': onYTPlayerStateChange
        }
    });
}

function onYTPlayerReady(e) {
	console.log('onYTPlayerReady');
    if (isOn && videos[vidIndex].service === 'youtube') {
    	playVideo();
    }
}

function onYTPlayerStateChange(e) {
    // play next video when video ends
    if (e.data === YT.PlayerState.ENDED) {
      onVideoFinish();
    }
}

function onVideoFinish() {
	console.log('onVideoFinish');
    vidIndex++;
    playVideo();
}

function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
    }
    else {
        element.attachEvent('on' + eventName, callback);
    }
}

$(function() {

    // Quad ease in/out
    var scrollEase = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    };

    // randomly sort video order
    var $videoContainers = $('.video-container');
    $videoContainers.sort(function(a,b){
        var temp = parseInt(Math.random()*10, 10);
        var isOddOrEven = temp%2;
        var isPosOrNeg = temp>5 ? 1 : -1;
        return( isOddOrEven*isPosOrNeg );
    });
    $('.video-container').parent().append($videoContainers);


    // create a video data array and playlist from the dom
    var navList = '<ul class="playlist clearfix">';
    $('.video-container').each(function() {
        videoData = {};
        videoData.service = ($(this).attr('data-youtube') === undefined) ? 'vimeo' : 'youtube';
        videoData.id = $(this).attr('data-'+videoData.service);
        videoData.title = $(this).find('.video-title').text();
        videoData.desc = $(this).find('.video-desc').html();
        videoData.links = [];
        $(this).find('.video-links li').each(function() {
            videoData.links.push( $(this).html() );
        });
        videos.push(videoData);
        navList += '<li class="playlist-item"><a href="#" class="btn btn-playlist animate" data-vid="'+videoData.service+':'+videoData.id+'">'+videoData.title+'</a></li>';
    });
    navList += '</ul>';
    $($(navList)).insertAfter($('header')).equalize('outerHeight');

    // playlist page navigtation
    $('.playlist').on('click','.btn-playlist',function(e) {
        e.preventDefault();
        $listItem = $(this).parent();
        $('html,body').animate({
            scrollTop: $('.video-container').eq($listItem.index()).offset().top-50},
            800,
            scrollEase);
    });

    // watch channel
    $('#main').on('click','.btn-play',function(e) {
        e.preventDefault();
        $('#channel-view').removeClass('hide');
        vidIndex = $(this).parent().index();
        startChannel();
    });
    $('#btn-play-main').on('click',function(e) {
        e.preventDefault();
        vidIndex = 0;
        startChannel();
    });

    // go to next video on right arrow key down
    document.onkeydown = function(e) {
        e = e || window.event;
        e.preventDefault();
        if (isOn && e.keyCode === 39) {
            vidIndex++;
			playVideo();
        }
    };
});